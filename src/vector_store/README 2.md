# Vector Store Module

This module provides integration with Pinecone vector database using LangChain's `langchain-pinecone` package for seamless RAG (Retrieval-Augmented Generation) operations.

## Features

- **Seamless LangChain Integration**: Uses `PineconeVectorStore` from `langchain-pinecone`
- **Automatic Index Management**: Creates and validates Pinecone indexes
- **Batch Processing**: Efficient document embedding and upsertion
- **Semantic Search**: Multiple search methods with metadata filtering
- **Caching**: In-memory caching for frequent queries
- **Retry Logic**: Automatic retries with exponential backoff
- **Health Checks**: Monitor vector store status
- **Structured Logging**: Comprehensive logging with structlog

## Components

### VectorStoreManager

Main class for managing all vector store operations.

#### Initialization

```python
from src.config.settings import get_settings
from src.vector_store import VectorStoreManager

config = get_settings()
manager = VectorStoreManager(config)
await manager.initialize()
```

#### Adding Documents

```python
from langchain_core.documents import Document

# Create documents with metadata
docs = [
    Document(
        page_content="Lewis Hamilton won the 2024 Monaco GP",
        metadata={
            "year": 2024,
            "race": "Monaco Grand Prix",
            "driver": "Lewis Hamilton",
            "category": "race_result"
        }
    )
]

# Add documents (handles embedding automatically)
doc_ids = await manager.add_documents(docs, batch_size=100)
```

#### Semantic Search

```python
# Basic similarity search
results = await manager.similarity_search(
    query="Who won Monaco?",
    k=5
)

# Search with relevance scores
results_with_scores = await manager.similarity_search_with_score(
    query="Max Verstappen championship",
    k=3
)

for doc, score in results_with_scores:
    print(f"Score: {score:.3f} - {doc.page_content}")
```

#### Metadata Filtering

```python
# Search with metadata filters
results = await manager.similarity_search(
    query="race results",
    k=5,
    filters={
        "year": 2024,
        "category": "race_result"
    }
)

# Metadata-only search (no semantic search)
results = await manager.search_by_metadata(
    filters={"driver": "Lewis Hamilton"},
    k=10
)
```

#### Advanced Search

```python
# Maximum Marginal Relevance (MMR) for diverse results
results = await manager.max_marginal_relevance_search(
    query="F1 technical regulations",
    k=5,
    fetch_k=20,
    lambda_mult=0.5  # Balance relevance vs diversity
)
```

#### Health Checks

```python
# Check vector store health
health = await manager.health_check()
print(health)
# {
#     "status": "healthy",
#     "index_name": "f1-knowledge",
#     "dimension": 1536,
#     "metric": "cosine",
#     "total_vector_count": 1000
# }

# Get detailed statistics
stats = await manager.get_index_stats()
```

#### Caching

```python
# Search results are cached by default (5 min TTL)
results = await manager.similarity_search(query, use_cache=True)

# Clear cache manually
manager.clear_cache()
```

## Configuration

Required environment variables (in `.env`):

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=f1-knowledge
PINECONE_DIMENSION=1536

# RAG Configuration
VECTOR_SEARCH_TOP_K=5
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

## Pinecone Filter Syntax

Pinecone supports rich metadata filtering:

```python
# Equality
filters = {"year": 2024}

# Comparison operators
filters = {"year": {"$gte": 2020, "$lte": 2024}}

# In operator
filters = {"driver": {"$in": ["Lewis Hamilton", "Max Verstappen"]}}

# Logical operators
filters = {
    "$and": [
        {"year": 2024},
        {"category": "race_result"}
    ]
}

# Complex filters
filters = {
    "$or": [
        {"driver": "Lewis Hamilton"},
        {"team": "Mercedes"}
    ],
    "year": {"$gte": 2020}
}
```

## Error Handling

All methods raise `VectorStoreError` on failure:

```python
from src.exceptions import VectorStoreError

try:
    results = await manager.similarity_search(query)
except VectorStoreError as e:
    logger.error(f"Search failed: {e}")
    # Handle error (fallback, retry, etc.)
```

## Best Practices

1. **Initialize Once**: Create one `VectorStoreManager` instance per application
2. **Batch Processing**: Use appropriate batch sizes (100-500) for document ingestion
3. **Metadata Design**: Include rich metadata for effective filtering
4. **Cache Management**: Use caching for frequently accessed queries
5. **Error Handling**: Always handle `VectorStoreError` exceptions
6. **Resource Cleanup**: Call `await manager.close()` on shutdown

## Example Usage

See `examples/vector_store_example.py` for complete examples.

## Dependencies

- `langchain-pinecone`: LangChain integration for Pinecone
- `langchain-openai`: OpenAI embeddings
- `pinecone-client`: Pinecone Python SDK
- `tenacity`: Retry logic
- `structlog`: Structured logging

## Architecture

```
VectorStoreManager
├── Pinecone Client (pinecone-client)
│   └── Index Management
├── OpenAI Embeddings (langchain-openai)
│   └── Text → Vector conversion
├── PineconeVectorStore (langchain-pinecone)
│   ├── Document storage
│   ├── Similarity search
│   └── Metadata filtering
└── Cache Layer
    └── In-memory result caching
```

## Performance Considerations

- **Embedding Generation**: ~50-100ms per document
- **Batch Upsertion**: ~1-2 seconds per 100 documents
- **Similarity Search**: ~100-300ms per query
- **Cache Hit**: ~1-5ms per query

## Troubleshooting

### Index Dimension Mismatch
```
VectorStoreError: Index dimension mismatch: expected 1536, got 768
```
**Solution**: Ensure `PINECONE_DIMENSION` matches your embedding model's dimension.

### Connection Errors
```
ConnectionError: Failed to connect to Pinecone
```
**Solution**: Check API key and network connectivity. Retries happen automatically.

### Rate Limiting
```
RateLimitError: Too many requests
```
**Solution**: Implement backoff or reduce request frequency. Built-in retry logic handles this.

## Testing

Run tests with:
```bash
poetry run pytest tests/test_vector_store.py -v
```

## Future Enhancements

- [ ] Redis-based distributed caching
- [ ] Hybrid search with BM25
- [ ] Automatic index optimization
- [ ] Query analytics and monitoring
- [ ] Multi-index support
