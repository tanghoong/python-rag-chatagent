import { useState, useCallback, useRef } from 'react';
import type { MessageStatus } from '../components/MessageStatusIndicator';

interface MessageStatusState {
  [messageId: string]: {
    status: MessageStatus;
    timestamp: string;
    errorMessage?: string;
  };
}

interface MessageStatusHookReturn {
  messageStatuses: MessageStatusState;
  updateMessageStatus: (messageId: string, status: MessageStatus, errorMessage?: string) => void;
  getMessageStatus: (messageId: string) => MessageStatus;
  clearMessageStatus: (messageId: string) => void;
  simulateMessageProgression: (messageId: string) => void;
}

/**
 * Hook for managing message status across their lifecycle
 */
export function useMessageStatus(): MessageStatusHookReturn {
  const [messageStatuses, setMessageStatuses] = useState<MessageStatusState>({});
  const progressionTimers = useRef<{[key: string]: NodeJS.Timeout[]}>({});

  const updateMessageStatus = useCallback((
    messageId: string, 
    status: MessageStatus, 
    errorMessage?: string
  ) => {
    setMessageStatuses(prev => ({
      ...prev,
      [messageId]: {
        status,
        timestamp: new Date().toISOString(),
        errorMessage
      }
    }));
  }, []);

  const getMessageStatus = useCallback((messageId: string): MessageStatus => {
    return messageStatuses[messageId]?.status || 'sent';
  }, [messageStatuses]);

  const clearMessageStatus = useCallback((messageId: string) => {
    // Clear any pending timers
    if (progressionTimers.current[messageId]) {
      for (const timer of progressionTimers.current[messageId]) {
        clearTimeout(timer);
      }
      delete progressionTimers.current[messageId];
    }

    setMessageStatuses(prev => {
      const updated = { ...prev };
      delete updated[messageId];
      return updated;
    });
  }, []);

  const simulateMessageProgression = useCallback((messageId: string) => {
    // Clear any existing timers for this message
    if (progressionTimers.current[messageId]) {
      for (const timer of progressionTimers.current[messageId]) {
        clearTimeout(timer);
      }
    }

    const timers: NodeJS.Timeout[] = [];

    // Start with sending
    updateMessageStatus(messageId, 'sending');

    // Move to sent after 500ms
    const sentTimer = setTimeout(() => {
      updateMessageStatus(messageId, 'sent');
    }, 500);
    timers.push(sentTimer);

    // Move to delivered after 1500ms 
    const deliveredTimer = setTimeout(() => {
      updateMessageStatus(messageId, 'delivered');
    }, 1500);
    timers.push(deliveredTimer);

    // Move to read after AI starts responding (3000ms)
    const readTimer = setTimeout(() => {
      updateMessageStatus(messageId, 'read');
    }, 3000);
    timers.push(readTimer);

    progressionTimers.current[messageId] = timers;
  }, [updateMessageStatus]);

  return {
    messageStatuses,
    updateMessageStatus,
    getMessageStatus,
    clearMessageStatus,
    simulateMessageProgression
  };
}