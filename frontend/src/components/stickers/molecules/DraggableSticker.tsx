import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Sticker, StickerPlacement } from '../../../types/sticker';
import { ValueControl } from '../atoms/ValueControl';
import { TouchGestureRecognizer, TouchPoint } from '../../../utils/TouchGestureRecognizer';
import { hapticsService } from '../../../services/hapticsService';

interface DraggableStickerProps {
  sticker: Sticker;
  placement: StickerPlacement & { value?: number };
  onDragEnd: (position: { x: number; y: number }) => void;
  onDelete: () => void;
  onValueChange?: (value: number) => void;
  onDragStart?: () => void;
  onDragMove?: (position: { x: number; y: number }) => void;
  onScaleChange?: (scale: number) => void;
  onRotationChange?: (rotation: number) => void;
  editable?: boolean;
  hasValue?: boolean;
  binPosition?: { x: number; y: number };
}

/**
 * DraggableSticker Component
 * 
 * Individual sticker with drag, edit, and delete capabilities.
 * 
 * Features:
 * - Long-press to enter edit mode (scale + wobble)
 * - Drag to reposition
 * - Pinch to resize (50px-300px constraints)
 * - Two-finger rotation
 * - Value control appears when editing
 * - Drag to recycle bin to delete
 * - Smooth animations and haptic feedback
 * - 60fps drag performance
 */
