import React, { useEffect, useRef, useState, useCallback, useContext, useMemo } from 'react';
import { Zap, Clock, Utensils, CheckCircle, RefreshCw, X, ScanLine, RotateCcw, Loader2, ZoomIn, ZoomOut, Image as ImageIcon, Trash2, Calculator, Target, Camera, Calendar, Ruler, Weight } from 'lucide-react'; // Added Ruler, Weight
import { saveFoodLog, getFoodLogs, getNutritionProfile, deleteFoodLog, saveWaterLog, getWaterLogs } from '../utils/db'; // Added water functions
import { analyzeFood } from '../utils/foodApi';
import { AppContext } from '../App';

// Components
import ScannerViewfinder from '../components/food/ScannerViewfinder';
import { ScannerHeader, ScannerFooter } from '../components/food/ScannerControls';
import ScannerResults from '../components/food/ScannerResults';
import HistoryModal from '../components/food/HistoryModal';

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
  
  // Nutrition State
  const [nutritionGoal, setNutritionGoal] = useState(null);
  const [todayStats, setTodayStats] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [waterIntake, setWaterIntake] = useState(0); // NEW
  const [waterTarget, setWaterTarget] = useState(2500); // NEW

  // --- 0. Request Camera Permissions (Android 6+) ---
  const requestCameraPermissions = useCallback(async () => {
    try {
      // Check if running on native platform
      if (window.Capacitor?.getPlatform && window.Capacitor.getPlatform() === 'android') {
        // Dynamically import Capacitor Camera only on Android
        try {
          const { Camera: CapCamera } = await import('@capacitor/camera');
          const permission = await CapCamera.requestPermissions({ permissions: ['camera'] });
          if (permission.camera === 'granted' || permission.camera === 'prompt-only') {
            return true;
          }
        } catch (capErr) {
          console.warn('Capacitor camera permission request failed, trying web API:', capErr);
        }
      }
      
      // Fallback: Try web API (works on iOS and web)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (err) {
        console.error('Camera permission denied:', err);
        return false;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }, []);

  // --- 1. Camera Initialization ---
  const startCamera = useCallback(async () => {
    if (!cameraEnabled) return; // Don't start if disabled

    if (stream) stream.getTracks().forEach(track => track.stop());

    try {
      // Request permissions first (especially important on Android)
      const hasPermission = await requestCameraPermissions();
      if (!hasPermission) {
        setError("Camera access denied. You can still upload photos.");
        return;
      }

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
  }, [facingMode, cameraEnabled, requestCameraPermissions]); // Added requestCameraPermissions

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

    // Calculate Dynamic Water Target
    if (profile && profile.weight) {
        let multiplier = 35; // Base: 35ml per kg
        if (profile.age) {
            if (profile.age < 30) multiplier = 40;
            else if (profile.age > 55) multiplier = 30;
        }
        // Activity adjustment
        if (profile.activity) {
             const actLevel = parseFloat(profile.activity);
             if (actLevel > 1.5) multiplier += 5; // Add extra for active people
        }
        setWaterTarget(Math.round(profile.weight * multiplier));
    }

    const today = new Date().setHours(0,0,0,0);
    const todaysLogs = (logs || []).filter(log => log.timestamp >= today);
    
    const stats = todaysLogs.reduce((acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fat: acc.fat + (log.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    setTodayStats(stats);

    // Load Water
    const waterLogs = await getWaterLogs();
    const todaysWater = (waterLogs || [])
        .filter(log => log.timestamp >= today)
        .reduce((sum, log) => sum + log.amount, 0);
    setWaterIntake(todaysWater);
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

  const handleAddWater = async (amount) => {
    try {
        await saveWaterLog(amount);
        await loadHistory();
    } catch (error) {
        console.error("Water log failed", error);
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
      <ScannerViewfinder 
        videoRef={videoRef}
        cameraEnabled={cameraEnabled}
        streamActive={streamActive}
        shutterEffect={shutterEffect}
        isProcessing={isProcessing}
        statusText={statusText}
        hasZoom={hasZoom}
        zoom={zoom}
        zoomCap={zoomCap}
        onEnableCamera={() => setCameraEnabled(true)}
        onZoom={handleZoom}
      />

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
        <ScannerHeader 
          onToggleCamera={toggleCamera}
          onToggleFlash={toggleFlash}
          onOpenCalculator={() => setCurrentPage('calculator')}
          cameraEnabled={cameraEnabled}
          hasTorch={hasTorch}
          flashOn={flashOn}
          imageCaptured={imageCaptured}
        />
      )}

      {/* 4. Bottom Controls */}
      {!result && !isProcessing && !error && (
        <ScannerFooter 
          onTakePhoto={takePhoto}
          onUpload={triggerFileUpload}
          onShowHistory={() => setShowHistory(true)}
          streamActive={streamActive}
          cameraEnabled={cameraEnabled}
        />
      )}

      <ScannerResults 
        result={result}
        onReset={resetScanner}
      />

      <HistoryModal 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        groupedHistory={groupedHistory}
        nutritionGoal={nutritionGoal}
        todayStats={todayStats}
        waterIntake={waterIntake} // NEW
        waterTarget={waterTarget} // NEW
        onAddWater={handleAddWater} // NEW
        onDelete={handleDelete}
        onSetGoal={() => { setShowHistory(false); setCurrentPage('calculator'); }}
      />

      <style>{`
        .icon-btn { @apply p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white active:scale-95 transition-transform; }
        .control-btn { @apply p-4 rounded-full bg-zinc-800/80 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-transform; }
        .safe-top { padding-top: max(2rem, env(safe-area-inset-top)); }
        .safe-bottom { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
};

export default FoodScanner;