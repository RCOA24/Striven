/**
 * Striven - Privacy-First Fitness Tracker
 * Copyright (c) 2025 Rodney Austria
 * Licensed under the MIT License
 */

// src/pages/ExerciseLibraryVisuals.jsx
'use client';

import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, Loader2, AlertCircle, ChevronLeft, ChevronRight, 
  Keyboard, Timer, ChevronRight as ChevronRightIcon, Search 
} from 'lucide-react';
import { fetchExercises, fetchExerciseDetails, getCategories } from '../api/exercises';
import ExerciseFilters from '../components/ExerciseFilters';
import ExerciseGrid from '../components/ExerciseGrid';
import ExerciseModal from '../components/ExerciseModal';
import { getTodayWorkout } from '../utils/db';

// Context to access setCurrentPage from App.jsx
import { AppContext } from '../App'; 

export default function ExerciseLibraryVisuals() {
  const { setCurrentPage } = useContext(AppContext); 

  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(''); // New debounced state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState(['All']);
  const [todayWorkoutCount, setTodayWorkoutCount] = useState(0);
  const containerRef = useRef(null);

  const LIMIT = 10; // Exercises per page

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

  // Debounce Search Logic to prevent API spam
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch exercises
  const fetchPage = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchExercises(pageNum, {
        bodyPart: selectedCategory !== 'All' ? selectedCategory : null,
        search: debouncedSearch.trim() || null, // Use debounced value
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
  }, [selectedCategory, debouncedSearch]); // Depend on debouncedSearch

  useEffect(() => {
    fetchPage(0);
  }, [selectedCategory, debouncedSearch]);

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

  // Memoize the grid to prevent re-renders when the 3s timer updates the workout count
  const memoizedGrid = React.useMemo(() => (
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
  ), [loading, page, filteredExercises]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden selection:bg-emerald-500/30">
      {/* Optimized Background - Static CSS blur is lighter on mobile GPU than JS animation */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-40" />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700&display=swap');
        .font-apple { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        
        /* Hide scrollbar for horizontal filters */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="px-4 pt-6 pb-24 md:px-6 lg:px-8 max-w-7xl mx-auto font-apple" ref={containerRef}>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              Library
            </h1>
            <p className="text-white/60 font-medium">
              {totalCount > 0 ? `${totalCount.toLocaleString()} Exercises` : 'Loading...'}
            </p>
          </div>

          {/* Search Bar - Apple Style */}
          <div className="relative w-full md:w-72 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-white/40 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              className="w-full bg-white/10 border border-white/5 focus:border-emerald-500/50 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>

        {/* Featured Card: Workout Organizer */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentPage('organizer')}
          className="w-full relative overflow-hidden bg-gradient-to-br from-emerald-900/40 to-black border border-white/10 rounded-3xl p-6 mb-10 text-left group shadow-2xl shadow-black/50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500/20 p-3 rounded-2xl text-emerald-400">
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Current Workout</h3>
                <p className="text-white/50 text-sm">
                  {todayWorkoutCount > 0 
                    ? `${todayWorkoutCount} exercises in progress` 
                    : 'Start a new session'}
                </p>
              </div>
            </div>
            <div className="bg-white/10 p-2 rounded-full text-white/60 group-hover:bg-white/20 group-hover:text-white transition-all">
              <ChevronRightIcon className="w-5 h-5" />
            </div>
          </div>
          
          {todayWorkoutCount > 0 && (
            <div className="absolute top-4 right-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </motion.button>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-8 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">×</button>
          </motion.div>
        )}

        {/* Categories - Horizontal Scroll (Apple Style Pills) */}
        <div className="mb-8 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(0);
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-white text-black shadow-lg shadow-white/10 scale-105'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Grid (Memoized) */}
        {memoizedGrid}

        {/* Pagination - Apple Style */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 mt-12">
            <button
              onClick={goToPrevPage}
              disabled={page === 0 || loading}
              className="p-4 rounded-full bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <span className="text-sm font-medium text-white/40">
              Page <span className="text-white">{page + 1}</span> of {totalPages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={page >= totalPages - 1 || loading}
              className="p-4 rounded-full bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
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
                  className="bg-white text-black px-6 py-3 rounded-xl font-medium"
                >
                  Clear Filters
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Loading Details Overlay */}
      {loadingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-white/10 flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
            <p className="text-white/80 text-sm font-medium">Loading details...</p>
          </div>
        </div>
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