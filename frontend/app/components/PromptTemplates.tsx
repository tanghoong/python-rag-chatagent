import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Sparkles, 
  Star, 
  Clock, 
  Grid3x3, 
  List, 
  Search, 
  Plus,
  X,
  Filter,
  TrendingUp
} from "lucide-react";
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

interface PromptTemplatesProps {
  onSelectTemplate: (template: PromptTemplate) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function PromptTemplates({ onSelectTemplate, isOpen, onClose }: Readonly<PromptTemplatesProps>) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<PromptTemplate[]>([]);
  const [recentTemplates, setRecentTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "recent">("all");

  // Fetch templates data
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompt-templates/list`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompt-templates/popular`);
      if (response.ok) {
        const data = await response.json();
        setPopularTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch popular templates:', error);
    }
  };

  const fetchRecentTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompt-templates/recent`);
      if (response.ok) {
        const data = await response.json();
        setRecentTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch recent templates:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompt-templates/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      fetchPopularTemplates();
      fetchRecentTemplates();
      fetchCategories();
    }
  }, [isOpen]);

  // Handle template selection
  const handleSelectTemplate = async (template: PromptTemplate) => {
    try {
      // Track usage
      await fetch(`${API_BASE_URL}/api/prompt-templates/${template.id}/track-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      });
      
      onSelectTemplate(template);
      onClose();
      toast.success(`Applied template: ${template.title}`);
    } catch (error) {
      console.error('Failed to track template usage:', error);
      // Still proceed with template selection
      onSelectTemplate(template);
      onClose();
    }
  };

  // Filter templates based on search and category
  const getFilteredTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        t.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const getCurrentTemplates = () => {
    switch (activeTab) {
      case "popular":
        return popularTemplates;
      case "recent":
        return recentTemplates;
      default:
        return getFilteredTemplates();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/95 border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Prompt Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-white/10 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "all" 
                  ? "bg-blue-600 text-white" 
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              All Templates
            </button>
            <button
              onClick={() => setActiveTab("popular")}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "popular" 
                  ? "bg-blue-600 text-white" 
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Popular
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "recent" 
                  ? "bg-blue-600 text-white" 
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Clock className="w-4 h-4" />
              Recent
            </button>
          </div>

          {/* Search and Filters - only show for "all" tab */}
          {activeTab === "all" && (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <div className="flex bg-white/5 rounded-lg border border-white/10">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"} rounded-l-lg transition-colors`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"} rounded-r-lg transition-colors`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
              {getCurrentTemplates().map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`
                    bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 hover:border-white/20 
                    cursor-pointer transition-all duration-200 group
                    ${viewMode === "list" ? "flex items-center gap-4" : ""}
                  `}
                >
                  <div className={viewMode === "list" ? "flex-1" : ""}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                        {template.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-white/40">{getCategoryIcon(template.category)}</span>
                        {template.is_system && <Star className="w-3 h-3 text-yellow-400" />}
                      </div>
                    </div>
                    <p className="text-sm text-white/60 mb-3 line-clamp-2">
                      {template.description || "No description available"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span className="px-2 py-1 bg-white/10 rounded-md">
                        {template.category}
                      </span>
                      <div className="flex items-center gap-2">
                        {template.click_count > 0 && (
                          <span>{template.click_count} uses</span>
                        )}
                        {template.success_rate > 0 && (
                          <span>{Math.round(template.success_rate * 100)}% success</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {getCurrentTemplates().length === 0 && !loading && (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">
                {activeTab === "recent" ? "No recently used templates" : "No templates found"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}