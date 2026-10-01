export interface Derivative {
  checksum: string;
  fileSize: number;
  width: number;
  height: number;
  url: string | null;
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  isVertical: boolean;
  width: number;
  height: number;
  aspectRatio: number;
  url: string | null;
  thumbnailUrl: string;
  posterUrl?: string;
  downloadUrl: string | null;
  fileSize: number;
  caption: string;
  dateCreated: string;
  contributor: string;
  derivatives?: Derivative[];
}

export interface AlbumMetadata {
  streamName: string;
  ownerName: string;
  userFirstName?: string;
  userLastName?: string;
  totalItems: number;
  photoCount: number;
  videoCount: number;
  verticalCount: number;
}

export interface AlbumData {
  token: string;
  metadata: AlbumMetadata;
  items: MediaItem[];
}

export interface SavedAlbum {
  token: string;
  title: string;
  itemCount: number;
  coverUrl?: string;
  savedAt: string;
}

export type ViewMode = 'uniform' | 'masonry' | 'square';

export type MediaTypeFilter = 'all' | 'photos' | 'videos' | 'vertical' | 'favorites';

export type OrientationFilter = 'all' | 'vertical' | 'horizontal' | 'square';

export type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'size-desc'
  | 'size-asc'
  | 'contributor'
  | 'type';

export type GroupByOption = 'none' | 'day' | 'month' | 'year' | 'contributor';

export type SidebarState = 'expanded' | 'mini' | 'hidden';

export interface MediaGroup {
  id: string;
  title: string;
  subtitle?: string;
  items: MediaItem[];
}
