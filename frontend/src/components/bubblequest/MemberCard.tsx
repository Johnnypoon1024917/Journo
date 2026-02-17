/**
 * BubbleQuest MemberCard Component
 * 
 * Displays trip member with avatar, name, role, and online/offline status.
 * 
 * Features:
 * - Avatar display with fallback to initials
 * - Name and email display
 * - Role badge (owner, editor, viewer)
 * - Online/offline status indicator
 * - Edit/remove actions (for owner only)
 * - Touch-optimized interactions
 * - Framer Motion animations
 * 
 * Requirements: 14.1, 14.3
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import {
  EllipsisVerticalIcon,
  UserCircleIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { TripCollaboratorWithUser, CollaboratorRole } from '@/types/collaboration';

export interface MemberCardProps {
  member: TripCollaboratorWithUser;
  isOnline?: boolean;
  isOwner?: boolean;
  canManage?: boolean;
  onRoleChange?: (memberId: string, newRole: CollaboratorRole) => void;
  onRemove?: (memberId: string) => void;
  className?: string;
}

// Role colors mapping with improved dark mode contrast
const ROLE_COLORS: Record<CollaboratorRole, { bg: string; text: string }> = {
  owner: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-200' },
  editor: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-200' },
  viewer: { bg: 'bg-gray-100 dark:bg-gray-800/60', text: 'text-gray-800 dark:text-gray-200' },
};

// Role translation keys
const ROLE_LABELS: Record<CollaboratorRole, string> = {
  owner: 'roles.owner',
  editor: 'roles.editor',
  viewer: 'roles.viewer',
};

/**
 * Get initials from name
 */
const getInitials = (name: string | null | undefined): string => {
  if (!name) return '??';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  isOnline = false,
  isOwner = false,
  canManage = false,
  onRoleChange,
  onRemove,
  className,
}) => {
  const { t } = useTranslation('members');
  const { t: tCommon } = useTranslation('common');
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Update menu position when it opens
  useEffect(() => {
    if (showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 160, // 160px is menu width
      });
    }
  }, [showMenu]);

  const handleRemove = () => {
    if (onRemove && !isOwner) {
      setIsDeleting(true);
      setTimeout(() => {
        onRemove(member.id);
      }, 300);
    }
  };

  const handleRoleChange = (newRole: CollaboratorRole) => {
    setShowMenu(false);
    if (onRoleChange && !isOwner) {
      onRoleChange(member.id, newRole);
    }
  };

  const initials = getInitials(member.user.name);

  return (
    <div className={cn('relative', className)}>
      {/* Member card */}
      <motion.div
        className={cn(
          'relative overflow-hidden',
          'bg-white dark:bg-bubblequest-neutral-800',
          'rounded-2xl',
          'shadow-sm hover:shadow-md',
          'transition-shadow duration-200',
          'touch-manipulation'
        )}
        animate={isDeleting ? { x: -400, opacity: 0 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Avatar with online status */}
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                'w-12 h-12 rounded-full',
                'flex items-center justify-center',
                'bg-gradient-to-br from-bubblequest-primary to-bubblequest-secondary',
                'text-white font-semibold text-lg',
                'shadow-sm',
                // Dark mode: keep white text for better contrast
                'dark:from-bubblequest-primary-500 dark:to-bubblequest-secondary-500'
              )}
            >
              {initials}
            </div>
            
            {/* Online status indicator */}
            <div
              className={cn(
                'absolute bottom-0 right-0',
                'w-3.5 h-3.5 rounded-full',
                'border-2 border-white dark:border-bubblequest-neutral-800',
                isOnline
                  ? 'bg-green-500'
                  : 'bg-gray-400 dark:bg-gray-600'
              )}
              aria-label={isOnline ? t('members.status.online') : t('members.status.offline')}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <div
              className={cn(
                'text-base font-semibold mb-0.5',
                'text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100',
                'truncate'
              )}
            >
              {member.user.name}
            </div>

            {/* Email */}
            <div
              className={cn(
                'text-sm mb-1.5',
                'text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400',
                'truncate'
              )}
            >
              {member.user.email}
            </div>

            {/* Role badge */}
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5',
                'text-xs font-medium rounded-full',
                ROLE_COLORS[member.role].bg,
                ROLE_COLORS[member.role].text
              )}
            >
              {t(ROLE_LABELS[member.role])}
            </span>
          </div>

          {/* Three-dot menu (only show if can manage and not owner) */}
          {canManage && !isOwner && (
            <div className="relative flex-shrink-0">
              <button
                ref={menuButtonRef}
                onClick={() => setShowMenu(!showMenu)}
                className={cn(
                  'p-2 rounded-lg',
                  'text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400',
                  'hover:bg-bubblequest-neutral-100 dark:hover:bg-bubblequest-neutral-700',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-bubblequest-primary/50',
                  'min-w-[44px] min-h-[44px]',
                  'flex items-center justify-center'
                )}
                aria-label="Menu"
              >
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Dropdown menu - rendered in portal */}
      {showMenu && createPortal(
        <>
          {/* Click outside to close menu */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Dropdown menu */}
          <motion.div
            className={cn(
              'fixed z-[9999]',
              'bg-white dark:bg-bubblequest-neutral-800',
              'rounded-lg shadow-xl',
              'overflow-hidden',
              'min-w-[160px]',
              'border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700'
            )}
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Change role options */}
            {onRoleChange && member.role !== 'editor' && (
              <button
                onClick={() => handleRoleChange('editor')}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3',
                  'text-left text-sm',
                  'text-bubblequest-neutral-700 dark:text-bubblequest-neutral-200',
                  'hover:bg-bubblequest-neutral-100 dark:hover:bg-bubblequest-neutral-700',
                  'transition-colors duration-150'
                )}
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>{t('members.actions.makeEditor')}</span>
              </button>
            )}
            {onRoleChange && member.role !== 'viewer' && (
              <button
                onClick={() => handleRoleChange('viewer')}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3',
                  'text-left text-sm',
                  'text-bubblequest-neutral-700 dark:text-bubblequest-neutral-200',
                  'hover:bg-bubblequest-neutral-100 dark:hover:bg-bubblequest-neutral-700',
                  'transition-colors duration-150'
                )}
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>{t('members.actions.makeViewer')}</span>
              </button>
            )}
            
            {/* Remove member */}
            {onRemove && (
              <button
                onClick={handleRemove}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3',
                  'text-left text-sm',
                  'text-red-600 dark:text-red-400',
                  'hover:bg-red-50 dark:hover:bg-red-900/20',
                  'transition-colors duration-150'
                )}
              >
                <TrashIcon className="w-4 h-4" />
                <span>{t('members.actions.remove')}</span>
              </button>
            )}
          </motion.div>
        </>,
        document.body
      )}
    </div>
  );
};
