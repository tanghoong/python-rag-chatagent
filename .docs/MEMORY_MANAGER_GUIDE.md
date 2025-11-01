# Phase 1.3 Quick Reference Guide

## 🎯 Memory Manager Access

**URL:** `http://localhost:5173/memory`

**Navigation:** Click "🧠 Memory" in the navigation bar

---

## 🔍 Search Memories

### Steps:
1. Click "🔍 Search Memories" tab
2. Select memory scope:
   - **🌐 Global Memory** - Shared across all chats
   - **💬 Chat Memory** - Specific to one chat
   - **🔄 Both** - Search both scopes
3. Enter Chat ID (optional, for chat-specific search)
4. Toggle "Enable Global Memory" checkbox
5. Enter search query
6. Click "🔍 Search" or press Enter
7. View results with relevance scores

### Export Options:
- **📥 Export JSON** - Download as JSON file
- **📊 Export CSV** - Download as CSV spreadsheet

---

## 📁 Upload Documents

### Supported Formats:
- `.pdf` - PDF documents
- `.txt` - Text files
- `.md` - Markdown files
- `.docx` - Word documents
- `.html` - HTML files

### Upload Methods:

#### Drag & Drop:
1. Click "📁 Upload Documents" tab
2. Drag files into the drop zone
3. Wait for upload to complete

#### Browse Files:
1. Click "📁 Upload Documents" tab
2. Click "Browse Files" button
3. Select one or more files
4. Wait for upload to complete

### Upload Features:
- ✅ Multiple file upload
- ✅ Real-time progress tracking
- ✅ Success/error indicators
- ✅ Automatic format validation
- ✅ Scope selection (global or chat)

---

## 📊 Memory Timeline

### Features:
- Visual bar charts showing memory distribution
- Separate view for global vs. chat memories
- Summary statistics:
  - Total document count
  - Number of memory scopes
- Color coding:
  - 🔵 Blue = Global Memory
  - 🟣 Purple = Chat Memory

### Access:
1. Click "📊 Timeline" tab
2. View automatic visualization
3. Statistics update in real-time

---

## 🗑️ Delete Collections

### Steps:
1. View memory statistics cards
2. Click "🗑️ Delete" on any collection
3. Confirm deletion in dialog
4. Collection is permanently removed

⚠️ **Warning:** Deletion cannot be undone!

---

## 🎨 UI Elements

### Memory Scope Indicators:
- **🌐 Global Memory** - Blue badge
- **💬 Chat Memory** - Purple badge

### Relevance Scores:
- Displayed as percentage (0-100%)
- Higher score = more relevant to query

### Metadata:
- Click "📋 Metadata" to expand
- Shows document source, timestamps, etc.

---

## ⌨️ Keyboard Shortcuts

- **Enter** - Submit search (when in search box)
- **Esc** - Close modals/dialogs

---

## 🔄 API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/memory/search` | Search memories |
| `GET /api/memory/stats/{scope}` | Get statistics |
| `DELETE /api/memory/{collection}` | Delete collection |
| `POST /api/documents/upload` | Upload documents |

---

## 💡 Pro Tips

1. **Use "Both" scope** for comprehensive searches
2. **Check Timeline** to see memory distribution before searching
3. **Export results** before deleting collections
4. **Upload multiple files** at once for batch processing
5. **Use specific search queries** for better relevance scores
6. **Check metadata** for document source information

---

## 🐛 Troubleshooting

### Search returns no results:
- ✓ Check if memories exist (view Timeline)
- ✓ Try broader search terms
- ✓ Verify correct scope is selected
- ✓ Ensure Chat ID is correct (if using)

### Upload fails:
- ✓ Check file format is supported
- ✓ Ensure file is not corrupted
- ✓ Check file size (backend limits may apply)
- ✓ Verify network connection

### Delete not working:
- ✓ Confirm deletion in dialog
- ✓ Check console for errors
- ✓ Ensure collection exists

---

## 📱 Mobile Usage

All features work on mobile devices:
- Tap navigation menu (☰) to access Memory link
- Drag-and-drop may not work - use "Browse Files"
- Scroll horizontally for long metadata
- Tap to expand/collapse sections

---

## 🔒 Privacy & Data

- **Global Memory**: Shared across all users/chats
- **Chat Memory**: Isolated per chat session
- **Exports**: Downloaded to your local device
- **Deletes**: Permanent, cannot be recovered

---

## 🎯 Common Workflows

### 1. Finding Relevant Context
```
Search → Select scope → Enter query → View results → Check metadata
```

### 2. Adding New Knowledge
```
Upload tab → Drag files → Wait for completion → Check Timeline
```

### 3. Managing Storage
```
Timeline → View distribution → Delete unused collections → Confirm
```

### 4. Exporting Data
```
Search → Get results → Export JSON/CSV → Save locally
```

---

**Version:** Phase 1.3  
**Last Updated:** January 2025
