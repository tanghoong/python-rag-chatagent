# RAG Chatbot - Full-Stack AI Application 🤖✨

A modern full-stack AI chatbot with **dark glassmorphism UI** featuring poetic responses, intelligent tool usage, and MongoDB RAG capabilities.

## 🎯 Project Status - 70% Complete! ✅

**✅ Milestones 1-7 COMPLETED**

### Completed Milestones
- ✅ **Milestone 1**: Backend Foundation (Core MVP)
- ✅ **Milestone 2**: Frontend Foundation (React Router v7 UI)
- ✅ **Milestone 3**: Chat Session Management (Multiple chats)
- ✅ **Milestone 4**: Advanced Chat Features (Edit, regenerate, delete)
- ✅ **Milestone 5**: Additional AI Tools (Web search, Wikipedia, Calculator)
- ✅ **Milestone 6**: Usage Statistics & Analytics (Tokens, costs, thought process)
- ✅ **Milestone 7**: Enhanced UX Features (Streaming, voice, shortcuts) **NEW!**

### Next Up
- ⬜ **Milestone 8**: Code Rendering & Markdown
- ⬜ **Milestone 9**: Polish & Optimization
- ⬜ **Milestone 10**: Production Deployment

## 🚀 Features

### Current Features (Milestones 1-7)
- 🤖 **AI-Powered Chatbot** - Poetic responses powered by Google Gemini 2.0 Flash
- 🧠 **Intelligent Tool Usage** - RAG-enabled agent that queries database when relevant
- 💬 **RESTful API** - FastAPI backend with automatic documentation
- 🔧 **MongoDB Integration** - Fetch personal posts from database on demand
- 🎯 **Smart Agent Logic** - Uses web search, Wikipedia, calculator, and database tools intelligently
- 📝 **Poetic Responses** - All answers delivered in rhyming verse
- 🎨 **Modern React UI** - Glassmorphism design with dark theme
- 💾 **Multiple Chat Sessions** - Create, manage, and switch between conversations
- ✏️ **Message Management** - Edit, regenerate, and delete messages
- 📊 **Usage Analytics** - Track tokens, costs, and thought processes
- 🌊 **Streaming Responses** - Real-time word-by-word message delivery **NEW!**
- 🎤 **Voice Input** - Speak your messages with Web Speech API **NEW!**
- ⚡ **Quick Actions** - Copy, thumbs up/down on messages **NEW!**
- � **Auto Retry** - Exponential backoff for failed requests **NEW!**
- ⌨️ **Keyboard Shortcuts** - Productivity shortcuts for power users **NEW!**

### Coming Soon (Milestones 8-10)
- 💻 Code rendering with syntax highlighting
- 📝 Full markdown support
- 🎨 Polish & optimization
- 🚀 Production deployment

## 📁 Project Structure

```
python-rag-chatagent/
├── backend/               # FastAPI + LangChain backend
│   ├── agents/           # LangChain ReAct agents
│   ├── api/              # FastAPI endpoints
│   ├── database/         # MongoDB connection
│   ├── models/           # Data models
│   ├── utils/            # LLM and tools
│   ├── requirements.txt  # Python dependencies
│   ├── .env              # Environment variables
│   ├── start.bat         # Quick start script
│   ├── seed_data.py      # Sample data seeder
│   └── README.md         # Backend documentation
├── frontend/             # React Router v7 frontend (Coming in Milestone 2)
├── PRD.md                # Product Requirements Document
├── todo.md               # Development todo list
└── README.md             # This file
```

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **LangChain** - LLM orchestration with ReAct agent
- **Google Gemini 2.0 Flash** - Large language model
- **MongoDB** - NoSQL database
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend (Milestone 2+)
- **React Router v7** - Modern React framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS v4** - Utility-first CSS
- **Lucide React** - Icon library

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory**
   ```cmd
   cd backend
   ```

2. **Run the quick start script** (Windows)
   ```cmd
   start.bat
   ```

   Or manually:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   
   Edit `backend/.env`:
   ```env
   GOOGLE_API_KEY=your_google_api_key_here
   MONGODB_URI=mongodb://localhost:27017/rag_chatbot
   ```

4. **Get Google Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create API key
   - Paste in `.env` file

5. **Set up MongoDB**
   - Install [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
   - Or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier)

6. **Seed sample data** (optional)
   ```cmd
   python seed_data.py
   ```

7. **Start the server**
   ```cmd
   cd api
   python main.py
   ```

   Server runs at: http://localhost:8000

### Testing the API

1. **Health Check**
   ```
   http://localhost:8000/api/health
   ```

