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
  Timer, ChevronRight as ChevronRightIcon, Search 
} from 'lucide-react';
import { fetchExercises, fetchExerciseDetails, getCategories } from '../api/exercises';
import ExerciseGrid from '../components/ExerciseGrid';
import ExerciseModal from '../components/ExerciseModal';
import LicenseModal from '../components/LicenseModal';
import { getTodayWorkout } from '../utils/db';
import { AppContext } from '../App'; 

// Memoized Category Pill Component
const CategoryPill = React.memo(({ cat, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`
      whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 
      active:scale-95 select-none snap-start shrink-0
      ${isSelected
        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105 font-bold'
        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white backdrop-blur-md border border-white/5'
      }
    `}
  >
    {cat.charAt(0).toUpperCase() + cat.slice(1)}
  </button>
));

export default function ExerciseLibraryVisuals() {
  const { setCurrentPage } = useContext(AppContext); 

  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState(['All']);
  const [todayWorkoutCount, setTodayWorkoutCount] = useState(0);
  const [showLicense, setShowLicense] = useState(false);
  
  const containerRef = useRef(null);
  const categoryScrollRef = useRef(null); // Ref for scroll container

  const LIMIT = 10; 

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
    const interval = setInterval(loadTodayCount, 5000); // Reduced frequency for performance
    return () => clearInterval(interval);
  }, []);

  // Debounce Search
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
        search: debouncedSearch.trim() || null,
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
  }, [selectedCategory, debouncedSearch]);

  useEffect(() => {
    fetchPage(0);
  }, [selectedCategory, debouncedSearch, fetchPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (document.activeElement.tagName === 'INPUT') return; // Ignore if typing
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
          <p className="text-white/60 text-lg font-medium">Loading page {page + 1}...</p>
        </motion.div>
      ) : (
        <motion.div
          key={page + selectedCategory + debouncedSearch} // Unique key forces animation on change
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <ExerciseGrid
            exercises={filteredExercises}
            loading={false}
            onCardClick={handleCardClick}
          />
        </motion.div>
      )}
    </AnimatePresence>
  ), [loading, page, filteredExercises, selectedCategory, debouncedSearch]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden selection:bg-emerald-500/30 font-sans">
      
      {/* Optimized Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] opacity-40" />
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-gradient {
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}</style>

      <div className="px-4 pt-6 pb-24 md:px-6 lg:px-8 max-w-7xl mx-auto" ref={containerRef}>
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              Workout Library
            </h1>
            <p className="text-white/60 font-medium text-lg">
              {totalCount > 0 ? `${totalCount.toLocaleString()} Exercises` : 'Loading...'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              className="w-full bg-white/10 border border-white/5 focus:border-emerald-500/50 rounded-xl py-3 pl-10 pr-4 text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>

        {/* Workout Organizer Card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentPage('organizer')}
          className="w-full relative overflow-hidden bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-10 text-left group shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-400 ring-1 ring-emerald-500/20">
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Current Workout</h3>
                <p className="text-white/50 text-sm font-medium">
                  {todayWorkoutCount > 0 
                    ? `${todayWorkoutCount} exercises in progress` 
                    : 'Tap to start a new session'}
                </p>
              </div>
            </div>
            <div className="bg-white/5 p-2 rounded-full text-white/40 group-hover:bg-white/10 group-hover:text-white transition-all">
              <ChevronRightIcon className="w-5 h-5" />
            </div>
          </div>
          
          {todayWorkoutCount > 0 && (
            <div className="absolute top-4 right-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </motion.button>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-500/10 rounded">×</button>
          </motion.div>
        )}

        {/* 
            CATEGORIES SCROLL CONTAINER 
            - mask-gradient: fades out edges
            - overflow-x-auto: allows scrolling
            - scroll-smooth: smooth physics
        */}
        <div className="relative mb-8 -mx-4 md:-mx-8">
          <div 
            ref={categoryScrollRef}
            className="flex flex-nowrap gap-3 overflow-x-auto px-4 md:px-8 py-4 no-scrollbar scroll-smooth snap-x snap-mandatory mask-gradient"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {categories.map((cat) => (
              <CategoryPill
                key={cat}
                cat={cat}
                isSelected={selectedCategory === cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(0);
                }}
              />
            ))}
            {/* Spacer to allow last item to be seen clearly */}
            <div className="w-4 shrink-0" />
          </div>
        </div>

        {/* Exercise Grid */}
        {memoizedGrid}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-8 mt-12">
            <button
              onClick={goToPrevPage}
              disabled={page === 0 || loading}
              className="group p-4 rounded-full bg-zinc-900 border border-white/10 hover:bg-zinc-800 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 text-white/80 group-hover:text-white" />
            </button>

            <span className="text-sm font-semibold text-white/40 uppercase tracking-widest">
              Page <span className="text-white text-lg mx-1">{page + 1}</span> / {totalPages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={page >= totalPages - 1 || loading}
              className="group p-4 rounded-full bg-zinc-900 border border-white/10 hover:bg-zinc-800 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronRight className="w-6 h-6 text-white/80 group-hover:text-white" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredExercises.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24"
          >
            <div className="bg-zinc-900/50 backdrop-blur-md rounded-[2rem] p-10 max-w-md mx-auto border border-white/5">
              <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Dumbbell className="w-10 h-10 text-white/40" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Exercises Found</h3>
              <p className="text-white/50 mb-8 leading-relaxed">
                {searchQuery || selectedCategory !== 'All'
                  ? 'We couldn\'t find any matches. Try adjusting your filters.'
                  : 'The library is currently empty.'}
              </p>
              {(searchQuery || selectedCategory !== 'All') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="bg-white text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
                >
                  Clear Filters
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-20 px-4 text-center">
          <div className="inline-block bg-zinc-900/50 rounded-2xl p-8 border border-white/5 backdrop-blur-md max-w-sm w-full">
            <h3 className="text-white font-bold text-xl mb-1">Striven</h3>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-6">Version 1.0.0</p>
            <button
              onClick={() => setShowLicense(true)}
              className="text-emerald-500 text-sm font-semibold hover:text-emerald-400 transition-colors"
            >
              View License & Credits
            </button>
            <p className="text-zinc-600 text-xs mt-6 font-medium">
              Privacy-First Fitness<br/>
              © 2025 Rodney Austria
            </p>
          </div>
        </div>
      </div>

      {/* Loading Details Overlay */}
      {loadingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-white/10 flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-white font-bold">Loading details...</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <ExerciseModal
        exercise={selectedExercise}
        isOpen={!!selectedExercise && !loadingDetails}
        onClose={() => setSelectedExercise(null)}
      />
      <LicenseModal isOpen={showLicense} onClose={() => setShowLicense(false)} />
    </div>
  );
}