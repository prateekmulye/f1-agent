"""Pytest configuration and fixtures."""

import os
from typing import Any, AsyncGenerator, Dict, Generator, List
from unittest.mock import AsyncMock, MagicMock, Mock

import pytest
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage

from src.config.settings import Settings


@pytest.fixture
def test_settings() -> Generator[Settings, None, None]:
    """Provide test settings with mock API keys.

    Yields:
        Settings: Test configuration instance
    """
    # Set test environment variables
    os.environ["OPENAI_API_KEY"] = "test-openai-key"
    os.environ["PINECONE_API_KEY"] = "test-pinecone-key"
    os.environ["PINECONE_ENVIRONMENT"] = "test-environment"
    os.environ["TAVILY_API_KEY"] = "test-tavily-key"
    os.environ["ENVIRONMENT"] = "development"
    os.environ["LOG_LEVEL"] = "DEBUG"

    # Clear the lru_cache to force reload with test values
    from src.config.settings import get_settings

    get_settings.cache_clear()

    settings = Settings()
    yield settings

    # Cleanup
    get_settings.cache_clear()


# ============================================================================
# Mock Factories for External APIs
# ============================================================================


@pytest.fixture
def mock_openai_embeddings() -> Mock:
    """Create mock OpenAI embeddings client.

    Returns:
        Mock: Mock embeddings client
    """
    mock = Mock()
    mock.embed_documents = Mock(return_value=[[0.1] * 1536 for _ in range(3)])
    mock.embed_query = Mock(return_value=[0.1] * 1536)
    mock.aembed_documents = AsyncMock(return_value=[[0.1] * 1536 for _ in range(3)])
    mock.aembed_query = AsyncMock(return_value=[0.1] * 1536)
    return mock


@pytest.fixture
def mock_openai_chat() -> Mock:
    """Create mock OpenAI chat client.

    Returns:
        Mock: Mock chat client
    """
    mock = Mock()
    mock_response = AIMessage(content="This is a test response from the LLM.")
    mock.invoke = Mock(return_value=mock_response)
    mock.ainvoke = AsyncMock(return_value=mock_response)

    # Mock streaming
    async def mock_astream(
        *args: Any, **kwargs: Any
    ) -> AsyncGenerator[AIMessage, None]:
        chunks = ["This ", "is ", "a ", "test ", "response."]
        for chunk in chunks:
            yield AIMessage(content=chunk)

    mock.astream = mock_astream
    return mock


@pytest.fixture
def mock_pinecone_index() -> Mock:
    """Create mock Pinecone index.

    Returns:
        Mock: Mock Pinecone index
    """
    mock = Mock()
    mock.upsert = Mock(return_value={"upserted_count": 10})
    mock.query = Mock(
        return_value={
            "matches": [
                {
                    "id": "doc1",
                    "score": 0.95,
                    "metadata": {
                        "text": "Lewis Hamilton won the 2020 championship",
                        "year": 2020,
                        "category": "championship",
                    },
                },
                {
                    "id": "doc2",
                    "score": 0.87,
                    "metadata": {
                        "text": "Max Verstappen won the 2021 championship",
                        "year": 2021,
                        "category": "championship",
                    },
                },
            ]
        }
    )
    mock.describe_index_stats = Mock(
        return_value={
            "dimension": 1536,
            "index_fullness": 0.1,
            "total_vector_count": 1000,
        }
    )
    return mock


@pytest.fixture
def mock_tavily_client() -> Mock:
    """Create mock Tavily search client.

    Returns:
        Mock: Mock Tavily client
    """
    mock = Mock()
    mock.search = Mock(
        return_value={
            "results": [
                {
                    "title": "F1 Race Results",
                    "url": "https://formula1.com/results",
                    "content": "Max Verstappen won the latest race",
                    "score": 0.95,
                    "published_date": "2024-03-15",
                },
                {
                    "title": "F1 Standings",
                    "url": "https://formula1.com/standings",
                    "content": "Current championship standings",
                    "score": 0.88,
                    "published_date": "2024-03-14",
                },
            ]
        }
    )
    mock.search_async = AsyncMock(
        return_value={
            "results": [
                {
                    "title": "F1 Race Results",
                    "url": "https://formula1.com/results",
                    "content": "Max Verstappen won the latest race",
                    "score": 0.95,
                    "published_date": "2024-03-15",
                }
            ]
        }
    )
    return mock


