/**
 * Kawaii MembersScreen Page Component
 * 
 * Main members screen that integrates MemberCard components.
 * 
 * Features:
 * - Display list of trip members with avatars and names
 * - Invite functionality for adding new members by email
 * - Member remove and permission change actions
 * - Real-time presence indicators
 * - Connection to collaborator service (backend API)
 * - Responsive design with bottom/side navigation
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

// Types
import { Trip } from '@/types/trip';
import {
  TripCollaboratorWithUser,
  TripPermissions,
  CollaboratorRole,
} from '@/types/collaboration';

// Services
import { tripService } from '@/services/tripService';
import { collaboratorService } from '@/services/collaboratorService';
import { socketService } from '@/services/socketService';

// Stores
import { useEnhancedAuthStore } from '@/stores/enhancedAuthStore';

// Hooks
import { useToast } from '@/hooks/useToast';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Components
import { MemberCard } from '@/components/kawaii/MemberCard';
import { KawaiiModal } from '@/components/kawaii/KawaiiModal';
import { PageLayout, NavigationWrapper, FABContainer } from '@/components/layout';
import type { NavigationTab } from '@/components/layout';

// Icons
import { PlusIcon, UserPlusIcon } from '@heroicons/react/24/outline';

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900">
    <motion.div
      className="w-16 h-16 border-4 border-kawaii-primary-200 border-t-kawaii-primary-600 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

/**
 * Error display component
 */
