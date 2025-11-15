/**
 * Striven - Privacy-First Fitness Tracker
 * Copyright (c) 2025 Rodney Austria
 * Licensed under the MIT License
 */

import React, { useState } from 'react';
import { Footprints, Flame, Clock, Target, Activity, Check, Play, Pause, RotateCcw, ChevronRight, TrendingUp, Award } from 'lucide-react';
import LicenseModal from '../components/LicenseModal';

// Step Counter Component with Modern Circular Progress
const StepCounter = ({ steps, goal }) => {
  const percentage = Math.min((steps / goal) * 100, 100);
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-full aspect-square max-w-[300px] mx-auto mb-8">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 blur-2xl animate-pulse-slow"></div>
      
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 300 300">
        {/* Background track */}
        <circle 
          cx="150" cy="150" r={radius} 
          stroke="rgba(255, 255, 255, 0.05)" 
          strokeWidth="16" 
          fill="none" 
        />

        
        
        {/* Progress circle */}
        <circle
          cx="150" cy="150" r={radius}
          stroke="url(#modernGradient)" 
          strokeWidth="16" 
          fill="none"
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" 
          className="transition-all duration-1000 ease-out"
          style={{ filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.8))' }}
        />
        
        {/* Inner decorative ring */}
        <circle 
          cx="150" cy="150" r={radius - 30} 
          stroke="rgba(255, 255, 255, 0.03)" 
          strokeWidth="1" 
          fill="none"
          strokeDasharray="4 4"
        />
        
        <defs>
          <linearGradient id="modernGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative mb-3">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full blur-lg opacity-60"></div>
          <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-full shadow-2xl">
            <Footprints className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <div className="text-5xl font-bold text-white mb-1 tracking-tight">
          {steps.toLocaleString()}
        </div>
        <div className="text-sm text-white/60 font-semibold uppercase tracking-wider mb-3">steps today</div>
        
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-white/80 font-semibold">
            {percentage.toFixed(0)}% of {goal >= 1000 ? `${(goal / 1000).toFixed(0)}K` : goal}
          </span>
        </div>
      </div>
    </div>
  );
};

