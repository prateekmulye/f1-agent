#!/usr/bin/env python3
"""
Configuration Validation Script

This script validates that all required environment variables are set
and that their values are valid before starting the application.

Usage:
    python scripts/validate_config.py
    python scripts/validate_config.py --env production
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

try:
    from dotenv import load_dotenv
except ImportError:
    print("Error: python-dotenv not installed. Run: pip install python-dotenv")
    sys.exit(1)


class ConfigValidator:
    """Validates environment configuration"""

    # Required environment variables
    REQUIRED_VARS = [
        "OPENAI_API_KEY",
        "PINECONE_API_KEY",
        "PINECONE_INDEX_NAME",
        "TAVILY_API_KEY",
    ]

    # Optional but recommended variables
    RECOMMENDED_VARS = [
        "OPENAI_MODEL",
        "OPENAI_EMBEDDING_MODEL",
        "PINECONE_ENVIRONMENT",
        "ENVIRONMENT",
        "LOG_LEVEL",
    ]

    # Production-specific required variables
    PRODUCTION_REQUIRED = [
        "SECRET_KEY",
        "API_CORS_ORIGINS",
    ]

    # Valid values for specific variables
    VALID_VALUES = {
        "ENVIRONMENT": ["development", "staging", "production"],
        "LOG_LEVEL": ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        "OPENAI_MODEL": [
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo",
            "gpt-3.5-turbo-16k",
        ],
        "OPENAI_EMBEDDING_MODEL": [
            "text-embedding-3-small",
            "text-embedding-3-large",
            "text-embedding-ada-002",
        ],
        "TAVILY_SEARCH_DEPTH": ["basic", "advanced"],
        "CACHE_BACKEND": ["memory", "redis"],
    }

    def __init__(self, env_file: Optional[str] = None):
        """Initialize validator and load environment"""
        if env_file:
            load_dotenv(env_file)
        else:
            load_dotenv()

        self.environment = os.getenv("ENVIRONMENT", "development")
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def validate_required_vars(self) -> None:
        """Validate that all required variables are set"""
        for var in self.REQUIRED_VARS:
            value = os.getenv(var)
            if not value:
                self.errors.append(f"Missing required variable: {var}")
            elif value.startswith("your_") or value.endswith("_here"):
                self.errors.append(
                    f"Variable {var} has placeholder value. Please set actual value."
                )

    def validate_production_vars(self) -> None:
        """Validate production-specific requirements"""
        if self.environment == "production":
            for var in self.PRODUCTION_REQUIRED:
                value = os.getenv(var)
                if not value:
                    self.errors.append(f"Missing production-required variable: {var}")

            # Check SECRET_KEY strength
            secret_key = os.getenv("SECRET_KEY")
            if secret_key and (
                len(secret_key) < 32
                or secret_key == "dev-secret-key-change-in-production"
            ):
                self.errors.append(
                    "SECRET_KEY must be at least 32 characters and not use default value"
                )

    def validate_recommended_vars(self) -> None:
        """Check for recommended variables"""
        for var in self.RECOMMENDED_VARS:
            if not os.getenv(var):
                self.warnings.append(f"Recommended variable not set: {var}")

    def validate_values(self) -> None:
        """Validate that variables have valid values"""
        for var, valid_values in self.VALID_VALUES.items():
            value = os.getenv(var)
            if value and value not in valid_values:
                self.errors.append(
                    f"Invalid value for {var}: '{value}'. "
                    f"Valid values: {', '.join(valid_values)}"
                )

    def validate_numeric_ranges(self) -> None:
        """Validate numeric configuration values"""
        numeric_checks = {
            "API_PORT": (1024, 65535),
            "UI_PORT": (1024, 65535),
            "MAX_CONVERSATION_HISTORY": (1, 100),
            "SESSION_TIMEOUT": (60, 86400),
            "OPENAI_TEMPERATURE": (0.0, 2.0),
            "OPENAI_MAX_TOKENS": (100, 8000),
            "PINECONE_TOP_K": (1, 100),
            "TAVILY_MAX_RESULTS": (1, 20),
            "MAX_RETRIES": (0, 10),
            "API_TIMEOUT": (5, 300),
        }

        for var, (min_val, max_val) in numeric_checks.items():
            value = os.getenv(var)
            if value:
                try:
                    num_value = float(value)
                    if not (min_val <= num_value <= max_val):
                        self.warnings.append(
                            f"{var} value {num_value} outside recommended range "
                            f"[{min_val}, {max_val}]"
                        )
                except ValueError:
                    self.errors.append(f"{var} must be a number, got: {value}")

    def validate_boolean_values(self) -> None:
        """Validate boolean configuration values"""
        boolean_vars = [
            "API_RELOAD",
            "LANGSMITH_TRACING",
            "STREAMLIT_HEADLESS",
            "CACHE_ENABLED",
            "API_AUTH_ENABLED",
            "METRICS_ENABLED",
            "PROFILING_ENABLED",
            "TAVILY_INCLUDE_RAW_CONTENT",
        ]

        for var in boolean_vars:
            value = os.getenv(var)
            if value and value.lower() not in ["true", "false", "1", "0", "yes", "no"]:
                self.warnings.append(
                    f"{var} should be a boolean value (true/false), got: {value}"
                )

    def validate_api_keys(self) -> None:
        """Validate API key formats"""
        api_key_checks = {
            "OPENAI_API_KEY": ("sk-", 40),
            "PINECONE_API_KEY": ("pcsk_", 40),
            "TAVILY_API_KEY": ("tvly-", 20),
        }

        for var, (prefix, min_length) in api_key_checks.items():
            value = os.getenv(var)
            if value:
                if not value.startswith(prefix):
                    self.warnings.append(
                        f"{var} doesn't start with expected prefix '{prefix}'"
                    )
                if len(value) < min_length:
                    self.warnings.append(
                        f"{var} seems too short (expected at least {min_length} chars)"
                    )

    def validate_urls(self) -> None:
        """Validate URL formats"""
        url_vars = ["API_BASE_URL", "LANGSMITH_ENDPOINT", "REDIS_URL"]

        for var in url_vars:
            value = os.getenv(var)
            if value:
                if not (
                    value.startswith("http://")
                    or value.startswith("https://")
                    or value.startswith("redis://")
                ):
                    self.warnings.append(f"{var} should be a valid URL, got: {value}")

    def validate_cors_origins(self) -> None:
        """Validate CORS configuration"""
        cors_origins = os.getenv("API_CORS_ORIGINS")
        if cors_origins:
            if self.environment == "production" and cors_origins == "*":
                self.warnings.append(
                    "API_CORS_ORIGINS is set to '*' in production. "
                    "Consider restricting to specific domains."
                )

    def run_all_validations(self) -> Tuple[List[str], List[str]]:
        """Run all validation checks"""
        self.validate_required_vars()
        self.validate_production_vars()
        self.validate_recommended_vars()
        self.validate_values()
        self.validate_numeric_ranges()
        self.validate_boolean_values()
        self.validate_api_keys()
        self.validate_urls()
        self.validate_cors_origins()

        return self.errors, self.warnings

    def print_results(self) -> bool:
        """Print validation results"""
        print("\n" + "=" * 70)
        print(f"Configuration Validation - Environment: {self.environment}")
        print("=" * 70 + "\n")

        if not self.errors and not self.warnings:
            print("✅ All configuration checks passed!")
            return True

        if self.errors:
            print(f"❌ Found {len(self.errors)} error(s):\n")
            for i, error in enumerate(self.errors, 1):
                print(f"  {i}. {error}")
            print()

        if self.warnings:
            print(f"⚠️  Found {len(self.warnings)} warning(s):\n")
            for i, warning in enumerate(self.warnings, 1):
                print(f"  {i}. {warning}")
            print()

        if self.errors:
            print("❌ Configuration validation FAILED")
            print("Please fix the errors above before starting the application.\n")
            return False
        else:
            print("⚠️  Configuration validation passed with warnings")
            print("Consider addressing the warnings above.\n")
            return True


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Validate F1-Slipstream configuration")
    parser.add_argument(
        "--env",
        choices=["development", "staging", "production"],
        help="Environment to validate (loads corresponding .env file)",
    )
    parser.add_argument(
        "--env-file",
        help="Path to specific .env file to validate",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warnings as errors",
    )

    args = parser.parse_args()

    # Determine which env file to load
    env_file = args.env_file
    if not env_file and args.env:
        env_file = f".env.{args.env}"

    # Run validation
    validator = ConfigValidator(env_file)
    errors, warnings = validator.run_all_validations()
    success = validator.print_results()

    # Exit with appropriate code
    if not success:
        sys.exit(1)
    elif args.strict and warnings:
        print("❌ Strict mode: Treating warnings as errors")
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
