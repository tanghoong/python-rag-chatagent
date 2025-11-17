"""
Settings Manager Module

Centralized settings management with caching and project-based overrides.
This module provides a singleton settings manager that:
- Loads settings from environment variables
- Optionally loads from config files
- Supports per-project settings from database
- Caches settings for performance
"""
from typing import Optional, Dict
from models.settings_models import AppSettings
from config.settings_loader import load_settings


class SettingsManager:
    """
    Singleton settings manager with caching and project-based overrides
    """
    _instance: Optional['SettingsManager'] = None
    _default_settings: Optional[AppSettings] = None
    _project_settings_cache: Dict[str, AppSettings] = {}
    _config_file_path: Optional[str] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SettingsManager, cls).__new__(cls)
        return cls._instance

    def initialize(self, config_file_path: Optional[str] = None):
        """
        Initialize the settings manager

        Args:
            config_file_path: Optional path to configuration file
        """
        self._config_file_path = config_file_path
        self._default_settings = None  # Will be loaded on first access
        self._project_settings_cache = {}

    def get_default_settings(self) -> AppSettings:
        """
        Get default settings (environment + config file)

        Returns:
            Default AppSettings
        """
        if self._default_settings is None:
            self._default_settings = load_settings(
                config_file_path=self._config_file_path
            )
        return self._default_settings

    def get_project_settings(
        self,
        project_name: str,
        project_settings: Optional[AppSettings] = None
    ) -> AppSettings:
        """
        Get settings for a specific project

        Args:
            project_name: Project identifier
            project_settings: Optional project settings from database

        Returns:
            Project-specific AppSettings
        """
        # Check cache first
        if project_name in self._project_settings_cache and project_settings is None:
            return self._project_settings_cache[project_name]

        # Load and merge settings
        settings = load_settings(
            config_file_path=self._config_file_path,
            project_settings=project_settings
        )

        # Cache the result
        self._project_settings_cache[project_name] = settings

        return settings

    def invalidate_cache(self, project_name: Optional[str] = None):
        """
        Invalidate settings cache

        Args:
            project_name: Optional specific project to invalidate (None = invalidate all)
        """
        if project_name:
            self._project_settings_cache.pop(project_name, None)
        else:
            self._project_settings_cache = {}
            self._default_settings = None

    def reload_default_settings(self) -> AppSettings:
        """
        Force reload default settings from sources

        Returns:
            Reloaded default AppSettings
        """
        self._default_settings = None
        return self.get_default_settings()


# Global settings manager instance
settings_manager = SettingsManager()


def get_settings(project_name: Optional[str] = None) -> AppSettings:
    """
    Convenience function to get settings

    Args:
        project_name: Optional project identifier for project-specific settings

    Returns:
        AppSettings (default or project-specific)
    """
    if project_name:
        return settings_manager.get_project_settings(project_name)
    return settings_manager.get_default_settings()
