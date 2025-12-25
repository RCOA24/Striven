import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Debug: Check Capacitor availability on app startup
console.log('\n🚀 ============ APP STARTUP ============');
console.log('🔍 Capacitor Detection:');
console.log('   - window.Capacitor exists:', !!window.Capacitor);
if (window.Capacitor) {
  console.log('   - Capacitor.getPlatform():', window.Capacitor.getPlatform());
  console.log('   - Capacitor.isNativePlatform():', window.Capacitor.isNativePlatform());
  console.log('   - Capacitor.isPluginAvailable(App):', window.Capacitor.isPluginAvailable('App'));
} else {
  console.log('   ⚠️ Capacitor NOT available - running as web app');
}
console.log('🌐 Current URL:', window.location.href);
console.log('=====================================\n');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)