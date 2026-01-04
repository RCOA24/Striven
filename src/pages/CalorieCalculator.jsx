import React, { useState, useContext, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppContext } from '../App';
import { saveNutritionProfile, getNutritionProfile } from '../utils/db';
import BodyDetailsStep from '../components/calculator/BodyDetailsStep';
import LifestyleStep from '../components/calculator/LifestyleStep';
import ResultsStep from '../components/calculator/ResultsStep';
import useAiTips from '../hooks/useAiTips';

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
  
  // Use custom hook for AI tips
  const { generateTips, loading: aiLoading, tips: aiTips, setTips: setAiTips, error: aiError } = useAiTips();
  
  const [lastPayload, setLastPayload] = useState(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [validationError, setValidationError] = useState('');

  // On mount, attempt to resume an existing saved plan
  useEffect(() => {
    (async () => {
      try {
        const saved = await getNutritionProfile();
        if (saved) {
          setHasExistingProfile(true);
          // Prefill form from saved profile when available
          setFormData(prev => ({
            gender: saved.gender || prev.gender,
            age: saved.age || prev.age,
            height: saved.height || prev.height,
            weight: saved.weight || prev.weight,
            activity: saved.activity || prev.activity,
            goal: saved.goal || prev.goal
          }));
          const computed = {
            bmr: saved.bmr,
            tdee: saved.tdee,
            target: saved.targetCalories,
            water: saved.waterTarget,
            macros: {
              protein: saved.protein,
              fats: saved.fats,
              carbs: saved.carbs
            }
          };
          setResult(computed);
          setLastPayload({
            gender: saved.gender,
            age: saved.age,
            height: saved.height,
            weight: saved.weight,
            activity: saved.activity,
            goal: saved.goal,
            ...computed
          });
          setStep(3);
          if (saved.aiTips) setAiTips(saved.aiTips);
        }
      } catch {
        // ignore resume errors
      }
    })();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectActivity = (val) => {
    setFormData({ ...formData, activity: val });
  };

  const calculate = () => {
    const { gender, age, height, weight, activity, goal } = formData;
    if (!age || !height || !weight) {
      setValidationError('Please complete age, height, and weight.');
      setStep(1);
      return;
    }
    setValidationError('');

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
      water: waterTarget,
      macros: {
        protein: Math.round((targetCalories * 0.3) / 4),
        fats: Math.round((targetCalories * 0.25) / 9),
        carbs: Math.round((targetCalories * 0.45) / 4)
      }
    };
    setResult(computed);
    setLastPayload({ ...formData, ...computed });
    setStep(3);
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
        carbs: result.macros.carbs,
        aiTips: aiTips || '',
        inputPayload: lastPayload || null
    });
    
    setCurrentPage('food');
  };

  const reset = () => {
    setResult(null);
    setStep(1);
    setFormData({ gender: 'male', age: '', height: '', weight: '', activity: '1.2', goal: 'maintain' });
    setHasExistingProfile(false);
    setAiTips('');
    setValidationError('');
  };

  const handleActivitySelect = (val) => {
    setFormData({ ...formData, activity: val });
  };

  const handleGoalSelect = (goal) => {
    setFormData({ ...formData, goal });
  };

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
        {/* Step 1: Body Details */}
        {step === 1 && (
          <BodyDetailsStep 
            formData={formData}
            onChange={handleChange}
            onNext={() => setStep(2)}
            hasExistingProfile={hasExistingProfile}
            onResume={() => setStep(3)}
            onRecalculate={reset}
            validationError={validationError}
          />
        )}

        {/* Step 2: Lifestyle */}
        {step === 2 && (
          <LifestyleStep 
            formData={formData}
            onActivitySelect={handleActivitySelect}
            onGoalSelect={handleGoalSelect}
            onCalculate={calculate}
          />
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <ResultsStep 
            result={result}
            formData={formData}
            lastPayload={lastPayload}
            aiTips={aiTips}
            aiLoading={aiLoading}
            aiError={aiError}
            onRefreshTips={() => lastPayload && generateTips(lastPayload)}
            onSaveAndTrack={handleSaveAndTrack}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
};

export default CalorieCalculator;
