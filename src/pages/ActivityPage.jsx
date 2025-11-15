/**
 * Striven - Privacy-First Fitness Tracker
 * Copyright (c) 2025 Rodney Austria
 * Licensed under the MIT License
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Footprints,
  TrendingUp,
  Zap,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Target,
  Award,
  Flame,
  X,
} from 'lucide-react';
import LicenseModal from '../components/LicenseModal';

const GOAL_STEPS = 5;   // unified goal

/* -------------------------------------------------------------------------- */
/*                               ACTIVITY CARD                               */
/* -------------------------------------------------------------------------- */
const ActivityCard = ({ activity, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(activity.id);
    setShowDeleteConfirm(false);
  };

  const goalPercentage = Math.min((activity.steps / GOAL_STEPS) * 100, 100);
  const goalReached = activity.steps >= GOAL_STEPS;

  return (
    <>
      <div className="group relative animate-slideInUp">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="relative bg-gradient-to-br from-white/[0.12] to-white/[0.05] backdrop-blur-2xl rounded-3xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] transform">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl blur-md opacity-60"></div>
                  <div className="relative bg-gradient-to-br from-emerald-400 to-green-500 p-3 rounded-2xl">
                    <Footprints className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-white font-bold text-2xl">
                    {activity.steps.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/60 uppercase tracking-wider font-semibold">steps</div>
                </div>
              </div>

              {/* Goal Progress / Medal */}
              {goalReached ? (
                <div className="flex items-center justify-center space-x-3 py-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full blur-xl opacity-80 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-yellow-400 to-amber-600 p-3 rounded-full shadow-xl">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-yellow-400 font-bold text-lg">Goal Achieved!</div>
                    <div className="text-white/70 text-sm">10,000 steps completed</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white/10 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000 relative"
                      style={{ width: `${goalPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">{goalPercentage.toFixed(0)}% of daily goal</span>
                    <span className="text-white/50 text-xs">10,000 steps</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 hover:bg-red-500/20 rounded-xl transition-all group/delete ml-4 hover:scale-110"
              title="Delete activity"
            >
              <Trash2 className="w-5 h-5 text-white/40 group-hover/delete:text-red-400 transition-colors" />
            </button>
          </div>

          {/* Date & Time */}
          <div className="flex items-center space-x-2 mb-5 text-sm text-white/50">
            <Clock className="w-4 h-4" />
            <span>{formatDate(activity.date)}</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Distance */}
            <div className="relative group/stat">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-4 text-center border border-blue-400/20 hover:border-blue-400/40 transition-all">
                <div className="bg-gradient-to-br from-blue-400 to-cyan-500 p-2 rounded-xl w-fit mx-auto mb-2">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div className="text-white font-bold text-lg mb-1">{activity.distance.toFixed(2)}</div>
                <div className="text-white/50 text-xs uppercase tracking-wider font-semibold">km</div>
              </div>
            </div>

            {/* Calories */}
            <div className="relative group/stat">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl blur-lg opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-4 text-center border border-orange-400/20 hover:border-orange-400/40 transition-all">
                <div className="bg-gradient-to-br from-orange-400 to-red-500 p-2 rounded-xl w-fit mx-auto mb-2">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <div className="text-white font-bold text-lg mb-1">{Math.round(activity.calories)}</div>
                <div className="text-white/50 text-xs uppercase tracking-wider font-semibold">kcal</div>
              </div>
            </div>

            {/* Duration */}
            <div className="relative group/stat">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-lg opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-4 text-center border border-purple-400/20 hover:border-purple-400/40 transition-all">
                <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-2 rounded-xl w-fit mx-auto mb-2">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div className="text-white font-bold text-lg mb-1">{formatDuration(activity.duration)}</div>
                <div className="text-white/50 text-xs uppercase tracking-wider font-semibold">time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)}></div>

          <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl animate-scaleIn">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>

            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-2xl blur-xl opacity-60"></div>
                <div className="relative bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-2xl">
                  <Trash2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Delete Activity?</h3>
                <p className="text-white/60 text-sm">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm">Steps</span>
                <span className="text-white font-bold">{activity.steps.toLocaleString()}/(&#x27;)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Date</span>
                <span className="text-white font-medium text-sm">{formatDate(activity.date)}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold transition-all hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*                               CALENDAR VIEW                                */
/* -------------------------------------------------------------------------- */
const CalendarView = ({ activities, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysArray = [];

    const startWeekDay = firstDay.getDay();
    for (let i = 0; i < startWeekDay; i++) daysArray.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      daysArray.push(new Date(year, month, d));
    }
    return daysArray;
  }, [currentMonth]);

  const getActivitiesForDate = (date) => {
    if (!date) return [];
    return activities.filter(
      (a) => new Date(a.date).toDateString() === date.toDateString()
    );
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };
  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const isToday = (date) =>
    date && date.toDateString() === new Date().toDateString();

  const isSelected = (date) =>
    date && selectedDate && date.toDateString() === selectedDate.toDateString();

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative bg-gradient-to-br from-white/[0.12] to-white/[0.05] backdrop-blur-2xl rounded-3xl p-6 border border-white/20 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2.5 rounded-xl">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-bold text-xl">
              {currentMonth.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={previousMonth}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-all hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-all hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-bold text-white/60 py-2 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="aspect-square" />;

            const dayActs = getActivitiesForDate(date);
            const hasActivities = dayActs.length > 0;
            const totalSteps = dayActs.reduce((s, a) => s + a.steps, 0);
            const goalReached = totalSteps >= GOAL_STEPS;

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateSelect(date)}
                className={`
                  aspect-square rounded-xl p-2 transition-all relative transform hover:scale-110 flex flex-col items-center justify-center
                  ${isSelected(date)
                    ? 'bg-gradient-to-br from-purple-500-500 to-blue-500 text-white shadow-lg shadow-purple-500/50 scale-105'
                    : isToday(date)
                    ? 'bg-white/20 text-white border-2 border-white/50 font-bold'
                    : goalReached
                    ? 'bg-gradient-to-br from-yellow-500/40 to-amber-600/40 text-white border border-yellow-400/40 shadow-lg shadow-yellow-500/30 hover:from-yellow-500/50 hover:to-amber-600/50'
                    : hasActivities
                    ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 text-white border border-emerald-400/20 hover:from-emerald-500/30 hover:to-green-500/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <span className="text-sm font-semibold">{date.getDate()}</span>

                {/* Trophy or dot */}
                {hasActivities && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                    {goalReached ? (
                      <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400 blur-md opacity-70 animate-pulse" />
                        <Award className="relative w-4 h-4 text-yellow-300 drop-shadow-lg z-10" />
                      </div>
                    ) : (
                      <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-6 text-xs text-white/70">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-white/20 rounded-lg border-2 border-white/50"></div>
            <span className="font-medium">Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-br from-emerald-500/30 to-green-500/30 rounded-lg border border-emerald-400/30"></div>
            <span className="font-medium">Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 blur-sm opacity-70"></div>
              <Award className="w-4 h-4 text-yellow-400 relative z-10" />
            </div>
            <span className="font-medium">Goal Reached</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               MAIN PAGE                                    */
/* -------------------------------------------------------------------------- */
const ActivityPage = ({
  activities = [],
  onDeleteActivity,
  onRefresh,
}) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterMode, setFilterMode] = useState('all');
  const [showLicense, setShowLicense] = useState(false);

  const filteredActivities = useMemo(() => {
    if (filterMode === 'all' || !selectedDate) return activities;
    return activities.filter(
      (a) => new Date(a.date).toDateString() === selectedDate.toDateString()
    );
  }, [activities, selectedDate, filterMode]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setFilterMode('date');
  };

  const clearFilter = () => {
    setSelectedDate(null);
    setFilterMode('all');
  };

  const handleDelete = async (id) => {
    if (onDeleteActivity) {
      await onDeleteActivity(id);
      if (onRefresh) onRefresh();
    }
  };

  const totalSteps = filteredActivities.reduce((s, a) => s + a.steps, 0);
  const totalDistance = filteredActivities.reduce((s, a) => s + a.distance, 0);
  const totalCalories = filteredActivities.reduce((s, a) => s + a.calories, 0);

  return (
    <div className="min-h-screen w-full px-4 py-8 relative">
      {/* Animated BG blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="mb-8 animate-slideInDown">
          <div className="flex items-center space-x-4 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl blur-xl opacity-60"></div>
              <div className="relative bg-gradient-to-br from-emerald-400 to-green-500 p-4 rounded-3xl shadow-2xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-1">Activity History</h1>
              <p className="text-white/60 font-medium">Track your fitness journey</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {filteredActivities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-fadeIn">
            {/* Steps */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-white/[0.12] to-white/[0.05] backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-emerald-400/40 transition-all">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="bg-gradient-to-br from-emerald-400 to-green-500 p-2 rounded-xl">
                    <Footprints className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/60 text-sm font-semibold uppercase tracking-wider">Total Steps</span>
                </div>
                <div className="text-3xl font-bold text-white">{totalSteps.toLocaleString()}</div>
              </div>
            </div>

            {/* Distance */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-white/[0.12] to-white/[0.05] backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-blue-400/40 transition-all">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="bg-gradient-to-br from-blue-400 to-cyan-500 p-2 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/60 text-sm font-semibold uppercase tracking-wider">Distance</span>
                </div>
                <div className="text-3xl font-bold text-white">{totalDistance.toFixed(1)} km</div>
              </div>
            </div>

            {/* Calories */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-white/[0.12] to-white/[0.05] backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-orange-400/40 transition-all">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="bg-gradient-to-br from-orange-400 to-red-500 p-2 rounded-xl">
                    <Flame className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/60 text-sm font-semibold uppercase tracking-wider">Calories</span>
                </div>
                <div className="text-3xl font-bold text-white">{Math.round(totalCalories).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="animate-slideInUp">
          <CalendarView
            activities={activities}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </div>

        {/* Filter status */}
        {filterMode === 'date' && selectedDate && (
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl p-5 border border-purple-400/30 flex items-center justify-between animate-slideInUp">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-xl">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold">
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <button
              onClick={clearFilter}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 border border-white/20"
            >
              Show All
            </button>
          </div>
        )}

        {/* Activities list */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="bg-gradient-to-br from-white/[0.12] to-white/[0.05] backdrop-blur-2xl rounded-3xl p-16 border border-white/20 text-center animate-fadeIn">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/10 rounded-full blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-full">
                  <Footprints className="w-20 h-20 text-white/30" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {filterMode === 'date' ? 'No Activities on This Date' : 'No Activities Yet'}
              </h3>
              <p className="text-white/60 text-lg max-w-md mx-auto">
                {filterMode === 'date'
                  ? 'Select a different date or clear the filter to see all activities.'
                  : 'Start tracking your steps to see your activity history here!'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <Target className="w-7 h-7 text-emerald-400" />
                  <span>
                    {filteredActivities.length} {filteredActivities.length === 1 ? 'Activity' : 'Activities'}
                  </span>
                </h2>
              </div>

              {filteredActivities.map((act, idx) => (
                <div key={act.id} style={{ animationDelay: `${idx * 0.1}s` }}>
                  <ActivityCard activity={act} onDelete={handleDelete} />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-8">
          <button
            onClick={() => setShowLicense(true)}
            className="text-white/40 hover:text-white/60 text-sm font-medium transition-colors underline decoration-dotted"
          >
            © 2025 Rodney Austria - View License
          </button>
        </div>
      </div>

      <LicenseModal isOpen={showLicense} onClose={() => setShowLicense(false)} />
    </div>
  );
};

export default ActivityPage;