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
import { onAuthStateChange, getSession, handleAuthCallback } from './services/authService'; // NEW: Auth service

// CREATE CONTEXT
export const AppContext = createContext();

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard'); // ← 'organizer' for power mode
  
  // Always show intro on every app load
  const [showIntro, setShowIntro] = useState(true);
  
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

    // Safety timeout - ensure authLoading is set to false after 3 seconds max
    authTimeout = setTimeout(() => {
      if (mounted) {
        console.log('Auth timeout - showing app');
        setAuthLoading(false);
      }
    }, 3000);

    // Initialize auth: handle PKCE callback and check for existing session
    const initAuth = async () => {
      try {
        // Step 1: Handle PKCE callback if returning from OAuth provider (quick check)
        const { session: callbackSession, error: callbackError } = await handleAuthCallback();
        if (callbackError) {
          console.warn('Auth callback error (may be expected on first load):', callbackError.message);
        }

        const activeSession = callbackSession;
        
        if (mounted) {
          setSession(activeSession);
          if (activeSession?.user) {
            setUser({
              id: activeSession.user.id,
              email: activeSession.user.email,
              name: activeSession.user.user_metadata?.full_name || 
                    activeSession.user.user_metadata?.name,
              avatar: activeSession.user.user_metadata?.avatar_url || 
                      activeSession.user.user_metadata?.picture
            });
          }
          setAuthLoading(false);
          clearTimeout(authTimeout);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth changes
    const subscription = onAuthStateChange((event, newSession, userData) => {
      if (!mounted) return;

      console.log('Auth state changed:', event);
      setSession(newSession);
      setUser(userData);
      setAuthLoading(false);

      // Handle specific events
      if (event === 'SIGNED_IN') {
        showNotification({
          type: 'success',
          title: 'Welcome back!',
          message: `Signed in as ${userData?.name || userData?.email}`,
          duration: 3000
        });
        
        // SPRINT 2: Sync data to cloud when user logs in (only once per session)
        if (userData && !hasSyncedAfterSignIn) {
          setHasSyncedAfterSignIn(true);
          import('./services/syncService').then((module) => {
            module.syncToCloud(userData).then(({ success, error, isCooldown }) => {
              if (success) {
                console.log('✅ Data synced to cloud automatically');
                showNotification({
                  type: 'success',
                  title: 'Data Synced',
                  message: 'Your score has been uploaded',
                  duration: 2000,
                });
              } else if (isCooldown) {
                console.log('⚠️ Sync cooldown active:', error?.message);
              } else if (error) {
                console.error('⚠️ Sync failed:', error.message);
              }
            });
          }).catch(err => console.error('Failed to load sync service:', err));
        }
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
        
        // SPRINT 2: Also sync on token refresh to keep cloud data fresh
        if (userData) {
          import('./services/syncService').then((module) => {
            module.syncToCloud(userData).then(({ success, error }) => {
              if (success) {
                console.log('✅ Data synced to cloud (token refresh)');
              }
            });
          }).catch(err => console.error('Failed to load sync service:', err));
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      subscription?.unsubscribe();
    };
  }, [showNotification, hasSyncedAfterSignIn]);

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

  // Handle intro completion
  const handleIntroComplete = () => {
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