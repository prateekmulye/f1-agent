"""Tests for Tavily client configuration."""

import pytest

from src.config.settings import Settings


@pytest.mark.unit
def test_tavily_settings_defaults(test_settings: Settings):
    """Test that Tavily settings have correct defaults."""
    assert test_settings.tavily_max_results == 5
    assert test_settings.tavily_search_depth == "advanced"
    assert test_settings.tavily_include_answer is True
    assert test_settings.tavily_include_raw_content is True
    assert test_settings.tavily_include_images is False
    assert test_settings.tavily_max_crawl_depth == 2


@pytest.mark.unit
def test_tavily_trusted_domains(test_settings: Settings):
    """Test that trusted F1 domains are configured."""
    assert len(test_settings.tavily_include_domains) > 0
    assert "formula1.com" in test_settings.tavily_include_domains
    assert "fia.com" in test_settings.tavily_include_domains
    assert "autosport.com" in test_settings.tavily_include_domains


@pytest.mark.unit
def test_tavily_search_depth_validation():
    """Test that search depth only accepts valid values."""
    import os

    os.environ["TAVILY_SEARCH_DEPTH"] = "advanced"
    settings = Settings()
    assert settings.tavily_search_depth == "advanced"

    os.environ["TAVILY_SEARCH_DEPTH"] = "basic"
    from src.config.settings import get_settings

    get_settings.cache_clear()
    settings = Settings()
    assert settings.tavily_search_depth == "basic"


@pytest.mark.unit
def test_tavily_max_results_constraints(test_settings: Settings):
    """Test that max_results is within valid range."""
    assert 1 <= test_settings.tavily_max_results <= 10


@pytest.mark.unit
def test_tavily_crawl_depth_constraints(test_settings: Settings):
    """Test that crawl depth is within valid range."""
    assert 1 <= test_settings.tavily_max_crawl_depth <= 5
