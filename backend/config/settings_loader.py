"""
Settings Loader Module

Loads settings from multiple sources with priority:
1. Environment Variables (lowest priority - defaults)
2. Config File (medium priority - optional)
3. Project Settings from DB (highest priority - overrides)

This module provides a flexible configuration system that allows:
- Default settings from environment variables
- Optional configuration file (YAML/JSON)
- Per-project settings stored in database
"""
import os
import json
import yaml
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

from models.settings_models import (
    AppSettings,
    LLMSettings,
    VectorDBSettings,
    MongoDBSettings,
    APISettings
)

# Load environment variables
load_dotenv()


def load_from_env() -> AppSettings:
    """
    Load settings from environment variables

    Returns:
        AppSettings with values from environment
    """
    # LLM Settings
    llm = LLMSettings(
        provider=os.getenv("LLM_PROVIDER", "openai").lower(),
        auto_switch=os.getenv("AUTO_SWITCH_LLM", "true").lower() == "true",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

    # Vector DB Settings
    vector_db = VectorDBSettings(
        path=os.getenv("VECTOR_DB_PATH", "./data/vectordb"),
        embedding_provider=os.getenv("EMBEDDING_PROVIDER", "openai").lower()
    )

    # MongoDB Settings
    mongodb = MongoDBSettings(
        uri=os.getenv("MONGODB_URI", "mongodb://localhost:27017/rag_chatbot"),
        db_name=os.getenv("DB_NAME", "rag_chatbot"),
        posts_collection=os.getenv("POSTS_COLLECTION", "personal_posts"),
        chats_collection=os.getenv("CHATS_COLLECTION", "chat_sessions")
    )

    # API Settings
    cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

    api = APISettings(
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", "8000")),
        cors_origins=cors_origins
    )

    return AppSettings(
        llm=llm,
        vector_db=vector_db,
        mongodb=mongodb,
        api=api
    )


def load_from_yaml_file(file_path: str) -> Optional[AppSettings]:
    """
    Load settings from YAML configuration file

    Args:
        file_path: Path to YAML config file

    Returns:
        AppSettings or None if file not found/invalid
    """
    path = Path(file_path)
    if not path.exists():
        return None

    try:
        with open(path, 'r') as f:
            config_data = yaml.safe_load(f)

        if not config_data:
            return None

        return AppSettings(**config_data)
    except Exception as e:
        print(f"Error loading YAML config: {e}")
        return None


def load_from_json_file(file_path: str) -> Optional[AppSettings]:
    """
    Load settings from JSON configuration file

    Args:
        file_path: Path to JSON config file

    Returns:
        AppSettings or None if file not found/invalid
    """
    path = Path(file_path)
    if not path.exists():
        return None

    try:
        with open(path, 'r') as f:
            config_data = json.load(f)

        return AppSettings(**config_data)
    except Exception as e:
        print(f"Error loading JSON config: {e}")
        return None


def load_from_config_file(
    yaml_path: str = "./config.yaml",
    json_path: str = "./config.json"
) -> Optional[AppSettings]:
    """
    Load settings from configuration file (tries YAML first, then JSON)

    Args:
        yaml_path: Path to YAML config file
        json_path: Path to JSON config file

    Returns:
        AppSettings or None if no config file found
    """
    # Try YAML first
    settings = load_from_yaml_file(yaml_path)
    if settings:
        return settings

    # Fall back to JSON
    settings = load_from_json_file(json_path)
    if settings:
        return settings

    return None


def merge_settings(base: AppSettings, override: AppSettings) -> AppSettings:
    """
    Merge two settings objects, with override taking precedence

    Args:
        base: Base settings
        override: Override settings (takes precedence)

    Returns:
        Merged AppSettings
    """
    # Convert to dicts
    base_dict = base.model_dump()
    override_dict = override.model_dump()

    # Deep merge
    def deep_merge(d1: Dict[Any, Any], d2: Dict[Any, Any]) -> Dict[Any, Any]:
        result = d1.copy()
        for key, value in d2.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = deep_merge(result[key], value)
            else:
                # Only override if the value is not None or is explicitly set
                if value is not None:
                    result[key] = value
        return result

    merged_dict = deep_merge(base_dict, override_dict)

    return AppSettings(**merged_dict)


def load_settings(
    config_file_path: Optional[str] = None,
    project_settings: Optional[AppSettings] = None
) -> AppSettings:
    """
    Load settings with priority hierarchy:
    1. Environment Variables (base defaults)
    2. Config File (optional overrides)
    3. Project Settings (highest priority overrides)

    Args:
        config_file_path: Optional path to config file
        project_settings: Optional project-specific settings from database

    Returns:
        Final merged AppSettings
    """
    # Start with environment variables
    settings = load_from_env()

    # Override with config file if provided
    if config_file_path:
        file_settings = load_from_config_file(
            yaml_path=config_file_path,
            json_path=config_file_path
        )
        if file_settings:
            settings = merge_settings(settings, file_settings)

    # Override with project settings if provided
    if project_settings:
        settings = merge_settings(settings, project_settings)

    return settings
