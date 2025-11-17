"""
Settings Module Demo

This script demonstrates the settings module functionality.
Run this to see how the 3-tier settings hierarchy works.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.settings_loader import load_from_env, load_settings
from models.settings_models import AppSettings, LLMSettings, APISettings


def print_section(title):
    """Print a formatted section header"""
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)


def demo_environment_settings():
    """Demo: Load settings from environment variables"""
    print_section("1. Environment Variables (Base Defaults)")

    settings = load_from_env()

    print("\n📋 Settings loaded from environment:")
    print(f"   LLM Provider: {settings.llm.provider}")
    print(f"   Auto Switch: {settings.llm.auto_switch}")
    print(f"   API Port: {settings.api.port}")
    print(f"   API Host: {settings.api.host}")
    print(f"   MongoDB URI: {settings.mongodb.uri}")
    print(f"   Vector DB Path: {settings.vector_db.path}")

    print("\n✅ Environment settings loaded successfully")
    return settings


def demo_config_file_override():
    """Demo: Show how config file would override env settings"""
    print_section("2. Config File Overrides (Medium Priority)")

    print("\n📄 If you had a config.yaml file with:")
    print("""
    llm:
      provider: "google"
      auto_switch: false
    api:
      port: 9000
    """)

    print("\n🔄 These would override the environment settings:")
    print("   LLM Provider: openai → google")
    print("   Auto Switch: true → false")
    print("   API Port: 8000 → 9000")
    print("\n💡 To use: Create config.yaml and restart the app")


def demo_project_settings():
    """Demo: Show how project settings would work"""
    print_section("3. Project Settings (Highest Priority)")

    print("\n🎯 Project-based settings stored in MongoDB:")
    print("\n   Project: 'ai_research'")
    print("   Settings: {")
    print("     llm: { provider: 'google', auto_switch: true },")
    print("     api: { port: 7000 }")
    print("   }")

    print("\n🔄 Final settings for 'ai_research' project:")
    print("   LLM Provider: google  (from project)")
    print("   Auto Switch: true     (from project)")
    print("   API Port: 7000        (from project)")
    print("   API Host: 0.0.0.0     (from environment)")
    print("   MongoDB URI: ...      (from environment)")

    print("\n💡 To create project settings:")
    print("   POST /api/settings/projects")


def demo_hierarchy():
    """Demo: Show the complete hierarchy"""
    print_section("Settings Hierarchy Summary")

    print("""
    ┌─────────────────────────────────────────────────────────┐
    │                  Settings Priority                      │
    ├─────────────────────────────────────────────────────────┤
    │                                                         │
    │  1. Environment Variables (.env)      [Lowest]         │
    │     └─ Base defaults for all projects                  │
    │                                                         │
    │  2. Config File (config.yaml/json)    [Medium]         │
    │     └─ Optional overrides for deployment               │
    │                                                         │
    │  3. Project Settings (MongoDB)        [Highest]        │
    │     └─ Per-project custom settings                     │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
    """)


def demo_code_examples():
    """Demo: Show code examples"""
    print_section("Code Usage Examples")

    print("\n1️⃣  Get default settings:")
    print("""
    from config.settings import get_settings
    
    settings = get_settings()
    print(settings.llm.provider)
    """)

    print("\n2️⃣  Get project-specific settings:")
    print("""
    from config.settings import get_settings
    
    settings = get_settings(project_name="my_project")
    print(settings.llm.provider)
    """)

    print("\n3️⃣  Create project via API:")
    print("""
    curl -X POST http://localhost:8000/api/settings/projects \\
      -H "Content-Type: application/json" \\
      -d '{
        "project_name": "my_project",
        "settings": {
          "llm": {"provider": "google"}
        }
      }'
    """)


def demo_api_endpoints():
    """Demo: Show available API endpoints"""
    print_section("Available API Endpoints")

    endpoints = [
        ("GET", "/api/settings/default", "Get default settings"),
        ("GET", "/api/settings/projects", "List all projects"),
        ("GET", "/api/settings/projects/{name}", "Get project settings"),
        ("POST", "/api/settings/projects", "Create project"),
        ("PUT", "/api/settings/projects/{name}", "Update project"),
        ("DELETE", "/api/settings/projects/{name}", "Delete project"),
        ("POST", "/api/settings/cache/invalidate", "Clear cache"),
    ]

    print("\n📡 Settings Management API:")
    for method, path, description in endpoints:
        print(f"   {method:6} {path:35} - {description}")

    print("\n💡 Start server: python api/main.py")
    print("💡 View docs: http://localhost:8000/docs")


def main():
    """Run all demonstrations"""
    print("\n" + "▓" * 60)
    print("▓" + " " * 58 + "▓")
    print("▓" + "  Settings Module Demo".center(58) + "▓")
    print("▓" + " " * 58 + "▓")
    print("▓" * 60)

    demo_environment_settings()
    demo_config_file_override()
    demo_project_settings()
    demo_hierarchy()
    demo_code_examples()
    demo_api_endpoints()

    print("\n" + "=" * 60)
    print(" ✅ Demo Complete!")
    print("=" * 60)
    print("\n📚 For full documentation, see: SETTINGS_README.md")
    print("🧪 To run tests: python test_settings.py")
    print("🚀 To start API: cd api && python main.py\n")


if __name__ == "__main__":
    main()
