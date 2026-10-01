import React, { useState } from 'react';
import { X, Cloud, Sparkles, Loader2, Info } from 'lucide-react';

interface AddAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (urlOrToken: string) => Promise<void>;
  onLoadDemo: () => void;
  isLoading: boolean;
  error: string | null;
}

export const AddAlbumModal: React.FC<AddAlbumModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onLoadDemo,
  isLoading,
  error,
}) => {
  const [urlOrToken, setUrlOrToken] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlOrToken.trim()) return;
    await onSubmit(urlOrToken.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] text-apple-gray-900 dark:text-white border border-black/10 dark:border-white/10 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-apple-gray-400 hover:text-apple-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-apple-blue/10 text-apple-blue">
            <Cloud className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Connect iCloud Album</h2>
            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
              Paste a shared album web link or token to view in enhanced mode
            </p>
          </div>
        </div>

        {/* Error notification if any */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-300 mb-1.5">
              Album Web Link or Token
            </label>
            <input
              type="text"
              placeholder="https://www.icloud.com/sharedalbum/#B1234567890ABCD"
              value={urlOrToken}
              onChange={(e) => setUrlOrToken(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all placeholder:text-apple-gray-400"
            />
          </div>

          {/* Quick Help Guide */}
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-apple-gray-700 dark:text-apple-gray-300">
              <Info className="w-3.5 h-3.5 text-apple-blue" />
              <span>How to get the link:</span>
            </div>
            <p>
              On your iPhone/Mac Photos app, open your Shared Album &gt; tap the People/Collaborate icon &gt; turn on <strong>Public Website</strong> &gt; tap <strong>Share Link</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isLoading || !urlOrToken.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-apple-blue hover:bg-apple-blue-hover active:scale-98 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to iCloud...</span>
                </>
              ) : (
                <span>Load Shared Album</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLoadDemo();
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-apple-gray-800 dark:text-apple-gray-200 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Try Demo</span>
            </button>
          </div>

          {isLoading && (
            <p className="text-[11px] text-center text-apple-gray-500 dark:text-apple-gray-400 animate-pulse pt-1">
              Fetching album streams from Apple. Large albums may take a moment to fetch on first load and are cached for instant access.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
