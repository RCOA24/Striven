import React, { useState } from 'react';
import { User, Award, TrendingUp, Zap, Download, Upload, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { exportData, importData, clearAllData } from '../utils/db';

const StatCard = ({ icon: Icon, label, value, gradient }) => (
  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
    <div className="flex items-center space-x-4">
      <div className={`bg-gradient-to-br ${gradient} p-4 rounded-xl shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-sm text-white/60 font-medium">{label}</div>
      </div>
    </div>
  </div>
);

const ProfilePage = ({ activities = [], weeklyStats = {} }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Calculate lifetime stats
  const lifetimeStats = {
    totalActivities: activities.length,
    totalSteps: activities.reduce((sum, a) => sum + (a.steps || 0), 0),
    totalDistance: activities.reduce((sum, a) => sum + (a.distance || 0), 0),
    totalCalories: activities.reduce((sum, a) => sum + (a.calories || 0), 0),
    averageSteps: activities.length > 0 
      ? Math.round(activities.reduce((sum, a) => sum + (a.steps || 0), 0) / activities.length)
      : 0,
  };

  // Handle data export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportData();
      
      // Create JSON file
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `striven-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('success', 'Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle data import
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!data.activities && !data.weeklyStats && !data.settings && !data.goals) {
        throw new Error('Invalid backup file format');
      }

      await importData(data);
      showNotification('success', 'Data imported successfully! Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Import failed:', error);
      showNotification('error', 'Failed to import data. Please check the file.');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle clear all data
  const handleClearAll = async () => {
    try {
      await clearAllData();
      setShowClearConfirm(false);
      showNotification('success', 'All data cleared! Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Clear all failed:', error);
      showNotification('error', 'Failed to clear data. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-3 rounded-2xl shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Profile</h1>
        </div>
        <p className="text-white/70 ml-14">Your fitness journey overview</p>
      </div>

      {/* Lifetime Stats */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <Award className="w-5 h-5 text-yellow-400" />
          <span>Lifetime Statistics</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            icon={TrendingUp}
            label="Total Activities"
            value={lifetimeStats.totalActivities}
            gradient="from-green-500 to-emerald-600"
          />
          <StatCard
            icon={Award}
            label="Total Steps"
            value={lifetimeStats.totalSteps.toLocaleString()}
            gradient="from-blue-500 to-cyan-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Distance"
            value={`${lifetimeStats.totalDistance.toFixed(2)} km`}
            gradient="from-purple-500 to-pink-600"
          />
          <StatCard
            icon={Zap}
            label="Total Calories"
            value={Math.round(lifetimeStats.totalCalories).toLocaleString()}
            gradient="from-orange-500 to-red-600"
          />
        </div>
        
        {lifetimeStats.totalActivities > 0 && (
          <div className="mt-6 bg-white/5 rounded-xl p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {lifetimeStats.averageSteps.toLocaleString()}
              </div>
              <div className="text-sm text-white/60">Average Steps per Activity</div>
            </div>
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-6">Data Management</h2>
        
        <div className="space-y-4">
          {/* Export Data */}
          <button
            onClick={handleExport}
            disabled={isExporting || activities.length === 0}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/20 p-3 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <Download className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <div className="text-white font-medium">Export Data</div>
                <div className="text-sm text-white/60">Download backup as JSON file</div>
              </div>
            </div>
            {isExporting && (
              <div className="text-white/60 text-sm">Exporting...</div>
            )}
          </button>

          {/* Import Data */}
          <label className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer group">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500/20 p-3 rounded-lg group-hover:bg-green-500/30 transition-colors">
                <Upload className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-left">
                <div className="text-white font-medium">Import Data</div>
                <div className="text-sm text-white/60">Restore from backup file</div>
              </div>
            </div>
            {isImporting && (
              <div className="text-white/60 text-sm">Importing...</div>
            )}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              disabled={isImporting}
            />
          </label>

          {/* Clear All Data */}
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={activities.length === 0}
            className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-red-500/20 p-3 rounded-lg group-hover:bg-red-500/30 transition-colors">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-left">
                <div className="text-white font-medium">Clear All Data</div>
                <div className="text-sm text-white/60">Delete all activities and stats</div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-4 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200/80">
              <strong>Tip:</strong> Export your data regularly to keep a backup. This ensures you won't lose your progress if you clear your data.
            </div>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-500/20 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Clear All Data?</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-white/70">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-white/60 space-y-1 text-sm">
                <li>{lifetimeStats.totalActivities} activities</li>
                <li>All weekly statistics</li>
                <li>All personal records</li>
                <li>Goal progress (settings will be kept)</li>
              </ul>
              <p className="text-red-400 font-medium text-sm">
                ⚠️ This action cannot be undone!
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Info */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center">
        <h3 className="text-white font-bold text-lg mb-2">Striven</h3>
        <p className="text-white/60 text-sm mb-2">Privacy-First Step Tracker</p>
        <p className="text-white/40 text-xs">
          All your data is stored locally on your device. We never collect or share your information.
        </p>
        <div className="mt-4 text-white/30 text-xs">
          Version 1.0.0
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
            notification.type === 'success'
              ? 'bg-green-500/20 border-green-500/30'
              : 'bg-red-500/20 border-red-500/30'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            )}
            <p className={`font-medium ${
              notification.type === 'success' ? 'text-green-100' : 'text-red-100'
            }`}>
              {notification.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;