import { useState, useCallback } from 'react';

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

export default useNotification;