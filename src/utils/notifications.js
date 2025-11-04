// src/utils/notifications.js

export function sendTrackingNotification({ steps, distance, calories, formattedTime }) {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      title: 'Tracking Active',
      body: `🦶 Steps: ${steps}\n📏 Distance: ${distance.toFixed(2)} km\n🔥 Calories: ${calories}\n⏱️ Time: ${formattedTime}`,
      steps
    });
  }
}