@pytest.fixture
def mock_vector_store() -> Mock:
    """Create mock vector store manager.

    Returns:
        Mock: Mock vector store
    """
    mock = Mock()
    mock.similarity_search = AsyncMock(
        return_value=[
            Document(
                page_content="Lewis Hamilton won the 2020 championship",
                metadata={"year": 2020, "category": "championship", "source": "test"},
            ),
            Document(
                page_content="Max Verstappen won the 2021 championship",
                metadata={"year": 2021, "category": "championship", "source": "test"},
            ),
        ]
    )
    mock.add_documents = AsyncMock(return_value=["doc1", "doc2", "doc3"])
    mock.similarity_search_with_score = AsyncMock(
        return_value=[(Document(page_content="Test doc", metadata={}), 0.95)]
    )
    return mock


# ============================================================================
# Test Data Fixtures
# ============================================================================


@pytest.fixture
def sample_documents() -> List[Document]:
    """Provide sample documents for testing.

    Returns:
        List[Document]: Sample documents
    """
    return [
        Document(
            page_content="Lewis Hamilton is a seven-time Formula 1 World Champion.",
            metadata={
                "source": "test",
                "category": "driver_stats",
                "year": 2020,
                "driver": "Lewis Hamilton",
            },
        ),
        Document(
            page_content="Max Verstappen won the 2021 and 2022 championships.",
            metadata={
                "source": "test",
                "category": "championship",
                "year": 2022,
                "driver": "Max Verstappen",
            },
        ),
        Document(
            page_content="Monaco Grand Prix is held on the streets of Monte Carlo.",
            metadata={
                "source": "test",
                "category": "circuit",
                "race": "Monaco Grand Prix",
            },
        ),
    ]


@pytest.fixture
def sample_messages() -> List[Any]:
    """Provide sample conversation messages.

    Returns:
        List: Sample messages
    """
    return [
        HumanMessage(content="Who won the 2021 championship?"),
        AIMessage(content="Max Verstappen won the 2021 Formula 1 World Championship."),
        HumanMessage(content="What about 2020?"),
        AIMessage(content="Lewis Hamilton won the 2020 championship."),
    ]


@pytest.fixture
def sample_search_results() -> List[Dict[str, Any]]:
    """Provide sample search results.

    Returns:
        List[Dict]: Sample search results
    """
    return [
        {
            "title": "F1 2024 Season Preview",
            "url": "https://formula1.com/2024-preview",
            "content": "The 2024 season promises exciting battles between top teams.",
            "score": 0.92,
            "published_date": "2024-01-15",
        },
        {
            "title": "Latest F1 News",
            "url": "https://formula1.com/news",
            "content": "Breaking news from the world of Formula 1.",
            "score": 0.85,
            "published_date": "2024-03-10",
        },
    ]


@pytest.fixture
def sample_agent_state() -> Dict[str, Any]:
    """Provide sample agent state.

    Returns:
        Dict: Sample agent state
    """
    return {
        "messages": [HumanMessage(content="Who won the last race?")],
        "query": "Who won the last race?",
        "intent": "current_results",
        "entities": {"race": "latest"},
        "retrieved_docs": [],
        "search_results": [],
        "context": "",
        "response": None,
        "metadata": {
            "session_id": "test-session-123",
            "timestamp": "2024-03-15T10:00:00Z",
        },
    }


# ============================================================================
# Async Test Utilities
# ============================================================================


@pytest.fixture
def event_loop():
    """Create event loop for async tests.

    Yields:
        Event loop
    """
    import asyncio

    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# Test Database/Vector Store Setup
# ============================================================================


@pytest.fixture
async def test_vector_store_index(test_settings: Settings) -> AsyncGenerator[str, None]:
    """Create a test Pinecone index.

    Note: This fixture requires actual Pinecone credentials for integration tests.
    For unit tests, use mock_vector_store instead.

    Args:
        test_settings: Test settings

    Yields:
        str: Test index name
    """
    # This would create a real test index for integration tests
    # For now, we'll just yield a test index name
    test_index_name = f"test-{test_settings.pinecone_index_name}"

    # Setup: Create test index (would require actual Pinecone client)
    # For unit tests, this is skipped

    yield test_index_name

    # Teardown: Delete test index
    # For unit tests, this is skipped


# ============================================================================
# Mock Context Managers
# ============================================================================


class MockAsyncContextManager:
    """Mock async context manager for testing."""

    def __init__(self, return_value: Any = None):
        """Initialize mock context manager.

        Args:
            return_value: Value to return on enter
        """
        self.return_value = return_value

    async def __aenter__(self) -> Any:
        """Enter context."""
        return self.return_value

    async def __aexit__(self, *args: Any) -> None:
        """Exit context."""
        pass


@pytest.fixture
def mock_async_context() -> type[MockAsyncContextManager]:
    """Provide mock async context manager.

    Returns:
        MockAsyncContextManager: Mock context manager class
    """
    return MockAsyncContextManager
