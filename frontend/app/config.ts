/**
 * Application configuration
 * Centralized configuration for environment variables and constants
 */

// Get API URL from environment variable, fallback to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Environment
export const ENV = import.meta.env.VITE_ENV || import.meta.env.MODE || 'development';

// API Endpoints
export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  chat: `${API_BASE_URL}/api/chat`,
  chatStream: `${API_BASE_URL}/api/chat/stream`,
  chats: `${API_BASE_URL}/api/chats`,
  chatById: (chatId: string) => `${API_BASE_URL}/api/chats/${chatId}`,
  chatMessages: (chatId: string, messageId: string) => 
    `${API_BASE_URL}/api/chats/${chatId}/messages/${messageId}`,
  regenerate: (chatId: string, messageId: string) => 
    `${API_BASE_URL}/api/chats/${chatId}/regenerate/${messageId}`,
  stats: (chatId: string) => `${API_BASE_URL}/api/chats/${chatId}/stats`,
} as const;

// Feature flags
export const FEATURES = {
  voiceInput: true,
  darkMode: true,
  codeHighlighting: true,
} as const;

// App constants
export const APP_CONFIG = {
  maxMessageLength: 2000,
  defaultTitle: 'New Chat',
  messagesPerPage: 50,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

export const isDevelopment = ENV === 'development';
export const isProduction = ENV === 'production';
