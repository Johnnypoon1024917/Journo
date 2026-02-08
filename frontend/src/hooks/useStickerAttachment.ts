import { useState, useCallback } from 'react';
import { useStickerStore } from '../stores/stickerStore';

interface UseStickerAttachmentProps {
  tripId: string;
  elementId: string;
  elementType: 'day' | 'activity' | 'booking';
}

interface UseStickerAttachmentReturn {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  handleStickerSelect: (stickerId: string) => Promise<void>;
  isAttaching: boolean;
  error: string | null;
}

/**
 * Hook for managing sticker attachment to elements
 * 
 * Provides modal state management and attachment logic
 */
export const useStickerAttachment = ({
  tripId,
  elementId,
  elementType,
}: UseStickerAttachmentProps): UseStickerAttachmentReturn => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { attachSticker } = useStickerStore();

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    setError(null);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setError(null);
  }, []);

  const handleStickerSelect = useCallback(
    async (stickerId: string) => {
      setIsAttaching(true);
      setError(null);

      try {
        // Default position (center of element)
        const position = { x: 50, y: 50 };

        await attachSticker(tripId, stickerId, elementId, elementType, position);
        
        closeModal();
      } catch (err) {
        console.error('Error attaching sticker:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to attach sticker. Please try again.';
        setError(errorMessage);
      } finally {
        setIsAttaching(false);
      }
    },
    [tripId, elementId, elementType, attachSticker, closeModal]
  );

  return {
    isModalOpen,
    openModal,
    closeModal,
    handleStickerSelect,
    isAttaching,
    error,
  };
};
