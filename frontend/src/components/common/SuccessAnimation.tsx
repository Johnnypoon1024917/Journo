import React, { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  show,
  message = 'Success!',
  duration = 2000,
  onComplete,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!visible) return null;

  return (
    <div className="success-animation-overlay">
      <div className="success-animation-content">
        <div className="success-indicator">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="#22C55E"
              className="success-circle"
            />
            <path
              d="M20 32L28 40L44 24"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="success-checkmark"
              style={{
                strokeDasharray: 100,
                strokeDashoffset: 100,
              }}
            />
          </svg>
        </div>
        {message && <p className="success-message">{message}</p>}
      </div>

      <style>{`
        .success-animation-overlay {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 9999;
          pointer-events: none;
        }

        .success-animation-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .success-indicator {
          animation: successPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes successPop {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .success-circle {
          animation: successCircle 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes successCircle {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .success-checkmark {
          animation: checkmarkDraw 400ms cubic-bezier(0.4, 0, 0.2, 1) 200ms forwards;
        }

        @keyframes checkmarkDraw {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .success-message {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          padding: 12px 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          animation: messageFadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1) 400ms backwards;
        }

        .dark .success-message {
          color: #f9fafb;
          background: #1f2937;
        }

        @keyframes messageFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .success-indicator,
          .success-circle,
          .success-checkmark,
          .success-message {
            animation: none;
          }
          
          .success-checkmark {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};
