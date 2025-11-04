import React, { useState, useEffect } from 'react';
import { Activity, Bell, BellOff } from 'lucide-react';
import useStriven from './hooks/useStriven';
import useNotifications from './hooks/useNotifications';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import ActivityPage from './pages/ActivityPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import Notification from './components/Notifications';
import Intro from './components/Intro';
import { deleteActivity } from './utils/db';
import { requestNotificationPermission } from './utils/notifications';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showIntro, setShowIntro] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // --- Service Worker Registration ---
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => {
          console.log('✅ Service Worker registered:', reg.scope);
          
          // Wait for service worker to be ready
          return navigator.serviceWorker.ready;
        })
        .then(() => {
          console.log('✅ Service Worker is ready');
          
          // Check current notification permission
          if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
            console.log('📱 Current notification permission:', Notification.permission);
          }
        })
        .catch(err => console.error('❌ Service Worker registration failed:', err));
    }
  }, []);
  // --- End Service Worker Registration ---

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
    startTracking,
    pauseTracking,
    resumeTracking,
    reset,
    stopAndSave,
    refreshActivities,
  } = useStriven();

  const { notification, showNotification, hideNotification } = useNotifications();

  const handleDeleteActivity = async (activityId) => {
    try {
      await deleteActivity(activityId);
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

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  // Handle finish button with notification
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

  // Handle start with notification permission request
  const handleStart = async () => {
    // Request notification permission if not granted
    if (notificationPermission !== 'granted') {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        showNotification({
          type: 'success',
          title: 'Notifications Enabled! 🔔',
          message: 'You\'ll receive updates while tracking',
          duration: 3000
        });
      } else {
        showNotification({
          type: 'warning',
          title: 'Notifications Disabled',
          message: 'Enable notifications in settings for background updates',
          duration: 4000
        });
      }
    }
    
    startTracking();
    showNotification({
      type: 'info',
      title: 'Tracking Started',
      message: 'Keep your phone with you while walking',
      duration: 3000
    });
  };

  // Manual notification permission request
  const handleRequestNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      showNotification({
        type: 'success',
        title: 'Notifications Enabled! 🔔',
        message: 'You\'ll receive tracking updates',
        duration: 3000
      });
    } else if (permission === 'denied') {
      showNotification({
        type: 'error',
        title: 'Permission Denied',
        message: 'Please enable notifications in your browser settings',
        duration: 4000
      });
    }
  };

  if (showIntro) {
    return <Intro onComplete={handleIntroComplete} />;
  }

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
          />
        );
      case 'activity':
        return (
          <ActivityPage 
            activities={activities}
            onDeleteActivity={handleDeleteActivity}
          />
        );
      case 'stats':
        return <StatsPage weeklyStats={weeklyStats} activities={activities} />;
      case 'profile':
        return <ProfilePage activities={activities} weeklyStats={weeklyStats} />;
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
          />
        );
    }
  };

  return (
    <>
      {/* Notification Permission Button */}
      {notificationPermission !== 'granted' && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleRequestNotifications}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all"
          >
            {notificationPermission === 'denied' ? (
              <>
                <BellOff className="w-4 h-4" />
                <span className="text-sm">Enable Notifications</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span className="text-sm">Enable Notifications</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Notification Component */}
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
    </>
  );
}

export default App;