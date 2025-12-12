import React from 'react';

const MacroCard = ({ 
  label, 
  value, 
  unit = "g", 
  color = "emerald", 
  icon 
}) => {
  
  // Color configuration map to handle all UI states based on a single prop
  const styles = {
    emerald: {
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]',
      gradient: 'from-emerald-500/10'
    },
    blue: {
      bg: 'bg-blue-500/5',
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-500/20',
      text: 'text-blue-400',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]',
      gradient: 'from-blue-500/10'
    },
    orange: {
      bg: 'bg-orange-500/5',
      border: 'border-orange-500/20',
      iconBg: 'bg-orange-500/20',
      text: 'text-orange-400',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.1)]',
      gradient: 'from-orange-500/10'
    },
    purple: {
      bg: 'bg-purple-500/5',
      border: 'border-purple-500/20',
      iconBg: 'bg-purple-500/20',
      text: 'text-purple-400',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.1)]',
      gradient: 'from-purple-500/10'
    },
    rose: {
      bg: 'bg-rose-500/5',
      border: 'border-rose-500/20',
      iconBg: 'bg-rose-500/20',
      text: 'text-rose-400',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.1)]',
      gradient: 'from-rose-500/10'
    }
  };

  const currentStyle = styles[color] || styles.emerald;

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group
      ${currentStyle.bg} ${currentStyle.border} ${currentStyle.glow}
    `}>
      
      {/* Subtle Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-b ${currentStyle.gradient} to-transparent opacity-50`} />

      <div className="relative p-5 flex flex-col items-center justify-center text-center h-full">
        
        {/* Icon Container */}
        <div className={`
          mb-3 p-3 rounded-xl backdrop-blur-md shadow-sm transition-transform duration-300 group-hover:scale-110
          ${currentStyle.iconBg} ${currentStyle.text}
        `}>
          {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
        </div>

        {/* Value with Unit */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-3xl font-bold text-white tracking-tight">
            {value}
          </span>
          <span className={`text-sm font-semibold opacity-80 ${currentStyle.text}`}>
            {unit}
          </span>
        </div>

        {/* Label */}
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
          {label}
        </span>
      </div>
    </div>
  );
};

export default MacroCard;