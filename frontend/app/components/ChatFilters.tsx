import { Filter, X, Star, Pin, Tag, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

export interface ChatFilterOptions {
  showPinned: boolean;
  showStarred: boolean;
  selectedTags: string[];
  dateRange: "all" | "today" | "week" | "month";
}

interface ChatFiltersProps {
  availableTags: string[];
  filters: ChatFilterOptions;
  onFiltersChange: (filters: ChatFilterOptions) => void;
}

export function ChatFilters({ availableTags, filters, onFiltersChange }: Readonly<ChatFiltersProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleToggleTag = (tag: string) => {
    const newTags = localFilters.selectedTags.includes(tag)
      ? localFilters.selectedTags.filter(t => t !== tag)
      : [...localFilters.selectedTags, tag];
    
    const newFilters = { ...localFilters, selectedTags: newTags };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTogglePinned = () => {
    const newFilters = { ...localFilters, showPinned: !localFilters.showPinned };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleToggleStarred = () => {
    const newFilters = { ...localFilters, showStarred: !localFilters.showStarred };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (range: ChatFilterOptions["dateRange"]) => {
    const newFilters = { ...localFilters, dateRange: range };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: ChatFilterOptions = {
      showPinned: false,
      showStarred: false,
      selectedTags: [],
      dateRange: "all",
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFilterCount = 
    (localFilters.showPinned ? 1 : 0) +
    (localFilters.showStarred ? 1 : 0) +
    localFilters.selectedTags.length +
    (localFilters.dateRange === "all" ? 0 : 1);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-lg transition-colors ${
          hasActiveFilters 
            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
            : "bg-white/5 hover:bg-white/10 text-gray-400"
        }`}
        type="button"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-purple-500 text-white rounded-full text-[10px] font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClearFilters();
            }}
            className="p-0.5 hover:bg-purple-500/30 rounded transition-colors"
            title="Clear filters"
            type="button"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </button>

      {/* Filter Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-black/90 backdrop-blur-xl rounded-lg border border-white/10 shadow-xl z-50 space-y-3">
          {/* Quick Filters */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Quick Filters</p>
            <div className="space-y-1.5">
              <button
                onClick={handleTogglePinned}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                  localFilters.showPinned
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-white/5 hover:bg-white/10 text-gray-300"
                }`}
                type="button"
              >
                <Pin className="w-3.5 h-3.5" fill={localFilters.showPinned ? "currentColor" : "none"} />
                <span>Pinned Only</span>
              </button>

              <button
                onClick={handleToggleStarred}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                  localFilters.showStarred
                    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                    : "bg-white/5 hover:bg-white/10 text-gray-300"
                }`}
                type="button"
              >
                <Star className="w-3.5 h-3.5" fill={localFilters.showStarred ? "currentColor" : "none"} />
                <span>Starred Only</span>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              Date Range
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {(["all", "today", "week", "month"] as const).map(range => (
                <button
                  key={range}
                  onClick={() => handleDateRangeChange(range)}
                  className={`px-2.5 py-1.5 rounded-md text-xs transition-colors capitalize ${
                    localFilters.dateRange === range
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "bg-white/5 hover:bg-white/10 text-gray-300"
                  }`}
                  type="button"
                >
                  {range === "all" ? "All Time" : range}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2 py-1 rounded-md text-xs transition-colors ${
                      localFilters.selectedTags.includes(tag)
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-white/5 hover:bg-white/10 text-gray-300"
                    }`}
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
