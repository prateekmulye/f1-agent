#!/bin/bash

# F1-Slipstream Validation Test Runner
# This script runs all validation and quality assurance tests

set -e

echo "=================================="
echo "F1-Slipstream Validation Tests"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    echo -e "${RED}Error: Must be run from apps/f1-slipstream-agent directory${NC}"
    exit 1
fi

# Check if poetry is installed
if ! command -v poetry &> /dev/null; then
    echo -e "${RED}Error: Poetry is not installed${NC}"
    echo "Install poetry: curl -sSL https://install.python-poetry.org | python3 -"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d ".venv" ] && [ ! -d "$(poetry env info -p 2>/dev/null)" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    poetry install
fi

echo -e "${GREEN}Running validation tests...${NC}"
echo ""

# Function to run tests and capture results
run_test_suite() {
    local test_file=$1
    local test_name=$2
    
    echo "----------------------------------------"
    echo "Running: $test_name"
    echo "----------------------------------------"
    
    if poetry run pytest "$test_file" -v --tb=short; then
        echo -e "${GREEN}✓ $test_name PASSED${NC}"
        return 0
    else
        echo -e "${RED}✗ $test_name FAILED${NC}"
        return 1
    fi
}

# Track results
total_suites=0
passed_suites=0

# Run Requirements Validation Tests
total_suites=$((total_suites + 1))
if run_test_suite "tests/test_requirements_validation.py" "Requirements Validation"; then
    passed_suites=$((passed_suites + 1))
fi
echo ""

# Run User Acceptance Tests
total_suites=$((total_suites + 1))
if run_test_suite "tests/test_user_acceptance.py" "User Acceptance Testing"; then
    passed_suites=$((passed_suites + 1))
fi
echo ""

# Run Performance Benchmarks
total_suites=$((total_suites + 1))
if run_test_suite "tests/test_performance_benchmarks.py" "Performance Benchmarks"; then
    passed_suites=$((passed_suites + 1))
fi
echo ""

# Summary
echo "=========================================="
echo "Validation Test Summary"
echo "=========================================="
echo "Test Suites: $passed_suites/$total_suites passed"
echo ""

if [ $passed_suites -eq $total_suites ]; then
    echo -e "${GREEN}✓ All validation tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some validation tests failed${NC}"
    exit 1
fi
