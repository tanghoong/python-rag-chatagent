# Auto-Switching LLM - Visual Flow Diagram

```
User Query
    |
    v
┌─────────────────────────────────────────┐
│   Complexity Analyzer                   │
│   (/backend/utils/complexity_analyzer)  │
│                                         │
│   Analyzes:                             │
│   • Message length                      │
│   • Keywords & technical terms          │
│   • Code presence                       │
│   • Question complexity                 │
│   • Multi-part structure                │
└──────────────┬──────────────────────────┘
               |
               v
        Complexity Score
         (0-12+ scale)
               |
    ┌──────────┴──────────┐
    |                     |
    v                     v
┌────────────┐      ┌────────────┐
│  Simple    │      │  Complex   │
│  Score 0-5 │      │  Score 6+  │
└──────┬─────┘      └──────┬─────┘
       |                   |
       v                   v
┌─────────────┐      ┌─────────────┐
│ gpt-4o-mini │      │   gpt-4o    │
│   Fast &    │      │   High      │
│ Cheap       │      │   Quality   │
│             │      │             │
│ $0.15 input │      │ $2.50 input │
│ $0.60 output│      │ $10.0 output│
└──────┬──────┘      └──────┬──────┘
       |                   |
       └──────────┬────────┘
                  v
          ┌─────────────────┐
          │  Chat Agent     │
          │  Creates agent  │
          │  with selected  │
          │  LLM            │
          └────────┬────────┘
                   v
          ┌─────────────────┐
          │   API Response  │
          │                 │
          │   + response    │
          │   + metadata    │
          │   + thought     │
          └─────────────────┘
```

## Example Flow: Simple Query

```
Input: "Hello, how are you?"
  ↓
Analyzer:
  • Word count: 4 (Score: 0)
  • Simple keyword: "hello" (Score: -1)
  • No code (Score: 0)
  • Total Score: 1
  ↓
Classification: SIMPLE
  ↓
Model Selected: gpt-4o-mini
  ↓
Response: "Hello! I'm doing well, thank you for asking..."
  ↓
Metadata: {
  "model": "gpt-4o-mini",
  "complexity": "simple",
  "score": 1
}
```

## Example Flow: Complex Query

```
Input: "Design a scalable microservices architecture for an 
       e-commerce platform with high availability. Include 
       load balancing, database sharding, and CI/CD pipeline."
  ↓
Analyzer:
  • Word count: 85 (Score: 3)
  • Expert keywords: "scalability", "microservices" (Score: 4)
  • Technical terms: "database", "CI/CD" (Score: 2)
  • Total Score: 11
  ↓
Classification: EXPERT
  ↓
Model Selected: gpt-4o
  ↓
Response: [Detailed architecture design with trade-offs...]
  ↓
Metadata: {
  "model": "gpt-4o",
  "complexity": "expert",
  "score": 11,
  "indicators": [
    "Long message (85 words)",
    "Expert keywords (2)",
    "Technical terms (4)"
  ]
}
```

## Cost Impact Visualization

```
WITHOUT Auto-Switching (1000 queries/day)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ $97.50/month
All on gpt-4o

WITH Auto-Switching (1000 queries/day)
━━━━━━━━━━━━━━ $33.30/month
70% gpt-4o-mini ████████████████████████ $9.75
30% gpt-4o      ████████ $23.55

SAVINGS: $64.20/month (66%)
```

## Query Distribution (Typical)

```
Query Types:
┌─────────────────────────────────────┐
│ Greetings/Acknowledgments    │ 20% │ ████████
│ Simple Questions             │ 30% │ ████████████
│ Explanations                 │ 25% │ ██████████
│ Code/Architecture            │ 15% │ ██████
│ Advanced/Debugging           │ 10% │ ████
└─────────────────────────────────────┘

Model Selection:
┌─────────────────────────────────────┐
│ gpt-4o-mini                  │ 70% │ ████████████████████████████
│ gpt-4o                       │ 30% │ ████████████
└─────────────────────────────────────┘
```

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Frontend                             │
│              (React + TypeScript)                       │
└───────────────────────┬────────────────────────────────┘
                        │ HTTP/SSE
                        v
