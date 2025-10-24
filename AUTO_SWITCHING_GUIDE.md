# Auto-Switching LLM Feature Guide

This project includes an intelligent **Auto-Switching LLM** feature that automatically selects the most appropriate AI model based on the complexity of user queries. This optimizes both cost and response quality.

## 🎯 How It Works

The system analyzes each incoming message and automatically chooses between:

- **Fast & Cost-Effective Models** (for simple queries)
  - OpenAI: `gpt-4o-mini`
  - Google: `gemini-2.0-flash-exp`

- **High-Performance Models** (for complex queries)
  - OpenAI: `gpt-4o`
  - Google: `gemini-1.5-pro`

## 🧠 Complexity Analysis

The system evaluates multiple factors to determine query complexity:

### Complexity Levels

| Level | Description | Example Queries |
|-------|-------------|-----------------|
| **Simple** | Basic questions, greetings, simple facts | "Hello", "What is Python?", "Thanks!" |
| **Moderate** | Standard questions, explanations | "How do I use React hooks?", "Explain async/await" |
| **Complex** | Multi-step reasoning, code generation | "Design a RESTful API", "Write a binary search algorithm" |
| **Expert** | Advanced architecture, system design | "Design a scalable microservices architecture", "Optimize database performance" |

### Analysis Factors

1. **Message Length**: Word count and sentence count
2. **Question Complexity**: Number and types of questions
3. **Code Presence**: Detection of code blocks or technical syntax
4. **Keywords**: Technical terms, complexity indicators
5. **Structure**: Multi-part questions, numbered lists
6. **Technical Content**: API references, frameworks, databases

### Scoring Examples

```python
# Simple Query (Score: 0-2) -> gpt-4o-mini
"Hello, how are you?"

# Moderate Query (Score: 3-5) -> gpt-4o-mini
"What is Python and how do I get started?"

# Complex Query (Score: 6-8) -> gpt-4o
"Explain how to implement a binary search tree with insertion and deletion methods"

# Expert Query (Score: 9+) -> gpt-4o
"Design a scalable microservices architecture for an e-commerce platform with 
high availability, considering trade-offs between consistency and performance"
```

## ⚙️ Configuration

### Enable/Disable Auto-Switching

In your `.env` file:

```bash
# Enable auto-switching (recommended)
AUTO_SWITCH_LLM=true

# Disable auto-switching (use default model always)
AUTO_SWITCH_LLM=false
```

### Choose Provider

```bash
# Use OpenAI (recommended for auto-switching)
LLM_PROVIDER=openai

# Use Google Gemini
LLM_PROVIDER=google
```

### Required API Keys

You need the API key for your chosen provider:

```bash
# For OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# For Google Gemini
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxx
```

## 📊 Cost Optimization

### Example Cost Comparison

Assuming 1,000 queries per day with mixed complexity:

**Without Auto-Switching** (all on gpt-4o):
- Input: 500K tokens × $2.50 = **$1.25**
- Output: 200K tokens × $10.00 = **$2.00**
- **Daily Total: $3.25 ($97.50/month)**

**With Auto-Switching** (70% simple on gpt-4o-mini, 30% complex on gpt-4o):
- Simple (gpt-4o-mini):
  - Input: 350K × $0.15 = $0.05
  - Output: 140K × $0.60 = $0.08
- Complex (gpt-4o):
  - Input: 150K × $2.50 = $0.38
  - Output: 60K × $10.00 = $0.60
- **Daily Total: $1.11 ($33.30/month)**

**💰 Savings: 66% cost reduction**

## 🚀 Usage

### Automatic (Default)

Just use the chat endpoint normally. The system automatically handles model selection:

```python
# POST /api/chat
{
  "message": "Design a scalable API architecture",
  "chat_id": "optional_chat_id"
}

# Response includes LLM metadata
{
  "response": "Here's a scalable API architecture...",
  "chat_id": "chat_123",
  "thought_process": [...],
  "llm_metadata": {
    "auto_switched": true,
    "model": "gpt-4o",
    "provider": "openai",
    "complexity": "complex",
    "complexity_score": 8,
    "indicators": ["Long message (85 words)", "Complex keywords (3)"]
  }
}
```

### Programmatic Control

Override auto-switching in code:

```python
from utils.llm import get_smart_llm, get_llm

# Let the system decide
llm, metadata = get_smart_llm("Your complex query here")

# Force a specific model
llm = get_llm(model="gpt-4o", provider="openai")

# Force simple model for testing
llm, metadata = get_smart_llm("Any query", force_model="gpt-4o-mini")
```

