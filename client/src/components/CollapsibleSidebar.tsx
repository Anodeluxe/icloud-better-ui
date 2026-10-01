import React, { useEffect } from 'react';
import {
  Cloud,
  ChevronLeft,
  ChevronRight,
  Plus,
  PlaySquare,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  Image as ImageIcon,
  Video,
  Smartphone,
  Star,
  FolderHeart,
} from 'lucide-react';
import {
  SidebarState,
  AlbumMetadata,
  SavedAlbum,
  MediaTypeFilter,
} from '../types/media';

interface CollapsibleSidebarProps {
  state: SidebarState;
  onStateChange: (state: SidebarState) => void;
  metadata: AlbumMetadata | null;
  currentAlbumToken: string;
  savedAlbums: SavedAlbum[];
  onSelectAlbum: (token: string) => void;
  onDeleteSavedAlbum: (token: string) => void;
  onOpenAddModal: () => void;
  onLoadDemo: () => void;
  mediaTypeFilter: MediaTypeFilter;
  onSelectMediaTypeFilter: (filter: MediaTypeFilter) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  counts: {
    all: number;
    photos: number;
    videos: number;
    vertical: number;
    favorites: number;
  };
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  state,
  onStateChange,
  metadata,
  currentAlbumToken,
  savedAlbums,
  onSelectAlbum,
  onDeleteSavedAlbum,
  onOpenAddModal,
  onLoadDemo,
  mediaTypeFilter,
  onSelectMediaTypeFilter,
  darkMode,
  onToggleDarkMode,
  counts,
}) => {
  // Keyboard shortcut '[' to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === '[' || (e.ctrlKey && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        onStateChange(
          state === 'expanded' ? 'mini' : state === 'mini' ? 'hidden' : 'expanded'
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, onStateChange]);

  if (state === 'hidden') {
    return (
      <button
        onClick={() => onStateChange('expanded')}
        title="Open Sidebar ([)"
        className="fixed top-4 left-4 z-40 p-2.5 rounded-full bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-md shadow-lg border border-black/10 dark:border-white/10 hover:scale-105 active:scale-95 transition-all text-apple-gray-700 dark:text-apple-gray-200"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    );
  }

  const isMini = state === 'mini';

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col justify-between z-30 transition-all duration-300 ease-in-out border-r border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#161617]/90 backdrop-blur-xl ${
        isMini ? 'w-20' : 'w-72'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
          {!isMini ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-2 rounded-xl bg-apple-blue/10 text-apple-blue flex-shrink-0">
                <Cloud className="w-5 h-5 fill-current" />
              </div>
              <div className="truncate">
                <h1 className="font-semibold text-sm tracking-tight text-apple-gray-900 dark:text-white truncate">
                  iCloud Gallery
                </h1>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Enhanced Stream
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto p-2 rounded-xl bg-apple-blue/10 text-apple-blue">
              <Cloud className="w-5 h-5 fill-current" />
            </div>
          )}

          <button
            onClick={() =>
              onStateChange(isMini ? 'expanded' : 'mini')
            }
            title={isMini ? 'Expand Sidebar' : 'Collapse Sidebar ([)'}
            className="p-1.5 rounded-lg text-apple-gray-500 hover:text-apple-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {isMini ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Current Album Info */}
        {!isMini && metadata && (
          <div className="p-4 mx-3 my-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-apple-gray-400">
              Active Album
            </span>
            <h2 className="font-semibold text-sm text-apple-gray-900 dark:text-white truncate mt-0.5">
              {metadata.streamName}
            </h2>
            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 truncate mt-0.5">
              Shared by {metadata.ownerName}
            </p>
            <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 text-[11px] text-apple-gray-500">
              <span>{metadata.photoCount} photos</span>
              <span>•</span>
              <span>{metadata.videoCount} videos</span>
            </div>
          </div>
        )}

        {/* Navigation / Quick Filter Shortcuts */}
        <div className="px-3 py-2 space-y-1">
          <button
            onClick={() => onSelectMediaTypeFilter('all')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              mediaTypeFilter === 'all'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'text-apple-gray-700 dark:text-apple-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="All Media"
          >
            <PlaySquare className="w-4 h-4 flex-shrink-0" />
            {!isMini && (
              <>
                <span className="flex-1 text-left">All Media</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    mediaTypeFilter === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-apple-gray-500'
                  }`}
                >
                  {counts.all}
                </span>
              </>
            )}
          </button>

          <button
            onClick={() => onSelectMediaTypeFilter('photos')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              mediaTypeFilter === 'photos'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'text-apple-gray-700 dark:text-apple-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Photos"
          >
            <ImageIcon className="w-4 h-4 flex-shrink-0" />
            {!isMini && (
              <>
                <span className="flex-1 text-left">Photos</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    mediaTypeFilter === 'photos'
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-apple-gray-500'
                  }`}
                >
                  {counts.photos}
                </span>
              </>
            )}
          </button>

          <button
            onClick={() => onSelectMediaTypeFilter('videos')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              mediaTypeFilter === 'videos'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'text-apple-gray-700 dark:text-apple-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Videos"
          >
            <Video className="w-4 h-4 flex-shrink-0" />
            {!isMini && (
              <>
                <span className="flex-1 text-left">Videos</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    mediaTypeFilter === 'videos'
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-apple-gray-500'
                  }`}
                >
                  {counts.videos}
                </span>
              </>
            )}
          </button>

          <button
            onClick={() => onSelectMediaTypeFilter('vertical')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              mediaTypeFilter === 'vertical'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'text-apple-gray-700 dark:text-apple-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Vertical Media"
          >
            <Smartphone className="w-4 h-4 flex-shrink-0" />
            {!isMini && (
              <>
                <span className="flex-1 text-left">Vertical Media</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    mediaTypeFilter === 'vertical'
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-apple-gray-500'
                  }`}
                >
                  {counts.vertical}
                </span>
              </>
            )}
          </button>

          <button
            onClick={() => onSelectMediaTypeFilter('favorites')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              mediaTypeFilter === 'favorites'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-apple-gray-700 dark:text-apple-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Favorites"
          >
            <Star className={`w-4 h-4 flex-shrink-0 ${mediaTypeFilter === 'favorites' ? 'fill-current' : ''}`} />
            {!isMini && (
              <>
                <span className="flex-1 text-left">Favorites</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    mediaTypeFilter === 'favorites'
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-apple-gray-500'
                  }`}
                >
                  {counts.favorites}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Saved Albums Section */}
        {!isMini && (
          <div className="px-3 py-3 border-t border-black/5 dark:border-white/5 mt-2">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-apple-gray-400 flex items-center gap-1.5">
                <FolderHeart className="w-3 h-3" />
                Library
              </span>
              <button
                onClick={onOpenAddModal}
                className="text-[11px] font-medium text-apple-blue hover:text-apple-blue-hover flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {savedAlbums.length === 0 ? (
                <p className="text-[11px] text-apple-gray-400 px-2 py-1 italic">
                  No saved albums yet.
                </p>
              ) : (
                savedAlbums.map((album) => {
                  const isActive = album.token === currentAlbumToken;
                  return (
                    <div
                      key={album.token}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-black/[0.06] dark:bg-white/[0.08] font-medium text-apple-gray-900 dark:text-white'
                          : 'text-apple-gray-600 dark:text-apple-gray-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <button
                        onClick={() => onSelectAlbum(album.token)}
                        className="truncate flex-1 text-left"
                        title={album.title}
                      >
                        <p className="truncate text-xs">{album.title}</p>
                        <span className="text-[10px] text-apple-gray-400">
                          {album.itemCount} items
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSavedAlbum(album.token);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-apple-gray-400 hover:text-red-500 transition-opacity"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-black/5 dark:border-white/5 space-y-2">
        <button
          onClick={onOpenAddModal}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-apple-blue text-white text-xs font-medium hover:bg-apple-blue-hover active:scale-98 shadow-sm transition-all ${
            isMini ? 'px-0' : ''
          }`}
          title="Connect iCloud Album"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!isMini && <span>Connect Album</span>}
        </button>

        <button
          onClick={onLoadDemo}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-black/5 dark:bg-white/10 text-apple-gray-700 dark:text-apple-gray-200 text-xs font-medium hover:bg-black/10 dark:hover:bg-white/15 transition-all ${
            isMini ? 'px-0' : ''
          }`}
          title="Load Demo Album"
        >
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          {!isMini && <span>Try Demo Album</span>}
        </button>

        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-apple-gray-500 hover:text-apple-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors mx-auto"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
