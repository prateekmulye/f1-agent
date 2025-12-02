# F1-Slipstream Agent Tests

This directory contains comprehensive tests for the F1-Slipstream agent system.

## Test Structure

```
tests/
├── conftest.py                          # Pytest configuration and fixtures
├── test_utils.py                        # Test utilities and helpers
├── test_config.py                       # Configuration tests
├── test_exceptions.py                   # Exception handling tests
├── test_security.py                     # Security feature tests
├── test_document_processor.py           # Document processing unit tests
├── test_data_loader.py                  # Data loading unit tests
├── test_prompts.py                      # Prompt template unit tests
├── test_fallback.py                     # Fallback mechanism unit tests
├── test_integration_vector_store.py     # Vector store integration tests
├── test_integration_tavily.py           # Tavily search integration tests
├── test_integration_api.py              # API endpoint integration tests
├── test_integration_agent.py            # Agent flow integration tests
└── test_e2e_user_workflows.py          # End-to-end user workflow tests
```

## Test Categories

### Unit Tests (`@pytest.mark.unit`)
- Test individual components in isolation
- Use mocks for external dependencies
- Fast execution
- No external API calls required

**Examples:**
- Configuration loading and validation
- Document processing and chunking
- Prompt template rendering
- Error handling logic

### Integration Tests (`@pytest.mark.integration`)
- Test component interactions
- May use real external services (with test credentials)
- Slower execution
- Require API keys for full testing

**Examples:**
- Vector store operations with Pinecone
- Tavily search API integration
- FastAPI endpoint testing
- LangGraph agent flow

### End-to-End Tests (`@pytest.mark.e2e`)
- Test complete user workflows
- Simulate real user interactions
- Require all services to be available
- Slowest execution

**Examples:**
- Multi-turn conversations
- Prediction generation workflow
- Error recovery scenarios
- Complex conversation flows

## Running Tests

### Run All Tests
```bash
poetry run pytest
```

### Run Only Unit Tests
```bash
poetry run pytest -m unit
```

### Run Only Integration Tests
```bash
poetry run pytest -m integration
```

### Run Only E2E Tests
```bash
poetry run pytest -m e2e
```

### Run Specific Test File
```bash
poetry run pytest tests/test_document_processor.py
```

### Run with Coverage
```bash
poetry run pytest --cov=src --cov-report=html
```

### Run with Verbose Output
```bash
poetry run pytest -v
```

### Run Tests in Parallel
```bash
poetry run pytest -n auto
```

## Environment Setup

### For Unit Tests
Unit tests use mock API keys and don't require real credentials:
```bash
export OPENAI_API_KEY="test-openai-key"
export PINECONE_API_KEY="test-pinecone-key"
export PINECONE_ENVIRONMENT="test-environment"
export TAVILY_API_KEY="test-tavily-key"
```

### For Integration and E2E Tests
Integration and E2E tests require real API credentials:
```bash
export OPENAI_API_KEY="your-real-openai-key"
export PINECONE_API_KEY="your-real-pinecone-key"
export PINECONE_ENVIRONMENT="your-pinecone-environment"
export TAVILY_API_KEY="your-real-tavily-key"
```

Or use a `.env` file in the project root.

## Test Fixtures

### Common Fixtures (from `conftest.py`)

- `test_settings`: Provides test configuration with mock API keys
- `mock_openai_embeddings`: Mock OpenAI embeddings client
- `mock_openai_chat`: Mock OpenAI chat client
- `mock_pinecone_index`: Mock Pinecone index
- `mock_tavily_client`: Mock Tavily search client
- `mock_vector_store`: Mock vector store manager
- `sample_documents`: Sample LangChain documents
- `sample_messages`: Sample conversation messages
- `sample_search_results`: Sample search results
- `sample_agent_state`: Sample agent state

### Using Fixtures

```python
@pytest.mark.unit
def test_example(test_settings, sample_documents):
    """Example test using fixtures."""
    processor = DocumentProcessor(test_settings)
    result = processor.process_documents(sample_documents)
    assert len(result) > 0
```

