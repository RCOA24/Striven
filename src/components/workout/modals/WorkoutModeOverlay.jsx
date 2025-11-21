// src/components/workout/WorkoutModeOverlay.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SkipForward, TrendingUp, Trash2, X, AlertTriangle, 
  Target, Award, Calendar, ChevronRight, Zap, Clock, Dumbbell
} from 'lucide-react';
import { PRBadge } from '../ui/PRBadge';
import { TimerDisplay } from '../ui/TimerDisplay';
import SetLogger from '../ui/SetLogger';
import { clearExercisePR } from '../../../utils/db';

// --- CONSTANTS & ASSETS ---

const FALLBACK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" fill="%231c1c1e"/><path d="M300 150 L300 250" stroke="%233a3a3c" stroke-width="4"/><path d="M250 200 L350 200" stroke="%233a3a3c" stroke-width="4"/><text x="300" y="320" font-family="system-ui" font-size="14" fill="%238e8e93" text-anchor="middle">No Preview Available</text></svg>`;

// --- REUSABLE COMPONENTS ---

// Apple-style Circular Progress (SVG Optimized)
const ProgressRing = ({ progress, total }) => {
  const radius = 24;
  const stroke = 4;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - ((progress / total) * circumference);

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="#3a3a3c"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          stroke="#a4ff00" // Apple Fitness Green
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference + ' ' + circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
        {progress}/{total}
      </div>
    </div>
  );
};

// Apple-style Stat Tile
const StatTile = ({ icon: Icon, label, value, color = "#a4ff00" }) => (
  <div className="flex-1 bg-[#1c1c1e] rounded-2xl p-3 flex flex-col items-start justify-between min-h-[80px]">
    <div className="flex w-full justify-between items-start mb-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e93]">{label}</span>
      <Icon size={14} style={{ color }} />
    </div>
    <div className="text-lg sm:text-xl font-bold text-white font-mono tracking-tight truncate w-full">
      {value}
    </div>
  </div>
);

