import React, { useState } from 'react';
import { X, Search, Loader2, Plus, Edit3 } from 'lucide-react';
import { fetchNutritionFromOFF } from '../../utils/foodApi';

const ManualFoodEntry = ({ isOpen, onClose, onSave }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  
  // Form state for manual entry
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    sugar: '',
    fiber: '',
    sodium: ''
  });

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setSearchResults([]);
    setSelectedFood(null);
    
    try {
      const result = await fetchNutritionFromOFF(searchQuery, searchQuery, null);
      if (result) {
        setSearchResults([result]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setFormData({
      name: food.name || food.display_name || '',
      calories: food.calories || '',
      protein: food.protein || '',
      carbs: food.carbs || '',
      fat: food.fat || '',
      sugar: food.sugar || '',
      fiber: food.fiber || '',
      sodium: food.sodium || ''
    });
  };

  const handleManualEntry = () => {
    setManualMode(true);
    setSelectedFood(null);
    setSearchResults([]);
    setFormData({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      sugar: '',
      fiber: '',
      sodium: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.calories) {
      return;
    }

    const foodData = {
      name: formData.name.trim(),
      calories: parseFloat(formData.calories) || 0,
      protein: parseFloat(formData.protein) || 0,
      carbs: parseFloat(formData.carbs) || 0,
      fat: parseFloat(formData.fat) || 0,
      sugar: parseFloat(formData.sugar) || 0,
      fiber: parseFloat(formData.fiber) || 0,
      sodium: parseFloat(formData.sodium) || 0,
      confidence: 1.0,
      verified: true
    };

    onSave(foodData);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFood(null);
    setManualMode(false);
    setFormData({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      sugar: '',
      fiber: '',
      sodium: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-zinc-900 w-full max-w-lg rounded-3xl flex flex-col shadow-2xl border border-white/10 max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Add Food Manually</h2>
          <button onClick={handleClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Search Section */}
          {!manualMode && !selectedFood && (
            <>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search food database..."
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white active:scale-95 transition-all"
                >
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((food, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectFood(food)}
                      className="bg-zinc-800 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-emerald-500 transition-colors"
                    >
                      <div className="font-semibold text-white mb-2">{food.name}</div>
                      <div className="grid grid-cols-4 gap-2 text-xs text-zinc-400">
                        <div><span className="text-white font-bold">{food.calories}</span> kcal</div>
                        <div><span className="text-white font-bold">{food.protein}g</span> protein</div>
                        <div><span className="text-white font-bold">{food.carbs}g</span> carbs</div>
                        <div><span className="text-white font-bold">{food.fat}g</span> fat</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searching && (
                <div className="text-center py-6 text-zinc-500">
                  <p className="mb-3">No results found</p>
                  <button
                    onClick={handleManualEntry}
                    className="text-emerald-500 font-bold hover:text-emerald-400 transition-colors"
                  >
                    Enter manually instead
                  </button>
                </div>
              )}

              {/* Manual Entry Button */}
              <button
                onClick={handleManualEntry}
                className="w-full py-3 bg-zinc-800 border border-white/10 rounded-xl text-white font-bold hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Enter Nutrition Manually
              </button>
            </>
          )}

          {/* Manual Entry Form */}
          {(manualMode || selectedFood) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {selectedFood ? 'Edit & Save' : 'Manual Entry'}
                </h3>
                <button
                  onClick={() => {
                    setManualMode(false);
                    setSelectedFood(null);
                    setFormData({
                      name: '',
                      calories: '',
                      protein: '',
                      carbs: '',
                      fat: '',
                      sugar: '',
                      fiber: '',
                      sodium: ''
                    });
                  }}
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Back to search
                </button>
              </div>

              {/* Food Name */}
              <div>
                <label className="block text-xs text-zinc-400 mb-2 font-medium">Food Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Chicken Adobo"
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Macros Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-2 font-medium">Calories (kcal) *</label>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => handleInputChange('calories', e.target.value)}
                    placeholder="250"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-2 font-medium">Protein (g)</label>
                  <input
                    type="number"
                    value={formData.protein}
                    onChange={(e) => handleInputChange('protein', e.target.value)}
                    placeholder="20"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-2 font-medium">Carbs (g)</label>
                  <input
                    type="number"
                    value={formData.carbs}
                    onChange={(e) => handleInputChange('carbs', e.target.value)}
                    placeholder="30"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-2 font-medium">Fat (g)</label>
                  <input
                    type="number"
                    value={formData.fat}
                    onChange={(e) => handleInputChange('fat', e.target.value)}
                    placeholder="10"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <details className="group">
                <summary className="text-xs text-zinc-500 hover:text-white cursor-pointer font-medium uppercase tracking-wider">
                  Optional Details
                </summary>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2 font-medium">Sugar (g)</label>
                    <input
                      type="number"
                      value={formData.sugar}
                      onChange={(e) => handleInputChange('sugar', e.target.value)}
                      placeholder="5"
                      className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2 font-medium">Fiber (g)</label>
                    <input
                      type="number"
                      value={formData.fiber}
                      onChange={(e) => handleInputChange('fiber', e.target.value)}
                      placeholder="3"
                      className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-zinc-400 mb-2 font-medium">Sodium (mg)</label>
                    <input
                      type="number"
                      value={formData.sodium}
                      onChange={(e) => handleInputChange('sodium', e.target.value)}
                      placeholder="150"
                      className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </details>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!formData.name.trim() || !formData.calories}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-5 h-5" />
                Add to Food Log
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualFoodEntry;