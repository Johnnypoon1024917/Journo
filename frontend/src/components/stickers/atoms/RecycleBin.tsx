import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFABPosition, getFABStyle } from '../../../hooks/useFABPosition';
import { useLocation } from 'react-router-dom';

interface RecycleBinProps {
  isActive: boolean;
  onDrop: () => void;
  visible?: boolean;
}

/**
 * RecycleBin Component
 * 
 * Animated trash can that appears when dragging stickers.
 * Features:
 * - Opens lid when sticker is nearby (optimized proximity detection)
 * - Glows pink when ready to accept drop
 * - "Eats" sticker with animation
 * - Shows happy cat face after deletion
 * - Optimized deletion animation performance (60fps)
 */
export const RecycleBin: React.FC<RecycleBinProps> = ({
  isActive,
  onDrop,
  visible = false,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [justAte, setJustAte] = useState(false);
  const location = useLocation();
  const hasBottomNav = location.pathname.includes('/trips/');
  
  // RecycleBin appears at index 3 (below notification, add activity, add sticker)
  const fabPosition = useFABPosition({ type: 'recycle', index: 3, hasBottomNav });

  useEffect(() => {
    if (justAte) {
      const timer = setTimeout(() => setJustAte(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [justAte]);

  const handleDrop = () => {
    setJustAte(true);
    onDrop();
    
    // Haptic feedback - pattern for deletion
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  };

  // Optimized proximity detection - use isActive prop from parent
  // Parent calculates distance efficiently during drag
  const showGlow = isActive || isHovering;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={getFABStyle(fabPosition)}
          className="pointer-events-auto"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Bin Container with enhanced visual feedback */}
          <motion.div
            animate={{
              scale: showGlow ? 1.15 : 1,
              rotate: justAte ? [0, -10, 10, -10, 10, 0] : 0,
            }}
            transition={{ 
              scale: { type: 'spring', stiffness: 400, damping: 25 },
              rotate: { duration: 0.5 }
            }}
            className={`
              w-16 h-16 md:w-20 md:h-20 rounded-full
              flex items-center justify-center
              shadow-2xl cursor-pointer
              transition-all duration-200
              ${showGlow
                ? 'bg-gradient-to-br from-pink-400 to-pink-500 ring-4 ring-pink-300 ring-opacity-75' 
                : 'bg-gradient-to-br from-gray-300 to-gray-400'
              }
            `}
            onClick={handleDrop}
          >
            {/* Bin Icon with lid animation */}
            <motion.div
              animate={{
                rotate: showGlow ? 30 : 0,
                y: showGlow ? -5 : 0,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="text-3xl md:text-4xl"
            >
              {justAte ? '😋' : showGlow ? '🗑️' : '♻️'}
            </motion.div>

            {/* Glow effect when active - optimized with will-change */}
            {showGlow && (
              <motion.div
                className="absolute inset-0 rounded-full bg-pink-400 blur-xl opacity-50"
                style={{ willChange: 'opacity' }}
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            )}
          </motion.div>

          {/* Sparkles when active - optimized animation */}
          {showGlow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
              style={{ willChange: 'transform' }}
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-yellow-400 text-xl"
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 6) * 40,
                    y: Math.sin((i * Math.PI * 2) / 6) * 40,
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: 'easeOut'
                  }}
                  style={{ willChange: 'transform' }}
                >
                  ✨
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Confetti burst after eating - optimized deletion animation */}
          {justAte && (
            <>
              {/* Hearts burp */}
              <motion.div
                initial={{ opacity: 0, y: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 1, 0], 
                  y: -60,
                  scale: [0, 1.2, 1, 0.8]
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 text-2xl"
                style={{ willChange: 'transform, opacity' }}
              >
                💕
              </motion.div>

              {/* Confetti particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute text-lg"
                  initial={{ 
                    opacity: 1, 
                    x: 0, 
                    y: 0,
                    scale: 0
                  }}
                  animate={{
                    opacity: [1, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 8) * 60,
                    y: Math.sin((i * Math.PI * 2) / 8) * 60 - 20,
                    scale: [0, 1, 0.5],
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 0.8,
                    ease: 'easeOut'
                  }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  {['🎉', '✨', '⭐', '💫', '🌟', '💝', '🎊', '🎈'][i]}
                </motion.div>
              ))}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
