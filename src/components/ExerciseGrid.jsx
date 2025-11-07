// src/components/ExerciseGrid.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExerciseCard from './ExerciseCard';

// Pro Skeleton with shimmer
const SkeletonCard = () => (
  <div className="group relative bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 animate-pulse">
    <div className="h-48 bg-gradient-to-br from-white/10 to-white/5" />
    <div className="p-5 space-y-3">
      <div className="h-6 bg-white/10 rounded-full w-4/5" />
      <div className="h-4 bg-white/10 rounded-full w-3/5" />
      <div className="h-4 bg-white/10 rounded-full w-1/2" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

export default function ExerciseGrid({ exercises = [], loading = false, onCardClick }) {
  // Stagger container
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 auto-rows-fr"
    >
      <AnimatePresence mode="popLayout">
        {loading
          ? // 20 skeletons for instant feel
            Array(20)
              .fill(null)
              .map((_, i) => (
                <motion.div
                  key={`skeleton-${i}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SkeletonCard />
                </motion.div>
              ))
          : exercises.map((ex) => (
              <motion.div
                key={ex.id}
                layout
                variants={item}
                initial="hidden"
                animate="show"
                exit={{ 
                  opacity: 0, 
                  scale: 0.9,
                  transition: { duration: 0.2 }
                }}
                whileHover={{ y: -4 }}
                className="h-full"
              >
                <ExerciseCard exercise={ex} onClick={onCardClick} />
              </motion.div>
            ))}
      </AnimatePresence>

      {/* Optional: Empty state */}
      {!loading && exercises.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-full text-center py-20"
        >
          <div className="text-white/40 text-xl font-medium">
            No exercises found
          </div>
          <p className="text-white/30 text-sm mt-2">
            Try adjusting your filters
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}