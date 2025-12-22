// src/App.jsx
import React, { useState, createContext, useContext, useEffect } from 'react';
import { Activity } from 'lucide-react';
import useStrivenTracker from './hooks/useStrivenTracker'; // FIXED: New filename
import useNotifications from './hooks/useNotifications';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import ActivityPage from './pages/ActivityPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import ExerciseLibrary from './pages/ExerciseLibraryVisuals';
import WorkoutOrganizer from './pages/WorkoutOrganizer'; // ← Workout Organizer
import Notification from './components/Notifications';
import Intro from './components/Intro';
import { deleteActivity } from './utils/db';
import FoodScanner from './pages/FoodScanner'; // NEW: FoodScanner page
import CalorieCalculator from './pages/CalorieCalculator'; // NEW: Import Calculator
import Leaderboards from './pages/Leaderboards'; // NEW: Leaderboards
// Ensure the curly braces are present and the name is spelled exactly like this:
import { handleAuthCallback, onAuthStateChange } from './services/authService';
import { supabase } from './lib/supabaseClient';


// CREATE CONTEXT
export const AppContext = createContext();

// Helper functions for OAuth - defined outside component to avoid hook issues
const hasAuthCallback = () => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const queryParams = new URLSearchParams(window.location.search);
  return hashParams.has('access_token') || 
         hashParams.has('error') ||
         queryParams.has('code') ||
         queryParams.has('error');
};

const cleanAuthUrl = () => {
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
};

