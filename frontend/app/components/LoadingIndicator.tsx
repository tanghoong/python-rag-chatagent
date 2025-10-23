import { Loader2 } from "lucide-react";

export function LoadingIndicator() {
  return (
    <div className="flex items-start space-x-3 animate-fade-in">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
        <Loader2 className="w-5 h-5 text-white animate-spin" />
      </div>
      <div className="glass-card flex-1">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
