/**
 * Kawaii Home Page
 * 
 * Kawaii-styled homepage with soft colors, rounded corners, and playful design.
 */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TripList } from '../components/trip/TripList';
import { KawaiiTripEditor } from '../components/kawaii/KawaiiTripEditor';
import { KawaiiModal } from '../components/kawaii/KawaiiModal';
import { Button as KawaiiButton } from '../components/kawaii/Button';
import { ToastContainer } from '../components/common/Toast';
import { OfflineBadge } from '../components/common/OfflineBadge';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { UserProfileDropdown } from '../components/user/UserProfileDropdown';
import { offlineTripService } from '../services/offlineTripService';
import { CreateTripDto } from '../types/trip';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import { useToast } from '../hooks/useToast';
import { useOfflineStore } from '../stores/offlineStore';
import { DestinationCarousel } from '../components/destination';
import { cn } from '@/utils/cn';

export function KawaiiHome() {
  const { user, isAuthenticated } = useAuth();
  const authStore = useEnhancedAuthStore();
  const { isOnline } = useOfflineStore();
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, dismissToast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Get access token from auth store - if null, try to get from enhanced auth store
  let accessToken = authStore.accessToken;
  
  // If no token in authStore, check if we need to restore from enhanced auth
  if (!accessToken && isAuthenticated && user) {
    console.warn('⚠️ User is authenticated but no access token in authStore');
    console.log('Attempting to restore authentication state...');
    
    // Try to get token from localStorage directly
    try {
      const authStorageStr = localStorage.getItem('auth-storage');
      const enhancedAuthStorageStr = localStorage.getItem('enhanced-auth-storage');
      
      console.log('LocalStorage check:', {
        hasAuthStorage: !!authStorageStr,
        hasEnhancedAuthStorage: !!enhancedAuthStorageStr,
      });
      
      if (authStorageStr) {
        const authStorage = JSON.parse(authStorageStr);
        console.log('Auth storage state:', {
          hasAccessToken: !!authStorage?.state?.accessToken,
          hasUser: !!authStorage?.state?.user,
          isAuthenticated: authStorage?.state?.isAuthenticated,
        });
        
        if (authStorage?.state?.accessToken) {
          accessToken = authStorage.state.accessToken;
          console.log('✅ Restored access token from localStorage');
        }
      }
      
      if (enhancedAuthStorageStr && !accessToken) {
        const enhancedAuthStorage = JSON.parse(enhancedAuthStorageStr);
        console.log('Enhanced auth storage state:', {
          hasAccessToken: !!enhancedAuthStorage?.state?.accessToken,
          hasUser: !!enhancedAuthStorage?.state?.user,
          isAuthenticated: enhancedAuthStorage?.state?.isAuthenticated,
        });
        
        if (enhancedAuthStorage?.state?.accessToken) {
          accessToken = enhancedAuthStorage.state.accessToken;
          console.log('✅ Restored access token from enhanced auth localStorage');
        }
      }
    } catch (err) {
      console.error('Error reading from localStorage:', err);
    }
  }

  console.log('🔍 KawaiiHome - Auth Debug:', {
    isAuthenticated,
    hasUser: !!user,
    hasAccessToken: !!accessToken,
    accessTokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'MISSING',
  });

  const handleCreateTrip = async (tripData: CreateTripDto) => {
    console.log('=== CREATE TRIP DEBUG ===');
    console.log('Trip data:', tripData);
    console.log('Access token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'MISSING');
    console.log('Is authenticated:', isAuthenticated);
    console.log('User:', user);
    console.log('Is online:', isOnline);
    console.log('========================');

    if (!accessToken) {
      console.error('❌ No access token available');
      showError('Authentication Required', 'Please log in to create a trip');
      navigate('/login');
      return;
    }

    if (!isAuthenticated) {
      console.error('❌ User not authenticated');
      showError('Authentication Required', 'Please log in to create a trip');
      navigate('/login');
      return;
    }

    try {
      console.log('✅ Calling offlineTripService.createTrip...');
      const response = await offlineTripService.createTrip(tripData, accessToken);
      console.log('✅ Trip created successfully:', response);
      
      setIsCreateModalOpen(false);
      
      if (isOnline) {
        showSuccess('Success', 'Trip created successfully! 🎉');
      } else {
        showSuccess('Offline Mode', 'Trip created offline. Will sync when online. 📱');
      }
      
      // Redirect to schedule page
      const tripId = response.data.id;
      console.log('Redirecting to schedule page for trip:', tripId);
      navigate(`/trips/${tripId}/schedule`);
    } catch (err: any) {
      console.error('❌ Error creating trip:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        data: err.data,
        code: err.code,
        stack: err.stack,
      });
      
      // Show user-friendly error message
      if (err.status === 401) {
        showError('Session Expired', 'Your session has expired. Please log in again. 🔐');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.code === 'NETWORK_ERROR') {
        showError('Network Error', 'No internet connection. Trip will be created offline. 📱');
      } else {
        showError('Error', err.message || 'Failed to create trip. Please try again. ❌');
      }
      
      throw err;
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-kawaii-cream-50 via-kawaii-primary-50/30 to-kawaii-secondary-50/30">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-kawaii-primary-100 shadow-sm">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-kawaii-primary-400 to-kawaii-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">J</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-kawaii-primary-600 to-kawaii-secondary-600 bg-clip-text text-transparent">
                  journo
                </span>
              </Link>

              <div className="flex items-center space-x-4">
                <Link to="/community" className="hidden md:block text-sm font-medium text-kawaii-neutral-700 hover:text-kawaii-primary-600 px-4 py-2 rounded-full hover:bg-kawaii-primary-50 transition-all">
                  Travel Stories
                </Link>
                <UserProfileDropdown />
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center px-6 py-20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-kawaii-primary-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-kawaii-secondary-200/30 rounded-full blur-3xl"></div>
          </div>
          
          <motion.div
            className="relative text-center max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-block mb-6"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <span className="text-8xl">✈️</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-kawaii-primary-600 via-kawaii-secondary-600 to-kawaii-primary-600 bg-clip-text text-transparent">
                Plan Your Dream
              </span>
              <br />
              <span className="text-kawaii-neutral-800">Adventure</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-kawaii-neutral-600 mb-10 font-light">
              Create beautiful travel itineraries with friends 🌸
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <KawaiiButton size="lg" className="min-w-[200px]">
                  <span className="text-lg">Get Started</span>
                  <span className="text-xl">🎒</span>
                </KawaiiButton>
              </Link>
              <Link to="/login">
                <KawaiiButton size="lg" variant="secondary" className="min-w-[200px]">
                  <span className="text-lg">Sign In</span>
                </KawaiiButton>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 bg-white/50 backdrop-blur-sm">
          <div className="max-w-screen-xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-kawaii-neutral-800 mb-4">
                Plan Together, Travel Better
              </h2>
              <p className="text-xl text-kawaii-neutral-600 max-w-2xl mx-auto">
                Everything you need for the perfect trip ✨
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  emoji: '👥',
                  title: 'Collaborate in Real-time',
                  description: 'Invite friends to plan together. Everyone can add places and contribute to the perfect itinerary.',
                  color: 'from-pink-100 to-pink-50'
                },
                {
                  emoji: '🗺️',
                  title: 'Smart Itineraries',
                  description: 'Organize your trip day by day. Calculate travel times and create the perfect schedule automatically.',
                  color: 'from-blue-100 to-blue-50'
                },
                {
                  emoji: '📸',
                  title: 'Share Your Journey',
                  description: 'Keep everyone updated with photos, stories, and real-time location sharing during your adventure.',
                  color: 'from-purple-100 to-purple-50'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    'bg-gradient-to-br p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all',
                    feature.color
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <div className="text-6xl mb-6">{feature.emoji}</div>
                  <h3 className="text-2xl font-bold text-kawaii-neutral-800 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-kawaii-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-20 px-6">
          <div className="max-w-screen-xl mx-auto">
            <motion.h2
              className="text-4xl font-bold text-kawaii-neutral-800 mb-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Inspiration for Your Next Trip 🌏
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Tokyo', country: 'Japan', emoji: '🗼', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80' },
                { name: 'Paris', country: 'France', emoji: '🗼', image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&q=80' },
                { name: 'New York', country: 'USA', emoji: '🗽', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80' },
                { name: 'Bali', country: 'Indonesia', emoji: '🏝️', image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&q=80' },
              ].map((destination, index) => (
                <motion.div
                  key={index}
                  className="group cursor-pointer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <div className="relative overflow-hidden rounded-3xl aspect-square mb-4 shadow-lg">
                    <img
                      src={destination.image}
                      alt={`${destination.name}, ${destination.country}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="text-3xl mb-2">{destination.emoji}</div>
                      <h3 className="font-bold text-xl">{destination.name}</h3>
                      <p className="text-sm opacity-90">{destination.country}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-br from-kawaii-primary-100 to-kawaii-secondary-100">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-kawaii-neutral-800 mb-6">
              Ready to Start Planning? 🎉
            </h2>
            <p className="text-xl text-kawaii-neutral-600 mb-10">
              Join thousands of travelers creating amazing memories
            </p>
            <Link to="/register">
              <KawaiiButton size="lg" className="min-w-[250px]">
                <span className="text-xl">Create Free Account</span>
                <span className="text-2xl">→</span>
              </KawaiiButton>
            </Link>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-kawaii-primary-100 bg-white/80 backdrop-blur-md py-12 px-6">
          <div className="max-w-screen-xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-kawaii-neutral-800 mb-4">Support</h3>
                <ul className="space-y-2 text-kawaii-neutral-600">
                  <li><Link to="/help" className="hover:text-kawaii-primary-600 transition-colors">Help Center</Link></li>
                  <li><Link to="/contact" className="hover:text-kawaii-primary-600 transition-colors">Contact Us</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-kawaii-neutral-800 mb-4">Community</h3>
                <ul className="space-y-2 text-kawaii-neutral-600">
                  <li><Link to="/community" className="hover:text-kawaii-primary-600 transition-colors">Explore Trips</Link></li>
                  <li><Link to="/blog" className="hover:text-kawaii-primary-600 transition-colors">Travel Blog</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-kawaii-neutral-800 mb-4">Planning</h3>
                <ul className="space-y-2 text-kawaii-neutral-600">
                  <li><Link to="/features" className="hover:text-kawaii-primary-600 transition-colors">Features</Link></li>
                  <li><Link to="/guides" className="hover:text-kawaii-primary-600 transition-colors">Travel Guides</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-kawaii-neutral-800 mb-4">Journo</h3>
                <ul className="space-y-2 text-kawaii-neutral-600">
                  <li><Link to="/about" className="hover:text-kawaii-primary-600 transition-colors">About</Link></li>
                  <li><Link to="/privacy" className="hover:text-kawaii-primary-600 transition-colors">Privacy</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-kawaii-primary-100 pt-8 text-center text-kawaii-neutral-600">
              <p>&copy; 2024 Journo. Made with 💖 for travelers</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated user view
  return (
    <>
      <ToastContainer toasts={toasts} onRemove={dismissToast} />
      <div className="min-h-screen bg-gradient-to-br from-kawaii-cream-50 via-kawaii-primary-50/30 to-kawaii-secondary-50/30 dark:from-kawaii-neutral-900 dark:via-kawaii-neutral-800 dark:to-kawaii-neutral-900">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-kawaii-neutral-900/80 backdrop-blur-md border-b border-kawaii-primary-100 dark:border-kawaii-neutral-700 shadow-sm">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-kawaii-primary-400 to-kawaii-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">J</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-kawaii-primary-600 to-kawaii-secondary-600 bg-clip-text text-transparent">
                  journo
                </span>
              </Link>

              <div className="flex items-center space-x-4">
                <KawaiiButton 
                  onClick={() => setIsCreateModalOpen(true)} 
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex"
                >
                  Create a trip
                </KawaiiButton>
                <OfflineBadge />
                <NotificationBell />
                <UserProfileDropdown />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8 py-12">
          {/* Welcome Section */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-3">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-xl text-kawaii-neutral-600 dark:text-kawaii-neutral-300">
              Ready for your next adventure?
            </p>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { title: 'Plan a Trip', emoji: '✈️', description: 'Create a new collaborative itinerary', action: () => setIsCreateModalOpen(true) },
              { title: 'Explore', emoji: '🔍', description: 'Discover trips from the community', action: () => navigate('/community') },
              { title: 'Wishlist', emoji: '💖', description: 'Save places you want to visit', action: () => {} }
            ].map((item, index) => (
              <motion.div
                key={index}
                onClick={item.action}
                className="group cursor-pointer bg-white dark:bg-kawaii-neutral-800 backdrop-blur-sm border-2 border-kawaii-primary-100 dark:border-kawaii-neutral-700 rounded-3xl p-8 hover:border-kawaii-primary-300 dark:hover:border-kawaii-primary-600 hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="text-5xl mb-4">{item.emoji}</div>
                <h3 className="text-2xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-2">
                  {item.title}
                </h3>
                <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-300">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Destination Suggestions */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-8">
              Inspiration for Your Next Trip 🌸
            </h2>
            <DestinationCarousel />
          </div>

          {/* Your Trips Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
                Your Trips 🗺️
              </h2>
              <KawaiiButton 
                onClick={() => setIsCreateModalOpen(true)} 
                variant="ghost"
                size="sm"
                className="md:hidden"
              >
                Create trip
              </KawaiiButton>
            </div>
            
            <TripList />
          </div>
        </div>

        {/* Create Trip Modal */}
        <KawaiiModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="✨ Create New Trip"
          size="lg"
        >
          <KawaiiTripEditor
            mode="create"
            onSave={handleCreateTrip}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </KawaiiModal>
      </div>
    </>
  );
}

export default KawaiiHome;
