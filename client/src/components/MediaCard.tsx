import React, { useState, useRef } from 'react';
import { Play, Check, Star, Smartphone } from 'lucide-react';
import { MediaItem, ViewMode } from '../types/media';

interface MediaCardProps {
  item: MediaItem;
  viewMode: ViewMode;
  isSelected: boolean;
  onToggleSelect: (item: MediaItem) => void;
  isSelectionMode: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: (item: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  viewMode,
  isSelected,
  onToggleSelect,
  isSelectionMode,
  isFavorite,
  onToggleFavorite,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted by browser
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Format date helper
  const formattedDate = new Date(item.dateCreated).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const [hasError, setHasError] = useState(false);
  const posterSrc = item.posterUrl || item.thumbnailUrl;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if (isSelectionMode) {
          onToggleSelect(item);
        } else {
          onClick(item);
        }
      }}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer bg-apple-gray-100 dark:bg-[#1c1c1e] transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5 ${
        isSelected ? 'ring-4 ring-apple-blue shadow-md' : ''
      }`}
    >
      {/* Container aspect ratio based on viewMode */}
      <div
        className={`relative w-full overflow-hidden flex items-center justify-center ${
          viewMode === 'uniform'
            ? 'aspect-[4/3]'
            : viewMode === 'square'
            ? 'aspect-square'
            : 'max-h-[380px] min-h-[180px]'
        }`}
        style={
          viewMode === 'masonry'
            ? {
                aspectRatio: `${item.width} / ${item.height}`,
              }
            : undefined
        }
      >
        {/* Placeholder shimmer before image loads */}
        {!imageLoaded && !hasError && (
          <div className="absolute inset-0 bg-black/5 dark:bg-white/5 animate-pulse" />
        )}

        {/* Ambient Blur Background for Vertical Media in Uniform mode to avoid harsh bars */}
        {viewMode === 'uniform' && item.isVertical && posterSrc && !hasError && (
          <img
            src={posterSrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
          />
        )}

        {/* Still Image or Video Poster */}
        {!hasError ? (
          <img
            src={posterSrc}
            alt={item.caption || (item.type === 'video' ? 'iCloud video thumbnail' : 'iCloud photo')}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full transition-transform duration-500 ease-out group-hover:scale-105 ${
              viewMode === 'uniform'
                ? item.isVertical
                  ? 'object-contain relative z-10'
                  : 'object-cover'
                : viewMode === 'square'
                ? 'object-cover'
                : 'object-cover'
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/20 text-white/50">
            <Play className="w-8 h-8 opacity-60" />
            <span className="text-[10px] mt-1 font-medium">Video</span>
          </div>
        )}

        {/* Hover Video Preview for Video Items */}
        {item.type === 'video' && item.url && isHovered && (
          <video
            ref={videoRef}
            src={item.url}
            muted
            loop
            playsInline
            className={`absolute inset-0 w-full h-full z-20 ${
              viewMode === 'uniform' && item.isVertical ? 'object-contain' : 'object-cover'
            }`}
          />
        )}

        {/* Gradient Overlay for badges & text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20" />

        {/* Selection Checkbox (Top Left) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(item);
          }}
          className={`absolute top-2.5 left-2.5 z-30 transition-all duration-200 ${
            isSelectionMode || isSelected
              ? 'opacity-100 scale-100'
              : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              isSelected
                ? 'bg-apple-blue text-white shadow-md'
                : 'bg-black/40 hover:bg-black/60 text-white border border-white/40'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>

        {/* Favorite Star Button (Top Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-2.5 right-2.5 z-30 p-1.5 rounded-full backdrop-blur-md transition-all duration-200 ${
            isFavorite
              ? 'opacity-100 bg-amber-500 text-white shadow-md'
              : 'opacity-0 group-hover:opacity-100 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Media Badges (Bottom Row) */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between pointer-events-none">
          {/* Left Badge: Type Indicator */}
          <div className="flex items-center gap-1.5">
            {item.type === 'video' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-black/60 backdrop-blur-md text-white shadow-sm">
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{item.isVertical ? 'Reel' : 'Video'}</span>
              </span>
            )}
            {item.isVertical && item.type === 'photo' && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white shadow-sm">
                <Smartphone className="w-2.5 h-2.5" />
              </span>
            )}
          </div>

          {/* Right Badge: Contributor & Date */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-white/90 drop-shadow-sm">
            <span className="truncate max-w-[100px] hidden sm:inline">
              {item.contributor}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Caption footer if caption exists */}
      {item.caption && (
        <div className="p-2.5 bg-white dark:bg-[#1c1c1e] border-t border-black/5 dark:border-white/5">
          <p className="text-xs text-apple-gray-800 dark:text-apple-gray-200 truncate">
            {item.caption}
          </p>
        </div>
      )}
    </div>
  );
};
