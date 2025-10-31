import { useEffect } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: (event: KeyboardEvent) => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

/**
 * Custom hook for managing keyboard shortcuts
 * 
 * @example
 * ```ts
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     {
 *       key: 'Enter',
 *       ctrlKey: true,
 *       handler: () => sendMessage(),
 *       description: 'Send message'
 *     }
 *   ]
 * });
 * ```
 */
export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchesKey = event.key === shortcut.key;
        const matchesCtrl = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const matchesShift = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const matchesAlt = shortcut.altKey === undefined || event.altKey === shortcut.altKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          event.preventDefault();
          shortcut.handler(event);
          break; // Only execute first matching shortcut
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, shortcuts]);
}

/**
 * Get formatted shortcut string for display
 */
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push("Ctrl");
  if (shortcut.shiftKey) parts.push("Shift");
  if (shortcut.altKey) parts.push("Alt");
  parts.push(shortcut.key);

  return parts.join(" + ");
}

/**
 * Keyboard shortcuts help component
 */
export const CHAT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: "Enter",
    ctrlKey: true,
    handler: () => {}, // Will be overridden
    description: "Send message",
  },
  {
    key: "k",
    ctrlKey: true,
    handler: () => {}, // Will be overridden
    description: "Search chats",
  },
  {
    key: "n",
    ctrlKey: true,
    handler: () => {}, // Will be overridden
    description: "New chat",
  },
  {
    key: "S",
    ctrlKey: true,
    shiftKey: true,
    handler: () => {}, // Will be overridden
    description: "Toggle sidebar",
  },
  {
    key: "R",
    ctrlKey: true,
    shiftKey: true,
    handler: () => {}, // Will be overridden
    description: "Toggle reminder sidebar",
  },
  {
    key: "/",
    ctrlKey: true,
    handler: () => {}, // Will be overridden
    description: "Show shortcuts help",
  },
  {
    key: "Escape",
    handler: () => {}, // Will be overridden
    description: "Cancel operation / Close modal",
  },
  {
    key: "b",
    ctrlKey: true,
    shiftKey: true,
    handler: () => {}, // Will be overridden
    description: "Toggle bulk select mode",
  },
];
