import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DraggableSticker } from '../molecules/DraggableSticker';
import { RecycleBin } from '../atoms/RecycleBin';
import { useStickerStore } from '../../../stores/stickerStore';
import stickerService from '../../../services/stickerService';
import { Sticker, StickerPlacement } from '../../../types/sticker';
import { useFABPosition, getFABStyle } from '../../../hooks/useFABPosition';
import { useLocation } from 'react-router-dom';
import { useDebouncedUpdate } from '../../../hooks/useDebouncedUpdate';

interface StickerCanvasProps {
  elementId: string;
  elementType: 'day' | 'activity' | 'booking' | 'trip';
  tripId: string;
  editable?: boolean;
  hasValues?: boolean;
  className?: string;
  onStickerDelete?: (placementId: string) => void;
  demoMode?: boolean; // Add demo mode flag
}

/**
 * StickerCanvas Component
 * 
 * Main container for managing draggable stickers with value controls.
 * Handles sticker placement, editing, and deletion with drag-to-trash.
 * 
 * Features:
 * - Multiple stickers per element
 * - Drag-to-reposition
 * - Long-press to edit values
 * - Drag-to-trash deletion with undo
 * - Recycle bin appears only when dragging
 */
export const StickerCanvas: React.FC<StickerCanvasProps> = ({
  elementId,
  elementType,
  tripId,
  editable = true,
  hasValues = false,
  className = '',
  onStickerDelete,
  demoMode = false,
}) => {
  const { stickers, placements, updatePlacement, removePlacement, getElementPlacements } = useStickerStore();
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [binActive, setBinActive] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<{ placement: StickerPlacement; sticker: Sticker } | null>(null);
  
  const location = useLocation();
  const hasBottomNav = location.pathname.includes('/trips/');
  
  // Get the actual FAB position for the recycle bin (index 2: below primary and secondary FABs)
  const recycleBinFABPosition = useFABPosition({ type: 'recycle', index: 2, hasBottomNav });

  // Debounced update for sticker changes (500ms delay with retry logic)
  const { scheduleUpdate: schedulePositionUpdate } = useDebouncedUpdate<{
    placementId: string;
    position: { x: number; y: number };
  }>(
    async ({ placementId, position }) => {
      await updatePlacement(tripId, placementId, { position });
    },
    {
      delay: 500,
      maxRetries: 3,
      onError: (error) => {
        console.error('Failed to update sticker position after retries:', error);
      },
    }
  );

  const { scheduleUpdate: scheduleScaleUpdate } = useDebouncedUpdate<{
    placementId: string;
    scale: number;
  }>(
    async ({ placementId, scale }) => {
      await updatePlacement(tripId, placementId, { scale });
    },
    {
      delay: 500,
      maxRetries: 3,
      onError: (error) => {
        console.error('Failed to update sticker scale after retries:', error);
      },
    }
  );

  const { scheduleUpdate: scheduleRotationUpdate } = useDebouncedUpdate<{
    placementId: string;
    rotation: number;
  }>(
    async ({ placementId, rotation }) => {
      await updatePlacement(tripId, placementId, { rotation });
    },
    {
      delay: 500,
      maxRetries: 3,
      onError: (error) => {
        console.error('Failed to update sticker rotation after retries:', error);
      },
    }
  );
  
  // Calculate the actual bin position from FAB style
  const getBinPosition = useCallback(() => {
    const style = getFABStyle(recycleBinFABPosition);
    // FAB style returns bottom and right positions
    // Convert to x, y coordinates (center of the bin)
    const right = typeof style.right === 'string' ? parseInt(style.right) : style.right || 20;
    const bottom = typeof style.bottom === 'string' ? parseInt(style.bottom) : style.bottom || 20;
    
    return {
      x: window.innerWidth - right - 40, // 40 is half of bin width (80px)
      y: window.innerHeight - bottom - 40, // 40 is half of bin height (80px)
    };
  }, [recycleBinFABPosition, hasBottomNav]);

  // Load placements for this specific element when component mounts
  React.useEffect(() => {
    if (demoMode) return; // Skip loading in demo mode

    const loadElementPlacements = async () => {
      try {
        const entityTypeMap: Record<string, 'place' | 'trip_day' | 'trip'> = {
          'activity': 'place',
          'day': 'trip_day',
          'booking': 'place',
          'trip': 'trip',
        };
        const entityType = entityTypeMap[elementType] || 'trip_day';
        
        console.log('🔄 StickerCanvas loading placements:', { elementId, elementType, entityType });
        
        const elementPlacements = await stickerService.getEntityStickers(entityType, elementId);
        
        console.log('✅ StickerCanvas loaded placements:', elementPlacements.length, elementPlacements);
        
        // Update store with these placements, merging with existing ones
        useStickerStore.setState((state) => {
          // Keep all existing placements
          const existingPlacements = [...state.placements];
          
          console.log('📋 Existing placements before update:', existingPlacements.map(p => ({
            id: p.id?.substring(0, 8) || 'no-id',
            elementId: p.elementId?.substring(0, 8) || 'no-elementId',
            stickerId: p.stickerId || 'no-stickerId'
          })));
          
          // Remove old placements for THIS element only (to avoid duplicates)
          const otherPlacements = existingPlacements.filter(p => p.elementId !== elementId);
          
          console.log('📋 Other placements (not this element):', otherPlacements.map(p => ({
            id: p.id?.substring(0, 8) || 'no-id',
            elementId: p.elementId?.substring(0, 8) || 'no-elementId',
            stickerId: p.stickerId || 'no-stickerId'
          })));
          
          console.log('📋 New placements for this element:', elementPlacements.map(p => ({
            id: p.id?.substring(0, 8) || 'no-id',
            elementId: p.elementId?.substring(0, 8) || 'no-elementId',
            stickerId: p.stickerId || 'no-stickerId'
          })));
          
          
          // Add new placements for this element
          const updatedPlacements = [...otherPlacements, ...elementPlacements];
          
          console.log('📊 Store update:', {
            before: existingPlacements.length,
            after: updatedPlacements.length,
            thisElement: elementPlacements.length,
            otherElements: otherPlacements.length,
            currentElementId: elementId?.substring(0, 8) || 'no-elementId'
          });
          
          return { placements: updatedPlacements };
        });
      } catch (error) {
        console.error('❌ Error loading element placements:', error);
      }
    };

    loadElementPlacements();
  }, [elementId, elementType, demoMode]);

  const elementPlacements = getElementPlacements(elementId);

  // Log for debugging
  React.useEffect(() => {
    console.log('🎨 StickerCanvas render:', {
      elementId,
      elementType,
      totalPlacements: placements.length,
      elementPlacements: elementPlacements.length,
      placements: elementPlacements,
    });
  }, [elementId, elementType, placements.length, elementPlacements]);

  const getStickerById = useCallback((stickerId: string): Sticker | undefined => {
    const found = stickers.find((s) => s.id === stickerId);
    if (found) return found;

    // Handle emoji stickers
    if (stickerId && stickerId.length <= 4) {
      return {
        id: stickerId,
        image: stickerId,
        category: 'emotions',
        tags: [],
        aiGenerated: false,
        created_at: new Date().toISOString(),
      };
    }

    return undefined;
  }, [stickers]);

  const handleDragStart = useCallback(() => {
    setIsDraggingAny(true);
  }, []);

  const handleDragMove = useCallback((position: { x: number; y: number }) => {
    const binPos = getBinPosition();
    
    // Calculate distance to bin
    const dx = position.x - binPos.x;
    const dy = position.y - binPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    setBinActive(distance < 150);
  }, [getBinPosition]);

  const handleDragEnd = useCallback(async (placementId: string, position: { x: number; y: number }) => {
    setIsDraggingAny(false);
    setBinActive(false);

    if (demoMode) {
      // Demo mode - update local state only
      useStickerStore.setState((state) => ({
        placements: state.placements.map((p) =>
          p.id === placementId ? { ...p, position } : p
        ),
      }));
    } else {
      // Real mode - optimistic update + debounced API call
      // 1. Optimistic: Update UI immediately
      useStickerStore.setState((state) => ({
        placements: state.placements.map((p) =>
          p.id === placementId ? { ...p, position } : p
        ),
      }));
      
      // 2. Debounced: Schedule backend update (500ms)
      schedulePositionUpdate(placementId, { placementId, position });
    }
  }, [demoMode, schedulePositionUpdate]);

  const handleDelete = useCallback(async (placementId: string) => {
    const placement = elementPlacements.find(p => p.id === placementId);
    if (!placement) return;

    const sticker = getStickerById(placement.stickerId);
    if (!sticker) return;

    // Store for undo
    setLastDeleted({ placement, sticker });
    setShowUndo(true);

    if (demoMode) {
      // Demo mode - remove from local state only
      useStickerStore.setState((state) => ({
        placements: state.placements.filter((p) => p.id !== placementId),
      }));
      onStickerDelete?.(placementId);
    } else {
      // Real mode - call API
      try {
        await removePlacement(tripId, placementId);
        onStickerDelete?.(placementId);
      } catch (error) {
        console.error('Error deleting sticker:', error);
      }
    }

    // Hide undo after 6 seconds
    setTimeout(() => {
      setShowUndo(false);
      setLastDeleted(null);
    }, 6000);

    setIsDraggingAny(false);
    setBinActive(false);
  }, [elementPlacements, getStickerById, removePlacement, tripId, onStickerDelete, demoMode]);

  const handleUndo = useCallback(() => {
    if (!lastDeleted) return;

    if (demoMode) {
      // Demo mode - restore to local state
      useStickerStore.setState((state) => ({
        placements: [...state.placements, lastDeleted.placement],
      }));
    } else {
      // Real mode - would need to re-attach via API
      console.log('Undo not yet implemented for live mode');
    }
    
    setShowUndo(false);
    setLastDeleted(null);
  }, [lastDeleted, demoMode]);

  const handleValueChange = useCallback(async (placementId: string, value: number) => {
    // Convert percentage (0-200%) to scale (0.5-2.0)
    const newScale = value / 100;
    
    if (demoMode) {
      // Demo mode - update local state with both value and scale
      useStickerStore.setState((state) => ({
        placements: state.placements.map((p) =>
          p.id === placementId ? { ...p, value, scale: newScale } : p
        ),
      }));
    } else {
      // Real mode - update scale via API
      try {
        await updatePlacement(tripId, placementId, { scale: newScale });
        //console.log('✅ Scale updated:', placementId, 'value:', value, 'scale:', newScale);
      } catch (error) {
        //console.error('❌ Error updating sticker scale:', error);
      }
    }
  }, [demoMode, tripId, updatePlacement]);

  const handleScaleChange = useCallback(async (placementId: string, scale: number) => {
    if (demoMode) {
      // Demo mode - update local state
      useStickerStore.setState((state) => ({
        placements: state.placements.map((p) =>
          p.id === placementId ? { ...p, scale } : p
        ),
      }));
    } else {
      // Real mode - optimistic update + debounced API call
      // 1. Optimistic: Update UI immediately
      useStickerStore.setState((state) => ({
        placements: state.placements.map((p) =>
          p.id === placementId ? { ...p, scale } : p
        ),
      }));
      
      // 2. Debounced: Schedule backend update (500ms)
      scheduleScaleUpdate(placementId, { placementId, scale });
    }
  }, [demoMode, scheduleScaleUpdate]);

  const handleRotationChange = useCallback(async (placementId: string, rotation: number) => {
    if (demoMode) {
      // Demo mode - update local state
      useStickerStore.setState((state) => ({
        placements: state.placements.map((p) =>
          p.id === placementId ? { ...p, rotation } : p
        ),
      }));
    } else {
      // Real mode - optimistic update + debounced API call
      // 1. Optimistic: Update UI immediately
      useStickerStore.setState((state) => ({
        placements: state.placements.map((p) =>
          p.id === placementId ? { ...p, rotation } : p
        ),
      }));
      
      // 2. Debounced: Schedule backend update (500ms)
      scheduleRotationUpdate(placementId, { placementId, rotation });
    }
  }, [demoMode, scheduleRotationUpdate]);

  const binPosition = getBinPosition();

  return (
    <div className={`relative w-full h-full pointer-events-none ${className}`}>
      {/* Stickers */}
      {elementPlacements.map((placement) => {
        const sticker = getStickerById(placement.stickerId);
        if (!sticker) return null;

        return (
          <DraggableSticker
            key={placement.id}
            sticker={sticker}
            placement={placement as any}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={(pos) => handleDragEnd(placement.id, pos)}
            onDelete={() => handleDelete(placement.id)}
            onValueChange={(value) => handleValueChange(placement.id, value)}
            onScaleChange={(scale) => handleScaleChange(placement.id, scale)}
            onRotationChange={(rotation) => handleRotationChange(placement.id, rotation)}
            editable={editable}
            hasValue={hasValues}
            binPosition={binPosition}
          />
        );
      })}

      {/* Recycle Bin */}
      <RecycleBin
        isActive={binActive}
        onDrop={() => {}}
        visible={isDraggingAny}
      />

      {/* Undo Toast */}
      <AnimatePresence>
        {showUndo && lastDeleted && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto"
          >
            <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
              <span className="text-sm font-medium">Sticker deleted</span>
              <button
                onClick={handleUndo}
                className="px-4 py-1 bg-pink-500 hover:bg-pink-600 rounded-full text-sm font-bold transition-colors"
              >
                UNDO
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
