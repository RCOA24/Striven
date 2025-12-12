import React, { useMemo } from 'react';
import { Ruler, Weight, Info } from 'lucide-react';

const BMIIndicator = ({ height, weight }) => {
  const { bmi, category, color, progressPercent } = useMemo(() => {
    if (!height || !weight || height <= 0 || weight <= 0) {
      return { bmi: 0, category: 'Unknown', color: 'text-zinc-500', progressPercent: 0 };
    }

    const heightM = parseFloat(height) / 100;
    const value = parseFloat(weight) / (heightM * heightM);
    
    let cat = 'Normal';
    let col = 'text-emerald-400';
    
    if (value < 18.5) {
      cat = 'Underweight';
      col = 'text-blue-400';
    } else if (value >= 25 && value < 30) {
      cat = 'Overweight';
      col = 'text-yellow-400';
    } else if (value >= 30) {
      cat = 'Obese';
      col = 'text-rose-400';
    }

    // Scale: 15 (min) to 40 (max)
    const minScale = 15;
    const maxScale = 40;
    const rawPercent = ((value - minScale) / (maxScale - minScale)) * 100;
    const clampedPercent = Math.min(Math.max(rawPercent, 0), 100);

    return { 
      bmi: value.toFixed(1), 
      category: cat, 
      color: col,
      progressPercent: clampedPercent 
    };
  }, [height, weight]);

  return (
    // FIX: Removed 'max-w-sm' so it fills the width like the card above it
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-zinc-100 font-semibold flex items-center gap-2">
          <Info size={16} className="text-zinc-500" />
          Body Mass Index
        </h3>
        {/* Category Label */}
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 ${color}`}>
          {category}
        </span>
      </div>

      {/* Main Score Display */}
      <div className="flex items-baseline gap-2 mb-6">
        <span className={`text-5xl font-bold tracking-tight ${color}`}>
          {bmi}
        </span>
        <span className="text-zinc-500 text-sm font-medium">kg/m²</span>
      </div>

      {/* Visual Spectrum Bar */}
      <div className="relative w-full h-4 bg-zinc-800 rounded-full mb-2 overflow-hidden ring-1 ring-white/5">
        {/* CSS Gradient that roughly matches BMI breakpoints: 
            Blue (ends ~14%), Green (ends ~40%), Yellow (ends ~60%), Red (rest) 
        */}
        <div 
          className="absolute inset-0 w-full h-full opacity-40" 
          style={{
            background: `linear-gradient(to right, 
              #3b82f6 0%, 
              #3b82f6 14%, 
              #10b981 14%, 
              #10b981 40%, 
              #eab308 40%, 
              #eab308 60%, 
              #f43f5e 60%, 
              #f43f5e 100%)`
          }}
        />
        
        {/* The Indicator Marker */}
        <div 
          className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-700 ease-out rounded-full z-10"
          style={{ left: `${progressPercent}%` }}
        />
      </div>
      
      {/* Scale Labels - Improved Layout */}
      <div className="flex justify-between text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-6 px-0.5">
        <span>15</span>
        <span className="text-zinc-600">18.5</span>
        <span className="text-zinc-600">25</span>
        <span className="text-zinc-600">30</span>
        <span>40</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50 flex flex-col items-center justify-center hover:bg-zinc-900 transition-colors">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Ruler size={14} />
            <span className="text-xs font-semibold">Height</span>
          </div>
          <span className="text-zinc-200 font-mono font-medium tracking-wide">
            {height || 0} <span className="text-zinc-600 text-xs">cm</span>
          </span>
        </div>
        
        <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50 flex flex-col items-center justify-center hover:bg-zinc-900 transition-colors">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Weight size={14} />
            <span className="text-xs font-semibold">Weight</span>
          </div>
          <span className="text-zinc-200 font-mono font-medium tracking-wide">
            {weight || 0} <span className="text-zinc-600 text-xs">kg</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default BMIIndicator;