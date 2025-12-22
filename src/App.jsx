// src/App.jsx
import React, { useState, createContext, useEffect } from 'react';
import { Activity } from 'lucide-react';
import useStrivenTracker from './hooks/useStrivenTracker';
import useNotifications from './hooks/useNotifications';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import ActivityPage from './pages/ActivityPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import ExerciseLibrary from './pages/ExerciseLibraryVisuals';
import WorkoutOrganizer from './pages/WorkoutOrganizer';
import Notification from './components/Notifications';
import Intro from './components/Intro';
import { deleteActivity } from './utils/db';
import FoodScanner from './pages/FoodScanner';
import CalorieCalculator from './pages/CalorieCalculator';
import Leaderboards from './pages/Leaderboards';
import { supabase } from './lib/supabaseClient';

// CREATE CONTEXT
export const AppContext = createContext();

// Helper functions for OAuth - defined outside component to avoid issues
const hasAuthCallback = () => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const queryParams = new URLSearchParams(window.location.search);
  return hashParams.has('access_token') || 
         hashParams.has('error') ||
         queryParams.has('code') ||
         queryParams.has('error');
};

// Check if user was on leaderboards before OAuth redirect
const getPendingPage = () => {
  try {
    return localStorage.getItem('striven_pending_page');
  } catch { return null; }
};

const clearPendingPage = () => {
  try {
    localStorage.removeItem('striven_pending_page');
  } catch {}
};

const cleanAuthUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  if (url.hash) {
    url.hash = '';
  }
  window.history.replaceState({}, document.title, url.pathname);
};

function App() {
  // ============================================================
  // ALL HOOKS MUST BE DECLARED AT THE TOP - NO EARLY RETURNS ABOVE
  // ============================================================
  
  // Page state
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      return localStorage.getItem('striven_last_page') || 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  });

  // Intro state
  const [showIntro, setShowIntro] = useState(() => {
    if (hasAuthCallback()) return false;
    try {
      return localStorage.getItem('striven_intro_complete') !== 'true';
    } catch (e) {
      return true;
    }
  });
  
  // Auth state
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasSyncedAfterSignIn, setHasSyncedAfterSignIn] = useState(false);

  // CRITICAL: Custom hooks MUST be called unconditionally at the top level
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

  // Save page on change
  useEffect(() => {
    try {
      localStorage.setItem('striven_last_page', currentPage);
    } catch (e) {
      // Ignore storage errors
    }
  }, [currentPage]);

  // Handle PWA Shortcuts & Deep Linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    if (pageParam && !hasAuthCallback()) {
      setCurrentPage(pageParam);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Auth State Listener - SIMPLIFIED & BULLETPROOF
  useEffect(() => {
    let mounted = true;
    
    // Safety timeout - ALWAYS render app within 2 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && isInitializing) {
        console.warn('⚠️ Safety timeout - forcing render');
        setIsInitializing(false);
        setAuthLoading(false);
      }
    }, 2000);

    const initAuth = async () => {
      console.log('🔐 Starting auth initialization...');
      
      try {
        // Just get the current session - Supabase handles OAuth callback automatically
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Session error:', error.message);
        }
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('👤 User found:', session.user.id);
          setSession(session);
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture
          });
        } else {
          setSession(null);
          setUser(null);
        }
        
        // Check for pending page (from OAuth redirect)
        const pendingPage = getPendingPage();
        if (pendingPage) {
          console.log('📍 Restoring page:', pendingPage);
          setCurrentPage(pendingPage);
          clearPendingPage();
        }
        
        // Clean any auth params from URL
        cleanAuthUrl();
        
      } catch (error) {
        console.error('❌ Auth error:', error);
      } finally {
        if (mounted) {
          clearTimeout(safetyTimeout);
          setAuthLoading(false);
          setIsInitializing(false);
          console.log('✅ Auth ready');
        }
      }
    };

    initAuth();

    // Listen for auth changes (sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('🔔 Auth event:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setSession(session);
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture
        });
        
        // Restore pending page on sign-in
        const pendingPage = getPendingPage();
        if (pendingPage) {
          console.log('📍 Restoring page after sign-in:', pendingPage);
          setCurrentPage(pendingPage);
          clearPendingPage();
        }
        
        cleanAuthUrl();
        setIsInitializing(false);
        setAuthLoading(false);
        
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setHasSyncedAfterSignIn(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  // Handle deleting an activity
  const handleDeleteActivity = async (activityId) => {
    try {
      await deleteActivity(activityId);
      await refreshActivities?.();
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

  // Handle intro completion
  const handleIntroComplete = () => {
    try {
      localStorage.setItem('striven_intro_complete', 'true');
    } catch (e) {
      // Ignore
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
            currentLocation={currentLocation}
            route={route}
            locationError={locationError}
          />
        );
      case 'activity':
        return <ActivityPage activities={activities} onDeleteActivity={handleDeleteActivity} />;
      case 'stats':
        return <StatsPage weeklyStats={weeklyStats} activities={activities} />;
      case 'profile':
        return <ProfilePage activities={activities} weeklyStats={weeklyStats} user={user} />;
      case 'leaderboards':
        return <Leaderboards />;
      case 'exercises':
        return <ExerciseLibrary />;
      case 'organizer':
        return <WorkoutOrganizer />;
      case 'food':
        return <FoodScanner />;
      case 'calculator':
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

  // ============================================================
  // CONDITIONAL RENDERING - ALL HOOKS ARE ALREADY CALLED ABOVE
  // ============================================================

  // Loading screen while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading Striven...</p>
        </div>
      </div>
    );
  }

  // Intro screen
  if (showIntro) {
    return <Intro onComplete={handleIntroComplete} />;
  }

  // Secondary loading state
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

  // Main app render
  return (
    <AppContext.Provider value={{ 
      currentPage, 
      setCurrentPage, 
      showNotification,
      user,
      session,
      authLoading
    }}>
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        duration={notification.duration}
      />

      <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </MainLayout>
    </AppContext.Provider>
  );
}

export default App;
