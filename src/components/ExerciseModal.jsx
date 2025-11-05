import React, { useState } from 'react';
import { X, HeartPulse, Dumbbell, Clock, PlayCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ExerciseModal({ exercise, isOpen, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  if (!isOpen || !exercise) return null;

  const videos = exercise.videos || [];
  const images = exercise.images || [];
  const currentVideo = videos[currentVideoIndex];
  const currentImage = images[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-black/95 via-emerald-950/30 to-black/95 backdrop-blur-xl rounded-3xl p-6 max-w-3xl w-full border border-emerald-500/20 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-3xl font-bold text-white mb-2">{exercise.name}</h3>
            <span className="inline-block bg-emerald-500/20 px-4 py-1 rounded-full text-emerald-400 text-sm font-medium border border-emerald-500/30">
              {exercise.category}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Section */}
        {videos.length > 0 && (
          <div className="mb-6">
            <div className="relative rounded-2xl overflow-hidden bg-black border border-emerald-500/20 shadow-lg">
              <video
                key={currentVideo.video}
                controls
                className="w-full aspect-video"
                poster={images[0]?.image}
              >
                <source src={currentVideo.video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Video Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-4 text-xs text-white/70">
                  {currentVideo.duration && (
                    <span>Duration: {currentVideo.duration}s</span>
                  )}
                  {currentVideo.width && currentVideo.height && (
                    <span>{currentVideo.width}×{currentVideo.height}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Multiple Videos Navigation */}
            {videos.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {videos.map((video, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentVideoIndex(idx)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      idx === currentVideoIndex
                        ? 'bg-emerald-500 text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    <PlayCircle className="w-4 h-4 inline mr-1" />
                    Video {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="mb-6">
            <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-emerald-500/20">
              <img
                src={currentImage.image}
                alt={`${exercise.name} - View ${currentImageIndex + 1}`}
                className="w-full aspect-video object-contain"
                onError={(e) => {
                  e.target.src = '/placeholder-exercise.jpg';
                }}
              />
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-emerald-500/80 rounded-full text-white transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-emerald-500/80 rounded-full text-white transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-2 right-2 bg-black/70 px-3 py-1 rounded-full text-white/90 text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex
                        ? 'border-emerald-500 opacity-100'
                        : 'border-white/20 opacity-50 hover:opacity-75'
                    }`}
                  >
                    <img
                      src={img.image}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exercise Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <HeartPulse className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Primary Muscles</div>
                <div className="text-white font-medium">{exercise.muscles || 'Not specified'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Dumbbell className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Equipment</div>
                <div className="text-white font-medium">{exercise.equipment || 'Bodyweight'}</div>
              </div>
            </div>
          </div>

          {exercise.musclesSecondary && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <HeartPulse className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs text-white/50 mb-1">Secondary Muscles</div>
                  <div className="text-white font-medium">{exercise.musclesSecondary}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Category</div>
                <div className="text-white font-medium">{exercise.category}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {exercise.description && (
          <div className="mb-6 bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-emerald-400" />
              <h4 className="text-lg font-bold text-white">Instructions</h4>
            </div>
            <div 
              className="text-white/80 text-sm leading-relaxed prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: exercise.description }}
            />
          </div>
        )}

        {/* Aliases/Variations */}
        {exercise.aliases && exercise.aliases.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-bold text-white/70 mb-2">Also known as:</h4>
            <div className="flex flex-wrap gap-2">
              {exercise.aliases.map((alias, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white/5 rounded-full text-white/60 text-xs border border-white/10"
                >
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 rounded-xl text-black font-bold shadow-lg hover:shadow-emerald-500/25 transition-all hover:scale-[1.02]">
            Add to Workout
          </button>
          <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all border border-white/20">
            Save
          </button>
        </div>

        {/* License Info */}
        {exercise.license && (
          <div className="mt-4 text-xs text-white/40 text-center">
            License: {exercise.license}
          </div>
        )}
      </div>
    </div>
  );
}