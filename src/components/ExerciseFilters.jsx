// src/components/ExerciseFilters.jsx
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export default function ExerciseFilters({ 
  searchQuery, 
  setSearchQuery, 
  categories = [], 
  selectedCategory, 
  setSelectedCategory 
}) {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScroll();
    const handleScroll = () => checkScroll();
    const handleResize = () => checkScroll();

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Initial check
    setTimeout(checkScroll, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [categories]);

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 240;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  return (
    <div className="mb-10 space-y-7">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative max-w-2xl mx-auto"
      >
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        
        <input
          type="text"
          placeholder="Search exercises, muscles, or equipment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-12 py-4 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/20 focus:bg-white/8 transition-all duration-300 text-lg font-light"
        />

        <AnimatePresence>
          {searchQuery && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5 text-white/60 hover:text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Category Pills */}
      <div className="relative">
        {/* Left Arrow */}
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-black via-black/80 to-transparent pl-4 pr-10 py-8"
            >
              <div className="bg-white/10 backdrop-blur-xl p-3 rounded-full border border-white/20 shadow-2xl hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all">
                <ChevronLeft className="w-5 h-5 text-white" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scrollable Categories */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide scroll-smooth px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat, i) => {
            const isActive = selectedCategory === cat;
            const isAll = cat === 'All';

            return (
              <motion.button
                key={cat}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  relative px-6 py-3 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-black shadow-2xl shadow-emerald-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10 hover:border-emerald-500/30'
                  }
                  ${isAll ? 'font-bold' : ''}
                `}
              >
                {isAll && <Sparkles className="inline w-4 h-4 mr-1" />}
                {cat}
                
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-l from-black via-black/80 to-transparent pr-4 pl-10 py-8"
            >
              <div className="bg-white/10 backdrop-blur-xl p-3 rounded-full border border-white/20 shadow-2xl hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filters */}
      <AnimatePresence>
        {(searchQuery || selectedCategory !== 'All') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <span className="text-white/50 text-sm font-medium">Filters:</span>

            {selectedCategory !== 'All' && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/30"
              >
                <span className="text-emerald-400 text-sm font-medium">{selectedCategory}</span>
                <button onClick={() => setSelectedCategory('All')} className="hover:bg-white/20 rounded-full p-1">
                  <X className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </motion.div>
            )}

            {searchQuery && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20"
              >
                <span className="text-white/80 text-sm max-w-[180px] truncate">"{searchQuery}"</span>
                <button onClick={() => setSearchQuery('')} className="hover:bg-white/20 rounded-full p-1">
                  <X className="w-3.5 h-3.5 text-white/60" />
                </button>
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={clearFilters}
              className="text-red-400 hover:text-red-300 text-sm font-medium underline underline-offset-2 transition-colors"
            >
              Clear all
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}