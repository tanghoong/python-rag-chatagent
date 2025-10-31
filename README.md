# RAG Chatbot - Full-Stack AI Application 🤖✨

A modern full-stack AI chatbot with **dark glassmorphism UI** featuring poetic responses, intelligent tool usage, and MongoDB RAG capabilities.

## 🎯 Project Status - ENHANCED & PRODUCTION READY! 🎉✨

**✅ ALL CORE MILESTONES + PHASE 2 ENHANCEMENTS COMPLETED!**

### Core Milestones (100% Complete)
- ✅ **Milestone 1**: Backend Foundation (Core MVP)
- ✅ **Milestone 2**: Frontend Foundation (React Router v7 UI)
- ✅ **Milestone 3**: Chat Session Management (Multiple chats)
- ✅ **Milestone 4**: Advanced Chat Features (Edit, regenerate, delete)
- ✅ **Milestone 5**: Additional AI Tools (Web search, Wikipedia, Calculator)
- ✅ **Milestone 6**: Usage Statistics & Analytics (Tokens, costs, thought process)
- ✅ **Milestone 7**: Enhanced UX Features (Streaming, voice, shortcuts)
- ✅ **Milestone 8**: Code Rendering & Markdown ✨
- ✅ **Milestone 9**: Polish & Optimization ✨
- ✅ **Milestone 10**: Production Deployment ✨

### Phase 2 Advanced Features (NEW! 🚀)
- ✅ **Phase 2.1-2.4**: Complete RAG System (Vector DB, Document Processing, Embeddings, Hybrid Search)
- ✅ **Phase 2.5**: Document Management UI (Drag & Drop, Preview, Bulk Operations)
- ✅ **Phase 2.6**: Retrieval Quality & Transparency (Source Citations, Relevance Scores)
- ✅ **Phase 2.7**: Memory CRUD Interface (Search, Edit, Tag Management, Timeline)
- ✅ **Phase 2.8**: Global Task Management System (AI-Integrated Todo System) 🆕
- ✅ **Phase 2.9**: Smart Reminder System (Recurrence, Notifications, Sidebar) 🆕
- ✅ **Phase 1.1-1.4**: Autonomous Memory Management & Document Context Switching

### 🚀 Next-Generation AI Assistant
The application has evolved from a simple chatbot to a comprehensive **Personal AI Productivity Suite** with RAG, task management, smart reminders, and autonomous memory!

## 🚀 Features

### Complete Feature Set (Core + Phase 2 Enhancements)

#### 🤖 Core AI & Chat Features
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
- 🌊 **Streaming Responses** - Real-time word-by-word message delivery
- 🎤 **Voice Input** - Speak your messages with Web Speech API
- ⚡ **Quick Actions** - Copy, thumbs up/down on messages
- 🔄 **Auto Retry** - Exponential backoff for failed requests
- ⌨️ **Keyboard Shortcuts** - Productivity shortcuts for power users
- 💻 **Code Rendering** - Syntax highlighting with Prism.js
- 📝 **Full Markdown Support** - Render rich formatted content
- 🔍 **Thought Process Viewer** - See agent reasoning steps
- 💬 **Toast Notifications** - User feedback for all actions
- ⏱️ **Message Timestamps** - Relative time display with tooltips
- 🎨 **Loading Skeletons** - Smooth loading states
- 📱 **Responsive Design** - Optimized for mobile and desktop
- 🐳 **Docker Deployment** - Production-ready containerization
- ⚙️ **Environment Configuration** - Multi-environment setup
- 🚀 **Build Optimization** - Code splitting and tree shaking

