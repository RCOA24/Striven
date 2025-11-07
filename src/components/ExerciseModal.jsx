// src/components/ExerciseModal.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { X, HeartPulse, Dumbbell, Target, Sparkles, Plus, Bookmark } from 'lucide-react';

const MotionDiv = motion.div;

export default function ExerciseModal({ exercise, isOpen, onClose }) {
  if (!isOpen || !exercise) return null;

  // ExerciseDB fields
  const gifUrl = exercise.previewImage || exercise.gifUrl;
  const instructions = exercise.description 
    ? exercise.description.split('. ').filter(Boolean)
    : ['No instructions available.'];

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
      onClick={onClose}
    >
      <MotionDiv
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-gradient-to-br from-black/95 via-emerald-950/40 to-black/95 backdrop-blur-2xl rounded-3xl p-8 max-w-4xl w-full border border-emerald-500/30 max-h-[92vh] overflow-y-auto shadow-2xl shadow-emerald-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 backdrop-blur-md transition-all hover:scale-110"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 font-display tracking-tight">
            {exercise.name}
          </h2>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span className="bg-gradient-to-r from-emerald-400 to-green-500 text-black px-5 py-2 rounded-full font-bold text-sm shadow-lg shadow-emerald-500/30">
              {exercise.category || exercise.bodyPart}
            </span>
            <span className="text-emerald-400 flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Animated Demo
            </span>
          </div>
        </div>

        {/* Hero GIF */}
        <div className="relative mb-8 rounded-3xl overflow-hidden border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/30">
          <img
            src={gifUrl}
            alt={exercise.name}
            className="w-full aspect-video object-cover bg-black"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-3 text-white">
              <Target className="w-6 h-6 text-emerald-400" />
              <span className="text-lg font-bold">Target: {exercise.muscles || exercise.target}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 text-center">
            <HeartPulse className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-xs text-white/60">Muscle</div>
            <div className="text-white font-bold">{exercise.muscles || exercise.target}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 text-center">
            <Dumbbell className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-xs text-white/60">Equipment</div>
            <div className="text-white font-bold">{exercise.equipment || 'Bodyweight'}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 text-center">
            <Target className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-xs text-white/60">Type</div>
            <div className="text-white font-bold">Strength</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 text-center">
            <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-xs text-white/60">Source</div>
            <div className="text-white font-bold">ExerciseDB</div>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
            <Info className="w-7 h-7 text-emerald-400" />
            How to Perform
          </h3>
          <div className="space-y-4">
            {instructions.map((step, index) => (
              <MotionDiv
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg">
                  {index + 1}
                </div>
                <p className="text-white/80 text-lg leading-relaxed flex-1">
                  {step.endsWith('.') ? step : step + '.'}
                </p>
              </MotionDiv>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-5 rounded-2xl text-black font-bold text-xl shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/70 transition-all flex items-center justify-center gap-3"
          >
            <Plus className="w-7 h-7" />
            Add to Workout
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-5 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-bold text-xl border-2 border-white/30 hover:border-emerald-500/70 transition-all flex items-center gap-3 backdrop-blur-md"
          >
            <Bookmark className="w-6 h-6" />
            Save
          </motion.button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white/40 text-sm">
          Powered by your ExerciseDB API • {new Date().getFullYear()}
        </div>
      </MotionDiv>
    </MotionDiv>
  );
}