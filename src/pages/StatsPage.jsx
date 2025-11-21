/**
 * Striven - Privacy-First Fitness Tracker
 * Copyright (c) 2025 Rodney Austria
 * Licensed under the MIT License
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { 
  Target, TrendingUp, Flame, ChevronRight, Minus, Plus, X, Trophy, Calendar, MapPin, Activity
} from 'lucide-react';
import { db } from '../utils/db';

/* -------------------------------------------------------------------------- */
/*                             APPLE STYLE CONSTANTS                          */
/* -------------------------------------------------------------------------- */

const APPLE_COLORS = {
  move: {
    start: '#fa114f', end: '#fa114f', bg: 'rgba(250, 17, 79, 0.15)',
  },
  exercise: {
    start: '#a4ff00', end: '#a4ff00', bg: 'rgba(164, 255, 0, 0.15)',
  },
  stand: {
    start: '#00c7fc', end: '#00e0ff', bg: 'rgba(0, 199, 252, 0.15)',
  },
  purple: {
    start: '#bf5af2', end: '#d48af7', bg: 'rgba(191, 90, 242, 0.15)',
  }
};

const GOAL_TYPES = {
  calories: { label: 'Move', ...APPLE_COLORS.move, unit: 'CAL' },
  steps: { label: 'Steps', ...APPLE_COLORS.exercise, unit: 'STEPS' },
  distance: { label: 'Distance', ...APPLE_COLORS.stand, unit: 'KM' },
};

const DEFAULT_GOALS = { steps: 70000, distance: 50, calories: 3500 };

/* -------------------------------------------------------------------------- */
/*                            REUSABLE COMPONENTS                             */
/* -------------------------------------------------------------------------- */

const ActivityRing = ({ progress, size = 100, stroke = 12, colorConfig, icon: Icon }) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalizedProgress = Math.min(progress, 100);
  const offset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90 transform" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={colorConfig.bg} strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={colorConfig.start} strokeWidth={stroke} fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.2, 0.8, 0.2, 1] }}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${colorConfig.start})` }}
        />
      </svg>
      {Icon && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <Icon size={size * 0.35} fill="currentColor" className="opacity-90" style={{ color: colorConfig.start }} />
        </div>
      )}
    </div>
  );
};

