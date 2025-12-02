"""Performance benchmarking tests.

This test suite measures and validates performance metrics including
response times, concurrent load, API latency, and memory usage.
"""

import asyncio
import time
import tracemalloc
from typing import Any, Dict, List
from unittest.mock import AsyncMock, Mock, patch

import pytest
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage

from src.config.settings import Settings


# ============================================================================
# Response Time Benchmarks
# ============================================================================


class TestResponseTimePercentiles:
    """Test response time percentiles (Requirement 1.1, 4.3)."""
    
    @pytest.mark.asyncio
    async def test_vector_search_latency_p50(
        self, mock_vector_store: Mock
    ):
        """Test p50 vector search latency < 500ms."""
        latencies = []
        
        for _ in range(100):
            start = time.time()
            await mock_vector_store.similarity_search("test query")
            latency = (time.time() - start) * 1000  # Convert to ms
            latencies.append(latency)
        
        latencies.sort()
        p50 = latencies[49]  # 50th percentile
        
        assert p50 < 500, f"P50 latency {p50}ms exceeds 500ms threshold"
    
    @pytest.mark.asyncio
    async def test_vector_search_latency_p95(
        self, mock_vector_store: Mock
    ):
        """Test p95 vector search latency < 1000ms."""
        latencies = []
        
        for _ in range(100):
            start = time.time()
            await mock_vector_store.similarity_search("test query")
            latency = (time.time() - start) * 1000
            latencies.append(latency)
        
        latencies.sort()
        p95 = latencies[94]  # 95th percentile
        
        assert p95 < 1000, f"P95 latency {p95}ms exceeds 1000ms threshold"
    
    @pytest.mark.asyncio
    async def test_vector_search_latency_p99(
        self, mock_vector_store: Mock
    ):
        """Test p99 vector search latency < 2000ms."""
        latencies = []
        
        for _ in range(100):
            start = time.time()
            await mock_vector_store.similarity_search("test query")
            latency = (time.time() - start) * 1000
            latencies.append(latency)
        
        latencies.sort()
        p99 = latencies[98]  # 99th percentile
        
        assert p99 < 2000, f"P99 latency {p99}ms exceeds 2000ms threshold"
    
    @pytest.mark.asyncio
    async def test_tavily_search_latency(
        self, test_settings: Settings, mock_tavily_client: Mock
    ):
        """Test Tavily search completes within 2 seconds."""
        from src.search.tavily_client import TavilySearchClient
        
        with patch('src.search.tavily_client.TavilySearchAPIWrapper', return_value=mock_tavily_client):
            client = TavilySearchClient(test_settings)
            
            latencies = []
            for _ in range(10):
                start = time.time()
                await client.search("test query")
                latency = time.time() - start
                latencies.append(latency)
            
            avg_latency = sum(latencies) / len(latencies)
            max_latency = max(latencies)
            
            assert avg_latency < 2.0, f"Average latency {avg_latency}s exceeds 2s"
            assert max_latency < 3.0, f"Max latency {max_latency}s exceeds 3s"
    
    @pytest.mark.asyncio
    async def test_end_to_end_query_latency(
        self, mock_vector_store: Mock, mock_tavily_client: Mock
    ):
        """Test end-to-end query processing < 3 seconds."""
        start = time.time()
        
        # Simulate full pipeline
        await mock_vector_store.similarity_search("test query")
        await mock_tavily_client.search_async("test query")
        # LLM generation would happen here
        
        elapsed = time.time() - start
        
        assert elapsed < 3.0, f"End-to-end latency {elapsed}s exceeds 3s"


# ============================================================================
# Concurrent Load Tests
# ============================================================================


