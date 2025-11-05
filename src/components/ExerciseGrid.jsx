// src/components/ExerciseGrid.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExerciseCard from './ExerciseCard';

const SkeletonCard = () => (
  <div className="bg-white/5 rounded-2xl p-6 border border-white/10 animate-pulse">
    <div className="h-48 bg-white/10 rounded-2xl mb-4" />
    <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />
    <div className="h-4 bg-white/10 rounded w-1/2" />
  </div>
);

export default function ExerciseGrid({ exercises, loading, onCardClick }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence>
        {loading
          ? Array(12).fill(null).map((_, i) => <SkeletonCard key={i} />)
          : exercises.map((ex, i) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <ExerciseCard exercise={ex} onClick={onCardClick} />
              </motion.div>
            ))}
      </AnimatePresence>
    </div>
  );
}