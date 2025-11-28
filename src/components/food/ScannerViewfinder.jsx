import React from 'react';
import { Camera, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

const ScannerViewfinder = ({ 
  videoRef, 
  cameraEnabled, 
  streamActive, 
  shutterEffect, 
  isProcessing, 
  statusText, 
  hasZoom, 
  zoom, 
  zoomCap, 
  onEnableCamera, 
  onZoom 
}) => {
  return (
    <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
      {cameraEnabled ? (
        <video 
          ref={videoRef} 
          playsInline 
          muted 
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <div className="text-center p-8 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-2xl">
            <Camera className="w-8 h-8 text-zinc-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Camera Paused</h2>
          <p className="text-zinc-500 text-sm mb-8 max-w-xs mx-auto">Enable the camera to scan food or upload a photo from your gallery.</p>
          <button 
            onClick={onEnableCamera}
            className="px-8 py-3 bg-emerald-500 text-black font-bold rounded-full active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
          >
            Enable Camera
          </button>
        </div>
      )}
      
      {/* Shutter & Gradient Overlays */}
      {cameraEnabled && (
        <>
          <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 ${shutterEffect ? 'opacity-50' : 'opacity-0'}`} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
        </>
      )}

      {/* Center Focus / Loading Box */}
      {cameraEnabled && !isProcessing && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="w-[70vmin] h-[70vmin] max-w-sm max-h-sm border border-white/30 bg-white/5 backdrop-blur-[1px] transition-all duration-300 rounded-[2rem] relative overflow-hidden shadow-2xl">
            {/* Intelligent Framing Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl shadow-sm" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl shadow-sm" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl shadow-sm" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl shadow-sm" />
            
            {/* Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-4 h-0.5 bg-white"></div>
              <div className="h-4 w-0.5 bg-white absolute"></div>
            </div>
          </div>
          
          {/* Zoom Slider */}
          <div className="absolute mt-80 flex flex-col items-center space-y-4 pointer-events-auto w-full px-10">
            {hasZoom && (
              <div className="flex items-center space-x-3 w-64 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <ZoomOut className="w-4 h-4 text-white/70" />
                <input 
                  type="range" 
                  min={zoomCap.min} 
                  max={zoomCap.max} 
                  step={zoomCap.step} 
                  value={zoom} 
                  onChange={onZoom}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full"
                />
                <ZoomIn className="w-4 h-4 text-white/70" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center text-emerald-400 p-4 text-center">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <span className="text-sm font-medium text-white tracking-widest uppercase animate-pulse">
              {statusText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerViewfinder;
