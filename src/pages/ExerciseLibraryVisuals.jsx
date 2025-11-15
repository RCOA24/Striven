// src/pages/ExerciseLibraryVisuals.jsx
'use client';

import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, Loader2, AlertCircle, ChevronLeft, ChevronRight, 
  Keyboard, Timer, ChevronRight as ChevronRightIcon 
} from 'lucide-react';
import { fetchExercises, fetchExerciseDetails, getCategories } from '../api/exercises';
import ExerciseFilters from '../components/ExerciseFilters';
import ExerciseGrid from '../components/ExerciseGrid';
import ExerciseModal from '../components/ExerciseModal';
import { getTodayWorkout } from '../utils/db';

// Context to access setCurrentPage from App.jsx
import { AppContext } from '../App'; // ← Make sure this exists! (see note below)

export default function ExerciseLibraryVisuals() {
  const { setCurrentPage } = useContext(AppContext); // ← Gets navigation function

  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState(['All']);
  const [todayWorkoutCount, setTodayWorkoutCount] = useState(0);
  const containerRef = useRef(null);

  const LIMIT = 25;

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        setCategories(['All']);
      }
    };
    loadCategories();
  }, []);

  // Live workout count
  const loadTodayCount = async () => {
    const today = await getTodayWorkout();
    setTodayWorkoutCount(today.length);
  };

  useEffect(() => {
    loadTodayCount();
    const interval = setInterval(loadTodayCount, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch exercises
  const fetchPage = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchExercises(pageNum, {
        bodyPart: selectedCategory !== 'All' ? selectedCategory : null,
        search: searchQuery.trim() || null,
        limit: LIMIT
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const newExercises = result.exercises;
      const total = result.total || newExercises.length;
      const pages = Math.ceil(total / LIMIT) || 1;

      setExercises(newExercises);
      setFilteredExercises(newExercises);
      setTotalCount(total);
      setTotalPages(pages);
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load exercises.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchPage(0);
  }, [selectedCategory, searchQuery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft' && page > 0) fetchPage(page - 1);
      if (e.key === 'ArrowRight' && page < totalPages - 1) fetchPage(page + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [page, totalPages, fetchPage]);

  const goToPrevPage = () => page > 0 && fetchPage(page - 1);
  const goToNextPage = () => page < totalPages - 1 && fetchPage(page + 1);

  const handleCardClick = async (lightExercise) => {
    setLoadingDetails(true);
    setSelectedExercise(null);
    try {
      const full = await fetchExerciseDetails(lightExercise.id);
      setSelectedExercise(full || { ...lightExercise, description: 'Details unavailable.' });
    } catch (err) {
      setError('Couldn’t load exercise details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
        <div className="min-h-screen bg-gradient-to-br from-black-900 via-black-900 to-black-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"
        />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=Satoshi:wght@400;500;700&display=swap');
        .font-display { font-family: 'Clash Display', sans-serif; }
        .font-body { font-family: 'Satoshi', sans-serif; }
      `}</style>

      <div className="px-4 py-10 md:px-8 lg:px-16 max-w-7xl mx-auto" ref={containerRef}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white flex items-center justify-center gap-4 mb-4">
            <Dumbbell className="w-10 h-10 text-emerald-400" />
            Exercise Library
          </h1>
          <p className="text-white/60 font-body text-lg mb-8">
            {totalCount > 0 ? `${totalCount.toLocaleString()} exercises` : '1,300+ exercises'} • Page {page + 1} of {totalPages}
          </p>

          {/* INSTANT NAVIGATION BUTTON — USES YOUR APP'S ROUTING */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage('organizer')}
            className="relative bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 px-10 py-5 rounded-2xl text-black font-bold text-xl shadow-2xl hover:shadow-emerald-500/50 transition-all flex items-center gap-4 mx-auto group cursor-pointer"
          >
            <Timer className="w-8 h-8 group-hover:rotate-12 transition-transform" />
            Open Workout Organizer
            <ChevronRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform" />

            {todayWorkoutCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-3 -right-3 bg-rose-500 text-white text-xs rounded-full w-9 h-9 flex items-center justify-center font-bold shadow-lg animate-pulse"
              >
                {todayWorkoutCount}
              </motion.span>
            )}
          </motion.button>

          {searchQuery && (
            <p className="text-white/40 text-sm mt-6">
              Found {filteredExercises.length} result{filteredExercises.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-8 max-w-3xl mx-auto flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">×</button>
          </motion.div>
        )}

        {/* Filters */}
        <ExerciseFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Results Info */}
        {!loading && filteredExercises.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6 text-white/50 text-sm">
            {selectedCategory !== 'All' || searchQuery
              ? `Showing ${filteredExercises.length} filtered exercise${filteredExercises.length !== 1 ? 's' : ''}`
              : `Page ${page + 1} • ${LIMIT} per page`}
          </motion.div>
        )}

        {/* Exercise Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-24"
            >
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
              <p className="text-white/60 text-lg">Loading page {page + 1}...</p>
            </motion.div>
          ) : (
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ExerciseGrid
                exercises={filteredExercises}
                loading={false}
                onCardClick={handleCardClick}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center mt-12 mb-8"
          >
            <div className="text-white/60 text-sm mb-4 flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              <span>Use ← → arrows to navigate</span>
            </div>

            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToPrevPage}
                disabled={page === 0 || loading}
                className={`p-4 rounded-full transition-all ${
                  page === 0
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 shadow-lg hover:shadow-emerald-500/25'
                }`}
              >
                <ChevronLeft className="w-8 h-8" />
              </motion.button>

              <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 text-white font-bold text-lg min-w-[140px] text-center">
                Page {page + 1} <span className="text-white/50">/ {totalPages}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNextPage}
                disabled={page >= totalPages - 1 || loading}
                className={`p-4 rounded-full transition-all ${
                  page >= totalPages - 1
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 shadow-lg hover:shadow-emerald-500/25'
                }`}
              >
                <ChevronRight className="w-8 h-8" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredExercises.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 max-w-md mx-auto border border-white/10">
              <Dumbbell className="w-20 h-20 text-white/20 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">No Exercises Found</h3>
              <p className="text-white/60 mb-6">
                {searchQuery || selectedCategory !== 'All'
                  ? 'Try adjusting your filters or search term.'
                  : 'The library is empty. Please try again later.'}
              </p>
              {(searchQuery || selectedCategory !== 'All') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 rounded-xl text-black font-medium"
                >
                  Clear Filters
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Loading Details */}
      {loadingDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-white text-center">Loading details...</p>
          </div>
        </motion.div>
      )}

      {/* Exercise Modal */}
      <ExerciseModal
        exercise={selectedExercise}
        isOpen={!!selectedExercise && !loadingDetails}
        onClose={() => setSelectedExercise(null)}
      />
    </div>
  );
}