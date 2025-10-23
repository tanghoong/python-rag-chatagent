# Full-Stack RAG Chatbot - AI Rebuild Prompt 🤖✨

## Project Overview

Create a modern full-stack AI chatbot application with a **dark glassmorphism UI** featuring:
- **Backend**: FastAPI with LangChain ReAct agents and Google Gemini AI
- **Frontend**: React Router v7 with TypeScript and Tailwind CSS
- **Database**: MongoDB integration for personal posts/content
- **Architecture**: RAG-enabled intelligent tool usage

## Core Features

- 🤖 **AI-Powered Chatbot** - Poetic responses powered by Google Gemini 2.0 Flash
- 🎨 **Futuristic Dark Glassmorphism UI** - Modern, sleek design with animated backgrounds
- 🧠 **Intelligent Tool Usage** - RAG-enabled agent that only queries database when relevant
- 💬 **Real-Time Chat Interface** - Smooth, responsive chat experience
- 📱 **Fully Responsive** - Works seamlessly on desktop and mobile devices
- 🔧 **MongoDB Integration** - Fetch personal posts from database on demand
- 🚀 **Type-Safe** - Full TypeScript support on frontend
- 🎯 **Smart Navigation** - Fixed navbar with active route highlighting
- 💾 **Chat Management** - Create, edit, delete, and switch between multiple chat sessions
- 🔄 **Message Editing** - Edit and regenerate last user message with full context
- 📊 **Usage Statistics** - Track tokens, costs, tool usage, and performance metrics per chat
- 🌐 **Web Search Tool** - Real-time internet search for current information
- 🧮 **Calculator Tool** - Perform complex mathematical calculations
- 📚 **Wikipedia Tool** - Access comprehensive encyclopedia knowledge
- 💻 **Code Rendering** - Syntax-highlighted code blocks with copy functionality
- 🔖 **Conversation Memory** - Context-aware responses using chat history
- 🌙 **Streaming Responses** - Real-time token-by-token message display
- 🎤 **Voice Input** - Speech-to-text for hands-free interaction
- � **Quick Actions** - Copy, regenerate, and share message shortcuts
- �📧 **Multi-Tool Agent** - Extensible tool system for diverse capabilities

## Backend Architecture

### Technology Stack
- **FastAPI** - Modern Python web framework
- **LangChain** - LLM orchestration with ReAct agent pattern
- **Google Gemini 2.0 Flash** - Large language model
- **MongoDB** - NoSQL database for posts storage
- **Pydantic** - Data validation and API models
- **Uvicorn** - ASGI server
- **python-dotenv** - Environment variable management

### Project Structure
```
backend/
├── agents/
│   ├── __init__.py
│   └── chat_agent.py          # LangChain ReAct agent with tool calling
├── api/
│   └── main.py                # FastAPI server with CORS
├── utils/
│   ├── __init__.py
│   ├── llm.py                 # Google Gemini LLM configuration
│   └── tools.py               # Enhanced tools (MongoDB, Web Search, Calculator)
├── models/
│   ├── __init__.py
│   └── chat_models.py         # Chat session and message models
├── database/
│   ├── __init__.py
│   └── chat_repository.py     # Chat CRUD operations
├── requirements.txt
├── .env.example
└── .env
```

### Key Components

#### 1. FastAPI Server (`api/main.py`)
- **CORS Configuration**: Allow frontend origin `http://localhost:5173`
- **Chat Endpoints**:
  - `POST /api/chat` - Send message to AI agent
  - `GET /api/chats` - List all chat sessions
  - `POST /api/chats` - Create new chat session
  - `GET /api/chats/{chat_id}` - Get specific chat with messages
  - `GET /api/chats/{chat_id}/stats` - Get usage statistics for chat
  - `PUT /api/chats/{chat_id}/messages/{message_id}` - Edit message and regenerate
  - `DELETE /api/chats/{chat_id}` - Delete entire chat session
- **Health Check**: `GET /api/health`
- **Error Handling**: Proper HTTP exceptions and response models
- **Usage Tracking**: Middleware to track token usage and response times

