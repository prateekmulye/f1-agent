#!/bin/bash
# Development environment setup script

set -e

echo "=========================================="
echo "F1-Slipstream Agent - Dev Environment Setup"
echo "=========================================="

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Found Python $python_version"

# Create virtual environment
echo ""
echo "Creating virtual environment..."
if [ -d "venv" ]; then
    echo "Virtual environment already exists. Skipping creation."
else
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install -r requirements.txt

# Install package in editable mode
echo ""
echo "Installing package in editable mode..."
pip install -e ".[dev]"

# Create .env if it doesn't exist
echo ""
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "⚠ Please edit .env and add your API keys"
else
    echo ".env file already exists"
fi

# Run validation
echo ""
echo "Running validation checks..."
python scripts/validate_setup.py

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys"
echo "2. Run tests: make test"
echo "3. Start development:"
echo "   - UI: make run-ui"
echo "   - API: make run-api"
echo ""
echo "To activate the virtual environment in the future:"
echo "  source venv/bin/activate"
