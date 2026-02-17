import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/common/Button';
import { NavigationWrapper, PageLayout } from '../components/layout';
import { changeLanguage } from '../utils/languageUtils';
import type { NavigationTab } from '../components/layout';

export function Settings() {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t, i18n } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<NavigationTab>('settings');
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    tripUpdates: true,
    collaborationInvites: true,
    marketingEmails: false,
    publicProfile: true,
    showEmail: false,
    allowCollaborations: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess(t('status.success'), t('settings.account.saveSettings'));
    } catch (err) {
      showError(t('status.error'), t('errors.failedToLoadData'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('settings.account.deleteConfirmation'))) {
      return;
    }

    try {
      await logout();
      showSuccess(t('status.success'), t('settings.account.deleteAccount'));
    } catch (err) {
      showError(t('status.error'), t('errors.failedToLoadData'));
    }
  };

  if (!user) {
    return (
      <NavigationWrapper activeTab={activeTab} onTabChange={setActiveTab}>
        <PageLayout>
          <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('auth.pleaseSignIn')}</h2>
              <p className="text-gray-600 dark:text-gray-400">{t('settings.account.needLogin')}</p>
            </div>
          </div>
        </PageLayout>
      </NavigationWrapper>
    );
  }

  return (
    <NavigationWrapper activeTab={activeTab} onTabChange={setActiveTab}>
      <PageLayout>
        {/* Simple container with proper spacing */}
        <div className="w-full py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-[#d5d0c2] dark:border-gray-700">
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{t('settings.account.accountSettings')}</h2>

                {/* Language Selector */}
                <div className="mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-[#d5d0c2] dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Language / 語言
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Choose your preferred language for the app interface
                    </p>
                    
                    {/* Dropdown */}
                    <div className="relative">
                      <select
                        value={i18n.language}
                        onChange={(e) => changeLanguage(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer appearance-none"
                        style={{ backgroundImage: 'none' }}
                      >
                        <option value="en">🇺🇸 English</option>
                        <option value="zh-TW">🇹🇼 繁體中文 (Traditional Chinese)</option>
                        <option value="zh-CN">🇨🇳 简体中文 (Simplified Chinese)</option>
                        <option value="ja">🇯🇵 日本語 (Japanese)</option>
                      </select>
                      
                      {/* Custom dropdown arrow */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Info text */}
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      Language changes are applied immediately across the app
                    </p>
                  </div>
                </div>

                {/* Notifications Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.notifications.title')}</h3>
                  <div className="space-y-4">
                    <SettingToggle
                      title={t('settings.notifications.emailNotifications')}
                      description={t('settings.notifications.emailNotificationsDesc')}
                      checked={settings.emailNotifications}
                      onChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                    <SettingToggle
                      title={t('settings.notifications.pushNotifications')}
                      description={t('settings.notifications.pushNotificationsDesc')}
                      checked={settings.pushNotifications}
                      onChange={(checked) => handleSettingChange('pushNotifications', checked)}
                    />
                    <SettingToggle
                      title={t('settings.notifications.tripUpdates')}
                      description={t('settings.notifications.tripUpdatesDesc')}
                      checked={settings.tripUpdates}
                      onChange={(checked) => handleSettingChange('tripUpdates', checked)}
                    />
                    <SettingToggle
                      title={t('settings.notifications.collaborationInvites')}
                      description={t('settings.notifications.collaborationInvitesDesc')}
                      checked={settings.collaborationInvites}
                      onChange={(checked) => handleSettingChange('collaborationInvites', checked)}
                    />
                    <SettingToggle
                      title={t('settings.notifications.marketingEmails')}
                      description={t('settings.notifications.marketingEmailsDesc')}
                      checked={settings.marketingEmails}
                      onChange={(checked) => handleSettingChange('marketingEmails', checked)}
                    />
                  </div>
                </div>

                {/* Privacy Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.privacy.title')}</h3>
                  <div className="space-y-4">
                    <SettingToggle
                      title={t('settings.privacy.publicProfile')}
                      description={t('settings.privacy.publicProfileDesc')}
                      checked={settings.publicProfile}
                      onChange={(checked) => handleSettingChange('publicProfile', checked)}
                    />
                    <SettingToggle
                      title={t('settings.privacy.showEmail')}
                      description={t('settings.privacy.showEmailDesc')}
                      checked={settings.showEmail}
                      onChange={(checked) => handleSettingChange('showEmail', checked)}
                    />
                    <SettingToggle
                      title={t('settings.privacy.allowCollaborations')}
                      description={t('settings.privacy.allowCollaborationsDesc')}
                      checked={settings.allowCollaborations}
                      onChange={(checked) => handleSettingChange('allowCollaborations', checked)}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mb-8">
                  <Button
                    onClick={handleSaveSettings}
                    isLoading={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t('settings.account.saveSettings')}
                  </Button>
                </div>

                {/* Danger Zone */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                  <h3 className="text-lg font-semibold text-red-600 mb-4">{t('settings.account.dangerZone')}</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                    <h4 className="font-medium text-red-900 dark:text-red-400 mb-2">{t('settings.account.deleteAccount')}</h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      {t('settings.account.deleteWarning')}
                    </p>
                    <Button
                      onClick={handleDeleteAccount}
                      variant="danger"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {t('settings.account.deleteAccount')}
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </NavigationWrapper>
  );
}

// Toggle Component
interface SettingToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SettingToggle({ title, description, checked, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}

export default Settings;
