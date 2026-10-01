import React from 'react';
import {
  LayoutGrid,
  Grid3X3,
  Columns,
  RotateCw,
  CheckSquare,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { ViewMode, AlbumMetadata } from '../types/media';

interface HeaderBarProps {
  metadata: AlbumMetadata | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  columnCount: number;
  onColumnCountChange: (count: number) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenAddModal: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  metadata,
  viewMode,
  onViewModeChange,
  columnCount,
  onColumnCountChange,
  isSelectionMode,
  onToggleSelectionMode,
  selectedCount,
  onRefresh,
  isRefreshing,
  onOpenAddModal,
}) => {
  return (
    <header className="sticky top-0 z-20 px-6 py-3.5 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#161617]/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
      {/* Left: Album Title & Live Status */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-apple-gray-900 dark:text-white">
              {metadata ? metadata.streamName : 'Loading Album...'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live
            </span>
          </div>
          {metadata && (
            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
              {metadata.totalItems} items ({metadata.photoCount} photos, {metadata.videoCount} videos, {metadata.verticalCount} vertical)
            </p>
          )}
        </div>
      </div>

      {/* Right: Controls & View Mode */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl border border-black/5 dark:border-white/5">
          <button
            onClick={() => onViewModeChange('uniform')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'uniform'
                ? 'bg-white dark:bg-[#2c2c2e] text-apple-gray-900 dark:text-white shadow-sm'
                : 'text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white'
            }`}
            title="Uniform Balanced Grid (Keeps vertical videos compact)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Uniform</span>
          </button>

          <button
            onClick={() => onViewModeChange('masonry')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'masonry'
                ? 'bg-white dark:bg-[#2c2c2e] text-apple-gray-900 dark:text-white shadow-sm'
                : 'text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white'
            }`}
            title="Capped Masonry (Natural ratios with max height cap)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Masonry</span>
          </button>

          <button
            onClick={() => onViewModeChange('square')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'square'
                ? 'bg-white dark:bg-[#2c2c2e] text-apple-gray-900 dark:text-white shadow-sm'
                : 'text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white'
            }`}
            title="Square Grid (1:1 Apple Photos Style)"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Square</span>
          </button>
        </div>

        {/* Column Density Slider (2 to 6 columns) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-apple-gray-500" />
          <input
            type="range"
            min="2"
            max="6"
            step="1"
            value={columnCount}
            onChange={(e) => onColumnCountChange(Number(e.target.value))}
            className="w-20 accent-apple-blue h-1 bg-black/20 dark:bg-white/20 rounded-lg cursor-pointer"
            title={`Columns: ${columnCount}`}
          />
          <span className="text-[11px] font-semibold text-apple-gray-600 dark:text-apple-gray-400 w-3">
            {columnCount}
          </span>
        </div>

        {/* Batch Select Toggle */}
        <button
          onClick={onToggleSelectionMode}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
            isSelectionMode
              ? 'bg-apple-blue text-white border-apple-blue shadow-sm'
              : 'bg-white dark:bg-[#2c2c2e] text-apple-gray-700 dark:text-apple-gray-300 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          title="Select items for batch ZIP download"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{isSelectionMode ? `${selectedCount} Selected` : 'Select'}</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white bg-white dark:bg-[#2c2c2e] border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all disabled:opacity-50"
          title="Refresh stream from iCloud"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Switch / Add Album Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-apple-blue text-white text-xs font-medium hover:bg-apple-blue-hover transition-all shadow-sm"
          title="Connect another album"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Album</span>
        </button>
      </div>
    </header>
  );
};
