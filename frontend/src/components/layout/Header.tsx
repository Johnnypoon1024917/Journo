/**
 * Modern Navigation Header Component
 * 
 * Features:
 * - Sticky scroll behavior with smooth transitions
 * - Shadow/blur effects when scrolled
 * - Modern Heroicons icon set
 * - Responsive design with mobile bottom navigation
 * - Thumb-friendly mobile access
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  PlusCircleIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  PlusCircleIcon as PlusCircleIconSolid,
  UserGroupIcon as UserGroupIconSolid,
} from '@heroicons/react/24/solid';
import { Button as BubbleQuestButton } from '../bubblequest/Button';
import { NotificationBell } from '../notifications/NotificationBell';
import { UserProfileDropdown } from '../user/UserProfileDropdown';
import { OfflineBadge } from '../common/OfflineBadge';
import { cn } from '@/utils/cn';

interface HeaderProps {
  /** Whether user is authenticated */
  isAuthenticated?: boolean;
  /** Callback when create trip is clicked */
  onCreateTrip?: () => void;
  /** Current active route for mobile nav highlighting */
  activeRoute?: 'home' | 'discover' | 'create' | 'community';
  /** Hide notification bell */
  hideNotifications?: boolean;
  /** Hide mobile bottom navigation */
  hideBottomNav?: boolean;
}

export function Header({ 
  isAuthenticated = false, 
  onCreateTrip,
  activeRoute = 'home',
  hideNotifications = false,
  hideBottomNav = false
}: HeaderProps) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Track scroll position for sticky header effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCreateClick = () => {
    if (onCreateTrip) {
      onCreateTrip();
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop/Tablet Header */}
      <motion.header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-white/90 dark:bg-bubblequest-neutral-900/90 backdrop-blur-lg shadow-lg border-b border-bubblequest-primary-200/50 dark:border-bubblequest-neutral-700/50'
            : 'bg-white/80 dark:bg-bubblequest-neutral-900/80 backdrop-blur-md border-b border-bubblequest-primary-100 dark:border-bubblequest-neutral-700 shadow-sm'
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-bubblequest-primary-400 to-bubblequest-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-white font-bold text-xl">J</span>
              </motion.div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-bubblequest-primary-600 to-bubblequest-secondary-600 bg-clip-text text-transparent">
                journo
              </span>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated ? (
              <nav className="hidden md:flex items-center space-x-2">
                <BubbleQuestButton
                  onClick={handleCreateClick}
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  <span>Create Trip</span>
                </BubbleQuestButton>

                <BubbleQuestButton
                  onClick={() => navigate('/community')}
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <UserGroupIcon className="w-5 h-5" />
                  <span>Community</span>
                </BubbleQuestButton>
              </nav>
            ) : (
              <nav className="hidden md:flex items-center space-x-2">
                <Link to="/community">
                  <BubbleQuestButton variant="ghost" size="sm">
                    Travel Stories
                  </BubbleQuestButton>
                </Link>
              </nav>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1 md:space-x-3">
              {isAuthenticated ? (
                <>
                  <div className="hidden sm:block">
                    <OfflineBadge />
                  </div>
                  {!hideNotifications && <NotificationBell />}
                  <UserProfileDropdown />
                  
                  {/* Mobile Menu Toggle */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 rounded-lg hover:bg-bubblequest-primary-50 dark:hover:bg-bubblequest-neutral-800 transition-colors"
                    aria-label="Toggle menu"
                  >
                    {isMobileMenuOpen ? (
                      <XMarkIcon className="w-6 h-6 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300" />
                    ) : (
                      <Bars3Icon className="w-6 h-6 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300" />
                    )}
                  </button>
                </>
              ) : (
                <UserProfileDropdown />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && isAuthenticated && (
            <motion.div
              className="md:hidden border-t border-bubblequest-primary-100 dark:border-bubblequest-neutral-700 bg-white/95 dark:bg-bubblequest-neutral-900/95 backdrop-blur-lg"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <nav className="px-4 py-4 space-y-2">
                <button
                  onClick={() => handleNavigation('/')}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-bubblequest-primary-50 dark:hover:bg-bubblequest-neutral-800 transition-colors text-left"
                >
                  <HomeIcon className="w-5 h-5 text-bubblequest-primary-600" />
                  <span className="font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                    Home
                  </span>
                </button>

                <button
                  onClick={handleCreateClick}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 hover:bg-bubblequest-primary-100 dark:hover:bg-bubblequest-primary-900/30 transition-colors text-left"
                >
                  <PlusCircleIcon className="w-5 h-5 text-bubblequest-primary-600" />
                  <span className="font-medium text-bubblequest-primary-700 dark:text-bubblequest-primary-400">
                    Create New Trip
                  </span>
                </button>

                <button
                  onClick={() => handleNavigation('/community')}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-bubblequest-primary-50 dark:hover:bg-bubblequest-neutral-800 transition-colors text-left"
                >
                  <UserGroupIcon className="w-5 h-5 text-bubblequest-primary-600" />
                  <span className="font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                    Community
                  </span>
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile Bottom Navigation (Thumb-friendly) */}
      {isAuthenticated && !hideBottomNav && (
        <motion.nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-bubblequest-neutral-900/95 backdrop-blur-lg border-t border-bubblequest-primary-100 dark:border-bubblequest-neutral-700 shadow-2xl"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="grid grid-cols-3 h-16">
            {/* Home */}
            <button
              onClick={() => handleNavigation('/')}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 transition-colors',
                activeRoute === 'home'
                  ? 'text-bubblequest-primary-600'
                  : 'text-bubblequest-neutral-500 hover:text-bubblequest-primary-500'
              )}
              aria-label="Home"
            >
              {activeRoute === 'home' ? (
                <HomeIconSolid className="w-6 h-6" />
              ) : (
                <HomeIcon className="w-6 h-6" />
              )}
              <span className="text-xs font-medium">Home</span>
            </button>

            {/* Create (Prominent) */}
            <button
              onClick={handleCreateClick}
              className="flex flex-col items-center justify-center -mt-4"
              aria-label="Create Trip"
            >
              <motion.div
                className="w-14 h-14 bg-gradient-to-br from-bubblequest-primary-500 to-bubblequest-primary-600 rounded-full flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusCircleIconSolid className="w-8 h-8 text-white" />
              </motion.div>
              <span className="text-xs font-medium text-bubblequest-primary-600 mt-1">
                Create
              </span>
            </button>

            {/* Community */}
            <button
              onClick={() => handleNavigation('/community')}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 transition-colors',
                activeRoute === 'community'
                  ? 'text-bubblequest-primary-600'
                  : 'text-bubblequest-neutral-500 hover:text-bubblequest-primary-500'
              )}
              aria-label="Community"
            >
              {activeRoute === 'community' ? (
                <UserGroupIconSolid className="w-6 h-6" />
              ) : (
                <UserGroupIcon className="w-6 h-6" />
              )}
              <span className="text-xs font-medium">Community</span>
            </button>
          </div>
        </motion.nav>
      )}

      {/* Bottom Navigation Spacer (prevents content from being hidden) */}
      {isAuthenticated && !hideBottomNav && <div className="md:hidden h-16" />}
    </>
  );
}