#### 🧠 Advanced RAG & Memory System (NEW!)
- 🧠 **Autonomous Memory Management** - AI creates databases, ingests documents automatically
- 📚 **Global & Chat Memory** - Dual-layer memory system (shared + chat-specific)
- 🔍 **Smart Memory Search** - AI autonomously decides best memory scope
- 📄 **Multi-Format Document Upload** - PDF, DOCX, TXT, MD support with drag & drop
- 🎯 **Document Context Switching** - Select active documents per chat (Ctrl+K)
- 📊 **Memory CRUD Interface** - Search, edit, tag management, timeline, export, delete memories
- 🏷️ **Source Indicators** - See where information came from (🌐 Global / 💬 Chat)
- 🔄 **Vector Database** - Chroma DB for intelligent semantic search
- 🔍 **Hybrid Search** - Combines semantic vector search (70%) + keyword matching (30%)
- 📈 **Retrieval Quality** - Relevance scores, source citations, transparency
- 💾 **Document Management** - Preview, metadata display, bulk operations

#### 📋 Task Management System (NEW!)
- ✅ **AI-Integrated Todo System** - Create, manage, and track tasks through natural language
- 🎯 **Smart Task Creation** - AI extracts priorities, due dates, and categories automatically
- 📊 **Task Dashboard** - Visual statistics, filtering by status/priority/tags
- 🔄 **Task Status Management** - Todo, In Progress, Completed with visual indicators
- 🏷️ **Tag System** - Organize tasks with custom tags and categories
- 📝 **Rich Text Editor** - Full markdown support for detailed task descriptions
- 🔍 **Search & Filter** - Find tasks quickly by title, description, tags, or status
- 📈 **Progress Tracking** - Visual progress indicators and completion statistics
- 🤖 **6 AI Agent Tools** - Natural language task management through chat
- 💾 **MongoDB Integration** - Persistent task storage with performance indexing

#### ⏰ Smart Reminder System (NEW!)
- 🔔 **Intelligent Reminders** - AI-powered reminder creation with natural language parsing
- 🔁 **Recurrence Engine** - Daily, weekly, monthly, yearly recurring reminders
- 🎯 **Priority Levels** - Low, Medium, High, Critical with visual indicators
- 📅 **Smart Scheduling** - Natural date/time parsing ("tomorrow at 3pm", "every Monday")
- 🎵 **Notification System** - Browser notifications with customizable sound alerts
- 📱 **Reminder Sidebar** - Always-visible sidebar with toggle functionality (Ctrl+Shift+R)
- 🎨 **Visual Status Indicators** - Color-coded status with animations (pending, overdue, completed)
- 🔍 **Advanced Filtering** - Filter by status, priority, tags, date ranges
- 📊 **Smart Categorization** - Today, Overdue, Upcoming sections with counts
- 🏷️ **Tag Management** - Organize reminders with custom tags
- 🤖 **7 AI Agent Tools** - Natural language reminder management through chat
- ⚙️ **Notification Settings** - Comprehensive user preferences for alerts and sounds
- 💾 **APScheduler Integration** - Background job processing for due reminder checks

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
- **MongoDB** - NoSQL database for chats, tasks, reminders
- **Chroma DB** - Vector database for RAG and semantic search
- **APScheduler** - Background job scheduler for reminders
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **React Router v7** - Modern React framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS v4** - Utility-first CSS
- **Lucide React** - Icon library

### AI & RAG Features
- **Vector Embeddings** - OpenAI/Google/HuggingFace models
- **Hybrid Search** - Semantic + keyword search
- **Document Processing** - PDF, DOCX, TXT, MD support
- **Natural Language Processing** - Date/time parsing, intent recognition

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

## 🎯 Current Status & Achievements

**🔥 COMPREHENSIVE AI PRODUCTIVITY SUITE - FULLY OPERATIONAL! 🔥**

### Core Foundation (100% Complete)
- ✅ **10 Core Milestones** - Full-stack chatbot with all essential features
- ✅ **Production Deployment** - Docker containerization and cloud-ready setup
- ✅ **Advanced UX/UI** - Glassmorphism design, streaming, voice input, shortcuts

