# Backend API Routes Documentation

This document provides a comprehensive overview of all API endpoints available in the Python RAG ChatAgent backend.

## Table of Contents

1. [Root & Health Check](#root--health-check)
2. [Chat & Messaging](#chat--messaging)
3. [Chat Sessions](#chat-sessions)
4. [Messages](#messages)
5. [RAG & Document Management](#rag--document-management)
6. [Memory Management](#memory-management)
7. [Task Management](#task-management)
8. [Reminder Management](#reminder-management)
9. [Prompt Templates](#prompt-templates)
10. [Personas](#personas)
11. [Retrieval Feedback](#retrieval-feedback)

---

## Root & Health Check

### GET `/`
**Description:** Root endpoint providing API information.

**Response:**
```json
{
  "message": "Welcome to RAG Chatbot API",
  "docs": "/docs",
  "health": "/api/health"
}
```

### GET `/api/health`
**Description:** Health check endpoint to verify API and database connectivity.

**Response Model:** `HealthResponse`
```json
{
  "status": "healthy",
  "message": "API is running",
  "database_connected": true
}
```

---

## Chat & Messaging

### POST `/api/chat`
**Description:** Send a message and get an intelligent response from the chatbot.

**Request Body:** `ChatMessage`
- `message` (string, required): User's message (1-2000 characters)
- `chat_id` (string, optional): Chat session ID to continue conversation

**Response Model:** `ChatResponse`
```json
{
  "response": "Bot's response text",
  "chat_id": "session_id",
  "error": null,
  "thought_process": [],
  "llm_metadata": {},
  "retrieval_context": {}
}
```

**Features:**
- Maintains conversation history when `chat_id` is provided
- Auto-generates chat title from first message
- Returns thought process, LLM metadata, and retrieval context

### POST `/api/chat/stream`
**Description:** Stream chat responses word-by-word using Server-Sent Events (SSE).

**Request Body:** `ChatMessage` (same as `/api/chat`)

**Response:** Server-Sent Events stream
- `type: 'chat_id'` - New chat session ID
- `type: 'title'` - Auto-generated title
- `type: 'llm_metadata'` - LLM selection information
- `type: 'retrieval_context'` - RAG context information
- `type: 'thought_process'` - Agent reasoning steps
- `type: 'token'` - Streamed response tokens
- `type: 'done'` - Completion signal
- `type: 'error'` - Error message

---

## Chat Sessions

### POST `/api/chats`
**Description:** Create a new chat session.

**Request Body:** `CreateChatRequest`
- `title` (string, optional): Chat title (default: "New Chat")
- `metadata` (object, optional): Additional metadata

**Response:**
```json
{
  "chat_id": "session_id",
  "message": "Chat session created successfully"
}
```

### GET `/api/chats`
**Description:** Get all chat sessions (without full message history).

**Query Parameters:**
- `limit` (int, default: 50): Maximum sessions to return
- `skip` (int, default: 0): Sessions to skip for pagination

**Response Model:** `List[ChatSessionResponse]`

### GET `/api/chats/{chat_id}`
**Description:** Get a specific chat session with full message history.

**Path Parameters:**
- `chat_id` (string, required): Chat session ID

**Response Model:** `ChatDetailResponse`

### DELETE `/api/chats/{chat_id}`
**Description:** Delete a chat session.

**Path Parameters:**
- `chat_id` (string, required): Chat session ID

**Response:**
```json
{
  "message": "Chat session deleted successfully",
  "chat_id": "session_id"
}
```

### PUT `/api/chats/{chat_id}/title`
**Description:** Update chat session title.

**Path Parameters:**
- `chat_id` (string, required): Chat session ID

**Request Body:** `UpdateTitleRequest`
- `title` (string, required): New title (1-200 characters)

**Response:**
```json
{
  "message": "Chat title updated successfully",
  "chat_id": "session_id",
  "title": "New Title"
}
```

### PATCH `/api/chats/{chat_id}/pin`
**Description:** Toggle chat session pin status.

**Path Parameters:**
- `chat_id` (string, required): Chat session ID

**Request Body:** `TogglePinRequest`
- `is_pinned` (boolean, required): Pin status

**Response:**
```json
{
  "message": "Chat pin status updated successfully",
  "chat_id": "session_id",
  "is_pinned": true
}
```

### PATCH `/api/chats/{chat_id}/star`
**Description:** Toggle chat session star/favorite status.

**Path Parameters:**
- `chat_id` (string, required): Chat session ID

**Request Body:** `ToggleStarRequest`
- `is_starred` (boolean, required): Star status

**Response:**
```json
{
  "message": "Chat star status updated successfully",
  "chat_id": "session_id",
  "is_starred": true
}
```

### PATCH `/api/chats/{chat_id}/tags`
**Description:** Update chat session tags.

**Path Parameters:**
- `chat_id` (string, required): Chat session ID

**Request Body:** `UpdateTagsRequest`
- `tags` (array of strings, required): List of tags

**Response:**
```json
{
  "message": "Chat tags updated successfully",
  "chat_id": "session_id",
  "tags": ["tag1", "tag2"]
}
```

### GET `/api/chats/tags/list`
**Description:** Get all unique tags used across all chat sessions.

**Response:**
```json
{
  "tags": ["tag1", "tag2", "tag3"]
}
```

### PATCH `/api/chats/{chat_id}/persona`
**Description:** Update chat session persona.

**Path Parameters:**
- `chat_id` (string, required): Chat session ID

**Request Body:** `UpdatePersonaRequest`
- `persona_id` (string, optional): Persona ID (null to use default)

**Response:**
```json
{
  "message": "Chat persona updated successfully",
  "chat_id": "session_id",
  "persona_id": "persona_id"
}
```

### GET `/api/chats/{chat_id}/stats`
**Description:** Get usage statistics for a specific chat session.

**Path Parameters:**
- `chat_id` (string, required): Chat session ID

**Response Model:** `UsageStatsResponse`
- Token usage, costs, tool usage, and performance metrics

---

## Messages

### PUT `/api/chats/{chat_id}/messages/{message_id}`
**Description:** Update a specific message content.

**Path Parameters:**
- `chat_id` (string, required): Chat session ID
- `message_id` (string, required): Message ID

**Request Body:** `UpdateMessageRequest`
- `content` (string, required): New content (1-5000 characters)

**Response:**
```json
{
  "message": "Message updated successfully",
  "chat_id": "session_id",
  "message_id": "msg_id"
}
```

### DELETE `/api/chats/{chat_id}/messages/{message_id}`
**Description:** Delete a specific message.

**Path Parameters:**
- `chat_id` (string, required): Chat session ID
- `message_id` (string, required): Message ID

**Response:**
```json
{
  "message": "Message deleted successfully",
  "chat_id": "session_id",
  "message_id": "msg_id"
}
```

### POST `/api/chats/{chat_id}/regenerate/{message_id}`
**Description:** Regenerate response from a specific message (removes all messages after it).

**Path Parameters:**
- `chat_id` (string, required): Chat session ID
- `message_id` (string, required): Message ID to regenerate from

**Response:**
```json
{
  "message": "Response regenerated successfully",
  "chat_id": "session_id",
  "response": "New response text",
  "thought_process": [],
  "llm_metadata": {}
}
```

---

## RAG & Document Management

### POST `/api/documents/upload`
**Description:** Upload and process a document for RAG.

**Request Body:** Form Data
- `file` (file, required): Document file (PDF, TXT, MD, DOCX, HTML)
- `collection_name` (string, default: "global_memory"): Memory collection name
- `chat_id` (string, optional): Chat ID for chat-specific memory

**Response:**
```json
{
  "status": "success",
  "message": "Document 'file.pdf' uploaded and processed successfully",
  "document": {
    "filename": "file.pdf",
    "file_type": ".pdf",
    "chunks_created": 25,
    "collection": "global_memory",
    "document_ids": ["id1", "id2", "id3", "id4", "id5"]
  },
  "collection_stats": {}
}
```

**Supported File Types:**
- `.pdf` - PDF documents
- `.txt` - Plain text
- `.md` - Markdown
- `.docx` - Microsoft Word
- `.html`, `.htm` - HTML files

### GET `/api/documents/list`
**Description:** List all documents in a collection with metadata.

**Query Parameters:**
- `collection_name` (string, default: "global_memory"): Collection name
- `limit` (int, default: 100): Maximum documents to return

**Response:**
```json
{
  "status": "success",
  "collection": "global_memory",
  "total_documents": 10,
  "total_chunks": 250,
  "documents": [],
  "collection_stats": {}
}
```

### DELETE `/api/documents/{collection_name}/{filename}`
**Description:** Delete a specific document from a collection.

**Path Parameters:**
- `collection_name` (string, required): Collection name
- `filename` (string, required): File to delete

**Response:**
```json
{
  "status": "success",
  "message": "Deleted document 'file.pdf' (25 chunks)",
  "collection": "global_memory",
  "filename": "file.pdf",
  "chunks_deleted": 25
}
```

### POST `/api/documents/bulk-delete`
**Description:** Delete multiple documents at once.

**Request Body:** Form Data
- `collection_name` (string, required): Collection name
- `filenames` (string, required): JSON string array of filenames

**Response:**
```json
{
  "status": "success",
  "message": "Bulk delete completed: 3 files processed",
  "total_chunks_deleted": 75,
  "results": []
}
```

### GET `/api/documents/preview/{collection_name}/{filename}`
**Description:** Get a preview of a document.

**Path Parameters:**
- `collection_name` (string, required): Collection name
- `filename` (string, required): File name

**Query Parameters:**
- `max_chars` (int, default: 500): Maximum characters to return

**Response:**
```json
{
  "status": "success",
  "filename": "file.pdf",
  "collection": "global_memory",
  "total_chunks": 25,
  "preview": "Document preview text...",
  "metadata": {}
}
```

---

## Memory Management

### GET `/api/memory/stats`
**Description:** Get statistics about a memory collection.

**Query Parameters:**
- `collection_name` (string, default: "global_memory"): Collection name

**Response:**
```json
{
  "status": "success",
  "stats": {}
}
```

### POST `/api/memory/search`
**Description:** Search memory for relevant information with scope awareness.

**Request Body:** Form Data
- `query` (string, required): Search query
- `collection_name` (string, default: "global_memory"): Collection to search
- `num_results` (int, default: 5): Number of results to return
- `chat_id` (string, optional): Chat ID for chat-specific search
- `use_global` (boolean, default: true): Enable global memory search
- `scope` (string, default: "both"): "global", "chat", or "both"

**Response:**
```json
{
  "status": "success",
  "query": "search query",
  "scope": "both",
  "chat_id": null,
  "use_global": true,
  "results": [],
  "total_found": 5
}
```

### DELETE `/api/memory/{collection_name}`
**Description:** Delete an entire memory collection.

**Path Parameters:**
- `collection_name` (string, required): Collection name

**Response:**
```json
{
  "status": "success",
  "message": "Collection 'global_memory' deleted successfully"
}
```

### POST `/api/memory/save`
**Description:** Save information to memory with scope control.

**Request Body:** Form Data
- `content` (string, required): Content to save
- `chat_id` (string, optional): Chat ID for chat-specific memory
- `use_global` (boolean, default: true): Enable global memory
- `scope` (string, default: "global"): "global", "chat", or "both"
- `metadata` (string, optional): JSON metadata

**Response:**
```json
{
  "status": "success",
  "message": "Saved to memory",
  "saved_to": ["global_memory"]
}
```

### GET `/api/memory/stats/{scope}`
**Description:** Get memory statistics with scope awareness.

**Path Parameters:**
- `scope` (string, required): "global", "chat", or "both"

**Query Parameters:**
- `chat_id` (string, optional): Chat ID
- `use_global` (boolean, default: true): Enable global memory

**Response:**
```json
{
  "status": "success",
  "scope": "both",
  "chat_id": null,
  "stats": {}
}
```

### POST `/api/memory/create`
**Description:** Create a new memory entry.

**Request Body:** `CreateMemoryRequest`
- `content` (string, required): Content (1-10000 characters)
- `collection` (string, default: "global_memory"): Collection name
- `metadata` (object, optional): Additional metadata
- `tags` (array of strings, optional): Tags for the memory

**Response:**
```json
{
  "status": "success",
  "memory_id": "mem_id",
  "collection": "global_memory",
  "content": "Memory content",
  "metadata": {},
  "tags": []
}
```

### GET `/api/memory/list/{collection}`
**Description:** List memories with pagination and filtering.

**Path Parameters:**
- `collection` (string, required): Collection name

**Query Parameters:**
- `limit` (int, default: 50): Maximum results per page
- `offset` (int, default: 0): Results to skip
- `tag` (string, optional): Tag filter

**Response:**
```json
{
  "status": "success",
  "collection": "global_memory",
  "total": 100,
  "limit": 50,
  "offset": 0,
  "memories": []
}
```

### GET `/api/memory/{collection}/{memory_id}`
**Description:** Get a specific memory by ID.

**Path Parameters:**
- `collection` (string, required): Collection name
- `memory_id` (string, required): Memory ID

**Response:**
```json
{
  "status": "success",
  "memory_id": "mem_id",
  "content": "Memory content",
  "metadata": {},
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00",
  "tags": []
}
```

### PUT `/api/memory/{collection}/{memory_id}`
**Description:** Update an existing memory.

**Path Parameters:**
- `collection` (string, required): Collection name
- `memory_id` (string, required): Memory ID

**Request Body:** `UpdateMemoryRequest`
- `content` (string, optional): New content (1-10000 characters)
- `metadata` (object, optional): Metadata to merge
- `tags` (array of strings, optional): Tags to update

**Response:**
```json
{
  "status": "success",
  "memory_id": "mem_id",
  "content": "Updated content",
  "metadata": {},
  "updated_at": "2024-01-01T00:00:00",
  "tags": []
}
```

### DELETE `/api/memory/{collection}/{memory_id}`
**Description:** Delete a specific memory.

**Path Parameters:**
- `collection` (string, required): Collection name
- `memory_id` (string, required): Memory ID

**Response:**
```json
{
  "status": "success",
  "message": "Memory mem_id deleted",
  "memory_id": "mem_id"
}
```

### POST `/api/memory/bulk-delete`
**Description:** Delete multiple memories at once.

**Request Body:** `BulkDeleteRequest`
- `memory_ids` (array of strings, required): Memory IDs to delete

**Response:**
```json
{
  "status": "success",
  "message": "Deleted 5 memories",
  "deleted_count": 5,
  "requested_count": 5
}
```

### GET `/api/memory/tags/{collection}`
**Description:** Get all unique tags in a collection.

**Path Parameters:**
- `collection` (string, required): Collection name

**Response:**
```json
{
  "status": "success",
  "collection": "global_memory",
  "tags": ["tag1", "tag2"],
  "count": 2
}
```

---

## Task Management

### POST `/api/tasks/create`
**Description:** Create a new task.

**Request Body:** `TaskCreate`
- `title` (string, required): Task title
- `description` (string, optional): Task description
- `status` (enum, optional): Task status (todo, in_progress, done, cancelled)
- `priority` (enum, optional): Task priority (low, medium, high, urgent)
- `due_date` (datetime, optional): Due date
- `tags` (array of strings, optional): Task tags

**Response Model:** `Task`

### GET `/api/tasks/list`
**Description:** List tasks with pagination and filters.

**Query Parameters:**
- `page` (int, default: 1): Page number (1-indexed)
- `page_size` (int, default: 50): Tasks per page
- `status` (enum, optional): Filter by status
- `priority` (enum, optional): Filter by priority
- `tags` (string, optional): Filter by tags (comma-separated)
- `search` (string, optional): Text search in title/description

**Response Model:** `TaskListResponse`
```json
{
  "tasks": [],
  "total": 100,
  "page": 1,
  "page_size": 50,
  "total_pages": 2
}
```

### GET `/api/tasks/{task_id}`
**Description:** Get specific task by ID.

**Path Parameters:**
- `task_id` (string, required): Task identifier

**Response Model:** `Task`

### PUT `/api/tasks/{task_id}`
**Description:** Update task.

**Path Parameters:**
- `task_id` (string, required): Task identifier

**Request Body:** `TaskUpdate`
- All fields from `TaskCreate` are optional

**Response Model:** `Task`

### DELETE `/api/tasks/{task_id}`
**Description:** Delete task.

**Path Parameters:**
- `task_id` (string, required): Task identifier

**Response:**
```json
{
  "status": "success",
  "message": "Task task_id deleted successfully"
}
```

### POST `/api/tasks/bulk-delete`
**Description:** Bulk delete tasks.

**Request Body:** `TaskBulkDeleteRequest`
- `task_ids` (array of strings, required): Task IDs to delete

**Response:**
```json
{
  "status": "success",
  "deleted_count": 5,
  "message": "Successfully deleted 5 task(s)"
}
```

### PATCH `/api/tasks/{task_id}/status`
**Description:** Quick status update for a task.

**Path Parameters:**
- `task_id` (string, required): Task identifier

**Request Body:** `TaskStatusUpdate`
- `status` (enum, required): New status

**Response Model:** `Task`

### GET `/api/tasks/tags/list`
**Description:** Get all unique task tags.

**Response Model:** `List[str]`

### GET `/api/tasks/stats/summary`
**Description:** Get task statistics.

**Response Model:** `TaskStatsResponse`
- Counts by status and priority

---

## Reminder Management

### POST `/api/reminders/create`
**Description:** Create a new reminder.

**Request Body:** `ReminderCreate`
- `title` (string, required): Reminder title
- `description` (string, optional): Reminder description
- `remind_at` (datetime, required): When to remind
- `status` (enum, optional): Reminder status (pending, completed, dismissed, snoozed)
- `priority` (enum, optional): Reminder priority (low, medium, high, urgent)
- `recurrence_type` (enum, optional): Recurrence type (none, daily, weekly, monthly, yearly)
- `recurrence_end_date` (datetime, optional): When recurrence ends
- `tags` (array of strings, optional): Reminder tags

**Response Model:** `Reminder`

### GET `/api/reminders/list`
**Description:** List reminders with pagination and filters.

**Query Parameters:**
- `page` (int, default: 1): Page number (1-indexed)
- `page_size` (int, default: 20, max: 100): Items per page
- `status` (enum, optional): Filter by status
- `priority` (enum, optional): Filter by priority
- `tags` (string, optional): Comma-separated tags to filter by
- `search` (string, optional): Search in title and description
- `due_before` (string, optional): Filter reminders due before this ISO date
- `due_after` (string, optional): Filter reminders due after this ISO date
- `overdue_only` (boolean, default: false): Show only overdue reminders
- `pending_only` (boolean, default: false): Show only pending reminders

**Response Model:** `ReminderListResponse`

### GET `/api/reminders/pending`
**Description:** Get pending/due reminders.

**Query Parameters:**
- `limit` (int, default: 50): Maximum reminders to return

**Response Model:** `List[Reminder]`

### GET `/api/reminders/{reminder_id}`
**Description:** Get specific reminder by ID.

**Path Parameters:**
- `reminder_id` (string, required): Reminder identifier

**Response Model:** `Reminder`

### PUT `/api/reminders/{reminder_id}`
**Description:** Update reminder.

**Path Parameters:**
- `reminder_id` (string, required): Reminder identifier

**Request Body:** `ReminderUpdate`
- All fields from `ReminderCreate` are optional

**Response Model:** `Reminder`

### DELETE `/api/reminders/{reminder_id}`
**Description:** Delete reminder.

**Path Parameters:**
- `reminder_id` (string, required): Reminder identifier

**Response:**
```json
{
  "message": "Reminder deleted successfully"
}
```

### POST `/api/reminders/bulk-delete`
**Description:** Bulk delete reminders.

**Request Body:** `ReminderBulkDeleteRequest`
- `reminder_ids` (array of strings, required): Reminder IDs to delete

**Response:**
```json
{
  "message": "Successfully deleted 5 reminders",
  "deleted_count": 5
}
```

### PATCH `/api/reminders/{reminder_id}/complete`
**Description:** Mark reminder as completed.

**Path Parameters:**
- `reminder_id` (string, required): Reminder identifier

**Response:**
```json
{
  "message": "Reminder marked as completed"
}
```

### PATCH `/api/reminders/{reminder_id}/snooze`
**Description:** Snooze reminder.

**Path Parameters:**
- `reminder_id` (string, required): Reminder identifier

**Request Body:** `SnoozeRequest`
- `snooze_until` (datetime, required): When to remind again

**Response:**
```json
{
  "message": "Reminder snoozed until 2024-01-01T00:00:00"
}
```

### GET `/api/reminders/tags/list`
**Description:** Get all unique reminder tags.

**Response Model:** `List[str]`

### GET `/api/reminders/stats/summary`
**Description:** Get reminder statistics.

**Response Model:** `ReminderStatsResponse`
- Counts by status and priority

---

## Prompt Templates

### POST `/api/prompt-templates/create`
**Description:** Create a new custom prompt template.

**Request Body:** `PromptTemplateCreate`
- `title` (string, required): Template title
- `content` (string, required): Template content
- `category` (string, optional): Category (rag, tasks, reminders, memory, code, research, writing, custom)
- `description` (string, optional): Template description
- `tags` (array of strings, optional): Template tags

**Response Model:** `PromptTemplate`

### GET `/api/prompt-templates/list`
**Description:** List prompt templates with optional filters.

**Query Parameters:**
- `category` (string, optional): Filter by category
- `is_system` (boolean, optional): Filter system templates
- `is_custom` (boolean, optional): Filter custom templates
- `skip` (int, default: 0): Templates to skip (pagination)
- `limit` (int, default: 50): Maximum templates to return

**Response Model:** `List[PromptTemplate]`

### GET `/api/prompt-templates/popular`
**Description:** Get most popular templates sorted by ranking score.

**Query Parameters:**
- `limit` (int, default: 6): Maximum templates to return

**Response Model:** `List[PromptTemplate]`

**Ranking Formula:** `(click_count * 0.4) + (recency * 0.3) + (success_rate * 0.3)`

### GET `/api/prompt-templates/recent`
**Description:** Get recently used templates.

**Query Parameters:**
- `limit` (int, default: 5): Maximum templates to return

**Response Model:** `List[PromptTemplate]`

### GET `/api/prompt-templates/{template_id}`
**Description:** Get a specific prompt template by ID.

**Path Parameters:**
- `template_id` (string, required): Template unique identifier

**Response Model:** `PromptTemplate`

### PUT `/api/prompt-templates/{template_id}`
**Description:** Update a custom prompt template (only custom templates can be updated).

**Path Parameters:**
- `template_id` (string, required): Template unique identifier

**Request Body:** `PromptTemplateUpdate`
- All fields from `PromptTemplateCreate` are optional

**Response Model:** `PromptTemplate`

### DELETE `/api/prompt-templates/{template_id}`
**Description:** Delete a custom prompt template (only custom templates can be deleted).

**Path Parameters:**
- `template_id` (string, required): Template unique identifier

**Response:**
```json
{
  "message": "Template deleted successfully",
  "template_id": "tmpl_id"
}
```

### POST `/api/prompt-templates/{template_id}/track-usage`
**Description:** Track template usage and update statistics.

**Path Parameters:**
- `template_id` (string, required): Template unique identifier

**Request Body:** `PromptTemplateUsageTrack`
- `success` (boolean, required): Whether the template usage was successful

**Response Model:** `PromptTemplate`

**Updates:**
- Increments click count
- Updates last_used_at timestamp
- Recalculates success rate

### GET `/api/prompt-templates/categories/list`
**Description:** Get all available template categories.

**Response Model:** `List[str]`

### GET `/api/prompt-templates/stats/summary`
**Description:** Get prompt template statistics.

**Response Model:** `PromptTemplateStats`
```json
{
  "total_templates": 50,
  "total_clicks": 500,
  "categories": 8,
  "most_popular": "Template Name"
}
```

---

## Personas

### GET `/api/personas/list`
**Description:** List all personas with optional filtering.

**Query Parameters:**
- `is_system` (boolean, optional): Filter by system/custom personas
- `is_active` (boolean, default: true): Filter by active status
- `tags` (string, optional): Comma-separated tags to filter by

**Response Model:** `List[PersonaListResponse]`

### GET `/api/personas/{persona_id}`
**Description:** Get a specific persona by ID (includes full system prompt).

**Path Parameters:**
- `persona_id` (string, required): Persona ID

**Response Model:** `PersonaResponse`

### POST `/api/personas/create`
**Description:** Create a new custom persona.

**Request Body:** `PersonaCreate`
- `name` (string, required): Persona name
- `description` (string, required): Persona description
- `system_prompt` (string, required): System prompt for the persona
- `avatar` (string, optional): Avatar URL or emoji
- `color` (string, optional): Color theme
- `tags` (array of strings, optional): Persona tags

**Response Model:** `PersonaResponse`

**Note:** Custom personas are automatically set as non-system and active with use_count = 0.

### PUT `/api/personas/{persona_id}`
**Description:** Update a custom persona (cannot modify system personas).

**Path Parameters:**
- `persona_id` (string, required): Persona ID

**Request Body:** `PersonaUpdate`
- All fields from `PersonaCreate` are optional

**Response Model:** `PersonaResponse`

### DELETE `/api/personas/{persona_id}`
**Description:** Delete a custom persona (cannot delete system personas).

**Path Parameters:**
- `persona_id` (string, required): Persona ID

**Response:**
```json
{
  "message": "Persona deleted successfully",
  "persona_id": "persona_id"
}
```

### POST `/api/personas/{persona_id}/use`
**Description:** Increment usage count for a persona.

**Path Parameters:**
- `persona_id` (string, required): Persona ID

**Response:**
```json
{
  "message": "Usage tracked successfully",
  "persona_id": "persona_id"
}
```

### GET `/api/personas/tags/list`
**Description:** Get all unique persona tags.

**Response Model:** `List[str]`

---

## Retrieval Feedback

### POST `/api/retrieval/feedback`
**Description:** Record user feedback on a retrieved chunk to improve future retrievals.

**Request Body:** `RetrievalFeedbackRequest`
- `chunk_id` (string, required): Chunk identifier
- `helpful` (boolean, required): Whether the chunk was helpful
- `source` (string, required): Source document name
- `content` (string, required): Chunk content
- `relevance_score` (float, required): Relevance score
- `chat_id` (string, optional): Chat session ID
- `query` (string, optional): Search query
- `metadata` (object, optional): Additional metadata

**Response:**
```json
{
  "status": "success",
  "feedback_id": "feedback_id",
  "message": "Feedback recorded: helpful"
}
```

### GET `/api/retrieval/feedback/chunk/{chunk_id}`
**Description:** Get feedback statistics for a specific chunk.

**Path Parameters:**
- `chunk_id` (string, required): Chunk identifier

**Response:**
```json
{
  "status": "success",
  "chunk_id": "chunk_id",
  "stats": {
    "total_feedback": 10,
    "helpful_count": 8,
    "not_helpful_count": 2,
    "helpfulness_ratio": 0.8
  }
}
```

### GET `/api/retrieval/feedback/source/{source}`
**Description:** Get aggregate feedback statistics for all chunks from a source.

**Path Parameters:**
- `source` (string, required): Source document name

**Response:**
```json
{
  "status": "success",
  "source": "document.pdf",
  "stats": {
    "total_chunks": 25,
    "total_feedback": 50,
    "helpfulness_ratio": 0.75
  }
}
```

### GET `/api/retrieval/feedback/stats/overall`
**Description:** Get overall retrieval feedback statistics.

**Response:**
```json
{
  "status": "success",
  "stats": {
    "total_feedback": 500,
    "total_chunks": 100,
    "overall_helpfulness": 0.78
  }
}
```

### GET `/api/retrieval/feedback/poor-performing`
**Description:** Get chunks with poor feedback scores for improvement.

**Query Parameters:**
- `min_feedback` (int, default: 3): Minimum feedback count to consider
- `max_helpfulness` (float, default: 0.3): Maximum helpfulness ratio (0-1)

**Response:**
```json
{
  "status": "success",
  "criteria": {
    "min_feedback": 3,
    "max_helpfulness": 0.3
  },
  "chunks": [],
  "count": 5
}
```

### GET `/api/retrieval/feedback/recent`
**Description:** Get recent feedback entries.

**Query Parameters:**
- `limit` (int, default: 50): Maximum number of entries
- `helpful_only` (boolean, default: false): If true, only return helpful feedback

**Response:**
```json
{
  "status": "success",
  "limit": 50,
  "helpful_only": false,
  "feedback": [],
  "count": 50
}
```

---

## Enums & Constants

### Task Status
- `todo` - Task not yet started
- `in_progress` - Task is being worked on
- `done` - Task completed
- `cancelled` - Task cancelled

### Task Priority
- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority
- `urgent` - Urgent priority

### Reminder Status
- `pending` - Reminder is pending
- `completed` - Reminder completed
- `dismissed` - Reminder dismissed
- `snoozed` - Reminder snoozed

### Reminder Priority
- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority
- `urgent` - Urgent priority

### Recurrence Type
- `none` - No recurrence
- `daily` - Daily recurrence
- `weekly` - Weekly recurrence
- `monthly` - Monthly recurrence
- `yearly` - Yearly recurrence

### Memory Scope
- `global` - Global memory (accessible across all chats)
- `chat` - Chat-specific memory
- `both` - Both global and chat-specific

### Template Categories
- `rag` - RAG-related templates
- `tasks` - Task management templates
- `reminders` - Reminder templates
- `memory` - Memory management templates
- `code` - Code-related templates
- `research` - Research templates
- `writing` - Writing templates
- `custom` - Custom user templates

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Error message describing what went wrong with the request"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error message describing the internal error"
}
```

---

## Notes

1. **Authentication**: Currently, the API does not require authentication. All endpoints are publicly accessible.

2. **CORS**: CORS is enabled for origins specified in the `CORS_ORIGINS` environment variable (default: `http://localhost:5173`).

3. **Database**: The API uses MongoDB for data persistence and ChromaDB for vector storage.

4. **Streaming**: The `/api/chat/stream` endpoint uses Server-Sent Events (SSE) for real-time streaming responses.

5. **Pagination**: List endpoints use cursor-based or offset pagination. Check each endpoint's documentation for specific pagination parameters.

6. **File Upload**: Document upload endpoints accept multipart/form-data with file attachments.

7. **Date Formats**: All datetime fields use ISO 8601 format (e.g., `2024-01-01T00:00:00Z`).

8. **System vs Custom**: 
   - System templates and personas cannot be modified or deleted
   - Custom templates and personas can be fully managed by users

9. **Memory Collections**:
   - `global_memory` - Shared across all chats
   - `chat_{chat_id}` - Specific to a chat session

10. **API Documentation**: Interactive API documentation is available at `/docs` (Swagger UI) and `/redoc` (ReDoc).
