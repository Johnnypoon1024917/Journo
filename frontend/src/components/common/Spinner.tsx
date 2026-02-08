import React from 'react';

type SpinnerSize = 'small' | 'medium' | 'large';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = '#3b82f6',
  className = '',
}) => {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 40,
  };

  const dimension = sizeMap[size];

  return (
    <div className={`spinner ${className}`} role="status" aria-label="Loading">
      <style>{`
        .spinner {
          display: inline-block;
          width: ${dimension}px;
          height: ${dimension}px;
          border: ${size === 'small' ? 2 : 3}px solid #e5e7eb;
          border-top-color: ${color};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
