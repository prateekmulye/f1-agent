# F1-Slipstream Developer Guide

Complete guide for developers contributing to or extending the F1-Slipstream Agent.

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture Overview](#architecture-overview)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Testing Guidelines](#testing-guidelines)
- [Adding New Features](#adding-new-features)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Contributing](#contributing)
- [Release Process](#release-process)

## Getting Started

### Development Environment Setup

#### Prerequisites

- Python 3.11 or higher
- Poetry for dependency management
- Git for version control
- Docker (optional, for containerized development)
- VS Code (recommended IDE)

#### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd apps/f1-slipstream-agent

# Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install --with dev

# Activate virtual environment
poetry shell

# Install pre-commit hooks
pre-commit install

# Copy environment template
cp .env.example .env
# Edit .env with your API keys

# Verify setup
poetry run python scripts/validate_setup.py
```

#### VS Code Setup

Recommended extensions:
- Python (Microsoft)
- Pylance
- Black Formatter
- Ruff
- GitLens
- Docker

**VS Code Settings** (`.vscode/settings.json`):

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true,
  "python.testing.pytestEnabled": true,
  "python.testing.unittestEnabled": false,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

### Project Structure

```
f1-slipstream-agent/
├── src/                    # Source code
│   ├── agent/             # LangGraph agent implementation
│   ├── api/               # FastAPI backend
│   ├── config/            # Configuration management
│   ├── ingestion/         # Data ingestion pipeline
│   ├── prompts/           # Prompt templates
│   ├── search/            # Tavily search integration
│   ├── tools/             # LangChain tools
│   ├── ui/                # Streamlit interface
│   ├── utils/             # Utility functions
│   ├── vector_store/      # Pinecone integration
│   └── exceptions.py      # Custom exceptions
├── tests/                 # Test suite
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── docs/                  # Documentation
├── examples/              # Usage examples
├── scripts/               # Utility scripts
├── .env.example           # Environment template
├── pyproject.toml         # Poetry configuration
└── README.md              # Project README
```

## Architecture Overview

### System Components

#### 1. LangGraph Agent (`src/agent/`)

The core orchestration layer that manages conversation flow.

**Key Files**:
- `graph.py`: Main agent state machine
- `nodes.py`: Node implementations (query analysis, routing, retrieval, generation)
- `state.py`: Agent state definitions
- `memory.py`: Conversation memory management

**Design Pattern**: State machine with conditional routing

```python
# Example: Adding a new node
def my_custom_node(state: AgentState) -> AgentState:
    """Process state and return updated state."""
    # Your logic here
    state["custom_field"] = "value"
    return state

# Register in graph
graph.add_node("my_node", my_custom_node)
graph.add_edge("previous_node", "my_node")
```

#### 2. Vector Store (`src/vector_store/`)

Manages Pinecone vector database operations.

**Key Concepts**:
- Document embedding with OpenAI
- Similarity search with metadata filtering
- Batch processing for efficiency
- Connection pooling and retry logic

```python
# Example: Custom metadata filter
filters = {
    "year": {"$gte": 2020},
    "category": {"$in": ["race_result", "driver_stats"]}
}
results = await vector_store.similarity_search(
    query="Hamilton wins",
    filters=filters,
    top_k=5
)
```

#### 3. Search Integration (`src/search/`)

Tavily API integration for real-time F1 data.

**Features**:
- Domain filtering for trusted sources
- Deep content crawling
- Result parsing and normalization
- Rate limiting and error handling

#### 4. Prompt Engineering (`src/prompts/`)

Structured prompt templates following best practices.

**Template Types**:
- System prompts (role definition)
- RAG prompts (context + query)
- Specialized prompts (predictions, analysis)
- Few-shot examples

#### 5. API Layer (`src/api/`)

FastAPI backend for HTTP endpoints.

**Endpoints**:
- `/chat`: Message processing
- `/health`: Health checks
- `/ingest`: Data ingestion
- `/stats`: Statistics

#### 6. UI Layer (`src/ui/`)

Streamlit-based chat interface.

**Components**:
- Chat history display
- Message input
- Streaming response handling
- Source citation display

### Data Flow

```
User Input
    ↓
Query Analysis (intent detection, entity extraction)
    ↓
Routing Decision (vector only, search only, or hybrid)
    ↓
Parallel Retrieval (vector store + Tavily search)
    ↓
Context Ranking (score and merge results)
    ↓
Prompt Construction (system + context + query)
    ↓
LLM Generation (OpenAI GPT-4)
    ↓
Response Formatting (markdown + citations)
    ↓
User Output
```

## Development Workflow

### Branch Strategy

We follow **Git Flow**:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Urgent production fixes
- `release/*`: Release preparation

### Creating a Feature

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-new-feature
```

### Commit Message Convention

We follow **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:

```bash
feat(agent): add query caching for improved performance

Implement Redis-based caching for frequent queries to reduce
API calls and improve response times.

Closes #123
```

```bash
fix(vector-store): handle connection timeout gracefully

Add retry logic with exponential backoff for Pinecone
connection failures.

Fixes #456
```

### Code Review Process

1. **Create Pull Request**: Include description, screenshots, and testing notes
2. **Automated Checks**: CI runs tests, linting, and type checking
3. **Peer Review**: At least one approval required
4. **Address Feedback**: Make requested changes
5. **Merge**: Squash and merge to develop

## Code Style Guide

### Python Style

We follow **PEP 8** with some modifications:

- Line length: 88 characters (Black default)
- Use type hints for all functions
- Docstrings for all public functions and classes
- Prefer explicit over implicit

### Formatting

We use **Black** for code formatting:

```bash
# Format all files
poetry run black src/ tests/

# Check formatting
poetry run black --check src/ tests/
```

### Linting

We use **Ruff** for linting:

```bash
# Lint all files
poetry run ruff check src/ tests/

# Auto-fix issues
poetry run ruff check --fix src/ tests/
```

### Type Checking

We use **mypy** for static type checking:

```bash
# Type check all files
poetry run mypy src/

# Strict mode
poetry run mypy --strict src/
```

### Naming Conventions

```python
# Classes: PascalCase
class VectorStoreManager:
    pass

# Functions and variables: snake_case
def process_query(user_input: str) -> str:
    query_result = "..."
    return query_result

# Constants: UPPER_SNAKE_CASE
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30

# Private methods: _leading_underscore
def _internal_helper(self) -> None:
    pass

# Type aliases: PascalCase
QueryResult = Dict[str, Any]
```

### Docstring Format

We use **Google-style docstrings**:

```python
def similarity_search(
    query: str,
    top_k: int = 5,
    filters: Optional[Dict[str, Any]] = None
) -> List[Document]:
    """Search for similar documents in the vector store.
    
    Performs semantic similarity search using embeddings and returns
    the most relevant documents based on cosine similarity.
    
    Args:
        query: The search query text.
        top_k: Number of results to return. Defaults to 5.
        filters: Optional metadata filters to apply. Defaults to None.
            Example: {"year": {"$gte": 2020}}
    
    Returns:
        List of Document objects sorted by relevance score.
    
    Raises:
        VectorStoreError: If the search operation fails.
        ValueError: If top_k is less than 1.
    
    Example:
        >>> results = await vector_store.similarity_search(
        ...     query="Hamilton wins",
        ...     top_k=3,
        ...     filters={"year": 2023}
        ... )
        >>> print(len(results))
        3
    """
    pass
```

### Import Organization

Organize imports in this order:

1. Standard library
2. Third-party packages
3. Local application imports

```python
# Standard library
import os
from typing import Dict, List, Optional

# Third-party
from langchain_core.documents import Document
from pydantic import BaseModel
import structlog

# Local
from src.config.settings import Settings
from src.exceptions import VectorStoreError
```

### Error Handling

Use custom exceptions and provide context:

```python
# Define custom exceptions
class F1SlipstreamError(Exception):
    """Base exception for all application errors."""
    pass

class VectorStoreError(F1SlipstreamError):
    """Errors related to vector store operations."""
    pass

# Use in code
try:
    results = await vector_store.search(query)
except ConnectionError as e:
    logger.error("vector_store_connection_failed", error=str(e))
    raise VectorStoreError(
        f"Failed to connect to vector store: {e}"
    ) from e
```

### Logging

Use structured logging with **structlog**:

```python
import structlog

logger = structlog.get_logger(__name__)

# Good: Structured logging
logger.info(
    "query_processed",
    query=user_query,
    intent=detected_intent,
    retrieval_count=len(docs),
    response_time_ms=elapsed_time,
    session_id=session_id
)

# Bad: String formatting
logger.info(f"Processed query: {user_query}")
```

## Testing Guidelines

### Test Structure

```
tests/
├── unit/                  # Fast, isolated tests
│   ├── test_config.py
│   ├── test_prompts.py
│   └── test_utils.py
├── integration/           # Component interaction tests
│   ├── test_vector_store.py
│   ├── test_agent.py
│   └── test_api.py
└── e2e/                   # Full workflow tests
    └── test_user_workflows.py
```

### Writing Unit Tests

```python
import pytest
from src.prompts.system_prompts import build_system_prompt

def test_build_system_prompt():
    """Test system prompt construction."""
    prompt = build_system_prompt(
        role="F1 expert",
        capabilities=["data analysis", "predictions"]
    )
    
    assert "F1 expert" in prompt
    assert "data analysis" in prompt
    assert "predictions" in prompt
    assert len(prompt) > 100

def test_build_system_prompt_empty_capabilities():
    """Test system prompt with empty capabilities."""
    with pytest.raises(ValueError, match="Capabilities cannot be empty"):
        build_system_prompt(role="expert", capabilities=[])
```

### Writing Integration Tests

```python
import pytest
from src.vector_store.manager import VectorStoreManager
from src.config.settings import Settings

@pytest.mark.integration
async def test_vector_store_search(vector_store: VectorStoreManager):
    """Test vector store search integration."""
    # Arrange
    query = "Hamilton championship wins"
    
    # Act
    results = await vector_store.similarity_search(
        query=query,
        top_k=5
    )
    
    # Assert
    assert len(results) > 0
    assert all(hasattr(doc, "page_content") for doc in results)
    assert all(hasattr(doc, "metadata") for doc in results)
```

### Writing E2E Tests

```python
import pytest
from src.agent.graph import F1AgentGraph

@pytest.mark.e2e
async def test_complete_conversation_flow(agent: F1AgentGraph):
    """Test complete user conversation workflow."""
    session_id = "test_session"
    
    # First query
    response1 = await agent.process_query(
        query="Who won the 2023 championship?",
        session_id=session_id
    )
    assert "Verstappen" in response1["response"]
    
    # Follow-up query (tests context)
    response2 = await agent.process_query(
        query="How many wins did he have?",
        session_id=session_id
    )
    assert "19" in response2["response"]
```

### Test Fixtures

Define reusable fixtures in `conftest.py`:

```python
import pytest
from src.config.settings import Settings
from src.vector_store.manager import VectorStoreManager

@pytest.fixture
def settings():
    """Provide test settings."""
    return Settings(
        openai_api_key="test_key",
        pinecone_api_key="test_key",
        tavily_api_key="test_key",
        log_level="DEBUG"
    )

@pytest.fixture
async def vector_store(settings):
    """Provide vector store instance."""
    store = VectorStoreManager(settings)
    await store.initialize()
    yield store
    await store.close()
```

### Running Tests

```bash
# Run all tests
poetry run pytest

# Run specific test types
poetry run pytest -m unit
poetry run pytest -m integration
poetry run pytest -m e2e

# Run with coverage
poetry run pytest --cov=src --cov-report=html

# Run specific test file
poetry run pytest tests/unit/test_config.py

# Run specific test
poetry run pytest tests/unit/test_config.py::test_settings_validation

# Run with verbose output
poetry run pytest -v

# Run and stop on first failure
poetry run pytest -x
```

### Test Coverage

Maintain minimum 80% code coverage:

```bash
# Generate coverage report
poetry run pytest --cov=src --cov-report=term-missing

# View HTML report
open htmlcov/index.html
```

## Adding New Features

### Adding a New LangGraph Node

1. **Define the node function** in `src/agent/nodes.py`:

```python
def my_new_node(state: AgentState) -> AgentState:
    """Process state for my new feature.
    
    Args:
        state: Current agent state
        
    Returns:
        Updated agent state
    """
    logger.info("my_new_node_started", query=state["query"])
    
    # Your logic here
    result = process_something(state["query"])
    
    state["my_result"] = result
    logger.info("my_new_node_completed", result_count=len(result))
    
    return state
```

2. **Register the node** in `src/agent/graph.py`:

```python
def _build_graph(self):
    # Add node
    self.graph.add_node("my_new_node", my_new_node)
    
    # Add edges
    self.graph.add_edge("previous_node", "my_new_node")
    self.graph.add_edge("my_new_node", "next_node")
```

3. **Update state definition** in `src/agent/state.py`:

```python
class AgentState(TypedDict):
    # Existing fields...
    my_result: Optional[List[str]]  # Add new field
```

4. **Write tests**:

```python
async def test_my_new_node():
    state = AgentState(query="test", my_result=None)
    result = my_new_node(state)
    assert result["my_result"] is not None
```

### Adding a New Tool

1. **Define the tool** in `src/tools/f1_tools.py`:

```python
from langchain_core.tools import tool

@tool
async def my_new_tool(query: str, param: int = 10) -> str:
    """Description of what the tool does.
    
    Use this tool when users ask about...
    
    Args:
        query: The search query
        param: Optional parameter
        
    Returns:
        Tool result as string
    """
    # Your logic here
    result = await fetch_data(query, param)
    return format_result(result)
```

2. **Register the tool** in `src/agent/graph.py`:

```python
from src.tools.f1_tools import my_new_tool

def __init__(self, config: Settings):
    self.tools = [
        search_current_f1_data,
        query_f1_history,
        predict_race_outcome,
        my_new_tool,  # Add new tool
    ]
```

3. **Write tests**:

```python
async def test_my_new_tool():
    result = await my_new_tool.ainvoke({"query": "test", "param": 5})
    assert isinstance(result, str)
    assert len(result) > 0
```

### Adding a New API Endpoint

1. **Create route** in `src/api/routes/`:

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/my-feature", tags=["my-feature"])

class MyRequest(BaseModel):
    query: str
    options: Optional[Dict[str, Any]] = None

class MyResponse(BaseModel):
    result: str
    metadata: Dict[str, Any]

@router.post("/process", response_model=MyResponse)
async def process_my_feature(request: MyRequest):
    """Process my feature request."""
    try:
        result = await my_feature_logic(request.query, request.options)
        return MyResponse(
            result=result["data"],
            metadata=result["metadata"]
        )
    except Exception as e:
        logger.error("my_feature_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
```

2. **Register router** in `src/api/main.py`:

```python
from src.api.routes import my_feature

app.include_router(my_feature.router)
```

3. **Write tests**:

```python
from fastapi.testclient import TestClient

def test_my_feature_endpoint(client: TestClient):
    response = client.post(
        "/my-feature/process",
        json={"query": "test"}
    )
    assert response.status_code == 200
    assert "result" in response.json()
```

### Adding a New Prompt Template

1. **Create template** in `src/prompts/`:

```python
from langchain_core.prompts import ChatPromptTemplate

MY_TEMPLATE = ChatPromptTemplate.from_messages([
    ("system", """You are an expert in {domain}.
    
    Your task is to {task}.
    
    Guidelines:
    - {guideline1}
    - {guideline2}
    """),
    ("human", "{query}")
])

def build_my_prompt(
    domain: str,
    task: str,
    query: str,
    **kwargs
) -> str:
    """Build my custom prompt.
    
    Args:
        domain: The domain of expertise
        task: The task to perform
        query: User query
        **kwargs: Additional template variables
        
    Returns:
        Formatted prompt string
    """
    return MY_TEMPLATE.format(
        domain=domain,
        task=task,
        query=query,
        **kwargs
    )
```

2. **Write tests**:

```python
def test_build_my_prompt():
    prompt = build_my_prompt(
        domain="F1",
        task="analyze data",
        query="test query",
        guideline1="Be accurate",
        guideline2="Cite sources"
    )
    assert "F1" in prompt
    assert "analyze data" in prompt
    assert "test query" in prompt
```

## Debugging

### Logging

Enable debug logging:

```bash
# In .env
LOG_LEVEL=DEBUG

# Or at runtime
export LOG_LEVEL=DEBUG
poetry run streamlit run src/ui/app.py
```

### Interactive Debugging

Use Python debugger:

```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or use built-in breakpoint()
breakpoint()
```

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Streamlit",
      "type": "python",
      "request": "launch",
      "module": "streamlit",
      "args": ["run", "src/ui/app.py"],
      "console": "integratedTerminal"
    },
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["src.api.main:app", "--reload"],
      "console": "integratedTerminal"
    },
    {
      "name": "Python: Current File",
      "type": "python",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal"
    }
  ]
}
```

### LangSmith Tracing

Enable LangSmith for LLM tracing:

```bash
# In .env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_PROJECT=f1-slipstream-dev
```

View traces at: https://smith.langchain.com/

### Common Issues

#### Import Errors

```bash
# Ensure you're in the virtual environment
poetry shell

# Reinstall dependencies
poetry install

# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +
```

#### API Connection Issues

```bash
# Test OpenAI connection
poetry run python -c "from openai import OpenAI; client = OpenAI(); print(client.models.list())"

# Test Pinecone connection
poetry run python scripts/test_pinecone.py

# Test Tavily connection
poetry run python scripts/test_tavily_setup.py
```

## Performance Optimization

### Profiling

Use cProfile for performance profiling:

```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Your code here
result = await agent.process_query(query)

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(20)  # Top 20 functions
```

### Async Operations

Convert blocking operations to async:

```python
# Bad: Blocking
def fetch_data():
    response = requests.get(url)
    return response.json()

# Good: Async
async def fetch_data():
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()
```

### Caching

Implement caching for expensive operations:

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_computation(param: str) -> str:
    # Expensive operation
    return result
```

### Batch Processing

Process items in batches:

```python
async def process_documents_in_batches(
    documents: List[Document],
    batch_size: int = 100
):
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        await process_batch(batch)
```

## Contributing

### Contribution Checklist

Before submitting a PR:

- [ ] Code follows style guide
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts
- [ ] Pre-commit hooks pass

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guide
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings

## Screenshots (if applicable)
```

## Release Process

### Version Numbering

We follow **Semantic Versioning** (SemVer):

- `MAJOR.MINOR.PATCH`
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes

### Creating a Release

```bash
# Update version in pyproject.toml
poetry version minor  # or major, patch

# Update CHANGELOG.md
# Commit changes
git add pyproject.toml CHANGELOG.md
git commit -m "chore: bump version to 0.2.0"

# Create tag
git tag -a v0.2.0 -m "Release v0.2.0"

# Push
git push origin develop
git push origin v0.2.0
```

### Deployment

See `docs/DEPLOYMENT.md` for deployment instructions.

## Additional Resources

- [Architecture Documentation](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [LangChain Documentation](https://python.langchain.com/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Streamlit Documentation](https://docs.streamlit.io/)

## Getting Help

- **Documentation**: Check `docs/` folder
- **Issues**: Open an issue on GitHub
- **Discussions**: Join community discussions
- **Code Review**: Request review from maintainers

---

**Happy Coding! 🏎️**
