import { X, Keyboard } from "lucide-react";
import { getShortcutDisplay, type KeyboardShortcut } from "../hooks/useKeyboardShortcuts";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsHelp({ isOpen, onClose, shortcuts }: Readonly<KeyboardShortcutsHelpProps>) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-label="Close shortcuts help"
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-linear-to-br from-gray-900 to-black border border-white/20 rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            type="button"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {shortcuts.map((shortcut) => (
            <div
              key={`${shortcut.key}-${shortcut.ctrlKey}-${shortcut.shiftKey}-${shortcut.description}`}
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <span className="text-sm text-gray-300">{shortcut.description}</span>
              <kbd className="px-2.5 py-1 bg-black/50 border border-white/20 rounded text-xs font-mono text-purple-300 whitespace-nowrap">
                {getShortcutDisplay(shortcut)}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <p className="text-xs text-gray-400 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-black/50 border border-white/20 rounded text-xs font-mono text-purple-300">Ctrl + /</kbd> to toggle this help
          </p>
        </div>
      </div>
    </>
  );
}
