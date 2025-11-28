import React, { useEffect, useRef, useState, useCallback, useContext, useMemo } from 'react';
import { Zap, Clock, Utensils, CheckCircle, RefreshCw, X, ScanLine, RotateCcw, Loader2, ZoomIn, ZoomOut, Image as ImageIcon, Trash2, Calculator, Target, Camera, Calendar, Ruler, Weight } from 'lucide-react'; // Added Ruler, Weight
import { saveFoodLog, getFoodLogs, getNutritionProfile, deleteFoodLog } from '../utils/db'; // Added deleteFoodLog
import { analyzeFood } from '../utils/foodApi';
import { AppContext } from '../App';

const FoodScanner = () => {
  const { setCurrentPage, showNotification } = useContext(AppContext); // Get notification handler
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Camera State
  const [cameraEnabled, setCameraEnabled] = useState(false); // NEW: Manual Camera Toggle
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [streamActive, setStreamActive] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  
  // Zoom State
  const [zoom, setZoom] = useState(1);
  const [zoomCap, setZoomCap] = useState({ min: 1, max: 1, step: 0.1 });
  const [hasZoom, setHasZoom] = useState(false);

  // App State
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Initializing..."); 
  const [imageCaptured, setImageCaptured] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);
  const [shutterEffect, setShutterEffect] = useState(false);
  
  // NEW: Nutrition State
  const [nutritionGoal, setNutritionGoal] = useState(null);
  const [todayStats, setTodayStats] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  // --- 1. Camera Initialization ---
  const startCamera = useCallback(async () => {
    if (!cameraEnabled) return; // Don't start if disabled

    if (stream) stream.getTracks().forEach(track => track.stop());

    try {
      const constraints = { 
        video: { 
          facingMode: facingMode, 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 },
          focusMode: 'continuous'
        } 
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current.play();
          setStreamActive(true);
          
          const track = newStream.getVideoTracks()[0];
          const capabilities = track.getCapabilities ? track.getCapabilities() : {};
          
          setHasTorch(!!capabilities.torch);

          if ('zoom' in capabilities) {
            setHasZoom(true);
            setZoomCap({
                min: capabilities.zoom.min,
                max: capabilities.zoom.max,
                step: capabilities.zoom.step
            });
          }

          try {
            if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
            }
          } catch (e) {
            console.log("Focus constraint failed");
          }
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied. You can still upload photos.");
    }
  }, [facingMode, cameraEnabled]); // Added cameraEnabled dependency

  useEffect(() => {
    startCamera();
    loadHistory();
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, [startCamera]);

  // Stop camera when disabled
  useEffect(() => {
    if (!cameraEnabled && stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setStreamActive(false);
    }
  }, [cameraEnabled]);

  // --- 2. Actions ---
  const handleZoom = async (e) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    if (stream) {
        const track = stream.getVideoTracks()[0];
        await track.applyConstraints({ advanced: [{ zoom: newZoom }] });
    }
  };

  const toggleFlash = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
    setFlashOn(!flashOn);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setZoom(1);
  };

  const loadHistory = async () => {
    const logs = await getFoodLogs();
    setHistory(logs || []);

    // NEW: Load Goal & Calculate Today's Stats
    const profile = await getNutritionProfile();
    setNutritionGoal(profile);

    const today = new Date().setHours(0,0,0,0);
    const todaysLogs = (logs || []).filter(log => log.timestamp >= today);
    
    const stats = todaysLogs.reduce((acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fat: acc.fat + (log.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    setTodayStats(stats);
  };

  const handleDelete = async (id) => {
    try {
        await deleteFoodLog(id); // Delete from DB
        await loadHistory(); // Reload from DB to sync UI
        showNotification({
            type: 'success',
            title: 'Deleted',
            message: 'Food log removed.'
        });
    } catch (error) {
        console.error("Delete failed", error);
        showNotification({
            type: 'error',
            title: 'Error',
            message: 'Could not delete item.'
        });
    }
  };

  // --- 3. NEW: Upload Logic ---
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset states
    setError(null);
    setResult(null);
    setImageCaptured(true); // Treat upload like a capture
    setIsProcessing(true);
    setStatusText("Processing uploaded image...");

    try {
        // Direct pass to API - API handles resizing/compression
        const aiResult = await analyzeFood(file, (status) => {
            setStatusText(status); 
        });

        setResult(aiResult);
        if (!aiResult.isUnknown) {
            await saveFoodLog(aiResult);
            await loadHistory();
            showNotification({
                type: 'success',
                title: 'Food Logged',
                message: `${aiResult.name} added to your history.`
            });
        }
    } catch (err) {
        console.error(err);
        setError(err.message || "Could not analyze the uploaded image.");
    } finally {
        setIsProcessing(false);
        // Clear input so selecting the same file triggers change again
        event.target.value = null; 
    }
  };

  // --- 4. Capture Logic ---
  const takePhoto = async () => {
    if (!videoRef.current || isProcessing) return;

    setShutterEffect(true);
    setTimeout(() => setShutterEffect(false), 150);

    videoRef.current.pause();
    setImageCaptured(true);
    setIsProcessing(true);
    setStatusText("Analyzing image details...");
    setError(null);

    try {
      const video = videoRef.current;
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      
      const canvas = document.createElement('canvas');
      canvas.width = minDim;
      canvas.height = minDim;
      
      const ctx = canvas.getContext('2d');
      const startX = (video.videoWidth - minDim) / 2;
      const startY = (video.videoHeight - minDim) / 2;
      
      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, minDim, minDim);

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Capture failed");

        try {
            const aiResult = await analyzeFood(blob, (status) => {
                setStatusText(status); 
            });

            setResult(aiResult);
            if (!aiResult.isUnknown) {
                await saveFoodLog(aiResult);
                await loadHistory();
                showNotification({
                    type: 'success',
                    title: 'Food Logged',
                    message: `${aiResult.name} added to your history.`
                });
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Couldn't identify food.");
        } finally {
            setIsProcessing(false);
        }
      }, 'image/jpeg', 0.95);

    } catch (e) {
      console.error(e);
      setError("System error during capture.");
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
    setImageCaptured(false);
    setStatusText("");
    if (videoRef.current && streamActive) videoRef.current.play();
  };

  // Group History by Date
  const groupedHistory = useMemo(() => {
    const groups = {};
    history.forEach(item => {
        const date = new Date(item.timestamp);
        const dateKey = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        if (!groups[dateKey]) {
            groups[dateKey] = { items: [], totalCals: 0 };
        }
        groups[dateKey].items.push(item);
        groups[dateKey].totalCals += (item.calories || 0);
    });
    return groups;
  }, [history]);

  // --- Render ---
  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-sans select-none text-white">
      
      {/* 0. Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* 1. Viewfinder Layer */}
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
                    onClick={() => setCameraEnabled(true)}
                    className="px-8 py-3 bg-emerald-500 text-black font-bold rounded-full active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
                >
                    Enable Camera
                </button>
            </div>
        )}
        
        {/* Shutter & Gradient Overlays (Only show if camera enabled) */}
        {cameraEnabled && (
            <>
                <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 ${shutterEffect ? 'opacity-50' : 'opacity-0'}`} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
            </>
        )}
      </div>

      {/* 2. Error Layer */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in">
           <div className="bg-zinc-900 p-6 rounded-2xl border border-red-500/30 text-center max-w-xs shadow-2xl">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                 <X className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-white mb-6 font-medium">{error}</p>
              <button onClick={resetScanner} className="w-full py-3 bg-white text-black font-bold rounded-xl active:scale-95 transition-transform">
                Try Again
              </button>
           </div>
        </div>
      )}

      {/* 3. Header Controls */}
      {!result && (
      <div className="relative z-10 flex justify-between items-center p-4 safe-top pt-8">
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 shadow-lg">
          <Utensils className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-white tracking-wide">AI Food Lens</span>
        </div>
        
        <div className="flex space-x-3">
            {/* NEW: Calculator Button */}
            <button onClick={() => setCurrentPage('calculator')} className="icon-btn">
                <Calculator className="w-5 h-5" />
            </button>
            
            {/* Only show camera controls if enabled */}
            {cameraEnabled && (
                <>
                    <button onClick={toggleCamera} disabled={imageCaptured} className="icon-btn">
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    {hasTorch && (
                        <button onClick={toggleFlash} disabled={imageCaptured} className={`icon-btn transition-colors ${flashOn ? 'bg-yellow-500 text-black border-yellow-500' : ''}`}>
                        <Zap className={`w-5 h-5 ${flashOn ? 'fill-current' : ''}`} />
                        </button>
                    )}
                </>
            )}
        </div>
      </div>
      )}

      {/* 4. Center Focus / Loading Box (Only if camera enabled) */}
      {!result && !error && cameraEnabled && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className={`w-[70vmin] h-[70vmin] max-w-sm max-h-sm border transition-all duration-300 rounded-[2rem] relative overflow-hidden shadow-2xl ${isProcessing ? 'border-emerald-500/50 bg-black/40 backdrop-blur-sm' : 'border-white/30 bg-white/5 backdrop-blur-[1px]'}`}>
            
            {/* Intelligent Framing Corners */}
            {!isProcessing && (
                <>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl shadow-sm" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl shadow-sm" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl shadow-sm" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl shadow-sm" />
                
                {/* Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="w-4 h-0.5 bg-white"></div>
                    <div className="h-4 w-0.5 bg-white absolute"></div>
                </div>
                </>
            )}

            {/* Loading State */}
            {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-400 p-4 text-center">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <span className="text-sm font-medium text-white tracking-widest uppercase animate-pulse">
                        {statusText}
                    </span>
                </div>
            )}
          </div>
          
          {/* Zoom Slider */}
          {!isProcessing && (
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
                            onChange={handleZoom}
                            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full"
                        />
                        <ZoomIn className="w-4 h-4 text-white/70" />
                    </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* 5. Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-12 pt-12 bg-gradient-to-t from-black via-black/90 to-transparent">
        {!result && !isProcessing && !error ? (
          <div className="flex items-center justify-center w-full px-8 space-x-12">
            
            {/* History Button */}
            <button onClick={() => setShowHistory(true)} className="control-btn group">
              <Clock className="w-6 h-6 group-active:scale-90 transition-transform" />
            </button>

            {/* Shutter Button (Only active if camera enabled) */}
            <button 
              onClick={takePhoto}
              disabled={!streamActive || !cameraEnabled}
              className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-95 ${!cameraEnabled ? 'opacity-50 grayscale' : ''}`}
            >
                <div className="absolute inset-0 rounded-full border-4 border-white opacity-100 shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                <div className="w-16 h-16 rounded-full bg-white group-active:scale-90 transition-all duration-200" />
            </button>

            {/* Upload Button */}
            <button onClick={triggerFileUpload} className="control-btn group">
              <ImageIcon className="w-6 h-6 group-active:scale-90 transition-transform" />
            </button>

          </div>
        ) : result ? (
          // Result Card (Same as before)
          <div className="mx-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 mb-4 safe-bottom">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-2xl font-bold text-white capitalize tracking-tight leading-tight">{result.name}</h2>
                {!result.isUnknown && (
                    <div className="flex items-center space-x-2 mt-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-500 text-xs font-bold tracking-wide uppercase">Successfully Logged</span>
                    </div>
                )}
              </div>
              <button onClick={resetScanner} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-95 flex items-center gap-2 px-4 border border-white/5">
                <RefreshCw className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">Next Scan</span>
              </button>
            </div>

            {result.isUnknown ? (
               <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
                 <p className="text-yellow-200 text-sm">
                   We identified this as <strong>{result.name}</strong>, but exact nutrition data is unavailable.
                 </p>
               </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 mb-4">
                <NutrientBox label="Kcal" value={result.calories} color="text-white" bg="bg-white/10" />
                <NutrientBox label="Prot" value={result.protein + 'g'} color="text-blue-400" bg="bg-blue-500/10" />
                <NutrientBox label="Carb" value={result.carbs + 'g'} color="text-yellow-400" bg="bg-yellow-500/10" />
                <NutrientBox label="Fat" value={result.fat + 'g'} color="text-rose-400" bg="bg-rose-500/10" />
              </div>
            )}
            
            <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-white/5 pt-3 uppercase tracking-wider">
                <span>AI Confidence: {Math.round(result.confidence * 100)}%</span>
                <span>Source: {result.confidence >= 0.95 ? 'Gemini Vision' : 'OpenFoodFacts DB'}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-zinc-900 w-full max-w-md rounded-3xl flex flex-col shadow-2xl border border-white/10 max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Food History</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Daily Progress Section */}
            {nutritionGoal && (
                <div className="px-6 pt-6 pb-2 space-y-4">
                    {/* User Stats Reference */}
                    <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                <Ruler className="w-3 h-3" />
                                <span>{nutritionGoal.height} cm</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                <Weight className="w-3 h-3" />
                                <span>{nutritionGoal.weight} kg</span>
                            </div>
                        </div>
                        <div className="text-xs text-emerald-500 font-medium uppercase tracking-wider">
                            {nutritionGoal.goal === 'cut' ? 'Weight Loss' : nutritionGoal.goal === 'bulk' ? 'Muscle Gain' : 'Maintain'}
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-900/40 to-zinc-900 border border-emerald-500/20 rounded-2xl p-4">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Today's Intake</div>
                                <div className="text-2xl font-bold text-white">
                                    {todayStats.calories} <span className="text-sm text-zinc-500 font-normal">/ {nutritionGoal.targetCalories} kcal</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-zinc-500 mb-1">Remaining</div>
                                <div className="font-bold text-white">{Math.max(0, nutritionGoal.targetCalories - todayStats.calories)}</div>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(100, (todayStats.calories / nutritionGoal.targetCalories) * 100)}%` }}
                            />
                        </div>

                        {/* Macros Mini */}
                        <div className="flex justify-between mt-3 pt-3 border-t border-white/5 text-[10px] text-zinc-400 uppercase tracking-wide">
                            <span>Prot: {todayStats.protein}g / {nutritionGoal.protein}g</span>
                            <span>Carb: {todayStats.carbs}g / {nutritionGoal.carbs}g</span>
                            <span>Fat: {todayStats.fat}g / {nutritionGoal.fats}g</span>
                        </div>
                    </div>
                </div>
            )}

            {!nutritionGoal && (
                <div className="px-6 pt-6 pb-2">
                    <button 
                        onClick={() => { setShowHistory(false); setCurrentPage('calculator'); }}
                        className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors"
                    >
                        <Target className="w-4 h-4" />
                        Set Calorie Goal
                    </button>
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-zinc-500 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <ScanLine className="w-6 h-6 opacity-40" />
                  </div>
                  <p className="text-sm">No food logged yet</p>
                </div>
              ) : (
                Object.entries(groupedHistory).map(([date, group]) => (
                    <div key={date} className="animate-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between px-2 mb-3">
                            <div className="flex items-center gap-2 text-emerald-500">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">{date}</span>
                            </div>
                            <span className="text-xs text-zinc-500 font-medium">{group.totalCals} kcal total</span>
                        </div>
                        
                        <div className="space-y-2">
                            {group.items.map((item, i) => (
                                <div key={item.id || i} className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                                            <Utensils className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-white capitalize text-sm">{item.name}</div>
                                            <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-white font-bold text-sm">{item.calories}</div>
                                            <div className="text-[9px] text-zinc-500 uppercase tracking-wide">kcal</div>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item.id); // Pass ID instead of timestamp
                                            }}
                                            className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
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
        .safe-top { padding-top: max(2rem, env(safe-area-inset-top)); }
        .safe-bottom { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
};

const NutrientBox = ({ label, value, color, bg }) => (
  <div className={`${bg} rounded-2xl p-2 py-3 flex flex-col items-center justify-center text-center border border-white/5`}>
    <span className={`text-lg font-bold ${color}`}>{value}</span>
    <span className="text-[9px] text-zinc-400 uppercase tracking-wider mt-0.5">{label}</span>
  </div>
);

export default FoodScanner;