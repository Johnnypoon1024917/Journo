/**
 * BubbleQuest Register Page
 * 
 * BubbleQuest-styled registration page with soft colors and playful design.
 */

import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/bubblequest/Button';
import { Input } from '../components/bubblequest/Input';

export function BubbleQuestRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setValidationError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }

    try {
      await register({ name, email, password });
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bubblequest-cream-50 via-bubblequest-primary-50/30 to-bubblequest-secondary-50/30">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-bubblequest-primary-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-bubblequest-secondary-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-bubblequest-primary-100">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-bubblequest-primary-400 to-bubblequest-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">J</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-bubblequest-primary-600 to-bubblequest-secondary-600 bg-clip-text text-transparent">
                journo
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-10 border border-bubblequest-primary-100">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                className="inline-block mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <span className="text-6xl">🎒</span>
              </motion.div>
              <h2 className="text-4xl font-bold text-bubblequest-neutral-800 mb-2">
                Join Journo!
              </h2>
              <p className="text-bubblequest-neutral-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-bubblequest-primary-600 hover:text-bubblequest-primary-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {displayError && (
                <motion.div
                  className="rounded-2xl bg-error-50 border-2 border-error-200 p-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⚠️</span>
                    <p className="text-sm text-error-800 font-medium">{displayError}</p>
                  </div>
                </motion.div>
              )}

              <Input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                label="Full name"
                placeholder="Enter your full name"
              />

              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                label="Email address"
                placeholder="you@example.com"
              />

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Password"
                placeholder="Create a password (min 8 characters)"
                helperText="Must include uppercase, lowercase, number, and special character"
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                label="Confirm password"
                placeholder="Confirm your password"
              />

              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-1 text-bubblequest-primary-600 border-bubblequest-neutral-300 rounded focus:ring-bubblequest-primary-500"
                />
                <span className="ml-2 text-sm text-bubblequest-neutral-700">
                  I agree to the{' '}
                  <Link to="/terms" className="font-medium text-bubblequest-primary-600 hover:text-bubblequest-primary-700">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-medium text-bubblequest-primary-600 hover:text-bubblequest-primary-700">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              <Button
                type="submit"
                loading={isLoading}
                fullWidth
                size="lg"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-bubblequest-neutral-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-bubblequest-neutral-500">Or continue with</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="flex items-center justify-center px-4 py-3 border-2 border-[#d5d0c2] rounded-xl text-sm font-medium text-bubblequest-neutral-700 bg-white hover:bg-bubblequest-neutral-50 hover:border-bubblequest-neutral-300 transition-all"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center px-4 py-3 border-2 border-[#d5d0c2] rounded-xl text-sm font-medium text-bubblequest-neutral-700 bg-white hover:bg-bubblequest-neutral-50 hover:border-bubblequest-neutral-300 transition-all"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                  GitHub
                </button>
              </div>
            </form>
          </div>

          {/* Footer text */}
          <p className="text-center mt-6 text-sm text-bubblequest-neutral-600">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-bubblequest-primary-600 hover:text-bubblequest-primary-700">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-bubblequest-primary-600 hover:text-bubblequest-primary-700">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default BubbleQuestRegister;