const BentoCard = ({ children, className = "", onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={onClick ? { scale: 1.02 } : {}}
    whileTap={onClick ? { scale: 0.98 } : {}}
    onClick={onClick}
    className={`bg-[#1c1c1e] rounded-[2rem] p-5 md:p-6 overflow-hidden relative ${className}`}
  >
    {children}
  </motion.div>
);

/* -------------------------------------------------------------------------- */
/*                                 MAIN PAGE                                  */
/* -------------------------------------------------------------------------- */

const StatsPage = () => {
  const activities = useLiveQuery(() => db.activities.toArray(), []) || [];
  const goalsFromDb = useLiveQuery(() => db.goals.toArray(), []) || [];
  const [editingGoal, setEditingGoal] = useState(null);

  // Date Helpers
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

  // Statistics Logic
  const weeklyStats = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    start.setHours(0, 0, 0, 0);

    const weekActs = activities.filter(a => new Date(a.date) >= start);
    const uniqueDays = new Set(weekActs.map(a => new Date(a.date).toDateString())).size;
    
    // Mock Visual Dots
    const activityByDay = Array(7).fill(false);
    weekActs.forEach(a => {
      const dayIndex = new Date(a.date).getDay();
      activityByDay[dayIndex] = true;
    });

    return {
      steps: weekActs.reduce((s, a) => s + (a.steps || 0), 0),
      distance: weekActs.reduce((s, a) => s + (a.distance || 0), 0),
      calories: weekActs.reduce((s, a) => s + (a.calories || 0), 0),
      activeDays: uniqueDays,
      activityByDay
    };
  }, [activities]);

  const getGoal = (type) => {
    const dbGoal = goalsFromDb.find(g => g.type === type);
    return dbGoal?.target || DEFAULT_GOALS[type];
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    const { type, value } = editingGoal;
    const existing = goalsFromDb.find(g => g.type === type);
    try {
      if (existing) await db.goals.update(existing.id, { target: value });
      else await db.goals.add({ type, target: value, date: new Date().toISOString() });
      setEditingGoal(null);
    } catch (e) { console.error(e); }
  };

  const personalBests = useMemo(() => {
    if (!activities.length) return null;
    const bestSteps = activities.reduce((a, b) => (a.steps || 0) > (b.steps || 0) ? a : b);
    const bestDist = activities.reduce((a, b) => (a.distance || 0) > (b.distance || 0) ? a : b);
    
    return {
      steps: bestSteps.steps || 0,
      stepsDate: new Date(bestSteps.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      distance: (bestDist.distance || 0).toFixed(2),
      distanceDate: new Date(bestDist.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  }, [activities]);

  return (
    /* ADDED pb-32 TO ENSURE SCROLL CLEARANCE ABOVE NAV BAR */
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 pb-32">
      
      {/* HEADER */}
      <div className="px-6 pt-12 pb-6 max-w-4xl mx-auto flex justify-between items-end border-b border-white/10 mb-6">
        <div>
          <h2 className="text-sm font-bold text-[#8e8e93] tracking-wide mb-1">{dateString}</h2>
          <h1 className="text-4xl font-bold tracking-tight">Summary</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-4">

        {/* 1. MAIN ACTIVITY RINGS */}
        <BentoCard className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-1 text-center md:text-left">
            <h3 className="text-xl font-semibold">Activity</h3>
            <p className="text-[#8e8e93]">Close your rings to stay on track.</p>
          </div>
          <div className="flex items-center justify-center gap-4 md:gap-6 scale-90 md:scale-100">
             <div className="flex flex-col items-center gap-2">
              <ActivityRing progress={(weeklyStats.calories / getGoal('calories')) * 100} colorConfig={APPLE_COLORS.move} icon={Flame} size={80} />
              <span className="text-[10px] font-bold text-[#fa114f] tracking-widest">MOVE</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ActivityRing progress={(weeklyStats.steps / getGoal('steps')) * 100} colorConfig={APPLE_COLORS.exercise} icon={Target} size={80} />
              <span className="text-[10px] font-bold text-[#a4ff00] tracking-widest">STEPS</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ActivityRing progress={(weeklyStats.distance / getGoal('distance')) * 100} colorConfig={APPLE_COLORS.stand} icon={TrendingUp} size={80} />
              <span className="text-[10px] font-bold text-[#00c7fc] tracking-widest">DIST</span>
            </div>
          </div>
        </BentoCard>

        {/* 2. METRICS GRID ROW 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BentoCard onClick={() => setEditingGoal({ type: 'calories', value: getGoal('calories') })}>
             <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-2 text-[#fa114f] font-bold text-sm uppercase tracking-wider">
                 <Flame size={16} fill="currentColor" /> Move
               </div>
               <ChevronRight size={18} className="text-[#48484a]" />
             </div>
             <div className="flex items-baseline gap-1">
               <span className="text-3xl font-bold font-mono">{Math.round(weeklyStats.calories)}</span>
               <span className="text-[#fa114f] font-bold text-sm">CAL</span>
             </div>
             <div className="mt-4 h-1.5 w-full bg-[#3a3a3c] rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((weeklyStats.calories / getGoal('calories')) * 100, 100)}%` }} className="h-full bg-[#fa114f]" />
             </div>
             <p className="text-right text-xs text-[#8e8e93] mt-2">Goal: {getGoal('calories').toLocaleString()}</p>
          </BentoCard>

          <BentoCard onClick={() => setEditingGoal({ type: 'steps', value: getGoal('steps') })}>
             <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-2 text-[#a4ff00] font-bold text-sm uppercase tracking-wider">
                 <Target size={16} fill="currentColor" /> Steps
               </div>
               <ChevronRight size={18} className="text-[#48484a]" />
             </div>
             <div className="flex items-baseline gap-1">
               <span className="text-3xl font-bold font-mono">{weeklyStats.steps.toLocaleString()}</span>
               <span className="text-[#a4ff00] font-bold text-sm">STEPS</span>
             </div>
             <div className="mt-4 h-1.5 w-full bg-[#3a3a3c] rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((weeklyStats.steps / getGoal('steps')) * 100, 100)}%` }} className="h-full bg-[#a4ff00]" />
             </div>
             <p className="text-right text-xs text-[#8e8e93] mt-2">Goal: {getGoal('steps').toLocaleString()}</p>
          </BentoCard>
        </div>

        {/* 3. METRICS GRID ROW 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <BentoCard>
             <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-2 text-[#bf5af2] font-bold text-sm uppercase tracking-wider">
                 <Calendar size={16} /> Active Days
               </div>
             </div>
             <div className="flex items-end gap-2 mb-4">
               <span className="text-3xl font-bold font-mono">{weeklyStats.activeDays}</span>
               <span className="text-[#8e8e93] font-bold text-sm mb-1">/ 7 DAYS</span>
             </div>
             <div className="flex justify-between items-center bg-[#2c2c2e] rounded-xl p-3">
               {weeklyStats.activityByDay.map((isActive, i) => (
                 <div key={i} className="flex flex-col items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#bf5af2] shadow-[0_0_8px_#bf5af2]' : 'bg-[#48484a]'}`} />
                   <span className="text-[10px] text-[#8e8e93] font-mono">
                     {['S','M','T','W','T','F','S'][i]}
                   </span>
                 </div>
               ))}
             </div>
           </BentoCard>

           <BentoCard onClick={() => setEditingGoal({ type: 'distance', value: getGoal('distance') })}>
             <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-2 text-[#00c7fc] font-bold text-sm uppercase tracking-wider">
                 <TrendingUp size={16} /> Distance
               </div>
               <ChevronRight size={18} className="text-[#48484a]" />
             </div>
             <div className="flex items-baseline gap-1">
               <span className="text-3xl font-bold font-mono">{weeklyStats.distance.toFixed(1)}</span>
               <span className="text-[#00c7fc] font-bold text-sm">KM</span>
             </div>
             <div className="mt-4 h-1.5 w-full bg-[#3a3a3c] rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((weeklyStats.distance / getGoal('distance')) * 100, 100)}%` }} className="h-full bg-[#00c7fc]" />
             </div>
             <p className="text-right text-xs text-[#8e8e93] mt-2">Goal: {getGoal('distance').toLocaleString()}</p>
           </BentoCard>
        </div>

        {/* 4. AWARDS */}
        <BentoCard className="bg-gradient-to-br from-[#1c1c1e] to-[#2c2c2e] border border-yellow-500/10">
          <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm uppercase tracking-wider mb-6">
            <Trophy size={16} fill="currentColor" /> Personal Records
          </div>
          {personalBests ? (
            <div className="grid grid-cols-2 gap-4 md:gap-8 divide-x divide-white/10">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 mb-3 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 ring-1 ring-yellow-500/30">
                  <Activity size={20} />
                </div>
                <div className="text-xl font-bold text-white">{personalBests.steps.toLocaleString()}</div>
                <div className="text-[10px] uppercase font-bold text-[#8e8e93] tracking-wide mt-1">Most Steps</div>
                <div className="text-[10px] text-[#636366] mt-0.5">{personalBests.stepsDate}</div>
              </div>
              <div className="flex flex-col items-center text-center pl-4">
                <div className="w-12 h-12 mb-3 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 ring-1 ring-yellow-500/30">
                  <MapPin size={20} />
                </div>
                <div className="text-xl font-bold text-white">{personalBests.distance} <span className="text-sm">km</span></div>
                <div className="text-[10px] uppercase font-bold text-[#8e8e93] tracking-wide mt-1">Farthest Run</div>
                <div className="text-[10px] text-[#636366] mt-0.5">{personalBests.distanceDate}</div>
              </div>
            </div>
          ) : (
            <div className="text-[#8e8e93] text-sm text-center py-4">Start moving to unlock awards!</div>
          )}
        </BentoCard>

      </div>

      {/* EDIT GOAL FLOATING CARD (UPDATED POSITION) */}
      <AnimatePresence>
        {editingGoal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 backdrop-blur-md" 
              onClick={() => setEditingGoal(null)}
            />
            <motion.div
              initial={{ y: "120%" }} animate={{ y: 0 }} exit={{ y: "120%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              // CHANGED: Added `bottom-24` (approx 96px) to sit above nav bar, `mx-4`, `rounded-[2rem]`
              className="fixed bottom-24 inset-x-4 z-50 bg-[#1c1c1e] rounded-[2rem] p-6 border border-white/10 max-w-md md:mx-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold">Goal: {GOAL_TYPES[editingGoal.type].label}</h3>
                <button onClick={() => setEditingGoal(null)} className="bg-[#3a3a3c] p-2 rounded-full text-[#8e8e93] hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 mb-8">
                <button 
                  onClick={() => setEditingGoal(curr => ({...curr, value: Math.max(0, curr.value - (curr.type === 'distance' ? 5 : 500))}))}
                  className="w-14 h-14 rounded-full bg-[#2c2c2e] flex items-center justify-center active:scale-95 transition"
                  style={{ color: GOAL_TYPES[editingGoal.type].start }}
                >
                  <Minus size={24} strokeWidth={3} />
                </button>

                <div className="text-center">
                  <div className="text-5xl font-bold font-mono tracking-tighter">
                     {editingGoal.value.toLocaleString()}
                  </div>
                  <div className="text-[#8e8e93] text-sm font-bold mt-1">
                    {GOAL_TYPES[editingGoal.type].unit} / WEEK
                  </div>
                </div>

                <button 
                  onClick={() => setEditingGoal(curr => ({...curr, value: curr.value + (curr.type === 'distance' ? 5 : 500)}))}
                  className="w-14 h-14 rounded-full bg-[#2c2c2e] flex items-center justify-center active:scale-95 transition"
                  style={{ color: GOAL_TYPES[editingGoal.type].start }}
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>

              <button 
                onClick={handleUpdateGoal}
                className="w-full text-black font-bold text-lg py-4 rounded-xl active:scale-[0.98] transition"
                style={{ backgroundColor: GOAL_TYPES[editingGoal.type].start }}
              >
                Update Goal
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CONFETTI */}
      {(weeklyStats.steps >= getGoal('steps')) && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <Confetti 
             recycle={false} numberOfPieces={200} 
             colors={[APPLE_COLORS.move.start, APPLE_COLORS.exercise.start, APPLE_COLORS.stand.start]} 
          />
        </div>
      )}

    </div>
  );
};

export default StatsPage;