import React from 'react';

const CheckCircle = ({ 
  size = 24, 
  checked = true, 
  className = "", 
  color = "emerald" 
}) => {
  
  // Dynamic color classes based on props
  const colorMap = {
    emerald: 'text-emerald-500 bg-emerald-500/20 border-emerald-500',
    blue: 'text-blue-500 bg-blue-500/20 border-blue-500',
    orange: 'text-orange-500 bg-orange-500/20 border-orange-500',
    zinc: 'text-zinc-400 bg-zinc-800 border-zinc-600',
  };

  const activeColor = checked ? colorMap[color] : colorMap['zinc'];

  return (
    <div 
      className={`
        relative rounded-full border transition-all duration-300 ease-out flex items-center justify-center
        ${checked ? 'shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-100' : 'bg-transparent scale-95'}
        ${activeColor}
        ${className}
      `}
      style={{ 
        width: size, 
        height: size,
        borderWidth: size > 30 ? 3 : 2 
      }}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={size > 30 ? 3 : 2.5} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`
          transition-all duration-300 ease-back-out 
          ${checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
        `}
        style={{ width: size * 0.6, height: size * 0.6 }} // Icon is 60% of container
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  );
};

export default CheckCircle;