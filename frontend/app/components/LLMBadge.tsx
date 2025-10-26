import { Brain, Zap, TrendingUp } from "lucide-react";

interface LLMMetadata {
  auto_switched: boolean;
  model: string;
  provider: string;
  complexity: string;
  complexity_score?: number;
  indicators?: string[];
  word_count?: number;
}

interface LLMBadgeProps {
  metadata: LLMMetadata;
}

export function LLMBadge({ metadata }: Readonly<LLMBadgeProps>) {
  // Determine badge color based on model
  const getModelColor = () => {
    if (metadata.model.includes("gpt-4o-mini") || metadata.model.includes("flash")) {
      return "from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400";
    } else if (metadata.model.includes("gpt-4o") || metadata.model.includes("pro")) {
      return "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400";
    }
    return "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400";
  };

  // Get complexity icon and color
  const getComplexityIcon = () => {
    switch (metadata.complexity) {
      case "simple":
        return <Zap className="w-3 h-3" />;
      case "moderate":
        return <Brain className="w-3 h-3" />;
      case "complex":
      case "expert":
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Brain className="w-3 h-3" />;
    }
  };

  // Format model name for display
  const formatModelName = (model: string) => {
    return model.replace("gemini-", "").replace("-exp", "");
  };

  // Get cost indicator
  const getCostIndicator = () => {
    if (metadata.model.includes("mini") || metadata.model.includes("flash")) {
      return "💰";
    } else if (metadata.model.includes("gpt-4o") || metadata.model.includes("pro")) {
      return "💎";
    }
    return "💰";
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
      {/* Model Badge */}
      <div
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-linear-to-r ${getModelColor()} border backdrop-blur-sm`}
        title={`Model: ${metadata.model}\nProvider: ${metadata.provider}\nComplexity: ${metadata.complexity}${
          metadata.complexity_score ? `\nScore: ${metadata.complexity_score}` : ""
        }${metadata.auto_switched ? "\nAuto-switched based on query complexity" : ""}`}
      >
        {getComplexityIcon()}
        <span className="font-medium text-[10px]">{formatModelName(metadata.model)}</span>
        <span className="opacity-60 text-[10px]">{getCostIndicator()}</span>
      </div>

      {/* Auto-switched indicator */}
      {metadata.auto_switched && (
        <div
          className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
          title="This model was automatically selected based on query complexity"
        >
          <span className="text-[9px] font-semibold">AUTO</span>
        </div>
      )}

      {/* Complexity indicator (compact) */}
      {metadata.complexity && (
        <span 
          className="text-gray-500 capitalize text-[10px]"
          title={`Complexity: ${metadata.complexity}${
            metadata.complexity_score ? ` (score: ${metadata.complexity_score})` : ""
          }${metadata.indicators && metadata.indicators.length > 0 ? "\n\nIndicators:\n" + metadata.indicators.join("\n") : ""}`}
        >
          {metadata.complexity}
        </span>
      )}
    </div>
  );
}
