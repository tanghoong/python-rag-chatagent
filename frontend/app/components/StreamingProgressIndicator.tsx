import { useEffect, useState } from "react";

export interface StreamingProgressIndicatorProps {
  /** Whether streaming is active */
  isStreaming: boolean;
  /** Estimated or actual progress (0-100) */
  progress?: number;
  /** Current streaming content length for estimated progress */
  contentLength?: number;
  /** Estimated target length for progress calculation */
  estimatedLength?: number;
  /** Processing state for context */
  processingState?: 'thinking' | 'searching' | 'generating' | 'processing' | null;
}

export function StreamingProgressIndicator({
  isStreaming,
  progress,
  contentLength = 0,
  estimatedLength = 500, // Rough estimate for typical response length
  processingState
}: StreamingProgressIndicatorProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Calculate progress based on content length if not provided
  const calculatedProgress = progress !== undefined 
    ? progress 
    : Math.min((contentLength / estimatedLength) * 100, 95); // Cap at 95% until done

  useEffect(() => {
    if (!isStreaming) {
      setDisplayProgress(100);
      return;
    }

    // Smooth progress animation
    const targetProgress = calculatedProgress;
    const currentProgress = displayProgress;
    const diff = targetProgress - currentProgress;
    
    if (Math.abs(diff) > 0.1) {
      const increment = diff * 0.1; // Smooth easing
      const timer = setTimeout(() => {
        setDisplayProgress(prev => prev + increment);
      }, 16); // ~60fps
      
      return () => clearTimeout(timer);
    }
  }, [calculatedProgress, isStreaming, displayProgress]);

  // Reset when streaming starts
  useEffect(() => {
    if (isStreaming && contentLength === 0) {
      setDisplayProgress(0);
    }
  }, [isStreaming, contentLength]);

  if (!isStreaming && displayProgress >= 100) {
    return null;
  }

  const getStateColor = () => {
    switch (processingState) {
      case 'thinking': return 'from-blue-500 to-cyan-500';
      case 'searching': return 'from-yellow-500 to-orange-500';
      case 'generating': return 'from-green-500 to-emerald-500';
      case 'processing': return 'from-purple-500 to-pink-500';
      default: return 'from-blue-500 to-purple-500';
    }
  };

  const getStateText = () => {
    switch (processingState) {
      case 'thinking': return 'Thinking';
      case 'searching': return 'Searching';
      case 'generating': return 'Writing';
      case 'processing': return 'Processing';
      default: return 'Generating';
    }
  };

  return (
    <div className="flex items-center space-x-3 py-2 px-4 bg-white/5 border border-white/10 rounded-lg mx-2 sm:mx-0 animate-fade-in">
      {/* Progress bar */}
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-linear-to-r ${getStateColor()} transition-all duration-300 ease-out rounded-full`}
          style={{ 
            width: `${Math.max(displayProgress, 5)}%`,
            transition: 'width 0.3s ease-out'
          }}
        />
      </div>
      
      {/* Status and percentage */}
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-gray-400 min-w-16">
          {getStateText()}
        </span>
        <span className="text-gray-500 text-xs font-mono min-w-8">
          {Math.round(displayProgress)}%
        </span>
      </div>
      
      {/* Animated dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full transition-all duration-300 ${
              isStreaming ? `bg-${getStateColor().split(' ')[0].slice(5)} animate-bounce` : 'bg-gray-600'
            }`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Compact version for inline use
export function CompactStreamingProgress({
  isStreaming,
  contentLength = 0,
  processingState
}: Pick<StreamingProgressIndicatorProps, 'isStreaming' | 'contentLength' | 'processingState'>) {
  if (!isStreaming) return null;

  const getStateColor = () => {
    switch (processingState) {
      case 'thinking': return 'text-blue-400';
      case 'searching': return 'text-yellow-400';
      case 'generating': return 'text-green-400';
      case 'processing': return 'text-purple-400';
      default: return 'text-cyan-400';
    }
  };

  return (
    <div className="flex items-center space-x-2 text-xs text-gray-400 py-1">
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full bg-gray-400 animate-bounce`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
      <span className={getStateColor()}>
        {contentLength > 0 ? `${contentLength} chars` : 'Starting...'}
      </span>
    </div>
  );
}

export default StreamingProgressIndicator;