import { useEffect, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { KawaiiHome as Home } from './pages/KawaiiHome';
import { KawaiiLogin as Login } from './pages/KawaiiLogin';
import { KawaiiRegister as Register } from './pages/KawaiiRegister';
import { Profile } from './pages/Profile';
import { Privacy } from './pages/Privacy';
import { Help } from './pages/Help';
import { Feedback } from './pages/Feedback';
import { TripPlanner } from './pages/TripPlanner';
import { PackingPage } from './pages/PackingPage';
import { SharedTrip } from './pages/SharedTrip';
import { CommunityBlog } from './pages/CommunityBlog';
import { Settings } from './pages/Settings';
import { SettingsScreen } from './pages/SettingsScreen';
import { TripSettingsScreen } from './pages/TripSettingsScreen';
import { BadgeDemo } from './pages/BadgeDemo';
import { KawaiiDemo } from './pages/KawaiiDemo';
import { KawaiiTripDetail } from './pages/KawaiiTripDetail';
import { StickerCanvasDemo } from './components/stickers/examples/StickerCanvasDemo';
import { ScheduleScreen } from './pages/ScheduleScreen';
import { BookingScreen } from './pages/BookingScreen';
import { ShoppingScreen } from './pages/ShoppingScreen';
import { ChecklistScreen } from './pages/ChecklistScreen';
import { MembersScreen } from './pages/MembersScreen';
import { BudgetPage } from './pages/BudgetPage';
import { Admin } from './pages/Admin';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SyncStatus } from './components/common/SyncStatus';
import { ScrollToTop } from './components/common/ScrollToTop';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import PWAUpdateNotification from './components/common/PWAUpdateNotification';
import OfflineStatus from './components/common/OfflineStatus';
import { GlobalNotifications } from './components/notifications/GlobalNotifications';
import { SyncConflictManager } from './components/common/SyncConflictManager';
// Enhanced Auth Components
import { EnhancedLogin } from './components/auth/EnhancedLogin';
import { EnhancedRegister } from './components/auth/EnhancedRegister';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ResetPassword } from './components/auth/ResetPassword';
// Error Boundary - Validates: Requirements 4.1, 4.4, 4.5
import { EnhancedErrorBoundary } from './components/common/EnhancedErrorBoundary';
import { useOfflineStore } from './stores/offlineStore';
import { useOfflineSync } from './hooks/useOfflineSync';
import { offlineSyncService } from './services/offlineSyncService';
import { networkReconnectionService } from './services/networkReconnectionService';
import { socketService } from './services/socketService';
import { useDarkMode } from './hooks/useDarkMode';
import { useFeatureFlagStore } from './stores/featureFlagStore';
import { usePageTracking } from './hooks/useAnalytics';
import { useCentralizedThemeStore } from './stores/centralizedThemeStore';
import { useEnhancedAuthStore } from './stores/enhancedAuthStore';
import AnimationProvider from './components/kawaii/AnimationProvider';
import TouchTargetValidator from './components/kawaii/TouchTargetValidator';
import { DynamicTypeProvider } from './providers/DynamicTypeProvider';
import { AriaAnnouncerProvider } from './providers/AriaAnnouncerProvider';
import './i18n/config';

// Component to track page views
function PageTracker() {
  const location = useLocation();
  usePageTracking(location.pathname);
  return null;
}

