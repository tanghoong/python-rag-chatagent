# Settings Module Documentation

## Overview

The Settings Module provides a flexible, multi-tier configuration system for the RAG Chatbot application. It allows configuration from multiple sources with intelligent merging and project-based overrides.

## Features

✨ **3-Tier Settings Hierarchy**
- Environment Variables (base defaults)
- Configuration Files (YAML/JSON overrides)
- Project-Specific Settings (database overrides)

🔄 **Smart Caching**
- Settings cached per project for performance
- Cache invalidation on updates
- Singleton pattern for global access

📝 **Multiple Formats**
- Environment variables (.env)
- YAML configuration files
- JSON configuration files
- MongoDB storage for project settings

🎯 **Project-Based Configuration**
- Each project can have custom settings
- Settings remembered in database
- Easy switching between projects

## Architecture

```
┌─────────────────────────────────────────┐
│         Application Request             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Settings Manager (Cached)         │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
┌──────────────┐  ┌──────────────┐
│   Default    │  │   Project    │
│  Settings    │  │  Settings    │
└──────┬───────┘  └──────┬───────┘
       │                 │
  ┌────┴────┐       ┌────┴────┐
  │         │       │         │
  ▼         ▼       ▼         ▼
┌────┐   ┌────┐  ┌────┐   ┌────┐
│.env│   │YAML│  │JSON│   │ DB │
└────┘   └────┘  └────┘   └────┘
```

## Priority Order (Lowest to Highest)

1. **Environment Variables** - Base defaults
2. **Config File** (config.yaml/config.json) - Optional overrides
3. **Project Settings** (MongoDB) - Highest priority overrides

## Quick Start

### 1. Basic Usage (Environment Only)

```python
from config.settings import get_settings

# Get default settings from environment
settings = get_settings()
print(f"LLM Provider: {settings.llm.provider}")
print(f"MongoDB URI: {settings.mongodb.uri}")
```

### 2. Using Config File

```yaml
# config.yaml
llm:
  provider: "google"
  auto_switch: true

api:
  port: 9000
  host: "0.0.0.0"
```

```python
from config.settings import settings_manager

# Initialize with config file
settings_manager.initialize(config_file_path="./config.yaml")

# Get settings (env + config merged)
settings = settings_manager.get_default_settings()
```

### 3. Project-Based Settings

```python
from database.settings_repository import create_project_settings
from models.settings_models import ProjectSettingsCreate, AppSettings, LLMSettings

# Create project settings
project_data = ProjectSettingsCreate(
    project_name="my_ai_project",
    description="Custom AI project with Google Gemini",
    settings=AppSettings(
        llm=LLMSettings(
            provider="google",
            auto_switch=False
        )
    )
)

project_id = await create_project_settings(project_data)

# Use project settings
settings = get_settings(project_name="my_ai_project")
print(f"Project LLM: {settings.llm.provider}")
```

## Configuration Files

### Environment Variables (.env)

```env
# LLM Provider Configuration
LLM_PROVIDER=openai
AUTO_SWITCH_LLM=true
GOOGLE_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here

# Vector Database
VECTOR_DB_PATH=./data/vectordb
EMBEDDING_PROVIDER=openai

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rag_chatbot
DB_NAME=rag_chatbot
POSTS_COLLECTION=personal_posts
CHATS_COLLECTION=chat_sessions

# API
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### YAML Configuration (config.yaml)

```yaml
llm:
  provider: "openai"
  auto_switch: true
  google_api_key: null
  openai_api_key: null

vector_db:
  path: "./data/vectordb"
  embedding_provider: "openai"

mongodb:
  uri: "mongodb://localhost:27017/rag_chatbot"
  db_name: "rag_chatbot"
  posts_collection: "personal_posts"
  chats_collection: "chat_sessions"

api:
  host: "0.0.0.0"
  port: 8000
  cors_origins:
    - "http://localhost:5173"
    - "http://127.0.0.1:5173"
```

### JSON Configuration (config.json)

```json
{
  "llm": {
    "provider": "openai",
    "auto_switch": true
  },
  "vector_db": {
    "path": "./data/vectordb",
    "embedding_provider": "openai"
  },
  "mongodb": {
    "uri": "mongodb://localhost:27017/rag_chatbot",
    "db_name": "rag_chatbot"
  },
  "api": {
    "host": "0.0.0.0",
    "port": 8000,
    "cors_origins": ["http://localhost:5173"]
  }
}
```

## API Endpoints

### Get Default Settings
```http
GET /api/settings/default
```

Returns default settings loaded from environment and config file.

**Response:**
```json
{
  "llm": {
    "provider": "openai",
    "auto_switch": true,
    "google_api_key": null,
    "openai_api_key": null
  },
  "vector_db": {
    "path": "./data/vectordb",
    "embedding_provider": "openai"
  },
  "mongodb": {
    "uri": "mongodb://localhost:27017/rag_chatbot",
    "db_name": "rag_chatbot",
    "posts_collection": "personal_posts",
    "chats_collection": "chat_sessions"
  },
  "api": {
    "host": "0.0.0.0",
    "port": 8000,
    "cors_origins": ["http://localhost:5173"]
  }
}
```

### List Project Settings
```http
GET /api/settings/projects?include_inactive=false
```

Returns list of all project settings.

### Get Project Settings
```http
GET /api/settings/projects/{project_name}
```

Returns settings for a specific project.

### Create Project Settings
```http
POST /api/settings/projects
Content-Type: application/json

