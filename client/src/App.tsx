import { useState, useEffect, useCallback } from 'react';
import {
  SidebarState,
  ViewMode,
  AlbumData,
  SavedAlbum,
  MediaItem,
} from './types/media';
import { useMediaFilters } from './hooks/useMediaFilters';
import { CollapsibleSidebar } from './components/CollapsibleSidebar';
import { HeaderBar } from './components/HeaderBar';
import { FilterToolbar } from './components/FilterToolbar';
import { MediaGrid } from './components/MediaGrid';
import { LightboxModal } from './components/LightboxModal';
import { BatchDownloadBar } from './components/BatchDownloadBar';
import { AddAlbumModal } from './components/AddAlbumModal';
import { Loader2, AlertCircle } from 'lucide-react';

export function App() {
  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('icloud_dark_mode');
    return saved !== null ? saved === 'true' : true; // Default dark mode for modern Apple media gallery look
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('icloud_dark_mode', String(darkMode));
  }, [darkMode]);

  // Sidebar State (Expanded / Mini / Hidden)
  const [sidebarState, setSidebarState] = useState<SidebarState>(() => {
    const saved = localStorage.getItem('icloud_sidebar_state');
    return (saved as SidebarState) || 'expanded';
  });

  const handleSidebarStateChange = (state: SidebarState) => {
    setSidebarState(state);
    localStorage.setItem('icloud_sidebar_state', state);
  };

  // View Mode & Columns
  const [viewMode, setViewMode] = useState<ViewMode>('uniform');
  const [columnCount, setColumnCount] = useState<number>(4);

  // Album Data & Loading States
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Saved Albums Library
  const [savedAlbums, setSavedAlbums] = useState<SavedAlbum[]>(() => {
    try {
      const stored = localStorage.getItem('icloud_saved_albums');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modal & Selection States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Helper to persist saved albums
  const saveAlbumToLibrary = useCallback((token: string, title: string, count: number, coverUrl?: string) => {
    setSavedAlbums((prev) => {
      const filtered = prev.filter((a) => a.token !== token);
      const updated = [
        {
          token,
          title: title || 'Shared Album',
          itemCount: count,
          coverUrl,
          savedAt: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 20); // Keep up to 20 albums
      try {
        localStorage.setItem('icloud_saved_albums', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save to localStorage', e);
      }
      return updated;
    });
  }, []);

  const deleteSavedAlbum = (token: string) => {
    setSavedAlbums((prev) => {
      const updated = prev.filter((a) => a.token !== token);
      localStorage.setItem('icloud_saved_albums', JSON.stringify(updated));
      return updated;
    });
  };

  // Load Demo Album
  const loadDemoAlbum = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/album/demo');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load demo album');
      setAlbumData(data.album);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading demo album');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load Live iCloud Album
  const loadICloudAlbum = async (urlOrToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlOrToken }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch iCloud album');

      setAlbumData(data.album);
      saveAlbumToLibrary(
        data.album.token,
        data.album.metadata.streamName,
        data.album.items.length,
        data.album.items[0]?.thumbnailUrl
      );
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error connecting to iCloud shared album');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh current album
  const handleRefresh = async () => {
    if (!albumData) return;
    setIsRefreshing(true);
    try {
      if (albumData.token === 'DEMO_ALBUM_TOKEN') {
        await loadDemoAlbum();
      } else {
        const res = await fetch('/api/album', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urlOrToken: albumData.token }),
        });
        const data = await res.json();
        if (data.success) {
          setAlbumData(data.album);
        }
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial mount load: load first saved album or demo album
  useEffect(() => {
    loadDemoAlbum();
  }, [loadDemoAlbum]);

  // Media Filters & Sorting Hook
  const {
    mediaTypeFilter,
    setMediaTypeFilter,
    orientationFilter,
    setOrientationFilter,
    contributorFilter,
    setContributorFilter,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    groupBy,
    setGroupBy,
    favorites,
    toggleFavorite,
    contributors,
    counts,
    sortedItems,
    groupedItems,
    totalCount,
    filteredCount,
    isFiltered,
    resetFilters,
  } = useMediaFilters({
    items: albumData?.items || [],
    albumToken: albumData?.token || 'demo',
  });

  // Batch Selection Handlers
  const handleToggleSelect = (item: MediaItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const handleSelectGroup = (groupItems: MediaItem[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = groupItems.every((item) => next.has(item.id));
      if (allSelected) {
        groupItems.forEach((item) => next.delete(item.id));
      } else {
        groupItems.forEach((item) => next.add(item.id));
      }
      return next;
    });
    if (!isSelectionMode) setIsSelectionMode(true);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(sortedItems.map((item) => item.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const selectedItemsList = (albumData?.items || []).filter((item) =>
    selectedIds.has(item.id)
  );

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7]">
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar
        state={sidebarState}
        onStateChange={handleSidebarStateChange}
        metadata={albumData?.metadata || null}
        currentAlbumToken={albumData?.token || ''}
        savedAlbums={savedAlbums}
        onSelectAlbum={(token) => loadICloudAlbum(token)}
        onDeleteSavedAlbum={deleteSavedAlbum}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onLoadDemo={loadDemoAlbum}
        mediaTypeFilter={mediaTypeFilter}
        onSelectMediaTypeFilter={setMediaTypeFilter}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        counts={counts}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header Bar */}
        <HeaderBar
          metadata={albumData?.metadata || null}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          columnCount={columnCount}
          onColumnCountChange={setColumnCount}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={() => {
            setIsSelectionMode(!isSelectionMode);
            if (isSelectionMode) setSelectedIds(new Set());
          }}
          selectedCount={selectedIds.size}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

        {/* Filter Toolbar */}
        <FilterToolbar
          mediaTypeFilter={mediaTypeFilter}
          onMediaTypeFilterChange={setMediaTypeFilter}
          orientationFilter={orientationFilter}
          onOrientationFilterChange={setOrientationFilter}
          contributorFilter={contributorFilter}
          onContributorFilterChange={setContributorFilter}
          contributors={contributors}
          sortOption={sortOption}
          onSortOptionChange={setSortOption}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          totalCount={totalCount}
          filteredCount={filteredCount}
          isFiltered={isFiltered}
          onResetFilters={resetFilters}
          counts={counts}
        />

        {/* Content Body */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-36 text-center px-4">
              <Loader2 className="w-10 h-10 text-apple-blue animate-spin mb-4" />
              <p className="text-sm font-semibold text-apple-gray-800 dark:text-apple-gray-200">
                Loading stream from iCloud...
              </p>
              <p className="text-xs text-apple-gray-500 max-w-sm mt-1.5">
                Connecting to Apple's shared album streams. Large albums with thousands of items are cached automatically for instant future visits.
              </p>
            </div>
          ) : error && !albumData ? (
            <div className="flex flex-col items-center justify-center py-36 text-center px-4">
              <div className="p-4 rounded-3xl bg-red-500/10 text-red-500 mb-4">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-base font-semibold">Could not load album</h3>
              <p className="text-xs text-apple-gray-500 max-w-sm mt-1 mb-4">
                {error}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-apple-blue text-white text-xs font-semibold"
                >
                  Enter Album Link
                </button>
                <button
                  onClick={loadDemoAlbum}
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-medium"
                >
                  Try Demo Album
                </button>
              </div>
            </div>
          ) : (
            <MediaGrid
              groups={groupedItems}
              viewMode={viewMode}
              columnCount={columnCount}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectGroup={handleSelectGroup}
              isSelectionMode={isSelectionMode}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpenLightbox={(item) => {
                const index = sortedItems.findIndex((i) => i.id === item.id);
                setLightboxIndex(index >= 0 ? index : 0);
              }}
              onResetFilters={resetFilters}
            />
          )}
        </div>

        {/* Floating Batch Download Bar */}
        <BatchDownloadBar
          selectedItems={selectedItemsList}
          totalFilteredCount={sortedItems.length}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          albumName={albumData?.metadata.streamName || 'icloud_album'}
        />
      </main>

      {/* Lightbox Modal (Scales vertical videos to viewport with zero scrolling) */}
      {lightboxIndex !== null && (
        <LightboxModal
          items={sortedItems}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* Add / Connect Album Modal */}
      <AddAlbumModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={loadICloudAlbum}
        onLoadDemo={loadDemoAlbum}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}

export default App;