**API Models:**
```python
class ChatMessage(BaseModel):
    message: str = Field(..., description="User's message to the chatbot")

class ChatResponse(BaseModel):
    response: str = Field(..., description="Bot's response")
    error: Optional[str] = None

class ChatSession(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[Message]
    usage_stats: UsageStats

class Message(BaseModel):
    id: str
    role: Literal["user", "bot"]
    content: str
    timestamp: datetime
    tokens_used: Optional[int] = None
    tools_used: Optional[List[str]] = None

class UsageStats(BaseModel):
    total_messages: int
    total_tokens: int
    input_tokens: int
    output_tokens: int
    estimated_cost: float  # In USD
    tools_usage: Dict[str, int]  # Tool name -> count
    average_response_time: float  # In seconds
    total_duration: float  # Total chat duration in seconds
```

#### 2. Chat Repository (`database/chat_repository.py`)
- **CRUD Operations**: Create, Read, Update, Delete chat sessions
- **Message Management**: Store and retrieve conversation history
- **Auto-titling**: Generate chat titles from first user message
- **Pagination**: Efficient loading of chat history
- **Search**: Find chats by keywords or date range
- **Usage Tracking**: Record token usage, costs, and tool invocations
- **Statistics Aggregation**: Calculate session-level metrics

**Key Functions:**
```python
async def create_chat_session() -> ChatSession
async def get_chat_session(chat_id: str) -> ChatSession
async def list_chat_sessions() -> List[ChatSession]
async def delete_chat_session(chat_id: str) -> bool
async def add_message(chat_id: str, message: Message) -> Message
async def update_message(chat_id: str, message_id: str, content: str) -> Message
async def regenerate_from_message(chat_id: str, message_id: str) -> ChatSession
async def update_usage_stats(chat_id: str, tokens: int, tools: List[str], duration: float) -> UsageStats
async def get_usage_stats(chat_id: str) -> UsageStats
```

#### 2. LangChain ReAct Agent (`agents/chat_agent.py`)
- **Persona**: Poetic AI assistant that always responds in rhymes
- **Tool Usage Logic**: Intelligently selects tools based on user query
- **Prompt Template**: Structured ReAct format with clear instructions
- **Agent Executor**: Max 8 iterations with error handling
- **Context Awareness**: Uses chat history for contextual responses

**Key Behavior:**
- General questions → Direct rhyming answers (NO tool usage)
- Personal posts queries → Use MongoDB tool then provide rhyming response
- Current information → Use web search tool for real-time data
- General knowledge/facts → Use Wikipedia tool for comprehensive information
- Math problems → Use calculator tool for accurate computation

#### 3. Google Gemini LLM (`utils/llm.py`)
```python
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.2,
)
```

#### 4. Enhanced Tools (`utils/tools.py`)

**MongoDB Tool:**
- **Smart Tool Activation**: Only triggers for personal/database content queries
- **Connection Management**: MongoDB Atlas with proper error handling
- **Data Formatting**: Returns formatted post information
- **Query Examples**: "Show me my posts", "Tell me about my personal blog articles"

**Web Search Tool (NEW):**
- **Real-time Search**: DuckDuckGo or Tavily API integration
- **Smart Triggering**: Activates for current events, news, weather, stock prices
- **Result Filtering**: Returns top 3-5 relevant results with summaries
- **Query Examples**: "What's the weather today?", "Latest news about AI", "Current Bitcoin price"

**Wikipedia Tool (NEW):**
- **Encyclopedia Access**: Search and retrieve Wikipedia articles
- **Smart Triggering**: Activates for general knowledge, historical facts, definitions, biographies
- **Content Summarization**: Returns relevant excerpts from articles
- **Query Examples**: "Who is Albert Einstein?", "What is quantum computing?", "History of the Roman Empire"

**Calculator Tool (NEW):**
- **Complex Math**: Evaluates mathematical expressions safely
- **Unit Conversion**: Handles conversions between units
- **Scientific Functions**: Supports trigonometry, logarithms, etc.
- **Query Examples**: "Calculate 15% of 250", "Convert 100 USD to EUR", "What's the square root of 144?"

**Code Execution Tool (NEW - Optional):**
- **Safe Sandboxing**: Execute Python code in isolated environment
- **Timeout Protection**: Prevents infinite loops
- **Limited Libraries**: NumPy, Pandas for data analysis
- **Query Examples**: "Generate a random password", "Create a list of prime numbers"

