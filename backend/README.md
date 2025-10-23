# Backend Setup and Installation Guide

## Prerequisites

- Python 3.10 or higher
- MongoDB (local installation or MongoDB Atlas account)
- Google Gemini API key

## Installation Steps

### 1. Navigate to Backend Directory

```cmd
cd backend
```

### 2. Create Virtual Environment

```cmd
python -m venv venv
```

### 3. Activate Virtual Environment

**Windows (CMD):**
```cmd
venv\Scripts\activate
```

**Windows (PowerShell):**
```cmd
venv\Scripts\Activate.ps1
```

### 4. Install Dependencies

```cmd
pip install -r requirements.txt
```

### 5. Configure Environment Variables

Edit the `.env` file and add your credentials:

```env
# Google Gemini API Configuration
GOOGLE_API_KEY=your_actual_google_api_key_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/rag_chatbot
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rag_chatbot

# Database Name
DB_NAME=rag_chatbot

# Collection Names
POSTS_COLLECTION=personal_posts
CHATS_COLLECTION=chat_sessions

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 6. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key
4. Paste it in your `.env` file

### 7. Set Up MongoDB

**Option A: Local MongoDB**
- Install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
- Start MongoDB service
- Use connection string: `mongodb://localhost:27017/rag_chatbot`

**Option B: MongoDB Atlas (Cloud)**
1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Add database user
4. Whitelist your IP address
5. Get connection string and update `.env`

### 8. (Optional) Seed Sample Data

Create sample posts in MongoDB:

```python
# Run this in Python or MongoDB Compass
from database.connection import get_posts_collection

posts_collection = get_posts_collection()

sample_posts = [
    {
        "title": "Introduction to Python",
        "content": "Python is a versatile programming language...",
        "author": "Your Name",
        "date": "2025-01-01",
        "tags": ["python", "programming", "tutorial"]
    },
    {
        "title": "Building Web Apps with FastAPI",
        "content": "FastAPI is a modern web framework...",
        "author": "Your Name",
        "date": "2025-01-15",
        "tags": ["fastapi", "python", "web development"]
    }
]

posts_collection.insert_many(sample_posts)
print("Sample posts inserted!")
```

## Running the Server

### Development Mode (with auto-reload)

**IMPORTANT:** Run from the `backend` directory (not `api` directory):

```cmd
py -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

OR using the quick start script:

```cmd
start.bat
```

### Production Mode

```cmd
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

## Testing the API

### 1. Check Health Endpoint

Open browser: http://localhost:8000/api/health

### 2. View API Documentation

Open browser: http://localhost:8000/docs

### 3. Test Chat Endpoint

Using curl:

```cmd
curl -X POST "http://localhost:8000/api/chat" ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"What is Python?\"}"
```

Using PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/chat" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"message": "What is Python?"}'
```

## Project Structure

```
backend/
├── agents/
│   ├── __init__.py
│   └── chat_agent.py          # LangChain ReAct agent
├── api/
│   ├── __init__.py
│   └── main.py                # FastAPI server
├── database/
│   ├── __init__.py
│   └── connection.py          # MongoDB connection
├── models/
│   └── __init__.py            # Data models (future)
├── utils/
│   ├── __init__.py
│   ├── llm.py                 # Google Gemini LLM
│   └── tools.py               # MongoDB query tool
├── .env                       # Environment variables (DO NOT COMMIT)
├── .env.example               # Example environment config
└── requirements.txt           # Python dependencies
```

## Troubleshooting

### Import Errors
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt` again

### MongoDB Connection Failed
- Check if MongoDB is running: `mongod --version`
- Verify `MONGODB_URI` in `.env` file
- For Atlas, check IP whitelist and credentials

### Google API Key Invalid
- Verify API key is correct in `.env`
- Check API key is enabled at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Ensure no extra spaces in the key

### CORS Errors
- Add frontend URL to `CORS_ORIGINS` in `.env`
- Restart the server after changing `.env`

## Next Steps

1. ✅ Backend is now ready!
2. 🎨 Build the frontend (React Router v7)
3. 🔗 Connect frontend to this backend API
4. 🚀 Deploy to production

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint |
| GET | `/api/health` | Health check |
| POST | `/api/chat` | Send message to chatbot |
| GET | `/docs` | Interactive API docs |

## Testing Examples

### General Question (No Tool Usage)
```json
{
  "message": "What is Python?"
}
```

Expected: Poetic response without database query

### Database Query (Tool Usage)
```json
{
  "message": "Show me my posts about programming"
}
```

Expected: Database query + poetic response

## Development Tips

- Use `/docs` endpoint for interactive API testing
- Check terminal logs for agent reasoning process
- MongoDB Compass is useful for viewing database content
- Enable `verbose=True` in agent for detailed logging

## Support

For issues or questions:
1. Check the logs in terminal
2. Verify environment variables
3. Test database connection separately
4. Review API documentation at `/docs`
