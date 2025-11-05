// src/utils/notifications.js

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission() {
  console.log('🔔 Requesting notification permission...');
  
  if (!('Notification' in window)) {
    console.error('❌ This browser does not support notifications');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission already granted');
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('⚠️ Notification permission was denied');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('📱 Notification permission response:', permission);
    return permission;
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Wait for service worker to be ready and active
 */
async function waitForServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('❌ Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Wait a bit for the controller to be available
    if (!navigator.serviceWorker.controller) {
      console.log('⏳ Waiting for service worker controller...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!navigator.serviceWorker.controller) {
      console.error('❌ Service Worker controller not available');
      return null;
    }

    console.log('✅ Service Worker is ready and active');
    return registration;
  } catch (error) {
    console.error('❌ Error waiting for service worker:', error);
    return null;
  }
}

/**
 * Send a notification via Service Worker
 */
export async function sendServiceWorkerNotification({ title, body, icon, tag }) {
  console.log('📤 Attempting to send notification:', { title, body });

  // Check notification permission
  if (Notification.permission !== 'granted') {
    console.warn('⚠️ Notification permission not granted:', Notification.permission);
    return false;
  }

  // Wait for service worker to be ready
  const registration = await waitForServiceWorker();
  if (!registration) {
    console.error('❌ Service Worker not ready');
    return false;
  }

  try {
    // Send message to service worker
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title: title,
      body: body,
      icon: icon || '/icons/vite.svg',
      tag: tag || 'striven-notification'
    });

    console.log('✅ Notification message sent to service worker');
    return true;
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return false;
  }
}

/**
 * Send tracking progress notification
 */
export function sendTrackingNotification({ steps, distance, calories, formattedTime }) {
  console.log('📊 Sending tracking notification...');
  
  const body = `🦶 ${steps.toLocaleString()} steps\n📏 ${distance.toFixed(2)} km\n🔥 ${Math.round(calories)} kcal\n⏱️ ${formattedTime}`;
  
  return sendServiceWorkerNotification({
    title: '🏃 Striven - Tracking Active',
    body: body,
    tag: 'tracking-progress'
  });
}

/**
 * Send milestone notification
 */
export function sendMilestoneNotification(milestone) {
  console.log('🎉 Sending milestone notification:', milestone);
  
  let body = '';
  let title = '🎉 Achievement Unlocked!';

  if (milestone.type === 'steps') {
    body = `You've reached ${milestone.value.toLocaleString()} steps! Keep going! 💪`;
  } else if (milestone.type === 'distance') {
    body = `Amazing! You've walked ${milestone.value} km! 🚶‍♂️`;
  } else if (milestone.type === 'time') {
    body = `You've been active for ${milestone.value} minutes! ⏱️`;
  }

  return sendServiceWorkerNotification({
    title: title,
    body: body,
    tag: 'milestone-' + milestone.type
  });
}

/**
 * Test notification to verify it's working
 */
export async function sendTestNotification() {
  console.log('🧪 Sending test notification...');
  
  return sendServiceWorkerNotification({
    title: '🧪 Test Notification',
    body: 'If you can see this, notifications are working! 🎉',
    tag: 'test-notification'
  });
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsEnabled() {
  const enabled = (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    Notification.permission === 'granted'
  );
  
  console.log('🔍 Notifications enabled:', enabled);
  return enabled;
}