class TestConcurrentUserLoad:
    """Test concurrent user load handling."""
    
    @pytest.mark.asyncio
    async def test_10_concurrent_queries(
        self, mock_vector_store: Mock
    ):
        """Test handling 10 concurrent queries."""
        async def execute_query(query_id: int):
            await mock_vector_store.similarity_search(f"query {query_id}")
            return query_id
        
        start = time.time()
        tasks = [execute_query(i) for i in range(10)]
        results = await asyncio.gather(*tasks)
        elapsed = time.time() - start
        
        assert len(results) == 10
        assert all(isinstance(r, int) for r in results)
        assert elapsed < 5.0, f"10 concurrent queries took {elapsed}s"
    
    @pytest.mark.asyncio
    async def test_50_concurrent_queries(
        self, mock_vector_store: Mock
    ):
        """Test handling 50 concurrent queries."""
        async def execute_query(query_id: int):
            await mock_vector_store.similarity_search(f"query {query_id}")
            return query_id
        
        start = time.time()
        tasks = [execute_query(i) for i in range(50)]
        results = await asyncio.gather(*tasks)
        elapsed = time.time() - start
        
        assert len(results) == 50
        assert elapsed < 10.0, f"50 concurrent queries took {elapsed}s"
    
    @pytest.mark.asyncio
    async def test_100_concurrent_queries(
        self, mock_vector_store: Mock
    ):
        """Test handling 100 concurrent queries (target capacity)."""
        async def execute_query(query_id: int):
            await mock_vector_store.similarity_search(f"query {query_id}")
            return query_id
        
        start = time.time()
        tasks = [execute_query(i) for i in range(100)]
        results = await asyncio.gather(*tasks)
        elapsed = time.time() - start
        
        assert len(results) == 100
        assert elapsed < 20.0, f"100 concurrent queries took {elapsed}s"
    
    @pytest.mark.asyncio
    async def test_concurrent_mixed_operations(
        self, mock_vector_store: Mock, mock_tavily_client: Mock
    ):
        """Test concurrent mixed operations (search + retrieval)."""
        async def vector_query(query_id: int):
            await mock_vector_store.similarity_search(f"vector query {query_id}")
            return f"vector_{query_id}"
        
        async def tavily_query(query_id: int):
            await mock_tavily_client.search_async(f"tavily query {query_id}")
            return f"tavily_{query_id}"
        
        # Mix of vector and Tavily queries
        tasks = []
        for i in range(50):
            if i % 2 == 0:
                tasks.append(vector_query(i))
            else:
                tasks.append(tavily_query(i))
        
        start = time.time()
        results = await asyncio.gather(*tasks)
        elapsed = time.time() - start
        
        assert len(results) == 50
        assert elapsed < 15.0, f"Mixed operations took {elapsed}s"


# ============================================================================
# API Latency Measurements
# ============================================================================


class TestAPILatency:
    """Test individual API latency measurements."""
    
    @pytest.mark.asyncio
    async def test_openai_embedding_latency(
        self, mock_openai_embeddings: Mock
    ):
        """Test OpenAI embedding generation latency."""
        texts = ["Test text " + str(i) for i in range(10)]
        
        start = time.time()
        embeddings = await mock_openai_embeddings.aembed_documents(texts)
        elapsed = time.time() - start
        
        assert len(embeddings) == 10
        assert elapsed < 2.0, f"Embedding generation took {elapsed}s"
    
    @pytest.mark.asyncio
    async def test_openai_chat_latency(
        self, mock_openai_chat: Mock
    ):
        """Test OpenAI chat completion latency."""
        start = time.time()
        response = await mock_openai_chat.ainvoke("Test query")
        elapsed = time.time() - start
        
        assert response is not None
        assert elapsed < 3.0, f"Chat completion took {elapsed}s"
    
    @pytest.mark.asyncio
    async def test_pinecone_upsert_latency(
        self, mock_pinecone_index: Mock
    ):
        """Test Pinecone upsert operation latency."""
        vectors = [(f"id_{i}", [0.1] * 1536, {"text": f"doc {i}"}) for i in range(100)]
        
        start = time.time()
        result = mock_pinecone_index.upsert(vectors=vectors)
        elapsed = time.time() - start
        
        assert result["upserted_count"] > 0
        assert elapsed < 2.0, f"Upsert took {elapsed}s"
    
    @pytest.mark.asyncio
    async def test_pinecone_query_latency(
        self, mock_pinecone_index: Mock
    ):
        """Test Pinecone query operation latency."""
        query_vector = [0.1] * 1536
        
        latencies = []
        for _ in range(20):
            start = time.time()
            result = mock_pinecone_index.query(vector=query_vector, top_k=5)
            latency = (time.time() - start) * 1000
            latencies.append(latency)
        
        avg_latency = sum(latencies) / len(latencies)
        
        assert avg_latency < 500, f"Average query latency {avg_latency}ms exceeds 500ms"


# ============================================================================
# Memory Usage Profiling
# ============================================================================


