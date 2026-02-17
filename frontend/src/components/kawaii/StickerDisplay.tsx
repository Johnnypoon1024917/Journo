import React from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Sticker } from '../../types/sticker';
import { useStickerStore } from '../../stores/stickerStore';
import stickerService from '../../services/stickerService';

interface StickerDisplayProps {
  elementId: string;
  elementType: 'day' | 'activity' | 'booking' | 'trip';
  tripId: string;
  editable?: boolean;
  className?: string;
}

/**
 * StickerDisplay Component
 * 
 * Displays stickers attached to a specific element (day, activity, booking, or trip).
 * Supports drag-to-reposition and remove functionality when editable.
 * Stickers are positioned absolutely within the parent container and can be dragged anywhere.
 */
export const StickerDisplay: React.FC<StickerDisplayProps> = ({
  elementId,
  elementType,
  tripId,
  editable = false,
  className = '',
}) => {
  const { stickers, placements, getElementPlacements, updatePlacement, removePlacement } =
    useStickerStore();
/*
  console.log('🎨 StickerDisplay render:', { 
    elementId, 
    elementType, 
    tripId, 
    editable,
    stickersCount: stickers.length,
    placementsCount: placements.length
  });
*/
  // Load placements when component mounts or when placements in store change
  React.useEffect(() => {
    // Map elementType to entityType
    const entityTypeMap: Record<string, 'place' | 'trip_day' | 'trip'> = {
      'activity': 'place',
      'day': 'trip_day',
      'booking': 'place',
      'trip': 'trip',
    };
    const entityType = entityTypeMap[elementType] || 'trip_day';
    
    console.log('🔄 Loading placements for:', { elementId, elementType, entityType });
    
    // Load placements for this specific element
    const loadElementPlacements = async () => {
      console.log('📡 Starting to fetch stickers from API...');
      console.log('📡 Entity type:', entityType, 'Element ID:', elementId);
      
      try {
        console.log('📡 About to call stickerService.getEntityStickers...');
        const elementPlacements = await stickerService.getEntityStickers(entityType, elementId);
        
        console.log('✅ Loaded sticker placements:', {
          elementId,
          count: elementPlacements.length,
          placements: elementPlacements
        });
        
        // Update store with these placements, removing old ones for this element first
        useStickerStore.setState((state) => {
          console.log('🔄 Updating store, current placements:', state.placements.length);
          
          // Remove existing placements for this element
          const otherPlacements = state.placements.filter(p => p.elementId !== elementId);
          
          // Add new placements, ensuring no duplicates by ID
          const newPlacements = [...otherPlacements];
          elementPlacements.forEach(placement => {
            if (!newPlacements.find(p => p.id === placement.id)) {
              newPlacements.push(placement);
            }
          });
          
          return {
            placements: newPlacements
          };
        });
        
        console.log('✅ Store updated with placements');
      } catch (error) {
        console.error('❌ ERROR loading element placements:', error);
        // Don't throw - just log and continue
      }
    };
    
    loadElementPlacements();
    
    // Cleanup function
    return () => {
      console.log('🛑 Cleaning up StickerDisplay');
    };
  }, [elementId, elementType, placements.length]); // Re-run when placements count changes

  const elementPlacements = getElementPlacements(elementId);
/*
  console.log('🎨 StickerDisplay placements:', { 
    elementId,
    placementsCount: elementPlacements.length,
    placements: elementPlacements 
  });
*/
  const getStickerById = (stickerId: string): Sticker | undefined => {
    // First try to find by ID
    const found = stickers.find((s) => s.id === stickerId);
    if (found) return found;
    
    // If not found and stickerId looks like an emoji, create a temporary sticker object
    // Check if it's a single character or a short string that could be an emoji
    if (stickerId && stickerId.length <= 4) {
      // More comprehensive emoji detection
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}\u{2615}\u{2618}\u{261D}\u{2620}\u{2622}\u{2623}\u{2626}\u{262A}\u{262E}\u{262F}\u{2638}-\u{263A}\u{2640}\u{2642}\u{2648}-\u{2653}\u{265F}\u{2660}\u{2663}\u{2665}\u{2666}\u{2668}\u{267B}\u{267E}\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}\u{269C}\u{26A0}\u{26A1}\u{26A7}\u{26AA}\u{26AB}\u{26B0}\u{26B1}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26C8}\u{26CE}\u{26CF}\u{26D1}\u{26D3}\u{26D4}\u{26E9}\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/u;
      
      if (emojiRegex.test(stickerId)) {
        return {
          id: stickerId,
          image: stickerId,
          category: 'emotions',
          tags: [],
          aiGenerated: false,
          created_at: new Date().toISOString(),
        };
      }
    }
    
    return undefined;
  };

  const handleDragEnd = async (
    placementId: string,
    info: any,
    currentPosition: { x: number; y: number }
  ) => {
    if (!editable) return;

    try {
      // Calculate new absolute position by adding the drag offset to current position
      const newPosition = {
        x: currentPosition.x + info.offset.x,
        y: currentPosition.y + info.offset.y,
      };

      console.log('🎯 Sticker drag ended:', {
        placementId,
        oldPosition: currentPosition,
        offset: info.offset,
        newPosition,
        elementId,
        elementType,
      });

      await updatePlacement(tripId, placementId, { position: newPosition });
      
      console.log('✅ Sticker position updated successfully');
    } catch (error) {
      console.error('❌ Error updating sticker position:', error);
    }
  };

  const handleRemove = async (placementId: string) => {
    if (!editable) return;

    try {
      await removePlacement(tripId, placementId);
    } catch (error) {
      console.error('Error removing sticker:', error);
    }
  };

  const handleResize = async (
    placementId: string,
    newScale: number
  ) => {
    if (!editable) return;

    try {
      // Clamp scale between 0.5 and 3
      const clampedScale = Math.max(0.5, Math.min(3, newScale));
      
      console.log('🔍 Sticker resize:', {
        placementId,
        newScale: clampedScale,
        elementId,
        elementType,
      });

      await updatePlacement(tripId, placementId, { scale: clampedScale });
      
      console.log('✅ Sticker scale updated successfully');
    } catch (error) {
      console.error('❌ Error updating sticker scale:', error);
    }
  };

  if (elementPlacements.length === 0) {
    // Still render container for debugging, just empty
    return (
      <div 
        className={`relative w-full h-full ${className}`}
        style={{ pointerEvents: 'none' }}
      >
        {/* Empty - waiting for stickers */}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`} style={{ zIndex: 50 }}>
      {elementPlacements.map((placement) => {
        const sticker = getStickerById(placement.stickerId);
        if (!sticker) return null;

        // Use stored scale
        const currentScale = placement.scale || 1;

        return (
          <motion.div
            key={placement.id}
            drag={editable}
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
            onDragEnd={(_event, info) =>
              handleDragEnd(placement.id, info, placement.position || { x: 0, y: 0 })
            }
            initial={{
              x: placement.position?.x || 0,
              y: placement.position?.y || 0,
              rotate: placement.rotation || 0,
              scale: currentScale,
            }}
            animate={{
              x: placement.position?.x || 0,
              y: placement.position?.y || 0,
              rotate: placement.rotation || 0,
              scale: currentScale,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            whileHover={editable ? { scale: currentScale * 1.05 } : {}}
            whileDrag={{ scale: currentScale * 1.1, zIndex: 60 }}
            className={`
              absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              ${editable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
            `}
            style={{
              touchAction: editable ? 'none' : 'auto',
              pointerEvents: 'auto',
              zIndex: 50,
            }}
          >
            {/* Sticker Image */}
            <div className="relative group">
              {/* Display emoji or custom image */}
              {sticker.image?.startsWith('http') ? (
                <img 
                  src={sticker.image} 
                  alt={sticker.name || 'Custom sticker'} 
                  className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg drop-shadow-lg select-none pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="text-4xl md:text-5xl drop-shadow-lg select-none pointer-events-none">
                  {sticker.image}
                </div>
              )}

              {/* Control buttons (only visible when editable and on hover) */}
              {editable && (
                <>
                  {/* Remove Button - stays same size regardless of sticker scale */}
                  <button
                    onClick={() => handleRemove(placement.id)}
                    className="
                      absolute -top-1 -right-1 
                      w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full 
                      bg-red-500 text-white 
                      flex items-center justify-center
                      opacity-0 group-hover:opacity-100
                      transition-opacity
                      shadow-md hover:shadow-lg
                      hover:bg-red-600
                      z-10
                    "
                    style={{
                      transform: `scale(${1 / currentScale})`,
                      transformOrigin: 'center'
                    }}
                    aria-label="Remove sticker"
                  >
                    <XMarkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                  </button>

                  {/* Resize Controls - Kawaii Style - stays same size regardless of sticker scale */}
                  <div 
                    className="absolute -bottom-8 sm:-bottom-9 md:-bottom-10 left-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      transform: `translateX(-50%) scale(${1 / currentScale})`,
                      transformOrigin: 'center top'
                    }}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-white dark:bg-gray-800 rounded-full shadow-lg px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 md:py-1.5 border border-kawaii-300 dark:border-kawaii-600">
                      {/* Decrease Size Button */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const currentScale = placement.scale || 1;
                          const newScale = Math.max(0.5, currentScale - 0.05);
                          await handleResize(placement.id, newScale);
                        }}
                        className="
                          w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full
                          bg-gradient-to-br from-pink-400 to-pink-500
                          dark:from-pink-500 dark:to-pink-600
                          text-white font-bold text-xs sm:text-sm md:text-base
                          flex items-center justify-center
                          hover:scale-110 active:scale-95
                          transition-transform
                          shadow-sm
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                        disabled={(placement.scale || 1) <= 0.5}
                        aria-label="Decrease size"
                      >
                        −
                      </button>

                      {/* Size Indicator */}
                      <div className="px-1 sm:px-1.5 md:px-2 text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[2rem] sm:min-w-[2.5rem] md:min-w-[3rem] text-center">
                        {Math.round(currentScale * 100)}%
                      </div>

                      {/* Increase Size Button */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const currentScale = placement.scale || 1;
                          const newScale = Math.min(3, currentScale + 0.05);
                          await handleResize(placement.id, newScale);
                        }}
                        className="
                          w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full
                          bg-gradient-to-br from-kawaii-400 to-kawaii-500
                          dark:from-kawaii-500 dark:to-kawaii-600
                          text-white font-bold text-xs sm:text-sm md:text-base
                          flex items-center justify-center
                          hover:scale-110 active:scale-95
                          transition-transform
                          shadow-sm
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                        disabled={(placement.scale || 1) >= 3}
                        aria-label="Increase size"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