## 📈 Monitoring

### LLM Metadata in Responses

Every response includes metadata about model selection:

```json
{
  "llm_metadata": {
    "auto_switched": true,
    "model": "gpt-4o-mini",
    "provider": "openai",
    "complexity": "simple",
    "complexity_score": 2,
    "indicators": [],
    "word_count": 5
  }
}
```

### Console Logs

The backend logs model selection decisions:

```
🧠 Smart LLM Selection: gpt-4o-mini (complexity: simple, score: 2)
🧠 Smart LLM Selection: gpt-4o (complexity: complex, score: 8)
```

## 🧪 Testing

### Test Complexity Analyzer

```bash
cd backend
python -m utils.complexity_analyzer
```

Expected output:
```
=== Message Complexity Analysis ===

Message: Hello, how are you?...
Complexity: simple
Recommended Model: gpt-4o-mini
Score: 1, Indicators: []

Message: Design a scalable microservices architecture...
Complexity: expert
Recommended Model: gpt-4o
Score: 11, Indicators: ['Long message (85 words)', 'Expert keywords (2)']
```

### Test Smart LLM Selection

```bash
cd backend
python -m utils.llm
```

This tests both regular LLM and smart selection with sample queries.

## 🎛️ Fine-Tuning

### Adjust Complexity Thresholds

Edit `backend/utils/complexity_analyzer.py`:

```python
# Current thresholds
if complexity_score <= 2:
    level = ComplexityLevel.SIMPLE
elif complexity_score <= 5:
    level = ComplexityLevel.MODERATE
elif complexity_score <= 8:
    level = ComplexityLevel.COMPLEX
else:
    level = ComplexityLevel.EXPERT
```

### Customize Model Selection

Edit `backend/utils/complexity_analyzer.py` → `recommend_model()`:

```python
if provider == "openai":
    model_map = {
        ComplexityLevel.SIMPLE: "gpt-4o-mini",      # Change these
        ComplexityLevel.MODERATE: "gpt-4o-mini",    # to your
        ComplexityLevel.COMPLEX: "gpt-4o",          # preferred
        ComplexityLevel.EXPERT: "gpt-4o"            # models
    }
```

### Add Custom Keywords

Add domain-specific keywords to trigger complexity detection:

```python
# In complexity_analyzer.py
EXPERT_KEYWORDS = [
    "system design", "scalability",
    # Add your domain-specific terms
    "neural network", "data pipeline", "ETL"
]
```

## 🔍 Troubleshooting

### Auto-Switching Not Working

1. Check `AUTO_SWITCH_LLM=true` in `.env`
2. Verify API keys are set correctly
3. Check console logs for selection decisions
4. Test complexity analyzer independently

### All Queries Use Same Model

- Queries may genuinely be similar complexity
- Check complexity scores in response metadata
- Adjust thresholds if needed

### High Costs Despite Auto-Switching

- Review query distribution in logs
- Most queries may be legitimately complex
- Consider adjusting complexity thresholds
- Monitor `llm_metadata` in responses

## 🎯 Best Practices

1. **Enable Auto-Switching**: Use `AUTO_SWITCH_LLM=true` for production
2. **Monitor Metadata**: Track model selection patterns
3. **Adjust Thresholds**: Fine-tune based on your use case
4. **Use OpenAI**: Better model variety for auto-switching
5. **Review Logs**: Check selection decisions regularly

## 📝 Example Scenarios

### Scenario 1: Customer Support Chatbot
- 80% simple queries (greetings, FAQs) → gpt-4o-mini
- 20% complex issues → gpt-4o
- **Cost savings: ~70%**

### Scenario 2: Code Assistant
- 40% simple queries (syntax, definitions) → gpt-4o-mini
- 60% complex queries (debugging, architecture) → gpt-4o
- **Cost savings: ~40%**

### Scenario 3: Research Assistant
- 30% simple queries (facts, definitions) → gpt-4o-mini
- 70% complex queries (analysis, synthesis) → gpt-4o
- **Cost savings: ~25%**

## 🔗 Related Files

- `/backend/utils/llm.py` - LLM configuration and smart selection
- `/backend/utils/complexity_analyzer.py` - Message complexity analysis
- `/backend/agents/chat_agent.py` - Agent integration
- `/backend/api/main.py` - API endpoints with metadata

## 📚 Additional Resources

- [OpenAI Pricing](https://openai.com/pricing)
- [Google AI Pricing](https://ai.google.dev/pricing)
- [LangChain Documentation](https://python.langchain.com/docs/get_started/introduction)