// Modern Metric Card Component
const MetricCard = ({ icon: Icon, label, value, gradient, trend }) => (
  <div className="group relative">
    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 from-white/10 to-transparent rounded-2xl blur-xl transition-all duration-500"></div>
    <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300 hover-lift">
      <div className="flex items-start justify-between mb-3">
        <div className={`bg-gradient-to-br ${gradient} p-3 rounded-xl shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className="flex items-center space-x-1 bg-emerald-500/20 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-semibold">{trend}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-white/50 font-medium uppercase tracking-wider">{label}</div>
    </div>
  </div>
);

// Modern Control Button Component
const ControlButton = ({ onClick, children, variant = 'primary', icon: Icon, disabled, isMain }) => {
  const variants = {
    primary: "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl shadow-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/60 border-0",
    secondary: "bg-white/[0.08] hover:bg-white/[0.12] text-white backdrop-blur-xl border border-white/20 hover:border-white/30 shadow-lg",
    danger: "bg-gradient-to-r from-red-500/30 to-rose-500/30 hover:from-red-500/40 hover:to-rose-500/40 text-white backdrop-blur-xl border border-red-400/40 hover:border-red-400/60",
    success: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/60 border-0"
  };

  const sizeClasses = isMain 
    ? "py-5 text-base font-bold" 
    : "py-3.5 text-sm font-semibold";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-2.5 transform hover:scale-105 active:scale-95 ${variants[variant]} ${sizeClasses} ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
    >
      {Icon && <Icon className={`${isMain ? 'w-6 h-6' : 'w-5 h-5'}`} />}
      <span>{children}</span>
    </button>
  );
};

// Stats Summary Card
const StatsSummary = ({ steps, goal }) => {
  const percentage = Math.min((steps / goal) * 100, 100);
  const isGoalReached = steps >= goal;
  
  return (
    <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-2xl p-5 border border-white/10 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2.5 rounded-xl">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm text-white/50 font-medium uppercase tracking-wider">Daily Progress</div>
            <div className="text-lg font-bold text-white">{percentage.toFixed(0)}% Complete</div>
          </div>
        </div>
        {isGoalReached && (
          <div className="bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-400/30">
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Goal Reached!</span>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ 
  steps = 0, 
  isTracking = false, 
  isPaused = false, 
  distance = 0, 
  calories = 0, 
  formattedTime = "00:00:00",
  startTracking = () => {}, 
  pauseTracking = () => {}, 
  resumeTracking = () => {}, 
  reset = () => {}, 
  stopAndSave = () => {},
  weeklyStats = { totalSteps: 0, activeDays: 0 },
  onNavigateToStats = () => {}
}) => {
  const dailyStepsGoal = 10000;
  const [showLicense, setShowLicense] = useState(false);

  // Calculate weekly average from total steps
  const weeklyAverage = weeklyStats.activeDays > 0 
    ? Math.round(weeklyStats.totalSteps / weeklyStats.activeDays)
    : 0;

  return (
    <div className="min-h-screen w-full px-4 py-8 relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-2xl mx-auto relative z-10">
      

        {/* Main Card */}
        <div className="glass-dark rounded-3xl shadow-2xl p-6 sm:p-8 mb-6 animate-slideInUp">
          {/* Step Counter */}
          <StepCounter steps={steps} goal={dailyStepsGoal} />

          {/* Stats Summary */}
          <StatsSummary steps={steps} goal={dailyStepsGoal} />

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <MetricCard 
              icon={Footprints} 
              label="Distance" 
              value={`${distance.toFixed(2)} km`}
              gradient="from-blue-500 to-cyan-600"
            />
            <MetricCard 
              icon={Flame} 
              label="Calories" 
              value={`${calories.toFixed(0)}`}
              gradient="from-orange-500 to-red-600"
            />
            <MetricCard 
              icon={Clock} 
              label="Active Time" 
              value={formattedTime}
              gradient="from-purple-500 to-pink-600"
            />
          </div>

          {/* Controls */}
          <div className="space-y-3 mb-6">
            {!isTracking ? (
              <div className="flex justify-center">
                <button
                  onClick={startTracking}
                  className="inline-flex items-center justify-center space-x-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl shadow-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/60 rounded-2xl px-8 py-5 text-base font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-6 h-6" />
                  <span>Start Tracking</span>
                </button>
              </div>
            ) : isPaused ? (
              <>
                <div className="flex justify-center">
                  <button
                    onClick={resumeTracking}
                    className="inline-flex items-center justify-center space-x-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl shadow-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/60 rounded-2xl px-8 py-5 text-base font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    <Play className="w-6 h-6" />
                    <span>Resume Tracking</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ControlButton onClick={stopAndSave} variant="success" icon={Check} disabled={steps === 0}>
                    Finish & Save
                  </ControlButton>
                  <ControlButton onClick={reset} variant="danger" icon={RotateCcw}>
                    Reset
                  </ControlButton>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <button
                    onClick={pauseTracking}
                    className="inline-flex items-center justify-center space-x-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-white backdrop-blur-xl border border-white/20 hover:border-white/30 shadow-lg rounded-2xl px-8 py-5 text-base font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    <Pause className="w-6 h-6" />
                    <span>Pause Tracking</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ControlButton onClick={stopAndSave} variant="success" icon={Check} disabled={steps === 0}>
                    Finish & Save
                  </ControlButton>
                  <ControlButton onClick={reset} variant="danger" icon={RotateCcw}>
                    Reset
                  </ControlButton>
                </div>
              </>
            )}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center space-x-3 bg-white/5 backdrop-blur-md rounded-full px-6 py-3 border border-white/10">
              <div className="relative">
                <span className={`block w-3 h-3 rounded-full ${
                  isTracking && !isPaused ? 'bg-emerald-400' : 
                  isPaused ? 'bg-yellow-400' : 'bg-white/40'
                }`}></span>
                {isTracking && !isPaused && (
                  <span className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </div>
              <span className="text-white/80 text-sm font-semibold">
                {isTracking && !isPaused && 'Tracking Active'}
                {isTracking && isPaused && 'Paused'}
                {!isTracking && 'Ready to Start'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="glass-dark rounded-2xl p-4 mb-6 animate-fadeIn">
          <button 
            onClick={onNavigateToStats}
            className="w-full flex items-center justify-between hover:bg-white/5 transition-all duration-300 rounded-xl p-1 group"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs text-white/50 font-medium">Weekly Average</div>
                <div className="text-sm font-bold text-white">
                  {weeklyAverage > 0 ? `${weeklyAverage.toLocaleString()} steps` : 'No data yet'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-white/60 group-hover:text-white transition-colors">
              <span className="text-sm font-medium">View Details</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={() => setShowLicense(true)}
            className="text-white/40 hover:text-white/60 text-xs font-medium transition-colors underline decoration-dotted"
          >
            © 2025 Rodney Austria - View License
          </button>
        </div>
      </div>

      <LicenseModal isOpen={showLicense} onClose={() => setShowLicense(false)} />
    </div>
  );
};

export default Dashboard;