import { useState, useCallback } from 'react';

// Custom hook for notification state management
const useNotification = () => {
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
    duration: 4000
  });

  const showNotification = useCallback(({ type = 'success', title, message, duration = 4000 }) => {
    setNotification({
      isVisible: true,
      type,
      title,
      message,
      duration
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  }, []);

  return {
    notification,
    showNotification,
    hideNotification
  };
};

// Utility to request Notification permissions
export function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(status => {
      console.log('Notification permission status:', status);
    });
  }
}

export default useNotification;
