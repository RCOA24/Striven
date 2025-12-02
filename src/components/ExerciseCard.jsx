// src/components/ExerciseCard.jsx
import React, { useState, useEffect } from 'react';
import { Play, Dumbbell, Heart, Sparkles, ImageOff, Info } from 'lucide-react';

// NOTE: Ensure 'fallback-exercise.gif' is inside the 'public' folder
const FALLBACK_GIF = '/fallback-exercise.gif';
const SAFETY_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%2327272a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2371717a'%3ENo Preview%3C/text%3E%3C/svg%3E";

export default function ExerciseCard({ exercise, onClick }) {
  const [imgState, setImgState] = useState({
    src: exercise.previewImage || exercise.gifUrl || FALLBACK_GIF,
    hasError: false,
    loaded: false,
    usingFallback: false
  });

  // Reset state if the exercise prop changes (important for search/filtering)
  useEffect(() => {
    setImgState({
      src: exercise.previewImage || exercise.gifUrl || FALLBACK_GIF,
      hasError: false,
      loaded: false,
      usingFallback: false
    });
  }, [exercise.id, exercise.previewImage, exercise.gifUrl]);

  const handleError = (e) => {
    // 1. Stop browser from retrying immediately
    e.target.onerror = null;

    // 2. Check what URL failed
    const failedSrc = e.target.src || '';

    setImgState(prev => {
      // CRITICAL FAILURE: If we failed on the fallback GIF (or if we already flagged usingFallback)
      // switch to the SVG Placeholder.
      if (prev.usingFallback || failedSrc.includes('fallback-exercise.gif')) {
        return {
          ...prev,
          src: SAFETY_PLACEHOLDER,
          hasError: true, // Now we truly have an error (SVG shown)
          loaded: true,
          usingFallback: true
        };
      }

      // SOFT FAILURE: First failure (API Image). Switch to local fallback GIF.
      // We do NOT set hasError to true here, because the fallback GIF is still a valid visual.
      return {
        ...prev,
        src: FALLBACK_GIF,
        usingFallback: true,
        hasError: false, 
        loaded: true
      };
    });
  };

  const handleLoad = () => {
    setImgState(prev => ({ ...prev, loaded: true }));
  };

  return (
    <div
      onClick={() => onClick(exercise)}
      className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10 border border-white/10 hover:border-emerald-500/30"
    >
      {/* --- Image Container --- */}
      <div className="relative h-48 overflow-hidden bg-zinc-900/50">
        
        {/* 1. Skeleton Loader (Visible while loading) */}
        {!imgState.loaded && (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse z-10" />
        )}

        {/* 2. The Image */}
        <img
          src={imgState.src}
          alt={exercise.name}
          // IMPORTANT: referrerPolicy="no-referrer" allows loading images from APIs that block hotlinking
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-all duration-700 ease-out
            ${imgState.hasError ? 'opacity-40 grayscale-[0.5]' : 'group-hover:scale-110'}
            ${imgState.loaded ? 'opacity-100' : 'opacity-0'}
          `}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
        />

        {/* 3. "GIF" Badge -> ONLY show if Real API Image loaded successfully */}
        {!imgState.hasError && imgState.loaded && !imgState.usingFallback && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 shadow-lg animate-pulse z-20">
            <Sparkles className="w-3 h-3" />
            GIF
          </div>
        )}

        {/* 4. "Generic" Badge -> Show if we switched to the Fallback GIF successfully */}
        {!imgState.hasError && imgState.loaded && imgState.usingFallback && (
          <div className="absolute top-3 right-3 bg-zinc-700/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 border border-white/5 z-20">
            <Info className="w-3 h-3" />
            Generic
          </div>
        )}

        {/* 5. Error State Indicator -> Show if Fallback also failed (SVG Mode) */}
        {imgState.hasError && imgState.loaded && (
          <div className="absolute top-3 right-3 bg-zinc-800/80 backdrop-blur-md text-zinc-400 text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 border border-white/5 z-20">
            <ImageOff className="w-3 h-3" />
            No Preview
          </div>
        )}

        {/* Gradient Overlay (Darker at bottom for text readability) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play Icon (Hover Effect) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
          <div className="bg-emerald-500 p-4 rounded-full shadow-2xl transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-8 h-8 text-black fill-current" />
          </div>
        </div>

        {/* Target Muscle Label */}
        {exercise.muscles && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <Heart className="w-4 h-4 text-emerald-400" />
            <span className="text-white text-xs font-medium truncate capitalize">
              {exercise.muscles}
            </span>
          </div>
        )}
      </div>

      {/* --- Text Content --- */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 leading-tight font-display">
          {exercise.name}
        </h3>

        <div className="flex items-center justify-between mb-3">
          {/* Category Tag */}
          <span className="bg-emerald-500/20 px-3 py-1.5 rounded-full text-emerald-400 text-xs font-semibold border border-emerald-500/30 capitalize">
            {exercise.category || exercise.bodyPart || 'General'}
          </span>

          {/* Equipment Tag */}
          <span className="text-white/60 text-xs flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px] capitalize">
              {exercise.equipment || 'Bodyweight'}
            </span>
          </span>
        </div>

        {/* Description Preview */}
        {exercise.description && (
          <p className="text-white/60 text-sm line-clamp-2 leading-relaxed">
            {exercise.description.replace(/<[^>]*>/g, '').substring(0, 80)}
            {exercise.description.length > 80 && '...'}
          </p>
        )}
      </div>

      {/* Epic Hover Glow Effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-green-500/30 blur-2xl animate-pulse" />
      </div>
    </div>
  );
}