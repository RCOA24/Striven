import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Zap, Clock, Utensils, CheckCircle, RefreshCw, X, ScanLine } from 'lucide-react';
import { saveFoodLog, getFoodLogs } from '../utils/db';
import { analyzeImageWithHuggingFace } from '../utils/foodApi';

const FoodScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState(null);

  // --- 1. Initialize Camera ---
  useEffect(() => {
    let stream = null;

    const init = async () => {
      // 2. Start Camera
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(() => setStreamActive(true));
          };
        }
      } catch (err) {
        console.error("Camera init error:", err);
        setError(prev => prev ? `${prev} Also camera denied.` : "Camera access denied.");
      }
    };

    init();
    loadHistory(); // Load from Dexie on mount

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadHistory = async () => {
    const logs = await getFoodLogs();
    setHistory(logs);
  };

  // --- 4. Scan Logic ---
  const handleScan = useCallback(async () => {
    if (!videoRef.current || isScanning) return;
    
    setIsScanning(true);
    setResult(null);
    setError(null);

    try {
      // 1. Capture Image from Video Stream
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);

      // 2. Send to Hugging Face
      const aiResult = await analyzeImageWithHuggingFace(base64Image);
      
      if (aiResult && !aiResult.isUnknown) {
        setResult(aiResult);
        await saveFoodLog(aiResult);
        loadHistory();
      } else {
        setError("Could not identify food. Try getting closer.");
      }
    } catch (error) {
      console.error(error);
      setError("Scan failed. Check API Key or connection.");
    } finally {
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
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden flex flex-col">
      
      {/* Camera Viewfinder */}
      <div className="absolute inset-0 z-0">
        {error ? (
          <div className="flex items-center justify-center h-full text-white/50 p-6 text-center bg-zinc-900">
            <div className="space-y-2">
              <X className="w-12 h-12 mx-auto text-red-400" />
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transition-opacity duration-700 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />
      </div>

      {/* Header Overlay */}
      <div className="relative z-10 flex justify-between items-center p-4 pt-6">
        <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <Utensils className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium text-white">AI Food Lens</span>
        </div>
        <button 
          onClick={() => setFlash(!flash)}
          className={`p-2 rounded-full backdrop-blur-md border transition-all ${flash ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-black/40 border-white/10 text-white'}`}
        >
          <Zap className={`w-5 h-5 ${flash ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Scanner Frame & Animation */}
      {!result && streamActive && !error && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 border border-white/20 rounded-3xl relative overflow-hidden bg-white/5 backdrop-blur-[2px]">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
            
            {isScanning && (
              <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] animate-scan top-0" />
            )}
          </div>
          <p className="absolute mt-96 text-white/80 text-sm font-medium animate-pulse bg-black/40 px-4 py-1 rounded-full backdrop-blur-md">
            {isScanning ? 'Analyzing with AI...' : 'Align food within frame'}
          </p>
        </div>
      )}

      {/* Main Controls / Results */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-24 md:pb-8 pt-20 bg-gradient-to-t from-black via-black/90 to-transparent">
        {!result ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center justify-center w-full px-8 space-x-12">
              <button 
                onClick={() => setShowHistory(true)}
                className="p-4 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors border border-white/5"
              >
                <Clock className="w-6 h-6" />
              </button>

              <button 
                onClick={handleScan}
                disabled={!streamActive || isScanning || error}
                className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all duration-300 shadow-lg shadow-emerald-900/20 ${isScanning ? 'scale-90 opacity-80' : 'hover:scale-105 hover:border-emerald-400'} ${error ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-16 h-16 rounded-full transition-colors duration-300 ${isScanning ? 'bg-emerald-500' : 'bg-white'}`} />
              </button>

              <div className="w-14" />
            </div>
          </div>
        ) : (
          // Result Card
          <div className="mx-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-slide-up mb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white capitalize">{result.name}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 text-xs font-medium">Logged to history</span>
                </div>
              </div>
              <button onClick={resetScan} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
            </div>

            {result.isUnknown ? (
               <div className="text-zinc-400 text-sm mb-4">
                 Identified as {result.name}, but no nutrition info found.
               </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 mb-4">
                <NutrientBox label="Calories" value={result.calories} unit="kcal" color="text-white" />
                <NutrientBox label="Protein" value={result.protein} unit="g" color="text-blue-400" />
                <NutrientBox label="Carbs" value={result.carbs} unit="g" color="text-yellow-400" />
                <NutrientBox label="Fat" value={result.fat} unit="g" color="text-rose-400" />
              </div>
            )}
            
            <div className="w-full bg-white/5 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-zinc-400">AI Confidence</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[85%]" />
                </div>
                <span className="text-xs font-bold text-white">High</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History Sheet */}
      {showHistory && (
        <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-xl animate-fade-in flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-zinc-900/50">
            <h2 className="text-xl font-bold text-white">Scan History</h2>
            <button onClick={() => setShowHistory(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500 space-y-4">
                <ScanLine className="w-12 h-12 opacity-20" />
                <p>No scans yet</p>
              </div>
            ) : (
              history.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-900 border border-white/5 p-4 rounded-2xl hover:bg-zinc-800 transition-colors">
                  <div>
                    <div className="font-medium text-white capitalize">{item.name}</div>
                    <div className="text-xs text-zinc-400 mt-1">
                      {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {item.calories} kcal
                    </div>
                  </div>
                  <div className="flex space-x-3 text-xs font-medium">
                    <span className="text-blue-400">{item.protein}p</span>
                    <span className="text-yellow-400">{item.carbs}c</span>
                    <span className="text-rose-400">{item.fat}f</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      <style jsx>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

const NutrientBox = ({ label, value, unit, color }) => (
  <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-white/5">
    <span className={`text-lg font-bold ${color}`}>{value}</span>
    <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-1">{label}</span>
  </div>
);

export default FoodScanner;