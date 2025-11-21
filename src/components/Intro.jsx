import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Footprints, ChevronRight } from 'lucide-react';

// --- Animations Variants (Defined outside to prevent re-creation) ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.5,
    filter: "blur(10px)",
    transition: { duration: 0.8, ease: "easeInOut" }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

const Intro = ({ onComplete }) => {
  // We use a single state to trigger the exit sequence
  const [isExiting, setIsExiting] = useState(false);
  const [count, setCount] = useState(0);

  // Sequence Management
  useEffect(() => {
    // specific timer for the "steps" counter effect
    const counterInterval = setInterval(() => {
      setCount(prev => (prev < 100 ? prev + 4 : 100));
    }, 30);

    // Sequence timer
    const sequenceTimer = setTimeout(() => {
      setIsExiting(true);
    }, 3500); // Start exit sequence at 3.5s

    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4300); // Unmount/Finish at 4.3s

    return () => {
      clearInterval(counterInterval);
      clearTimeout(sequenceTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden">
      
      {/* --- Global Styles for Fonts --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=Satoshi:wght@500;700&display=swap');
        .font-display { font-family: 'Clash Display', sans-serif; }
        .font-body { font-family: 'Satoshi', sans-serif; }
        .glass-panel {
          background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
        }
      `}</style>

      {/* --- Ambient Background (GPU Optimized) --- */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2 }}
          className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#39ff14_0%,_transparent_50%)] opacity-20 blur-[100px]"
        />
        <motion.div 
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/2 w-[100vw] h-[100vw] bg-[radial-gradient(circle,_#ff2e63_0%,_transparent_70%)] opacity-10 blur-[120px]"
        />
      </div>

      {/* --- Main Content Wrapper --- */}
      <AnimatePresence mode='wait'>
        {!isExiting ? (
          <motion.div
            key="intro-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 flex flex-col items-center"
          >
            
            {/* 1. The Logo Container */}
            <motion.div variants={itemVariants} className="relative mb-8 group">
              {/* Pulse Effect */}
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              
              {/* Glass Card Logo */}
              <div className="relative glass-panel p-8 rounded-3xl shadow-2xl shadow-green-900/20">
                {/* Progress Ring SVG */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 p-1" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
                  <motion.circle 
                    cx="50" cy="50" r="48" 
                    stroke="#39ff14" 
                    strokeWidth="2" 
                    fill="none"
                    strokeDasharray="301"
                    strokeDashoffset="301"
                    strokeLinecap="round"
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                </svg>

                {/* Icon */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Activity className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
                </motion.div>

                {/* Floating Badge */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="absolute -top-2 -right-2 bg-[#ff2e63] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1"
                >
                  <Zap size={10} fill="currentColor" /> GO
                </motion.div>
              </div>
            </motion.div>

            {/* 2. Brand Text */}
            <motion.div variants={itemVariants} className="text-center space-y-2">
              <h1 className="text-6xl md:text-7xl font-display font-bold text-white tracking-tight">
                Striven<span className="text-[#39ff14]">.</span>
              </h1>
              
              {/* 3. Tagline & Data Simulation */}
              <div className="flex items-center justify-center gap-3 text-white/60 font-body">
                <span className="flex items-center gap-1 text-sm tracking-widest uppercase">
                  <Footprints size={14} className="text-[#39ff14]" />
                  Track your Journey
                </span>
                <span className="w-1 h-1 bg-white/30 rounded-full" />
                <span className="font-mono text-[#ff2e63] font-bold min-w-[3ch] text-left">
                  {count}%
                </span>
              </div>
            </motion.div>

          </motion.div>
        ) : (
          /* --- Exit Transition (The "Zoom Through") --- */
          <motion.div
            key="exit-transition"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 20 }}
            transition={{ duration: 0.8, ease: "circIn" }}
            className="absolute inset-0 z-20 bg-[#39ff14] rounded-full"
            style={{ pointerEvents: "none" }}
          />
        )}
      </AnimatePresence>

      {/* Bottom loader bar (Optional subtle detail) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
        />
      </div>
    </div>
  );
};

export default Intro;