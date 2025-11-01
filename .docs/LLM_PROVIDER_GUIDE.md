# LLM Provider Configuration Guide

This project now supports multiple LLM providers. You can easily switch between different AI models by configuring environment variables.

## Supported Providers

### 1. Google Gemini (Default)
- **Provider ID**: `google`
- **Default Model**: `gemini-2.0-flash-exp`
- **Other Available Models**: 
  - `gemini-2.0-flash-exp`
  - `gemini-1.5-pro`
  - `gemini-1.5-flash`

### 2. OpenAI
- **Provider ID**: `openai`
- **Default Model**: `gpt-4o-mini`
- **Other Available Models**:
  - `gpt-4o` (most capable)
  - `gpt-4o-mini` (fast and cost-effective)
  - `gpt-4-turbo`
  - `gpt-3.5-turbo`

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# LLM Provider Configuration
# Supported values: 'google' or 'openai'
LLM_PROVIDER=google

# Google Gemini API Configuration
GOOGLE_API_KEY=your_google_api_key_here

# OpenAI API Configuration (only needed if LLM_PROVIDER=openai)
OPENAI_API_KEY=your_openai_api_key_here
```

### Switching Providers

#### Option 1: Change Environment Variable (Recommended)
Edit your `.env` file:
```bash
# Use Google Gemini
LLM_PROVIDER=google

# OR use OpenAI
LLM_PROVIDER=openai
```

Then restart your backend server.

#### Option 2: Programmatic Override
You can override the provider in code:

```python
from utils.llm import get_llm

# Use Google Gemini
llm = get_llm(provider="google", model="gemini-2.0-flash-exp")

# Use OpenAI
llm = get_llm(provider="openai", model="gpt-4o-mini")
```

## Getting API Keys

### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key to your `.env` file

### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key to your `.env` file

## Model Selection

You can specify a custom model when getting the LLM instance:

```python
from utils.llm import get_llm

# Use a specific Google model
llm = get_llm(model="gemini-1.5-pro", temperature=0.3)

# Use a specific OpenAI model
llm = get_llm(model="gpt-4o", temperature=0.3, provider="openai")
```

## Testing

Test your LLM configuration:

```bash
cd backend
python -m utils.llm
```

You should see a response like:
```
✅ LLM Test Response (google): Hello, I am working!
```

## Cost Comparison

### Google Gemini Pricing (as of 2024)
- **gemini-2.0-flash-exp**: Free tier available
- **gemini-1.5-flash**: $0.075 per 1M input tokens, $0.30 per 1M output tokens
- **gemini-1.5-pro**: $1.25 per 1M input tokens, $5.00 per 1M output tokens

### OpenAI Pricing (as of 2024)
- **gpt-4o-mini**: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **gpt-4o**: $2.50 per 1M input tokens, $10.00 per 1M output tokens
- **gpt-3.5-turbo**: $0.50 per 1M input tokens, $1.50 per 1M output tokens

## Troubleshooting

### Error: API Key Not Found
Make sure your `.env` file contains the correct API key for your selected provider.

### Error: Unsupported Provider
Check that `LLM_PROVIDER` is set to either `google` or `openai` (case-insensitive).

### Import Errors
Install the required packages:
```bash
cd backend
pip install -r requirements.txt
```

## Performance Tips

1. **Cost Optimization**: Use `gpt-4o-mini` or `gemini-2.0-flash-exp` for most tasks
2. **Quality**: Use `gpt-4o` or `gemini-1.5-pro` for complex reasoning
3. **Speed**: `gemini-2.0-flash-exp` and `gpt-4o-mini` are fastest
4. **Temperature**: Lower values (0.0-0.3) for factual responses, higher (0.7-1.0) for creative tasks

## Docker Configuration

When using Docker, set environment variables in `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - LLM_PROVIDER=google
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

Or use a `.env` file that Docker Compose will automatically load.
