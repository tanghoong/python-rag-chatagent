"""
Tests for Settings Module

Tests settings loader, settings manager, and project-based settings.
"""
import os
import sys
import json
import yaml
import tempfile

# Add backend to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.settings_models import (  # noqa: E402
    AppSettings,
    LLMSettings,
    MongoDBSettings,
    APISettings
)
from config.settings_loader import (  # noqa: E402
    load_from_env,
    load_from_yaml_file,
    load_from_json_file,
    merge_settings,
    load_settings
)
from config.settings import SettingsManager  # noqa: E402


def test_load_from_env():
    """Test loading settings from environment variables"""
    print("\n=== Test: Load from Environment ===")

    settings = load_from_env()

    print(f"LLM Provider: {settings.llm.provider}")
    print(f"MongoDB URI: {settings.mongodb.uri}")
    print(f"API Port: {settings.api.port}")
    print(f"Vector DB Path: {settings.vector_db.path}")

    assert isinstance(settings, AppSettings)
    assert isinstance(settings.llm, LLMSettings)
    assert isinstance(settings.mongodb, MongoDBSettings)
    print("✅ Environment settings loaded successfully")


def test_load_from_yaml():
    """Test loading settings from YAML file"""
    print("\n=== Test: Load from YAML ===")

    # Create temporary YAML file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        yaml_content = {
            "llm": {
                "provider": "google",
                "auto_switch": False
            },
            "api": {
                "port": 9000
            }
        }
        yaml.dump(yaml_content, f)
        yaml_path = f.name

    try:
        settings = load_from_yaml_file(yaml_path)

        assert settings is not None
        assert settings.llm.provider == "google"
        assert settings.llm.auto_switch is False
        assert settings.api.port == 9000

        print(f"YAML LLM Provider: {settings.llm.provider}")
        print(f"YAML API Port: {settings.api.port}")
        print("✅ YAML settings loaded successfully")
    finally:
        os.unlink(yaml_path)


def test_load_from_json():
    """Test loading settings from JSON file"""
    print("\n=== Test: Load from JSON ===")

    # Create temporary JSON file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json_content = {
            "llm": {
                "provider": "openai",
                "auto_switch": True
            },
            "mongodb": {
                "uri": "mongodb://testhost:27017/testdb"
            }
        }
        json.dump(json_content, f)
        json_path = f.name

    try:
        settings = load_from_json_file(json_path)

        assert settings is not None
        assert settings.llm.provider == "openai"
        assert settings.mongodb.uri == "mongodb://testhost:27017/testdb"

        print(f"JSON LLM Provider: {settings.llm.provider}")
        print(f"JSON MongoDB URI: {settings.mongodb.uri}")
        print("✅ JSON settings loaded successfully")
    finally:
        os.unlink(json_path)


def test_merge_settings():
    """Test merging two settings objects"""
    print("\n=== Test: Merge Settings ===")

    base = AppSettings(
        llm=LLMSettings(provider="openai", auto_switch=True),
        api=APISettings(port=8000)
    )

    override = AppSettings(
        llm=LLMSettings(provider="google"),  # Override provider
        api=APISettings(port=9000)  # Override port
    )

    merged = merge_settings(base, override)

    print(f"Base Provider: {base.llm.provider}, Port: {base.api.port}")
    print(f"Override Provider: {override.llm.provider}, Port: {override.api.port}")
    print(f"Merged Provider: {merged.llm.provider}, Port: {merged.api.port}")

    assert merged.llm.provider == "google"  # Should use override
    assert merged.api.port == 9000  # Should use override
    print("✅ Settings merged successfully")


def test_settings_hierarchy():
    """Test settings hierarchy: env -> config -> project"""
    print("\n=== Test: Settings Hierarchy ===")

    # Create temporary config file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        yaml_content = {
            "llm": {"provider": "google"},
            "api": {"port": 9000}
        }
        yaml.dump(yaml_content, f)
        config_path = f.name

    try:
        # Load with config file (env + config)
        settings_with_config = load_settings(config_file_path=config_path)

        print(f"With config - Provider: {settings_with_config.llm.provider}")
        print(f"With config - Port: {settings_with_config.api.port}")

        # Create project override
        project_override = AppSettings(
            llm=LLMSettings(provider="openai"),  # Override back to openai
            api=APISettings(port=7000)  # Override to 7000
        )

        # Load with project settings (env + config + project)
        settings_with_project = load_settings(
            config_file_path=config_path,
            project_settings=project_override
        )

        print(f"With project - Provider: {settings_with_project.llm.provider}")
        print(f"With project - Port: {settings_with_project.api.port}")

        assert settings_with_project.llm.provider == "openai"
        assert settings_with_project.api.port == 7000
        print("✅ Settings hierarchy works correctly")
    finally:
        os.unlink(config_path)


def test_settings_manager():
    """Test SettingsManager singleton and caching"""
    print("\n=== Test: Settings Manager ===")

    manager = SettingsManager()
    manager.initialize()

    # Get default settings
    default = manager.get_default_settings()
    print(f"Default Provider: {default.llm.provider}")

    # Get project settings (should cache)
    project_settings = AppSettings(
        llm=LLMSettings(provider="google")
    )
    project1 = manager.get_project_settings("project1", project_settings)
    print(f"Project1 Provider: {project1.llm.provider}")

    # Get same project again (should use cache)
    project1_cached = manager.get_project_settings("project1")
    print(f"Project1 Cached Provider: {project1_cached.llm.provider}")

    assert project1_cached.llm.provider == "google"

    # Invalidate cache
    manager.invalidate_cache("project1")
    print("✅ Settings manager works correctly")


def test_nonexistent_files():
    """Test handling of non-existent config files"""
    print("\n=== Test: Non-existent Files ===")

    yaml_settings = load_from_yaml_file("nonexistent.yaml")
    json_settings = load_from_json_file("nonexistent.json")

    assert yaml_settings is None
    assert json_settings is None
    print("✅ Non-existent files handled correctly")


def main():
    """Run all tests"""
    print("=" * 60)
    print("Settings Module Tests")
    print("=" * 60)

    try:
        test_load_from_env()
        test_load_from_yaml()
        test_load_from_json()
        test_merge_settings()
        test_settings_hierarchy()
        test_settings_manager()
        test_nonexistent_files()

        print("\n" + "=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        raise
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        raise


if __name__ == "__main__":
    main()
