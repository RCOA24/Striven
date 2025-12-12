import React, { useState, useContext } from 'react';
import { 
  Calculator, Activity, ChevronRight, RotateCcw, Flame, Target, 
  TrendingUp, ArrowLeft, Apple, Dumbbell, Check, Ruler, Weight, 
  Calendar, Info, Droplets, Sparkles
} from 'lucide-react';
import { AppContext } from '../App';
import { saveNutritionProfile } from '../utils/db';

const CalorieCalculator = () => {
  const { setCurrentPage } = useContext(AppContext);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gender: 'male',
    age: '',
    height: '',
    weight: '',
    activity: '1.2',
    goal: 'maintain'
  });
  const [result, setResult] = useState(null);
  const [aiTips, setAiTips] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [lastPayload, setLastPayload] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectActivity = (val) => {
    setFormData({ ...formData, activity: val });
  };

  const calculate = () => {
    const { gender, age, height, weight, activity, goal } = formData;
    if (!age || !height || !weight) return;

    let bmr = (10 * parseFloat(weight)) + (6.25 * parseFloat(height)) - (5 * parseFloat(age));
    bmr += gender === 'male' ? 5 : -161;

    const tdee = bmr * parseFloat(activity);
    
    let targetCalories = tdee;
    if (goal === 'cut') targetCalories -= 500;
    if (goal === 'bulk') targetCalories += 500;

    // Water Calculation Logic
    // Base: 35ml/kg. Adjust for age and activity.
    let waterMultiplier = 35;
    const ageNum = parseFloat(age);
    const weightNum = parseFloat(weight);
    
    if (ageNum < 30) waterMultiplier = 40;
    else if (ageNum > 55) waterMultiplier = 30;
    
    if (parseFloat(activity) > 1.5) waterMultiplier += 5; // Extra hydration for active lifestyles
    
    const waterTarget = Math.round(weightNum * waterMultiplier);

    const computed = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      target: Math.round(targetCalories),
      water: waterTarget, // Add water to result
      macros: {
        protein: Math.round((targetCalories * 0.3) / 4),
        fats: Math.round((targetCalories * 0.25) / 9),
        carbs: Math.round((targetCalories * 0.45) / 4)
      }
    };
    setResult(computed);
    setLastPayload({ ...formData, ...computed });
    setStep(3);

    // Kick off AI suggestions
    fetchAiTips({ ...formData, ...computed });
  };

  const fetchAiTips = async (payload) => {
    const proxyUrl = import.meta.env.VITE_AI_TIPS_URL;
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    // Prefer proxy to avoid exposing keys; fallback to direct only if proxy is absent and key exists.
    if (!proxyUrl && !apiKey) {
      setAiTips('');
      return;
    }
    setAiLoading(true);
    setAiError('');
    try {
      const prompt = `You are a concise fitness & nutrition coach. Provide 3 short bullet tips personalized for this user. Keep each bullet under 18 words.
User: ${payload.gender}, age ${payload.age}, height ${payload.height}cm, weight ${payload.weight}kg
Goal: ${payload.goal}
Activity factor: ${payload.activity}
Daily target: ${payload.target} kcal | Protein ${payload.macros.protein}g | Carbs ${payload.macros.carbs}g | Fats ${payload.macros.fats}g | Water ${payload.water}ml
Focus on: meal composition, hydration, and one habit to improve recovery. Avoid generic advice.`;

      const requestBody = proxyUrl
        ? { prompt }
        : {
            contents: [{ parts: [{ text: prompt }] }]
          };

      const resp = await fetch(
        proxyUrl || `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );
      if (!resp.ok) throw new Error('AI service unavailable');
      const data = await resp.json();
      const text = proxyUrl
        ? data.text || ''
        : data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setAiTips((text || '').trim());
    } catch (err) {
      setAiError('Could not load AI tips.');
      setAiTips('');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAndTrack = async () => {
    if (!result) return;
    
    await saveNutritionProfile({
        ...formData,
        bmr: result.bmr,
        tdee: result.tdee,
        targetCalories: result.target,
        waterTarget: result.water, // Save water target
        protein: result.macros.protein,
        fats: result.macros.fats,
        carbs: result.macros.carbs
    });
    
    setCurrentPage('food');
  };

  const reset = () => {
    setResult(null);
    setStep(1);
    setFormData({ gender: 'male', age: '', height: '', weight: '', activity: '1.2', goal: 'maintain' });
  };

  // Activity Options Data
  const activityOptions = [
    { value: "1.2", label: "Sedentary", desc: "Office job, little exercise" },
    { value: "1.375", label: "Light Activity", desc: "1-2 days/week" },
    { value: "1.55", label: "Moderate", desc: "3-5 days/week" },
    { value: "1.725", label: "Very Active", desc: "6-7 days/week" },
    { value: "1.9", label: "Athlete", desc: "2x training per day" },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24 safe-top">
      <style>{`
        .font-apple { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .ios-input-group { @apply bg-[#1C1C1E] rounded-xl overflow-hidden; }
        .ios-input-row { @apply flex items-center justify-between p-4 border-b border-white/10 last:border-0; }
        .ios-input { @apply bg-transparent text-right text-white placeholder-zinc-600 focus:outline-none w-32 font-medium; }
      `}</style>

      {/* Navigation Bar */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => step === 1 ? setCurrentPage('food') : setStep(step - 1)} 
          className="flex items-center text-emerald-500 font-medium active:opacity-70"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          {step === 1 ? 'Back' : 'Previous'}
        </button>
        <h1 className="font-apple font-semibold text-lg">
          {step === 1 ? 'Body Details' : step === 2 ? 'Lifestyle' : 'Your Plan'}
        </h1>
        <div className="w-16 text-right">
           {/* Placeholder for balance */}
           {step < 3 && <span className="text-zinc-500 text-sm">{step}/2</span>}
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold font-apple mb-2">Tell us about yourself</h2>
              <p className="text-zinc-400 text-sm">We need this to calculate your metabolic rate.</p>
            </div>

            {/* Gender Selection */}
            <div className="grid grid-cols-2 gap-4">
              {['male', 'female'].map((g) => (
                <button
                  key={g}
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={`relative h-32 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                    formData.gender === g
                      ? 'bg-emerald-500/20 border-emerald-500'
                      : 'bg-[#1C1C1E] border-transparent hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-4xl">{g === 'male' ? '👨' : '👩'}</span>
                  <span className="font-medium capitalize text-white">{g}</span>
                  {formData.gender === g && (
                    <div className="absolute top-3 right-3 bg-emerald-500 rounded-full p-0.5">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* iOS Style Input Group */}
            <div className="ios-input-group">
              <div className="ios-input-row">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-orange-500/20 rounded-md"><Calendar className="w-4 h-4 text-orange-500" /></div>
                  <span className="font-medium">Age</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    name="age" 
                    value={formData.age} 
                    onChange={handleChange} 
                    placeholder="0" 
                    className="ios-input" 
                  />
                  <span className="text-zinc-500 text-sm">years</span>
                </div>
              </div>

              <div className="ios-input-row">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-500/20 rounded-md"><Ruler className="w-4 h-4 text-blue-500" /></div>
                  <span className="font-medium">Height</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    name="height" 
                    value={formData.height} 
                    onChange={handleChange} 
                    placeholder="0" 
                    className="ios-input" 
                  />
                  <span className="text-zinc-500 text-sm">cm</span>
                </div>
              </div>

              <div className="ios-input-row">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-purple-500/20 rounded-md"><Weight className="w-4 h-4 text-purple-500" /></div>
                  <span className="font-medium">Weight</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    name="weight" 
                    value={formData.weight} 
                    onChange={handleChange} 
                    placeholder="0" 
                    className="ios-input" 
                  />
                  <span className="text-zinc-500 text-sm">kg</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.age || !formData.height || !formData.weight}
              className="w-full bg-emerald-500 text-black font-bold text-lg py-4 rounded-2xl mt-8 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Activity & Goal */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
            
            {/* Activity Section */}
            <div>
              <h3 className="text-lg font-bold font-apple mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Activity Level
              </h3>
              <div className="space-y-2">
                {activityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => selectActivity(opt.value)}
                    className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between ${
                      formData.activity === opt.value
                        ? 'bg-emerald-500/20 border-2 border-emerald-500'
                        : 'bg-[#1C1C1E] border-2 border-transparent hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <div className={`font-medium ${formData.activity === opt.value ? 'text-emerald-400' : 'text-white'}`}>
                        {opt.label}
                      </div>
                      <div className="text-xs text-zinc-500">{opt.desc}</div>
                    </div>
                    {formData.activity === opt.value && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Section */}
            <div>
              <h3 className="text-lg font-bold font-apple mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" />
                Your Goal
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                    { id: 'cut', label: 'Lose', icon: <Flame className="w-5 h-5"/>, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { id: 'maintain', label: 'Maintain', icon: <Target className="w-5 h-5"/>, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { id: 'bulk', label: 'Gain', icon: <Dumbbell className="w-5 h-5"/>, color: 'text-purple-500', bg: 'bg-purple-500/10' }
                ].map((goal) => (
                    <button
                        key={goal.id}
                        onClick={() => setFormData({ ...formData, goal: goal.id })}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            formData.goal === goal.id
                            ? `border-current ${goal.color} bg-zinc-900`
                            : 'border-transparent bg-[#1C1C1E] text-zinc-400 hover:bg-zinc-800'
                        }`}
                    >
                        <div className={`p-2 rounded-full ${goal.bg} ${goal.color}`}>
                            {goal.icon}
                        </div>
                        <span className="text-sm font-medium">{goal.label}</span>
                    </button>
                ))}
              </div>
            </div>

            <button
              onClick={calculate}
              className="w-full bg-emerald-500 text-black font-bold text-lg py-4 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
            >
              Calculate Plan
            </button>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            
            {/* Main Result Card */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-emerald-600 to-emerald-800 p-8 text-center shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full mb-4">
                  <Flame className="w-3 h-3 text-emerald-200" />
                  <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Daily Target</span>
                </div>
                
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <h2 className="text-6xl font-bold text-white tracking-tighter">{result.target}</h2>
                  <span className="text-xl font-medium text-emerald-200">kcal</span>
                </div>
                
                <p className="text-emerald-100 text-sm opacity-90 max-w-[200px] mx-auto">
                  Based on your {formData.goal} goal and activity level.
                </p>
              </div>
            </div>

            {/* Macros & Water Section */}
            <div>
              <h3 className="text-lg font-bold font-apple mb-4 px-1">Daily Targets</h3>
              <div className="grid grid-cols-2 gap-3">
                  <MacroCard label="Protein" value={result.macros.protein + 'g'} color="bg-blue-500" icon={<Dumbbell className="w-4 h-4 text-blue-100"/>} />
                  <MacroCard label="Carbs" value={result.macros.carbs + 'g'} color="bg-yellow-500" icon={<Apple className="w-4 h-4 text-yellow-100"/>} />
                  <MacroCard label="Fats" value={result.macros.fats + 'g'} color="bg-rose-500" icon={<Info className="w-4 h-4 text-rose-100"/>} />
                  {/* Water Card */}
                  <MacroCard label="Water" value={result.water + 'ml'} color="bg-cyan-500" icon={<Droplets className="w-4 h-4 text-cyan-100"/>} />
              </div>
            </div>

            {/* Stats Details */}
            <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-zinc-800 rounded-md"><Activity className="w-4 h-4 text-zinc-400" /></div>
                    <span className="text-sm font-medium text-zinc-300">BMR (Resting)</span>
                  </div>
                  <span className="font-bold text-white">{result.bmr}</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-zinc-800 rounded-md"><TrendingUp className="w-4 h-4 text-zinc-400" /></div>
                    <span className="text-sm font-medium text-zinc-300">TDEE (Maintenance)</span>
                  </div>
                  <span className="font-bold text-white">{result.tdee}</span>
              </div>
            </div>

            {/* AI Tips */}
            <div className="bg-[#101012] rounded-2xl border border-white/5 p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">AI Coach</p>
                  <p className="text-[11px] text-zinc-500">Personalized pointers for this plan</p>
                </div>
              </div>
              {aiLoading && (
                <p className="text-zinc-400 text-sm">Generating tips...</p>
              )}
              {aiError && (
                <p className="text-amber-300 text-sm">{aiError}</p>
              )}
              {!aiLoading && !aiError && aiTips && (
                <div className="space-y-2">
                  <ul className="list-disc list-inside text-sm text-zinc-200 space-y-1">
                    {aiTips.split(/\n|\r/).filter(Boolean).map((line, idx) => (
                      <li key={idx}>{line.replace(/^[-•\s]+/, '')}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => lastPayload && fetchAiTips(lastPayload)}
                    className="text-[11px] text-emerald-300 underline underline-offset-4 active:opacity-70"
                  >
                    Refresh tips
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-3">
              <button
                onClick={handleSaveAndTrack}
                className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl active:scale-95 transition-transform shadow-lg flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Save & Start Tracking
              </button>

              <button
                onClick={reset}
                className="w-full flex items-center justify-center space-x-2 text-zinc-500 font-medium py-3 active:opacity-70"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Recalculate</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MacroCard = ({ label, value, color, icon }) => (
    <div className="bg-[#1C1C1E] rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden group">
        <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
        <div className={`mb-2 p-2 rounded-full ${color} bg-opacity-20`}>
          {icon}
        </div>
        <span className="text-xl font-bold text-white mb-0.5">{value}</span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{label}</span>
    </div>
);

const CheckCircle = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default CalorieCalculator;
