// src/components/workout/modals/LogSetModal.jsx
import React, { useEffect, useRef } from 'react';
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

  const weight = parseFloat(weightInput) || 0;
  const reps = parseInt(repInput) || 0;
  const estimated1RM = weight && reps ? (weight * (1 + reps / 30)).toFixed(1) : 0;

  useEffect(() => {
    weightRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Enter' && weight && reps) saveLog();
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && document.activeElement === weightRef.current) {
        e.preventDefault();
        repRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [weight, reps, saveLog, onClose]);

  if (!loggingSet) return null;

  return (
    <AnimatePresence>
      {loggingSet && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-3xl"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed inset-4 z-[9999] flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="
              w-full max-w-2xl 
              bg-gradient-to-b from-black via-emerald-950/95 to-black 
              rounded-3xl 
              border-4 border-emerald-500/70 
              shadow-2xl 
              overflow-hidden 
              max-h-[96vh]
              flex flex-col
            ">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 pt-8 pb-6 sm:px-10 sm:pt-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-teal-400 leading-tight">
                    Log Set {loggingSet.setIndex + 1}
                  </h3>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-300 mt-3 line-clamp-2">
                    {exercise?.name}
                  </p>
                </div>

                {/* Inputs */}
                <div className="space-y-10 mb-10">
                  {/* Weight */}
                  <div>
                    <label className="flex items-center gap-3 text-emerald-300 font-bold text-lg sm:text-xl mb-4">
                      <Zap className="w-8 h-8" />
                      Weight (kg)
                    </label>
                    <input
                      ref={weightRef}
                      type="number"
                      inputMode="decimal"
                      placeholder="100"
                      value={weightInput}
                      onChange={e => setWeightInput(e.target.value)}
                      className="
                        w-full px-6 py-6 
                        text-5xl sm:text-6xl font-black text-center 
                        bg-white/10 border-4 border-emerald-500/70 
                        rounded-3xl text-emerald-200 placeholder-white/30
                        focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/50
                        transition-all
                        [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0
                      "
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                    />
                  </div>

                  {/* Reps */}
                  <div>
                    <label className="flex items-center gap-3 text-emerald-300 font-bold text-lg sm:text-xl mb-4">
                      <Target className="w-8 h-8" />
                      Reps
                    </label>
                    <input
                      ref={repRef}
                      type="number"
                      inputMode="numeric"
                      placeholder="10"
                      value={repInput}
                      onChange={e => setRepInput(e.target.value)}
                      className="
                        w-full px-6 py-6 
                        text-5xl sm:text-6xl font-black text-center 
                        bg-white/10 border-4 border-emerald-500/70 
                        rounded-3xl text-emerald-200 placeholder-white/30
                        focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/50
                        transition-all
                        [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0
                      "
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                    />
                  </div>

                  {/* 1RM Preview */}
                  {estimated1RM > 0 && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="
                        bg-gradient-to-r from-amber-600/40 via-orange-600/40 to-amber-600/40 
                        backdrop-blur-2xl rounded-3xl p-8 
                        border-4 border-amber-500/70 
                        text-center shadow-2xl
                      "
                    >
                      <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400 mx-auto mb-4" />
                      <p className="text-2xl sm:text-3xl font-bold text-amber-300 mb-2">
                        Estimated 1RM
                      </p>
                      <p className="text-6xl sm:text-8xl font-black text-white tracking-tighter">
                        {estimated1RM}
                        <span className="text-4xl sm:text-6xl text-amber-300 ml-2">kg</span>
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Fixed Bottom Buttons */}
              <div className="px-6 pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={saveLog}
                    disabled={!weight || !reps}
                    className="
                      flex-1 py-6 sm:py-7 
                      bg-gradient-to-r from-emerald-500 to-teal-500 
                      hover:from-emerald-400 hover:to-teal-400 
                      disabled:from-gray-600 disabled:to-gray-700 
                      disabled:cursor-not-allowed
                      rounded-3xl font-black text-3xl sm:text-4xl 
                      text-black shadow-2xl 
                      hover:shadow-emerald-500/80 
                      transition-all hover:scale-105 active:scale-95
                      flex items-center justify-center gap-4
                      min-h-[70px]
                    "
                  >
                    <Save className="w-10 h-10 sm:w-12 sm:h-12" />
                    SAVE SET
                  </button>

                  <button
                    onClick={onClose}
                    className="
                      px-8 py-6 sm:py-7 
                      bg-white/10 hover:bg-white/20 
                      backdrop-blur-xl 
                      rounded-3xl font-bold text-2xl sm:text-3xl 
                      text-white/90 hover:text-white 
                      transition-all hover:scale-105 active:scale-95
                      flex items-center justify-center gap-3
                      min-h-[70px]
                    "
                  >
                    <X className="w-8 h-8 sm:w-10 sm:h-10" />
                    Cancel
                  </button>
                </div>

                <p className="text-center text-white/50 text-sm mt-4">
                  Enter to save • Esc to cancel • Tab to switch
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};