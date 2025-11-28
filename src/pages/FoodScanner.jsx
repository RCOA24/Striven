import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Zap, Clock, Utensils, CheckCircle, RefreshCw, X, ScanLine, RotateCcw, Camera, Loader2 } from 'lucide-react';
import { saveFoodLog, getFoodLogs } from '../utils/db';
import { analyzeFood } from '../utils/foodApi';

const FoodScanner = () => {
  const videoRef = useRef(null);
  
  // Camera State
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [streamActive, setStreamActive] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // App State
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Initializing..."); // NEW: Holds the real status
  const [imageCaptured, setImageCaptured] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);
  const [shutterEffect, setShutterEffect] = useState(false);

  // --- 1. Camera Initialization ---
  const startCamera = useCallback(async () => {
    if (stream) stream.getTracks().forEach(track => track.stop());

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } 
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current.play();
          setStreamActive(true);
          const track = newStream.getVideoTracks()[0];
          const capabilities = track.getCapabilities ? track.getCapabilities() : {};
          setHasTorch(!!capabilities.torch);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    loadHistory();
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, [startCamera]);

  // --- 2. Actions ---
  const toggleFlash = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
    setFlashOn(!flashOn);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const loadHistory = async () => {
    const logs = await getFoodLogs();
    setHistory(logs || []);
  };

  // --- 3. Capture & Analyze Logic ---
  const takePhoto = async () => {
    if (!videoRef.current || isProcessing) return;

    setShutterEffect(true);
    setTimeout(() => setShutterEffect(false), 150);

    videoRef.current.pause();
    setImageCaptured(true);
    setIsProcessing(true);
    setStatusText("Capturing image..."); // Initial status
    setError(null);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const TARGET_SIZE = 512;
      
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;
      const ctx = canvas.getContext('2d');
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - minDim) / 2;
      const startY = (video.videoHeight - minDim) / 2;
      
      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE);

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Capture failed");

        try {
            // PASS THE SETTER FUNCTION TO THE API
            const aiResult = await analyzeFood(blob, (status) => {
                setStatusText(status); // Update UI with real API status
            });

            setResult(aiResult);
            if (!aiResult.isUnknown) {
                saveFoodLog(aiResult).then(loadHistory);
            }
        } catch (err) {
            console.error(err);
            setError("Couldn't identify food. Try getting closer.");
        } finally {
            setIsProcessing(false);
        }
      }, 'image/jpeg', 0.85);

    } catch (e) {
      setError("System error.");
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
    setImageCaptured(false);
    setStatusText("");
    if (videoRef.current) videoRef.current.play();
  };

  // --- Render ---
  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-sans select-none text-white">
      
      {/* 1. Viewfinder Layer */}
      <div className="absolute inset-0 z-0 bg-black">
        <video 
          ref={videoRef} 
          playsInline 
          muted 
          className={`w-full h-full object-cover transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 ${shutterEffect ? 'opacity-50' : 'opacity-0'}`} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
      </div>

      {/* 2. Error Layer */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
           <div className="bg-zinc-900 p-6 rounded-2xl border border-red-500/30 text-center max-w-xs shadow-2xl">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                 <X className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-white mb-6">{error}</p>
              <button onClick={resetScanner} className="w-full py-3 bg-white text-black font-bold rounded-xl active:scale-95 transition-transform">
                Retake Photo
              </button>
           </div>
        </div>
      )}

      {/* 3. Header Controls */}
      {!result && (
      <div className="relative z-10 flex justify-between items-center p-4 safe-top pt-8">
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
          <Utensils className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-white tracking-wide">AI Food Lens</span>
        </div>
        
        <div className="flex space-x-3">
            <button onClick={toggleCamera} disabled={imageCaptured} className="icon-btn">
                <RotateCcw className="w-5 h-5" />
            </button>
            {hasTorch && (
                <button onClick={toggleFlash} disabled={imageCaptured} className={`icon-btn ${flashOn ? 'bg-yellow-500/80 text-white' : ''}`}>
                   <Zap className={`w-5 h-5 ${flashOn ? 'fill-current' : ''}`} />
                </button>
            )}
        </div>
      </div>
      )}

      {/* 4. Center Focus / Loading Box */}
      {!result && !error && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className={`w-[70vmin] h-[70vmin] max-w-sm max-h-sm border transition-all duration-300 rounded-[2rem] relative overflow-hidden shadow-2xl ${isProcessing ? 'border-emerald-500/50 bg-black/40 backdrop-blur-sm' : 'border-white/20 bg-white/5 backdrop-blur-[1px]'}`}>
            
            {/* Corners (Only show when not processing) */}
            {!isProcessing && (
                <>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl" />
                </>
            )}

            {/* REAL STATUS LOADING STATE */}
            {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-400 p-4 text-center">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    {/* Display the dynamic status text */}
                    <span className="text-sm font-medium text-white tracking-widest uppercase animate-pulse">
                        {statusText}
                    </span>
                </div>
            )}
          </div>
          
          {/* Helper Text (Hide when processing) */}
          {!isProcessing && (
            <div className="absolute mt-80 flex flex-col items-center space-y-2">
                <p className="text-white/80 text-sm font-medium px-4 py-1.5 bg-black/40 rounded-full backdrop-blur-md">
                    Center food & tap shutter
                </p>
            </div>
          )}
        </div>
      )}

      {/* 5. Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-12 pt-12 bg-gradient-to-t from-black via-black/90 to-transparent">
        {!result && !isProcessing && !error ? (
          <div className="flex items-center justify-center w-full px-8 space-x-12">
            <button onClick={() => setShowHistory(true)} className="control-btn">
              <Clock className="w-6 h-6" />
            </button>

            <button 
              onClick={takePhoto}
              disabled={!streamActive}
              className="group relative w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-95"
            >
                <div className="absolute inset-0 rounded-full border-4 border-white opacity-100" />
                <div className="w-16 h-16 rounded-full bg-white group-active:scale-90 transition-all duration-200" />
            </button>

            <div className="w-14" /> 
          </div>
        ) : result ? (
          // Result Card
          <div className="mx-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 mb-4">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-3xl font-bold text-white capitalize tracking-tight">{result.name}</h2>
                {!result.isUnknown && (
                    <div className="flex items-center space-x-2 mt-1">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-500 text-xs font-medium">Logged</span>
                    </div>
                )}
              </div>
              <button onClick={resetScanner} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-95 flex items-center gap-2 px-4">
                <RefreshCw className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">Next</span>
              </button>
            </div>

            {result.isUnknown ? (
               <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
                 <p className="text-yellow-200 text-sm">
                   Identified as <strong>{result.name}</strong>, but exact nutrition data is unavailable.
                 </p>
               </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 mb-4">
                <NutrientBox label="Kcal" value={result.calories} color="text-white" bg="bg-white/5" />
                <NutrientBox label="Prot" value={result.protein + 'g'} color="text-blue-400" bg="bg-blue-500/10" />
                <NutrientBox label="Carb" value={result.carbs + 'g'} color="text-yellow-400" bg="bg-yellow-500/10" />
                <NutrientBox label="Fat" value={result.fat + 'g'} color="text-rose-400" bg="bg-rose-500/10" />
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-white/5 pt-3">
                <span>Confidence: {Math.round(result.confidence * 100)}%</span>
                <span>Source: {result.confidence >= 0.95 ? 'Gemini AI' : 'Community DB'}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* History Slide-over */}
      {showHistory && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="absolute inset-x-0 bottom-0 top-20 bg-zinc-900 rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold">Recent Scans</h2>
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

      <style>{`
        .icon-btn { @apply p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white active:scale-95 transition-transform; }
        .control-btn { @apply p-4 rounded-full bg-zinc-800/80 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-transform; }
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