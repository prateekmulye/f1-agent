# F1-Slipstream Agent Setup Guide

This guide will help you set up the F1-Slipstream Agent development environment.

## Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- Git
- API Keys:
  - OpenAI API key
  - Pinecone API key
  - Tavily Search API key

## Quick Start

### 1. Automated Setup (Recommended)

Run the automated setup script:

```bash
cd apps/f1-slipstream-agent
chmod +x scripts/setup_dev_env.sh
./scripts/setup_dev_env.sh
```

This script will:
- Create a virtual environment
- Install all dependencies
- Create a .env file from the template
- Run validation checks

### 2. Manual Setup

If you prefer manual setup:

#### Create Virtual Environment

```bash
cd apps/f1-slipstream-agent
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install -e ".[dev]"
```

#### Configure Environment

```bash
cp .env.example .env
# Edit .env and add your API keys
```

## Configuration

### Required Environment Variables

Edit the `.env` file and set the following required variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=f1-knowledge

# Tavily Configuration
TAVILY_API_KEY=your_tavily_api_key_here
TAVILY_MAX_RESULTS=5

# Application Configuration
APP_NAME=F1-Slipstream
LOG_LEVEL=INFO
MAX_CONVERSATION_HISTORY=10
ENVIRONMENT=development
```

### Optional Configuration

Additional settings can be configured in `.env`:

- `OPENAI_TEMPERATURE`: LLM temperature (default: 0.7)
- `VECTOR_SEARCH_TOP_K`: Number of documents to retrieve (default: 5)
- `MAX_RETRIES`: Maximum retry attempts for API calls (default: 3)
- `API_HOST`: API server host (default: 0.0.0.0)
- `API_PORT`: API server port (default: 8000)

## Validation

Verify your setup:

```bash
python scripts/validate_setup.py
```

This will check:
- Project structure
- Module imports
- Configuration loading
- Logging setup
- Exception classes

## Development

### Running Tests

```bash
# Run all tests
make test

# Run unit tests only
make test-unit

# Run integration tests only
make test-integration

# Run with coverage
pytest --cov=src --cov-report=html
```

### Code Quality

```bash
# Format code
make format

# Run linters
make lint

# Type checking
mypy src
```

### Running the Application

#### Streamlit UI

```bash
make run-ui
# Or directly:
streamlit run src/ui/app.py
```

Access at: http://localhost:8501

#### FastAPI Backend

```bash
make run-api
# Or directly:
uvicorn src.api.main:app --reload
```

Access at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Docker Development

Build and run with Docker Compose:

```bash
docker-compose up --build
```

This will start:
- API server on port 8000
- Streamlit UI on port 8501

## Project Structure

```
apps/f1-slipstream-agent/
├── src/                    # Source code
│   ├── config/            # Configuration management
│   │   ├── settings.py    # Pydantic settings
│   │   └── logging.py     # Structured logging
│   ├── vector_store/      # Pinecone integration
│   ├── search/            # Tavily search client
│   ├── agent/             # LangGraph agent
│   ├── prompts/           # Prompt templates
│   ├── tools/             # LangChain tools
│   ├── ui/                # Streamlit interface
│   ├── api/               # FastAPI endpoints
│   ├── ingestion/         # Data ingestion pipeline
│   ├── utils/             # Utility functions
│   └── exceptions.py      # Exception classes
├── tests/                 # Test suite
│   ├── conftest.py        # Pytest fixtures
│   ├── test_config.py     # Configuration tests
│   └── test_exceptions.py # Exception tests
├── scripts/               # Utility scripts
│   ├── validate_setup.py  # Setup validation
│   └── setup_dev_env.sh   # Environment setup
├── requirements.txt       # Python dependencies
├── setup.py              # Package setup
├── pyproject.toml        # Project configuration
├── pytest.ini            # Pytest configuration
├── Dockerfile            # Docker image
├── docker-compose.yml    # Docker Compose config
├── Makefile              # Development commands
├── .env.example          # Environment template
└── README.md             # Project overview
```

## Troubleshooting

### Import Errors

If you see import errors, ensure:
1. Virtual environment is activated
2. Dependencies are installed: `pip install -r requirements.txt`
3. Package is installed in editable mode: `pip install -e .`

### Configuration Errors

If configuration validation fails:
1. Check that `.env` file exists
2. Verify all required API keys are set
3. Ensure API keys don't contain placeholder values

### API Connection Errors

If API calls fail:
1. Verify API keys are valid
2. Check internet connectivity
3. Review rate limits for your API tier
4. Check logs for detailed error messages

### Docker Issues

If Docker build fails:
1. Ensure Docker is running
2. Check Docker has sufficient resources
3. Try rebuilding without cache: `docker-compose build --no-cache`

## Next Steps

After setup is complete:

1. **Review the Design Document**: See `.kiro/specs/f1-slipstream-python-rewrite/design.md`
2. **Check Requirements**: See `.kiro/specs/f1-slipstream-python-rewrite/requirements.md`
3. **Follow Implementation Plan**: See `.kiro/specs/f1-slipstream-python-rewrite/tasks.md`
4. **Start with Task 2**: Implement vector store integration

## Getting Help

- Check the [README.md](README.md) for project overview
- Review the [design document](.kiro/specs/f1-slipstream-python-rewrite/design.md)
- Run validation: `python scripts/validate_setup.py`
- Check logs in development mode for detailed error messages

## Contributing

When contributing:
1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Write tests for new features
4. Run `make format` before committing
5. Ensure `make lint` passes
6. Update documentation as needed
