/**
 * BubbleQuest Home Page
 * 
 * BubbleQuest-styled homepage with soft colors, rounded corners, and playful design.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { TripList } from '../components/trip/TripList';
import { BubbleQuestTripEditor } from '../components/bubblequest/BubbleQuestTripEditor';
import { BubbleQuestModal } from '../components/bubblequest/BubbleQuestModal';
import { Button as BubbleQuestButton } from '../components/bubblequest/Button';
import { ToastContainer } from '../components/common/Toast';
import { offlineTripService } from '../services/offlineTripService';
import { CreateTripDto } from '../types/trip';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import { useToast } from '../hooks/useToast';
import { useOfflineStore } from '../stores/offlineStore';
import { cn } from '@/utils/cn';
import { HeroBackground, ParticleEffect } from '../components/hero';
import { ActionCard, DiscoveryWidget } from '../components/home';
import { Header } from '../components/layout';
import { InstallPrompt } from '../components/pwa';

export function BubbleQuestHome() {
  const { user, isAuthenticated } = useAuth();
  const authStore = useEnhancedAuthStore();
  const { isOnline } = useOfflineStore();
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, dismissToast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Animation variants that respect reduced motion preference
  const pageVariants = {
    initial: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -20 }
  };

  const sectionVariants = {
    initial: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 30 },
    animate: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1
      }
    }
  };

  const staggerItem = {
    initial: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 }
  };

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

  console.log('🔍 BubbleQuestHome - Auth Debug:', {
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
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-bubblequest-cream-50 via-bubblequest-primary-50/30 to-bubblequest-secondary-50/30"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
      >
        {/* Header */}
        <Header isAuthenticated={false} />

        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center px-6 py-26">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-bubblequest-primary-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-bubblequest-secondary-200/30 rounded-full blur-3xl"></div>
          </div>
          
          {/* Subtle bubble animation */}
          <ParticleEffect type="bubbles" enabled={!shouldReduceMotion} density="low" speed={0.8} />
          
          <motion.div
            className="relative text-center max-w-4xl"
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <motion.div
              className="inline-block mb-8"
              animate={shouldReduceMotion ? {} : { rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <span className="text-8xl">✈️</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-bubblequest-primary-600 via-bubblequest-secondary-600 to-bubblequest-primary-600 bg-clip-text text-transparent">
                Plan Your Dream
              </span>
              <br />
              <span className="text-bubblequest-neutral-800">Adventure</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-bubblequest-neutral-600 mb-12 font-light leading-loose">
              Create beautiful travel itineraries with friends 🌸
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link to="/register">
                <BubbleQuestButton size="lg" className="min-w-[200px]">
                  <span className="text-lg">Get Started</span>
                  <span className="text-xl">🎒</span>
                </BubbleQuestButton>
              </Link>
              <Link to="/login">
                <BubbleQuestButton size="lg" variant="secondary" className="min-w-[200px]">
                  <span className="text-lg">Sign In</span>
                </BubbleQuestButton>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <motion.section 
          className="py-26 px-6 bg-white/50 backdrop-blur-sm"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
        >
          <div className="max-w-screen-xl mx-auto">
            <motion.div
              className="text-center mb-18"
              initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold text-bubblequest-neutral-800 mb-6">
                Plan Together, Travel Better
              </h2>
              <p className="text-xl text-bubblequest-neutral-600 max-w-2xl mx-auto leading-relaxed">
                Everything you need for the perfect trip ✨
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-10"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
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
                    'bg-gradient-to-br p-10 rounded-3xl shadow-lg hover:shadow-xl transition-all',
                    feature.color
                  )}
                  variants={staggerItem}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-6xl mb-8">{feature.emoji}</div>
                  <h3 className="text-2xl font-display font-bold text-bubblequest-neutral-800 mb-5">
                    {feature.title}
                  </h3>
                  <p className="text-bubblequest-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Popular Destinations */}
        <motion.section 
          className="py-26 px-6"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
        >
          <div className="max-w-screen-xl mx-auto">
            <motion.h2
              className="text-4xl font-display font-bold text-bubblequest-neutral-800 mb-14 text-center"
              initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
            >
              Inspiration for Your Next Trip 🌏
            </motion.h2>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {[
                { name: 'Tokyo', country: 'Japan', emoji: '🗼', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80' },
                { name: 'Paris', country: 'France', emoji: '🗼', image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&q=80' },
                { name: 'New York', country: 'USA', emoji: '🗽', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80' },
                { name: 'Bali', country: 'Indonesia', emoji: '🏝️', image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&q=80' },
              ].map((destination, index) => (
                <motion.div
                  key={index}
                  className="group cursor-pointer"
                  variants={staggerItem}
                  whileHover={shouldReduceMotion ? {} : { y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative overflow-hidden rounded-3xl aspect-square mb-5 shadow-lg">
                    <img
                      src={destination.image}
                      alt={`${destination.name}, ${destination.country}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-5 left-5 text-white">
                      <div className="text-3xl mb-3">{destination.emoji}</div>
                      <h3 className="font-display font-bold text-xl">{destination.name}</h3>
                      <p className="text-sm opacity-90 leading-relaxed">{destination.country}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          className="py-26 px-6 bg-gradient-to-br from-bubblequest-primary-100 to-bubblequest-secondary-100"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
        >
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-bubblequest-neutral-800 mb-8">
              Ready to Start Planning? 🎉
            </h2>
            <p className="text-xl text-bubblequest-neutral-600 mb-12 leading-relaxed">
              Join thousands of travelers creating amazing memories
            </p>
            <Link to="/register">
              <BubbleQuestButton size="lg" className="min-w-[250px]">
                <span className="text-xl">Create Free Account</span>
                <span className="text-2xl">→</span>
              </BubbleQuestButton>
            </Link>
          </motion.div>
        </motion.section>

        {/* Footer */}
        <footer className="border-t border-bubblequest-primary-100 bg-white/80 backdrop-blur-md py-14 px-6">
          <div className="max-w-screen-xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
              <div>
                <h3 className="font-sans font-bold text-bubblequest-neutral-800 mb-5">Support</h3>
                <ul className="space-y-3 text-bubblequest-neutral-600">
                  <li><Link to="/help" className="hover:text-bubblequest-primary-600 transition-colors leading-relaxed">Help Center</Link></li>
                  <li><Link to="/contact" className="hover:text-bubblequest-primary-600 transition-colors leading-relaxed">Contact Us</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-sans font-bold text-bubblequest-neutral-800 mb-5">Community</h3>
                <ul className="space-y-3 text-bubblequest-neutral-600">
                  <li><Link to="/community" className="hover:text-bubblequest-primary-600 transition-colors leading-relaxed">Explore Trips</Link></li>
                  <li><Link to="/blog" className="hover:text-bubblequest-primary-600 transition-colors leading-relaxed">Travel Blog</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-sans font-bold text-bubblequest-neutral-800 mb-5">Planning</h3>
                <ul className="space-y-3 text-bubblequest-neutral-600">
                  <li><Link to="/features" className="hover:text-bubblequest-primary-600 transition-colors leading-relaxed">Features</Link></li>
                  <li><Link to="/guides" className="hover:text-bubblequest-primary-600 transition-colors leading-relaxed">Travel Guides</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-sans font-bold text-bubblequest-neutral-800 mb-5">Journo</h3>
                <ul className="space-y-3 text-bubblequest-neutral-600">
                  <li><Link to="/about" className="hover:text-bubblequest-primary-600 transition-colors leading-relaxed">About</Link></li>
                  <li><Link to="/privacy" className="hover:text-bubblequest-primary-600 transition-colors leading-relaxed">Privacy</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-bubblequest-primary-100 pt-10 text-center text-bubblequest-neutral-600">
              <p className="leading-relaxed">&copy; 2024 Journo. Made with 💖 for travelers</p>
            </div>
          </div>
        </footer>
      </motion.div>
    );
  }

  // Authenticated user view
  return (
    <>
      <ToastContainer toasts={toasts} onRemove={dismissToast} />
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-bubblequest-cream-50 via-bubblequest-primary-50/30 to-bubblequest-secondary-50/30 dark:from-bubblequest-neutral-900 dark:via-bubblequest-neutral-800 dark:to-bubblequest-neutral-900"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
      >
        {/* Header */}
        <Header 
          isAuthenticated={true} 
          onCreateTrip={() => setIsCreateModalOpen(true)}
          activeRoute="home"
          hideNotifications={true}
        />

        {/* Main Content */}
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-4 md:py-8">
          {/* Welcome Section with Hero Background */}
          <motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <HeroBackground
              imageSrc="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80"
              imageSrcSet="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=640&q=80 640w, https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1280&q=80 1280w, https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80 1920w"
              imageAlt="Beautiful travel destination"
              enableParticles={!shouldReduceMotion}
              className="mb-6 md:mb-10 rounded-2xl md:rounded-3xl min-h-[200px] md:min-h-[320px] flex items-center justify-center"
            >
              {/* Subtle wave animation overlay */}
              <ParticleEffect type="waves" enabled={!shouldReduceMotion} speed={1.2} />
              
              <motion.div
                className="text-center px-4 py-6 md:py-12"
                initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.2 }}
              >
                <h1 className="text-2xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-3 md:mb-6 leading-tight" style={{ textShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)' }}>
                  Hey {user.firstName || user.email.split('@')[0]}! Where to next? ✈️
                </h1>
                <p className="text-sm md:text-xl lg:text-2xl text-white/95 font-medium leading-snug md:leading-relaxed" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}>
                  Your next unforgettable journey is just a tap away
                </p>
              </motion.div>
            </HeroBackground>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-10"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={staggerItem}>
              <ActionCard
                title="Start a New Adventure"
                description="Turn your travel dreams into reality with a collaborative itinerary"
                icon="✈️"
                onClick={() => setIsCreateModalOpen(true)}
                iconGradient={{
                  from: 'from-bubblequest-primary-400',
                  to: 'to-bubblequest-blue-400',
                }}
                delay={0}
              />
            </motion.div>
            
            <motion.div variants={staggerItem}>
              <ActionCard
                title="Find Your Perfect Escape"
                description="Discover destinations that match your travel style and preferences"
                icon="🌍"
                onClick={() => navigate('/country-recommendations')}
                iconGradient={{
                  from: 'from-bubblequest-teal-400',
                  to: 'to-bubblequest-primary-400',
                }}
                delay={0.1}
              />
            </motion.div>
            
            <motion.div variants={staggerItem}>
              <ActionCard
                title="See What Others Are Planning"
                description="Get inspired by amazing trips from our travel community"
                icon="🔍"
                onClick={() => navigate('/community')}
                iconGradient={{
                  from: 'from-bubblequest-purple-400',
                  to: 'to-bubblequest-primary-400',
                }}
                delay={0.2}
              />
            </motion.div>
          </motion.div>

          {/* Destination Suggestions */}
          <motion.div 
            className="mb-6 md:mb-10"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-4 md:mb-6">
              Inspiration for Your Next Trip 🌸
            </h2>
            
            {/* Discovery Widget - Interactive destination finder */}
            <DiscoveryWidget className="mb-4 md:mb-6" />
            
          </motion.div>

          {/* Your Trips Section */}
          <motion.div 
            className="mb-6 md:mb-10"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100">
                Your Trips 🗺️
              </h2>
              <BubbleQuestButton 
                onClick={() => setIsCreateModalOpen(true)} 
                variant="ghost"
                size="sm"
                className="md:hidden"
              >
                Create trip
              </BubbleQuestButton>
            </div>
            
            <TripList />
          </motion.div>
        </div>

        {/* Create Trip Modal */}
        <BubbleQuestModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="✨ Create New Trip"
          size="lg"
        >
          <BubbleQuestTripEditor
            mode="create"
            onSave={handleCreateTrip}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </BubbleQuestModal>

        {/* Install Prompt */}
        <InstallPrompt />
      </motion.div>
    </>
  );
}

export default BubbleQuestHome;
