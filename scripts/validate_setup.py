#!/usr/bin/env python
"""Validation script to verify project setup and configuration."""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


def validate_imports() -> bool:
    """Validate that all core modules can be imported.

    Returns:
        bool: True if all imports succeed
    """
    print("Validating imports...")
    try:
        from config import Settings, get_logger, get_settings, setup_logging
        from exceptions import (AgentError, ConfigurationError,
                                F1SlipstreamError, LLMError, SearchAPIError,
                                VectorStoreError)
        from utils import retry_with_backoff

        print("✓ All core modules imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False


def validate_configuration() -> bool:
    """Validate configuration loading.

    Returns:
        bool: True if configuration is valid
    """
    print("\nValidating configuration...")
    try:
        from config import get_settings

        # This will fail if required env vars are not set
        # That's expected in a fresh setup
        try:
            settings = get_settings()
            print("✓ Configuration loaded successfully")
            print(f"  - App Name: {settings.app_name}")
            print(f"  - Environment: {settings.environment}")
            print(f"  - Log Level: {settings.log_level}")
            return True
        except Exception as e:
            print(f"⚠ Configuration validation skipped (expected in fresh setup)")
            print(f"  Reason: {str(e)[:100]}")
            print("  → Please copy .env.example to .env and configure API keys")
            return True  # Not a failure, just needs setup
    except Exception as e:
        print(f"✗ Configuration error: {e}")
        return False


def validate_logging() -> bool:
    """Validate logging setup.

    Returns:
        bool: True if logging works
    """
    print("\nValidating logging...")
    try:
        from config import get_logger

        logger = get_logger(__name__)
        logger.info("test_log_message", validation=True)
        print("✓ Logging configured successfully")
        return True
    except Exception as e:
        print(f"✗ Logging error: {e}")
        return False


def validate_exceptions() -> bool:
    """Validate exception classes.

    Returns:
        bool: True if exceptions work correctly
    """
    print("\nValidating exception classes...")
    try:
        from exceptions import ConfigurationError, F1SlipstreamError

        # Test base exception
        error = F1SlipstreamError("Test error", details={"key": "value"})
        assert error.message == "Test error"
        assert error.details == {"key": "value"}

        # Test subclass
        config_error = ConfigurationError("Config error")
        assert isinstance(config_error, F1SlipstreamError)

        print("✓ Exception classes working correctly")
        return True
    except Exception as e:
        print(f"✗ Exception validation error: {e}")
        return False


def validate_project_structure() -> bool:
    """Validate project directory structure.

    Returns:
        bool: True if structure is correct
    """
    print("\nValidating project structure...")
    base_path = Path(__file__).parent.parent

    required_dirs = [
        "src",
        "src/config",
        "src/vector_store",
        "src/search",
        "src/agent",
        "src/prompts",
        "src/tools",
        "src/ui",
        "src/api",
        "src/ingestion",
        "src/utils",
        "tests",
    ]

    required_files = [
        "README.md",
        ".env.example",
        ".gitignore",
        "requirements.txt",
        "setup.py",
        "pyproject.toml",
        "pytest.ini",
        "Dockerfile",
        "docker-compose.yml",
        "Makefile",
    ]

    all_valid = True

    for dir_path in required_dirs:
        full_path = base_path / dir_path
        if full_path.exists():
            print(f"  ✓ {dir_path}/")
        else:
            print(f"  ✗ {dir_path}/ (missing)")
            all_valid = False

    for file_path in required_files:
        full_path = base_path / file_path
        if full_path.exists():
            print(f"  ✓ {file_path}")
        else:
            print(f"  ✗ {file_path} (missing)")
            all_valid = False

    if all_valid:
        print("✓ Project structure is complete")
    else:
        print("✗ Some files or directories are missing")

    return all_valid


def main() -> int:
    """Run all validation checks.

    Returns:
        int: Exit code (0 for success, 1 for failure)
    """
    print("=" * 60)
    print("F1-Slipstream Agent - Setup Validation")
    print("=" * 60)

    checks = [
        ("Project Structure", validate_project_structure),
        ("Module Imports", validate_imports),
        ("Configuration", validate_configuration),
        ("Logging", validate_logging),
        ("Exception Classes", validate_exceptions),
    ]

    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} check failed with exception: {e}")
            results.append((name, False))

    print("\n" + "=" * 60)
    print("Validation Summary")
    print("=" * 60)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")

    all_passed = all(result for _, result in results)

    if all_passed:
        print("\n✓ All validation checks passed!")
        print("\nNext steps:")
        print("1. Copy .env.example to .env")
        print("2. Configure your API keys in .env")
        print("3. Create a virtual environment: python -m venv venv")
        print("4. Activate it: source venv/bin/activate")
        print("5. Install dependencies: pip install -r requirements.txt")
        print("6. Run tests: pytest")
        return 0
    else:
        print("\n✗ Some validation checks failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
