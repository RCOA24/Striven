'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { 
  Target, TrendingUp, Flame, Award, Edit2, Trash2, Check, X, Trophy 
} from 'lucide-react';
import { db } from '../utils/db';

const GOAL_TYPES = {
  steps: { 
    label: 'Steps', 
    icon: Target, 
    color: 'from-green-400 to-emerald-500',
    colorStart: '#34d399',
    colorEnd: '#10b981'
  },
  distance: { 
    label: 'Distance', 
    icon: TrendingUp, 
    color: 'from-cyan-400 to-cyan-600',
    colorStart: '#22d3ee',
    colorEnd: '#0891b2'
  },
  calories: { 
    label: 'Calories', 
    icon: Flame, 
    color: 'from-orange-400 to-red-500',
    colorStart: '#fb923c',
    colorEnd: '#f87171'
  }
};

const DEFAULT_GOALS = { steps: 70000, distance: 50, calories: 2500 };

/* -------------------------------------------------------------------------- */
/*                                STAT CARD                                   */
/* -------------------------------------------------------------------------- */
const StatCard = ({ icon: Icon, label, value, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.03 }}
    className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
  >
    <div 
      className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl blur-xl"
      style={{ backgroundImage: `linear-gradient(to bottom right, ${gradient.split(' ')[1]}, ${gradient.split(' ')[3]})` }}
    />

    <div className="flex items-center justify-between mb-4">
      <div className={`bg-gradient-to-br ${gradient} p-3 rounded-xl shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-white/60 font-medium">{label}</div>
  </motion.div>
);

/* -------------------------------------------------------------------------- */
/*                          PROGRESS RING (WHITE → GREEN)                     */
/* -------------------------------------------------------------------------- */
const ProgressRing = ({ progress, size = 120, stroke = 8, colorStart, colorEnd, id }) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        {/* WHITE BASE RING */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* GREEN PROGRESS FILL */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#gradient-${id})`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               GOAL CARD                                    */
/* -------------------------------------------------------------------------- */
const GoalCard = ({ type, current, goal, onEdit, onDelete }) => {
  const config = GOAL_TYPES[type];
  const progress = Math.min((current / goal) * 100, 100);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(goal);
  const isAchieved = progress >= 100;

  const handleSave = () => {
    if (editValue > 0) {
      onEdit(type, editValue);
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
    >
      {isAchieved && <Confetti width={300} height={200} recycle={false} numberOfPieces={80} gravity={0.2} colors={['#34d399', '#10b981', '#059669']} />}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`bg-gradient-to-br ${config.color} p-3 rounded-xl shadow-lg`}>
            <config.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{config.label}</h3>
            <p className="text-xs text-white/50">Weekly Goal</p>
          </div>
        </div>

        {!isEditing ? (
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Edit2 className="w-4 h-4 text-white/60 hover:text-green-400" />
            </button>
            <button onClick={() => onDelete(type)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4 text-white/60 hover:text-red-400" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button onClick={handleSave} className="p-2 text-green-400">
              <Check className="w-5 h-5" />
            </button>
            <button onClick={() => { setIsEditing(false); setEditValue(goal); }} className="p-2 text-red-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          {!isEditing ? (
            <>
              <div className="text-2xl font-bold text-white mb-1">
                {current.toLocaleString()} <span className="text-sm text-white/50">/ {goal.toLocaleString()}</span>
              </div>
              {isAchieved && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center space-x-1 text-green-400 text-sm font-medium">
                  <Trophy className="w-4 h-4" />
                  <span>Goal Crushed!</span>
                </motion.div>
              )}
            </>
          ) : (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xl font-bold focus:outline-none focus:border-green-400"
              min="1"
            />
          )}
        </div>

        <div className="ml-6">
          <ProgressRing progress={progress} colorStart={config.colorStart} colorEnd={config.colorEnd} id={type} />
        </div>
      </div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               PERSONAL BEST                                */
/* -------------------------------------------------------------------------- */
const PersonalBest = ({ value, label, date, icon: Icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-20 blur-3xl" 
         style={{ backgroundImage: `linear-gradient(to bottom left, ${color.split(' ')[1]}, transparent)` }} />

    <div className={`inline-flex p-3 rounded-xl mb-3 bg-gradient-to-br ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-white/60 mb-1">{label}</div>
    <div className="text-xs text-green-400 font-medium">{date}</div>
  </motion.div>
);

/* -------------------------------------------------------------------------- */
/*                                 MAIN PAGE                                  */
/* -------------------------------------------------------------------------- */
const StatsPage = () => {
  const activities = useLiveQuery(() => db.activities.toArray(), []) || [];
  const goalsFromDb = useLiveQuery(() => db.goals.toArray(), []) || [];

  const [deletingGoal, setDeletingGoal] = useState(null);

  const weeklyStats = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);

    const weekActs = activities.filter(a => new Date(a.date) >= start);
    const uniqueDays = new Set(weekActs.map(a => new Date(a.date).toDateString())).size;

    return {
      steps: weekActs.reduce((s, a) => s + (a.steps || 0), 0),
      distance: weekActs.reduce((s, a) => s + (a.distance || 0), 0),
      calories: weekActs.reduce((s, a) => s + (a.calories || 0), 0),
      activeDays: uniqueDays
    };
  }, [activities]);

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

  const getGoal = (type) => {
    const dbGoal = goalsFromDb.find(g => g.type === type);
    return dbGoal?.target || DEFAULT_GOALS[type];
  };

  const handleSaveGoal = async (type, value) => {
    const existing = goalsFromDb.find(g => g.type === type);
    try {
      if (existing) {
        await db.goals.update(existing.id, { target: value });
      } else {
        await db.goals.add({ type, target: value, date: new Date().toISOString() });
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteGoal = async (type) => {
    const goal = goalsFromDb.find(g => g.type === type);
    if (goal) await db.goals.delete(goal.id);
  };

  const { steps, distance, calories, activeDays } = weeklyStats;

  return (
    <>
      {/* FULL BLACK + GREEN GLOW BACKGROUND */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* HEADER */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-2">Your Stats</h1>
            <p className="text-white/70 text-lg">Track progress. Crush goals. Become unstoppable.</p>
          </motion.div>

          {/* WEEKLY SUMMARY */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Target} label="Steps" value={steps >= 1000 ? `${(steps/1000).toFixed(1)}K` : steps} gradient="from-green-400 to-emerald-500" delay={0.1} />
            <StatCard icon={TrendingUp} label="Distance" value={`${distance.toFixed(1)} km`} gradient="from-cyan-400 to-cyan-600" delay={0.2} />
            <StatCard icon={Flame} label="Calories" value={Math.round(calories).toLocaleString()} gradient="from-orange-400 to-red-500" delay={0.3} />
            <StatCard icon={Award} label="Active Days" value={`${activeDays}/7`} gradient="from-purple-400 to-pink-500" delay={0.4} />
          </div>

          {/* WEEKLY GOALS */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Target className="w-6 h-6 text-green-400" />
              <span>Weekly Goals</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <GoalCard type="steps" current={steps} goal={getGoal('steps')} onEdit={handleSaveGoal} onDelete={handleDeleteGoal} />
              <GoalCard type="distance" current={parseFloat(distance.toFixed(1))} goal={getGoal('distance')} onEdit={handleSaveGoal} onDelete={handleDeleteGoal} />
              <GoalCard type="calories" current={Math.round(calories)} goal={getGoal('calories')} onEdit={handleSaveGoal} onDelete={handleDeleteGoal} />
            </div>
          </div>

          {/* PERSONAL BESTS */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Trophy className="w-7 h-7 text-yellow-400" />
              <span>Personal Bests</span>
            </h2>
            {personalBests ? (
              <div className="grid md:grid-cols-2 gap-4">
                <PersonalBest value={personalBests.steps.toLocaleString()} label="Most Steps in a Day" date={personalBests.stepsDate} icon={Target} color="from-green-400 to-emerald-500" />
                <PersonalBest value={`${personalBests.distance} km`} label="Longest Distance" date={personalBests.distanceDate} icon={TrendingUp} color="from-cyan-400 to-cyan-600" />
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">Complete your first activity to unlock personal bests!</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* DELETE CONFIRMATION */}
      <AnimatePresence>
        {deletingGoal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-red-500/20 p-3 rounded-xl">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Reset Goal?</h3>
              </div>
              <p className="text-white/70 mb-6">
                This will reset your <strong>{GOAL_TYPES[deletingGoal].label}</strong> goal to default.
              </p>
              <div className="flex space-x-3">
                <button onClick={() => setDeletingGoal(null)} className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium">Cancel</button>
                <button onClick={() => { handleDeleteGoal(deletingGoal); setDeletingGoal(null); }} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium">Reset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StatsPage;