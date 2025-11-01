import { Bot, Search, Zap, Cpu } from "lucide-react";
import { useState, useEffect } from "react";

export interface TypingIndicatorProps {
  /** The current AI processing state */
  processingState?: 'thinking' | 'searching' | 'generating' | 'processing' | null;
  /** Whether to show the typing indicator */
  isVisible?: boolean;
  /** Custom message to display instead of default state text */
  customMessage?: string;
  /** Show enhanced visual effects */
  enhanced?: boolean;
}

const PROCESSING_STATES = {
  thinking: "AI is thinking...",
  searching: "Searching knowledge base...",
  generating: "Generating response...",
  processing: "Processing your request...",
} as const;

// Enhanced state configurations with icons and colors
const STATE_CONFIG = {
  thinking: {
    icon: Cpu,
    color: 'from-blue-500 to-cyan-500',
    dotColor: 'bg-blue-500',
    textColor: 'text-blue-400',
    message: "AI is thinking..."
  },
  searching: {
    icon: Search,
    color: 'from-yellow-500 to-orange-500', 
    dotColor: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    message: "Searching knowledge base..."
  },
  generating: {
    icon: Zap,
    color: 'from-green-500 to-emerald-500',
    dotColor: 'bg-green-500', 
    textColor: 'text-green-400',
    message: "Generating response..."
  },
  processing: {
    icon: Bot,
    color: 'from-purple-500 to-pink-500',
    dotColor: 'bg-purple-500',
    textColor: 'text-purple-400',
    message: "Processing your request..."
  },
} as const;

export function TypingIndicator({ 
  processingState = 'thinking', 
  isVisible = true,
  customMessage,
  enhanced = true
}: Readonly<TypingIndicatorProps>) {
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

  const currentState = processingState || 'thinking';
  const stateConfig = STATE_CONFIG[currentState];
  const IconComponent = stateConfig.icon;
  const displayText = customMessage || stateConfig.message;

  return (
    <div className="flex items-start space-x-3 p-4 animate-fade-in">
      {/* Enhanced Avatar with state-specific styling */}
      <div className="shrink-0">
        <div className={`w-8 h-8 bg-linear-to-br ${stateConfig.color} rounded-full flex items-center justify-center relative ${enhanced ? 'animate-pulse-slow' : ''}`}>
          <IconComponent className="w-5 h-5 text-white" />
          {enhanced && (
            <div className={`absolute -inset-1 bg-linear-to-br ${stateConfig.color} rounded-full opacity-30 animate-ping`} />
          )}
        </div>
      </div>

      {/* Enhanced typing indicator content */}
      <div className="flex-1 min-w-0">
        <div className={`bg-white/5 border border-white/10 rounded-lg p-3 max-w-xs relative overflow-hidden ${enhanced ? 'backdrop-blur-sm' : ''}`}>
          {enhanced && (
            <div className={`absolute inset-0 bg-linear-to-r ${stateConfig.color} opacity-5`} />
          )}
          
          <div className="flex items-center space-x-2 relative z-10">
            {/* Enhanced animated dots */}
            <div className="flex space-x-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 ${stateConfig.dotColor} rounded-full transition-all duration-300 ${
                    i <= dotCount ? 'animate-bounce' : 'opacity-50'
                  }`}
                  style={{
                    animationDelay: `${(i - 1) * 0.2}s`,
                    animationDuration: '0.6s'
                  }}
                />
              ))}
            </div>
            
            {/* Enhanced status text */}
            <span className={`text-sm ${stateConfig.textColor} ml-2`}>
              {displayText}
            </span>
          </div>
          
          {/* Enhanced processing state indicator */}
          {enhanced && processingState && (
            <div className="mt-2 flex items-center relative z-10">
              <div className={`w-2 h-2 rounded-full mr-2 ${stateConfig.dotColor} animate-pulse`} />
              <span className={`text-xs ${stateConfig.textColor} opacity-75 capitalize`}>
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
}: Readonly<Pick<TypingIndicatorProps, 'processingState' | 'customMessage'>>) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(prev => (prev >= 3 ? 1 : prev + 1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const currentState = processingState || 'thinking';
  const stateConfig = STATE_CONFIG[currentState];
  const IconComponent = stateConfig.icon;
  const displayText = customMessage || stateConfig.message;

  return (
    <div className="flex items-center space-x-2 text-sm py-2 animate-fade-in">
      <IconComponent className={`w-4 h-4 ${stateConfig.textColor}`} />
      <span className={stateConfig.textColor}>{displayText}</span>
      <div className="flex space-x-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1 h-1 ${stateConfig.dotColor} rounded-full transition-all duration-300 ${
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