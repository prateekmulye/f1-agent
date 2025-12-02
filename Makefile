.PHONY: help install install-dev test test-unit test-integration lint format clean run-ui run-api docker-build docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  make install          Install production dependencies with Poetry"
	@echo "  make install-dev      Install all dependencies including dev"
	@echo "  make test             Run all tests"
	@echo "  make test-unit        Run unit tests only"
	@echo "  make test-integration Run integration tests only"
	@echo "  make lint             Run linters (ruff, mypy)"
	@echo "  make format           Format code with black and ruff"
	@echo "  make clean            Clean up generated files"
	@echo "  make run-ui           Run Streamlit UI"
	@echo "  make run-api          Run FastAPI backend"
	@echo "  make docker-build     Build Docker images"
	@echo "  make docker-up        Start Docker containers"
	@echo "  make docker-down      Stop Docker containers"
	@echo "  make poetry-lock      Update poetry.lock file"
	@echo "  make pre-commit       Install pre-commit hooks"

install:
	poetry install --only main

install-dev:
	poetry install --with dev

poetry-lock:
	poetry lock --no-update

pre-commit:
	poetry run pre-commit install

test:
	poetry run pytest

test-unit:
	poetry run pytest -m unit

test-integration:
	poetry run pytest -m integration

test-cov:
	poetry run pytest --cov=src --cov-report=html --cov-report=term

lint:
	poetry run ruff check src tests
	poetry run mypy src

format:
	poetry run black src tests
	poetry run ruff check --fix src tests

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf build dist htmlcov .coverage

run-ui:
	poetry run streamlit run src/ui/app.py

run-api:
	poetry run uvicorn src.api.main:app --reload

docker-build:
	docker-compose build

docker-build-prod:
	docker-compose -f docker-compose.prod.yml build

docker-up:
	docker-compose up -d

docker-up-prod:
	docker-compose -f docker-compose.prod.yml up -d

docker-down:
	docker-compose down

docker-down-prod:
	docker-compose -f docker-compose.prod.yml down

docker-logs:
	docker-compose logs -f

docker-logs-api:
	docker-compose logs -f api

docker-logs-ui:
	docker-compose logs -f ui

docker-restart:
	docker-compose restart

docker-ps:
	docker-compose ps

docker-health:
	@echo "Checking API health..."
	@curl -f http://localhost:8000/health || echo "API not healthy"
	@echo "\nChecking UI health..."
	@curl -f http://localhost:8501/_stcore/health || echo "UI not healthy"

docker-clean:
	docker-compose down -v
	docker system prune -f

docker-clean-all:
	docker-compose down -v --rmi all
	docker system prune -af --volumes

docker-shell-api:
	docker-compose exec api /bin/bash

docker-shell-ui:
	docker-compose exec ui /bin/bash
