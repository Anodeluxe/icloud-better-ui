import React, { useRef, useEffect } from 'react';
import {
  Search,
  X,
  ArrowUpDown,
  User,
  RotateCcw,
  Smartphone,
  Video,
  Image as ImageIcon,
  Star,
  Layers,
} from 'lucide-react';
import {
  MediaTypeFilter,
  OrientationFilter,
  SortOption,
  GroupByOption,
} from '../types/media';

interface FilterToolbarProps {
  mediaTypeFilter: MediaTypeFilter;
  onMediaTypeFilterChange: (filter: MediaTypeFilter) => void;
  orientationFilter: OrientationFilter;
  onOrientationFilterChange: (filter: OrientationFilter) => void;
  contributorFilter: string;
  onContributorFilterChange: (contributor: string) => void;
  contributors: Array<{ name: string; count: number }>;
  sortOption: SortOption;
  onSortOptionChange: (sort: SortOption) => void;
  groupBy: GroupByOption;
  onGroupByChange: (group: GroupByOption) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  totalCount: number;
  filteredCount: number;
  isFiltered: boolean;
  onResetFilters: () => void;
  counts: {
    all: number;
    photos: number;
    videos: number;
    vertical: number;
    favorites: number;
  };
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  mediaTypeFilter,
  onMediaTypeFilterChange,
  orientationFilter,
  onOrientationFilterChange,
  contributorFilter,
  onContributorFilterChange,
  contributors,
  sortOption,
  onSortOptionChange,
  groupBy,
  onGroupByChange,
  searchQuery,
  onSearchQueryChange,
  totalCount,
  filteredCount,
  isFiltered,
  onResetFilters,
  counts,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="px-6 py-3 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-[#161617]/50 backdrop-blur-md space-y-3">
      {/* Top Row: Search & Quick Filter Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Quick Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => onMediaTypeFilterChange('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              mediaTypeFilter === 'all'
                ? 'bg-apple-gray-900 text-white dark:bg-white dark:text-apple-gray-900 shadow-sm'
                : 'bg-black/[0.04] dark:bg-white/[0.06] text-apple-gray-600 dark:text-apple-gray-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.1]'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-75">{counts.all}</span>
          </button>

          <button
            onClick={() => onMediaTypeFilterChange('photos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              mediaTypeFilter === 'photos'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'bg-black/[0.04] dark:bg-white/[0.06] text-apple-gray-600 dark:text-apple-gray-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.1]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos</span>
            <span className="text-[10px] opacity-75">{counts.photos}</span>
          </button>

          <button
            onClick={() => onMediaTypeFilterChange('videos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              mediaTypeFilter === 'videos'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'bg-black/[0.04] dark:bg-white/[0.06] text-apple-gray-600 dark:text-apple-gray-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.1]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Videos</span>
            <span className="text-[10px] opacity-75">{counts.videos}</span>
          </button>

          <button
            onClick={() => onMediaTypeFilterChange('vertical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              mediaTypeFilter === 'vertical'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-black/[0.04] dark:bg-white/[0.06] text-apple-gray-600 dark:text-apple-gray-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.1]'
            }`}
            title="Filter to vertical 9:16 videos & photos"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Vertical Only</span>
            <span className="text-[10px] opacity-75">{counts.vertical}</span>
          </button>

          <button
            onClick={() => onMediaTypeFilterChange('favorites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              mediaTypeFilter === 'favorites'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-black/[0.04] dark:bg-white/[0.06] text-apple-gray-600 dark:text-apple-gray-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.1]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${mediaTypeFilter === 'favorites' ? 'fill-current' : ''}`} />
            <span>Favorites</span>
            <span className="text-[10px] opacity-75">{counts.favorites}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apple-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search captions, contributors, dates... (Press /)"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/5 text-xs text-apple-gray-900 dark:text-white placeholder-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/50 focus:bg-white dark:focus:bg-[#2c2c2e] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-apple-gray-400 hover:text-apple-gray-600 dark:hover:text-apple-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Detailed Dropdowns & Grouping */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-black/5 dark:border-white/5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Contributor Dropdown */}
          <div className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1.5 rounded-xl border border-black/5 dark:border-white/5">
            <User className="w-3.5 h-3.5 text-apple-gray-500" />
            <span className="text-apple-gray-500 text-[11px]">By:</span>
            <select
              value={contributorFilter}
              onChange={(e) => onContributorFilterChange(e.target.value)}
              className="bg-transparent text-apple-gray-800 dark:text-apple-gray-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="dark:bg-[#1c1c1e]">
                All Contributors ({contributors.length})
              </option>
              {contributors.map((c) => (
                <option key={c.name} value={c.name} className="dark:bg-[#1c1c1e]">
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
          </div>

          {/* Orientation Dropdown */}
          <div className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1.5 rounded-xl border border-black/5 dark:border-white/5">
            <Smartphone className="w-3.5 h-3.5 text-apple-gray-500" />
            <span className="text-apple-gray-500 text-[11px]">Orientation:</span>
            <select
              value={orientationFilter}
              onChange={(e) => onOrientationFilterChange(e.target.value as OrientationFilter)}
              className="bg-transparent text-apple-gray-800 dark:text-apple-gray-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="dark:bg-[#1c1c1e]">All Orientations</option>
              <option value="vertical" className="dark:bg-[#1c1c1e]">Portrait (Vertical)</option>
              <option value="horizontal" className="dark:bg-[#1c1c1e]">Landscape (Horizontal)</option>
              <option value="square" className="dark:bg-[#1c1c1e]">Square (1:1)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1.5 rounded-xl border border-black/5 dark:border-white/5">
            <ArrowUpDown className="w-3.5 h-3.5 text-apple-gray-500" />
            <span className="text-apple-gray-500 text-[11px]">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => onSortOptionChange(e.target.value as SortOption)}
              className="bg-transparent text-apple-gray-800 dark:text-apple-gray-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="date-desc" className="dark:bg-[#1c1c1e]">Newest First</option>
              <option value="date-asc" className="dark:bg-[#1c1c1e]">Oldest First</option>
              <option value="size-desc" className="dark:bg-[#1c1c1e]">File Size (Largest)</option>
              <option value="size-asc" className="dark:bg-[#1c1c1e]">File Size (Smallest)</option>
              <option value="contributor" className="dark:bg-[#1c1c1e]">Contributor (A-Z)</option>
              <option value="type" className="dark:bg-[#1c1c1e]">Videos First</option>
            </select>
          </div>

          {/* Group By Dropdown */}
          <div className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1.5 rounded-xl border border-black/5 dark:border-white/5">
            <Layers className="w-3.5 h-3.5 text-apple-gray-500" />
            <span className="text-apple-gray-500 text-[11px]">Timeline:</span>
            <select
              value={groupBy}
              onChange={(e) => onGroupByChange(e.target.value as GroupByOption)}
              className="bg-transparent text-apple-gray-800 dark:text-apple-gray-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="none" className="dark:bg-[#1c1c1e]">Continuous Grid</option>
              <option value="day" className="dark:bg-[#1c1c1e]">Group by Day</option>
              <option value="month" className="dark:bg-[#1c1c1e]">Group by Month</option>
              <option value="year" className="dark:bg-[#1c1c1e]">Group by Year</option>
              <option value="contributor" className="dark:bg-[#1c1c1e]">Group by Contributor</option>
            </select>
          </div>
        </div>

        {/* Counter and Reset */}
        <div className="flex items-center gap-3">
          <span className="text-apple-gray-500 text-xs">
            Showing <strong className="text-apple-gray-800 dark:text-apple-gray-200">{filteredCount}</strong> of {totalCount} items
          </span>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-apple-blue hover:bg-apple-blue/10 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
