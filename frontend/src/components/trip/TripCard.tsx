import React, { useState, useEffect } from 'react';
import { Trip } from '../../types/trip';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../common/ConfirmModal';
import { tripService } from '../../services/tripService';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import { useToast } from '../../hooks/useToast';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Collaborator {
  id: string;
  user_id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TripCardProps {
  trip: Trip;
  onDelete?: (tripId: string) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onDelete }) => {
  const navigate = useNavigate();
  const { accessToken } = useEnhancedAuthStore();
  const { showSuccess, showError } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Fetch collaborators for the trip
  useEffect(() => {
    const fetchCollaborators = async () => {
      if (!accessToken) return;
      
      try {
        const response = await fetch(`/api/trips/${trip.id}/collaborators`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setCollaborators(data);
        }
      } catch (err) {
        console.error('Error fetching collaborators:', err);
      }
    };

    fetchCollaborators();
  }, [trip.id, accessToken]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDateRange = () => {
    if (!trip.start_date && !trip.end_date) return 'Dates not set';
    if (!trip.end_date) return `From ${formatDate(trip.start_date)}`;
    if (!trip.start_date) return `Until ${formatDate(trip.end_date)}`;
    return `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`;
  };

  const getDuration = () => {
    if (!trip.start_date || !trip.end_date) return null;
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  const getTripStatus = () => {
    if (!trip.start_date || !trip.end_date) return null;
    
    const now = new Date();
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    
    if (now < start) {
      return { label: 'Upcoming', color: 'bg-blue-500' };
    } else if (now >= start && now <= end) {
      return { label: 'In Progress', color: 'bg-green-500' };
    } else {
      return { label: 'Past', color: 'bg-gray-500' };
    }
  };

  const status = getTripStatus();

  const handleCardClick = () => {
    // Prevent navigation if trip is deleted or delete is in progress
    if (isDeleted || isDeleteModalOpen || isDeleting) {
      return;
    }
    navigate(`/trips/${trip.id}/schedule`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!accessToken) {
      showError('Authentication required', 'Please log in to delete trips');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await tripService.deleteTrip(trip.id, accessToken);
      
      if (response.success) {
        showSuccess('Trip deleted', 'Your trip has been deleted successfully');
        setIsDeleteModalOpen(false);
        
        // Add a smooth deletion animation
        setIsDeleted(true);
        
        // Wait for animation to complete before calling onDelete
        setTimeout(() => {
          if (onDelete) {
            onDelete(trip.id);
          }
        }, 500); // Match the animation duration
      } else {
        throw new Error(response.message || 'Failed to delete trip');
      }
    } catch (err: any) {
      console.error('Error deleting trip:', err);
      
      // Handle specific error cases
      if (err.status === 403) {
        showError('Permission denied', 'You do not have permission to delete this trip');
      } else if (err.status === 404) {
        showError('Trip not found', 'This trip could not be found');
      } else if (err.status === 401) {
        showError('Authentication required', 'Please log in again');
      } else {
        showError('Delete failed', err.message || 'Failed to delete trip');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setIsDeleted(false);
  };

  const handleShareTrip = async () => {
    try {
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: trip.title,
          text: `Check out my trip to ${trip.destination || 'this destination'}!`,
          url: `${window.location.origin}/trips/${trip.id}`,
        });
        showSuccess('Shared!', 'Trip shared successfully');
      } else {
        // Fallback: Copy link to clipboard
        const url = `${window.location.origin}/trips/${trip.id}`;
        await navigator.clipboard.writeText(url);
        showSuccess('Link copied!', 'Trip link copied to clipboard');
      }
    } catch (err: any) {
      // User cancelled share or error occurred
      if (err.name !== 'AbortError') {
        console.error('Error sharing trip:', err);
        showError('Share failed', 'Could not share trip');
      }
    }
  };

  const handleDuplicateTrip = async () => {
    if (!accessToken) {
      showError('Authentication required', 'Please log in to duplicate trips');
      return;
    }

    try {
      const response = await fetch(`/api/trips/${trip.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const duplicatedTrip = await response.json();
        showSuccess('Trip duplicated!', 'Your trip has been duplicated successfully');
        // Navigate to the duplicated trip
        navigate(`/trips/${duplicatedTrip.id}/schedule`);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to duplicate trip');
      }
    } catch (err: any) {
      console.error('Error duplicating trip:', err);
      showError('Duplicate failed', err.message || 'Failed to duplicate trip');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-500 overflow-hidden cursor-grab active:cursor-grabbing ${
        isDeleted 
          ? 'opacity-0 scale-95 transform translate-y-2 pointer-events-none' 
          : isDeleting 
            ? 'opacity-60 scale-98' 
            : ''
      } ${isDragging ? 'z-50 shadow-2xl' : ''}`}
    >
      {/* Cover Image */}
      <div className="relative h-72 bg-gray-100 overflow-hidden">
        {/* Deletion overlay */}
        {isDeleting && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
            <div className="bg-white/90 rounded-full p-3">
              <svg className="w-6 h-6 animate-spin text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        )}
        
        {trip.cover_image_url ? (
          <>
            <img
              src={trip.cover_image_url}
              alt={trip.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
            <div className="text-center">
              <svg
                className="w-20 h-20 text-indigo-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-sm text-indigo-400 font-medium">Add a cover photo</p>
            </div>
          </div>
        )}
        
        {/* Status badge and theme badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {status && (
            <span className={`${status.color} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}>
              {status.label}
            </span>
          )}
          {trip.theme && trip.theme !== 'default' && (
            <span className="bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full capitalize shadow-lg">
              {trip.theme}
            </span>
          )}
          {trip.is_community && (
            <span className="bg-purple-600/80 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
              Community
            </span>
          )}
          {!trip.is_public && (
            <span className="bg-gray-800/80 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
              Private
            </span>
          )}
        </div>

        {/* Collaborator avatars */}
        {collaborators.length > 0 && (
          <div className="absolute bottom-4 left-4 flex -space-x-2">
            {collaborators.slice(0, 4).map((collab, index) => {
              const userName = collab.user?.name || collab.user?.email || 'User';
              const initial = userName.charAt(0).toUpperCase();
              
              return (
                <div
                  key={collab.id}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg"
                  title={userName}
                  style={{ zIndex: collaborators.length - index }}
                >
                  {initial}
                </div>
              );
            })}
            {collaborators.length > 4 && (
              <div
                className="w-8 h-8 rounded-full bg-gray-800 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg"
                title={`+${collaborators.length - 4} more`}
              >
                +{collaborators.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Delete button */}
        {onDelete && !isDeleted && (
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className={`absolute top-4 right-4 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-red-600 transition-all duration-200 shadow-lg ${
              isDeleting 
                ? 'opacity-50 cursor-not-allowed' 
                : 'opacity-0 group-hover:opacity-100 hover:scale-110'
            }`}
            title="Delete trip"
          >
            {isDeleting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-7">
        {/* Destination */}
        {trip.destination && (
          <div className="flex items-center text-gray-500 mb-3">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-sm font-semibold">{trip.destination}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-2 leading-tight">
          {trip.title}
        </h3>

        {/* Dates and Duration - Pill Badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          {trip.start_date && trip.end_date && (
            <div className="inline-flex items-center bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 text-sm font-bold px-4 py-2 rounded-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{getDateRange()}</span>
            </div>
          )}
          {getDuration() && (
            <div className="inline-flex items-center bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 text-pink-700 text-sm font-bold px-4 py-2 rounded-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{getDuration()}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{trip.views_count}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{trip.likes_count}</span>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/trip/${trip.id}/bubblequest`);
            }}
            className="flex items-center gap-1 text-xs font-medium text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-full transition-colors"
            title="View in BubbleQuest style"
          >
            <span>🌸</span>
            <span>BubbleQuest</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100 mt-4">
          {/* Edit Action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/trips/${trip.id}/edit`);
            }}
            className="group/action relative flex items-center justify-center w-11 h-11 rounded-full bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-all duration-200 hover:scale-110"
            title="Edit trip"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            {/* Tooltip */}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/action:opacity-100 transition-opacity duration-200 pointer-events-none">
              Edit
            </span>
          </button>

          {/* Share Action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShareTrip();
            }}
            className="group/action relative flex items-center justify-center w-11 h-11 rounded-full bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 transition-all duration-200 hover:scale-110"
            title="Share trip"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            {/* Tooltip */}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/action:opacity-100 transition-opacity duration-200 pointer-events-none">
              Share
            </span>
          </button>

          {/* Duplicate Action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicateTrip();
            }}
            className="group/action relative flex items-center justify-center w-11 h-11 rounded-full bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all duration-200 hover:scale-110"
            title="Duplicate trip"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {/* Tooltip */}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/action:opacity-100 transition-opacity duration-200 pointer-events-none">
              Duplicate
            </span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Trip"
        message={`Are you sure you want to delete "${trip.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
