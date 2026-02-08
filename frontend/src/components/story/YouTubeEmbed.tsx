import { useState } from 'react';
import { storyService } from '../../services/storyService';

interface YouTubeEmbedProps {
  onVideoAdded: (videoId: string, caption: string) => void;
  onCancel: () => void;
}

export const YouTubeEmbed = ({ onVideoAdded, onCancel }: YouTubeEmbedProps) => {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    setError(null);

    // Try to extract video ID
    const extractedId = storyService.extractYouTubeId(inputUrl);
    if (extractedId) {
      setVideoId(extractedId);
    } else if (inputUrl.length > 0) {
      setVideoId(null);
    }
  };

  const handleAdd = () => {
    if (!videoId) {
      setError('Please enter a valid YouTube URL or video ID');
      return;
    }

    onVideoAdded(videoId, caption);
    
    // Reset form
    setUrl('');
    setCaption('');
    setVideoId(null);
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2 text-xl">▶️</span>
          Add YouTube Video
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="youtube-url"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          YouTube URL or Video ID
        </label>
        <input
          id="youtube-url"
          type="text"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://www.youtube.com/watch?v=... or video ID"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Paste a YouTube URL or just the video ID
        </p>
      </div>

      {videoId && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video preview"
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="video-caption"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Caption (optional)
        </label>
        <textarea
          id="video-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption to your video..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          rows={3}
          maxLength={500}
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
          {caption.length}/500
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={!videoId}
          className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          Add Video
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