function App() {
  const initializeOffline = useOfflineStore((state) => state.initialize);
  const initializeABTest = useFeatureFlagStore((state) => state.initializeABTest);
  const { loadSystemTheme, loadUserTheme } = useCentralizedThemeStore();
  const { isAuthenticated, accessToken } = useEnhancedAuthStore();
  const [authRestored, setAuthRestored] = useState(false);
  
  // Enable automatic offline sync
  useOfflineSync();
  
  // Initialize dark mode (this will apply saved preference or system preference)
  useDarkMode();

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      console.log('🔌 Initializing socket connection with auth token');
      socketService.connect(accessToken);
    } else {
      console.log('🔌 Disconnecting socket - not authenticated');
      socketService.disconnect();
    }
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize offline store on app load
      initializeOffline();
      
      // Initialize A/B testing (only runs once per user)
      initializeABTest();
      
      // Initialize auto-sync for offline changes
      offlineSyncService.initializeAutoSync();
      
      // Wait a bit for auth to restore before loading theme
      // This prevents theme API 401 from triggering logout
      await new Promise(resolve => setTimeout(resolve, 500));
      setAuthRestored(true);
      
      // Initialize centralized theme system (non-blocking)
      try {
        await loadSystemTheme();
        // After system theme loads, load user's personal theme preference
        await loadUserTheme();
      } catch (err) {
        console.warn('Theme loading failed, using defaults:', err);
      }
    };
    
    initializeApp();
    
    // FORCE LIGHT MODE - Remove dark class if it exists
    document.documentElement.classList.remove('dark');
    localStorage.setItem('journo-dark-mode', 'light');
    
    // Watch for any attempts to add dark class and remove it
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const root = document.documentElement;
          if (root.classList.contains('dark')) {
            root.classList.remove('dark');
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => {
      observer.disconnect();
    };
  }, []); // Empty deps - only run once on mount

  return (
    // Wrap entire app with EnhancedErrorBoundary
    // Validates: Requirements 4.1 - JavaScript error catching with user-friendly messages
    // Validates: Requirements 4.4 - Recovery options for errors
    // Validates: Requirements 4.5 - Secure error logging without sensitive data
    <EnhancedErrorBoundary
      showErrorDetails={import.meta.env.DEV}
      onError={(error, errorInfo) => {
        // Additional error handling can be added here
        // e.g., send to analytics, show toast notification, etc.
        console.error('App-level error caught:', error, errorInfo);
      }}
    >
      <AriaAnnouncerProvider>
        <DynamicTypeProvider minScale={0.82} maxScale={2.0}>
          <AnimationProvider>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-gray-900 dark:text-white">Loading...</div>
            </div>
          }>
            <Router>
            {/* Scroll to top on route change */}
            <ScrollToTop />
            
            {/* Skip links for keyboard navigation */}
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <PageTracker />
            
            {/* PWA Components */}
            <OfflineStatus />
            <PWAUpdateNotification />
            <PWAInstallPrompt />
            
            {/* Global Notifications */}
            <GlobalNotifications />
            
            {/* Sync Conflict Resolution */}
            <SyncConflictManager />
            
            {/* Touch Target Validator (Development Only) - DISABLED */}
            {/* <TouchTargetValidator /> */}
            
            <SyncStatus />
            <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Enhanced Authentication Routes */}
            <Route path="/auth/login" element={<EnhancedLogin />} />
            <Route path="/auth/register" element={<EnhancedRegister />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            
            {/* Legacy Auth Routes (for backward compatibility) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public routes */}
            <Route path="/community" element={<CommunityBlog />} />
            <Route path="/t/:token" element={<SharedTrip />} />
            <Route path="/badge-demo" element={<BadgeDemo />} />
            <Route path="/kawaii-demo" element={<KawaiiDemo />} />
            <Route path="/sticker-demo" element={<StickerCanvasDemo />} />
            <Route path="/help" element={<Help />} />
            <Route path="/feedback" element={<Feedback />} />
            
            {/* Profile routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            
            {/* Settings route */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            
            {/* Privacy route */}
            <Route
              path="/privacy"
              element={
                <ProtectedRoute>
                  <Privacy />
                </ProtectedRoute>
              }
            />
            
            {/* Trip Schedule Screen - Kawaii-style */}
            <Route
              path="/trips/:id/schedule"
              element={
                <ProtectedRoute>
                  <ScheduleScreen />
                </ProtectedRoute>
              }
            />
            
            {/* Trip Booking Screen - Kawaii-style */}
            <Route
              path="/trips/:id/booking"
              element={
                <ProtectedRoute>
                  <BookingScreen />
                </ProtectedRoute>
              }
            />
            
            {/* Trip Shopping Screen - Kawaii-style */}
            <Route
              path="/trips/:id/shopping"
              element={
                <ProtectedRoute>
                  <ShoppingScreen />
                </ProtectedRoute>
              }
            />
            
            {/* Trip Checklist Screen - Kawaii-style */}
            <Route
              path="/trips/:id/checklist"
              element={
                <ProtectedRoute>
                  <ChecklistScreen />
                </ProtectedRoute>
              }
            />
            
            {/* Trip Members Screen - Kawaii-style */}
            <Route
              path="/trips/:id/members"
              element={
                <ProtectedRoute>
                  <MembersScreen />
                </ProtectedRoute>
              }
            />
            
            {/* Trip Budget Screen - Kawaii-style */}
            <Route
              path="/trips/:id/budget"
              element={
                <ProtectedRoute>
                  <BudgetPage />
                </ProtectedRoute>
              }
            />
            
            {/* Trip Settings Screen - Kawaii-style */}
            <Route
              path="/trips/:id/settings"
              element={
                <ProtectedRoute>
                  <TripSettingsScreen />
                </ProtectedRoute>
              }
            />
            
            {/* Trip routes - Kawaii-style UI (default) */}
            <Route
              path="/trip/:id"
              element={
                <ProtectedRoute>
                  <KawaiiTripDetail />
                </ProtectedRoute>
              }
            />
            
            {/* Kawaii Trip Sub-screens */}
            <Route
              path="/trip/:id/booking"
              element={
                <ProtectedRoute>
                  <BookingScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trip/:id/shopping"
              element={
                <ProtectedRoute>
                  <ShoppingScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trip/:id/checklist"
              element={
                <ProtectedRoute>
                  <ChecklistScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trip/:id/members"
              element={
                <ProtectedRoute>
                  <MembersScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trip/:id/settings"
              element={
                <ProtectedRoute>
                  <TripSettingsScreen />
                </ProtectedRoute>
              }
            />
            
            {/* Trip routes - Original Funliday-style UI (legacy) */}
            <Route
              path="/trip/:id/legacy"
              element={
                <ProtectedRoute>
                  <TripPlanner />
                </ProtectedRoute>
              }
            />
            
            {/* Packing page route */}
            <Route
              path="/trips/:tripId/packing"
              element={
                <ProtectedRoute>
                  <PackingPage />
                </ProtectedRoute>
              }
            />
            
            {/* Protected routes example */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Dashboard (Protected)
                    </h1>
                  </div>
                </ProtectedRoute>
              }
            />
            
            {/* Admin routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </Suspense>
          </AnimationProvider>
        </DynamicTypeProvider>
      </AriaAnnouncerProvider>
    </EnhancedErrorBoundary>
  );
}

export default App;
