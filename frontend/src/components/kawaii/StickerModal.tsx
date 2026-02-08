import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { StickerCategory } from '../../types/sticker';
import { useStickerStore } from '../../stores/stickerStore';
import { StickerUpload } from './StickerUpload';

interface StickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (stickerId: string) => void;
  tripId: string;
}

const CATEGORIES: (StickerCategory | 'all')[] = [
  'all',
  'characters',
  'activities',
  'transportation',
  'food',
  'landmarks',
  'emotions',
  'weather',
  'seasonal',
];

export const StickerModal: React.FC<StickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  tripId,
}) => {
  const { t } = useTranslation('kawaii');
  const {
    selectedCategory,
    setCategory,
    selectedSticker,
    selectSticker,
    getFilteredStickers,
    loadStickers,
    deleteSticker,
    isLoading,
  } = useStickerStore();

  const [showUpload, setShowUpload] = React.useState(false);

  // Load stickers when modal opens
  React.useEffect(() => {
    if (isOpen && tripId) {
      loadStickers(tripId);
    }
  }, [isOpen, tripId, loadStickers]);

  const filteredStickers = getFilteredStickers();

  const handleStickerClick = (stickerId: string) => {
    selectSticker(stickerId);
  };

  const handleDeleteSticker = async (e: React.MouseEvent, stickerId: string) => {
    e.stopPropagation(); // Prevent selecting the sticker
    
    if (confirm('Are you sure you want to delete this sticker?')) {
      try {
        await deleteSticker(stickerId);
        // Reload stickers from server to ensure we have fresh data
        await loadStickers(tripId);
      } catch (error) {
        console.error('Failed to delete sticker:', error);
        alert('Failed to delete sticker. Please try again.');
      }
    }
  };

  const handleConfirm = () => {
    if (selectedSticker) {
      onSelect(selectedSticker);
      selectSticker(null);
      onClose();
    }
  };

  // Check if a sticker is custom (uploaded by user)
  const isCustomSticker = (sticker: any) => {
    return sticker.image?.startsWith('http') && !sticker.id.startsWith('emoji-') && !sticker.id.startsWith('default-');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal - Centered */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
              style={{ backgroundColor: 'var(--kawaii-cream)' }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {showUpload ? 'Upload Sticker' : t('stickers.selectSticker')}
              </h2>
              <div className="flex items-center gap-2">
                {showUpload ? (
                  <button
                    onClick={() => setShowUpload(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    ← Back
                  </button>
                ) : (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="px-4 py-2 bg-kawaii-500 text-white rounded-full hover:bg-kawaii-600 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    Upload
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label={t('actions.close', { ns: 'common' })}
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Category Tabs - Only show when not in upload mode */}
            {!showUpload && (
              <div className="flex overflow-x-auto px-6 py-4 border-b border-gray-200 dark:border-gray-700 gap-2 scrollbar-hide">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategory(category)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                      ${
                        selectedCategory === category
                          ? 'bg-primary text-white shadow-md scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {t(`stickers.categories.${category}`)}
                  </button>
                ))}
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {showUpload ? (
                /* Upload UI */
                <StickerUpload
                  onUploadSuccess={() => {
                    setShowUpload(false);
                    loadStickers(tripId);
                  }}
                />
              ) : (
                /* Sticker Grid */
                isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
                  </div>
                ) : filteredStickers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <p className="text-lg font-medium">
                      {t('stickers.noStickers', { ns: 'common', defaultValue: 'No stickers available' })}
                    </p>
                    <p className="text-sm mt-2">
                      {t('stickers.tryDifferentCategory', { ns: 'common', defaultValue: 'Try selecting a different category' })}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                    {filteredStickers.map((sticker) => (
                      <motion.div
                        key={sticker.id}
                        className="relative group"
                        whileHover={{ scale: 1.05 }}
                      >
                        <motion.button
                          onClick={() => handleStickerClick(sticker.id)}
                          whileTap={{ scale: 0.95 }}
                          className={`
                            w-full aspect-square rounded-2xl flex items-center justify-center
                            transition-all cursor-pointer overflow-hidden
                            ${
                              selectedSticker === sticker.id
                                ? 'bg-primary/20 ring-4 ring-primary shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }
                          `}
                        >
                          {/* Display emoji or image */}
                          {sticker.image?.startsWith('http') ? (
                            <img 
                              src={sticker.image} 
                              alt={sticker.name || 'Custom sticker'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-4xl">{sticker.image}</span>
                          )}
                        </motion.button>
                        
                        {/* Delete button for custom stickers - shows on hover */}
                        {isCustomSticker(sticker) && (
                          <button
                            onClick={(e) => handleDeleteSticker(e, sticker.id)}
                            className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
                            aria-label="Delete sticker"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Footer - Only show when not in upload mode */}
            {!showUpload && (
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('actions.cancel', { ns: 'common' })}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedSticker}
                  className={`
                    px-6 py-3 rounded-full font-medium transition-all
                    ${
                      selectedSticker
                        ? 'bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {t('stickers.attach')}
                </button>
              </div>
            )}
            
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
