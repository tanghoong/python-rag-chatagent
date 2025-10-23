import { useState } from "react";
import { ChevronDown, ChevronUp, Brain } from "lucide-react";

interface ThoughtStep {
  step: string;
  content: string;
}

interface ThoughtProcessProps {
  steps: ThoughtStep[];
}

export default function ThoughtProcess({ steps }: ThoughtProcessProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 border border-white/10 rounded-lg overflow-hidden bg-white/5">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors text-sm"
      >
        <div className="flex items-center gap-2 text-purple-300">
          <Brain className="w-4 h-4" />
          <span className="font-medium">Thought Process</span>
          <span className="text-xs text-white/50">
            ({steps.length} {steps.length === 1 ? "step" : "steps"})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white/50" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/50" />
        )}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/10 pt-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`p-2 rounded text-xs ${
                step.step === "Action"
                  ? "bg-blue-500/10 border border-blue-500/20 text-blue-200"
                  : step.step === "Observation"
                  ? "bg-green-500/10 border border-green-500/20 text-green-200"
                  : step.step === "Error"
                  ? "bg-red-500/10 border border-red-500/20 text-red-200"
                  : "bg-white/5 border border-white/10 text-white/70"
              }`}
            >
              <div className="font-semibold mb-1">{step.step}</div>
              <div className="font-mono whitespace-pre-wrap break-words">
                {step.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
