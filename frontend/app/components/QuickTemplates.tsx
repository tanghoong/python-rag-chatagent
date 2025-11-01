import { useState, useEffect } from "react";
import { Sparkles, Star, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "../config";

interface PromptTemplate {
  id: string;
  title: string;
  prompt_text: string;
  category: string;
  description: string;
  is_system: boolean;
  is_custom: boolean;
  click_count: number;
  last_used_at?: string;
  success_rate: number;
}

interface QuickTemplatesProps {
  onSelectTemplate: (template: PromptTemplate) => void;
  onOpenFullTemplates: () => void;
}

export function QuickTemplates({ onSelectTemplate, onOpenFullTemplates }: Readonly<QuickTemplatesProps>) {
  const [popularTemplates, setPopularTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPopularTemplates = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/prompt-templates/popular?limit=4`);
        if (response.ok) {
          const data = await response.json();
          setPopularTemplates(data);
        }
      } catch (error) {
        console.error('Failed to fetch popular templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularTemplates();
  }, []);

  const handleSelectTemplate = async (template: PromptTemplate) => {
    try {
      // Track usage
      await fetch(`${API_BASE_URL}/api/prompt-templates/${template.id}/track-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      });
      
      onSelectTemplate(template);
      toast.success(`Applied template: ${template.title}`);
    } catch (error) {
      console.error('Failed to track template usage:', error);
      // Still proceed with template selection
      onSelectTemplate(template);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      rag: "📚",
      tasks: "✅",
      reminders: "⏰",
      memory: "🧠",
      code: "💻",
      research: "🔍",
      writing: "✍️",
    };
    return icons[category] || "💡";
  };

  if (loading) {
    return (
      <div className="bg-slate-900/95 border border-white/10 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Quick Templates</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Quick Templates</span>
        </div>
        <button
          onClick={onOpenFullTemplates}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {popularTemplates.slice(0, 4).map((template) => (
          <button
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            className="text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 group"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{getCategoryIcon(template.category)}</span>
              {template.is_system && <Star className="w-3 h-3 text-yellow-400" />}
              {template.click_count > 10 && <TrendingUp className="w-3 h-3 text-green-400" />}
            </div>
            <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-1 mb-1">
              {template.title}
            </div>
            <div className="text-xs text-white/60 line-clamp-2">
              {template.description || "No description available"}
            </div>
          </button>
        ))}
      </div>

      {popularTemplates.length === 0 && (
        <div className="text-center py-6">
          <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/40">No templates available</p>
        </div>
      )}
    </div>
  );
}