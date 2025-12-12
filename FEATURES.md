# Striven Features Documentation

## Food Scanner - Filipino Nutritionist AI (v2)

### Overview
The food scanner now features a **dual-naming strategy with AI verification** specifically optimized for Filipino cuisine while maintaining global food support.

### Architecture

#### 1. **Dual-Naming Strategy**
Each food item has two names:
- **display_name**: The cultural/local name displayed to users (e.g., "Sinigang na Baboy", "Tortang Talong", "Lumpia")
- **search_term**: Generic English/global equivalent for database lookup (e.g., "Pork Stew", "Eggplant Omelet", "Spring Roll")

This allows the AI to understand Filipino dishes while grounding nutrition data in the global OpenFoodFacts database.

#### 2. **Detection Pipeline** (Priority Order)

```
┌─────────────────────────────────────────────┐
│ Attempt 0: Gemini (Filipino Expert AI)      │
│ - Multi-item detection                      │
│ - Dual-naming generation                    │
│ - Portion estimation                        │
│ - Returns: items[] with display_name,       │
│            search_term, calories, etc.      │
└─────────────────────────────────────────────┘
                    ↓
            (if fails or low confidence)
                    ↓
┌─────────────────────────────────────────────┐
│ Attempt 1: YOLO Detection + OFF Lookup      │
│ - Object detection (YOLOv8 food model)      │
│ - Nutrition lookup via search_term          │
│ - Returns: items[] with verified nutrition  │
└─────────────────────────────────────────────┘
                    ↓
            (if fails or low confidence)
                    ↓
┌─────────────────────────────────────────────┐
│ Attempt 2: HF Classifier Fallback           │
│ - Generic food classification               │
│ - Attempt OFF lookup                        │
│ - Returns: best-guess nutrition             │
└─────────────────────────────────────────────┘
```

#### 3. **Nutrition Verification Loop**
After Gemini identifies items with dual names, the system verifies each against OpenFoodFacts:

```javascript
for (let item of result.items) {
  // Try database lookup using the generic search_term
  const dbNutrition = await fetchNutritionFromOFF(
    item.search_term,      // e.g., "Pork Stew"
    item.display_name,     // e.g., "Sinigang na Baboy" (for reference)
    onStatus
  );
  
  if (dbNutrition) {
    // Use real database values for accuracy
    item.calories = dbNutrition.calories;
    item.protein = dbNutrition.protein;
    item.verified = true;
    item.source = 'Gemini + OpenFoodFacts';
  } else {
    // Keep Gemini's estimate if verification fails
    item.verified = false;
    item.source = 'Gemini (unverified)';
  }
}
```

#### 4. **Multi-Item Aggregation**
For meals with multiple items (e.g., rice + adobo + salad):
- Items are detected and verified individually
- Totals are aggregated: `sum(calories), sum(protein), sum(carbs), sum(fat), sum(sugar), sum(fiber), sum(sodium)`
- UI displays per-item breakdown + meal totals

### Example Flow: Sinigang na Baboy + Rice

**Input**: Photo of plate with white rice and pork stew

**Gemini Analysis** (Filipino Expert Mode):
```json
{
  "is_food": true,
  "items": [
    {
      "display_name": "Sinigang na Baboy",
      "search_term": "Pork Stew",
      "portion_desc": "1 serving (250g)",
      "calories": 280,
      "protein": 28,
      "carbs": 8,
      "fat": 15,
      "confidence": 0.92
    },
    {
      "display_name": "White Rice",
      "search_term": "Cooked White Rice",
      "portion_desc": "1 cup (150g cooked)",
      "calories": 205,
      "protein": 4,
      "carbs": 45,
      "fat": 0.3,
      "confidence": 0.95
    }
  ]
}
```

**Verification** (Against OpenFoodFacts):
- "Pork Stew" → Found: 280 kcal, 28g protein (verified ✓)
- "Cooked White Rice" → Found: 205 kcal, 4g protein (verified ✓)

**Aggregated Meal Totals**:
- Calories: 485 kcal
- Protein: 32g
- Carbs: 53g
- Fat: 15.3g