**Tool Implementation Example:**
```python
from langchain.agents import tool
from duckduckgo_search import DDGS
import wikipedia
import math

@tool
def web_search(query: str) -> str:
    """
    Search the internet for current information.
    Use this for: news, weather, current events, real-time data, prices.
    DO NOT use for: general knowledge, historical facts.
    """
    try:
        results = DDGS().text(query, max_results=3)
        return "\n".join([f"{r['title']}: {r['body']}" for r in results])
    except Exception as e:
        return f"Search error: {str(e)}"

@tool
def wikipedia_search(query: str) -> str:
    """
    Search Wikipedia for comprehensive encyclopedia knowledge.
    Use this for: general knowledge, historical facts, biographies, definitions, concepts.
    DO NOT use for: current events, real-time data, personal opinions.
    """
    try:
        wikipedia.set_lang("en")
        # Search for the query
        search_results = wikipedia.search(query, results=1)
        if not search_results:
            return f"No Wikipedia article found for: {query}"
        
        # Get summary of the first result
        summary = wikipedia.summary(search_results[0], sentences=3)
        page = wikipedia.page(search_results[0])
        
        return f"Title: {page.title}\n\nSummary: {summary}\n\nURL: {page.url}"
    except wikipedia.exceptions.DisambiguationError as e:
        # Handle disambiguation pages
        return f"Multiple results found. Please be more specific. Options: {', '.join(e.options[:5])}"
    except wikipedia.exceptions.PageError:
        return f"No Wikipedia page found for: {query}"
    except Exception as e:
        return f"Wikipedia search error: {str(e)}"

@tool
def calculate(expression: str) -> str:
    """
    Perform mathematical calculations.
    Supports: +, -, *, /, **, sqrt, sin, cos, tan, log.
    """
    try:
        # Safe evaluation with limited scope
        safe_dict = {"__builtins__": None, "math": math}
        result = eval(expression, safe_dict)
        return str(result)
    except Exception as e:
        return f"Calculation error: {str(e)}"

tools = [post_data_from_db, web_search, wikipedia_search, calculate]
```

### Environment Variables
```env
# Google AI API Key for Gemini
GOOGLE_API_KEY=your_google_api_key_here

# MongoDB Connection URI
MONGODB_URI=mongodb://localhost:27017/your_database_name
```

### Dependencies (`requirements.txt`)
```txt
fastapi==0.119.0
langchain==0.3.27
langchain-core==0.3.79
langchain-google-genai==2.1.12
pymongo==4.15.3
python-dotenv==1.1.1
uvicorn==0.37.0
pydantic==2.12.2
duckduckgo-search==7.2.0  # For web search tool
wikipedia==1.4.0           # For Wikipedia tool
motor==3.8.0               # Async MongoDB driver
tiktoken==0.8.0            # Token counting for usage stats
# ... (full list in requirements.txt)
```

### Frontend Dependencies
```bash
npm install react-markdown remark-gfm
npm install react-syntax-highlighter
npm install @types/react-syntax-highlighter --save-dev
```

## Frontend Architecture

### Technology Stack
- **React Router v7** - Modern React framework with file-based routing
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool & dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Modern icon library

### Project Structure
```
frontend/
├── app/
│   ├── components/            # Reusable UI components
│   │   ├── Navbar.tsx         # Fixed navigation bar
│   │   ├── ChatSidebar.tsx    # Chat list sidebar (NEW)
│   │   ├── ChatControls.tsx   # Edit/delete controls (NEW)
│   │   ├── AnimatedBackground.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── LoadingIndicator.tsx
│   │   └── FeatureCard.tsx
│   ├── routes/
│   │   ├── home.tsx           # Landing page with features
│   │   └── chat.tsx           # Chat interface with session management
│   │   └── chat.$chatId.tsx   # Individual chat session (NEW)
│   ├── hooks/
│   │   ├── useChatSession.ts  # Chat state management (NEW)
│   │   └── useLocalStorage.ts # Persist chat selection (NEW)
│   ├── app.css                # Custom styles & animations
│   ├── root.tsx               # Root layout with navbar
│   └── routes.ts              # Route configuration
├── package.json
├── tsconfig.json
├── vite.config.ts
├── react-router.config.ts
└── Dockerfile
```

### Key Components

