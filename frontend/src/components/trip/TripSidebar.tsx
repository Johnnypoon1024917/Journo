import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import { useSwipeableElement } from '../../hooks/useSwipeGesture';
import { PackingListProgress } from '../../types/packing';

interface TripSidebarProps {
  tripId: string;
  tripTitle: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  packingProgress?: PackingListProgress | null;
  budgetSummary?: any;
  totalDistance?: number;
  isOwner?: boolean;
  collaborators?: Array<{ id: string; name: string; avatar?: string; role: string }>;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenCollaborators?: () => void;
  onOpenBudget?: () => void;
  onOpenSettings?: () => void;
}

export const TripSidebar: React.FC<TripSidebarProps> = ({
  tripId,
  tripTitle,
  destination,
  startDate,
  endDate,
  coverImage,
  packingProgress,
  totalDistance,
  collaborators = [],
  isOpen = false,
  onClose,
  onOpenCollaborators,
  onOpenBudget,
}) => {
  const navigate = useNavigate();
  const { isMobileLayout } = useResponsive();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // On desktop, use isOpen prop to control visibility; on mobile, use isOpen for overlay
  const shouldShowSidebar = isMobileLayout ? isOpen : (isOpen && !isCollapsed);

  // Swipe to close on mobile (swipe left to close left-positioned sidebar)
  const swipeableRef = useSwipeableElement({
    onSwipeLeft: () => {
      if (isMobileLayout && onClose) {
        onClose();
      }
    },
    threshold: 100,
  });

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobileLayout || !isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('.trip-sidebar');
      const target = event.target as Node;
      
      if (sidebar && !sidebar.contains(target) && onClose) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileLayout, isOpen, onClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileLayout && isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMobileLayout, isOpen]);

  const formatDateRange = () => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')}–${end.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')}`;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileLayout && isOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        ref={swipeableRef as React.RefObject<HTMLElement>}
        className={`trip-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileLayout ? 'mobile' : ''} ${shouldShowSidebar ? 'open' : ''}`}
        style={{ 
          width: shouldShowSidebar ? (isMobileLayout ? '85vw' : '360px') : '0',
          maxWidth: isMobileLayout ? '400px' : '360px'
        }}
        role="complementary"
        aria-label="Trip sidebar"
      >
        {/* Mobile Close Button */}
        {isMobileLayout && (
          <button
            className="mobile-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Trip Config Header */}
        <div className="trip-config" style={{ backgroundImage: coverImage ? `url(${coverImage})` : 'url(https://assets.funliday.com/trip-default-cover/34.png)' }}>
          <div className="trip-config-row1">
            <div className="trip-name-container">
              <div className="trip-name">{tripTitle || 'Trip'}</div>
            </div>
          </div>
          
          <div className="trip-config-row2">
            <div className="trip-info-row">
              <div className="date-range-container">
                <span className="date-range">{formatDateRange()}</span>
              </div>
              <div className="trip-actions">
                {/* Collaborators */}
                <div className="member-list">
                  {collaborators.slice(0, 1).map((member) => (
                    <div key={member.id} className="member" title={member.name}>
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} />
                      ) : (
                        <div className="member-placeholder">{member.name.charAt(0)}</div>
                      )}
                    </div>
                  ))}
                </div>
                <button 
                  className="action-button add-member" 
                  title="Invite friends via link"
                  onClick={onOpenCollaborators}
                >
                  <span className="icon-add">+</span>
                </button>
              </div>
            </div>
            <div className="destination-container">
              <div className="destination">{destination || 'Destination'}</div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="sidebar-scroll-content">
          {/* Action Buttons - Improved Layout */}
          <div className="trip-action-buttons">
            <div className="action-buttons-grid">
              <a 
                href="https://www.trip.com/flights/" 
                target="_blank" 
                rel="noreferrer" 
                className="action-button-link"
              >
                <div className="action-icon">
                  <img src="https://assets.funliday.com/app/icon_trip_flight.png" alt="" />
                </div>
                <span className="action-name">Flights</span>
              </a>
              <a 
                href="https://www.booking.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="action-button-link"
              >
                <div className="action-icon">
                  <img src="https://assets.funliday.com/app/icon_trip_hotel.png" alt="" />
                </div>
                <span className="action-name">Hotels</span>
              </a>
              <a 
                href="https://www.rentalcars.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="action-button-link"
              >
                <div className="action-icon">
                  <img src="https://assets.funliday.com/app/icon_trip_car.png" alt="" />
                </div>
                <span className="action-name">Car Rental</span>
              </a>
              <a 
                href="https://www.klook.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="action-button-link"
              >
                <div className="action-icon">
                  <img src="https://assets.funliday.com/app/icon_trip_experiences.png" alt="" />
                </div>
                <span className="action-name">Tours</span>
              </a>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="feature-grid">
            {/* Itinerary - Large */}
            <button 
              className="feature-item large active"
              onClick={() => navigate(`/trips/${tripId}`)}
            >
              <div className="feature-content large-content">
                <div className="feature-icon-section">
                  <div className="feature-icon">
                    <img src="https://assets.funliday.com/web/container/icon_itinerary_l_active.png" alt="Itinerary" />
                  </div>
                </div>
                <div className="feature-info">
                  <div className="feature-title">Itinerary</div>
                  <div className="feature-stat">
                    <span className="stat-value">{totalDistance?.toFixed(0) || 0}</span>
                    <span className="stat-unit">km</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Files and notes */}
            <button 
              className="feature-item small"
              onClick={() => navigate(`/trips/${tripId}/files`)}
            >
              <div className="feature-content small-content">
                <div className="feature-header">
                  <div className="feature-title">Files and notes</div>
                </div>
                <div className="feature-bottom">
                  <div className="feature-icon">
                    <img src="https://assets.funliday.com/web/container/icon_files_l.png" alt="Files" />
                  </div>
                  <div className="feature-stat">
                    <span className="stat-value">0</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Journals */}
            <button 
              className="feature-item small"
              onClick={() => navigate(`/trips/${tripId}/journals`)}
            >
              <div className="feature-content small-content">
                <div className="feature-header">
                  <div className="feature-title">Journals</div>
                </div>
                <div className="feature-bottom">
                  <div className="feature-icon">
                    <img src="https://assets.funliday.com/web/container/icon_journal_l.png" alt="Journals" />
                  </div>
                  <div className="feature-stat">
                    <span className="stat-value">0</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Packing List */}
            <button 
              className="feature-item small"
              onClick={() => navigate(`/trips/${tripId}/packing`)}
            >
              <div className="feature-content small-content">
                <div className="feature-header">
                  <div className="feature-title">Packing List</div>
                </div>
                <div className="feature-bottom">
                  <div className="feature-icon">
                    <img src="https://assets.funliday.com/web/container/icon_packinglist_l.png" alt="Packing" />
                  </div>
                  <div className="feature-stat">
                    <span className="stat-value">{packingProgress?.checked_items || 0}</span>
                    <span className="stat-unit">/{packingProgress?.total_items || 24}</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Expense */}
            <button 
              className="feature-item small"
              onClick={onOpenBudget}
            >
              <div className="feature-content small-content">
                <div className="feature-header">
                  <div className="feature-title">Expense</div>
                </div>
                <div className="feature-bottom">
                  <div className="feature-icon">
                    <img src="https://assets.funliday.com/web/container/icon_expense_l.png" alt="Expense" />
                  </div>
                  <div className="feature-stat">
                    <span className="stat-value">0</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Download PDF */}
            <button 
              className="feature-item small"
              onClick={() => window.open(`/trips/${tripId}/pdf`, '_blank')}
            >
              <div className="feature-content small-content">
                <div className="feature-header">
                  <div className="feature-title">Download PDF</div>
                </div>
                <div className="feature-bottom">
                  <div className="feature-icon">
                    <img src="https://assets.funliday.com/web/container/icon_pdf_l.png" alt="PDF" />
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer - Desktop Only */}
        {!isMobileLayout && (
          <div className="sidebar-footer">
            <button 
              className="hide-menu-button"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <span className="icon-arrow">{isCollapsed ? '→' : '←'}</span>
              {!isCollapsed && 'Hide menu'}
            </button>
          </div>
        )}
      </aside>

      <style>{`
        /* Backdrop for mobile */
        .sidebar-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 99;
          animation: fade-in 0.2s ease-out;
        }

        /* Main sidebar container */
        .trip-sidebar {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 100%), #fff;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          z-index: 10;
          position: relative;
        }

        .trip-sidebar.collapsed {
          width: 0 !important;
          box-shadow: none;
        }

        /* Desktop: Hide sidebar when not open */
        .trip-sidebar:not(.mobile):not(.open) {
          width: 0 !important;
          box-shadow: none;
        }

        /* Mobile-specific styles */
        .trip-sidebar.mobile {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100;
          transform: translateX(-100%);
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
          border-radius: 0 16px 16px 0;
        }

        .trip-sidebar.mobile.open {
          transform: translateX(0);
        }

        /* Mobile close button */
        .mobile-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 101;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          color: #374151;
        }

        .mobile-close-btn:hover {
          background: white;
          transform: scale(1.05);
        }

        .mobile-close-btn:active {
          transform: scale(0.95);
        }

        /* Trip Config Header - Enhanced */
        .trip-config {
          flex-shrink: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          padding: 20px;
          color: white;
          position: relative;
          min-height: 160px;
        }

        .trip-config::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%);
          z-index: 0;
        }

        .trip-config > * {
          position: relative;
          z-index: 1;
        }

        .trip-config-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          margin-top: 8px; /* Reduced space since close button is now on right */
        }

        .trip-name-container {
          flex: 1;
          text-align: center;
          padding: 0 16px;
        }

        .trip-name {
          font-size: 20px;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.4);
          line-height: 1.3;
        }

        .trip-config-row2 {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .trip-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .date-range-container {
          flex: 1;
        }

        .date-range {
          font-size: 15px;
          font-weight: 500;
          color: white;
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        .trip-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .member-list {
          display: flex;
          gap: 6px;
        }

        .member {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        .member img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .member-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #3b82f6;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }

        .action-button {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.95);
          color: #1a1a1a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 600;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          touch-action: manipulation;
        }

        .action-button:hover {
          background: white;
          transform: scale(1.05);
        }

        .action-button:active {
          transform: scale(0.95);
        }

        .destination-container {
          margin-top: 8px;
        }

        .destination {
          font-size: 18px;
          font-weight: 600;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.4);
        }

        /* Scrollable Content */
        .sidebar-scroll-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          -webkit-overflow-scrolling: touch;
        }

        /* Action Buttons - Improved Grid Layout */
        .trip-action-buttons {
          margin-bottom: 20px;
        }

        .action-buttons-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .action-button-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 16px 12px;
          background: white;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #f1f5f9;
          min-height: 80px;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .action-button-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          border-color: #e2e8f0;
        }

        .action-button-link:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .action-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-icon img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .action-name {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          text-align: center;
          line-height: 1.3;
        }

        /* Feature Grid - Enhanced */
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          auto-rows: min-content;
        }

        .feature-item {
          background: white;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          overflow: hidden;
          border: 1px solid #f1f5f9;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .feature-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          border-color: #e2e8f0;
        }

        .feature-item:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .feature-item.active {
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
          background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
        }

        .feature-item.large {
          grid-row: span 2;
        }

        .feature-content {
          width: 100%;
          height: 100%;
          padding: 18px;
        }

        .large-content {
          height: 200px;
          display: flex;
          flex-direction: column;
        }

        .feature-icon-section {
          flex: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-icon img {
          width: 48px;
          height: 48px;
        }

        .feature-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .feature-title {
          font-size: 15px;
          color: #1f2937;
          font-weight: 600;
          margin-bottom: 6px;
          line-height: 1.3;
        }

        .feature-stat {
          color: #6b7280;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #374151;
          margin-right: 4px;
        }

        .stat-unit {
          font-size: 15px;
          color: #6b7280;
          font-weight: 500;
        }

        /* Small Feature Items */
        .small-content {
          height: 90px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .feature-header {
          flex: 1;
          display: flex;
          align-items: center;
        }

        .feature-bottom {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .small-content .feature-icon img {
          width: 28px;
          height: 28px;
        }

        .small-content .feature-stat {
          text-align: right;
        }

        .small-content .stat-value {
          font-size: 24px;
          font-weight: 700;
        }

        /* Footer */
        .sidebar-footer {
          flex-shrink: 0;
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .hide-menu-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          touch-action: manipulation;
        }

        .hide-menu-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .hide-menu-button:active {
          background: #e5e7eb;
        }

        .icon-arrow {
          font-size: 18px;
          font-weight: 600;
        }

        /* Animations */
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Mobile Responsive Adjustments */
        @media (max-width: 768px) {
          .trip-config {
            padding: 16px;
            min-height: 140px;
          }

          .trip-config-row1 {
            margin-top: 16px; /* Adjusted for right-positioned close button */
            margin-bottom: 16px;
          }

          .trip-name {
            font-size: 18px;
          }

          .destination {
            font-size: 16px;
          }

          .sidebar-scroll-content {
            padding: 12px;
          }

          .action-buttons-grid {
            gap: 10px;
          }

          .action-button-link {
            padding: 14px 10px;
            min-height: 72px;
          }

          .action-name {
            font-size: 12px;
          }

          .feature-grid {
            gap: 12px;
          }

          .feature-content {
            padding: 14px;
          }

          .large-content {
            height: 180px;
          }

          .small-content {
            height: 80px;
          }

          .feature-title {
            font-size: 14px;
          }

          .stat-value {
            font-size: 24px;
          }

          .small-content .stat-value {
            font-size: 20px;
          }
        }

        /* Tablet Adjustments */
        @media (min-width: 769px) and (max-width: 1024px) {
          .action-buttons-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* High DPI Display Adjustments */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .action-icon img,
          .feature-icon img {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
        }

        /* Reduced Motion Support */
        @media (prefers-reduced-motion: reduce) {
          .trip-sidebar,
          .action-button-link,
          .feature-item,
          .hide-menu-button,
          .mobile-close-btn {
            transition: none;
          }
          
          .sidebar-backdrop {
            animation: none;
          }
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
          .trip-sidebar {
            background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%), #1f2937;
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
          }

          .action-button-link,
          .feature-item {
            background: #374151;
            border-color: #4b5563;
          }

          .action-name,
          .feature-title {
            color: #f9fafb;
          }

          .stat-value {
            color: #e5e7eb;
          }

          .stat-unit {
            color: #9ca3af;
          }

          .sidebar-footer {
            background: #374151;
            border-color: #4b5563;
          }

          .hide-menu-button {
            color: #9ca3af;
          }

          .hide-menu-button:hover {
            background: #4b5563;
            color: #f3f4f6;
          }
        }
      `}</style>
    </>
  );
};