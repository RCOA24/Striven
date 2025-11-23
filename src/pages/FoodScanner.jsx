import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Zap, Clock, Utensils, CheckCircle, RefreshCw, X, ScanLine, StopCircle } from 'lucide-react';

// IMPORTANT: You must run: npm install @tensorflow/tfjs @tensorflow-models/mobilenet
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// --- IndexedDB Helpers (Unchanged) ---
const DB_NAME = 'striven_food_db';
const STORE = 'logs';

const dbPromise = new Promise((resolve, reject) => {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

async function saveLog(entry) {
  try {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).add({ ...entry, timestamp: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) { console.error("DB Save Error", e); }
}

async function getLogs() {
  try {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result ? req.result.sort((a, b) => b.timestamp - a.timestamp) : []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) { return []; }
}

// --- Real Nutrition Fetcher ---
async function fetchNutrition(query) {
  try {
    // Using OpenFoodFacts with the detected name
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=1`);
    const data = await res.json();
    const p = data.products?.[0];
    
    if (!p) return null;
    
    return {
      name: p.product_name || query,
      calories: Math.round(p.nutriments?.energy_kcal || 0),
      protein: Math.round(p.nutriments?.proteins || 0),
      carbs: Math.round(p.nutriments?.carbohydrates || 0),
      fat: Math.round(p.nutriments?.fat || 0),
    };
  } catch (e) {
    console.error("Nutrition API Error", e);
    return null;
  }
}

const FoodScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const abortController = useRef(null); // To cancel requests

  const [model, setModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [streamActive, setStreamActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState(null);

  // 1. Initialize Camera & Load AI Model
  useEffect(() => {
    let stream = null;

    const initSystem = async () => {
      try {
        // Load TensorFlow Model
        console.log("Loading AI Model...");
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
        setModelLoading(false);

        // Start Camera
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
        console.error("Init error:", err);
        setError("Camera access denied or AI model failed to load.");
        setModelLoading(false);
      }
    };

    initSystem();
    loadHistory();

    return () => {
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Toggle Flash Logic
  useEffect(() => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const track = videoRef.current.srcObject.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    if (capabilities.torch) {
      track.applyConstraints({ advanced: [{ torch: flash }] })
        .catch(e => console.log("Flash not supported", e));
    }
  }, [flash]);

  const loadHistory = async () => {
    const logs = await getLogs();
    setHistory(logs);
  };

  // 2. The Scanning Logic
  const handleScan = useCallback(async () => {
    if (!videoRef.current || !model || isScanning) return;
    
    setIsScanning(true);
    setResult(null);
    abortController.current = new AbortController(); 

    try {
      // 1. AI Prediction (TensorFlow)
      const predictions = await model.classify(videoRef.current);
      
      if (abortController.current.signal.aborted) return;

      if (predictions && predictions.length > 0) {
        const bestGuess = predictions[0].className.split(',')[0]; 
        console.log("AI Identified:", bestGuess);

        // 2. Fetch Nutrition based on AI result
        const nutrition = await fetchNutrition(bestGuess);
        
        if (abortController.current.signal.aborted) return;

        if (nutrition) {
          setResult(nutrition);
          await saveLog(nutrition);
          loadHistory();
        } else {
          // Fallback if food detected but not in database
          setResult({ 
            name: bestGuess, 
            calories: '?', 
            protein: '?', 
            carbs: '?', 
            fat: '?' 
          });
          setError(`Identified "${bestGuess}", but nutrition info was unavailable.`);
        }
      } else {
        setError("Could not identify object. Try moving closer.");
      }

    } catch (error) {
      console.error("Scan failed", error);
      if (!abortController.current.signal.aborted) {
        setError("Scan failed. Please try again.");
      }
    } finally {
      if (!abortController.current.signal.aborted) {
        setIsScanning(false);
        abortController.current = null;
      }
    }
  }, [model, isScanning]);

  const cancelScan = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setIsScanning(false);
    setResult(null);
    abortController.current = null;
  };

  const resetScan = () => {
    setResult(null);
    setError(null);
    setIsScanning(false);
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-black text-white overflow-hidden flex flex-col">
      
      {/* Camera Layer */}
      <div className="absolute inset-0 z-0 bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover transition-opacity duration-700 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
      </div>

      {/* Top Bar */}
      <div className="relative z-20 flex justify-between items-start p-4 pt-safe-top">
        <div className="flex flex-col">
            <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 w-fit">
            <Utensils className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium">AI Food Lens</span>
            </div>
            {modelLoading && <span className="text-[10px] text-white/50 ml-2 mt-1">Loading AI...</span>}
        </div>

        <button 
          onClick={() => setFlash(!flash)}
          className={`p-3 rounded-full backdrop-blur-md border transition-all ${flash ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-black/30 border-white/10 text-white'}`}
        >
          <Zap className={`w-5 h-5 ${flash ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Main Viewport Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pointer-events-none">
        
        {/* Error Message Toast */}
        {error && (
          <div className="absolute top-20 bg-red-500/90 text-white px-6 py-3 rounded-2xl backdrop-blur-xl shadow-xl animate-fade-in pointer-events-auto mx-4 text-center z-50">
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="mt-2 text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30">Dismiss</button>
          </div>
        )}

        {/* Scanner Frame - FIXED SIZING HERE */}
        {!result && streamActive && (
          <div className="relative">
            {/* 
               CHANGED: w-[70vw] -> w-[70vmin] 
               This limits size based on the SMALLER screen dimension.
               Added aspect-square to keep it perfectly square.
            */}
            <div className={`w-[70vmin] h-[70vmin] max-w-[350px] max-h-[350px] aspect-square border border-white/20 rounded-[2rem] relative overflow-hidden bg-white/5 backdrop-blur-[1px] transition-all duration-300 ${isScanning ? 'scale-105 border-emerald-500/50' : ''}`}>
              {/* Corners */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl" />
              
              {isScanning && (
                <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_25px_rgba(52,211,153,1)] animate-scan top-0" />
              )}
            </div>
            <p className="text-center mt-6 text-white/90 text-sm font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-md mx-auto w-fit">
                {modelLoading ? 'Initializing AI Models...' : isScanning ? 'Identifying object...' : 'Center food & Scan'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Controls / Results */}
      <div className="relative z-20 pb-safe-bottom bg-gradient-to-t from-black via-black/95 to-transparent pt-10">
        {!result ? (
          <div className="flex flex-col items-center pb-8 px-6">
            <div className="flex items-center justify-between w-full max-w-md px-4">
              
              {/* History Button */}
              <button 
                onClick={() => setShowHistory(true)}
                disabled={isScanning}
                className={`p-4 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/5 transition-all ${isScanning ? 'opacity-30' : 'hover:bg-white/20'}`}
              >
                <Clock className="w-6 h-6" />
              </button>

              {/* Main Action Button (Scan or Cancel) */}
              <div className="relative">
                {isScanning ? (
                  // Cancel Button
                  <button 
                    onClick={cancelScan}
                    className="w-20 h-20 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center transition-all duration-200 hover:bg-red-500/30 hover:scale-105 animate-pulse"
                  >
                    <div className="flex flex-col items-center justify-center">
                       <StopCircle className="w-8 h-8 text-red-500 fill-current" />
                       <span className="text-[10px] uppercase font-bold text-red-400 mt-1">Stop</span>
                    </div>
                  </button>
                ) : (
                  // Scan Button
                  <button 
                    onClick={handleScan}
                    disabled={!streamActive || modelLoading}
                    className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all duration-300 shadow-lg shadow-emerald-900/20 ${modelLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:border-emerald-400 active:scale-95'}`}
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                       <ScanLine className="w-8 h-8 text-white" />
                    </div>
                  </button>
                )}
              </div>

              {/* Spacer for visual balance */}
              <div className="w-14 h-14" /> 
            </div>
            
            <p className="text-xs text-zinc-500 mt-6 font-medium">
                {modelLoading ? 'Please wait...' : 'Tap button to capture'}
            </p>
          </div>
        ) : (
          // Result Card
          <div className="bg-zinc-900 border-t border-white/10 rounded-t-[2.5rem] p-6 pb-safe-bottom shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white capitalize leading-tight">{result.name}</h2>
                <div className="flex items-center space-x-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 text-sm font-medium">Logged to history</span>
                </div>
              </div>
              <button onClick={resetScan} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="col-span-2 bg-zinc-800/50 rounded-3xl p-5 flex items-center justify-between border border-white/5">
                    <span className="text-zinc-400 font-medium">Energy</span>
                    <div className="text-right">
                        <span className="text-3xl font-bold text-white block">{result.calories}</span>
                        <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Kcal</span>
                    </div>
                </div>
              <NutrientBox label="Protein" value={result.protein} unit="g" color="text-blue-400" bg="bg-blue-400/10" border="border-blue-400/20" />
              <NutrientBox label="Carbs" value={result.carbs} unit="g" color="text-yellow-400" bg="bg-yellow-400/10" border="border-yellow-400/20" />
              <NutrientBox label="Fats" value={result.fat} unit="g" color="text-rose-400" bg="bg-rose-400/10" border="border-rose-400/20" />
              <NutrientBox label="Weight" value="100" unit="g" color="text-zinc-400" bg="bg-white/5" border="border-white/5" />
            </div>
            
            <button onClick={resetScan} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-bold text-black transition-colors">
                Scan Another Item
            </button>
          </div>
        )}
      </div>

      {/* History Sheet */}
      {showHistory && (
        <div className="absolute inset-0 z-50 bg-zinc-950 animate-fade-in flex flex-col">
          <div className="flex items-center justify-between p-6 pt-safe-top border-b border-white/10 bg-zinc-900">
            <h2 className="text-xl font-bold text-white">Scan History</h2>
            <button onClick={() => setShowHistory(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar pb-safe-bottom">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                <ScanLine className="w-16 h-16 opacity-20" />
                <p>No food scanned yet</p>
              </div>
            ) : (
              history.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-900 border border-white/5 p-4 rounded-2xl">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="font-medium text-white text-lg truncate capitalize">{item.name}</div>
                    <div className="text-xs text-zinc-400 mt-1">
                      {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold">{item.calories} kcal</div>
                    <div className="flex space-x-2 text-[10px] text-zinc-500 mt-1">
                        <span>{item.protein}p</span>
                        <span>{item.carbs}c</span>
                        <span>{item.fat}f</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      <style jsx>{`
        /* Safe Area Utilities for Mobile */
        .pt-safe-top { padding-top: env(safe-area-inset-top, 24px); }
        .pb-safe-bottom { padding-bottom: env(safe-area-inset-bottom, 24px); }
        
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2.5s linear infinite;
        }
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const NutrientBox = ({ label, value, unit, color, bg, border }) => (
  <div className={`${bg} ${border} border rounded-2xl p-3 flex flex-col items-center justify-center text-center h-24`}>
    <span className={`text-xl font-bold ${color}`}>{value}</span>
    <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-1">{label}</span>
    <span className="text-[10px] text-zinc-500">{unit}</span>
  </div>
);

export default FoodScanner;