## Test Utilities

The `test_utils.py` module provides helper functions:

- `create_mock_document()`: Create mock documents
- `create_mock_messages()`: Create mock conversation messages
- `create_mock_search_result()`: Create mock search results
- `assert_document_equal()`: Assert documents are equal
- `assert_message_equal()`: Assert messages are equal
- `MockStreamingResponse`: Mock streaming responses
- `AsyncMockIterator`: Mock async iterators

## Skipping Tests

Tests that require real API credentials will automatically skip if mock credentials are detected:

```python
if test_settings.pinecone_api_key.startswith("test-"):
    pytest.skip("Skipping integration test - no real Pinecone API key")
```

## Continuous Integration

For CI/CD pipelines:

```bash
# Run only unit tests (fast, no external dependencies)
poetry run pytest -m unit --cov=src --cov-report=xml

# Run integration tests (requires test credentials)
poetry run pytest -m integration

# Run all tests
poetry run pytest --cov=src --cov-report=xml
```

## Test Coverage

View coverage report:
```bash
poetry run pytest --cov=src --cov-report=html
open htmlcov/index.html
```

Target coverage: 80%+

## Writing New Tests

### Unit Test Template

```python
import pytest
from src.module import MyClass

@pytest.mark.unit
class TestMyClass:
    """Unit tests for MyClass."""
    
    def test_basic_functionality(self, test_settings):
        """Test basic functionality."""
        obj = MyClass(test_settings)
        result = obj.method()
        assert result is not None
```

### Integration Test Template

```python
import pytest

@pytest.mark.integration
@pytest.mark.asyncio
class TestMyIntegration:
    """Integration tests for my feature."""
    
    async def test_integration(self, test_settings):
        """Test integration."""
        if test_settings.api_key.startswith("test-"):
            pytest.skip("Skipping - no real API key")
        
        # Test code here
        assert True
```

### E2E Test Template

```python
import pytest

@pytest.mark.e2e
@pytest.mark.asyncio
class TestUserWorkflow:
    """E2E tests for user workflow."""
    
    async def test_complete_workflow(self, agent):
        """Test complete user workflow."""
        # Simulate user interaction
        result = await agent.run(state)
        assert result is not None
```

## Troubleshooting

### Tests Failing Due to Missing Dependencies
```bash
poetry install
```

### Tests Failing Due to Missing API Keys
- Check your `.env` file
- Verify environment variables are set
- For unit tests, mock keys should work
- For integration/E2E tests, real keys are required

### Async Tests Not Running
Ensure `pytest-asyncio` is installed:
```bash
poetry add --group dev pytest-asyncio
```

### Import Errors
Make sure you're running tests from the project root:
```bash
cd apps/f1-slipstream-agent
poetry run pytest
```

## Best Practices

1. **Keep unit tests fast**: Use mocks for external dependencies
2. **Test one thing at a time**: Each test should verify a single behavior
3. **Use descriptive names**: Test names should describe what they test
4. **Arrange-Act-Assert**: Structure tests clearly
5. **Clean up resources**: Use fixtures for setup/teardown
6. **Mark tests appropriately**: Use `@pytest.mark.unit`, `@pytest.mark.integration`, etc.
7. **Skip expensive tests in CI**: Use markers to control which tests run where
8. **Maintain test data**: Keep test fixtures up to date
9. **Test error cases**: Don't just test happy paths
10. **Document complex tests**: Add docstrings explaining what's being tested

## Contributing

When adding new features:
1. Write unit tests first (TDD approach)
2. Add integration tests for external service interactions
3. Add E2E tests for user-facing workflows
4. Ensure all tests pass before submitting PR
5. Maintain or improve code coverage

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Pytest-asyncio Documentation](https://pytest-asyncio.readthedocs.io/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [LangChain Testing Guide](https://python.langchain.com/docs/contributing/testing)
