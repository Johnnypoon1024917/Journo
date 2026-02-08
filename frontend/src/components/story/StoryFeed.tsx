import { useState, useEffect } from 'react';
import { StoryItem as StoryItemType } from '../../types/story';
import { StoryItem } from './StoryItem';
import { PhotoUpload } from './PhotoUpload';
import { YouTubeEmbed } from './YouTubeEmbed';
import { NoteInput } from './NoteInput';
import { storyService } from '../../services/storyService';
import { useSocket } from '../../hooks/useSocket';

interface StoryFeedProps {
  tripId: string;
  canAdd?: boolean;
}

type AddMode = 'photo' | 'youtube' | 'note' | null;

export const StoryFeed = ({ tripId, canAdd = false }: StoryFeedProps) => {
  const [storyItems, setStoryItems] = useState<StoryItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [submitting, setSubmitting] = useState(false);

  // Setup real-time updates
  useSocket({
    tripId,
    onStoryAdded: (data) => {
      // Add new story item to the feed
      if (data.storyItem && data.tripId === tripId) {
        setStoryItems((prev) => [data.storyItem, ...prev]);
      }
    },
  });

  // Load story items
  useEffect(() => {
    loadStoryItems();
  }, [tripId]);

  const loadStoryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await storyService.getStoryItems(tripId);
      // Sort by created_at descending (newest first)
      const sortedItems = items.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setStoryItems(sortedItems);
    } catch (err) {
      console.error('Error loading story items:', err);
      setError('Failed to load story items');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUploaded = async (url: string, caption: string) => {
    try {
      setSubmitting(true);
      await storyService.createStoryItem({
        trip_id: tripId,
        type: 'photo',
        content_url: url,
        caption: caption || undefined,
      });
      setAddMode(null);
      // Real-time update will add the item to the feed
    } catch (err) {
      console.error('Error adding photo:', err);
      setError('Failed to add photo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVideoAdded = async (videoId: string, caption: string) => {
    try {
      setSubmitting(true);
      await storyService.createStoryItem({
        trip_id: tripId,
        type: 'youtube',
        content_url: videoId,
        caption: caption || undefined,
      });
      setAddMode(null);
      // Real-time update will add the item to the feed
    } catch (err) {
      console.error('Error adding video:', err);
      setError('Failed to add video');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoteAdded = async (note: string) => {
    try {
      setSubmitting(true);
      await storyService.createStoryItem({
        trip_id: tripId,
        type: 'note',
        caption: note,
      });
      setAddMode(null);
      // Real-time update will add the item to the feed
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story item?')) {
      return;
    }

    try {
      await storyService.deleteStoryItem(storyId);
      setStoryItems((prev) => prev.filter((item) => item.id !== storyId));
    } catch (err) {
      console.error('Error deleting story item:', err);
      setError('Failed to delete story item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Journey Feed</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Share photos, videos, and notes from your trip
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {canAdd && !addMode && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Add to your journey:
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setAddMode('photo')}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <span className="text-xl">📷</span>
              <span className="font-medium">Photo</span>
            </button>
            <button
              onClick={() => setAddMode('youtube')}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <span className="text-xl">▶️</span>
              <span className="font-medium">Video</span>
            </button>
            <button
              onClick={() => setAddMode('note')}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              <span className="text-xl">📝</span>
              <span className="font-medium">Note</span>
            </button>
          </div>
        </div>
      )}

      {addMode === 'photo' && (
        <div className="mb-6">
          <PhotoUpload
            onPhotoUploaded={handlePhotoUploaded}
            onCancel={() => setAddMode(null)}
          />
        </div>
      )}

      {addMode === 'youtube' && (
        <div className="mb-6">
          <YouTubeEmbed
            onVideoAdded={handleVideoAdded}
            onCancel={() => setAddMode(null)}
          />
        </div>
      )}

      {addMode === 'note' && (
        <div className="mb-6">
          <NoteInput onNoteAdded={handleNoteAdded} onCancel={() => setAddMode(null)} />
        </div>
      )}

      {submitting && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400 flex items-center">
          <span className="animate-spin mr-2 text-xl">⏳</span>
          Adding to your journey...
        </div>
      )}

      {storyItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
            <span className="text-3xl">➕</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No story items yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {canAdd
              ? 'Start documenting your journey by adding photos, videos, or notes'
              : 'The trip owner hasn\'t added any story items yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {storyItems.map((item) => (
            <StoryItem
              key={item.id}
              item={item}
              onDelete={handleDelete}
              canDelete={canAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
};
