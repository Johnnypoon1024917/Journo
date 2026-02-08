import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  indeterminate?: boolean;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  variant = 'default',
  indeterminate = false,
  showPercentage = true,
}) => {
  const getColor = () => {
    switch (variant) {
      case 'success':
        return '#22c55e';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="progress-bar-container">
      {label && (
        <div className="progress-bar-header">
          <span className="progress-bar-label">{label}</span>
          {showPercentage && !indeterminate && (
            <span className="progress-bar-percentage">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      
      <div className="progress-bar-track">
        {indeterminate ? (
          <div
            className="progress-bar-fill progress-bar-indeterminate"
            style={{ backgroundColor: getColor() }}
          />
        ) : (
          <div
            className="progress-bar-fill"
            style={{
              width: `${clampedProgress}%`,
              backgroundColor: getColor(),
            }}
          />
        )}
      </div>

      <style>{`
        .progress-bar-container {
          width: 100%;
        }

        .progress-bar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .progress-bar-label {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }

        .dark .progress-bar-label {
          color: #f9fafb;
        }

        .progress-bar-percentage {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
        }

        .dark .progress-bar-percentage {
          color: #9ca3af;
        }

        .progress-bar-track {
          position: relative;
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }

        .dark .progress-bar-track {
          background: #374151;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-bar-indeterminate {
          width: 40%;
          animation: progressIndeterminate 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes progressIndeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(350%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .progress-bar-fill {
            transition: none;
          }
          
          .progress-bar-indeterminate {
            animation: none;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