┌────────────────────────────────────────────────────────┐
│                  FastAPI Backend                        │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  POST /api/chat                                  │  │
│  │    ↓                                             │  │
│  │  agents/chat_agent.py                           │  │
│  │    ├─→ get_smart_llm(message)                   │  │
│  │    │     ├─→ complexity_analyzer.py             │  │
│  │    │     │     └─→ Analyze & Score              │  │
│  │    │     └─→ Select Model                       │  │
│  │    ├─→ create_agent(llm)                        │  │
│  │    └─→ agent.invoke()                           │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────┬────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          v                           v
    ┌──────────┐              ┌──────────┐
    │ OpenAI   │              │  Google  │
    │ API      │              │  Gemini  │
    │          │              │  API     │
    │gpt-4o-   │              │gemini-   │
    │mini / 4o │              │flash/pro │
    └──────────┘              └──────────┘
```

## Request/Response Flow

```
1. User sends message
   ↓
2. API receives request
   {
     "message": "Design a scalable API",
     "chat_id": "optional"
   }
   ↓
3. Chat Agent calls get_smart_llm()
   ↓
4. Complexity Analyzer evaluates message
   Score: 8, Complexity: COMPLEX
   ↓
5. LLM selection: gpt-4o
   Console: 🧠 Smart LLM Selection: gpt-4o (complexity: complex, score: 8)
   ↓
6. Agent processes with selected LLM
   ↓
7. Response returned with metadata
   {
     "response": "Here's a scalable architecture...",
     "chat_id": "chat_123",
     "thought_process": [...],
     "llm_metadata": {
       "auto_switched": true,
       "model": "gpt-4o",
       "complexity": "complex",
       "score": 8
     }
   }
```

## Complexity Scoring Breakdown

```
Score Components:
┌─────────────────────────────────────────────┐
│ Factor              Weight    Example       │
├─────────────────────────────────────────────┤
│ Length              0-3       >100 words=3  │
│ Questions           0-2       Multiple Q's  │
│ Code Presence       +3        Code blocks   │
│ Expert Keywords     +4        "scalability" │
│ Complex Keywords    +2        "explain"     │
│ Multi-part          +2        Numbered list │
│ Tech Terms          0-2       "API", "DB"   │
└─────────────────────────────────────────────┘

Threshold Mapping:
0──────2─────────5─────────8──────────12+
│      │         │         │           │
SIMPLE  MODERATE  COMPLEX   EXPERT
│               │                   │
gpt-4o-mini     │     gpt-4o        │
gemini-flash    │     gemini-pro    │
```

## File Structure

```
backend/
├── agents/
│   └── chat_agent.py         [Uses get_smart_llm()]
├── api/
│   └── main.py               [Handles llm_metadata]
├── utils/
│   ├── llm.py                [get_smart_llm() function]
│   └── complexity_analyzer.py [New: Analysis logic]
└── .env
    ├── LLM_PROVIDER=openai
    ├── AUTO_SWITCH_LLM=true
    └── OPENAI_API_KEY=...
```

## Monitoring Dashboard (Conceptual)

```
┌────────────────────────────────────────────┐
│  Today's Model Usage                       │
├────────────────────────────────────────────┤
│  gpt-4o-mini:  ████████████████   750      │
│  gpt-4o:       ██████             250      │
│                                            │
│  Total Queries: 1,000                      │
│  Avg Score: 4.2                            │
│  Cost Today: $1.11                         │
│  Projected Monthly: $33.30                 │
│  vs Fixed gpt-4o: $97.50                   │
│  Savings: $64.20 (66%)                     │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Complexity Distribution                   │
├────────────────────────────────────────────┤
│  Simple:    ████████████████████  50%      │
│  Moderate:  ████████████          30%      │
│  Complex:   ██████                15%      │
│  Expert:    ██                     5%      │
└────────────────────────────────────────────┘
```
