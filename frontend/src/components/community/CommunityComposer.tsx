/**
 * CommunityComposer - Modal for creating new posts
 * 
 * Features:
 * - Text input with character count (500 max)
 * - Trip selector dropdown
 * - Media upload with preview (4 max)
 * - Tag autocomplete
 * - Community selector
 * - Support for pre-populated trip embed (for trip publishing)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useCommunityStore } from '@/stores/communityStore';
import { useAuth } from '@/hooks/useAuth';
import CommunityService from '@/services/communityService';
import type { Post, Community } from '@/types/community';
import type { Trip } from '@/types/trip';

interface CommunityComposerProps {
  isOpen: boolean;
  onClose: () => void;
  parentPost?: Post; // For replies
  initialCommunity?: string;
  initialTrip?: Trip; // Pre-populated trip for trip publishing
  initialContent?: string; // Pre-populated content
}

export const CommunityComposer: React.FC<CommunityComposerProps> = ({
  isOpen,
  onClose,
  parentPost,
  initialCommunity,
  initialTrip,
  initialContent = '',
}) => {
  const { user } = useAuth();
  const { createPost } = useCommunityStore();
  
  // Form state
  const [content, setContent] = useState(initialContent);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | undefined>(initialCommunity);
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(initialTrip?.id);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Character limit
  const MAX_CHARS = 500;
  const MAX_MEDIA = 4;
  
  // Load user communities and trips on mount
  useEffect(() => {
    if (isOpen && user) {
      loadUserData();
    }
  }, [isOpen, user]);
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setSelectedCommunityId(initialCommunity);
      setSelectedTripId(initialTrip?.id);
      setMediaUrls([]);
      setError(null);
      
      // Focus textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialContent, initialCommunity, initialTrip]);
  
  const loadUserData = async () => {
    try {
      // Load user's communities
      const communities = await CommunityService.getUserCommunities();
      setUserCommunities(Array.isArray(communities) ? communities : []);
      
      // Load user's trips (would need to implement this in trip service)
      // For now, we'll leave it empty
      setUserTrips([]);
    } catch (err) {
      console.error('Failed to load user data:', err);
      // Set empty arrays on error
      setUserCommunities([]);
      setUserTrips([]);
    }
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    
    // Enforce character limit
    if (newContent.length <= MAX_CHARS) {
      setContent(newContent);
      
      // Extract hashtags for tag suggestions
      const words = newContent.split(/\s+/);
      const lastWord = words[words.length - 1];
      
      if (lastWord.startsWith('#') && lastWord.length > 1) {
        // Show tag suggestions (would need to implement search)
        setShowTagSuggestions(true);
        // For now, just show some example tags
        setTagSuggestions(['#travel', '#adventure', '#foodie', '#wanderlust']);
      } else {
        setShowTagSuggestions(false);
      }
    }
  };
  
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Check media limit
    if (mediaUrls.length + files.length > MAX_MEDIA) {
      setError(`You can only upload up to ${MAX_MEDIA} media files`);
      return;
    }
    
    // Upload files (would need to implement media upload service)
    // For now, just create object URLs for preview
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      newUrls.push(url);
    }
    
    setMediaUrls([...mediaUrls, ...newUrls]);
    setError(null);
  };
  
  const handleRemoveMedia = (index: number) => {
    const newUrls = [...mediaUrls];
    newUrls.splice(index, 1);
    setMediaUrls(newUrls);
  };
  
  const handleSubmit = async () => {
    if (!content.trim() && mediaUrls.length === 0) {
      setError('Please add some content or media');
      return;
    }
    
    if (content.length > MAX_CHARS) {
      setError(`Content must be ${MAX_CHARS} characters or less`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Extract hashtags from content
      const hashtagRegex = /#(\w+)/g;
      const extractedTags = [...content.matchAll(hashtagRegex)].map(match => match[1]);
      
      const postData = {
        content: content.trim(),
        communityId: selectedCommunityId,
        parentId: parentPost?.id,
        tripId: selectedTripId,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        tags: extractedTags.length > 0 ? extractedTags : undefined,
      };
      
      await createPost(postData);
      
      // Close modal and reset form
      onClose();
      setContent('');
      setSelectedCommunityId(undefined);
      setSelectedTripId(undefined);
      setMediaUrls([]);
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const remainingChars = MAX_CHARS - content.length;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars <= 50 && remainingChars >= 0;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={parentPost ? 'Reply to Post' : 'Create Post'}
      size="lg"
    >
      <div className="space-y-4">
        {/* Parent post preview (for replies) */}
        {parentPost && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Replying to <span className="font-semibold">{parentPost.userId}</span>
            </p>
            <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
              {parentPost.content}
            </p>
          </div>
        )}
        
        {/* Initial trip preview (for trip publishing) */}
        {initialTrip && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              {initialTrip.cover_image_url && (
                <img
                  src={initialTrip.cover_image_url}
                  alt={initialTrip.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {initialTrip.title}
                </p>
                {initialTrip.destination && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {initialTrip.destination}
                  </p>
                )}
                {initialTrip.start_date && initialTrip.end_date && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(initialTrip.start_date).toLocaleDateString()} - {new Date(initialTrip.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Text input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder={parentPost ? "Write your reply..." : "What's on your mind?"}
            className={`w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
              isOverLimit ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={6}
            aria-label="Post content"
            aria-describedby="char-count"
          />
          
          {/* Character count */}
          <div
            id="char-count"
            className={`absolute bottom-2 right-2 text-sm ${
              isOverLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-400'
            }`}
            aria-live="polite"
          >
            {remainingChars}
          </div>
          
          {/* Tag suggestions */}
          {showTagSuggestions && tagSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
              {tagSuggestions.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const words = content.split(/\s+/);
                    words[words.length - 1] = tag;
                    setContent(words.join(' ') + ' ');
                    setShowTagSuggestions(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Media preview */}
        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {mediaUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleRemoveMedia(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Selectors row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Community selector */}
          {!parentPost && (
            <div>
              <label htmlFor="community-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Community (optional)
              </label>
              <select
                id="community-select"
                value={selectedCommunityId || ''}
                onChange={(e) => setSelectedCommunityId(e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">No community</option>
                {Array.isArray(userCommunities) && userCommunities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Trip selector */}
          {!initialTrip && (
            <div>
              <label htmlFor="trip-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trip (optional)
              </label>
              <select
                id="trip-select"
                value={selectedTripId || ''}
                onChange={(e) => setSelectedTripId(e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                disabled={userTrips.length === 0}
              >
                <option value="">No trip</option>
                {userTrips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {/* Media upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
              aria-label="Upload media"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={mediaUrls.length >= MAX_MEDIA}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Add media"
              title={`Add media (${mediaUrls.length}/${MAX_MEDIA})`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            <span className="text-xs text-gray-500">
              {mediaUrls.length}/{MAX_MEDIA} media
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isOverLimit || (!content.trim() && mediaUrls.length === 0)}
            >
              {isSubmitting ? 'Posting...' : parentPost ? 'Reply' : 'Post'}
            </Button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
