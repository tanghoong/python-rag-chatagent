import { useEffect } from "react";

interface KeyboardShortcut {
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
    key: "O",
    ctrlKey: true,
    shiftKey: true,
    handler: () => {}, // Will be overridden
    description: "Open new chat",
  },
  {
    key: "S",
    ctrlKey: true,
    shiftKey: true,
    handler: () => {}, // Will be overridden
    description: "Toggle sidebar",
  },
  {
    key: ";",
    ctrlKey: true,
    shiftKey: true,
    handler: () => {}, // Will be overridden
    description: "Copy last code block",
  },
  {
    key: "Backspace",
    ctrlKey: true,
    shiftKey: true,
    handler: () => {}, // Will be overridden
    description: "Delete chat",
  },
  {
    key: "Escape",
    shiftKey: true,
    handler: () => {}, // Will be overridden
    description: "Focus chat input",
  },
  {
    key: "u",
    ctrlKey: true,
    handler: () => {}, // Will be overridden
    description: "Add photos & files",
  },
  {
    key: "Escape",
    handler: () => {}, // Will be overridden
    description: "Cancel / Clear input",
  },
  {
    key: "/",
    ctrlKey: true,
    handler: () => {}, // Will be overridden
    description: "Show shortcuts",
  },
  {
    key: "I",
    ctrlKey: true,
    shiftKey: true,
    handler: () => {}, // Will be overridden
    description: "Set custom instructions",
  },
  {
    key: "/",
    ctrlKey: true,
    handler: () => {}, // Will be overridden
    description: "Show shortcuts",
  },
];