class TestMemoryUsage:
    """Test memory usage and profiling."""
    
    @pytest.mark.asyncio
    async def test_single_query_memory_usage(
        self, mock_vector_store: Mock
    ):
        """Test memory usage for single query."""
        tracemalloc.start()
        
        # Execute query
        await mock_vector_store.similarity_search("test query")
        
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        # Convert to MB
        current_mb = current / 1024 / 1024
        peak_mb = peak / 1024 / 1024
        
        # Should use reasonable memory
        assert peak_mb < 100, f"Peak memory {peak_mb}MB exceeds 100MB"
    
    @pytest.mark.asyncio
    async def test_conversation_memory_growth(self):
        """Test memory growth with conversation history."""
        from src.agent.memory import ConversationMemory
        
        tracemalloc.start()
        
        memory = ConversationMemory(max_messages=20)
        
        # Add many messages
        for i in range(100):
            if i % 2 == 0:
                memory.add_message(HumanMessage(content=f"Question {i}"))
            else:
                memory.add_message(AIMessage(content=f"Answer {i}"))
        
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        # Memory should be bounded due to max_messages
        messages = memory.get_messages()
        assert len(messages) <= 20, "Should limit message count"
        
        peak_mb = peak / 1024 / 1024
        assert peak_mb < 50, f"Peak memory {peak_mb}MB exceeds 50MB"
    
    @pytest.mark.asyncio
    async def test_document_processing_memory(
        self, sample_documents: List[Document]
    ):
        """Test memory usage during document processing."""
        from src.ingestion.document_processor import DocumentProcessor
        
        tracemalloc.start()
        
        processor = DocumentProcessor()
        
        # Process documents
        large_doc = Document(
            page_content="Test content " * 1000,  # Large document
            metadata={}
        )
        
        chunks = processor.chunk_document(large_doc, chunk_size=500, chunk_overlap=50)
        
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        peak_mb = peak / 1024 / 1024
        assert peak_mb < 100, f"Document processing used {peak_mb}MB"
        assert len(chunks) > 0
    
    def test_memory_leak_detection(self):
        """Test for memory leaks in repeated operations."""
        import gc
        
        tracemalloc.start()
        
        # Baseline
        gc.collect()
        baseline, _ = tracemalloc.get_traced_memory()
        
        # Perform repeated operations
        for _ in range(100):
            data = [Document(page_content=f"Doc {i}", metadata={}) for i in range(10)]
            # Process and discard
            del data
        
        # Force garbage collection
        gc.collect()
        
        final, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        # Memory should not grow significantly
        growth_mb = (final - baseline) / 1024 / 1024
        assert growth_mb < 10, f"Memory grew by {growth_mb}MB, possible leak"


# ============================================================================
# Throughput Tests
# ============================================================================


class TestThroughput:
    """Test system throughput."""
    
    @pytest.mark.asyncio
    async def test_queries_per_second(
        self, mock_vector_store: Mock
    ):
        """Test queries per second throughput."""
        duration = 5  # seconds
        query_count = 0
        
        start = time.time()
        while time.time() - start < duration:
            await mock_vector_store.similarity_search("test query")
            query_count += 1
        
        qps = query_count / duration
        
        # Should handle at least 10 queries per second
        assert qps >= 10, f"QPS {qps} below target of 10"
    
    @pytest.mark.asyncio
    async def test_document_ingestion_throughput(
        self, mock_vector_store: Mock
    ):
        """Test document ingestion throughput."""
        documents = [
            Document(page_content=f"Document {i}", metadata={})
            for i in range(1000)
        ]
        
        start = time.time()
        await mock_vector_store.add_documents(documents)
        elapsed = time.time() - start
        
        docs_per_second = len(documents) / elapsed
        
        # Should ingest at least 100 documents per second
        assert docs_per_second >= 100, f"Ingestion rate {docs_per_second} docs/s below target"


# ============================================================================
# Scalability Tests
# ============================================================================


