"""Integration tests for Tavily search integration.

These tests require actual Tavily API credentials.
Mark as integration tests to skip in unit test runs.
"""

import pytest

from src.config.settings import Settings
from src.exceptions import SearchAPIError
from src.search.tavily_client import TavilyClient


@pytest.mark.integration
@pytest.mark.asyncio
class TestTavilySearchIntegration:
    """Integration tests for TavilySearchClient."""

    @pytest.fixture
    def tavily_client(self, test_settings: Settings):
        """Create Tavily client for testing."""
        # Skip if no real API key
        if test_settings.tavily_api_key.startswith("test-"):
            pytest.skip("Skipping integration test - no real Tavily API key")

        return TavilyClient(test_settings)

    async def test_basic_search(self, tavily_client: TavilyClient):
        """Test basic search functionality."""
        results = await tavily_client.search(
            query="Formula 1 2024 season", max_results=3
        )

        assert len(results) > 0
        assert all(hasattr(r, "title") for r in results)
        assert all(hasattr(r, "url") for r in results)
        assert all(hasattr(r, "content") for r in results)

    async def test_search_with_f1_domain(self, tavily_client: TavilyClient):
        """Test search with F1-specific domains."""
        results = await tavily_client.search(
            query="latest F1 race results", max_results=5
        )

        assert len(results) > 0

        # Check if results contain F1-related content
        content = " ".join([r.content for r in results])
        assert any(
            keyword in content.lower() for keyword in ["f1", "formula 1", "grand prix"]
        )

    async def test_search_with_context(self, tavily_client: TavilyClient):
        """Test search with additional context."""
        results = await tavily_client.search_with_context(
            query="championship standings",
            context="Formula 1 2024 season",
            max_results=3,
        )

        assert len(results) > 0

    async def test_search_depth_advanced(self, tavily_client: TavilyClient):
        """Test search with advanced depth."""
        results = await tavily_client.search(
            query="F1 technical regulations", search_depth="advanced", max_results=3
        )

        assert len(results) > 0

    async def test_convert_to_documents(self, tavily_client: TavilyClient):
        """Test converting search results to LangChain documents."""
        results = await tavily_client.search(query="F1 drivers 2024", max_results=2)

        documents = tavily_client.convert_to_documents(results)

        assert len(documents) > 0
        assert all(hasattr(doc, "page_content") for doc in documents)
        assert all(hasattr(doc, "metadata") for doc in documents)

        # Check metadata contains expected fields
        for doc in documents:
            assert "source" in doc.metadata
            assert "url" in doc.metadata


@pytest.mark.integration
@pytest.mark.asyncio
class TestTavilyErrorHandling:
    """Integration tests for Tavily error handling."""

    async def test_invalid_api_key(self):
        """Test handling of invalid API key."""
        from src.config.settings import Settings
        import os

        # Create settings with invalid key
        os.environ["TAVILY_API_KEY"] = "invalid_key"
        os.environ["OPENAI_API_KEY"] = "test-key"
        os.environ["PINECONE_API_KEY"] = "test-key"
        os.environ["PINECONE_ENVIRONMENT"] = "test"

        from src.config.settings import get_settings

        get_settings.cache_clear()

        settings = Settings()
        client = TavilyClient(settings)

        # Should raise error on search
        with pytest.raises(SearchAPIError):
            await client.search(query="test query")

    async def test_empty_query(self, test_settings: Settings):
        """Test searching with empty query."""
        if test_settings.tavily_api_key.startswith("test-"):
            pytest.skip("Skipping integration test - no real Tavily API key")

        client = TavilyClient(test_settings)

        # Empty query should handle gracefully or raise appropriate error
        try:
            results = await client.search(query="")
            assert isinstance(results, list)
        except SearchAPIError:
            # Expected behavior for empty query
            pass

    async def test_rate_limiting(self, test_settings: Settings):
        """Test rate limiting behavior."""
        if test_settings.tavily_api_key.startswith("test-"):
            pytest.skip("Skipping integration test - no real Tavily API key")

        client = TavilyClient(test_settings)

        # Make multiple rapid requests
        for i in range(3):
            try:
                await client.search(query=f"F1 test query {i}", max_results=1)
            except SearchAPIError as e:
                # Rate limiting might kick in
                if "rate limit" in str(e).lower():
                    assert True
                    return

        # If no rate limiting, that's also fine
        assert True


@pytest.mark.integration
@pytest.mark.asyncio
class TestTavilyResultParsing:
    """Integration tests for result parsing."""

    async def test_result_metadata_extraction(self, test_settings: Settings):
        """Test metadata extraction from search results."""
        if test_settings.tavily_api_key.startswith("test-"):
            pytest.skip("Skipping integration test - no real Tavily API key")

        client = TavilyClient(test_settings)
        results = await client.search(query="F1 news", max_results=2)

        for result in results:
            # Check required fields
            assert result.title is not None
            assert result.url is not None
            assert result.content is not None

            # Check URL is valid
            assert result.url.startswith("http")

    async def test_result_deduplication(self, test_settings: Settings):
        """Test that duplicate results are handled."""
        if test_settings.tavily_api_key.startswith("test-"):
            pytest.skip("Skipping integration test - no real Tavily API key")

        client = TavilyClient(test_settings)
        results = await client.search(query="Formula 1", max_results=5)

        # Check for unique URLs
        urls = [r.url for r in results]
        assert len(urls) == len(set(urls)), "Duplicate URLs found in results"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "integration"])
