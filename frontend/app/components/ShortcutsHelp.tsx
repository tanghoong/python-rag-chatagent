import { X, Keyboard } from "lucide-react";
import { getShortcutDisplay, CHAT_SHORTCUTS } from "../hooks/useKeyboardShortcuts";

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsHelp({ isOpen, onClose }: Readonly<ShortcutsHelpProps>) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Keyboard className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Shortcuts list - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CHAT_SHORTCUTS.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <span className="text-gray-300 text-sm">{shortcut.description}</span>
              <kbd className="px-3 py-1 bg-black/30 border border-white/20 rounded text-xs font-mono text-purple-300 whitespace-nowrap">
                {getShortcutDisplay(shortcut)}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400 text-center">
            Press <kbd className="px-2 py-0.5 bg-black/30 border border-white/20 rounded text-xs font-mono">Ctrl + /</kbd> to toggle this help
          </p>
        </div>
      </div>
    </div>
  );
}