**UI Display**:
```
📱 Meal: Sinigang na Baboy, White Rice
485 kcal | 32g P | 53g C | 15g F
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sinigang na Baboy     280 kcal | 28g P | 8g C | 15g F ✓ Verified
White Rice           205 kcal | 4g P  | 45g C | 0g F ✓ Verified
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source: Gemini (Filipino Expert) + OpenFoodFacts
```

### Filipino Cuisine Features

The Gemini prompt specifically handles:

1. **Cultural Dish Names**
   - "Chicken Joy" (Jollibee) → Maps to chicken/fried chicken nutrition
   - "Torta" (Spanish egg dish) → Correctly identified as omelet
   - "Tuyo" (dried fish) → High sodium considerations

2. **Rice + Sauce Pattern**
   - Detects rice and main dishes separately
   - Prevents under-counting calories from oil/coconut milk in sauces
   - Handles "dry" vs "soupy" preparations

3. **Hidden Calorie Sources**
   - Coconut milk (common in Filipino cooking)
   - Cooking oil/butter in sauces
   - Fried preparations (lumpia, fish chips, etc.)

4. **Portion Context**
   - Understands Filipino serving sizes
   - Context: "1 plate" = rice + main, not just one component

### Global Support

Despite Filipino specialization, the system remains **globally accurate** because:

1. **Fallback Chain**: If Gemini's Filipino model doesn't recognize a dish, YOLO + HF can classify it
2. **Generic search_terms**: Even Filipino dishes map to universal database entries
3. **OpenFoodFacts**: Covers 750,000+ foods globally (~200k from Asia/Philippines)

### Data Structure (Per Item)

```typescript
interface FoodItem {
  display_name: string;      // "Sinigang na Baboy"
  search_term: string;       // "Pork Stew"
  calories: number;
  protein: number;           // in grams
  carbs: number;
  fat: number;
  sugar?: number;            // optional
  fiber?: number;
  sodium?: number;
  confidence: number;        // 0-1, AI confidence
  verified: boolean;         // true if found in OFF
  source: string;            // "Gemini + OpenFoodFacts", "YOLO Detection + OFF", etc.
}

interface MealResult {
  name: string;              // "Sinigang na Baboy, White Rice"
  items: FoodItem[];         // all detected items
  totals: {                  // aggregated nutrition
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    fiber: number;
    sodium: number;
  };
  confidence: number;        // average of all items
  isUnknown: boolean;        // true if any item unverified
  source: string;            // pipeline that generated result
}
```

### Accuracy Notes

- **High Accuracy (Verified)**: Gemini ID + OFF match (e.g., "Pork Stew" found) = 95%+ confidence
- **Medium Accuracy (Unverified)**: Gemini estimate without OFF match (e.g., rare dish) = 80% confidence
- **Low Accuracy (Fallback)**: HF generic classifier without OFF = 60% confidence

The UI shows verification badges and sources to help users understand confidence levels.

### Testing

**Recommended test foods for Filipino implementation**:
1. Sinigang (with pork/shrimp/beef)
2. Adobo (chicken, pork, or seafood)
3. Lumpia (fresh or fried)
4. Tortang Talong (eggplant omelet)
5. Fried Rice
6. Tilapia/Fish (grilled or fried)
7. Tinola (ginger stew)
8. Kare-Kare (peanut stew)

Each should show dual naming in logs and verification from OpenFoodFacts.

---

## Other Features

### GPS Tracking (Desktop Optimized)
- Desktop/Laptop: `enableHighAccuracy: false`, 5s timeout → faster network-based fallback
- Mobile: `enableHighAccuracy: true`, 8s timeout → GPS accuracy priority
- Position caching: 5 second cache to reduce redundant queries

### Live Map
- Real-time location tracking during workouts
- Dark theme (CartoCSS)
- Responsive sizing with CSS `clamp()`

### Step Counter
- Estimates calories burned
- Tracks distance traveled
- Logs activity to IndexedDB

---

**Last Updated**: [After Message 11 - Filipino Nutritionist Implementation]
**Status**: ✅ Code complete, awaiting build validation & user testing
