// src/utils/notifications.js

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    console.log('Notification permission already granted');
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    console.log('Notification permission status:', permission);
    return permission;
  }

  return Notification.permission;
}

/**
 * Send a notification via Service Worker
 */
export function sendServiceWorkerNotification({ title, body, icon, tag }) {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    console.warn('Service Worker not available');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  navigator.serviceWorker.controller.postMessage({
    type: 'SHOW_NOTIFICATION',
    title: title,
    body: body,
    icon: icon || '/icons/vite.svg',
    tag: tag || 'striven-notification'
  });

  return true;
}

/**
 * Send tracking progress notification
 */
export function sendTrackingNotification({ steps, distance, calories, formattedTime }) {
  const body = `🦶 ${steps.toLocaleString()} steps • 📏 ${distance.toFixed(2)} km • 🔥 ${Math.round(calories)} kcal • ⏱️ ${formattedTime}`;
  
  return sendServiceWorkerNotification({
    title: 'Striven - Tracking Active',
    body: body,
    tag: 'tracking-progress'
  });
}

/**
 * Send milestone notification
 */
export function sendMilestoneNotification(milestone) {
  let body = '';
  let title = 'Achievement Unlocked! 🎉';

  if (milestone.type === 'steps') {
    body = `You've reached ${milestone.value.toLocaleString()} steps!`;
  } else if (milestone.type === 'distance') {
    body = `You've walked ${milestone.value} km!`;
  } else if (milestone.type === 'time') {
    body = `You've been active for ${milestone.value} minutes!`;
  }

  return sendServiceWorkerNotification({
    title: title,
    body: body,
    tag: 'milestone'
  });
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsEnabled() {
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    Notification.permission === 'granted'
  );
}