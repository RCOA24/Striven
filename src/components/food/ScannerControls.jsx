import React from 'react';
import { Zap, Utensils, RotateCcw, Image as ImageIcon, Calculator, CalendarDays } from 'lucide-react';

export const ScannerHeader = ({ 
  onToggleCamera, 
  onToggleFlash, 
  onOpenCalculator, 
  cameraEnabled, 
  hasTorch, 
  flashOn, 
  imageCaptured,
  aiMode,
  onToggleAiMode,
}) => (
  <div className="relative z-10 flex justify-between items-center p-4 safe-top pt-8">
    <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 shadow-lg">
      <Utensils className="w-4 h-4 text-emerald-400" />
      <span className="text-xs font-semibold text-white tracking-wide">AI Food Lens</span>
    </div>
    
    <div className="flex space-x-3">
      <div className="flex flex-col items-end">
        <button onClick={onToggleAiMode} className="icon-btn">
          <span className="text-[10px] font-bold">{aiMode === 'gemini' ? 'FAST' : 'HYBRID'}</span>
        </button>
        <span className="text-[9px] text-zinc-400 mt-1">{aiMode === 'gemini' ? 'Best with clear lighting' : 'Thorough analysis'}</span>
      </div>
      <button onClick={onOpenCalculator} className="icon-btn">
        <Calculator className="w-5 h-5" />
      </button>
      
      {cameraEnabled && (
        <>
          <button onClick={onToggleCamera} disabled={imageCaptured} className="icon-btn">
            <RotateCcw className="w-5 h-5" />
          </button>
          {hasTorch && (
            <button 
              onClick={onToggleFlash} 
              disabled={imageCaptured} 
              className={`icon-btn transition-colors ${flashOn ? 'bg-yellow-500 text-black border-yellow-500' : ''}`}
            >
              <Zap className={`w-5 h-5 ${flashOn ? 'fill-current' : ''}`} />
            </button>
          )}
        </>
      )}
    </div>
  </div>
);

export const ScannerFooter = ({ 
  onTakePhoto, 
  onUpload, 
  onShowHistory, 
  streamActive, 
  cameraEnabled 
}) => (
  <div className="absolute bottom-0 left-0 right-0 z-20 pb-12 pt-12 bg-gradient-to-t from-black via-black/90 to-transparent">
    <div className="flex items-center justify-center w-full px-8 space-x-12">
      
      {/* History Button - Changed Icon to CalendarDays */}
      <button onClick={onShowHistory} className="control-btn group">
        <CalendarDays className="w-6 h-6 group-active:scale-90 transition-transform" />
      </button>

      {/* Shutter Button */}
      <button 
        onClick={onTakePhoto}
        disabled={!streamActive || !cameraEnabled}
        className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-95 ${!cameraEnabled ? 'opacity-50 grayscale' : ''}`}
      >
        <div className="absolute inset-0 rounded-full border-4 border-white opacity-100 shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
        <div className="w-16 h-16 rounded-full bg-white group-active:scale-90 transition-all duration-200" />
      </button>

      {/* Upload Button */}
      <button onClick={onUpload} className="control-btn group">
        <ImageIcon className="w-6 h-6 group-active:scale-90 transition-transform" />
      </button>

    </div>
  </div>
);
