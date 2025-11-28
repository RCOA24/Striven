import React, { useState, useContext } from 'react';
import { Calculator, Activity, ChevronRight, RotateCcw, Flame, Target, TrendingUp, ArrowLeft, Apple, Dumbbell, Check } from 'lucide-react';
import { AppContext } from '../App';
import { saveNutritionProfile } from '../utils/db'; // Import DB function

const CalorieCalculator = () => {
  const { setCurrentPage } = useContext(AppContext);
  const [step, setStep] = useState(1); // 1: Info, 2: Activity/Diet, 3: Result
  const [formData, setFormData] = useState({
    gender: 'male',
    age: '',
    height: '',
    weight: '',
    activity: '1.2',
    goal: 'maintain' // cut, maintain, bulk
  });
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculate = () => {
    const { gender, age, height, weight, activity, goal } = formData;
    if (!age || !height || !weight) return;

    // Mifflin-St Jeor Equation
    let bmr = (10 * parseFloat(weight)) + (6.25 * parseFloat(height)) - (5 * parseFloat(age));
    bmr += gender === 'male' ? 5 : -161;

    const tdee = bmr * parseFloat(activity);
    
    let targetCalories = tdee;
    if (goal === 'cut') targetCalories -= 500;
    if (goal === 'bulk') targetCalories += 500;

    setResult({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      target: Math.round(targetCalories),
      macros: {
        protein: Math.round((targetCalories * 0.3) / 4),
        fats: Math.round((targetCalories * 0.25) / 9),
        carbs: Math.round((targetCalories * 0.45) / 4)
      }
    });
    setStep(3);
  };

  const handleSaveAndTrack = async () => {
    if (!result) return;
    
    await saveNutritionProfile({
        ...formData, // gender, age, etc
        bmr: result.bmr,
        tdee: result.tdee,
        targetCalories: result.target,
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

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 pb-24 safe-top">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => setCurrentPage('food')} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
            <h1 className="text-2xl font-bold">Calorie Planner</h1>
            <p className="text-xs text-zinc-500">Personalized Nutrition Plan</p>
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <div className="grid grid-cols-2 gap-4">
            {['male', 'female'].map((g) => (
              <button
                key={g}
                onClick={() => setFormData({ ...formData, gender: g })}
                className={`p-4 rounded-2xl border capitalize font-medium transition-all flex flex-col items-center gap-2 ${
                  formData.gender === g
                    ? 'bg-emerald-500 text-black border-emerald-500'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <span className="text-2xl">{g === 'male' ? '👨' : '👩'}</span>
                {g}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Age" name="age" value={formData.age} onChange={handleChange} placeholder="25" suffix="yrs" />
              <InputGroup label="Height" name="height" value={formData.height} onChange={handleChange} placeholder="175" suffix="cm" />
            </div>
            <InputGroup label="Weight" name="weight" value={formData.weight} onChange={handleChange} placeholder="70" suffix="kg" />
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!formData.age || !formData.height || !formData.weight}
            className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl mt-8 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Step
          </button>
        </div>
      )}

      {/* Step 2: Activity & Goal */}
      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
           <div className="space-y-2">
            <label className="text-sm text-zinc-400 ml-1 font-medium">Activity Level</label>
            <div className="relative">
              <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
              <select
                name="activity"
                value={formData.activity}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 pl-12 text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="1.2">Sedentary (Office job)</option>
                <option value="1.375">Light Exercise (1-2 days/wk)</option>
                <option value="1.55">Moderate Exercise (3-5 days/wk)</option>
                <option value="1.725">Heavy Exercise (6-7 days/wk)</option>
                <option value="1.9">Athlete (2x per day)</option>
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 rotate-90" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm text-zinc-400 ml-1 font-medium">Your Goal</label>
            {[
                { id: 'cut', label: 'Lose Weight', icon: <Flame className="w-4 h-4 text-orange-400"/>, desc: 'Calorie Deficit' },
                { id: 'maintain', label: 'Maintain Weight', icon: <Target className="w-4 h-4 text-blue-400"/>, desc: 'Stay the same' },
                { id: 'bulk', label: 'Gain Muscle', icon: <Dumbbell className="w-4 h-4 text-purple-400"/>, desc: 'Calorie Surplus' }
            ].map((goal) => (
                <button
                    key={goal.id}
                    onClick={() => setFormData({ ...formData, goal: goal.id })}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        formData.goal === goal.id
                        ? 'bg-emerald-500/10 border-emerald-500'
                        : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${formData.goal === goal.id ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                            {goal.icon}
                        </div>
                        <div>
                            <div className={`font-bold ${formData.goal === goal.id ? 'text-emerald-400' : 'text-white'}`}>{goal.label}</div>
                            <div className="text-xs text-zinc-500">{goal.desc}</div>
                        </div>
                    </div>
                    {formData.goal === goal.id && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                </button>
            ))}
          </div>

          <button
            onClick={calculate}
            className="w-full bg-emerald-500 text-black font-bold text-lg py-4 rounded-2xl mt-8 active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
          >
            Calculate Plan
          </button>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && result && (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          {/* Main Result */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-8 text-center shadow-2xl shadow-emerald-900/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <p className="text-emerald-100 font-medium mb-2 relative z-10 uppercase tracking-wide text-xs">Daily Target</p>
            <h2 className="text-6xl font-bold text-white mb-2 relative z-10 tracking-tighter">{result.target}</h2>
            <p className="text-emerald-200 text-sm font-medium relative z-10">Calories / Day</p>
          </div>

          {/* Macro Split */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Apple className="w-5 h-5 text-emerald-500" />
                Recommended Macros
            </h3>
            <div className="grid grid-cols-3 gap-3">
                <MacroCard label="Protein" value={result.macros.protein + 'g'} color="bg-blue-500" />
                <MacroCard label="Carbs" value={result.macros.carbs + 'g'} color="bg-yellow-500" />
                <MacroCard label="Fats" value={result.macros.fats + 'g'} color="bg-rose-500" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-3">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Basal Metabolic Rate (BMR)</span>
                <span className="font-bold text-white">{result.bmr} kcal</span>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Maintenance Calories (TDEE)</span>
                <span className="font-bold text-white">{result.tdee} kcal</span>
            </div>
          </div>

          {/* NEW: Save Button */}
          <button
            onClick={handleSaveAndTrack}
            className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl active:scale-95 transition-transform shadow-lg flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Save & Start Tracking
          </button>

          <button
            onClick={reset}
            className="w-full flex items-center justify-center space-x-2 bg-zinc-900 text-white font-medium py-4 rounded-2xl border border-zinc-800 active:scale-95 transition-transform hover:bg-zinc-800"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Recalculate</span>
          </button>
        </div>
      )}
    </div>
  );
};

const InputGroup = ({ label, name, value, onChange, placeholder, suffix }) => (
  <div className="space-y-2">
    <label className="text-sm text-zinc-400 ml-1 font-medium">{label}</label>
    <div className="relative">
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">{suffix}</span>
    </div>
  </div>
);

const MacroCard = ({ label, value, color }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
        <span className="text-xl font-bold text-white mb-1">{value}</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
);

// Helper component for icons
const CheckCircle = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default CalorieCalculator;
