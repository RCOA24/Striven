import React, { useState, useMemo } from 'react';
import { Calendar, Footprints, TrendingUp, Zap, Clock, Trash2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const ActivityCard = ({ activity, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleDelete = () => {
    onDelete(activity.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-white/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Footprints className="w-5 h-5 text-green-400" />
            <span className="text-white font-semibold text-lg">
              {activity.steps.toLocaleString()} steps
            </span>
          </div>
          <div className="text-sm text-white/60 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(activity.date)}</span>
          </div>
        </div>
        
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
          title="Delete activity"
        >
          <Trash2 className="w-5 h-5 text-white/50 group-hover:text-red-400 transition-colors" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-white font-bold text-sm">{activity.distance.toFixed(2)} km</div>
          <div className="text-white/50 text-xs">Distance</div>
        </div>
        
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Zap className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-white font-bold text-sm">{Math.round(activity.calories)}</div>
          <div className="text-white/50 text-xs">Calories</div>
        </div>
        
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-white font-bold text-sm">{formatDuration(activity.duration)}</div>
          <div className="text-white/50 text-xs">Duration</div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-sm w-full border border-white/20 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-500/20 p-3 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Activity?</h3>
            </div>
            
            <p className="text-white/70 mb-6">
              Are you sure you want to delete this activity? This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CalendarView = ({ activities, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysArray = [];

    // Add empty slots for days before month starts
    const startingDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysArray.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      daysArray.push(new Date(year, month, day));
    }

    return daysArray;
  }, [currentMonth]);

  const getActivitiesForDate = (date) => {
    if (!date) return [];
    return activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate.toDateString() === date.toDateString();
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-white/50 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {daysInMonth.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayActivities = getActivitiesForDate(date);
          const hasActivities = dayActivities.length > 0;
          const totalSteps = dayActivities.reduce((sum, a) => sum + a.steps, 0);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={`aspect-square rounded-lg p-1 transition-all relative ${
                isSelected(date)
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                  : isToday(date)
                  ? 'bg-white/20 text-white border-2 border-white/40'
                  : hasActivities
                  ? 'bg-green-500/30 text-white hover:bg-green-500/40'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <div className="text-sm font-medium">{date.getDate()}</div>
              {hasActivities && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-white/60">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-white/20 rounded border-2 border-white/40"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500/30 rounded"></div>
          <span>Has Activity</span>
        </div>
      </div>
    </div>
  );
};

const ActivityPage = ({ activities = [], onDeleteActivity, onRefresh }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'date'

  const filteredActivities = useMemo(() => {
    if (filterMode === 'all' || !selectedDate) {
      return activities;
    }

    return activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate.toDateString() === selectedDate.toDateString();
    });
  }, [activities, selectedDate, filterMode]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setFilterMode('date');
  };

  const clearFilter = () => {
    setSelectedDate(null);
    setFilterMode('all');
  };

  const handleDelete = async (activityId) => {
    if (onDeleteActivity) {
      await onDeleteActivity(activityId);
      if (onRefresh) {
        onRefresh();
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-2xl shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Activity History</h1>
        </div>
        <p className="text-white/70 ml-14">Track your fitness journey</p>
      </div>

      {/* Calendar */}
      <CalendarView
        activities={activities}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />

      {/* Filter Status */}
      {filterMode === 'date' && selectedDate && (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">
              Showing activities for {selectedDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
          <button
            onClick={clearFilter}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            Show All
          </button>
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/20 text-center">
            <Footprints className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {filterMode === 'date' ? 'No Activities on This Date' : 'No Activities Yet'}
            </h3>
            <p className="text-white/60">
              {filterMode === 'date' 
                ? 'Select a different date or clear the filter to see all activities.'
                : 'Start tracking your steps to see your activity history here!'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {filteredActivities.length} {filteredActivities.length === 1 ? 'Activity' : 'Activities'}
              </h2>
              <div className="text-sm text-white/60">
                {filteredActivities.reduce((sum, a) => sum + a.steps, 0).toLocaleString()} total steps
              </div>
            </div>
            
            {filteredActivities.map((activity) => (
              <ActivityCard 
                key={activity.id} 
                activity={activity}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;