function App() {
  // Persist current page to restore after OAuth redirect
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      return localStorage.getItem('striven_last_page') || 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  });

  // Save page on change
  useEffect(() => {
    try {
      localStorage.setItem('striven_last_page', currentPage);
    } catch (e) {
      // Ignore storage errors
    }
  }, [currentPage]);
  
  // Intro logic: Show intro only if user has never completed it
  // Store completion in localStorage so it persists across sessions
  const [showIntro, setShowIntro] = useState(() => {
    // Skip intro if returning from OAuth (we'll show the app directly)
    if (hasAuthCallback()) return false;
    // Otherwise, check if user has completed intro before
    try {
      return localStorage.getItem('striven_intro_complete') !== 'true';
    } catch (e) {
      return true;
    }
  });
  
  // NEW: Auth State
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasSyncedAfterSignIn, setHasSyncedAfterSignIn] = useState(false);

  // Handle PWA Shortcuts & Deep Linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    if (pageParam) {
      setCurrentPage(pageParam);
      // Clean URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Move hooks that are needed by auth BEFORE the auth useEffect
  const {
    steps,
    isTracking,
    isPaused,
    distance,
    calories,
    formattedTime,
    sensorSupported,
    activities,
    weeklyStats,
    currentLocation,
    route,
    startTracking,
    pauseTracking,
    resumeTracking,
    reset,
    stopAndSave,
    refreshActivities,
    locationError,
  } = useStrivenTracker();

  const { notification, showNotification, hideNotification } = useNotifications();

  // NEW: Auth State Listener with PKCE Callback Handler
  useEffect(() => {
    let mounted = true;
    let authTimeout = null;
    let isProcessingCallback = hasAuthCallback();

    // Safety timeout - ensure authLoading is set to false after 2 seconds max
    authTimeout = setTimeout(() => {
      if (mounted && authLoading) {
        console.log('Auth timeout - showing app');
        setAuthLoading(false);
      }
    }, 2000);

    // Initialize auth: handle PKCE callback and check for existing session
    const initAuth = async () => {
      try {
        let activeSession = null;
        
        // Step 1: If returning from OAuth, exchange the code
        if (isProcessingCallback) {
          console.log('Processing OAuth callback...');
          const { session: callbackSession, error: callbackError } = await handleAuthCallback();
          
          if (callbackError) {
            console.warn('Auth callback error:', callbackError.message);
          } else {
            activeSession = callbackSession;
          }
          
          // Clean the URL immediately after processing
          cleanAuthUrl();
        } else {
          // Just get existing session
          const { data: { session } } = await supabase.auth.getSession();
          activeSession = session;
        }
        
        if (mounted) {
          if (activeSession?.user) {
            console.log('Setting user from session:', activeSession.user.id);
            setSession(activeSession);
            setUser({
              id: activeSession.user.id,
              email: activeSession.user.email,
              name: activeSession.user.user_metadata?.full_name || 
                    activeSession.user.user_metadata?.name,
              avatar: activeSession.user.user_metadata?.avatar_url || 
                      activeSession.user.user_metadata?.picture
            });
            
            // If this was an OAuth callback, show notification and auto-sync
            if (isProcessingCallback) {
              showNotification({
                type: 'success',
                title: 'Welcome back!',
                message: `Signed in as ${activeSession.user.user_metadata?.full_name || activeSession.user.email}`,
                duration: 3000
              });
              
              // Auto-sync after successful OAuth
              import('./services/syncService').then((module) => {
                module.syncToCloud().then(({ success }) => {
                  if (success) {
                    showNotification({
                      type: 'success',
                      title: 'Data Synced',
                      message: 'Your score has been uploaded',
                      duration: 2000,
                    });
                  }
                });
              }).catch(err => console.error('Failed to sync:', err));
            }
          } else {
            setSession(null);
            setUser(null);
          }
          
          setAuthLoading(false);
          clearTimeout(authTimeout);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          if (isProcessingCallback) {
            cleanAuthUrl();
          }
          setAuthLoading(false);
          clearTimeout(authTimeout);
        }
      }
    };

    initAuth();

    // Subscribe to auth changes (for sign out and token refresh)
    const subscription = onAuthStateChange((event, newSession, userData) => {
      if (!mounted) return;

      console.log('Auth state changed:', event);
      
      // Update state for all events
      setSession(newSession);
      setUser(userData);
      
      // Only show notifications for non-callback events
      // The callback flow handles its own notifications
      if (event === 'SIGNED_IN' && !isProcessingCallback) {
        showNotification({
          type: 'success',
          title: 'Welcome back!',
          message: `Signed in as ${userData?.name || userData?.email}`,
          duration: 3000
        });
      } else if (event === 'SIGNED_OUT') {
        setHasSyncedAfterSignIn(false);
        showNotification({
          type: 'info',
          title: 'Signed out',
          message: 'See you next time!',
          duration: 2000
        });
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Session refreshed automatically');
      }
    });

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      subscription?.unsubscribe();
    };
  }, [showNotification]);

  // Handle deleting an activity
  const handleDeleteActivity = async (activityId) => {
    try {
      await deleteActivity(activityId);
      await refreshActivities?.(); // Optional chain if exists
      showNotification({
        type: 'success',
        title: 'Activity Deleted',
        message: 'The activity has been removed from your history',
        duration: 3000
      });
    } catch (error) {
      console.error('Error deleting activity:', error);
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete the activity. Please try again.',
        duration: 3000
      });
    }
  };

  // Handle intro completion - persist to localStorage
  const handleIntroComplete = () => {
    try {
      localStorage.setItem('striven_intro_complete', 'true');
    } catch (e) {
      // Ignore storage errors
    }
    setShowIntro(false);
  };

  // Handle finish with notification
  const handleFinish = () => {
    if (steps > 0) {
      stopAndSave();
      showNotification({
        type: 'success',
        title: 'Activity Saved! 🎉',
        message: `${steps.toLocaleString()} steps • ${distance.toFixed(2)} km • ${Math.round(calories)} kcal`,
        duration: 5000
      });
      setTimeout(() => {
        setCurrentPage('activity');
      }, 1500);
    }
  };

  // Handle start
  const handleStart = () => {
    startTracking();
    showNotification({
      type: 'info',
      title: 'Tracking Started',
      message: 'Keep your phone with you while walking',
      duration: 3000
    });
  };

  // Navigate to stats
  const handleNavigateToStats = () => {
    setCurrentPage('stats');
  };

  // Intro screen
  if (showIntro) {
    return <Intro onComplete={handleIntroComplete} />;
  }

  // Loading state (handling auth redirect)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Sensor not supported
  if (!sensorSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 max-w-md text-center border border-white/20">
          <div className="bg-red-500/20 p-4 rounded-full w-fit mx-auto mb-6">
            <Activity className="w-12 h-12 text-red-300" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Sensor Not Available</h1>
          <p className="text-white/70 leading-relaxed">
            Motion sensors are required for step tracking. Please use a mobile device with accelerometer support.
          </p>
        </div>
      </div>
    );
  }

  // Render correct page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            steps={steps}
            isTracking={isTracking}
            isPaused={isPaused}
            distance={distance}
            calories={calories}
            formattedTime={formattedTime}
            startTracking={handleStart}
            pauseTracking={pauseTracking}
            resumeTracking={resumeTracking}
            reset={reset}
            stopAndSave={handleFinish}
            weeklyStats={weeklyStats}
            onNavigateToStats={handleNavigateToStats}
            currentLocation={currentLocation} // NEW
            route={route} // NEW
            locationError={locationError} // NEW
          />
        );
      case 'activity':
        return <ActivityPage activities={activities} onDeleteActivity={handleDeleteActivity} />;
      case 'stats':
        return <StatsPage weeklyStats={weeklyStats} activities={activities} />;
      case 'profile':
        return <ProfilePage activities={activities} weeklyStats={weeklyStats} user={user} />;
      case 'leaderboards': // NEW: Leaderboards
        return <Leaderboards />;
      case 'exercises':
        return <ExerciseLibrary />;
      case 'organizer':
        return <WorkoutOrganizer />;
      case 'food': // NEW
        return <FoodScanner />;
      case 'calculator': // NEW ROUTE
        return <CalorieCalculator />;
      default:
        return (
          <Dashboard
            steps={steps}
            isTracking={isTracking}
            isPaused={isPaused}
            distance={distance}
            calories={calories}
            formattedTime={formattedTime}
            startTracking={handleStart}
            pauseTracking={pauseTracking}
            resumeTracking={resumeTracking}
            reset={reset}
            stopAndSave={handleFinish}
            weeklyStats={weeklyStats}
            onNavigateToStats={handleNavigateToStats}
          />
        );
    }
  };

  return (
    <AppContext.Provider value={{ 
      currentPage, 
      setCurrentPage, 
      showNotification,
      user, // NEW: Expose user to all components
      session, // NEW: Expose session
      authLoading // NEW: Expose loading state
    }}>
      {/* Notification */}
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        duration={notification.duration}
      />

      {/* Main Layout + Page */}
      <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </MainLayout>
    </AppContext.Provider>
  );
}

export default App;