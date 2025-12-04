import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

// --- Assets ---
const LOGO_URL = "/StrivenLogo.png"; 
const AUDIO_URL = "/intro.mp3"; 

const Intro = ({ onComplete }) => {
  // Stages: 'initial' -> 'loading' -> 'expanding' -> 'fading' -> 'done'
  const [stage, setStage] = useState('initial'); 
  const audioRef = useRef(null);

  useEffect(() => {
    // --- 1. Audio Setup ---
    const audio = new Audio(AUDIO_URL);
    audio.volume = 0.5;
    audioRef.current = audio;
    
    const playAudio = async () => {
      try {
        await audio.play();
      } catch (err) {
        // Ignore autoplay blocks
      }
    };
    playAudio();

    // --- 2. Animation Timeline ---
    const sequence = async () => {
      // Small buffer to let the browser paint the initial black screen
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, 500)));
      setStage('loading');
      
      // Allow animations to play
      await new Promise(r => setTimeout(r, 2500));
      setStage('expanding'); 

      // Wait for Green Circle Expansion
      await new Promise(r => setTimeout(r, 1000));
      setStage('fading'); 

      // Wait for Fade Out
      await new Promise(r => setTimeout(r, 1200));
      
      if (onComplete) onComplete();
    };

    sequence();
  }, [onComplete]);

  return (
    <motion.div
      key="intro-container"
      // Optimization: Animate opacity on a GPU-promoted layer
      animate={{ opacity: stage === 'fading' ? 0 : 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden font-sans touch-none ${
        stage === 'fading' ? 'pointer-events-none' : ''
      }`}
      // Force GPU layer for the whole container
      style={{ willChange: "opacity" }} 
    >
      
      {/* --- 1. Dynamic Background --- */}
      {/* Optimization: Used transform-gpu and will-change to prevent jank on the blur */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#22c55e] rounded-full blur-[80px] transform-gpu"
          style={{ 
            x: "-50%", 
            y: "-50%",
            willChange: "transform, opacity",
            backfaceVisibility: "hidden" // Fixes iOS flicker
          }}
        />
      </div>

      {/* Content Wrapper */}
      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center gap-8 transform-gpu"
        animate={{ 
          opacity: stage === 'expanding' || stage === 'fading' ? 0 : 1, 
          scale: stage === 'expanding' ? 0.9 : 1
        }} 
        transition={{ duration: 0.4 }}
        style={{ willChange: "opacity, transform" }}
      >
        
        {/* --- 2. The Logo Wrapper --- */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" stroke="#333" strokeWidth="4" fill="none" />
            <motion.circle 
              cx="50" cy="50" r="46" 
              stroke="#22c55e" 
              strokeWidth="4" 
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
            />
          </svg>

          {/* Inner Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-2xl shadow-green-500/20 transform-gpu"
          >
            <img 
              src={LOGO_URL} 
              alt="Striven Logo" 
              className="w-14 h-14 object-contain"
            />
            {/* AI Scan Effect - OPTIMIZED */}
            {/* Changed from 'top' to 'translateY' for 60fps mobile rendering */}
            <motion.div 
              initial={{ translateY: "-100%" }}
              animate={{ translateY: "200%" }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5, ease: "linear" }}
              className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-green-400/30 to-transparent w-full"
              style={{ willChange: "transform" }}
            />
          </motion.div>
        </div>

        {/* --- 3. Typography --- */}
        <div className="text-center space-y-2">
          <div className="overflow-hidden h-14 relative">
            <motion.h1 
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: [0.6, 0.01, -0.05, 0.95], delay: 0.4 }}
              className="text-5xl font-bold text-white tracking-tight"
            >
              Striven<span className="text-green-500">.</span>
            </motion.h1>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex items-center justify-center gap-2 text-sm text-gray-400 font-medium uppercase tracking-widest"
          >
            <span>Fitness</span>
            <span className="w-1 h-1 bg-green-500 rounded-full" />
            <span>Exercise</span>
            <span className="w-1 h-1 bg-green-500 rounded-full" />
            <span>Nutrition</span>
          </motion.div>
        </div>
      </motion.div>

      {/* --- 4. The Exit Animation (Green Expansion) --- */}
      {(stage === 'expanding' || stage === 'fading') && (
        <motion.div
          initial={{ scale: 0, borderRadius: "100%" }}
          animate={{ scale: 30 }}
          transition={{ duration: 0.8, ease: "circIn" }}
          className="absolute bg-green-500 w-24 h-24 rounded-full z-20 pointer-events-none transform-gpu"
          style={{ 
            willChange: "transform",
            backfaceVisibility: "hidden", // Crucial for iOS smoothness
            perspective: 1000
          }}
        />
      )}

    </motion.div>
  );
};

export default Intro;