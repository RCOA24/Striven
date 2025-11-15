import React, { useRef, useState } from 'react';

const STATIC_FALLBACK = '/fallback-exercise.gif';

/**
 * Reusable component for safely displaying exercise images
 * with fallback handling and loading states
 */
export const SafeExerciseImage = ({ src, alt, className }) => {
  const imgRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const handleError = (e) => {
    const t = e.currentTarget;
    if (t.dataset.fallback === 'true') return;
    t.dataset.fallback = 'true';
    t.src = STATIC_FALLBACK;
  };
  
  const finalSrc = src && src.trim() ? src : STATIC_FALLBACK;
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/5 animate-pulse rounded" />
      )}
      <img
        ref={imgRef}
        src={finalSrc}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />
    </div>
  );
};