{
  "project_name": "my_project",
  "description": "My custom project",
  "settings": {
    "llm": {
      "provider": "google"
    }
  }
}
```

### Update Project Settings
```http
PUT /api/settings/projects/{project_name}
Content-Type: application/json

{
  "settings": {
    "llm": {
      "provider": "openai"
    }
  }
}
```

### Delete Project Settings
```http
DELETE /api/settings/projects/{project_name}?hard_delete=false
```

Soft delete (mark inactive) or hard delete project settings.

### Invalidate Cache
```http
POST /api/settings/cache/invalidate?project_name=my_project
```

Force reload of settings from sources.

## Code Examples

### Example 1: Simple Usage

```python
from config.settings import get_settings

# Get default settings
settings = get_settings()

# Use settings
print(f"Using {settings.llm.provider} as LLM provider")
print(f"MongoDB: {settings.mongodb.uri}")
```

### Example 2: Project-Specific Settings

```python
from config.settings import get_settings
from database.settings_repository import get_project_settings

# Get project settings from database
project = await get_project_settings("my_project")

if project:
    # Use project-specific settings
    settings = get_settings(project_name="my_project")
else:
    # Fall back to default
    settings = get_settings()
```

### Example 3: Dynamic Configuration

```python
from config.settings import settings_manager
from models.settings_models import AppSettings, LLMSettings

# Get project settings from DB
project = await settings_repository.get_project_settings("my_project")

# Get merged settings
settings = settings_manager.get_project_settings(
    project_name="my_project",
    project_settings=project.settings if project else None
)

# Update and invalidate cache
await settings_repository.update_project_settings(
    "my_project",
    ProjectSettingsUpdate(settings=new_settings)
)
settings_manager.invalidate_cache("my_project")
```

### Example 4: Testing with Custom Settings

```python
from config.settings_loader import load_settings
from models.settings_models import AppSettings, LLMSettings

# Create test settings
test_settings = AppSettings(
    llm=LLMSettings(provider="google", auto_switch=False)
)

# Load with override
settings = load_settings(
    config_file_path="./test_config.yaml",
    project_settings=test_settings
)

assert settings.llm.provider == "google"
```

## Data Models

### AppSettings
Main settings container with all configuration sections.

### LLMSettings
- `provider`: "openai" or "google"
- `auto_switch`: Enable/disable auto model switching
- `google_api_key`: Google Gemini API key
- `openai_api_key`: OpenAI API key

### VectorDBSettings
- `path`: Path to vector database
- `embedding_provider`: "openai" or "google"

### MongoDBSettings
- `uri`: MongoDB connection string
- `db_name`: Database name
- `posts_collection`: Posts collection name
- `chats_collection`: Chats collection name

### APISettings
- `host`: API server host
- `port`: API server port
- `cors_origins`: List of allowed CORS origins

## Best Practices

1. **Use Environment Variables for Secrets**
   - Never commit API keys to config files
   - Use .env for sensitive data

2. **Use Config Files for Defaults**
   - Keep common settings in config.yaml
   - Version control config.example.yaml

3. **Use Project Settings for Customization**
   - Different projects = different settings
   - Settings persist across restarts

4. **Cache Invalidation**
   - Invalidate cache after updates
   - Use specific project name when possible

5. **Partial Updates**
   - Only specify settings you want to override
   - Unspecified settings use defaults

## Testing

Run the settings module tests:

```bash
cd backend
python test_settings.py
```

Tests cover:
- Environment variable loading
- YAML/JSON file loading
- Settings merging
- Hierarchy priority
- Cache management
- Error handling

## Troubleshooting

### Issue: Settings not loading from config file
**Solution:** Check file path and format. Use absolute paths if needed.

### Issue: Project settings not taking effect
**Solution:** Invalidate cache after updating project settings.

### Issue: API keys not found
**Solution:** Ensure .env file is in backend directory and properly formatted.

### Issue: Settings merge not working as expected
**Solution:** Remember that `null` values are not merged. Only non-null values override.

## Migration Guide

### Migrating from Direct os.getenv()

**Before:**
```python
import os
llm_provider = os.getenv("LLM_PROVIDER", "openai")
```

**After:**
```python
from config.settings import get_settings
settings = get_settings()
llm_provider = settings.llm.provider
```

### Migrating to Project-Based Settings

1. Create project settings in database
2. Update code to pass project name
3. Remove hardcoded configuration

## Performance

- **First Load:** ~10-50ms (depends on config file size)
- **Cached Load:** <1ms (from memory)
- **Database Lookup:** ~5-20ms (async MongoDB query)

## Security

- API keys should be in environment variables only
- Config files should not contain secrets
- Project settings in database are application-level (not user-level)
- Use MongoDB access controls for sensitive data

## Future Enhancements

- [ ] User-level settings overrides
- [ ] Settings validation with schemas
- [ ] Settings import/export
- [ ] Settings versioning and rollback
- [ ] Real-time settings updates (WebSocket)
- [ ] Settings audit log

## Support

For issues or questions:
1. Check this documentation
2. Run test suite: `python test_settings.py`
3. Review example files: `config.example.yaml`
4. Check API documentation: `/docs` endpoint
