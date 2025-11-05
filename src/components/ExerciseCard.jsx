import React from 'react';
import { Play, Dumbbell, Heart, Video } from 'lucide-react';

export default function ExerciseCard({ exercise, onClick }) {
  const hasVideo = exercise.hasVideo || (exercise.videos && exercise.videos.length > 0);
  const imageUrl = exercise.previewImage || exercise.images?.[0]?.image || '/placeholder-exercise.jpg';

  return (
    <div
      onClick={() => onClick(exercise)}
      className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10 border border-white/10 hover:border-emerald-500/30"
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={exercise.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          onError={(e) => { 
            e.target.src = '/placeholder-exercise.jpg';
            e.target.onerror = null;
          }}
        />
        
        {/* Video Badge */}
        {hasVideo && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 shadow-lg">
            <Video className="w-3 h-3" />
            VIDEO
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="bg-emerald-500 p-4 rounded-full shadow-2xl transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-8 h-8 text-black fill-current" />
          </div>
        </div>

        {/* Muscle Info Overlay */}
        {exercise.muscles && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Heart className="w-4 h-4 text-emerald-400" />
            <span className="text-white text-xs font-medium truncate">{exercise.muscles}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 leading-tight">
          {exercise.name}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <span className="bg-emerald-500/20 px-3 py-1.5 rounded-full text-emerald-400 text-xs font-semibold border border-emerald-500/30">
            {exercise.category}
          </span>
          <span className="text-white/60 text-xs flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{exercise.equipment || 'Bodyweight'}</span>
          </span>
        </div>

        {/* Description Preview */}
        {exercise.description && (
          <p className="text-white/60 text-sm line-clamp-2 leading-relaxed">
            {exercise.description.replace(/<[^>]*>/g, '').substring(0, 100)}
            {exercise.description.length > 100 && '...'}
          </p>
        )}
      </div>

      {/* Hover Border Glow Effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 blur-xl" />
      </div>
    </div>
  );
}