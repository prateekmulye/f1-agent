"""Test utilities and helper functions."""

from typing import Any, Dict, List, Optional
from unittest.mock import Mock

from langchain_core.documents import Document
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage


def create_mock_document(
    content: str,
    metadata: Optional[Dict[str, Any]] = None,
    doc_id: Optional[str] = None,
) -> Document:
    """Create a mock document for testing.
    
    Args:
        content: Document content
        metadata: Document metadata
        doc_id: Document ID
        
    Returns:
        Document: Mock document
    """
    if metadata is None:
        metadata = {}
    
    doc = Document(page_content=content, metadata=metadata)
    if doc_id:
        doc.metadata["id"] = doc_id
    
    return doc


def create_mock_messages(
    conversation: List[tuple[str, str]]
) -> List[BaseMessage]:
    """Create mock conversation messages.
    
    Args:
        conversation: List of (role, content) tuples
        
    Returns:
        List[BaseMessage]: Mock messages
    """
    messages = []
    for role, content in conversation:
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))
    
    return messages


def create_mock_search_result(
    title: str = "Test Result",
    url: str = "https://test.com",
    content: str = "Test content",
    score: float = 0.9,
) -> Dict[str, Any]:
    """Create a mock search result.
    
    Args:
        title: Result title
        url: Result URL
        content: Result content
        score: Relevance score
        
    Returns:
        Dict: Mock search result
    """
    return {
        "title": title,
        "url": url,
        "content": content,
        "score": score,
        "published_date": "2024-03-15"
    }


def assert_document_equal(doc1: Document, doc2: Document) -> None:
    """Assert two documents are equal.
    
    Args:
        doc1: First document
        doc2: Second document
    """
    assert doc1.page_content == doc2.page_content
    assert doc1.metadata == doc2.metadata


def assert_message_equal(msg1: BaseMessage, msg2: BaseMessage) -> None:
    """Assert two messages are equal.
    
    Args:
        msg1: First message
        msg2: Second message
    """
    assert type(msg1) == type(msg2)
    assert msg1.content == msg2.content


class MockStreamingResponse:
    """Mock streaming response for testing."""
    
    def __init__(self, chunks: List[str]):
        """Initialize mock streaming response.
        
        Args:
            chunks: List of response chunks
        """
        self.chunks = chunks
        self.index = 0
    
    def __aiter__(self):
        """Return async iterator."""
        return self
    
    async def __anext__(self) -> str:
        """Get next chunk.
        
        Returns:
            str: Next chunk
            
        Raises:
            StopAsyncIteration: When no more chunks
        """
        if self.index >= len(self.chunks):
            raise StopAsyncIteration
        
        chunk = self.chunks[self.index]
        self.index += 1
        return chunk


def create_mock_llm_response(content: str = "Test response") -> AIMessage:
    """Create a mock LLM response.
    
    Args:
        content: Response content
        
    Returns:
        AIMessage: Mock response
    """
    return AIMessage(content=content)


def create_mock_embedding(dimension: int = 1536) -> List[float]:
    """Create a mock embedding vector.
    
    Args:
        dimension: Embedding dimension
        
    Returns:
        List[float]: Mock embedding
    """
    return [0.1] * dimension


class AsyncMockIterator:
    """Async iterator mock for testing."""
    
    def __init__(self, items: List[Any]):
        """Initialize async iterator.
        
        Args:
            items: Items to iterate over
        """
        self.items = items
        self.index = 0
    
    def __aiter__(self):
        """Return async iterator."""
        return self
    
    async def __anext__(self) -> Any:
        """Get next item.
        
        Returns:
            Any: Next item
            
        Raises:
            StopAsyncIteration: When no more items
        """
        if self.index >= len(self.items):
            raise StopAsyncIteration
        
        item = self.items[self.index]
        self.index += 1
        return item
