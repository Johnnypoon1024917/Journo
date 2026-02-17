import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ValueControlProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  onClose?: () => void;
  visible?: boolean;
}

/**
 * ValueControl Component
 * 
 * Displays a slider with ± buttons for adjusting sticker values.
 * Appears near the sticker when editing.
 * 
 * Features:
 * - Horizontal slider with cat paw handle
 * - ± buttons for fine control
 * - Color-coded value display (green < 100%, orange 100-150%, red > 150%)
 * - Smooth animations and haptic feedback
 */
export const ValueControl: React.FC<ValueControlProps> = ({
  value,
  min = 0,
  max = 200,
  onChange,
  onClose,
  visible = true,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, localValue + 1);
    setLocalValue(newValue);
    onChange(newValue);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, localValue - 1);
    setLocalValue(newValue);
    onChange(newValue);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Color based on value
  const getValueColor = () => {
    if (localValue < 100) return 'text-green-500';
    if (localValue <= 150) return 'text-orange-500';
    return 'text-red-500';
  };

  const getTrackGradient = () => {
    const percentage = ((localValue - min) / (max - min)) * 100;
    return `linear-gradient(to right, #ff9ec1 0%, #ff6b9d ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative"
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Control Bar */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-full shadow-2xl border-2 border-pink-200 dark:border-pink-700 px-4 py-3 flex items-center gap-3 min-w-[280px] md:min-w-[320px]"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Decrement Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleDecrement}
              disabled={localValue <= min}
              className={`
                w-10 h-10 md:w-12 md:h-12 rounded-full 
                bg-gradient-to-br from-pink-400 to-pink-500
                text-white font-bold text-xl
                flex items-center justify-center
                shadow-md hover:shadow-lg
                transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                active:scale-90
              `}
              aria-label="Decrease value"
            >
              −
            </motion.button>

            {/* Slider Container */}
            <div className="flex-1">
              {/* Slider */}
              <div className="relative h-10 flex items-center">
                {/* Track background */}
                <div 
                  className="absolute w-full h-1 rounded-full"
                  style={{
                    background: getTrackGradient(),
                  }}
                />
                
                {/* Invisible native slider for interaction */}
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={localValue}
                  onChange={handleSliderChange}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onTouchStart={() => setIsDragging(true)}
                  onTouchEnd={() => setIsDragging(false)}
                  className="w-full h-10 appearance-none cursor-pointer relative z-10 bg-transparent slider-custom"
                />
                
                {/* Custom Handle (Cat Paw) - draggable */}
                <motion.div
                  className="absolute z-20"
                  style={{
                    left: `calc(${((localValue - min) / (max - min)) * 100}%)`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                  animate={{
                    scale: isDragging ? 1.2 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-300 to-pink-400 rounded-full shadow-lg flex items-center justify-center text-xl">
                    🐾
                  </div>
                </motion.div>
                
                {/* Hidden styles for slider thumb */}
                <style>{`
                  .slider-custom::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 40px;
                    height: 40px;
                    background: transparent;
                    cursor: grab;
                    border-radius: 50%;
                  }
                  
                  .slider-custom::-webkit-slider-thumb:active {
                    cursor: grabbing;
                  }
                  
                  .slider-custom::-moz-range-thumb {
                    width: 40px;
                    height: 40px;
                    background: transparent;
                    cursor: grab;
                    border: none;
                    border-radius: 50%;
                  }
                  
                  .slider-custom::-moz-range-thumb:active {
                    cursor: grabbing;
                  }
                `}</style>
              </div>
            </div>

            {/* Increment Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleIncrement}
              disabled={localValue >= max}
              className={`
                w-10 h-10 md:w-12 md:h-12 rounded-full 
                bg-gradient-to-br from-pink-400 to-pink-500
                text-white font-bold text-xl
                flex items-center justify-center
                shadow-md hover:shadow-lg
                transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                active:scale-90
              `}
              aria-label="Increase value"
            >
              +
            </motion.button>
          </div>

          {/* Close hint */}
          <div 
            className="text-center mt-2 text-xs text-gray-500 dark:text-gray-400"
            style={{ pointerEvents: 'none' }}
          >
            Tap outside to close
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
