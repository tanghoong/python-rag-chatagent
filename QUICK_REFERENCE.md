# Quick Reference Card 📋

## 🚀 Getting Started (30 seconds)

```cmd
cd backend
start.bat
```

Then configure `backend/.env` with your Google API key.

---

## 🔑 Essential Commands

### Start Server
```cmd
cd backend\api
python main.py
```

### Seed Sample Data
```cmd
cd backend
python seed_data.py
```

### Test Connection
```cmd
cd backend
python -c "from database.connection import test_connection; test_connection()"
```

---

## 🌐 Quick URLs

| Service | URL |
|---------|-----|
| Server | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/api/health |

---

## 💬 Test Queries

### General Questions (No Tool)
- "What is Python?"
- "Tell me about AI"
- "How does machine learning work?"

### Database Queries (Uses Tool)
- "Show me my posts"
- "What have I written about Python?"
- "Tell me about my blog articles"

---

## 📝 Configuration

### Minimum Required in `.env`
```env
GOOGLE_API_KEY=your_key_here
MONGODB_URI=mongodb://localhost:27017/rag_chatbot
```

### Get Google API Key
https://makersuite.google.com/app/apikey

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Import errors | `pip install -r requirements.txt` |
| MongoDB failed | Check if MongoDB running |
| API key invalid | Verify key in `.env` (no spaces) |
| CORS errors | Add frontend URL to `.env` |

---

## 📁 File Locations

| What | Where |
|------|-------|
| Main API | `backend/api/main.py` |
| Agent | `backend/agents/chat_agent.py` |
| Tools | `backend/utils/tools.py` |
| LLM | `backend/utils/llm.py` |
| Database | `backend/database/connection.py` |
| Config | `backend/.env` |

---

## 🎯 Current Status

✅ Milestone 1 Complete (Backend Foundation)  
⬜ Milestone 2 Next (Frontend Foundation)  
📊 Overall Progress: 10%

---

## 📚 Documentation

- **README.md** - Full project overview
- **backend/README.md** - Backend setup guide
- **PRD.md** - Product requirements
- **todo.md** - Development roadmap
- **MILESTONE_1_SUMMARY.md** - Completion details

---

**Need help? Check the documentation or review backend/README.md**
