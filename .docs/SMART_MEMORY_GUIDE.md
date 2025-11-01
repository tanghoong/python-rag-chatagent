# 🧠 Smart Memory Search - User Guide

## Overview

The AI now **automatically decides** whether to search global memory, chat-specific memory, or both when retrieving context for your conversations. You don't need to manually select memory scopes anymore!

## How It Works

### Automatic Memory Selection

When you ask a question, the AI uses the new `smart_search_memory` tool that:

1. **Searches BOTH memory scopes simultaneously**
   - 🌐 **Global Memory** - Shared knowledge across all chats
   - 💬 **Chat Memory** - Conversation-specific context

2. **Returns the most relevant results** regardless of which memory they came from

3. **Shows source indicators** so you know where information originated

### Visual Indicators

```
🧠 Smart Search: Found 3 relevant memories:

1. 💬 Chat Memory [Relevance: 0.234]
   "You mentioned you prefer Python for ML projects..."

2. 🌐 Global Memory [Relevance: 0.312]
   "Best practices for machine learning: Use cross-validation..."

3. 💬 Chat Memory [Relevance: 0.389]
   "We previously discussed neural network architectures..."
```

**Legend:**
- 🌐 = Global Memory (shared knowledge)
- 💬 = Chat Memory (this conversation)
- Lower relevance score = more relevant

## Benefits

### ✅ Better Answers
The AI combines context from both personal conversation history and global knowledge base, giving you more comprehensive responses.

### ✅ No Manual Selection
You don't need to choose between "global" or "chat" memory anymore - the AI handles it automatically.

### ✅ Transparent Sources
You can see exactly where each piece of information came from (global knowledge vs. chat history).

### ✅ Smarter Context
The AI gets relevant context whether it's:
- Something you said earlier in this chat
- General knowledge stored in global memory
- A combination of both

## Examples

### Example 1: Personal Preference

**You**: "What did I tell you about my ML preferences?"

**AI Response**:
```
Based on our conversation, you mentioned:

1. 💬 You prefer Python for ML projects (from our chat on Jan 15)
2. 💬 You specifically like using PyTorch over TensorFlow
3. 🌐 Python ML best practices suggest using virtual environments
```

### Example 2: General Question with Context

**You**: "What are best practices for neural networks?"

**AI Response**:
```
Here are neural network best practices:

1. 🌐 Use proper initialization (Xavier/He initialization)
2. 🌐 Apply batch normalization for stable training
3. 💬 Based on your preference for PyTorch, here's a code example...
```

### Example 3: Follow-up Question

**You**: "How should I implement this based on what we discussed?"

**AI Response**:
```
Based on our previous discussion:

1. 💬 You mentioned working on an image classification project
2. 💬 You prefer using PyTorch with GPU acceleration
3. 🌐 Best practices suggest starting with a pretrained model
4. Here's an implementation...
```

## What Changed?

### Before (Manual Selection)
```
❌ Had to choose: "Search global memory" or "Search chat memory"
❌ Might miss relevant info from the other scope
❌ More steps to get comprehensive answers
```

### After (Smart Selection)
```
✅ AI automatically searches both scopes
✅ Gets all relevant context automatically
✅ One step, better results
```

## Technical Details

### For Developers

The system now uses:
- **Tool**: `smart_search_memory(query, num_results=5)`
- **Context Variable**: `current_chat_id` (automatically set)
- **Search Strategy**: Parallel search of both scopes, sorted by relevance
- **Error Handling**: Graceful degradation if one scope unavailable

### Memory Architecture

```
Your Question
     ↓
AI analyzes query
     ↓
Smart Search Tool
     ├→ Search Global Memory (🌐)
     └→ Search Chat Memory (💬)
     ↓
Combine & Sort by Relevance
     ↓
Return Best Results
     ↓
AI generates answer with context
```

## FAQ

**Q: Do I need to do anything different?**  
A: No! The AI handles everything automatically. Just ask your questions naturally.

**Q: Can I still see which memory was used?**  
A: Yes! Look for 🌐 (global) or 💬 (chat) indicators in the AI's thought process.

**Q: What if I want to search a specific memory scope?**  
A: The AI can still use the original `search_memory` tool for specific cases, but generally smart_search_memory is preferred.

**Q: Will this slow down responses?**  
A: No! The searches happen in parallel and are optimized for performance.

**Q: What happens if I'm in a new chat with no history?**  
A: Smart search will only search global memory since there's no chat-specific context yet.

**Q: Can I see the source of each result?**  
A: Yes! When viewing the AI's thought process, you'll see source indicators (🌐/💬) for each result.

## Best Practices

### For Best Results

1. **Be specific** - "What did I tell you about Python preferences?" vs. "Python stuff"
2. **Provide context** - "Based on our earlier discussion about ML..."
3. **Use natural language** - The AI understands conversational queries
4. **Review thought process** - Expand the thought steps to see sources

### Memory Management

- **Global Memory**: Store general knowledge, documents, guides
- **Chat Memory**: AI automatically saves important conversation context
- **Upload Documents**: Use the Memory page to add knowledge to global memory

## Troubleshooting

**Issue**: Not finding expected results  
**Solution**: Try rephrasing your question or check that the information was saved to memory

**Issue**: Too many irrelevant results  
**Solution**: Be more specific in your query

**Issue**: Missing context from earlier in chat  
**Solution**: Verify that chat-specific memory collection was created (happens automatically on first save)

## Learn More

- [Memory Manager Guide](./MEMORY_MANAGER_GUIDE.md) - Managing memories from UI
- [Document Context Guide](./DOCUMENT_CONTEXT_GUIDE.md) - Document selection per chat
- [Milestone 13 Summary](./MILESTONE_13_SMART_MEMORY.md) - Technical implementation details

---

**Last Updated**: 2024  
**Feature Status**: ✅ Production Ready
