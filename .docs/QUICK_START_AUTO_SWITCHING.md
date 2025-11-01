# Quick Start: Auto-Switching LLM Setup

## Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Step 2: Configure Environment

Create or update `.env` file in `/backend`:

```bash
# LLM Provider (openai recommended for auto-switching)
LLM_PROVIDER=openai

# Enable intelligent auto-switching
AUTO_SWITCH_LLM=true

# Add your API key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# MongoDB (existing)
MONGODB_URI=mongodb://localhost:27017/rag_chatbot
```

## Step 3: Test the Feature

```bash
# Test complexity analyzer
py -m utils.complexity_analyzer

# Test smart LLM selection
py -m utils.llm

# Start the backend
py api/main.py
```

## Step 4: See It In Action

Send a chat request and check the response metadata:

```json
POST /api/chat
{
  "message": "Design a scalable API architecture"
}

Response:
{
  "response": "...",
  "llm_metadata": {
    "auto_switched": true,
    "model": "gpt-4o",          // Auto-selected for complex query
    "complexity": "complex",
    "complexity_score": 8
  }
}
```

## How It Works

1. **Simple queries** (greetings, basic questions) → `gpt-4o-mini` (fast & cheap)
2. **Complex queries** (code, architecture, debugging) → `gpt-4o` (high quality)
3. **Automatic detection** - no configuration needed!

## Cost Savings

- **Without auto-switching**: $97.50/month (all gpt-4o)
- **With auto-switching**: $33.30/month (mix of models)
- **💰 Save 66%** on API costs!

## Monitoring

Check backend logs for selection decisions:

```
🧠 Smart LLM Selection: gpt-4o-mini (complexity: simple, score: 2)
🧠 Smart LLM Selection: gpt-4o (complexity: complex, score: 8)
```

## Full Documentation

- [AUTO_SWITCHING_GUIDE.md](./AUTO_SWITCHING_GUIDE.md) - Complete feature guide
- [LLM_PROVIDER_GUIDE.md](./LLM_PROVIDER_GUIDE.md) - Multi-provider setup

## Disable Auto-Switching

To always use a fixed model:

```bash
AUTO_SWITCH_LLM=false
```
