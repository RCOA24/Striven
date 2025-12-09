/**
 * Striven - Privacy-First Fitness Tracker
 * Copyright (c) 2025 Rodney Austria
 * Licensed under the MIT License
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Footprints, TrendingUp, Flame, Trash2,
  ChevronLeft, ChevronRight, MapPin, X // Added X
} from 'lucide-react';
import LicenseModal from '../components/LicenseModal';
import LiveMap from '../components/LiveMap'; // Import LiveMap

const GOAL_STEPS = 10000;

// --- Apple Design Constants ---
const COLORS = {
  bg: 'bg-black',
  card: 'bg-[#1c1c1e]',
  move: 'text-[#fa114f]',    // Red
  exercise: 'text-[#a4ff00]',// Green
  stand: 'text-[#00c7fc]',   // Blue
  gold: 'text-[#ffd60a]',    // Gold
  textSub: 'text-[#8e8e93]',
  border: 'border-[#2c2c2e]'
};

/* -------------------------------------------------------------------------- */
/*                             ACTIVITY CARD                                  */
/* -------------------------------------------------------------------------- */
const ActivityCard = ({ activity, onDelete, onViewMap }) => { // Added onViewMap prop
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const goalPercent = Math.min((activity.steps / GOAL_STEPS) * 100, 100);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        onClick={() => activity.hasGPS && onViewMap(activity)} // Click handler
        className={`relative ${COLORS.card} rounded-2xl p-5 h-full active:scale-[0.99] transition-transform touch-manipulation ${activity.hasGPS ? 'cursor-pointer hover:bg-zinc-800' : ''}`}
      >
        {/* Top Row: Icon & Date */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.hasGPS ? 'bg-emerald-500/20 text-emerald-500' : 'bg-[#a4ff00]/10 text-[#a4ff00]'}`}>
              {activity.hasGPS ? <MapPin size={20} fill="currentColor" /> : <Footprints size={20} fill="currentColor" />}
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">
                {activity.hasGPS ? 'Outdoor Run' : 'Walking'}
              </div>
              <div className={`${COLORS.textSub} text-xs font-medium`}>{formatDate(activity.date)}</div>
              
              {/* NEW: Display Location Names */}
              {activity.hasGPS && activity.startLocation && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
                  <MapPin size={10} />
                  <span className="truncate max-w-[150px]">
                    {activity.startLocation} {activity.endLocation && `➝ ${activity.endLocation}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="w-8 h-8 rounded-full bg-[#3a3a3c] flex items-center justify-center text-[#ff453a] active:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
           <div>
             <div className="text-2xl font-bold text-white font-mono tracking-tight tabular-nums">
               {activity.steps.toLocaleString()}
             </div>
             <div className={`${COLORS.textSub} text-[10px] font-bold uppercase tracking-wider`}>Steps</div>
           </div>
           <div>
             <div className="text-2xl font-bold text-[#fa114f] font-mono tracking-tight tabular-nums">
               {Math.round(activity.calories)}
             </div>
             <div className={`${COLORS.textSub} text-[10px] font-bold uppercase tracking-wider`}>KCAL</div>
           </div>
           <div>
             <div className="text-2xl font-bold text-[#00c7fc] font-mono tracking-tight tabular-nums">
               {activity.distance.toFixed(2)}
             </div>
             <div className={`${COLORS.textSub} text-[10px] font-bold uppercase tracking-wider`}>KM</div>
           </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#3a3a3c] h-1.5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${goalPercent}%` }}
            className="h-full bg-[#a4ff00] rounded-full"
          />
        </div>
      </motion.div>

      {/* Delete Confirmation Sheet */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className={`fixed bottom-0 left-0 right-0 ${COLORS.card} rounded-t-[2rem] p-6 z-[9999] border-t ${COLORS.border} safe-bottom`}
            >
              <h3 className="text-2xl font-bold text-white text-center mb-3">Delete Activity?</h3>
              <p className={`${COLORS.textSub} text-center text-base mb-8`}>This action cannot be undone.</p>
              
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => { onDelete(activity.id); setShowDeleteConfirm(false); }}
                  className="w-full py-4 bg-[#ff453a] rounded-xl font-bold text-white text-lg active:scale-95 transition-transform shadow-lg shadow-red-900/20 touch-manipulation"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-all touch-manipulation"
                >
                  Cancel
                </button>
              </div>
              
              {/* Safe area spacer for notch/home indicator */}
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
    for (let i = 0; i < firstDay.getDay(); i++) daysArray.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) daysArray.push(new Date(year, month, d));
    return daysArray;
  }, [currentMonth]);

  const isSelected = (d) => selectedDate && d && d.toDateString() === selectedDate.toDateString();
  const isToday = (d) => d && d.toDateString() === new Date().toDateString();

  const getDayStatus = (date) => {
    if (!date) return null;
    const dayActivities = activities.filter(a => new Date(a.date).toDateString() === date.toDateString());
    if (dayActivities.length === 0) return null;

    const totalSteps = dayActivities.reduce((acc, curr) => acc + curr.steps, 0);
    return totalSteps >= GOAL_STEPS ? 'goal' : 'active';
  };

  return (
    <div className={`${COLORS.card} rounded-[2rem] p-5 mb-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-xl font-bold text-white">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-1">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 rounded-full hover:bg-[#3a3a3c] text-[#a4ff00]">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 rounded-full hover:bg-[#3a3a3c] text-[#a4ff00]">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid Labels */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[10px] font-bold text-[#8e8e93] uppercase">{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {daysInMonth.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          
          const status = getDayStatus(date);
          const selected = isSelected(date);
          const today = isToday(date);
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={`
                relative h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${selected 
                  ? 'bg-white text-black scale-105 shadow-lg shadow-white/20' // CHANGED: White for selection
                  : today 
                    ? 'bg-[#ff453a] text-white' 
                    : 'text-white hover:bg-[#3a3a3c]'
                }
              `}
            >
              {date.getDate()}
              
              {/* Indicators (Only show if NOT selected to keep UI clean) */}
              {!selected && status === 'goal' && (
                 <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#ffd60a] shadow-[0_0_4px_#ffd60a]" />
              )}
              {!selected && status === 'active' && (
                 <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#a4ff00]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff453a]" />
          <span className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wide">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#a4ff00]" />
          <span className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wide">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ffd60a] shadow-[0_0_6px_rgba(255,214,10,0.5)]" />
          <span className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wide">Goal Reached</span>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               MAIN PAGE                                    */
/* -------------------------------------------------------------------------- */
const ActivityPage = ({ activities = [], onDeleteActivity, onRefresh }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showLicense, setShowLicense] = useState(false);
  const [selectedMapActivity, setSelectedMapActivity] = useState(null); // State for map modal

  const filteredActivities = useMemo(() => {
    if (!selectedDate) return activities;
    return activities.filter(a => new Date(a.date).toDateString() === selectedDate.toDateString());
  }, [activities, selectedDate]);

  const handleDelete = async (id) => {
    if (onDeleteActivity) {
      await onDeleteActivity(id);
      if (onRefresh) onRefresh();
    }
  };

  const stats = {
    steps: filteredActivities.reduce((s, a) => s + a.steps, 0),
    dist: filteredActivities.reduce((s, a) => s + a.distance, 0),
    cal: filteredActivities.reduce((s, a) => s + a.calories, 0)
  };

  return (
    <div className={`min-h-screen ${COLORS.bg} text-white font-sans pb-12`}>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Title Header */}
        <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tight text-white">History</h1>
            <p className={`${COLORS.textSub} font-medium`}>Your recent workouts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Stats & Calendar */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-8">
                {/* Summary Cards */}
                {filteredActivities.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <div className={`${COLORS.card} rounded-2xl p-3 flex flex-col justify-between min-h-[90px]`}>
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase text-[#8e8e93]">Steps</span>
                        <Footprints size={14} className={COLORS.exercise} />
                    </div>
                    <div className="text-xl font-bold font-mono tracking-tight tabular-nums">{stats.steps.toLocaleString()}</div>
                    </div>

                    <div className={`${COLORS.card} rounded-2xl p-3 flex flex-col justify-between min-h-[90px]`}>
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase text-[#8e8e93]">Dist</span>
                        <MapPin size={14} className={COLORS.stand} />
                    </div>
                    <div className="text-xl font-bold font-mono tracking-tight tabular-nums">{stats.dist.toFixed(1)}<span className="text-xs ml-0.5">km</span></div>
                    </div>

                    <div className={`${COLORS.card} rounded-2xl p-3 flex flex-col justify-between min-h-[90px]`}>
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase text-[#8e8e93]">Cals</span>
                        <Flame size={14} className={COLORS.move} />
                    </div>
                    <div className="text-xl font-bold font-mono tracking-tight tabular-nums">{Math.round(stats.cal)}</div>
                    </div>
                </div>
                )}

                {/* Calendar */}
                <CalendarView 
                activities={activities} 
                selectedDate={selectedDate} 
                onDateSelect={setSelectedDate} 
                />
            </div>

            {/* Right Column: Activity List */}
            <div className="lg:col-span-7 xl:col-span-8">
                {/* Active Filter Bar */}
                {selectedDate && (
                <div className="flex items-center justify-between bg-[#2c2c2e] rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-[#a4ff00]" />
                    <span className="font-bold text-sm">
                        {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    </div>
                    <button 
                    onClick={() => setSelectedDate(null)} 
                    className="text-xs font-bold text-[#a4ff00] uppercase tracking-wide px-2 py-1 hover:bg-white/10 rounded-lg"
                    >
                    Clear
                    </button>
                </div>
                )}

                {/* List */}
                <div>
                    <h2 className="text-lg font-bold text-white px-1 mb-4">
                        {filteredActivities.length > 0 ? 'Workouts' : ''}
                    </h2>
                    
                    {filteredActivities.length === 0 ? (
                        <div className="text-center py-12 bg-[#1c1c1e] rounded-2xl border border-[#2c2c2e]">
                        <div className="w-16 h-16 rounded-full bg-[#2c2c2e] flex items-center justify-center mx-auto mb-4">
                            <Calendar className="text-[#8e8e93]" size={32} />
                        </div>
                        <h3 className="text-white font-bold text-lg">No Workouts</h3>
                        <p className="text-[#8e8e93] text-sm mt-1">There is no activity data for this period.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {filteredActivities.map((act) => (
                                <ActivityCard 
                                  key={act.id} 
                                  activity={act} 
                                  onDelete={handleDelete}
                                  onViewMap={setSelectedMapActivity} // Pass handler
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Map Modal */}
        <AnimatePresence>
          {selectedMapActivity && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setSelectedMapActivity(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-zinc-900 w-full max-w-lg h-[60vh] rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-4 right-4 z-[401]">
                  <button 
                    onClick={() => setSelectedMapActivity(null)}
                    className="bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/70"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 z-[401] bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                   <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-zinc-400 uppercase font-bold">Distance</div>
                        <div className="text-xl font-bold text-white">{selectedMapActivity.distance} km</div>
                        {/* Show location in modal footer too */}
                        {selectedMapActivity.startLocation && (
                           <div className="text-[10px] text-zinc-500 mt-1">
                             {selectedMapActivity.startLocation} ➝ {selectedMapActivity.endLocation}
                           </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-zinc-400 uppercase font-bold">Steps</div>
                        <div className="text-xl font-bold text-emerald-400">{selectedMapActivity.steps}</div>
                      </div>
                   </div>
                </div>

                <LiveMap 
                  route={selectedMapActivity.route} 
                  readOnly={true} 
                  startName={selectedMapActivity.startLocation} // Pass to map
                  endName={selectedMapActivity.endLocation}     // Pass to map
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* App Info */}
        <div className="px-4 text-center mt-8 border-t border-white/5 pt-8">
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
      </div>

      <LicenseModal isOpen={showLicense} onClose={() => setShowLicense(false)} />
    </div>
  );
};

export default ActivityPage;