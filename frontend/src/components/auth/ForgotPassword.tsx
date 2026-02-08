import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';

export const ForgotPassword: React.FC = () => {
  const { requestPasswordReset, isLoading, error, clearError } = useEnhancedAuthStore();

  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    if (!validateEmail(email)) {
      return;
    }

    const result = await requestPasswordReset(email);

    if (result.success) {
      setSuccessMessage(result.message);
      setIsSubmitted(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (validationError) {
      setValidationError('');
    }
  };

  if (isSubmitted && successMessage) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">J</span>
                </div>
                <span className="text-2xl font-bold text-black">journo</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex min-h-[calc(100vh-80px)]">
          {/* Left Side - Image */}
          <div className="hidden lg:block lg:w-1/2 relative">
            <img
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
              alt="Travel destination"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/20"></div>
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="text-white max-w-lg">
                <h2 className="text-5xl font-bold mb-6 leading-tight">
                  Check your email
                </h2>
                <p className="text-xl font-light opacity-90">
                  We've sent password reset instructions to your email address.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Success Message */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div className="max-w-md w-full space-y-8">
              <div>
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-600 mb-6">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  Email sent successfully
                </h2>
                <p className="text-gray-600 mb-6">
                  {successMessage}
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-2">
                    Didn't receive the email?
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Check your spam or junk folder</li>
                    <li>• Make sure you entered the correct email address</li>
                    <li>• The email may take a few minutes to arrive</li>
                  </ul>
                </div>
                
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setSuccessMessage('');
                    setEmail('');
                  }}
                  className="w-full flex justify-center py-3.5 px-4 border border-gray-300 rounded-xl text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all"
                >
                  Try a different email address
                </button>

                <div className="text-center">
                  <Link
                    to="/auth/login"
                    className="inline-flex items-center text-sm font-medium text-black hover:underline"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <span className="text-2xl font-bold text-black">journo</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left Side - Image */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <img
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Travel destination"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/20"></div>
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-white max-w-lg">
              <h2 className="text-5xl font-bold mb-6 leading-tight">
                Forgot your password?
              </h2>
              <p className="text-xl font-light opacity-90">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                Reset password
              </h2>
              <p className="text-gray-600">
                Remember your password?{' '}
                <Link
                  to="/auth/login"
                  className="font-semibold text-black hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full px-4 py-3 border ${
                    validationError ? 'border-red-300' : 'border-gray-300'
                  } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all`}
                  placeholder="you@example.com"
                />
                {validationError && (
                  <p className="mt-2 text-sm text-red-600">{validationError}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending reset link...
                    </div>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/auth/register"
                    className="font-medium text-black hover:underline"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>
            </form>

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600 text-center">
                For security reasons, password reset links expire after 15 minutes and can only be used once.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};