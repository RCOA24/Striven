import React, { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { sendTrackingNotification } from '../utils/notifications';
import { Footprints, Flame, Clock, Target, Activity, Check } from 'lucide-react';
import { db } from '../utils/db';

// Step Counter Component with Circular Progress
const StepCounter = ({ steps, goal }) => {
  const percentage = Math.min((steps / goal) * 100, 100);
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 mx-auto mb-6 sm:mb-8">
      <svg className="transform -rotate-90 w-full h-full filter drop-shadow-2xl" viewBox="0 0 320 320">
        <circle cx="160" cy="160" r={radius + 10} stroke="rgba(34, 197, 94, 0.1)" strokeWidth="2" fill="none" />
        <circle cx="160" cy="160" r={radius} stroke="rgba(255, 255, 255, 0.08)" strokeWidth="20" fill="none" />
        <circle
          cx="160" cy="160" r={radius}
          stroke="url(#progressGradient)" strokeWidth="20" fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" className="transition-all duration-1000 ease-out"
          style={{ filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 sm:p-4 rounded-full mb-2 sm:mb-3 shadow-lg">
          <Footprints className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
        </div>
        <div className="text-4xl sm:text-6xl font-bold text-white mb-1 sm:mb-2 tracking-tight">
          {steps.toLocaleString()}
        </div>
        <div className="text-base sm:text-lg text-white/80 font-medium mb-1">steps</div>
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-3 sm:px-4 py-1 sm:py-1.5">
          <Target className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
          <span className="text-xs sm:text-sm text-white/70 font-medium">
            {percentage.toFixed(0)}% of {goal >= 1000 ? `${(goal / 1000).toFixed(0)}K` : goal} goal
          </span>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon: Icon, label, value, gradient }) => (
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl blur-sm group-hover:blur-md transition-all"></div>
    <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-white/30 transition-all hover:scale-105 transform duration-200">
      <div className={`bg-gradient-to-br ${gradient} p-3 rounded-xl mb-3 w-fit shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/60 font-medium">{label}</div>
    </div>
  </div>
);

// Control Button Component
const ControlButton = ({ onClick, children, variant = 'primary', icon: Icon, disabled }) => {
  const variants = {
    primary: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl shadow-green-500/40 hover:shadow-2xl hover:shadow-green-500/50",
    secondary: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/20 hover:border-white/30",
    danger: "bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-100 backdrop-blur-xl border border-red-400/30 hover:border-red-400/50",
    success: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-4 rounded-2xl font-semibold text-base transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 active:scale-95 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span>{children}</span>
    </button>
  );
};

const Dashboard = ({
  steps, isTracking, isPaused, distance, calories, formattedTime,
  startTracking, pauseTracking, resumeTracking, reset, stopAndSave
}) => {
  // Default daily goal (will be overridden by weekly goal / 7)
  const defaultDailyGoal = 10000;

  // Fetch goals from Dexie in real-time
  const goalsFromDb = useLiveQuery(
    () => db.goals.toArray(),
    []
  );

  // Get the steps goal and calculate daily target
  const getDailyStepsGoal = () => {
    if (!goalsFromDb) return defaultDailyGoal;

    const stepsGoal = goalsFromDb.find(g => g.type === 'steps');
    if (stepsGoal && stepsGoal.target) {
      // Weekly goal divided by 7 for daily target
      return Math.round(stepsGoal.target / 7);
    }

    return defaultDailyGoal;
  };

  const dailyStepsGoal = getDailyStepsGoal();

  // Send real-time stats to service worker for notification
  useEffect(() => {
    if (isTracking && !isPaused) {
      sendTrackingNotification({ steps, distance, calories, formattedTime });
    }
  }, [steps, distance, calories, formattedTime, isTracking, isPaused]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Card */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
        {/* Step Counter with Circular Progress */}
        <StepCounter steps={steps} goal={dailyStepsGoal} />

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {!isTracking ? (
            <ControlButton onClick={startTracking} variant="primary" icon={Footprints}>
              Start Tracking
            </ControlButton>
          ) : isPaused ? (
            <>
              <ControlButton onClick={resumeTracking} variant="primary" icon={Footprints}>
                Resume
              </ControlButton>
              <ControlButton onClick={stopAndSave} variant="success" icon={Check} disabled={steps === 0}>
                Finish
              </ControlButton>
              <ControlButton onClick={reset} variant="danger" icon={Activity}>
                Reset
              </ControlButton>
            </>
          ) : (
            <>
              <ControlButton onClick={pauseTracking} variant="secondary" icon={Clock}>
                Pause
              </ControlButton>
              <ControlButton onClick={stopAndSave} variant="success" icon={Check} disabled={steps === 0}>
                Finish
              </ControlButton>
              <ControlButton onClick={reset} variant="danger" icon={Activity}>
                Reset
              </ControlButton>
            </>
          )}
        </div>

        {/* Status Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-md rounded-full px-6 py-3 border border-white/10">
            <span className={`w-3 h-3 rounded-full ${
              isTracking && !isPaused ? 'bg-green-400 animate-pulse' :
              isPaused ? 'bg-yellow-400' : 'bg-white/40'
            }`}></span>
            <span className="text-white/80 text-sm font-medium">
              {isTracking && !isPaused && 'Tracking Active'}
              {isTracking && isPaused && 'Paused'}
              {!isTracking && 'Ready to Start'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6">
        <p className="text-white/50 text-sm">
          Developed by Rodney Austria
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
