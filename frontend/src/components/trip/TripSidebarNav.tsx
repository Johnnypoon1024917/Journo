import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TripSidebarNavProps {
  tripId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export const TripSidebarNav: React.FC<TripSidebarNavProps> = ({
  tripId,
  isExpanded,
  onToggle,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'itinerary',
      label: 'Itinerary',
      icon: '📍',
      path: `/trips/${tripId}`,
      activeIcon: '📍',
    },
    {
      id: 'files',
      label: 'Files and notes',
      icon: '📁',
      path: `/trips/${tripId}/files`,
      activeIcon: '📁',
    },
    {
      id: 'journals',
      label: 'Journals',
      icon: '📔',
      path: `/trips/${tripId}/journals`,
      activeIcon: '📔',
    },
    {
      id: 'packing',
      label: 'Packing List',
      icon: '🎒',
      path: `/trips/${tripId}/packing`,
      activeIcon: '🎒',
    },
    {
      id: 'expenses',
      label: 'Expense',
      icon: '💰',
      path: `/trips/${tripId}/expenses`,
      activeIcon: '💰',
    },
    {
      id: 'pdf',
      label: 'Download PDF',
      icon: '📄',
      path: `/trips/${tripId}/pdf`,
      activeIcon: '📄',
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className={`trip-sidebar-nav ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="nav-items">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            title={item.label}
            aria-label={item.label}
          >
            <span className="nav-icon">
              {isActive(item.path) ? item.activeIcon : item.icon}
            </span>
            {isExpanded && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </div>

      <div className="nav-footer">
        <button
          className="toggle-btn"
          onClick={onToggle}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <span className="toggle-icon">{isExpanded ? '◀' : '▶'}</span>
        </button>
      </div>

      <style>{`
        .trip-sidebar-nav {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
          border-right: 1px solid #e5e7eb;
          transition: width 0.3s ease;
          width: 56px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          z-index: 10;
        }

        .trip-sidebar-nav.expanded {
          width: 200px;
        }

        .nav-items {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 12px;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          white-space: nowrap;
          position: relative;
        }

        .nav-item:hover {
          background: #f5f5f5;
        }

        .nav-item.active {
          background: #e3f2fd;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          background: #3b82f6;
          border-radius: 0 2px 2px 0;
        }

        .nav-icon {
          font-size: 20px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nav-label {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .trip-sidebar-nav.expanded .nav-label {
          opacity: 1;
        }

        .nav-footer {
          padding: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .toggle-btn {
          width: 100%;
          padding: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toggle-btn:hover {
          background: #f5f5f5;
        }

        .toggle-icon {
          font-size: 16px;
          color: #666;
        }

        @media (max-width: 768px) {
          .trip-sidebar-nav {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 100;
            transform: translateX(-100%);
          }

          .trip-sidebar-nav.expanded {
            transform: translateX(0);
          }
        }
      `}</style>
    </aside>
  );
};
