import React, { useState, useEffect, useCallback } from 'react';
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

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Load exercises with pagination
  const loadExercises = useCallback(async (resetPage = false) => {
    if (!hasMore && !resetPage) return;
    
    setLoading(true);
    setError(null);

    try {
      const currentPage = resetPage ? 0 : page;
      const options = {};
      
      // Apply category filter to API call
      if (selectedCategory !== 'All') {
        options.category = selectedCategory;
      }

      const result = await fetchExercises(currentPage, options);
      
      if (result.error) {
        setError(result.error);
      }

      setExercises(prev => resetPage ? result.exercises : [...prev, ...result.exercises]);
      setHasMore(result.hasMore);
      setTotalCount(result.total || 0);
      
      if (resetPage) {
        setPage(0);
      }
    } catch (err) {
      setError('Failed to load exercises. Please try again.');
      console.error('Load exercises error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, selectedCategory]);

  // Initial load
  useEffect(() => {
    loadExercises();
  }, []);

  // Reload when category changes
  useEffect(() => {
    setExercises([]);
    setPage(0);
    setHasMore(true);
    loadExercises(true);
  }, [selectedCategory]);

  // Client-side filtering for search
  useEffect(() => {
    const timer = setTimeout(() => {
      let filtered = exercises;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(ex =>
          ex.name.toLowerCase().includes(query) ||
          ex.category.toLowerCase().includes(query) ||
          ex.equipment?.toLowerCase().includes(query) ||
          ex.muscles?.toLowerCase().includes(query)
        );
      }

      setFilteredExercises(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, exercises]);

  // Load full exercise details when card is clicked
  const handleCardClick = async (lightExercise) => {
    setLoadingDetails(true);
    setSelectedExercise(null);
    
    try {
      const fullExercise = await fetchExerciseDetails(lightExercise.id);
      if (fullExercise) {
        setSelectedExercise(fullExercise);
      } else {
        setError('Failed to load exercise details');
      }
    } catch (err) {
      console.error('Failed to load exercise details:', err);
      setError('Failed to load exercise details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Load more exercises
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
    }
  };

  // Trigger load when page changes
  useEffect(() => {
    if (page > 0) {
      loadExercises();
    }
  }, [page]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black-900 via-black-900 to-black-900 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 9, repeat: Infinity, delay: 2 }}
          className="absolute top-1/2 right-1/3 w-72 h-72 bg-green-300/10 rounded-full blur-3xl"
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

      <div className="px-4 py-8 md:px-8 lg:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white flex items-center justify-center mb-3">
            <Dumbbell className="w-8 h-8 md:w-10 md:h-10 text-green-400 mr-3" />
            Exercise Library
          </h2>
          <p className="text-white/60 font-body text-base md:text-lg">
            {totalCount > 0 ? `${totalCount.toLocaleString()}+ exercises` : '1,000+ exercises'} powered by Wger
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 max-w-2xl mx-auto flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              {error.includes('demo data') && (
                <p className="text-xs text-red-400/70 mt-1">
                  API might be temporarily unavailable. Showing fallback examples.
                </p>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 text-xl"
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

        {/* Results Count */}
        {!loading && filteredExercises.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-6"
          >
            <p className="text-white/50 text-sm">
              {searchQuery || selectedCategory !== 'All'
                ? `Found ${filteredExercises.length} exercise${filteredExercises.length !== 1 ? 's' : ''}`
                : `Browsing ${filteredExercises.length} exercise${filteredExercises.length !== 1 ? 's' : ''}`}
            </p>
          </motion.div>
        )}

        {/* Exercise Grid */}
        <ExerciseGrid
          exercises={filteredExercises}
          loading={loading && page === 0}
          onCardClick={handleCardClick}
        />

        {/* Load More Button */}
        {!searchQuery && hasMore && filteredExercises.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button
              onClick={loadMore}
              disabled={loading}
              className="group relative bg-white/5 backdrop-blur-md px-8 py-4 rounded-2xl text-white border border-white/10 hover:border-green-400/50 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Load More Exercises
                  <span className="text-green-400 text-sm">({exercises.length} loaded)</span>
                </span>
              )}
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredExercises.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-20"
          >
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-12 max-w-md mx-auto border border-white/10">
              <Dumbbell className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Exercises Found</h3>
              <p className="text-white/60 mb-6">
                {searchQuery 
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : 'No exercises match your filters. Try adjusting your selection.'}
              </p>
              {(searchQuery || selectedCategory !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="bg-gradient-to-r from-green-400 to-emerald-500 px-6 py-2.5 rounded-xl text-black font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Initial Loading State */}
        {loading && page === 0 && exercises.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Loader2 className="w-12 h-12 text-green-400 mx-auto mb-4 animate-spin" />
            <p className="text-white/60">Loading exercises...</p>
          </motion.div>
        )}
      </div>

      {/* Loading Modal Overlay */}
      {loadingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            <Loader2 className="w-12 h-12 text-green-400 mx-auto mb-4 animate-spin" />
            <p className="text-white text-center">Loading exercise details...</p>
          </div>
        </div>
      )}

      {/* Exercise Details Modal */}
      <ExerciseModal
        exercise={selectedExercise}
        isOpen={!!selectedExercise && !loadingDetails}
        onClose={() => setSelectedExercise(null)}
      />
    </div>
  );
}