export const DraggableSticker: React.FC<DraggableStickerProps> = ({
  sticker,
  placement,
  onDragEnd,
  onDelete,
  onValueChange,
  onDragStart,
  onDragMove,
  onScaleChange,
  onRotationChange,
  editable = true,
  hasValue = false,
  binPosition,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showValueControl, setShowValueControl] = useState(false);
  const [controlPosition, setControlPosition] = useState({ x: 0, y: 0 });
  const [currentScale, setCurrentScale] = useState(placement.scale || 1);
  const [currentRotation, setCurrentRotation] = useState(placement.rotation || 0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const stickerRef = useRef<HTMLDivElement>(null);
  const gestureRecognizer = useRef(new TouchGestureRecognizer());
  const initialPinchScale = useRef(1);
  const initialRotation = useRef(0);
  const isGesturing = useRef(false);

  const x = useMotionValue(placement.position.x);
  const y = useMotionValue(placement.position.y);

  // Sync scale and rotation with placement changes
  useEffect(() => {
    setCurrentScale(placement.scale || 1);
    setCurrentRotation(placement.rotation || 0);
  }, [placement.scale, placement.rotation]);

  // Update control position when sticker moves or editing starts
  useEffect(() => {
    if (isEditing && stickerRef.current) {
      const rect = stickerRef.current.getBoundingClientRect();
      setControlPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 20,
      });
    }
  }, [isEditing, placement.position]);

  // Calculate distance to bin for deletion detection
  const distanceToBin = useTransform([x, y], ([xVal, yVal]) => {
    if (!binPosition) return Infinity;
    const dx = xVal - binPosition.x;
    const dy = yVal - binPosition.y;
    return Math.sqrt(dx * dx + dy * dy);
  });

  const isNearBin = useTransform(distanceToBin, (d) => d < 100);

  // Long press handler with haptic feedback
  const handlePressStart = () => {
    if (!editable) return;
    
    longPressTimer.current = setTimeout(() => {
      setIsEditing(true);
      setShowValueControl(hasValue);
      
      // Haptic feedback for edit mode
      hapticsService.stickerEditMode();
    }, 400);
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Touch event handlers for gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!editable) return;
    
    const touches: TouchPoint[] = Array.from(e.touches).map(t => ({
      identifier: t.identifier,
      clientX: t.clientX,
      clientY: t.clientY,
      force: t.force,
      radiusX: t.radiusX,
      radiusY: t.radiusY,
    }));
    
    gestureRecognizer.current.onTouchStart(touches);
    
    // Start long press timer for single touch
    if (touches.length === 1) {
      gestureRecognizer.current.startLongPressTimer(() => {
        setIsEditing(true);
        setShowValueControl(hasValue);
        hapticsService.stickerEditMode();
      });
    } else if (touches.length === 2) {
      // Two-finger gesture - prepare for pinch/rotate
      gestureRecognizer.current.clearLongPressTimer();
      isGesturing.current = true;
      initialPinchScale.current = currentScale;
      initialRotation.current = currentRotation;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!editable) return;
    
    const touches: TouchPoint[] = Array.from(e.touches).map(t => ({
      identifier: t.identifier,
      clientX: t.clientX,
      clientY: t.clientY,
      force: t.force,
      radiusX: t.radiusX,
      radiusY: t.radiusY,
    }));
    
    gestureRecognizer.current.onTouchMove(touches);
    
    // Handle pinch gesture
    if (touches.length === 2) {
      const pinchResult = gestureRecognizer.current.recognizePinch();
      if (pinchResult) {
        // Apply scale with constraints (50px-300px)
        const baseSize = 80; // Base sticker size in pixels
        let newScale = initialPinchScale.current * pinchResult.scale;
        
        // Constrain scale based on size limits
        const minScale = 50 / baseSize; // ~0.625
        const maxScale = 300 / baseSize; // ~3.75
        newScale = Math.max(minScale, Math.min(maxScale, newScale));
        
        setCurrentScale(newScale);
        onScaleChange?.(newScale);
      }
      
      // Handle rotation gesture
      const rotationResult = gestureRecognizer.current.recognizeRotation();
      if (rotationResult) {
        const newRotation = initialRotation.current + rotationResult.angle;
        setCurrentRotation(newRotation);
        onRotationChange?.(newRotation);
      }
    }
  };

  const handleTouchEnd = () => {
    gestureRecognizer.current.onTouchEnd();
    gestureRecognizer.current.clearLongPressTimer();
    isGesturing.current = false;
  };

  const handleTouchCancel = () => {
    gestureRecognizer.current.onTouchCancel();
    isGesturing.current = false;
  };

  // Click outside to dismiss edit mode
  const handleClickOutside = useCallback(() => {
    setIsEditing(false);
    setShowValueControl(false);
  }, []);

  useEffect(() => {
    if (isEditing && !isDragging) {
      // Auto-dismiss after 15 seconds
      const timer = setTimeout(() => {
        handleClickOutside();
      }, 15000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isEditing, isDragging, handleClickOutside]);

  const handleDragStart = () => {
    setIsDragging(true);
    setShowValueControl(false);
    dragStartPos.current = { x: x.get(), y: y.get() };
    onDragStart?.();
    handlePressEnd();
    
    // Haptic feedback for drag start
    hapticsService.stickerDragStart();
  };

  const handleDrag = (_: any, info: PanInfo) => {
    const newX = dragStartPos.current.x + info.offset.x;
    const newY = dragStartPos.current.y + info.offset.y;
    onDragMove?.({ x: newX, y: newY });
  };

  const handleDragEndInternal = (_: any, info: PanInfo) => {
    setIsDragging(false);
    
    const finalX = dragStartPos.current.x + info.offset.x;
    const finalY = dragStartPos.current.y + info.offset.y;

    // Check if dropped on bin using screen coordinates
    if (binPosition && stickerRef.current) {
      const rect = stickerRef.current.getBoundingClientRect();
      const stickerScreenX = rect.left + rect.width / 2;
      const stickerScreenY = rect.top + rect.height / 2;
      
      // Use the provided bin position (which comes from FAB positioning)
      const binScreenX = binPosition.x;
      const binScreenY = binPosition.y;
      
      const dx = stickerScreenX - binScreenX;
      const dy = stickerScreenY - binScreenY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      console.log('🗑️ Drop check:', { 
        stickerScreenX, 
        stickerScreenY, 
        binScreenX, 
        binScreenY, 
        distance,
        threshold: 100 
      });
      
      if (distance < 100) {
        console.log('✅ Deleting sticker - dropped on bin!');
        // Haptic feedback for delete
        hapticsService.stickerDelete();
        onDelete();
        return;
      } else {
        console.log('❌ Not close enough to bin, distance:', distance);
      }
    } else {
      console.log('⚠️ No bin position or sticker ref');
    }

    // Update position
    onDragEnd({ x: finalX, y: finalY });
  };

  const handleValueChange = (newValue: number) => {
    // Convert percentage (0-200%) to scale (0.5-2.0)
    const newScale = newValue / 100;
    onValueChange?.(newValue);
    
    // Also update the scale immediately for visual feedback
    if (placement.scale !== newScale) {
      // This will be handled by the parent component
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      gestureRecognizer.current.reset();
    };
  }, []);

  const currentValue = placement.value || 100;

  return (
    <>
      <motion.div
        ref={stickerRef}
        drag={editable && !isEditing && !isGesturing.current}
        dragMomentum={false}
        dragElastic={0}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEndInternal}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerCancel={handlePressEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={{ x, y }}
        initial={{
          scale: currentScale,
          rotate: currentRotation,
        }}
        animate={{
          scale: isEditing ? currentScale * 1.15 : isDragging ? currentScale * 0.75 : currentScale,
          rotate: isEditing 
            ? [currentRotation, currentRotation + 5, currentRotation - 5, currentRotation]
            : currentRotation,
          opacity: isDragging ? 0.75 : 1,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 300, damping: 20 },
          rotate: isEditing 
            ? { repeat: Infinity, duration: 0.5, ease: 'easeInOut' }
            : { type: 'spring', stiffness: 300, damping: 20 },
        }}
        className={`
          absolute cursor-grab active:cursor-grabbing pointer-events-auto sticker-container
          ${isEditing ? 'z-50' : 'z-10'}
        `}
        whileHover={editable ? { scale: currentScale * 1.05 } : {}}
      >
        {/* Sticker Image */}
        <div className="relative">
          {sticker.image?.startsWith('http') ? (
            <img
              src={sticker.image}
              alt={sticker.name || 'Sticker'}
              className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg drop-shadow-2xl select-none pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="text-5xl md:text-6xl drop-shadow-2xl select-none pointer-events-none">
              {sticker.image}
            </div>
          )}

          {/* Value Display Bubble - Hidden, value only used for size */}
          {/* Removed - value is now only used to control size, not displayed */}

          {/* Glow effect when near bin */}
          {isDragging && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500 blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: isNearBin ? 0.5 : 0 }}
            />
          )}
        </div>
      </motion.div>

      {/* Value Control */}
      {showValueControl && isEditing && !isDragging && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-[90]"
            onClick={() => {
              setShowValueControl(false);
              setIsEditing(false);
            }}
            style={{ pointerEvents: 'auto' }}
          />
          
          {/* Control positioned below sticker */}
          <div 
            className="value-control fixed z-[100]"
            style={{
              left: `${controlPosition.x}px`,
              top: `${controlPosition.y}px`,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          >
            <ValueControl
              value={currentValue}
              onChange={handleValueChange}
              onClose={() => {
                setShowValueControl(false);
                setIsEditing(false);
              }}
              visible={showValueControl}
            />
          </div>
        </>
      )}
    </>
  );
};
