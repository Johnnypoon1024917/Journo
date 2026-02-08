import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/common/Button';

export function Privacy() {
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      error('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      // TODO: Implement password change API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      // TODO: Implement data download API
      success('Your data download has been initiated. You will receive an email when ready.');
    } catch (err) {
      error('Failed to initiate data download');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <Link to="/login" className="text-blue-600 hover:text-blue-500">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <span className="text-xl font-bold text-black">journo</span>
            </Link>
            <span className="text-gray-400">/</span>
            <Link to="/profile" className="text-gray-600 hover:text-gray-900">Profile</Link>
            <span className="text-gray-400">/</span>
            <h1 className="text-xl font-semibold text-gray-900">Privacy & Security</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Privacy & Security</h2>

            {/* Password Security */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Password Security</h3>
              <div className="bg-gray-50 rounded-xl p-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={8}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    isLoading={isChangingPassword}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Change Password
                  </Button>
                </form>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="border-t border-gray-200 pt-8 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900 mb-2">Two-Factor Authentication Not Enabled</h4>
                    <p className="text-sm text-yellow-700 mb-4">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                    <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Sessions */}
            <div className="border-t border-gray-200 pt-8 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Current Session</h4>
                      <p className="text-sm text-gray-500">macOS • Chrome • San Francisco, CA</p>
                      <p className="text-xs text-green-600">Active now</p>
                    </div>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Current</span>
                </div>
              </div>
              
              <Button variant="ghost" className="mt-4 text-red-600 hover:text-red-700">
                Sign out of all other sessions
              </Button>
            </div>

            {/* Data & Privacy */}
            <div className="border-t border-gray-200 pt-8 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data & Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="font-medium text-gray-900">Download Your Data</h4>
                    <p className="text-sm text-gray-500">Get a copy of all your data including trips, photos, and settings</p>
                  </div>
                  <Button
                    onClick={handleDownloadData}
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Download
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="font-medium text-gray-900">Data Processing</h4>
                    <p className="text-sm text-gray-500">Learn how we process and protect your personal data</p>
                  </div>
                  <Link
                    to="/privacy-policy"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Policy
                  </Link>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="font-medium text-gray-900">Cookie Preferences</h4>
                    <p className="text-sm text-gray-500">Manage how we use cookies to improve your experience</p>
                  </div>
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                    Manage
                  </Button>
                </div>
              </div>
            </div>

            {/* Account Deletion */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Account</h3>
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h4 className="font-medium text-red-900 mb-2">Permanently Delete Account</h4>
                <p className="text-sm text-red-700 mb-4">
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Link
                  to="/settings"
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                >
                  Go to Account Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy;