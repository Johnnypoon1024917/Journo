import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../hooks/useToast';
import { QRCodeModal } from './QRCodeModal';
import { useAnalytics } from '../../hooks/useAnalytics';
import { tripService } from '../../services/tripService';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareToken: string;
  tripTitle: string;
  tripId?: string;
  isPublic?: boolean;
  isCommunity?: boolean;
  onTripUpdate?: () => void;
}

export function ShareModal({ 
  isOpen, 
  onClose, 
  shareToken, 
  tripTitle, 
  tripId,
  isPublic = true,
  isCommunity = false,
  onTripUpdate
}: ShareModalProps) {
  const { success: showSuccess, error: showError } = useToast();
  const { trackTripShared } = useAnalytics();
  const { accessToken } = useEnhancedAuthStore();
  const [isCopying, setIsCopying] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    isPublic: isPublic,
    isCommunity: isCommunity
  });

  const shareUrl = `${window.location.origin}/t/${shareToken}`;

  const handleUpdateSettings = async () => {
    if (!tripId || !accessToken) return;
    
    setIsUpdating(true);
    try {
      await tripService.updateTrip(tripId, {
        is_public: shareSettings.isPublic,
        is_community: shareSettings.isCommunity
      }, accessToken);
      
      showSuccess('Sharing settings updated!');
      onTripUpdate?.();
    } catch (err: any) {
      console.error('Error updating sharing settings:', err);
      showError('Failed to update sharing settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(shareUrl);
      showSuccess('Link copied to clipboard!');
      
      // Track share event
      if (tripId) {
        trackTripShared(tripId, 'copy_link');
      }
    } catch (error) {
      console.error('Error copying link:', error);
      showError('Failed to copy link');
    } finally {
      setIsCopying(false);
    }
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`Check out my trip: ${tripTitle}\n${shareUrl}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    // Track share event
    if (tripId) {
      trackTripShared(tripId, 'whatsapp');
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out my trip: ${tripTitle}`);
    const body = encodeURIComponent(
      `I wanted to share my trip with you!\n\n${tripTitle}\n\nView it here: ${shareUrl}`
    );
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    
    // Track share event
    if (tripId) {
      trackTripShared(tripId, 'email');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Trip">
      <div className="space-y-6">
        {/* Sharing Settings */}
        {tripId && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sharing Settings</h3>
            
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareSettings.isPublic}
                  onChange={(e) => {
                    const newIsPublic = e.target.checked;
                    setShareSettings(prev => ({ 
                      ...prev, 
                      isPublic: newIsPublic,
                      // If making private, also disable community
                      isCommunity: newIsPublic ? prev.isCommunity : false
                    }));
                  }}
                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Make trip public</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Anyone with the link can view your trip</p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareSettings.isCommunity}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, isCommunity: e.target.checked }))}
                  disabled={!shareSettings.isPublic}
                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <span className={`text-sm font-medium ${shareSettings.isPublic ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    Publish to community
                  </span>
                  <p className={`text-xs mt-0.5 ${shareSettings.isPublic ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    Show your trip in the community travel blog
                  </p>
                </div>
              </label>
            </div>

            <Button
              onClick={handleUpdateSettings}
              disabled={isUpdating}
              variant="primary"
              className="w-full"
            >
              {isUpdating ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                'Update Settings'
              )}
            </Button>
          </div>
        )}

        {/* Share URL Display */}
        {shareSettings.isPublic && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Share Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={handleCopyLink}
                  disabled={isCopying}
                  variant="primary"
                  className="whitespace-nowrap"
                >
                  {isCopying ? (
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2 inline"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Sharing Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Share via
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* WhatsApp */}
                <button
                  onClick={handleWhatsAppShare}
                  className="flex flex-col items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6 mb-1 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    WhatsApp
                  </span>
                </button>

                {/* Email */}
                <button
                  onClick={handleEmailShare}
                  className="flex flex-col items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg
                    className="w-6 h-6 mb-1 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </span>
                </button>

                {/* QR Code */}
                <button
                  onClick={() => setIsQRCodeModalOpen(true)}
                  className="flex flex-col items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg
                    className="w-6 h-6 mb-1 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    QR Code
                  </span>
                </button>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Public Link</p>
                  <p>Anyone with this link can view your trip. {shareSettings.isCommunity && 'Your trip will also appear in the community travel blog.'}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {!shareSettings.isPublic && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex">
              <svg
                className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium mb-1">Private Trip</p>
                <p>This trip is private. Make it public to share with others.</p>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRCodeModalOpen}
        onClose={() => setIsQRCodeModalOpen(false)}
        shareToken={shareToken}
        tripTitle={tripTitle}
      />
    </Modal>
  );
}