#### 1. Root Layout (`app/root.tsx`)
- **Global Layout**: HTML structure with Meta, Links, Scripts
- **Font Loading**: Inter font from Google Fonts
- **Error Boundary**: Styled error handling with glassmorphism
- **Navigation**: Fixed navbar component

#### 2. Navigation (`components/Navbar.tsx`)
- **Fixed Positioning**: Always visible at top
- **Glassmorphism**: Backdrop blur with transparency
- **Active States**: Gradient highlighting for current route
- **Mobile Menu**: Hamburger menu with animations
- **Logo**: Gradient icon with brand name

#### 3. Home Page (`routes/home.tsx`)
- **Hero Section**: Large gradient title with animated background
- **Feature Cards**: 3 cards showcasing app capabilities
- **CTA Button**: Animated "Start Chatting" button
- **Responsive Design**: Grid layout adapts to screen size

#### 4. Chat Interface (`routes/chat.tsx`)
- **Chat Session Management**: Switch between multiple chat sessions
- **Message State**: Array of user/bot messages with timestamps
- **Real-time Updates**: Auto-scroll to bottom on new messages
- **API Integration**: POST requests to backend at `http://localhost:8000/api/chat`
- **Loading States**: Loading indicator during bot responses
- **Error Handling**: User-friendly error messages
- **Edit Mode**: Click edit icon to modify last user message
- **Delete Confirmation**: Modal dialog before deleting chat

#### 5. Chat Sidebar (`components/ChatSidebar.tsx` - NEW)
- **Chat List**: Display all chat sessions with titles
- **Active Indicator**: Highlight current chat
- **New Chat Button**: Create new conversation
- **Search/Filter**: Find chats by title or date
- **Collapsible**: Toggle sidebar visibility on mobile
- **Auto-title**: Generate chat title from first message

