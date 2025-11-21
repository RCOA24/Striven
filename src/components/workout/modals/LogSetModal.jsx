// src/components/workout/modals/LogSetModal.jsx
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trophy, Zap, Target, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const LogSetModal = ({ 
  loggingSet, 
  exercise, 
  weightInput, 
  setWeightInput, 
  repInput, 
  setRepInput, 
  saveLog, 
  onClose 
}) => {
  const weightRef = useRef(null);
  const repRef = useRef(null);

  const weight = useMemo(() => parseFloat(weightInput) || 0, [weightInput]);
  const reps = useMemo(() => parseInt(repInput) || 0, [repInput]);
  const estimated1RM = useMemo(() => 
    weight && reps ? (weight * (1 + reps / 30)).toFixed(1) : 0,
    [weight, reps]
  );

  const handleWeightChange = useCallback((e) => {
    setWeightInput(e.target.value);
  }, [setWeightInput]);

  const handleRepChange = useCallback((e) => {
    setRepInput(e.target.value);
  }, [setRepInput]);

  useEffect(() => {
    if (loggingSet) {
      setTimeout(() => weightRef.current?.focus(), 100);
    }
  }, [loggingSet]);

  const handleSaveLog = useCallback(() => {
    if (weight && reps) saveLog();
  }, [weight, reps, saveLog]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!loggingSet) return;
    
    const handleKey = (e) => {
      if (e.key === 'Enter' && weight && reps) {
        e.preventDefault();
        handleSaveLog();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      if (e.key === 'Tab' && document.activeElement === weightRef.current) {
        e.preventDefault();
        repRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [loggingSet, weight, reps, handleSaveLog, handleClose]);

  return (
    <AnimatePresence mode="wait">
      {loggingSet && (
        <>
          {/* Backdrop - Solid dark for performance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/80"
            onClick={handleClose}
          />

          {/* Modal Container - Bottom Sheet on Mobile, Center on Desktop */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[9999] sm:inset-0 sm:flex sm:items-center sm:justify-center pointer-events-none"
          >
            <div 
              className="
                w-full sm:max-w-md pointer-events-auto
                bg-[#1c1c1e] sm:rounded-3xl rounded-t-3xl
                shadow-2xl overflow-hidden
                flex flex-col
                pb-safe
              "
              style={{ 
                willChange: 'transform',
                transform: 'translateZ(0)'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Mobile Handle */}
              <div className="w-full flex justify-center pt-3 pb-1 sm:hidden bg-[#1c1c1e]">
                <div className="w-10 h-1 bg-zinc-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pt-4 pb-6 text-center bg-[#1c1c1e]">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  Set {loggingSet.setIndex + 1}
                </h3>
                <h2 className="text-2xl font-bold text-white truncate leading-tight">
                  {exercise?.name}
                </h2>
              </div>

              {/* Inputs Container */}
              <div className="px-4 space-y-4 bg-[#1c1c1e]">
                {/* Grouped Inputs - Apple Style List */}
                <div className="bg-[#2c2c2e] rounded-xl overflow-hidden">
                  {/* Weight Input */}
                  <div className="flex items-center justify-between p-4 border-b border-zinc-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-lg font-medium text-white">Weight</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        ref={weightRef}
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={weightInput}
                        onChange={handleWeightChange}
                        className="w-24 bg-transparent text-right text-2xl font-bold text-white placeholder-zinc-600 focus:outline-none"
                      />
                      <span className="text-zinc-500 font-medium w-8">kg</span>
                    </div>
                  </div>

                  {/* Reps Input */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Target className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-lg font-medium text-white">Reps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        ref={repRef}
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={repInput}
                        onChange={handleRepChange}
                        className="w-24 bg-transparent text-right text-2xl font-bold text-white placeholder-zinc-600 focus:outline-none"
                      />
                      <span className="text-zinc-500 font-medium w-8">reps</span>
                    </div>
                  </div>
                </div>

                {/* 1RM Stat */}
                {estimated1RM > 0 && (
                  <div className="flex items-center justify-between bg-[#2c2c2e] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-amber-500" />
                      </div>
                      <span className="text-lg font-medium text-white">Est. 1RM</span>
                    </div>
                    <span className="text-xl font-bold text-white">
                      {estimated1RM} <span className="text-sm text-zinc-500 font-normal">kg</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 mt-4 grid grid-cols-2 gap-3 bg-[#1c1c1e]">
                <button
                  onClick={handleClose}
                  className="py-3.5 rounded-xl bg-[#2c2c2e] text-white font-semibold text-lg active:opacity-70 transition-opacity"
                  style={{ touchAction: 'manipulation' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLog}
                  disabled={!weight || !reps}
                  className="py-3.5 rounded-xl bg-emerald-500 text-white font-semibold text-lg active:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ touchAction: 'manipulation' }}
                >
                  Save
                </button>
              </div>
              
              {/* Safe Area Spacer for Mobile */}
              <div className="h-6 sm:h-0 bg-[#1c1c1e]" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};