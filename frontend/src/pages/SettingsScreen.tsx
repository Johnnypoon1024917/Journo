/**
 * SettingsScreen Component
 * 
 * Main settings page that integrates all settings components including:
 * - Theme customization (color, font size, dark mode, animations)
 * - Language selection
 * - Account settings (profile, password, logout)
 * 
 * All settings are persisted to localStorage and applied immediately.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ThemeCustomization } from '@/components/kawaii/ThemeCustomization';
import { AnimationSelector } from '@/components/kawaii/AnimationSelector';
import { LanguageSelector } from '@/components/kawaii/LanguageSelector';
import { Card } from '@/components/kawaii/Card';
import { Button } from '@/components/kawaii/Button';
import { PageLayout } from '@/components/layout';
import { cn } from '@/utils/cn';
import AuthService from '@/services/authService';

export const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // Debug log to verify if this component is rendering
  console.log('⚠️ SettingsScreen (USER settings) is rendering - this should NOT be on /trips/:id/settings!');
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken') || '';
      await AuthService.changePassword(
        token,
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      showSuccess('Success', 'Password changed successfully');
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      showError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Success', 'Logged out successfully');
      navigate('/login');
    } catch (err: any) {
      showError(err.message || 'Failed to logout');
    }
  };

  const handleEditProfile = () => {
    navigate('/profile');
  };

  return (
    <PageLayout maxWidth="lg">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-kawaii-primary-400 to-kawaii-primary-600 text-white px-6 py-8 shadow-lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold">
              {t('settings.title', 'Settings')}
            </h1>
          </div>
          <p className="text-kawaii-primary-50 text-sm ml-14">
            {t('settings.subtitle', 'Customize your experience')}
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Appearance Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-kawaii-neutral-800 dark:text-kawaii-neutral-100 mb-6">
            {t('settings.appearance.title', 'Appearance')}
          </h2>
          
          <div className="space-y-6">
            {/* Theme Customization - Requirement 15.1 */}
            <ThemeCustomization />

            {/* Animations - Requirement 15.4 */}
            <AnimationSelector />
          </div>
        </motion.section>

        {/* Language Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-kawaii-neutral-800 dark:text-kawaii-neutral-100 mb-6">
            {t('settings.language.title', 'Language')}
          </h2>
          
          {/* Language Selector - Requirement 15.5 */}
          <LanguageSelector />
        </motion.section>

        {/* Account Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-kawaii-neutral-800 dark:text-kawaii-neutral-100 mb-6">
            {t('settings.account.title', 'Account')}
          </h2>
          
          <div className="space-y-6">
            {/* Profile Card - Requirement 15.6 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-kawaii-neutral-800 dark:text-kawaii-neutral-100">
                  {t('settings.account.profile', 'Profile')}
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEditProfile}
                >
                  {t('settings.account.edit', 'Edit')}
                </Button>
              </div>
              
              {user && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400">
                      {t('settings.account.name', 'Name')}
                    </label>
                    <p className="text-kawaii-neutral-800 dark:text-kawaii-neutral-100 font-medium">
                      {user.username || user.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400">
                      {t('settings.account.email', 'Email')}
                    </label>
                    <p className="text-kawaii-neutral-800 dark:text-kawaii-neutral-100 font-medium">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Password Card - Requirement 15.6 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-kawaii-neutral-800 dark:text-kawaii-neutral-100">
                  {t('settings.account.password', 'Password')}
                </h3>
                {!isChangingPassword && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    {t('settings.account.changePassword', 'Change')}
                  </Button>
                )}
              </div>

              {isChangingPassword ? (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-2"
                    >
                      {t('settings.account.currentPassword', 'Current Password')}
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      className={cn(
                        'w-full px-4 py-3 rounded-xl',
                        'border-2 border-[#d5d0c2] dark:border-kawaii-neutral-700',
                        'bg-white dark:bg-kawaii-neutral-800',
                        'text-kawaii-neutral-900 dark:text-kawaii-neutral-100',
                        'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500/20 focus:border-kawaii-primary-500',
                        'transition-colors'
                      )}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-2"
                    >
                      {t('settings.account.newPassword', 'New Password')}
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      className={cn(
                        'w-full px-4 py-3 rounded-xl',
                        'border-2 border-[#d5d0c2] dark:border-kawaii-neutral-700',
                        'bg-white dark:bg-kawaii-neutral-800',
                        'text-kawaii-neutral-900 dark:text-kawaii-neutral-100',
                        'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500/20 focus:border-kawaii-primary-500',
                        'transition-colors'
                      )}
                      required
                      minLength={8}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-2"
                    >
                      {t('settings.account.confirmPassword', 'Confirm New Password')}
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      className={cn(
                        'w-full px-4 py-3 rounded-xl',
                        'border-2 border-[#d5d0c2] dark:border-kawaii-neutral-700',
                        'bg-white dark:bg-kawaii-neutral-800',
                        'text-kawaii-neutral-900 dark:text-kawaii-neutral-100',
                        'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500/20 focus:border-kawaii-primary-500',
                        'transition-colors'
                      )}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading
                        ? t('settings.account.saving', 'Saving...')
                        : t('settings.account.savePassword', 'Save Password')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordForm({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }}
                      disabled={isLoading}
                    >
                      {t('settings.account.cancel', 'Cancel')}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
                  {t('settings.account.passwordDescription', 'Change your password to keep your account secure')}
                </p>
              )}
            </Card>

            {/* Logout Card - Requirement 15.7 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-kawaii-neutral-800 dark:text-kawaii-neutral-100 mb-2">
                {t('settings.account.logout', 'Logout')}
              </h3>
              <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-4">
                {t('settings.account.logoutDescription', 'Sign out of your account on this device')}
              </p>
              <Button
                variant="secondary"
                onClick={handleLogout}
                className="w-full sm:w-auto"
              >
                {t('settings.account.logoutButton', 'Logout')}
              </Button>
            </Card>
          </div>
        </motion.section>

        {/* Info Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-kawaii-primary-50 dark:bg-kawaii-primary-900/20 border-kawaii-primary-200 dark:border-kawaii-primary-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5 text-kawaii-primary-600 dark:text-kawaii-primary-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-kawaii-primary-700 dark:text-kawaii-primary-300">
                  {t(
                    'settings.info',
                    'All settings are saved automatically and will be applied immediately. Your preferences are stored locally on your device.'
                  )}
                </p>
              </div>
            </div>
          </Card>
        </motion.section>
      </div>
    </PageLayout>
  );
};