**Example Implementation:**
```typescript
interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

function ChatSidebar({ 
  chats, 
  activeId, 
  onSelect, 
  onNew, 
  onDelete 
}: ChatSidebarProps) {
  return (
    <div className="w-64 backdrop-blur-xl bg-white/5 border-r border-white/10">
      <button onClick={onNew} className="w-full p-4 gradient-button">
        + New Chat
      </button>
      <div className="overflow-y-auto">
        {chats.map(chat => (
          <ChatItem 
            key={chat.id}
            {...chat}
            active={chat.id === activeId}
            onClick={() => onSelect(chat.id)}
            onDelete={() => onDelete(chat.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### 6. Chat Controls (`components/ChatControls.tsx` - NEW)
- **Edit Button**: Modify last user message
- **Delete Button**: Remove message with confirmation
- **Regenerate**: Re-run agent with edited message
- **Copy Button**: Copy message to clipboard
- **Hover Actions**: Show controls on message hover

#### 7. Custom Hooks (NEW)

**useChatSession (`hooks/useChatSession.ts`):**
```typescript
function useChatSession(chatId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = async (content: string) => {
    // Add user message
    // Call API
    // Add bot response
  };
  
  const editMessage = async (messageId: string, newContent: string) => {
    // Update message
    // Regenerate from this point
  };
  
  const deleteMessage = async (messageId: string) => {
    // Remove message and all after it
  };
  
  return { messages, isLoading, sendMessage, editMessage, deleteMessage };
}
```

**useLocalStorage (`hooks/useLocalStorage.ts`):**
- Persist active chat ID
- Save chat preferences
- Sync across tabs

#### 5. Chat Components

**ChatMessage (`components/ChatMessage.tsx`):**
- **Avatar System**: Different avatars for user/bot
- **Message Bubbles**: Glassmorphism styling with gradients
- **Timestamps**: Formatted time display
- **Animations**: Fade-in effects and hover states

**ChatInput (`components/ChatInput.tsx`):**
- **Form Handling**: Controlled input with submit validation
- **Loading States**: Disabled state during bot responses
- **Button Animations**: Gradient effects and icon transitions
- **Responsive**: Mobile-optimized layout

**LoadingIndicator (`components/LoadingIndicator.tsx`):**
- **Spinner Animation**: Rotating loader icon
- **Bot Avatar**: Consistent branding
- **Glassmorphism**: Matching chat bubble style

#### 6. Animated Background (`components/AnimatedBackground.tsx`)
- **Gradient Orbs**: Multiple colored circles with blur effects
- **CSS Animations**: Pulsing effects with staggered delays
- **Responsive Sizing**: Adapts to different screen sizes
- **Performance**: GPU-accelerated transforms

### Styling System

#### Custom CSS (`app/app.css`)
```css
/* Glassmorphism base */
.backdrop-blur-xl {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Custom animations */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  background: rgba(15, 23, 42, 0.5);
}
```

#### Tailwind Configuration
- **Dark Theme**: Default dark color scheme
- **Custom Gradients**: Purple, pink, cyan color combinations
- **Glassmorphism Utilities**: Backdrop blur and transparency
- **Animation Classes**: Fade-in, pulse, and hover effects

### Package Configuration

#### Vite Config (`vite.config.ts`)
```ts
export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
```

#### React Router Config (`react-router.config.ts`)
```ts
export default {
  ssr: true, // Server-side rendering enabled
} satisfies Config;
```

#### TypeScript Config (`tsconfig.json`)
- **Modern Target**: ES2022 with DOM types
- **Path Mapping**: `~/*` for app directory
- **Strict Mode**: Full TypeScript strictness
- **JSX**: React JSX transform

## Design System

### Color Palette
- **Primary**: Purple to cyan gradients
- **Secondary**: Pink to purple gradients
- **Background**: Slate 950/900 dark gradients
- **Text**: White/gray scale for contrast
- **Accents**: Transparent whites for glassmorphism

### Component Patterns
- **Glassmorphism**: `backdrop-blur-xl bg-white/5 border border-white/10`
- **Gradients**: `bg-gradient-to-r from-purple-500 to-cyan-500`
- **Shadows**: `shadow-lg shadow-purple-500/50`
- **Animations**: Fade-in, pulse, and hover transforms

### Responsive Design
- **Mobile First**: Base styles for mobile
- **Breakpoints**: `md:` for desktop layouts
- **Navigation**: Hamburger menu on mobile
- **Typography**: Responsive text sizing

## API Integration

### Frontend to Backend Communication
```typescript
const response = await fetch("http://localhost:8000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: input }),
});
```

### Message Flow
1. User types message in ChatInput
2. Frontend sends POST to `/api/chat` with chat_id
3. Backend processes through LangChain agent
4. Backend retrieves chat history for context
5. Agent decides whether to use tools (MongoDB, web search, Wikipedia, calculator)
6. Response returned as JSON
7. Frontend displays bot message with animation
8. Message saved to database with chat session

### Chat Management Flow
1. **Create New Chat**: `POST /api/chats` → Returns new chat session
2. **Load Chat**: `GET /api/chats/{chat_id}` → Returns messages
3. **Edit Message**: `PUT /api/chats/{chat_id}/messages/{message_id}` → Updates message and regenerates
4. **Delete Chat**: `DELETE /api/chats/{chat_id}` → Removes entire session

## Setup Instructions

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Configure .env file
uvicorn api.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```env
# Backend .env
GOOGLE_API_KEY=your_google_api_key_here
MONGODB_URI=your_mongodb_atlas_uri
```

## Key Implementation Details

### LangChain Agent Logic
- **Tool Selection**: Smart decision making on when to use database
- **Prompt Engineering**: Clear instructions for poetic responses
- **Error Handling**: Graceful failures with user-friendly messages
- **Memory**: Stateless design with conversation context

### Real-time Features
- **Auto-scroll**: Messages container scrolls to bottom
- **Loading States**: Visual feedback during API calls
- **Error Recovery**: Retry mechanisms and error messages
- **Responsive Updates**: Immediate UI updates

### Performance Optimizations
- **Code Splitting**: Route-based splitting with React Router
- **Asset Optimization**: Vite build optimizations
- **CSS Efficiency**: Tailwind purging and minimal custom CSS
- **MongoDB Indexing**: Efficient database queries

## Testing Strategy

### Manual Testing Scenarios
1. **General Questions**: "What is Python?" → Direct rhyming answer (no tools)
2. **Database Queries**: "Show me my posts" → MongoDB tool usage
3. **Web Search**: "What's the weather in Tokyo?" → Web search tool
4. **Wikipedia**: "Who is Marie Curie?" → Wikipedia tool
5. **Math Calculations**: "Calculate 15% tip on $85" → Calculator tool
6. **Code Generation**: "Write a Python function to sort a list" → Verify code rendering
7. **Usage Statistics**: Toggle stats panel and verify metrics
8. **Chat Management**: Create, switch, edit, delete chats
9. **Message Editing**: Edit last message and regenerate response
10. **Streaming**: Verify word-by-word response display
11. **Voice Input**: Test microphone button and speech recognition
12. **Quick Actions**: Copy, regenerate, and feedback buttons
13. **Keyboard Shortcuts**: Test Ctrl+Enter, Ctrl+N, Esc
14. **Error Handling**: Network failures with auto-retry
15. **Navigation**: Home ↔ Chat transitions
16. **Responsive**: Mobile/desktop layout testing

### Expected Behaviors
- Fast response times (<2 seconds)
- Smooth animations and transitions
- Proper error states and recovery
- Consistent rhyming in all responses
- Smart tool usage decisions
- Chat sessions persist across page reloads
- Edit message updates context correctly
- Delete confirmation prevents accidental loss

## Deployment Considerations

### Docker Support
- **Frontend**: Multi-stage build with Node.js
- **Backend**: Python container with dependencies
- **Environment**: Production environment variables

### Production Checklist
- [ ] Environment variables configured
- [ ] MongoDB Atlas connection string
- [ ] Google API key with proper quotas
- [ ] CORS origins updated for production
- [ ] Build optimization enabled
- [ ] Error logging configured

## Extension Ideas

### Additional Features

- **User Authentication**: Login/logout with sessions
- **Chat History**: Persistent conversation storage in MongoDB
- **File Upload**: RAG with document uploads (PDF, TXT, DOCX)
- **Voice Chat**: Speech-to-text integration with Web Speech API
- **Themes**: Multiple color schemes (purple, blue, green)
- **Admin Panel**: Content management interface
- **Export Chat**: Download conversation as PDF or Markdown
- **Share Chat**: Generate shareable links to conversations
- **Chat Tags**: Organize conversations by topics
- **Smart Suggestions**: Quick reply buttons based on context

## Essential MVP Enhancements (Recommended)

These features significantly improve user experience without adding complexity:

### 1. **Streaming Responses** 🌊 (HIGH PRIORITY)
- **Why**: Makes AI feel more responsive and engaging
- **Implementation**: Use Server-Sent Events (SSE) or WebSocket
- **User Experience**: See responses appear word-by-word like ChatGPT
- **Complexity**: Low - FastAPI has built-in SSE support

```python
# Backend example
from fastapi.responses import StreamingResponse

@app.post("/api/chat/stream")
async def chat_stream(message: ChatMessage):
    async def generate():
        for chunk in agent.stream(message.content):
            yield f"data: {json.dumps({'content': chunk})}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
```

```typescript
// Frontend example
const eventSource = new EventSource(`/api/chat/stream`);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  setStreamingMessage(prev => prev + data.content);
};
```

### 2. **Context-Aware Conversation Memory** 🧠 (HIGH PRIORITY)
- **Why**: Essential for coherent multi-turn conversations
- **Implementation**: Pass last 5-10 messages to agent
- **User Experience**: Bot remembers previous context
- **Complexity**: Low - already have chat history in DB

```python
def get_conversation_context(chat_id: str, limit: int = 10):
    messages = await get_recent_messages(chat_id, limit)
    return [{"role": msg.role, "content": msg.content} for msg in messages]
```

### 3. **Quick Action Buttons** ⚡ (MEDIUM PRIORITY)
- **Why**: Reduces friction for common actions
- **Features**:
  - 📋 Copy message
  - 🔄 Regenerate response
  - ✏️ Edit and retry
  - 👍/👎 Feedback buttons
  - 🔗 Share message
- **Complexity**: Low - just UI enhancements

### 4. **Voice Input (Web Speech API)** 🎤 (MEDIUM PRIORITY)
- **Why**: Accessibility and convenience
- **Implementation**: Browser's built-in Speech Recognition API
- **User Experience**: Click mic button and speak
- **Complexity**: Low - no backend changes needed

```typescript
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  setInput(transcript);
};
```

### 5. **Error Retry Logic** 🔁 (HIGH PRIORITY)
- **Why**: Handles network failures gracefully
- **Implementation**: Automatic retry with exponential backoff
- **User Experience**: Seamless recovery from temporary failures
- **Complexity**: Low - simple retry mechanism

```typescript
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

### 6. **Loading Skeleton States** 💀 (LOW PRIORITY)
- **Why**: Better perceived performance
- **Implementation**: Placeholder UI while loading
- **User Experience**: Smoother visual feedback
- **Complexity**: Low - CSS/Tailwind only

### 7. **Keyboard Shortcuts** ⌨️ (LOW PRIORITY)
- **Features**:
  - `Ctrl+Enter` - Send message
  - `Ctrl+N` - New chat
  - `Esc` - Clear input
  - `↑` - Edit last message
- **Complexity**: Low - event listeners only

### 8. **Toast Notifications** 🍞 (MEDIUM PRIORITY)
- **Why**: Non-intrusive feedback for actions
- **Use Cases**: Copy success, errors, chat saved
- **Library**: Sonner or React-Hot-Toast
- **Complexity**: Low - simple integration

```bash
npm install sonner
```

### 9. **Optimistic UI Updates** ⚡ (MEDIUM PRIORITY)
- **Why**: Instant feedback, feels faster
- **Implementation**: Show message immediately, update on response
- **User Experience**: Zero perceived latency
- **Complexity**: Low - state management pattern

### 10. **Message Timestamps & Read Receipts** ⏰ (LOW PRIORITY)
- **Features**:
  - Relative time ("2 minutes ago")
  - Exact time on hover
  - Message status indicators
- **Complexity**: Low - formatting only

## What NOT to Add (Keep It Simple)

Avoid these for MVP:
- ❌ User authentication (adds auth complexity)
- ❌ Real-time collaboration (WebSocket complexity)
- ❌ File uploads (storage & processing overhead)
- ❌ Custom AI training (out of scope)
- ❌ Payment integration (premature)
- ❌ Complex analytics dashboard (overkill)
- ❌ Multi-language support (localization effort)

## Recommended MVP Feature Priority

**Must Have (Week 1):**
1. ✅ Streaming responses
2. ✅ Conversation memory/context
3. ✅ Error retry logic
4. ✅ Quick action buttons (copy, regenerate)

**Should Have (Week 2):**
5. ✅ Voice input
6. ✅ Toast notifications
7. ✅ Keyboard shortcuts
8. ✅ Optimistic UI updates

**Nice to Have (Week 3):**
9. ✅ Loading skeletons
10. ✅ Message timestamps
11. ✅ Markdown preview in input
12. ✅ Dark/Light mode toggle

### Technical Improvements
- **Rate Limiting**: API throttling per user/IP
- **Caching**: Response caching for common queries with Redis
- **Monitoring**: Application performance monitoring with Sentry
- **Security**: Input validation, sanitization, and CSRF protection
- **Testing**: Unit tests (pytest, vitest) and E2E tests (Playwright)
- **Code Quality**: ESLint, Prettier, Black, MyPy
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Database Indexing**: Optimized MongoDB indexes for chat queries
- **WebSocket Support**: Real-time streaming responses
- **Tool Extensibility**: Plugin system for adding custom tools

---

## Instructions for AI Assistant

When rebuilding this project:

1. **Start with Backend**: Set up FastAPI server and basic endpoints
2. **Configure LangChain**: Implement ReAct agent with Google Gemini
3. **Add Multiple Tools**: MongoDB, web search, Wikipedia, calculator integration
4. **Implement Chat Management**: CRUD operations for chat sessions
5. **Build Frontend**: React Router setup with TypeScript
6. **Create Chat Sidebar**: Session list with new/delete functionality
7. **Implement UI Components**: Glassmorphism design system
8. **Add Message Editing**: Edit and regenerate functionality
9. **Add Animations**: Smooth transitions and loading states
10. **Test Integration**: Ensure proper API communication and tool usage
11. **Refine Prompts**: Optimize agent behavior and tool selection

Focus on:
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Comprehensive error states
- **User Experience**: Smooth animations and feedback
- **Code Quality**: Clean, maintainable code structure
- **Performance**: Optimized builds and queries
- **Scalability**: Design for multiple users and chat sessions
- **Tool Intelligence**: Agent should choose appropriate tools automatically

This prompt provides complete context for rebuilding the full-stack RAG chatbot with all its modern features, chat management, multiple AI tools (MongoDB, Web Search, Wikipedia, Calculator), and glassmorphism design.