2. **API Documentation**
   ```
   http://localhost:8000/docs
   ```

3. **Test Chat Endpoint**
   ```cmd
   curl -X POST "http://localhost:8000/api/chat" ^
     -H "Content-Type: application/json" ^
     -d "{\"message\": \"What is Python?\"}"
   ```

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint |
| GET | `/api/health` | Health check with DB status |
| POST | `/api/chat` | Send message to chatbot |
| GET | `/docs` | Interactive API documentation |

### Example Request/Response

**Request:**
```json
POST /api/chat
{
  "message": "What is Python?"
}
```

**Response:**
```json
{
  "response": "Python is a language, powerful and bright,\nWith syntax so simple, it's pure delight!\nFor beginners and experts, it shines with grace,\nIn web, AI, and data, it finds its place!",
  "error": null
}
```

## 🧪 How It Works

### Agent Behavior

The LangChain ReAct agent intelligently decides when to use tools:

**General Questions** (No tool usage)
- "What is Python?" → Direct poetic answer
- "Tell me about AI" → Direct poetic answer
- "How are you?" → Direct poetic answer

**Database Queries** (Tool usage)
- "Show me my posts" → Uses `post_data_from_db` tool
- "What have I written about Python?" → Uses `post_data_from_db` tool
- "Tell me about my blog articles" → Uses `post_data_from_db` tool

### Agent Prompt

The agent uses a ReAct (Reasoning + Acting) pattern:
1. **Thought** - Analyzes the question
2. **Action** - Decides whether to use a tool
3. **Action Input** - Provides tool parameters
4. **Observation** - Sees tool results
5. **Final Answer** - Responds in rhyming verse

## 📊 Development Progress

| Milestone | Status | Completion |
|-----------|--------|------------|
| 1. Backend Foundation | ✅ Complete | 100% |
| 2. Frontend Foundation | ⬜ Not Started | 0% |
| 3. Chat Session Management | ⬜ Not Started | 0% |
| 4. Advanced Chat Features | ⬜ Not Started | 0% |
| 5. Additional AI Tools | ⬜ Not Started | 0% |
| 6. Usage Statistics | ⬜ Not Started | 0% |
| 7. Enhanced UX Features | ⬜ Not Started | 0% |
| 8. Code Rendering | ⬜ Not Started | 0% |
| 9. Polish & Optimization | ⬜ Not Started | 0% |
| 10. Production Deployment | ⬜ Not Started | 0% |

**Overall Progress:** 10% (1/10 milestones complete)

## 🔧 Configuration

### Environment Variables

All configuration is in `backend/.env`:

```env
# Google Gemini API
GOOGLE_API_KEY=your_api_key

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rag_chatbot
DB_NAME=rag_chatbot
POSTS_COLLECTION=personal_posts
CHATS_COLLECTION=chat_sessions

# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# CORS (for frontend)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## 🐛 Troubleshooting

### Import Errors
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`

### MongoDB Connection Failed
- Check if MongoDB is running: `mongod --version`
- Verify `MONGODB_URI` in `.env`
- For Atlas, check IP whitelist

### Google API Key Invalid
- Verify API key in `.env` (no spaces)
- Check key is enabled at Google AI Studio
- Ensure you have quota available

### CORS Errors
- Add frontend URL to `CORS_ORIGINS` in `.env`
- Restart server after changing `.env`

## 📚 Documentation

- **PRD.md** - Complete product requirements and rebuild instructions
- **todo.md** - Detailed development roadmap with 150+ tasks
- **backend/README.md** - Backend-specific setup guide

## 🎯 Next Steps

1. ✅ **Milestone 1 Complete** - Backend foundation is ready!
2. 🎨 **Milestone 2** - Build React Router v7 frontend
3. 💾 **Milestone 3** - Add chat session management
4. 🔧 **Milestones 4-10** - Advanced features and deployment

## 🤝 Contributing

This is a portfolio/learning project following the PRD specifications.

## 📝 License

See LICENSE file for details.

## 🌟 Features Showcase

### Poetic Persona
Every response is delivered in creative rhyming verse, making interactions engaging and memorable.

### Smart Tool Usage
The agent intelligently decides when to query the database versus answering directly, optimizing performance.

### RAG-Enabled
Retrieval-Augmented Generation ensures accurate, context-aware responses from your personal knowledge base.

### Modern Stack
Built with cutting-edge technologies: FastAPI, LangChain, Google Gemini, and MongoDB.

---

**Built with ❤️ using FastAPI, LangChain, and Google Gemini**

For detailed implementation guide, see **PRD.md**
