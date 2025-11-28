import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Zap, Clock, Utensils, CheckCircle, RefreshCw, X, ScanLine, RotateCcw, AlertCircle } from 'lucide-react';
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
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);

  // --- 1. Camera Init ---
  const startCamera = useCallback(async () => {
    // Cleanup previous stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setError(null);

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
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = async () => {
            try {
                await videoRef.current.play();
                setStreamActive(true);
                
                // Check capabilities
                const track = newStream.getVideoTracks()[0];
                const capabilities = track.getCapabilities ? track.getCapabilities() : {};
                setHasTorch(!!capabilities.torch);
            } catch (e) {
                console.error("Autoplay blocked:", e);
            }
        };
      }
    } catch (err) {
      console.error("Camera Access Error:", err);
      setError("Please allow camera access to scan food.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    loadHistory();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [startCamera]);

  // --- 2. Helpers ---
  const toggleFlash = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
      setFlashOn(!flashOn);
    } catch (err) { console.error(err); }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setFlashOn(false);
  };

  const loadHistory = async () => {
    const logs = await getFoodLogs();
    setHistory(logs || []);
  };

  // --- 3. Robust Capture Logic ---
  const captureImage = () => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current) return reject("Camera not ready");
      
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const TARGET_SIZE = 512; // Higher quality for Gemini
      
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;
      
      const ctx = canvas.getContext('2d');
      
      // Center Crop Calculation
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - minDim) / 2;
      const startY = (video.videoHeight - minDim) / 2;
      
      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject("Failed to create image");
      }, 'image/jpeg', 0.9);
    });
  };

  const handleScan = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      // 1. Capture
      const imageBlob = await captureImage();
      
      // 2. Analyze
      const data = await analyzeFood(imageBlob);
      
      // 3. Success
      setResult(data);
      saveFoodLog(data).then(loadHistory);

    } catch (err) {
      console.error("Scan failed:", err);
      if (err.message.includes("Not recognized")) {
        setError("That doesn't look like food. Try again?");
      } else {
        setError("Could not identify. Check internet connection.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setError(null);
    setIsScanning(false);
  };

  // --- Render ---
  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-sans select-none text-white">
      
      {/* 1. Viewfinder Layer */}
      <div className="absolute inset-0 z-0">
        <video 
          ref={videoRef} 
          playsInline 
          muted 
          className={`w-full h-full object-cover transition-opacity duration-700 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
      </div>

      {/* 2. Error Overlay (Dismissable) */}
      {error && !result && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm px-8 animate-in fade-in">
            <div className="bg-zinc-900 p-6 rounded-3xl border border-white/10 text-center shadow-2xl max-w-sm">
                <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">Scan Failed</h3>
                <p className="text-zinc-400 text-sm mb-6">{error}</p>
                <button 
                    onClick={() => setError(null)} 
                    className="w-full py-3 bg-white text-black font-semibold rounded-xl active:scale-95 transition-transform"
                >
                    Try Again
                </button>
            </div>
        </div>
      )}

      {/* 3. Header Controls */}
      <div className="relative z-10 flex justify-between items-center p-4 pt-12 safe-top">
        <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <Utensils className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold tracking-wide">GEMINI LENS</span>
        </div>
        
        <div className="flex space-x-3">
            <button onClick={toggleCamera} className="icon-btn">
                <RotateCcw className="w-5 h-5" />
            </button>
            {hasTorch && (
                <button 
                  onClick={toggleFlash}
                  className={`icon-btn ${flashOn ? 'bg-yellow-500 text-black border-yellow-500' : ''}`}
                >
                <Zap className={`w-5 h-5 ${flashOn ? 'fill-current' : ''}`} />
                </button>
            )}
        </div>
      </div>

     {/* 4. Scanning Focus Box */}
      {!result && streamActive && !error && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="w-[70vmin] h-[70vmin] max-w-sm max-h-sm border border-white/20 rounded-[2rem] relative overflow-hidden bg-white/5 backdrop-blur-[1px] shadow-2xl transition-all duration-300">
            {/* Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl" />
            
            {/* Laser Scan Animation */}
            {isScanning && (
              <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_20px_2px_rgba(52,211,153,0.8)] animate-scan" />
            )}
          </div>
          
          <div className="absolute mt-80">
            <p className={`text-sm font-medium px-4 py-2 rounded-full backdrop-blur-md transition-all ${isScanning ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-black/40 text-white/80'}`}>
                {isScanning ? 'Analyzing contents...' : 'Tap circle to scan'}
            </p>
          </div>
        </div>
      )}

      {/* 5. Bottom Action Area */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-10 pt-20 bg-gradient-to-t from-black via-black/90 to-transparent">
        {!result ? (
          <div className="flex items-center justify-center w-full px-8 space-x-12">
            <button onClick={() => setShowHistory(true)} className="control-btn">
              <Clock className="w-6 h-6" />
            </button>

            {/* MAIN SHUTTER BUTTON */}
            <button 
              onClick={handleScan}
              disabled={!streamActive || isScanning || !!error}
              className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isScanning ? 'scale-90 opacity-80' : 'hover:scale-105 active:scale-95'}`}
            >
                <div className="absolute inset-0 rounded-full border-4 border-white opacity-100 group-hover:border-emerald-400 transition-colors" />
                <div className={`w-16 h-16 rounded-full transition-all duration-300 ${isScanning ? 'bg-emerald-500' : 'bg-white'}`} />
            </button>

            <div className="w-14" /> {/* Spacer for symmetry */}
          </div>
        ) : (
          /* RESULT CARD */
          <div className="mx-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 mb-6">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-3xl font-bold text-white capitalize tracking-tight">{result.name}</h2>
                <div className="flex items-center space-x-2 mt-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 text-xs font-medium">Logged Successfully</span>
                </div>
              </div>
              <button onClick={resetScan} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-95">
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-2">
              <NutrientBox label="Kcal" value={result.calories} color="text-white" bg="bg-white/5" />
              <NutrientBox label="Prot" value={result.protein + 'g'} color="text-blue-400" bg="bg-blue-500/10" />
              <NutrientBox label="Carb" value={result.carbs + 'g'} color="text-yellow-400" bg="bg-yellow-500/10" />
              <NutrientBox label="Fat" value={result.fat + 'g'} color="text-rose-400" bg="bg-rose-500/10" />
            </div>
          </div>
        )}
      </div>

      {/* 6. History Drawer */}
      {showHistory && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="absolute inset-x-0 bottom-0 top-20 bg-zinc-900 rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold">Recent Scans</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-600 space-y-4">
                  <ScanLine className="w-10 h-10 opacity-30" />
                  <p>No food logged yet</p>
                </div>
              ) : (
                history.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-black/20 border border-white/5 p-4 rounded-2xl">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
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
                        <div className="text-white font-bold">{item.calories}</div>
                        <div className="text-[10px] text-zinc-500 uppercase">Kcal</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style>{`
        .icon-btn { @apply p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white active:scale-95 transition-all hover:bg-white/10; }
        .control-btn { @apply p-4 rounded-full bg-zinc-800/80 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-transform hover:bg-zinc-700; }
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      `}</style>
    </div>
  );
};

const NutrientBox = ({ label, value, color, bg }) => (
  <div className={`${bg} rounded-2xl p-2 py-3 flex flex-col items-center justify-center text-center`}>
    <span className={`text-lg font-bold ${color}`}>{value}</span>
    <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">{label}</span>
  </div>
);

export default FoodScanner;