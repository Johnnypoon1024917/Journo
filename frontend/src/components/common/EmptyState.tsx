import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'trip' | 'place' | 'search' | 'error';
}

const illustrations = {
  trip: (
    <svg
      className="empty-state-illustration"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="60" cy="60" r="50" fill="#EFF6FF" />
      <path
        d="M40 50L60 35L80 50V75C80 77.7614 77.7614 80 75 80H45C42.2386 80 40 77.7614 40 75V50Z"
        fill="#DBEAFE"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50 80V65C50 62.2386 52.2386 60 55 60H65C67.7614 60 70 62.2386 70 65V80"
        fill="#BFDBFE"
        stroke="#3B82F6"
        strokeWidth="2"
      />
      <circle cx="55" cy="50" r="3" fill="#3B82F6" />
      <circle cx="65" cy="50" r="3" fill="#3B82F6" />
    </svg>
  ),
  place: (
    <svg
      className="empty-state-illustration"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="60" cy="60" r="50" fill="#F0FDF4" />
      <path
        d="M60 30C51.7157 30 45 36.7157 45 45C45 56.25 60 75 60 75C60 75 75 56.25 75 45C75 36.7157 68.2843 30 60 30Z"
        fill="#BBF7D0"
        stroke="#22C55E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="45" r="5" fill="#22C55E" />
      <path
        d="M35 85H85"
        stroke="#22C55E"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  search: (
    <svg
      className="empty-state-illustration"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="60" cy="60" r="50" fill="#FEF3C7" />
      <circle
        cx="55"
        cy="55"
        r="20"
        fill="#FDE68A"
        stroke="#F59E0B"
        strokeWidth="2"
      />
      <path
        d="M70 70L85 85"
        stroke="#F59E0B"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M55 45V55M55 55V65M55 55H45M55 55H65"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  error: (
    <svg
      className="empty-state-illustration"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="60" cy="60" r="50" fill="#FEE2E2" />
      <circle
        cx="60"
        cy="60"
        r="25"
        fill="#FECACA"
        stroke="#EF4444"
        strokeWidth="2"
      />
      <path
        d="M50 50L70 70M70 50L50 70"
        stroke="#EF4444"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  illustration = 'trip',
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        {icon ? (
          <div className="empty-state-icon">{icon}</div>
        ) : (
          illustrations[illustration]
        )}
        
        <h3 className="empty-state-title">{title}</h3>
        
        {description && (
          <p className="empty-state-description">{description}</p>
        )}
        
        {action && (
          <button
            className="empty-state-action"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>

      <style>{`
        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          min-height: 300px;
        }

        .empty-state-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 400px;
        }

        .empty-state-icon,
        .empty-state-illustration {
          margin-bottom: 24px;
        }

        .empty-state-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .dark .empty-state-title {
          color: #f9fafb;
        }

        .empty-state-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .dark .empty-state-description {
          color: #9ca3af;
        }

        .empty-state-action {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .empty-state-action:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .empty-state-action:active {
          transform: translateY(0);
        }

        .empty-state-action:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Animation */
        .empty-state {
          animation: emptyStateFadeIn 500ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes emptyStateFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .empty-state-illustration {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .empty-state,
          .empty-state-illustration {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};
