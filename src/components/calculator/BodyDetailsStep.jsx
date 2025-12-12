import React from 'react';
import { Calendar, Check, Ruler, Weight } from 'lucide-react';

const BodyDetailsStep = ({ formData, onChange, onNext, hasExistingProfile, onResume, onRecalculate, validationError }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold font-apple mb-2">Tell us about yourself</h2>
        <p className="text-zinc-400 text-sm">We need this to calculate your metabolic rate.</p>
      </div>

      {validationError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {validationError}
        </div>
      )}

      {hasExistingProfile && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span>A saved plan was found.</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onResume}
                className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-bold text-xs active:scale-95"
              >
                Resume
              </button>
              <button
                onClick={onRecalculate}
                className="px-3 py-1 rounded-lg bg-black/30 border border-white/20 text-white font-medium text-xs active:scale-95"
              >
                Recalculate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gender Selection */}
      <div className="grid grid-cols-2 gap-4">
        {['male', 'female'].map((g) => (
          <button
            key={g}
            onClick={() => onChange({ target: { name: 'gender', value: g } })}
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
            <div className="p-1.5 bg-orange-500/20 rounded-md">
              <Calendar className="w-4 h-4 text-orange-500" />
            </div>
            <span className="font-medium">Age</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={onChange}
              placeholder="0"
              className="ios-input"
            />
            <span className="text-zinc-500 text-sm">years</span>
          </div>
        </div>

        <div className="ios-input-row">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-500/20 rounded-md">
              <Ruler className="w-4 h-4 text-blue-500" />
            </div>
            <span className="font-medium">Height</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={onChange}
              placeholder="0"
              className="ios-input"
            />
            <span className="text-zinc-500 text-sm">cm</span>
          </div>
        </div>

        <div className="ios-input-row">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-purple-500/20 rounded-md">
              <Weight className="w-4 h-4 text-purple-500" />
            </div>
            <span className="font-medium">Weight</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={onChange}
              placeholder="0"
              className="ios-input"
            />
            <span className="text-zinc-500 text-sm">kg</span>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!formData.age || !formData.height || !formData.weight}
        className="w-full bg-emerald-500 text-black font-bold text-lg py-4 rounded-2xl mt-8 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
      >
        Continue
      </button>
    </div>
  );
};

export default BodyDetailsStep;