### Phase 2 Advanced Features (100% Complete) 
- ✅ **Complete RAG System** - Vector DB, embeddings, hybrid search, document processing
- ✅ **Autonomous Memory Management** - AI-powered knowledge base with global/chat scope
- ✅ **Task Management Suite** - Full CRUD with AI integration and natural language processing
- ✅ **Smart Reminder System** - Recurrence engine, notifications, real-time monitoring
- ✅ **Document Management** - Drag & drop upload, preview, context switching

### What Makes This Special
🧠 **Autonomous Intelligence**: The AI manages its own memory, creates databases, and ingests documents without human intervention

� **Productivity Integration**: Seamlessly combines chat, tasks, reminders, and document management in one interface

🔍 **Advanced RAG**: Hybrid semantic + keyword search with relevance scoring and source transparency

🤖 **Natural Language Everything**: Create tasks, set reminders, manage documents through conversational AI

## 🚀 Live Features You Can Use Right Now

1. **� Chat with AI** - Poetic responses with tool integration
2. **📁 Upload Documents** - PDF, DOCX, TXT, MD with automatic indexing
3. **✅ Manage Tasks** - "Create a task to review project proposal by Friday"
4. **⏰ Set Reminders** - "Remind me to call mom every Sunday at 2pm"
5. **🧠 Search Memory** - AI automatically finds relevant information from your documents
6. **🎯 Context Switching** - Select different document sets for different conversations
7. **📊 Track Everything** - View usage statistics, thought processes, and system insights

## 🤝 Contributing

This is a comprehensive portfolio project showcasing modern AI application development. Feel free to explore the codebase to learn about:
- LangChain agent architecture
- React Router v7 with TypeScript
- MongoDB + Vector DB integration
- Real-time notifications and scheduling
- Document processing pipelines

## 📝 License

See LICENSE file for details.

## 📊 Complete Progress Summary

| Category | Status | Features Implemented |
|----------|--------|---------------------|
| **Core Milestones (1-10)** | ✅ 100% Complete | Chat, Sessions, Tools, Analytics, Streaming, Voice, Markdown, Production |
| **RAG System (Phase 2.1-2.6)** | ✅ 100% Complete | Vector DB, Document Processing, Hybrid Search, Transparency |
| **Memory Management (Phase 1.1-1.4)** | ✅ 100% Complete | Autonomous AI Memory, Global/Chat Scope, CRUD Interface |
| **Task Management (Phase 2.8)** | ✅ 100% Complete | 9 API Endpoints, 6 AI Tools, MongoDB Integration |
| **Reminder System (Phase 2.9)** | ✅ 100% Complete | 10 API Endpoints, 7 AI Tools, Notifications, Sidebar |
| **UX Improvements (Phase 3.1-3.2)** | ✅ 95% Complete | Smooth Scrolling, Enhanced Input, Visual Feedback |

### Total Implementation Stats
- **📊 28+ API Endpoints** across all systems
- **🤖 20+ AI Agent Tools** for natural language interaction  
- **💾 4 Database Systems** (MongoDB collections + Chroma vector DB)
- **🎨 50+ React Components** with TypeScript
- **⚡ 15+ Keyboard Shortcuts** for power users
- **🔔 Advanced Notification System** with sound alerts and preferences
- **📱 Fully Responsive Design** optimized for all devices

### Latest Achievements (October 2025)
- ✅ **Smart Reminder System** - Complete recurrence engine with natural language parsing
- ✅ **Task Management Suite** - AI-integrated todo system with visual dashboard
- ✅ **Enhanced Chat UX** - Smooth scrolling, improved input, character counter
- ✅ **Document Context Switching** - Select different document sets per conversation
- ✅ **Memory CRUD Interface** - Full frontend management of AI memory
- ✅ **Production Optimization** - Performance tuning and user experience polish

**Overall Progress: 100% of planned features + 85% of Phase 2 enhancements = Next-generation AI productivity suite! 🚀**

---

**Built with ❤️ using FastAPI, LangChain, and Google Gemini**

For detailed implementation guide, see **PRD.md**
