import { Bot } from "lucide-react";
import { useState, useEffect } from "react";

export interface TypingIndicatorProps {
  /** The current AI processing state */
  processingState?: 'thinking' | 'searching' | 'generating' | 'processing' | null;
  /** Whether to show the typing indicator */
  isVisible?: boolean;
  /** Custom message to display instead of default state text */
  customMessage?: string;
}

const PROCESSING_STATES = {
  thinking: "AI is thinking...",
  searching: "Searching knowledge base...",
  generating: "Generating response...",
  processing: "Processing your request...",
} as const;

export function TypingIndicator({ 
  processingState = 'thinking', 
  isVisible = true,
  customMessage 
}: TypingIndicatorProps) {
  const [dotCount, setDotCount] = useState(1);

  // Animate the dots
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDotCount(prev => (prev >= 3 ? 1 : prev + 1));
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const displayText = customMessage || (processingState ? PROCESSING_STATES[processingState] : "AI is thinking...");
  const dots = '.'.repeat(dotCount);

  return (
    <div className="flex items-start space-x-3 p-4 animate-fade-in">
      {/* Avatar */}
      <div className="shrink-0">
        <div className="w-8 h-8 bg-linear-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Typing indicator content */}
      <div className="flex-1 min-w-0">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 max-w-xs">
          <div className="flex items-center space-x-2">
            {/* Animated dots */}
            <div className="flex space-x-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 bg-gray-400 rounded-full transition-all duration-300 ${
                    i <= dotCount ? 'animate-bounce' : 'opacity-50'
                  }`}
                  style={{
                    animationDelay: `${(i - 1) * 0.2}s`,
                    animationDuration: '0.6s'
                  }}
                />
              ))}
            </div>
            
            {/* Status text */}
            <span className="text-sm text-gray-400 ml-2">
              {displayText}
              <span className="opacity-0">{dots}</span>
            </span>
          </div>
          
          {/* Processing state indicator */}
          {processingState && (
            <div className="mt-2 flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                processingState === 'thinking' ? 'bg-blue-500' :
                processingState === 'searching' ? 'bg-yellow-500' :
                processingState === 'generating' ? 'bg-green-500' :
                'bg-purple-500'
              } animate-pulse`} />
              <span className="text-xs text-gray-500 capitalize">
                {processingState}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Separate component for the compact version that appears in message list
export function CompactTypingIndicator({ 
  processingState = 'thinking',
  customMessage 
}: Pick<TypingIndicatorProps, 'processingState' | 'customMessage'>) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(prev => (prev >= 3 ? 1 : prev + 1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const displayText = customMessage || (processingState ? PROCESSING_STATES[processingState] : "Thinking");

  return (
    <div className="flex items-center space-x-2 text-gray-400 text-sm py-2">
      <Bot className="w-4 h-4" />
      <span>{displayText}</span>
      <div className="flex space-x-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1 h-1 bg-gray-400 rounded-full transition-all duration-300 ${
              i <= dotCount ? 'animate-bounce' : 'opacity-30'
            }`}
            style={{
              animationDelay: `${(i - 1) * 0.2}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default TypingIndicator;