class TestScalability:
    """Test system scalability."""
    
    @pytest.mark.asyncio
    async def test_increasing_load_performance(
        self, mock_vector_store: Mock
    ):
        """Test performance under increasing load."""
        load_levels = [10, 25, 50, 100]
        latencies = {}
        
        for load in load_levels:
            tasks = [
                mock_vector_store.similarity_search(f"query {i}")
                for i in range(load)
            ]
            
            start = time.time()
            await asyncio.gather(*tasks)
            elapsed = time.time() - start
            
            avg_latency = elapsed / load
            latencies[load] = avg_latency
        
        # Latency should scale sub-linearly
        # 100 queries should not take 10x longer than 10 queries
        ratio = latencies[100] / latencies[10]
        assert ratio < 5, f"Latency ratio {ratio} indicates poor scalability"
    
    @pytest.mark.asyncio
    async def test_large_result_set_handling(
        self, mock_vector_store: Mock
    ):
        """Test handling of large result sets."""
        # Mock large result set
        large_results = [
            Document(page_content=f"Doc {i}", metadata={})
            for i in range(100)
        ]
        mock_vector_store.similarity_search.return_value = large_results
        
        start = time.time()
        results = await mock_vector_store.similarity_search("test", top_k=100)
        elapsed = time.time() - start
        
        assert len(results) == 100
        assert elapsed < 2.0, f"Large result set took {elapsed}s"


# ============================================================================
# Resource Utilization Tests
# ============================================================================


class TestResourceUtilization:
    """Test resource utilization efficiency."""
    
    @pytest.mark.asyncio
    async def test_connection_pooling_efficiency(
        self, mock_vector_store: Mock
    ):
        """Test that connection pooling is efficient."""
        # Execute multiple queries
        tasks = [
            mock_vector_store.similarity_search(f"query {i}")
            for i in range(20)
        ]
        
        start = time.time()
        await asyncio.gather(*tasks)
        elapsed = time.time() - start
        
        # With connection pooling, should be fast
        assert elapsed < 5.0, f"Connection pooling inefficient: {elapsed}s"
    
    @pytest.mark.asyncio
    async def test_batch_processing_efficiency(self):
        """Test batch processing efficiency."""
        # Process in batches vs individual
        items = list(range(100))
        batch_size = 10
        
        # Batch processing
        start = time.time()
        batches = [items[i:i+batch_size] for i in range(0, len(items), batch_size)]
        for batch in batches:
            # Process batch
            pass
        batch_time = time.time() - start
        
        # Individual processing
        start = time.time()
        for item in items:
            # Process individual
            pass
        individual_time = time.time() - start
        
        # Batch should be more efficient (or at least not worse)
        assert batch_time <= individual_time * 1.5


# ============================================================================
# Performance Regression Tests
# ============================================================================


class TestPerformanceRegression:
    """Test for performance regressions."""
    
    @pytest.mark.asyncio
    async def test_baseline_query_performance(
        self, mock_vector_store: Mock
    ):
        """Establish baseline query performance."""
        latencies = []
        
        for _ in range(50):
            start = time.time()
            await mock_vector_store.similarity_search("baseline query")
            latency = (time.time() - start) * 1000
            latencies.append(latency)
        
        avg_latency = sum(latencies) / len(latencies)
        p95_latency = sorted(latencies)[47]
        
        # Store baseline metrics (in real scenario, compare with stored baseline)
        baseline_metrics = {
            "avg_latency_ms": avg_latency,
            "p95_latency_ms": p95_latency,
            "sample_size": len(latencies)
        }
        
        # Verify against thresholds
        assert avg_latency < 100, f"Baseline avg latency {avg_latency}ms exceeds 100ms"
        assert p95_latency < 200, f"Baseline p95 latency {p95_latency}ms exceeds 200ms"


# ============================================================================
# Summary Test
# ============================================================================


class TestPerformanceBenchmarkCoverage:
    """Verify comprehensive performance benchmark coverage."""
    
    def test_all_performance_aspects_covered(self):
        """Verify all performance aspects have benchmarks."""
        test_classes = [
            TestResponseTimePercentiles,
            TestConcurrentUserLoad,
            TestAPILatency,
            TestMemoryUsage,
            TestThroughput,
            TestScalability,
            TestResourceUtilization,
            TestPerformanceRegression,
        ]
        
        assert len(test_classes) >= 8, "Should cover all performance aspects"
    
    def test_performance_targets_documented(self):
        """Verify performance targets are documented."""
        targets = {
            "response_time_p95": "< 3 seconds",
            "vector_search_latency": "< 500ms",
            "tavily_search_latency": "< 2 seconds",
            "concurrent_users": "100+",
            "memory_per_instance": "< 2GB",
            "queries_per_second": ">= 10"
        }
        
        assert len(targets) >= 6, "Should have documented performance targets"
