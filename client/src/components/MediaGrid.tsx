import React, { useState, useEffect, useRef } from 'react';
import { MediaGroup, MediaItem, ViewMode } from '../types/media';
import { MediaCard } from './MediaCard';
import { CheckSquare, SearchX, Loader2 } from 'lucide-react';

interface MediaGridProps {
  groups: MediaGroup[];
  viewMode: ViewMode;
  columnCount: number;
  selectedIds: Set<string>;
  onToggleSelect: (item: MediaItem) => void;
  onSelectGroup: (items: MediaItem[]) => void;
  isSelectionMode: boolean;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onOpenLightbox: (item: MediaItem) => void;
  onResetFilters: () => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  groups,
  viewMode,
  columnCount,
  selectedIds,
  onToggleSelect,
  onSelectGroup,
  isSelectionMode,
  favorites,
  onToggleFavorite,
  onOpenLightbox,
  onResetFilters,
}) => {
  // Map column count to tailwind grid classes
  const getGridColsClass = () => {
    switch (columnCount) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      case 4:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
      case 5:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
      case 6:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6';
      default:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
    }
  };

  const totalItems = groups.reduce((acc, g) => acc + g.items.length, 0);

  // Progressive batch rendering for instant initial load and 60fps scrolling
  const [renderLimit, setRenderLimit] = useState(60);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRenderLimit(60);
  }, [groups]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && renderLimit < totalItems) {
          setRenderLimit((prev) => Math.min(prev + 60, totalItems));
        }
      },
      { rootMargin: '800px' } // Pre-load 800px before user reaches bottom
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [renderLimit, totalItems]);

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="p-4 rounded-3xl bg-apple-gray-100 dark:bg-[#1c1c1e] text-apple-gray-400 mb-4">
          <SearchX className="w-10 h-10" />
        </div>
        <h3 className="text-base font-semibold text-apple-gray-900 dark:text-white">
          No media found
        </h3>
        <p className="text-xs text-apple-gray-500 max-w-sm mt-1 mb-4">
          No items match your active filters or search query. Try broadening your criteria.
        </p>
        <button
          onClick={onResetFilters}
          className="px-4 py-2 rounded-xl bg-apple-blue text-white text-xs font-medium hover:bg-apple-blue-hover transition-colors shadow-sm"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  let renderedCount = 0;

  return (
    <div className="p-6 space-y-8">
      {groups.map((group) => {
        if (renderedCount >= renderLimit) return null;

        const remainingLimit = renderLimit - renderedCount;
        const visibleGroupItems = group.items.slice(0, remainingLimit);
        renderedCount += visibleGroupItems.length;

        if (visibleGroupItems.length === 0) return null;

        const isGroupSelected =
          group.items.length > 0 &&
          group.items.every((item) => selectedIds.has(item.id));

        return (
          <section key={group.id} className="space-y-4">
            {/* Section Header (if grouped) */}
            {group.id !== 'all' && (
              <div className="sticky top-[118px] z-10 py-2.5 px-4 rounded-2xl bg-white/80 dark:bg-[#161617]/80 backdrop-blur-md border border-black/5 dark:border-white/5 flex items-center justify-between shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-apple-gray-900 dark:text-white">
                    {group.title}
                  </h3>
                  {group.subtitle && (
                    <span className="text-[11px] text-apple-gray-500">
                      {group.subtitle}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-apple-gray-500 font-medium">
                    {group.items.length} items
                  </span>

                  <button
                    onClick={() => onSelectGroup(group.items)}
                    className="flex items-center gap-1 text-xs font-medium text-apple-blue hover:text-apple-blue-hover px-2 py-1 rounded-lg hover:bg-apple-blue/10 transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{isGroupSelected ? 'Deselect Section' : 'Select Section'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Media Items Grid */}
            <div className={`grid gap-4 ${getGridColsClass()}`}>
              {visibleGroupItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  viewMode={viewMode}
                  isSelected={selectedIds.has(item.id)}
                  onToggleSelect={onToggleSelect}
                  isSelectionMode={isSelectionMode}
                  isFavorite={favorites.has(item.id)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onOpenLightbox}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Sentinel for progressive infinite loading */}
      {renderLimit < totalItems && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-xs text-apple-gray-400">
            <Loader2 className="w-4 h-4 animate-spin text-apple-blue" />
            <span>Loading more items ({renderLimit} of {totalItems})...</span>
          </div>
        </div>
      )}
    </div>
  );
};
