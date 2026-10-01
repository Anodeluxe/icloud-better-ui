import { useState, useMemo, useEffect } from 'react';
import {
  MediaItem,
  MediaTypeFilter,
  OrientationFilter,
  SortOption,
  GroupByOption,
  MediaGroup,
} from '../types/media';

interface UseMediaFiltersOptions {
  items: MediaItem[];
  albumToken: string;
}

export function useMediaFilters({ items, albumToken }: UseMediaFiltersOptions) {
  // Filter States
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>('all');
  const [orientationFilter, setOrientationFilter] = useState<OrientationFilter>('all');
  const [contributorFilter, setContributorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');

  // Favorites (Stored in localStorage keyed by album token)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`icloud_favs_${albumToken}`);
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Sync favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        `icloud_favs_${albumToken}`,
        JSON.stringify(Array.from(favorites))
      );
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }
  }, [favorites, albumToken]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Extract unique contributors with counts
  const contributors = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const name = item.contributor || 'Album Owner';
      map.set(name, (map.get(name) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // Pill counts based on total items
  const counts = useMemo(() => {
    let photos = 0;
    let videos = 0;
    let vertical = 0;
    let favCount = 0;

    for (const item of items) {
      if (item.type === 'photo') photos++;
      if (item.type === 'video') videos++;
      if (item.isVertical) vertical++;
      if (favorites.has(item.id)) favCount++;
    }

    return {
      all: items.length,
      photos,
      videos,
      vertical,
      favorites: favCount,
    };
  }, [items, favorites]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Media Type Filter
      if (mediaTypeFilter === 'photos' && item.type !== 'photo') return false;
      if (mediaTypeFilter === 'videos' && item.type !== 'video') return false;
      if (mediaTypeFilter === 'vertical' && !item.isVertical) return false;
      if (mediaTypeFilter === 'favorites' && !favorites.has(item.id)) return false;

      // 2. Orientation Filter
      if (orientationFilter === 'vertical' && !item.isVertical) return false;
      if (orientationFilter === 'horizontal' && (item.isVertical || item.width === item.height)) return false;
      if (orientationFilter === 'square' && item.width !== item.height) return false;

      // 3. Contributor Filter
      if (contributorFilter !== 'all' && item.contributor !== contributorFilter) {
        return false;
      }

      // 4. Search Query (Captions, Contributor, or Date)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const captionMatch = (item.caption || '').toLowerCase().includes(query);
        const contributorMatch = (item.contributor || '').toLowerCase().includes(query);
        const dateStr = new Date(item.dateCreated).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).toLowerCase();
        const dateMatch = dateStr.includes(query);

        if (!captionMatch && !contributorMatch && !dateMatch) {
          return false;
        }
      }

      return true;
    });
  }, [items, mediaTypeFilter, orientationFilter, contributorFilter, searchQuery, favorites]);

  // Sort filtered items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];

    sorted.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
        case 'date-asc':
          return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
        case 'size-desc':
          return (b.fileSize || 0) - (a.fileSize || 0);
        case 'size-asc':
          return (a.fileSize || 0) - (b.fileSize || 0);
        case 'contributor':
          return (a.contributor || '').localeCompare(b.contributor || '');
        case 'type':
          if (a.type === b.type) {
            return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
          }
          return a.type === 'video' ? -1 : 1;
        default:
          return 0;
      }
    });

    return sorted;
  }, [filteredItems, sortOption]);

  // Group sorted items
  const groupedItems = useMemo((): MediaGroup[] => {
    if (groupBy === 'none') {
      return [
        {
          id: 'all',
          title: 'All Media',
          items: sortedItems,
        },
      ];
    }

    const groupsMap = new Map<string, { title: string; subtitle?: string; items: MediaItem[] }>();

    for (const item of sortedItems) {
      const d = new Date(item.dateCreated);
      let key = '';
      let title = '';
      let subtitle = '';

      switch (groupBy) {
        case 'day': {
          key = d.toISOString().split('T')[0];
          title = d.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
          break;
        }
        case 'month': {
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          title = d.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          });
          break;
        }
        case 'year': {
          key = `${d.getFullYear()}`;
          title = `${d.getFullYear()}`;
          break;
        }
        case 'contributor': {
          key = item.contributor || 'Album Owner';
          title = item.contributor || 'Album Owner';
          subtitle = 'Contributor';
          break;
        }
      }

      if (!groupsMap.has(key)) {
        groupsMap.set(key, { title, subtitle, items: [] });
      }
      groupsMap.get(key)!.items.push(item);
    }

    return Array.from(groupsMap.entries()).map(([id, group]) => ({
      id,
      title: group.title,
      subtitle: group.subtitle,
      items: group.items,
    }));
  }, [sortedItems, groupBy]);

  const resetFilters = () => {
    setMediaTypeFilter('all');
    setOrientationFilter('all');
    setContributorFilter('all');
    setSearchQuery('');
    setSortOption('date-desc');
    setGroupBy('none');
  };

  const isFiltered =
    mediaTypeFilter !== 'all' ||
    orientationFilter !== 'all' ||
    contributorFilter !== 'all' ||
    Boolean(searchQuery.trim()) ||
    groupBy !== 'none' ||
    sortOption !== 'date-desc';

  return {
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
    totalCount: items.length,
    filteredCount: sortedItems.length,
    isFiltered,
    resetFilters,
  };
}
