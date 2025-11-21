/**
 * Striven - Privacy-First Fitness Tracker
 * Copyright (c) 2025 Rodney Austria
 * Licensed under the MIT License
 */

import React, { useState, useMemo } from 'react';
import { User, Award, TrendingUp, Zap, Download, Upload, Trash2, AlertTriangle, CheckCircle, XCircle, ChevronRight, Footprints, Flame } from 'lucide-react';
import { exportData, importData, clearAllData } from '../utils/db';
import LicenseModal from '../components/LicenseModal';

// Redesigned Stat Card based on attachment
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-[#1C1C1E] rounded-3xl p-5 relative overflow-hidden h-40 flex flex-col justify-between group">
    {/* Right side dark accent */}
    <div className="absolute top-0 right-0 w-[35%] h-full bg-black/20" />
    
    {/* Icon */}
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color} text-white shadow-lg z-10`}>
      <Icon className="w-6 h-6" />
    </div>

    {/* Text Content */}
    <div className="z-10">
      <div className="text-3xl font-bold text-white font-apple tracking-tight mb-1">{value}</div>
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-apple">{label}</div>
    </div>
  </div>
);

// iOS Style Settings Row
const SettingsRow = ({ icon: Icon, iconColor, label, subLabel, onClick, isDestructive, disabled, showChevron = true }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-between p-4 bg-zinc-900 active:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group first:rounded-t-xl last:rounded-b-xl border-b border-white/5 last:border-0`}
  >
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${iconColor}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-left">
        <div className={`font-medium text-base ${isDestructive ? 'text-red-500' : 'text-white'}`}>{label}</div>
        {subLabel && <div className="text-xs text-zinc-500">{subLabel}</div>}
      </div>
    </div>
    {showChevron && <ChevronRight className="w-5 h-5 text-zinc-600" />}
  </button>
);

const ProfilePage = ({ activities = [], weeklyStats = {} }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notification, setNotification] = useState(null); 
  const [showLicense, setShowLicense] = useState(false);

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Calculate lifetime stats - Memoized for performance
  const lifetimeStats = useMemo(() => ({
    totalActivities: activities.length,
    totalSteps: activities.reduce((sum, a) => sum + (a.steps || 0), 0),
    totalDistance: activities.reduce((sum, a) => sum + (a.distance || 0), 0),
    totalCalories: activities.reduce((sum, a) => sum + (a.calories || 0), 0),
    averageSteps: activities.length > 0 
      ? Math.round(activities.reduce((sum, a) => sum + (a.steps || 0), 0) / activities.length)
      : 0,
  }), [activities]);

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
      
      // Better validation - check if it's a valid Striven backup
      // Check for exportDate and appVersion OR at least one data table
      const hasValidStructure = (
        data.exportDate || 
        data.appVersion || 
        data.activities || 
        data.weeklyStats || 
        data.settings || 
        data.goals ||
        data.favorites ||
        data.todayWorkout ||
        data.workoutPlans ||
        data.exerciseLogs
      );

      if (!hasValidStructure) {
        throw new Error('Invalid backup file format');
      }

      console.log('Importing data:', {
        activities: data.activities?.length || 0,
        weeklyStats: data.weeklyStats?.length || 0,
        goals: data.goals?.length || 0,
        favorites: data.favorites?.length || 0,
        workoutPlans: data.workoutPlans?.length || 0,
        exerciseLogs: data.exerciseLogs?.length || 0
      });

      await importData(data);
      showNotification('success', 'Data imported successfully! Reloading...');
      
      // Reset the file input
      event.target.value = '';
      
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Import failed:', error);
      
      // More detailed error message
      let errorMessage = 'Failed to import data.';
      if (error.message.includes('Invalid backup')) {
        errorMessage = 'Invalid backup file format.';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Invalid JSON file.';
      } else {
        errorMessage = `Import error: ${error.message}`;
      }
      
      showNotification('error', errorMessage);
      
      // Reset the file input
      event.target.value = '';
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
    <div className="w-full max-w-3xl mx-auto pb-24">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700&display=swap');
        .font-apple { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      `}</style>

      {/* Header */}
      <div className="mb-8 px-4 pt-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-4xl font-bold text-white font-apple tracking-tight">Profile</h1>
        </div>
        <p className="text-zinc-400 font-medium font-apple">Your fitness journey overview</p>
      </div>

      {/* Lifetime Stats Grid */}
      <div className="px-4 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 font-apple">Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={TrendingUp}
            label="Activities"
            value={lifetimeStats.totalActivities}
            color="bg-emerald-500"
          />
          <StatCard
            icon={Footprints}
            label="Steps"
            value={lifetimeStats.totalSteps.toLocaleString()}
            color="bg-blue-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Distance"
            value={`${lifetimeStats.totalDistance.toFixed(1)} km`}
            color="bg-purple-500"
          />
          <StatCard
            icon={Flame}
            label="Calories"
            value={Math.round(lifetimeStats.totalCalories).toLocaleString()}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* Data Management - iOS List Style */}
      <div className="px-4 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 font-apple">Data Management</h2>
        
        <div className="flex flex-col rounded-xl overflow-hidden bg-zinc-900">
          {/* Export */}
          <SettingsRow 
            icon={Download}
            iconColor="bg-blue-500"
            label={isExporting ? "Exporting..." : "Export Data"}
            subLabel="Save backup to device"
            onClick={handleExport}
            disabled={isExporting || activities.length === 0}
          />

          {/* Import */}
          <div className="relative">
            <SettingsRow 
              icon={Upload}
              iconColor="bg-green-500"
              label={isImporting ? "Importing..." : "Import Data"}
              subLabel="Restore from backup"
              onClick={() => {}} // Handled by input
              disabled={isImporting}
            />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              disabled={isImporting}
            />
          </div>

          {/* Clear Data */}
          <SettingsRow 
            icon={Trash2}
            iconColor="bg-red-500"
            label="Clear All Data"
            subLabel="Permanently delete everything"
            onClick={() => setShowClearConfirm(true)}
            disabled={activities.length === 0}
            isDestructive
            showChevron={false}
          />
        </div>

        <div className="mt-3 px-2 flex items-start gap-2 text-xs text-zinc-500">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p>Export your data regularly to keep a backup. All data is stored locally on your device.</p>
        </div>
      </div>

      {/* App Info */}
      <div className="px-4 text-center">
        <div className="bg-zinc-900/50 rounded-xl p-6 border border-white/5">
          <h3 className="text-white font-bold text-lg mb-1 font-apple">Striven</h3>
          <p className="text-zinc-500 text-sm mb-4">Version 1.0.0</p>
          <button
            onClick={() => setShowLicense(true)}
            className="text-emerald-500 text-sm font-medium hover:underline"
          >
            License & Credits
          </button>
          <p className="text-zinc-600 text-xs mt-4">
            Privacy-First Fitness Tracker<br/>
            © 2025 Rodney Austria
          </p>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-xs w-full border border-white/10 shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-apple">Clear All Data?</h3>
            <p className="text-zinc-400 text-sm mb-6">
              This action cannot be undone. All activities, stats, and records will be permanently deleted.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleClearAll}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
              >
                Delete Everything
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl ${
            notification.type === 'success'
              ? 'bg-zinc-900/90 border-emerald-500/30 text-emerald-400'
              : 'bg-zinc-900/90 border-red-500/30 text-red-400'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="font-medium text-sm text-white">
              {notification.message}
            </p>
          </div>
        </div>
      )}

      <LicenseModal isOpen={showLicense} onClose={() => setShowLicense(false)} />
    </div>
  );
};

export default ProfilePage;