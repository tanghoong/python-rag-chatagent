# Phase 1.4 Quick Reference: Document Context Switching

## 🎯 Quick Access

**Keyboard Shortcut:** `Ctrl+K` - Opens quick document switcher

**Location:** Chat header (below title)

---

## 📋 Features at a Glance

### Document Selector (In Chat Header)

**When No Documents Selected:**
- Shows "Select Documents" button
- Click to open document picker

**When Documents Selected:**
- Shows first 2 documents as badges
- Shows "+N more" if more than 2 selected
- Click document badge × to remove
- Click 📄 icon to manage all documents

---

## ⌨️ Quick Switcher (`Ctrl+K`)

### Opening
- Press `Ctrl+K` anywhere in chat
- Modal appears with search bar

### Navigation
- **Type** to search documents
- **↑ / ↓** to navigate list
- **Enter** to select highlighted document
- **Esc** to close without selection

### Sections
1. **Recently Used** - Last 5 accessed documents
2. **All Documents** - Complete list

### Indicators
- **• Active** - Document currently selected for this chat
- **Document count** - Number of documents in collection

---

## 💡 Common Workflows

### Select Documents for New Chat
```
1. Click "Select Documents" in chat header
2. Search or browse available documents
3. Check desired documents
4. Click "Done"
```

### Quick Add with Keyboard
```
1. Press Ctrl+K
2. Type document name (or browse)
3. Press Enter
4. Document added to current chat
```

### Remove Document
```
Method 1 (From Badge):
- Click × on document badge

Method 2 (From Selector):
- Click document selector
- Uncheck document
- Click "Done"
```

### Clear All Documents
```
1. Click document selector (📄 icon)
2. Click "Clear All"
3. Click "Done"
```

---

## 🔍 Document Types

| Icon | Type | Description |
|------|------|-------------|
| 🌐 | Global Memory | Shared across all chats |
| 💬 | Chat Memory | Specific to one chat |

---

## 💾 Persistence

- **Auto-Save**: Selections saved automatically per chat
- **Preserved**: Selections persist when switching chats
- **Local**: Stored in browser localStorage
- **Cache**: Fast loading from in-memory cache

---

## 🎨 Visual Guide

### Badge Display
```
┌─────────────────────────────────────┐
│ [🌐 Global Memory ×]  [💬 Chat ×]  │
│ [+3 more]  [📄]                     │
└─────────────────────────────────────┘
```

### Selector Modal
```
┌────────────────────────────────────┐
│ Select Documents              [×]  │
│                                    │
│ [🔍 Search...]                     │
│                                    │
│ ☑ 🌐 Global Memory                │
│   15 documents                     │
│                                    │
│ ☐ 💬 chat_previous                │
│   8 documents                      │
│                                    │
│ 2 selected  [Clear All]  [Done]   │
└────────────────────────────────────┘
```

### Quick Switcher
```
┌──────────────────────────────────────┐
│ [🔍 Search... (↑↓ Enter Esc)]       │
│                                      │
│ ⏱ RECENTLY USED                     │
│                                      │
│ ▶ 🌐 Global Memory                  │
│   15 documents • Active              │
│                                      │
│ ALL DOCUMENTS                        │
│                                      │
│   💬 chat_123                       │
│   8 documents                        │
│                                      │
│ ↑↓ navigate  Enter select  Esc close│
└──────────────────────────────────────┘
```

---

## 🔑 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` | Open quick switcher |
| `↑` | Move up in list |
| `↓` | Move down in list |
| `Enter` | Select highlighted |
| `Esc` | Close modal |
| `Type...` | Search documents |

---

## 💡 Pro Tips

1. **Use Ctrl+K** for fastest document selection
2. **Recently used** section shows your most accessed documents
3. **Active indicator** (•) shows what's currently selected
4. **Multi-select** lets you combine multiple knowledge sources
5. **Clear All** quickly resets document selection
6. **Badges persist** when you switch between chats

---

## 🐛 Troubleshooting

### Documents don't show up
- Check if documents exist in Memory Manager (`/memory`)
- Upload documents first if needed
- Refresh the page

### Selection not saving
- Check browser localStorage is enabled
- Try selecting again and switching chats
- Clear browser cache if persistent

### Ctrl+K doesn't work
- Make sure you're in the chat view
- Check if another extension is using Ctrl+K
- Try clicking the 📄 icon instead

---

## 🔗 Related Features

- **Memory Manager** (`/memory`) - Upload and manage documents
- **Global Memory** - Share knowledge across all chats
- **Chat Memory** - Private memory for specific chats
- **Quick Switcher** - Fast keyboard-based navigation

---

## 📊 Use Cases

### Research Assistant
```
Select: [Global Memory] + [Research Papers]
Use for: Querying across multiple research documents
```

### Code Helper
```
Select: [Project Documentation] + [API Docs]
Use for: Context-aware coding assistance
```

### Personal Knowledge Base
```
Select: [Global Memory] + [Meeting Notes]
Use for: Recalling past conversations and notes
```

### Tutorial Learning
```
Select: [Tutorial Documents]
Use for: Asking questions about specific guides
```

---

**Version:** Phase 1.4  
**Last Updated:** January 2025  
**Status:** ✅ Production Ready
