"""
Integration test for Settings Module with API

Tests that the settings module integrates correctly with the API structure
without requiring full backend dependencies.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_models_import():
    """Test that settings models import correctly"""
    print("\n=== Test: Models Import ===")
    from models.settings_models import (  # noqa: F401
        AppSettings,
        LLMSettings,
        ProjectSettings,
        ProjectSettingsCreate,
        ProjectSettingsUpdate
    )
    print("✅ All settings models imported successfully")


def test_loader_import():
    """Test that settings loader imports correctly"""
    print("\n=== Test: Loader Import ===")
    from config.settings_loader import (  # noqa: F401
        load_from_env,
        load_settings,
        merge_settings
    )
    print("✅ Settings loader imported successfully")


def test_settings_manager_import():
    """Test that settings manager imports correctly"""
    print("\n=== Test: Settings Manager Import ===")
    from config.settings import settings_manager, get_settings  # noqa: F401
    print("✅ Settings manager imported successfully")


def test_repository_import():
    """Test that settings repository imports correctly"""
    print("\n=== Test: Repository Import ===")
    from database.settings_repository import (  # noqa: F401
        create_project_settings,
        get_project_settings,
        list_project_settings
    )
    print("✅ Settings repository imported successfully")


def test_config_module():
    """Test the config module __init__.py"""
    print("\n=== Test: Config Module ===")
    from config import settings_manager, get_settings, load_settings  # noqa: F401
    print("✅ Config module exports work correctly")


def test_settings_instantiation():
    """Test that settings can be instantiated"""
    print("\n=== Test: Settings Instantiation ===")
    from models.settings_models import AppSettings, LLMSettings

    settings = AppSettings(
        llm=LLMSettings(provider="openai", auto_switch=True)
    )

    assert settings.llm.provider == "openai"
    assert settings.llm.auto_switch is True
    print(f"Created settings: {settings.llm.provider}")
    print("✅ Settings instantiation works")


def test_loader_functionality():
    """Test basic loader functionality"""
    print("\n=== Test: Loader Functionality ===")
    from config.settings_loader import load_from_env

    settings = load_from_env()
    assert settings.llm.provider in ["openai", "google"]
    assert isinstance(settings.api.port, int)

    print(f"Loaded settings - Provider: {settings.llm.provider}, Port: {settings.api.port}")
    print("✅ Loader functionality works")


def test_settings_manager_functionality():
    """Test basic settings manager functionality"""
    print("\n=== Test: Manager Functionality ===")
    from config.settings import SettingsManager

    manager = SettingsManager()
    manager.initialize()

    default_settings = manager.get_default_settings()
    assert default_settings is not None

    print(f"Manager default settings: {default_settings.llm.provider}")
    print("✅ Settings manager functionality works")


def test_pydantic_validation():
    """Test Pydantic validation on models"""
    print("\n=== Test: Pydantic Validation ===")
    from models.settings_models import LLMSettings

    # Valid settings
    valid = LLMSettings(provider="openai")
    assert valid.provider == "openai"

    # Test default values
    assert valid.auto_switch is True  # Default value

    print(f"Valid settings created: {valid.provider}")
    print("✅ Pydantic validation works")


def main():
    """Run all integration tests"""
    print("=" * 60)
    print("Settings Module Integration Tests")
    print("=" * 60)

    try:
        test_models_import()
        test_loader_import()
        test_settings_manager_import()
        test_repository_import()
        test_config_module()
        test_settings_instantiation()
        test_loader_functionality()
        test_settings_manager_functionality()
        test_pydantic_validation()

        print("\n" + "=" * 60)
        print("✅ All integration tests passed!")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    main()
