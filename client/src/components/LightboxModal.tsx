import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Repeat,
  Maximize,
  Download,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Star,
  Smartphone,
  Calendar,
  User,
  HardDrive,
} from 'lucide-react';
import { MediaItem } from '../types/media';

interface LightboxModalProps {
  items: MediaItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  favorites,
  onToggleFavorite,
}) => {
  const currentItem = items[currentIndex];

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);

  // Photo Zoom State
  const [zoomLevel, setZoomLevel] = useState(1);

  // Info drawer state
  const [showInfo, setShowInfo] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset zoom & video when changing items
  useEffect(() => {
    setZoomLevel(1);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [currentIndex]);

  // Keyboard navigation & controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex > 0) onNavigate(currentIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentIndex < items.length - 1) onNavigate(currentIndex + 1);
          break;
        case ' ':
          if (currentItem?.type === 'video') {
            e.preventDefault();
            togglePlay();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          setShowInfo((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length, currentItem]);

  if (!isOpen || !currentItem) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    videoRef.current.muted = newMute;
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleLoop = () => {
    const newLoop = !isLooping;
    setIsLooping(newLoop);
    if (videoRef.current) {
      videoRef.current.loop = newLoop;
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    if (bytes > 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const isFavorite = favorites.has(currentItem.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl transition-all">
      {/* Top Action Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        {/* Counter */}
        <div className="text-xs font-semibold text-white/70 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md">
          {currentIndex + 1} / {items.length}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Favorite Button */}
          <button
            onClick={() => onToggleFavorite(currentItem.id)}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
              isFavorite
                ? 'bg-amber-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Favorite"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Download Original Asset */}
          {currentItem.downloadUrl && (
            <a
              href={currentItem.downloadUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all"
              title="Download high-resolution file"
            >
              <Download className="w-4 h-4" />
            </a>
          )}

          {/* Info Drawer Toggle */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
              showInfo
                ? 'bg-apple-blue text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Toggle details & EXIF (I)"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all ml-2"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95"
          title="Previous (Arrow Left)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {currentIndex < items.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95"
          title="Next (Arrow Right)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Media Display Area: SCALED TO FIT WITH ZERO VERTICAL SCROLLING */}
      <div className="relative w-full h-full flex items-center justify-center p-6 md:p-12 overflow-hidden">
        {currentItem.type === 'video' ? (
          <div className="relative max-w-full max-h-[82vh] flex items-center justify-center">
            <video
              ref={videoRef}
              src={currentItem.url || ''}
              poster={currentItem.thumbnailUrl}
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                if (!isLooping) setIsPlaying(false);
              }}
              playsInline
              className={`max-h-[78vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl transition-all cursor-pointer ${
                currentItem.isVertical ? 'aspect-[9/16]' : ''
              }`}
            />

            {/* Big center play button overlay when paused */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute p-5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-110"
              >
                <Play className="w-8 h-8 fill-current translate-x-0.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative max-w-full max-h-[85vh] flex items-center justify-center select-none overflow-hidden">
            <img
              src={currentItem.url || currentItem.thumbnailUrl}
              alt={currentItem.caption || 'iCloud photo'}
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.2s ease-out',
              }}
              className="max-h-[82vh] max-w-[88vw] object-contain rounded-2xl shadow-2xl cursor-zoom-in"
              onClick={() => {
                setZoomLevel((prev) => (prev >= 2.5 ? 1 : prev + 0.75));
              }}
            />

            {/* Photo Zoom Controls Floating Pill */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs z-20">
              <button
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                disabled={zoomLevel <= 1}
                className="p-1 hover:text-apple-blue transition-colors disabled:opacity-40"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-medium">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
                disabled={zoomLevel >= 3}
                className="p-1 hover:text-apple-blue transition-colors disabled:opacity-40"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoomLevel > 1 && (
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 text-apple-gray-400 hover:text-white ml-1 transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Video Control Bar (Bottom for Videos) */}
      {currentItem.type === 'video' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-2xl px-5 py-3 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 text-white shadow-2xl flex flex-col gap-2">
          {/* Timeline Scrubber */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-white/70 w-9 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 accent-apple-blue h-1 bg-white/20 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] font-mono text-white/70 w-9">
              {formatTime(duration)}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            {/* Play/Pause & Volume */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 accent-apple-blue h-1 bg-white/20 rounded-lg cursor-pointer hidden sm:inline"
                />
              </div>
            </div>

            {/* Speed, Loop, Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Playback Speed Selector */}
              <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-xs font-semibold">
                {[0.5, 1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      playbackRate === rate
                        ? 'bg-apple-blue text-white shadow-xs'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Loop Toggle */}
              <button
                onClick={toggleLoop}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLooping
                    ? 'bg-apple-blue text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title={isLooping ? 'Disable Loop' : 'Enable Loop'}
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={handleToggleFullscreen}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Fullscreen (F)"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info / Metadata Drawer */}
      {showInfo && (
        <aside className="absolute right-0 top-0 bottom-0 z-30 w-80 bg-[#1c1c1e]/95 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col justify-between text-white animate-in slide-in-from-right duration-200">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="font-semibold text-sm">Media Information</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Caption */}
            {currentItem.caption && (
              <div>
                <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                  Caption
                </span>
                <p className="text-sm text-white/90 mt-1 font-normal">
                  {currentItem.caption}
                </p>
              </div>
            )}

            {/* Details list */}
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-apple-blue flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-white/50 block">Shared By</span>
                  <span className="font-medium text-white/90">
                    {currentItem.contributor}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-apple-blue flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-white/50 block">Date Added</span>
                  <span className="font-medium text-white/90">
                    {new Date(currentItem.dateCreated).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Smartphone className="w-4 h-4 text-apple-blue flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-white/50 block">Dimensions</span>
                  <span className="font-medium text-white/90">
                    {currentItem.width} × {currentItem.height} (
                    {currentItem.isVertical ? 'Portrait 9:16' : 'Landscape'}
                    )
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <HardDrive className="w-4 h-4 text-apple-blue flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-white/50 block">File Size</span>
                  <span className="font-medium text-white/90">
                    {formatFileSize(currentItem.fileSize)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Download in Drawer */}
          {currentItem.downloadUrl && (
            <a
              href={currentItem.downloadUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-apple-blue text-white text-xs font-semibold hover:bg-apple-blue-hover transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download High Resolution
            </a>
          )}
        </aside>
      )}
    </div>
  );
};
