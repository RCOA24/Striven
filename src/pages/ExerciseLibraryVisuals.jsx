// src/pages/ExerciseLibraryVisuals.jsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Loader2, AlertCircle } from 'lucide-react';
import { fetchExercises, fetchExerciseDetails, getCategories } from '../api/exercises';
import ExerciseFilters from '../components/ExerciseFilters';
import ExerciseGrid from '../components/ExerciseGrid';
import ExerciseModal from '../components/ExerciseModal';

export default function ExerciseLibraryVisuals() {
  // State management
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [categories, setCategories] = useState(['All']);
  const [totalCount, setTotalCount] = useState(0);
  const gridRef = useRef(null);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Categories load failed:', err);
        setCategories(['All']); // Fallback
      }
    };
    loadCategories();
  }, []);

  // Load exercises with infinite scroll
  const loadExercises = useCallback(async (resetPage = false) => {
    if (!hasMore && !resetPage) return;

    setLoading(true);
    setError(null);

    try {
      const currentPage = resetPage ? 0 : page;
      const result = await fetchExercises(currentPage, { bodyPart: selectedCategory !== 'All' ? selectedCategory : null });

      if (result.error) {
        setError(result.error);
        return;
      }

      setExercises(prev => resetPage ? result.exercises : [...prev, ...result.exercises]);
      setHasMore(result.hasMore !== undefined ? result.hasMore : false);
      setTotalCount(result.total || result.exercises.length);
      if (resetPage) setPage(0);
      else setPage(prev => prev + 1);
    } catch (err) {
      setError('Failed to load exercises. Check your connection.');
      console.error('Load exercises error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, selectedCategory]);

  // Initial load + category change
  useEffect(() => {
    setExercises([]);
    loadExercises(true);
  }, [selectedCategory]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = exercises.filter(ex =>
        (ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         ex.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (ex.equipment?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
         (ex.muscles?.toLowerCase().includes(searchQuery.toLowerCase()) || ''))
      );
      setFilteredExercises(filtered);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, exercises]);

  // Load details
  const handleCardClick = async (lightExercise) => {
    setLoadingDetails(true);
    setSelectedExercise(null);
    try {
      const fullExercise = await fetchExerciseDetails(lightExercise.id);
      setSelectedExercise(fullExercise || { ...lightExercise, description: 'Details unavailable.' });
    } catch (err) {
      console.error('Details load failed:', err);
      setError('Couldn’t load exercise details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Infinite scroll logic
  const handleScroll = useCallback(() => {
    if (!gridRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = gridRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200 && !loading && hasMore) {
      loadExercises();
    }
  }, [loading, hasMore]);

  useEffect(() => {
    const grid = gridRef.current;
    if (grid) {
      grid.addEventListener('scroll', handleScroll);
      return () => grid.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Global Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=Satoshi:wght@400;500;700&display=swap');
        .font-display { font-family: 'Clash Display', sans-serif; }
        .font-body { font-family: 'Satoshi', sans-serif; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="px-4 py-10 md:px-8 lg:px-16 max-w-7xl mx-auto relative" ref={gridRef}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white flex items-center justify-center gap-4 mb-4">
            <Dumbbell className="w-10 h-10 text-emerald-400" />
            Exercise Library
          </h1>
          <p className="text-white/60 font-body text-lg">
            {totalCount > 0 ? `${totalCount.toLocaleString()}+ exercises` : '1,300+ exercises'} powered by your ExerciseDB API
          </p>
          {searchQuery && (
            <p className="text-white/40 text-sm mt-2">
              Showing {filteredExercises.length} results for "{searchQuery}"
            </p>
          )}
        </motion.div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-8 max-w-3xl mx-auto flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </button>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8 text-white/50 text-sm"
          >
            {searchQuery || selectedCategory !== 'All'
              ? `Found ${filteredExercises.length} exercise${filteredExercises.length !== 1 ? 's' : ''}`
              : `Browsing ${filteredExercises.length} of ${totalCount.toLocaleString()} exercises`}
          </motion.div>
        )}

        {/* Exercise Grid with Scroll */}
        <ExerciseGrid
          exercises={filteredExercises}
          loading={loading && page === 0}
          onCardClick={handleCardClick}
        />

        {/* Loading More Indicator */}
        {loading && hasMore && filteredExercises.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6"
          >
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-white/60 text-sm mt-2">Loading more...</p>
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
              <h3 className="text-2xl font-bold text-white mb-4">No Matches</h3>
              <p className="text-white/60 mb-6">
                {searchQuery
                  ? `No results for "${searchQuery}". Try another search.`
                  : 'No exercises match your filters. Reset to browse all.'}
              </p>
              {(searchQuery || selectedCategory !== 'All') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 rounded-xl text-black font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                >
                  Reset Filters
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Initial Load */}
        {loading && page === 0 && exercises.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
            <p className="text-white/60 text-lg">Fetching your exercises...</p>
          </motion.div>
        )}
      </div>

      {/* Loading Details Overlay */}
      {loadingDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
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