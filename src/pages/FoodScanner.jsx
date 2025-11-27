import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Zap, Clock, Utensils, CheckCircle, RefreshCw, X, ScanLine, RotateCcw } from 'lucide-react';
import { saveFoodLog, getFoodLogs } from '../utils/db';
import { analyzeImageWithHuggingFace } from '../utils/foodApi';

const FoodScanner = () => {
  const videoRef = useRef(null);
  
  // Camera State
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [streamActive, setStreamActive] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // App State
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);

  // --- 1. Camera Initialization ---
  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 }, 
          height: { ideal: 720 }
        } 
      });

      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            setStreamActive(true);
            
            // Check for torch/flashlight capability
            const track = newStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            setHasTorch(!!capabilities.torch);
          } catch (e) {
            console.error("Play error", e);
          }
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied or unavailable.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    loadHistory();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [startCamera]);

  // --- 2. Camera Controls ---
  const toggleFlash = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !flashOn }]
      });
      setFlashOn(!flashOn);
    } catch (err) {
      console.error("Flash error:", err);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setFlashOn(false);
  };

  const loadHistory = async () => {
    try {
      const logs = await getFoodLogs();
      setHistory(logs || []);
    } catch (e) {
      console.warn("DB not ready");
    }
  };

  // --- 3. Optimized Capture Logic (Center Crop) ---
  const handleScan = useCallback(async () => {
    if (!videoRef.current || isScanning) return;
    
    setIsScanning(true);
    setResult(null);
    setError(null);

    try {
      const video = videoRef.current;
      
      // Vision Transformers expect square images (384x384 is a good standard)
      const TARGET_SIZE = 384; 
      
      const canvas = document.createElement('canvas');
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;
      const ctx = canvas.getContext('2d');
      
      // LOGIC: Crop the center square of the video feed
      // This matches the visual UI box so the AI sees exactly what the user sees
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - minDim) / 2;
      const startY = (video.videoHeight - minDim) / 2;
      
      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE);

      // Convert to Blob (Binary) for fast upload
      canvas.toBlob(async (blob) => {
        if (!blob) {
            setError("Capture failed");
            setIsScanning(false);
            return;
        }

        try {
            const aiResult = await analyzeImageWithHuggingFace(blob);
            
            if (aiResult) {
              setResult(aiResult);
              if (!aiResult.isUnknown) {
                // Background save
                saveFoodLog(aiResult).then(loadHistory).catch(e => console.log('Save failed', e));
              }
            }
        } catch (apiErr) {
            console.error(apiErr);
            // Specific Error Messaging
            if (apiErr.message.includes("API Key")) {
                setError("Configuration Error: API Key missing.");
            } else if (apiErr.message.includes("Confidence")) {
                setError("Not sure what that is. Try getting closer.");
            } else if (apiErr.message.includes("503")) {
                setError("AI is warming up... please try again in a moment.");
            } else {
                setError("Could not identify food. Check connection.");
            }
        } finally {
            setIsScanning(false);
        }
      }, 'image/jpeg', 0.85);

    } catch (err) {
      console.error(err);
      setError("System error during scan.");
      setIsScanning(false);
    }
  }, [isScanning]);
  
  const resetScan = () => {
    setResult(null);
    setIsScanning(false);
    setError(null);
  };

  // --- Render ---
  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-sans select-none">
      
      {/* Viewfinder */}
      <div className="absolute inset-0 z-0 bg-black">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-white/60 p-6 text-center z-50 relative">
            <X className="w-12 h-12 mb-4 text-rose-500" />
            <p className="max-w-xs">{error}</p>
            <button onClick={() => { setError(null); startCamera(); }} className="mt-6 px-6 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-colors">
              Retry Camera
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 safe-top">
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
          <Utensils className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-white tracking-wide">AI Food Lens</span>
        </div>
        
        <div className="flex space-x-3">
            <button 
                onClick={toggleCamera}
                className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white active:scale-95 transition-transform"
            >
                <RotateCcw className="w-5 h-5" />
            </button>
            
            {hasTorch && (
                <button 
                onClick={toggleFlash}
                className={`p-2.5 rounded-full backdrop-blur-md border transition-all active:scale-95 ${flashOn ? 'bg-yellow-500/80 border-yellow-400 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-black/40 border-white/10 text-white'}`}
                >
                <Zap className={`w-5 h-5 ${flashOn ? 'fill-current' : ''}`} />
                </button>
            )}
        </div>
      </div>

     {/* Scanner Box Animation */}
      {!result && streamActive && !error && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          
          {/* FIX: Using vmin ensures the box is always a square relative to the smaller screen side */}
          <div className="w-[70vmin] h-[70vmin] max-w-sm max-h-sm border border-white/20 rounded-[2rem] relative overflow-hidden bg-white/5 backdrop-blur-[1px] shadow-2xl">
            
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl" />
            
            {isScanning && (
              <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_20px_2px_rgba(52,211,153,0.8)] animate-scan" />
            )}
          </div>
          
          <div className="absolute mt-80 flex flex-col items-center space-y-2">
            <p className={`text-white/90 text-sm font-medium px-4 py-1.5 rounded-full backdrop-blur-md transition-all ${isScanning ? 'bg-emerald-500/20 text-emerald-300' : 'bg-black/40'}`}>
                {isScanning ? 'Analyzing food...' : 'Center food & scan'}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Controls Area */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-12 pt-12 bg-gradient-to-t from-black via-black/90 to-transparent">
        {!result ? (
          <div className="flex items-center justify-center w-full px-8 space-x-12">
            <button 
              onClick={() => setShowHistory(true)}
              className="p-4 rounded-full bg-zinc-800/80 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-transform"
            >
              <Clock className="w-6 h-6" />
            </button>

            {/* Shutter Button */}
            <button 
              onClick={handleScan}
              disabled={!streamActive || isScanning || !!error}
              className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${error ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
            >
                <div className="absolute inset-0 rounded-full border-4 border-white opacity-100 group-hover:border-emerald-400 transition-colors" />
                <div className={`w-16 h-16 rounded-full transition-all duration-300 ${isScanning ? 'bg-emerald-500 scale-75' : 'bg-white'}`} />
            </button>

            <div className="w-14" /> 
          </div>
        ) : (
          // Result Card
          <div className="mx-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 mb-4">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-3xl font-bold text-white capitalize tracking-tight">{result.name}</h2>
                <div className="flex items-center space-x-2 mt-1">
                    {!result.isUnknown && (
                        <>
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-500 text-xs font-medium">Logged</span>
                        </>
                    )}
                </div>
              </div>
              <button onClick={resetScan} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-95">
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
            </div>

            {result.isUnknown ? (
               <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
                 <p className="text-yellow-200 text-sm">
                   We identified this as <strong>{result.name}</strong>, but couldn't find exact nutrition data.
                 </p>
               </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 mb-6">
                <NutrientBox label="Kcal" value={result.calories} color="text-white" bg="bg-white/5" />
                <NutrientBox label="Protein" value={result.protein + 'g'} color="text-blue-400" bg="bg-blue-500/10" />
                <NutrientBox label="Carbs" value={result.carbs + 'g'} color="text-yellow-400" bg="bg-yellow-500/10" />
                <NutrientBox label="Fat" value={result.fat + 'g'} color="text-rose-400" bg="bg-rose-500/10" />
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Confidence: {Math.round(result.confidence * 100)}%</span>
                <span>Source: OpenFoodFacts</span>
            </div>
          </div>
        )}
      </div>

      {/* History Slide-over */}
      {showHistory && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="absolute inset-x-0 bottom-0 top-20 bg-zinc-900 rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Recent Scans</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-500 space-y-4">
                  <ScanLine className="w-10 h-10 opacity-20" />
                  <p>No food logged yet</p>
                </div>
              ) : (
                history.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-black/20 border border-white/5 p-4 rounded-2xl">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <Utensils className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <div className="font-medium text-white capitalize">{item.name}</div>
                            <div className="text-xs text-zinc-500">
                                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-white font-bold">{item.calories} <span className="text-xs text-zinc-500 font-normal">kcal</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scan Line Animation */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

const NutrientBox = ({ label, value, color, bg }) => (
  <div className={`${bg} rounded-2xl p-2 py-3 flex flex-col items-center justify-center text-center`}>
    <span className={`text-base font-bold ${color}`}>{value}</span>
    <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">{label}</span>
  </div>
);

export default FoodScanner;