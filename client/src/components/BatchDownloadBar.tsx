import React, { useState } from 'react';
import { Download, X, CheckSquare, Loader2 } from 'lucide-react';
import { MediaItem } from '../types/media';

interface BatchDownloadBarProps {
  selectedItems: MediaItem[];
  totalFilteredCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  albumName: string;
}

export const BatchDownloadBar: React.FC<BatchDownloadBarProps> = ({
  selectedItems,
  totalFilteredCount,
  onSelectAll,
  onClearSelection,
  albumName,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (selectedItems.length === 0) return null;

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumName: albumName || 'icloud_album',
          items: selectedItems.map((item) => ({
            id: item.id,
            url: item.downloadUrl || item.url,
            type: item.type,
            caption: item.caption,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ZIP archive');
      }

      // Convert response to blob and trigger browser download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${albumName.replace(/[^a-zA-Z0-9_-]/g, '_')}_media.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Batch download error:', err);
      alert('Error downloading ZIP archive. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-apple-gray-900/90 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl text-white border border-white/10 shadow-2xl">
        <span className="text-xs font-semibold">
          {selectedItems.length} selected
        </span>

        <div className="h-4 w-px bg-white/20" />

        {selectedItems.length < totalFilteredCount && (
          <button
            onClick={onSelectAll}
            className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Select All ({totalFilteredCount})</span>
          </button>
        )}

        <button
          onClick={handleDownloadZip}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover active:scale-95 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Packaging ZIP...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </>
          )}
        </button>

        <button
          onClick={onClearSelection}
          className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-1"
          title="Clear Selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