// Modern iOS Action Sheet / Modal
const ModalSheet = ({ isOpen, onClose, title, children, actions }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 z-[10002] backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[10003] bg-[#1c1c1e] rounded-t-[2rem] border-t border-white/10 overflow-hidden max-w-md mx-auto"
        >
          <div className="p-6">
            <div className="w-12 h-1.5 bg-[#3a3a3c] rounded-full mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white text-center mb-2">{title}</h2>
            <div className="mb-8">{children}</div>
            <div className="flex gap-3">{actions}</div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// --- MAIN COMPONENT ---

export const WorkoutModeOverlay = ({
  isWorkoutStarted,
  todayExercises,
  currentExerciseIndex,
  secondsLeft,
  isResting,
  formatTime,
  nextExercise,
  setIsWorkoutStarted,
  exerciseHistory,
  openLogModal,
  refreshHistory,
  showToast
}) => {
  const containerRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  
  // Data Preparation
  const currentEx = todayExercises?.[currentExerciseIndex];
  let currentExId = currentEx?.exerciseId || currentEx?.id;
  let currentHistory = exerciseHistory?.[currentExId] || { logs: [], pr: 0 };

  // Fallback ID check
  if ((!currentHistory.logs || currentHistory.logs.length === 0) && currentEx) {
    const alternateId = currentEx.id;
    if (alternateId !== currentExId && exerciseHistory?.[alternateId]) {
       currentHistory = exerciseHistory[alternateId];
       currentExId = alternateId;
    }
  }

  const safePR = parseFloat(currentHistory.pr) || 0;
  const sortedLogs = [...(currentHistory.logs || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  // GIF Handling
  const gifSrc = useMemo(() => {
    if (currentEx?.gifUrl && currentEx.gifUrl.startsWith('http')) return currentEx.gifUrl;
    return FALLBACK_SVG;
  }, [currentEx?.gifUrl]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentExerciseIndex]);

  // Handlers
  const handleClearPR = async () => {
    if (!currentExId) return;
    try {
      await clearExercisePR(currentExId);
      if (refreshHistory) await refreshHistory();
      showToast?.('History cleared', 'success');
      setShowClearConfirm(false);
    } catch (e) {
      console.error(e);
      showToast?.('Failed to clear', 'error');
    }
  };

  if (!isWorkoutStarted || !currentEx) return null;

  return (
    <AnimatePresence>
      {isWorkoutStarted && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed inset-0 z-[9000] bg-black flex flex-col"
        >
          
          {/* --- NAVBAR --- */}
          <div className="px-4 pt-12 pb-4 bg-[#1c1c1e] border-b border-white/10 flex items-center justify-between shrink-0 z-50">
            <div className="flex items-center gap-3">
              <ProgressRing progress={currentExerciseIndex + 1} total={todayExercises.length} />
              <div>
                <div className="text-[#8e8e93] text-xs font-bold uppercase tracking-wide">Current Exercise</div>
                <div className="text-white text-sm font-bold truncate max-w-[150px] sm:max-w-[250px]">
                  {currentExerciseIndex + 1} of {todayExercises.length}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSkipConfirm(true)} className="bg-[#3a3a3c] p-2.5 rounded-full text-white active:scale-95 transition">
                <SkipForward size={20} />
              </button>
              <button onClick={() => setIsWorkoutStarted(false)} className="bg-[#3a3a3c] p-2.5 rounded-full text-[#8e8e93] hover:text-white active:scale-95 transition">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* --- SCROLLABLE CONTENT --- */}
          <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-black p-4 pb-32 space-y-6">
            
            {/* 1. EXERCISE HEADER CARD */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                  {currentEx.name}
                </h1>
                <PRBadge pr={safePR} />
              </div>
              
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded bg-[#a4ff00]/10 text-[#a4ff00] text-xs font-bold uppercase tracking-wider">
                  {currentEx.sets} Sets
                </span>
                <span className="px-3 py-1 rounded bg-[#00c7fc]/10 text-[#00c7fc] text-xs font-bold uppercase tracking-wider">
                  {currentEx.reps} Reps
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <StatTile icon={Target} label="Target" value={currentEx.muscles || "Body"} color="#a4ff00" />
                <StatTile icon={Award} label="Best" value={safePR > 0 ? `${safePR}kg` : "-"} color="#ffcc00" />
                <StatTile icon={Clock} label="History" value={sortedLogs.length} color="#bf5af2" />
              </div>
            </div>

            {/* 2. MEDIA & TIMER */}
            <div className="grid grid-cols-1 gap-4">
              {/* GIF Container - Fixed Aspect Ratio to prevent layout shift */}
              <div className="w-full aspect-video bg-[#1c1c1e] rounded-2xl overflow-hidden border border-white/10 relative">
                <img 
                  src={gifSrc} 
                  alt="Demo" 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.src = FALLBACK_SVG; }}
                />
                {isResting && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="text-[#a4ff00] font-mono text-5xl font-bold tabular-nums mb-2">
                        {formatTime(secondsLeft)}
                      </div>
                      <div className="text-white/60 text-xs uppercase font-bold tracking-widest">Resting</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timer Component (If not resting, show small timer) */}
              {!isResting && (
                <TimerDisplay seconds={secondsLeft} isResting={isResting} formatTime={formatTime} minimal />
              )}
            </div>

            {/* 3. LOGGING SECTION */}
            <div className="bg-[#1c1c1e] rounded-2xl p-1 border border-white/5">
              <SetLogger
                exercise={currentEx}
                sets={currentEx.sets || 4}
                history={currentHistory}
                onLogSet={(_, setIndex) => openLogModal(currentExId, setIndex)}
              />
            </div>

            {/* 4. HISTORY LIST */}
            {sortedLogs.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <h3 className="text-lg font-bold text-white">History</h3>
                  <button onClick={() => setShowClearConfirm(true)} className="text-xs text-red-500 font-bold uppercase">Clear</button>
                </div>
                <div className="space-y-2">
                  {sortedLogs.slice(0, 3).map((log, i) => (
                    <div key={i} className="bg-[#1c1c1e] p-4 rounded-xl flex justify-between items-center border border-white/5">
                      <div className="text-[#8e8e93] text-xs font-medium">
                        {new Date(log.date).toLocaleDateString()}
                      </div>
                      <div className="flex gap-4">
                        <div className="text-right">
                          <div className="text-white font-bold text-sm">{log.weight}kg</div>
                          <div className="text-[#8e8e93] text-[10px] uppercase">Weight</div>
                        </div>
                        <div className="text-right w-12">
                          <div className="text-white font-bold text-sm">{log.reps}</div>
                          <div className="text-[#8e8e93] text-[10px] uppercase">Reps</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BOTTOM SPACING FOR NEXT BUTTON */}
            <div className="h-20" />
          </div>

          {/* --- FLOATING ACTION BUTTON --- */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-[51]">
            <button
              onClick={() => setShowSkipConfirm(true)}
              className="w-full bg-[#a4ff00] text-black font-bold text-lg py-4 rounded-2xl shadow-lg shadow-lime-900/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <span>Next Exercise</span>
              <ChevronRight size={20} strokeWidth={3} />
            </button>
          </div>

          {/* --- MODALS --- */}
          
          {/* Skip Confirmation */}
          <ModalSheet
            isOpen={showSkipConfirm}
            onClose={() => setShowSkipConfirm(false)}
            title="Skip Exercise?"
            actions={
              <>
                <button onClick={() => setShowSkipConfirm(false)} className="flex-1 py-4 rounded-xl bg-[#3a3a3c] text-white font-bold">Cancel</button>
                <button onClick={() => { nextExercise(); setShowSkipConfirm(false); }} className="flex-1 py-4 rounded-xl bg-[#a4ff00] text-black font-bold">Skip</button>
              </>
            }
          >
            <p className="text-center text-[#8e8e93] mb-4">
              Are you sure you want to skip <strong>{currentEx.name}</strong>?
            </p>
          </ModalSheet>

          {/* Clear History Confirmation */}
          <ModalSheet
            isOpen={showClearConfirm}
            onClose={() => setShowClearConfirm(false)}
            title="Clear History"
            actions={
              <>
                <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-4 rounded-xl bg-[#3a3a3c] text-white font-bold">Cancel</button>
                <button onClick={handleClearPR} className="flex-1 py-4 rounded-xl bg-red-500 text-white font-bold">Delete</button>
              </>
            }
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="bg-red-500/10 p-4 rounded-full text-red-500">
                <AlertTriangle size={32} />
              </div>
              <p className="text-[#8e8e93]">
                This will permanently delete all performance logs and PRs for <strong>{currentEx.name}</strong>.
              </p>
            </div>
          </ModalSheet>

        </motion.div>
      )}
    </AnimatePresence>
  );
};