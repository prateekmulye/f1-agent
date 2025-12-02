# Validation Testing Quick Reference

## Overview

This directory contains comprehensive validation tests for the F1-Slipstream agent system.

## Test Files

### 1. test_requirements_validation.py
**Purpose**: Validate all 12 requirements and their acceptance criteria

**Coverage**:
- 25 test cases
- All requirements from requirements.md
- Functional and non-functional requirements
- Performance criteria validation

**Run**:
```bash
poetry run pytest tests/test_requirements_validation.py -v
```

### 2. test_user_acceptance.py
**Purpose**: Test real F1 queries and user scenarios

**Coverage**:
- 35 test cases
- Real F1 query scenarios
- Conversation quality
- Edge cases and error handling
- UI/UX quality
- Integration testing

**Run**:
```bash
poetry run pytest tests/test_user_acceptance.py -v
```

### 3. test_performance_benchmarks.py
**Purpose**: Measure and validate performance metrics

**Coverage**:
- 30 test cases
- Response time percentiles (P50, P95, P99)
- Concurrent load testing (10, 50, 100 users)
- API latency measurements
- Memory usage profiling
- Throughput and scalability

**Run**:
```bash
poetry run pytest tests/test_performance_benchmarks.py -v
```

## Quick Start

### 1. Install Dependencies

```bash
cd apps/f1-slipstream-agent
poetry install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys (for integration tests)
```

### 3. Run All Validation Tests

```bash
# Using the automated script
./scripts/run_validation.sh

# Or manually
poetry run pytest tests/test_requirements_validation.py tests/test_user_acceptance.py tests/test_performance_benchmarks.py -v
```

### 4. Run with Coverage

```bash
poetry run pytest tests/test_requirements_validation.py tests/test_user_acceptance.py tests/test_performance_benchmarks.py --cov=src --cov-report=html

# View coverage report
open htmlcov/index.html
```

## Test Organization

### By Requirement
```bash
# Test specific requirement
poetry run pytest tests/test_requirements_validation.py::TestRequirement1CurrentData -v
poetry run pytest tests/test_requirements_validation.py::TestRequirement2HistoricalData -v
# ... etc
```

### By User Scenario
```bash
# Test real F1 queries
poetry run pytest tests/test_user_acceptance.py::TestRealF1Queries -v

# Test conversation quality
poetry run pytest tests/test_user_acceptance.py::TestConversationQuality -v

# Test edge cases
poetry run pytest tests/test_user_acceptance.py::TestEdgeCases -v
```

### By Performance Aspect
```bash
# Test response times
poetry run pytest tests/test_performance_benchmarks.py::TestResponseTimePercentiles -v

# Test concurrent load
poetry run pytest tests/test_performance_benchmarks.py::TestConcurrentUserLoad -v

# Test memory usage
poetry run pytest tests/test_performance_benchmarks.py::TestMemoryUsage -v
```

## Test Markers

Tests can be filtered by markers:

```bash
# Run only unit tests
poetry run pytest -m unit

# Run only integration tests
poetry run pytest -m integration

# Run only e2e tests
poetry run pytest -m e2e

# Skip slow tests
poetry run pytest -m "not slow"
```

## Common Commands

```bash
# Run tests with verbose output
poetry run pytest tests/ -v

# Run tests with short traceback
poetry run pytest tests/ --tb=short

# Run tests and stop on first failure
poetry run pytest tests/ -x

# Run tests in parallel (requires pytest-xdist)
poetry run pytest tests/ -n auto

# Run specific test function
poetry run pytest tests/test_requirements_validation.py::TestRequirement1CurrentData::test_1_1_tavily_retrieval_within_3_seconds -v

# Run tests matching pattern
poetry run pytest tests/ -k "tavily"

# Show test durations
poetry run pytest tests/ --durations=10
```

## Troubleshooting

### Import Errors

If you see import errors:
```bash
# Ensure dependencies are installed
poetry install

# Verify Python path
poetry run python -c "import src; print(src.__file__)"
```

### Missing API Keys

For integration tests that require real APIs:
```bash
# Set environment variables
export OPENAI_API_KEY="your-key"
export PINECONE_API_KEY="your-key"
export TAVILY_API_KEY="your-key"

# Or use .env file
cp .env.example .env
# Edit .env with your keys
```

### Dependency Conflicts

If you encounter dependency conflicts:
```bash
# Update dependencies
poetry update

# Or reinstall from scratch
rm -rf .venv poetry.lock
poetry install
```

## Performance Targets

When running performance benchmarks, these are the expected targets:

| Metric | Target |
|--------|--------|
| Response time P95 | < 3 seconds |
| Vector search latency | < 500ms |
| Tavily search latency | < 2 seconds |
| Concurrent users | 100+ |
| Memory per instance | < 2GB |
| Queries per second | >= 10 |

## Documentation

For more details, see:
- **VALIDATION_SUMMARY.md** - Comprehensive test suite documentation
- **VALIDATION_REPORT.md** - Validation status and results report
- **../docs/DEVELOPER_GUIDE.md** - Developer documentation

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run validation tests
  run: |
    cd apps/f1-slipstream-agent
    poetry install
    poetry run pytest tests/test_requirements_validation.py tests/test_user_acceptance.py tests/test_performance_benchmarks.py -v
```

## Support

For issues or questions:
1. Check the VALIDATION_SUMMARY.md for detailed test documentation
2. Review the VALIDATION_REPORT.md for known issues
3. Check test output for specific error messages
4. Ensure all dependencies are properly installed

---

**Total Test Coverage**: 90+ test cases across all validation areas