const ErrorDisplay: React.FC<{ message: string; onRetry?: () => void; onGoHome?: () => void }> = ({
  message,
  onRetry,
  onGoHome,
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900 p-4">
      <div className="text-center max-w-md">
        <span className="text-6xl mb-4 block">😢</span>
        <p className="text-xl text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-kawaii-primary-500 text-white rounded-lg hover:bg-kawaii-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="px-6 py-2 bg-kawaii-neutral-200 dark:bg-kawaii-neutral-700 text-kawaii-neutral-700 dark:text-kawaii-neutral-300 rounded-lg hover:bg-kawaii-neutral-300 dark:hover:bg-kawaii-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-kawaii-neutral-500 focus:ring-offset-2"
            >
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Empty state component
 */
const EmptyState: React.FC<{ onInvite: () => void; canManage: boolean }> = ({ onInvite, canManage }) => {
  const { t } = useTranslation('members');

  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <span className="text-8xl mb-6 block">👥</span>
      <h3 className="text-2xl font-semibold text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-3">
        {t('members.noMembers')}
      </h3>
      <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-6 max-w-md mx-auto">
        Invite collaborators to plan this trip together
      </p>
      {canManage && (
        <button
          onClick={onInvite}
          className="px-6 py-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <UserPlusIcon className="w-5 h-5 inline-block mr-2" />
          {t('members.invite')}
        </button>
      )}
    </motion.div>
  );
};

/**
 * Invite Member Modal Component
 */
interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: CollaboratorRole) => void;
  isInviting: boolean;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, onInvite, isInviting }) => {
  const { t } = useTranslation('members');
  const { t: tCommon } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollaboratorRole>('editor');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && !isInviting) {
      onInvite(email.trim(), role);
    }
  };

  const handleClose = () => {
    if (!isInviting) {
      setEmail('');
      setRole('editor');
      onClose();
    }
  };

  return (
    <KawaiiModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('members.inviteByEmail')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label
            htmlFor="member-email"
            className="block text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-2"
          >
            Email Address
          </label>
          <input
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            className={cn(
              'w-full px-4 py-3',
              'bg-white dark:bg-kawaii-neutral-800',
              'border-2 border-[#d5d0c2] dark:border-kawaii-neutral-700',
              'rounded-xl',
              'text-kawaii-neutral-900 dark:text-kawaii-neutral-100',
              'placeholder-kawaii-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500 focus:border-transparent',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            disabled={isInviting}
            autoFocus
          />
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-2">
            Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('editor')}
              disabled={isInviting}
              className={cn(
                'px-4 py-3 rounded-lg text-sm font-medium',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                role === 'editor'
                  ? 'bg-kawaii-primary-500 text-white'
                  : 'bg-kawaii-neutral-100 dark:bg-kawaii-neutral-700 text-kawaii-neutral-700 dark:text-kawaii-neutral-300 hover:bg-kawaii-neutral-200 dark:hover:bg-kawaii-neutral-600'
              )}
            >
              <div className="font-semibold">{t('members.roles.editor')}</div>
              <div className="text-xs mt-1 opacity-80">
                {t('members.permissions.canEdit')}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('viewer')}
              disabled={isInviting}
              className={cn(
                'px-4 py-3 rounded-lg text-sm font-medium',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                role === 'viewer'
                  ? 'bg-kawaii-primary-500 text-white'
                  : 'bg-kawaii-neutral-100 dark:bg-kawaii-neutral-700 text-kawaii-neutral-700 dark:text-kawaii-neutral-300 hover:bg-kawaii-neutral-200 dark:hover:bg-kawaii-neutral-600'
              )}
            >
              <div className="font-semibold">{t('members.roles.viewer')}</div>
              <div className="text-xs mt-1 opacity-80">
                {t('members.permissions.canView')}
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isInviting}
            className={cn(
              'flex-1 px-4 py-3 rounded-xl',
              'bg-kawaii-neutral-100 dark:bg-kawaii-neutral-700',
              'text-kawaii-neutral-700 dark:text-kawaii-neutral-300',
              'font-medium',
              'hover:bg-kawaii-neutral-200 dark:hover:bg-kawaii-neutral-600',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-kawaii-neutral-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {tCommon('actions.cancel')}
          </button>
          <button
            type="submit"
            disabled={!email.trim() || isInviting}
            className={cn(
              'flex-1 px-4 py-3 rounded-xl',
              'bg-gradient-to-br from-primary-500 to-primary-600',
              'text-white font-medium',
              'hover:shadow-lg',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {isInviting ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span>Inviting...</span>
              </>
            ) : (
              <span>{tCommon('actions.invite')}</span>
            )}
          </button>
        </div>
      </form>
    </KawaiiModal>
  );
};

/**
 * Main MembersScreen component
 */
export const MembersScreen: React.FC = () => {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('members');
  const { accessToken, logout, user } = useEnhancedAuthStore();
  const { showSuccess, showError } = useToast();

  // State
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripCollaboratorWithUser[]>([]);
  const [permissions, setPermissions] = useState<TripPermissions | null>(null);
  const [onlineMembers, setOnlineMembers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navActiveTab, setNavActiveTab] = useState<NavigationTab>('members');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  /**
   * Fetch trip, members, and permissions data
   */
  const fetchData = async () => {
    if (!tripId || !accessToken) {
      setError('Missing trip ID or authentication');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch trip, members, and permissions in parallel
      const [tripResponse, membersResponse, permissionsResponse] = await Promise.all([
        tripService.getTripById(tripId, accessToken),
        collaboratorService.getTripCollaborators(tripId),
        collaboratorService.getTripPermissions(tripId),
      ]);

      setTrip(tripResponse.data);
      setMembers(membersResponse);
      setPermissions(permissionsResponse);
    } catch (err: any) {
      console.error('Error fetching data:', err);

      // Handle authentication errors
      if (err.status === 401 || err.message?.includes('Invalid or expired token')) {
        await logout();
        showError('Your session has expired. Please login again.');
        navigate('/login', { replace: true });
        return;
      }

      // Handle not found errors
      if (err.status === 404) {
        setError('Trip not found');
        return;
      }

      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when tripId changes
  useEffect(() => {
    fetchData();
  }, [tripId, accessToken]);

  /**
   * Setup real-time presence tracking
   */
  useEffect(() => {
    if (!tripId || !socketService.isConnected()) {
      return;
    }

    // Join trip room for presence updates
    socketService.joinTrip(tripId);

    // Listen for presence updates
    socketService.on({
      onPresenceUpdate: (data: { userId: string; online: boolean }) => {
        setOnlineMembers((prev) => {
          const updated = new Set(prev);
          if (data.online) {
            updated.add(data.userId);
          } else {
            updated.delete(data.userId);
          }
          return updated;
        });
      },
    });

    // Cleanup
    return () => {
      socketService.leaveTrip(tripId);
      socketService.off(['onPresenceUpdate']);
    };
  }, [tripId]);

  /**
   * Handle invite member
   */
  const handleInvite = async (email: string, role: CollaboratorRole) => {
    if (!tripId) return;

    try {
      setIsInviting(true);
      const newMember = await collaboratorService.addCollaboratorByEmail(tripId, email, role);

      // Update local state
      setMembers((prev) => [...prev, newMember]);

      showSuccess(`Invited ${email} as ${role}`);
      setIsInviteModalOpen(false);
    } catch (err: any) {
      console.error('Error inviting member:', err);
      showError(err.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  /**
   * Handle role change
   */
  const handleRoleChange = async (memberId: string, newRole: CollaboratorRole) => {
    if (!tripId) return;

    try {
      await collaboratorService.updateCollaboratorRole(tripId, memberId, newRole);

      // Update local state
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );

      showSuccess(`Updated member role to ${newRole}`);
    } catch (err: any) {
      console.error('Error updating role:', err);
      showError(err.message || 'Failed to update role');
    }
  };

  /**
   * Handle remove member
   */
  const handleRemove = async (memberId: string) => {
    if (!tripId) return;

    try {
      await collaboratorService.removeCollaborator(tripId, memberId);

      // Update local state
      setMembers((prev) => prev.filter((member) => member.id !== memberId));

      showSuccess('Member removed successfully');
    } catch (err: any) {
      console.error('Error removing member:', err);
      showError(err.message || 'Failed to remove member');
    }
  };

  /**
   * Handle invite FAB click
   */
  const handleInviteClick = () => {
    setIsInviteModalOpen(true);
  };

  /**
   * Handle tab change in navigation
   */
  const handleNavTabChange = (tab: NavigationTab) => {
    setNavActiveTab(tab);

    // Navigate to different sections based on tab
    switch (tab) {
      case 'schedule':
        navigate(`/trips/${tripId}`);
        break;
      case 'booking':
        navigate(`/trips/${tripId}/booking`);
        break;
      case 'budget':
        navigate(`/trips/${tripId}/budget`);
        break;
      case 'shopping':
        navigate(`/trips/${tripId}/shopping`);
        break;
      case 'checklist':
        navigate(`/trips/${tripId}/checklist`);
        break;
      case 'members':
        // Already on members
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Error state
  if (error || !trip) {
    return (
      <ErrorDisplay
        message={error || 'Trip not found'}
        onRetry={error ? fetchData : undefined}
        onGoHome={() => navigate('/')}
      />
    );
  }

  const canManage = permissions?.can_manage_collaborators || false;

  return (
    <PageLayout tripId={tripId} maxWidth="xl">
      <NavigationWrapper
        activeTab={navActiveTab}
        onTabChange={handleNavTabChange}
      >
        {/* Header Section with Gradient Background */}
        <div className="bg-gradient-to-br from-kawaii-primary-100 to-kawaii-primary-200 dark:from-kawaii-primary-900/30 dark:to-kawaii-primary-800/30 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Trip Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-2">
                {trip.title}
              </h1>
              <p className="text-lg text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-4">
                {t('members.title')}
              </p>
              <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Members Content Section */}
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Members List */}
          <AnimatePresence mode="wait">
            {members.length === 0 ? (
              <EmptyState key="empty" onInvite={handleInviteClick} canManage={canManage} />
            ) : (
              <motion.div
                key="members"
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {members.map((member, index) => {
                  const isCurrentUserOwner = member.role === 'owner' && member.user_id === user?.id;
                  const isMemberOwner = member.role === 'owner';
                  const isOnline = onlineMembers.has(member.user_id);

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <MemberCard
                        member={member}
                        isOnline={isOnline}
                        isOwner={isMemberOwner}
                        canManage={canManage && !isMemberOwner}
                        onRoleChange={canManage ? handleRoleChange : undefined}
                        onRemove={canManage ? handleRemove : undefined}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </NavigationWrapper>

      {/* Invite Member Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInvite}
        isInviting={isInviting}
      />

      {/* Floating Action Button (only show if can manage) */}
      <FABContainer
        primary={{
          icon: <UserPlusIcon className="w-6 h-6" />,
          onClick: handleInviteClick,
          label: t('members.invite')
        }}
        show={canManage}
      />
    </PageLayout>
  );
};

export default MembersScreen;
