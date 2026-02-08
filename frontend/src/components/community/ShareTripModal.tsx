import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Trip } from '../../types/trip';
import { tripService } from '../../services/tripService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

interface ShareTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onTripUpdate?: (updatedTrip: Trip) => void;
}

export function ShareTripModal({ isOpen, onClose, trip, onTripUpdate }: ShareTripModalProps) {
  const { success, error } = useToast();
  const { accessToken } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    isPublic: trip.is_public || false,
    isCommunity: trip.is_community || false
  });

  const shareUrl = `${window.location.origin}/t/${trip.share_token}`;

  const handleUpdateSettings = async () => {
    if (!accessToken) {
      error('Please login to update settings');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await tripService.updateTrip(trip.id, {
        is_public: shareSettings.isPublic,
        is_community: shareSettings.isCommunity
      }, accessToken);
      
      onTripUpdate?.(response.data);
      success('Sharing settings updated!');
      onClose();
    } catch (err: any) {
      error('Failed to update sharing settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success('Link copied to clipboard!');
    } catch (err) {
      error('Failed to copy link');
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Check out my travel plan: ${trip.title} - ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Travel Plan: ${trip.title}`;
    const body = `Hi!\n\nI wanted to share my travel plan with you: ${trip.title}\n\nYou can view it here: ${shareUrl}\n\nHappy travels!`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Your Trip">
      <div className="space-y-6">
        {/* Sharing Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Sharing Settings</h3>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={shareSettings.isPublic}
                onChange={(e) => setShareSettings(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Make trip public</span>
                <p className="text-xs text-gray-500">Anyone with the link can view your trip</p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={shareSettings.isCommunity}
                onChange={(e) => setShareSettings(prev => ({ ...prev, isCommunity: e.target.checked }))}
                disabled={!shareSettings.isPublic}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Share in community</span>
                <p className="text-xs text-gray-500">Show your trip in the community travel stories</p>
              </div>
            </label>
          </div>

          <Button
            onClick={handleUpdateSettings}
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? 'Updating...' : 'Update Settings'}
          </Button>
        </div>

        {/* Share Link */}
        {shareSettings.isPublic && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Share Link</h3>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(shareUrl)}
                className="px-4 py-2"
              >
                Copy
              </Button>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={shareViaWhatsApp}
                className="flex items-center justify-center space-x-2"
              >
                <span className="text-green-600">📱</span>
                <span>WhatsApp</span>
              </Button>
              
              <Button
                variant="secondary"
                onClick={shareViaEmail}
                className="flex items-center justify-center space-x-2"
              >
                <span className="text-blue-600">✉️</span>
                <span>Email</span>
              </Button>
            </div>
          </div>
        )}

        {/* QR Code Section */}
        {shareSettings.isPublic && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
            <div className="flex flex-col items-center space-y-3">
              <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(shareUrl)}`}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(shareUrl)}`;
                  const link = document.createElement('a');
                  link.href = qrUrl;
                  link.download = `${trip.title}-qr-code.png`;
                  link.click();
                }}
                className="text-sm"
              >
                Download QR Code
              </Button>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900">Privacy Notice</h4>
              <p className="text-xs text-blue-700 mt-1">
                When you make your trip public, anyone with the link can view your itinerary, photos, and notes. 
                Community trips are visible to all users on the platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}