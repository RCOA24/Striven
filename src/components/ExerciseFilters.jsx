import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ExerciseFilters({ 
  searchQuery, 
  setSearchQuery, 
  categories, 
  selectedCategory, 
  setSelectedCategory 
}) {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [categories]);

  // Smooth scroll functions
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-8 space-y-6">
      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-2xl mx-auto"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, muscle, or equipment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-green-400/50 focus:bg-white/10 transition-all text-base"
        />
        
        {/* Clear Button */}
        <AnimatePresence>
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Category Filters with Scroll Arrows */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        {/* Left Arrow */}
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-black to-transparent pl-2 pr-8 py-4"
            >
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 hover:bg-white/20 transition-all">
                <ChevronLeft className="w-4 h-4 text-white" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scrollable Categories */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat, index) => {
            const isSelected = selectedCategory === cat;
            const isAll = cat === 'All';

            return (
              <motion.button
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: isSelected ? 1 : 1.05 }}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  relative px-6 py-2.5 rounded-full font-medium transition-all whitespace-nowrap text-sm
                  ${isSelected
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-black shadow-lg shadow-green-500/25'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20'
                  }
                  ${isAll ? 'font-bold' : ''}
                `}
              >
                {cat}
                
                {/* Selected Indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="selectedCategory"
                    className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Right Arrow */}
        <AnimatePresence>
          {showRightArrow && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-l from-black to-transparent pr-2 pl-8 py-4"
            >
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 hover:bg-white/20 transition-all">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Active Filters Summary */}
      <AnimatePresence>
        {(searchQuery || selectedCategory !== 'All') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-2 justify-center"
          >
            <span className="text-white/40 text-sm">Active filters:</span>
            
            {selectedCategory !== 'All' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
              >
                <span className="text-white/70 text-xs">Category: {selectedCategory}</span>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {searchQuery && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
              >
                <span className="text-white/70 text-xs max-w-[200px] truncate">
                  Search: "{searchQuery}"
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {/* Clear All */}
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="text-xs text-red-400 hover:text-red-300 font-medium ml-2 underline underline-offset-2"
            >
              Clear all
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}