/**
 * Document Context Hook
 * 
 * Manages document context switching for chats.
 * Automatically loads and persists selected documents per chat.
 */

import { useState, useEffect, useCallback } from "react";

interface DocumentContextCache {
  [chatId: string]: string[];
}

export function useDocumentContext(chatId: string | null) {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [documentCache, setDocumentCache] = useState<DocumentContextCache>({});

  // Load document context when chat changes
  useEffect(() => {
    if (!chatId) {
      setSelectedDocuments([]);
      return;
    }

    // Check cache first
    if (documentCache[chatId]) {
      setSelectedDocuments(documentCache[chatId]);
      return;
    }

    // Load from localStorage
    const key = `chat_documents_${chatId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedDocuments(parsed);
        
        // Update cache
        setDocumentCache(prev => ({
          ...prev,
          [chatId]: parsed,
        }));
      } catch (error) {
        console.error("Failed to parse saved documents:", error);
        setSelectedDocuments([]);
      }
    } else {
      setSelectedDocuments([]);
    }
  }, [chatId, documentCache]);

  // Update document selection
  const updateDocuments = useCallback((documents: string[]) => {
    if (!chatId) return;

    setSelectedDocuments(documents);
    
    // Persist to localStorage
    const key = `chat_documents_${chatId}`;
    localStorage.setItem(key, JSON.stringify(documents));
    
    // Update cache
    setDocumentCache(prev => ({
      ...prev,
      [chatId]: documents,
    }));
  }, [chatId]);

  // Add document to selection
  const addDocument = useCallback((documentName: string) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentName)) return prev;
      const updated = [...prev, documentName];
      
      if (chatId) {
        const key = `chat_documents_${chatId}`;
        localStorage.setItem(key, JSON.stringify(updated));
        setDocumentCache(cache => ({
          ...cache,
          [chatId]: updated,
        }));
      }
      
      return updated;
    });
  }, [chatId]);

  // Remove document from selection
  const removeDocument = useCallback((documentName: string) => {
    setSelectedDocuments(prev => {
      const updated = prev.filter(d => d !== documentName);
      
      if (chatId) {
        const key = `chat_documents_${chatId}`;
        localStorage.setItem(key, JSON.stringify(updated));
        setDocumentCache(cache => ({
          ...cache,
          [chatId]: updated,
        }));
      }
      
      return updated;
    });
  }, [chatId]);

  // Clear all documents
  const clearDocuments = useCallback(() => {
    setSelectedDocuments([]);
    
    if (chatId) {
      const key = `chat_documents_${chatId}`;
      localStorage.removeItem(key);
      setDocumentCache(prev => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });
    }
  }, [chatId]);

  // Get document context for API calls
  const getDocumentContext = useCallback(() => {
    return selectedDocuments.length > 0 ? selectedDocuments : undefined;
  }, [selectedDocuments]);

  return {
    selectedDocuments,
    updateDocuments,
    addDocument,
    removeDocument,
    clearDocuments,
    getDocumentContext,
  };
}
