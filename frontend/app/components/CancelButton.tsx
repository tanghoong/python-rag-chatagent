import { X } from "lucide-react";

interface CancelButtonProps {
  onCancel: () => void;
}

export function CancelButton({ onCancel }: Readonly<CancelButtonProps>) {
  return (
    <button
      onClick={onCancel}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
      title="Cancel (Esc)"
    >
      <X className="w-4 h-4" />
      Cancel
    </button>
  );
}
