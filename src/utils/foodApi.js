// utils/foodApi.js

// ==========================================
// 0. HELPER: IMAGE PROCESSING (The "Quality" Booster)
// ==========================================
/**
 * Resizes and compresses image to be AI-friendly.
 * Large images (4MB+) cause timeouts. Tiny images lose detail.
 * Target: Max 1024px width/height, JPEG 0.8 quality.
 */
async function processImageForAI(imageBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Calculate new dimensions (Max 1536px for better AI accuracy)
      const MAX_SIZE = 1536;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      // Draw and export
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image processing failed"));
      }, 'image/jpeg', 0.90); // 90% quality for better AI accuracy
    };
    
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

// ==========================================
// 1. HELPER: OPEN FOOD FACTS (Fallback Database)
// ==========================================
// Generic fetch with retry and exponential backoff for quota friendliness
async function fetchWithRetry(url, options = {}, cfg = {}) {
  const {
    retries = 3,
    backoffBase = 300, // ms
    backoffMax = 2000, // ms
    retryOn = [429, 503],
  } = cfg;

  let attempt = 0;
  while (true) {
    const res = await fetch(url, options);
    if (!retryOn.includes(res.status) || attempt >= retries) {
      return res;
    }
    // Exponential backoff with jitter
    const delay = Math.min(backoffMax, backoffBase * Math.pow(2, attempt)) + Math.floor(Math.random() * 100);
    await new Promise(r => setTimeout(r, delay));
    attempt += 1;
  }
}
// Common foods fallback for when OFF fails
const COMMON_FOODS = {
  "chicken wings": { calories: 203, protein: 20, carbs: 0, fat: 13, sugar: 0, fiber: 0, sodium: 80 },
  "rice": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, sugar: 0.1, fiber: 0.4, sodium: 1 },
  "fried chicken": { calories: 246, protein: 30, carbs: 12, fat: 12, sugar: 0, fiber: 0, sodium: 80 },
  "apple": { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, sugar: 10, fiber: 2.4, sodium: 1 },
  "banana": { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, sugar: 12, fiber: 2.6, sodium: 1 },
  "egg": { calories: 155, protein: 13, carbs: 1.1, fat: 11, sugar: 1.1, fiber: 0, sodium: 124 },
};

async function fetchNutritionFromOFF(searchTerm, displayName, onStatus) {
  try {
    if (onStatus) onStatus(`Searching database for "${displayName}"...`);
    
    // Clean query more aggressively
    const cleanQuery = searchTerm.replace(/_/g, ' ').replace(/[^\w\s]/gi, '').trim().toLowerCase();
    const fields = "product_name,nutriments";
    
    const hasCalories = (p) => p.nutriments && (p.nutriments['energy-kcal_100g'] > 0 || p.nutriments.energy_value > 0);

    // 1. Try exact search
    let url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=10&fields=${fields}&sort_by=popularity`;

    await rateLimiter.wait();
    let res = await fetchWithRetry(url, undefined, { retries: 2, backoffBase: 300 });
    let data = await res.json();

    let product = data.products?.find(hasCalories);

    // 2. If no product with calories, try first word (if different and long enough)
    if (!product) {
      const firstWord = cleanQuery.split(' ')[0];
      if (firstWord && firstWord.length > 3 && firstWord !== cleanQuery) {
        url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(firstWord)}&search_simple=1&action=process&json=1&page_size=10&fields=${fields}&sort_by=popularity`;
        await rateLimiter.wait();
        res = await fetchWithRetry(url, undefined, { retries: 2, backoffBase: 300 });
        data = await res.json();
        product = data.products?.find(hasCalories);
      }
    }

    // 3. Fallback: Check hardcoded common foods
    if (!product && COMMON_FOODS[cleanQuery]) {
       return {
        name: displayName,
        display_name: displayName,
        search_term: searchTerm,
        ...COMMON_FOODS[cleanQuery],
        verified: true
      };
    }

    if (!product) return null;

    return {
      name: displayName,
      display_name: displayName,
      search_term: searchTerm,
      calories: Math.round(product.nutriments?.['energy-kcal_100g'] || product.nutriments?.energy_value || 0),
      protein: Math.round(product.nutriments?.proteins_100g || 0),
      carbs: Math.round(product.nutriments?.carbohydrates_100g || 0),
      fat: Math.round(product.nutriments?.fat_100g || 0),
      sugar: Math.round(product.nutriments?.sugars_100g || 0),
      fiber: Math.round(product.nutriments?.fiber_100g || 0),
      sodium: Math.round((product.nutriments?.sodium_100g || 0) * 1000), // Convert g to mg
      verified: true
    };
  } catch (e) {
    console.warn("OFF API Error:", e);
    // Final fallback check on error
    const cleanQuery = searchTerm.replace(/_/g, ' ').replace(/[^\w\s]/gi, '').trim().toLowerCase();
    if (COMMON_FOODS[cleanQuery]) {
        return {
            name: displayName,
            display_name: displayName,
            search_term: searchTerm,
            ...COMMON_FOODS[cleanQuery],
            verified: true
        };
    }
    return null;
  }
}

// ==========================================
// 2. PRIMARY: GOOGLE GEMINI (Optimized)
// ==========================================
async function analyzeWithGemini(imageBlob, onStatus) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Missing Google API Key");

  if (onStatus) onStatus("Optimizing image quality...");
  
  // 1. Process image first for better AI readability
  const processedBlob = await processImageForAI(imageBlob);

  if (onStatus) onStatus("Consulting Gemini AI...");

  const base64Data = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(processedBlob);
  });

  // 2. Filipino Nutritionist Expert Prompt (Dual-Naming Strategy + Summary)
  const promptText = `
    You are a Filipino Nutritionist AI Expert specializing in both Filipino and global cuisine.
    
    ANALYZE this food image and identify EACH DISTINCT ITEM visible. Pay special attention to:
    - Filipino dishes: Distinguish cultural specifics (e.g., "Chicken Joy" vs generic "Fried Chicken", "Sinigang" vs generic "Meat Stew")
    - Rice & Sauce: Filipino meals often combine white rice + sauce-heavy dishes (adobo, sinigang, etc.). Detect rice separately!
    - Hidden calories: Cooking oil/butter in sauces, coconut milk, fried preparations
    
    For EACH food item detected, return:
    - display_name: The culturally-specific or local name (e.g., "Tortang Talong", "Lumpia", "Tokwa't Baboy")
    - search_term: The English/generic equivalent for database lookup (e.g., "Eggplant Omelet", "Spring Roll", "Fried Tofu and Pork")
    - portion_desc: e.g., "1 plate (200g rice)", "1 serving"
    - calories, protein, carbs, fat: For ONE serving of this item
    
    Also include a brief paragraph field named "summary" explaining the meal in natural language for the user (e.g., describing a silog combination: rice + egg + meat), and highlight sodium and hidden fats if relevant.
    
    Return ONLY a raw JSON object (no markdown). Do NOT include any explanatory text, code fences, or additional commentary.
    
    If NOT food: {"is_food": false}
    
    If IS food:
    {
      "is_food": true,
      "summary": "Short descriptive overview of the meal",
      "items": [
        {
          "display_name": "Food Name (e.g. Sinigang na Baboy)",
          "search_term": "English/generic equivalent (e.g. Pork Stew)",
          "portion_desc": "1 bowl (300g)",
          "calories": 250,
          "protein": 20,
          "carbs": 15,
          "fat": 12,
          "confidence": 0.9
        }
      ]
    }
  `;

  await rateLimiter.wait();
  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }]
      })
    }
  );

  if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);

  if (onStatus) onStatus("Parsing AI results...");

  const data = await response.json();
  // Try multiple candidates for robustness
  const parts = data.candidates?.flatMap(c => c.content?.parts || []) || [];
  let rawText = "";
  for (const p of parts) {
    if (p.text && p.text.includes('{')) { rawText = p.text; break; }
  }
  if (!rawText && parts[0]?.text) rawText = parts[0].text;

  // Clean markdown/code fences and extract JSON block or array
  const clean = (rawText || "").replace(/```json|```/g, '').trim();
  let jsonStr = null;
  const objMatch = clean.match(/\{[\s\S]*\}/);
  const arrMatch = clean.match(/\[[\s\S]*\]/);
  if (objMatch) jsonStr = objMatch[0];
  else if (arrMatch) jsonStr = arrMatch[0];
  else throw new Error("Invalid JSON from Gemini");

  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch (e) {
    // Attempt to fix trailing commas or invalid quotes
    const fixed = jsonStr.replace(/,\s*([}\]])/g, '$1');
    result = JSON.parse(fixed);
  }
  
  if (!result.is_food) throw new Error("Gemini could not identify food");
  
  // Verify each item against OFF database using search_term (Dual-Naming Strategy)
  if (result.items && Array.isArray(result.items)) {
    for (let item of result.items) {
      const dbNutrition = await fetchNutritionFromOFF(item.search_term, item.display_name, onStatus);
      if (dbNutrition) {
        // Use database values for accuracy
        item.calories = dbNutrition.calories;
        item.protein = dbNutrition.protein;
        item.carbs = dbNutrition.carbs;
        item.fat = dbNutrition.fat;
        item.verified = true;
        item.source = 'Gemini + OpenFoodFacts';
      } else {
        // Keep Gemini's estimate if DB lookup fails
        item.verified = false;
        item.source = 'Gemini (unverified)';
      }
      // Small pacing delay between DB calls (quota friendly)
      await new Promise(r => setTimeout(r, 200));
    }
  }
  
  return result; 
}

// ==========================================
// 3. DETECTION: YOLO FOOD DETECTOR (keremberke/yolov8m-food-detection)
// ==========================================
async function detectFoodItems(imageBlob, onStatus) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing HF API Key");

  if (onStatus) onStatus("Scanning for individual items...");

  const processedBlob = await processImageForAI(imageBlob);
  const MODEL = "keremberke/yolov8m-food-detection";
  const apiUrl = `https://router.huggingface.co/hf-inference/models/${MODEL}`;

  await rateLimiter.wait();
  const response = await fetchWithRetry(apiUrl, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "image/jpeg" },
    method: "POST",
    body: processedBlob,
  }, { retries: 2, backoffBase: 300 });

  if (response.status === 503) {
    if (onStatus) onStatus("Model warming up...");
    const errorData = await response.json();
    const waitTime = errorData.estimated_time || 2;
    await new Promise(r => setTimeout(r, waitTime * 1000));
    return detectFoodItems(imageBlob, onStatus);
  }

  const detections = await response.json();
  if (!Array.isArray(detections)) throw new Error("YOLO detection failed");

  return detections
    .filter(det => (det.score || 0) >= 0.3)
    .map(det => ({
      label: det.label ? det.label.replace(/_/g, ' ') : 'Food item',
      score: det.score || 0,
      box: det.box || null,
    }));
}

// ==========================================
// 4. FALLBACK: HUGGING FACE (Classifier)
// ==========================================
async function analyzeWithHuggingFace(imageBlob, onStatus) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing HF API Key");

  if (onStatus) onStatus("Connecting to Vision Model...");

  const processedBlob = await processImageForAI(imageBlob);
  const MODEL = "nateraw/food"; 
  const apiUrl = `https://router.huggingface.co/hf-inference/models/${MODEL}`;

  await rateLimiter.wait();
  const response = await fetchWithRetry(apiUrl, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "image/jpeg" },
    method: "POST",
    body: processedBlob,
  }, { retries: 2, backoffBase: 300 });

  if (response.status === 503) {
    if (onStatus) onStatus("Model warming up...");
    const errorData = await response.json();
    const waitTime = errorData.estimated_time || 2;
    await new Promise(r => setTimeout(r, waitTime * 1000));
    return analyzeWithHuggingFace(imageBlob, onStatus);
  }

  const result = await response.json();
  
  if (Array.isArray(result) && result.length > 0) {
    const top = result[0];
    
    // Increased threshold slightly for quality
    if (top.score < 0.20) throw new Error("HF Confidence Low");

    const nutrition = await fetchNutritionFromOFF(top.label, top.label, onStatus);
    const readableName = top.label.replace(/_/g, ' ');

    if (nutrition && nutrition.calories > 0) {
      return { ...nutrition, name: readableName, confidence: top.score, isUnknown: false };
    }
    
    return { name: readableName, calories: 0, protein: 0, carbs: 0, fat: 0, confidence: top.score, isUnknown: true };
  }
  
  throw new Error("HF Analysis failed");
}

// ==========================================
// 4.1 AGGREGATION HELPERS
// ==========================================
function aggregateItems(items) {
  const totals = items.reduce((acc, item) => {
    acc.calories += item.calories || 0;
    acc.protein += item.protein || 0;
    acc.carbs += item.carbs || 0;
    acc.fat += item.fat || 0;
    acc.sugar += item.sugar || 0;
    acc.fiber += item.fiber || 0;
    acc.sodium += item.sodium || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0 });
  return totals;
}

// ==========================================
// 4. MAIN EXPORT
// ==========================================
export async function analyzeFood(imageBlob, onStatus, modeOverride) {
  const mode = (modeOverride || import.meta.env.VITE_FOOD_AI_MODE || 'hybrid').toLowerCase();
  try {
    // Attempt 0: Gemini with Filipino nutritionist expertise (Multi-Item + Dual-Naming)
    if (onStatus) onStatus("Analyzing with Filipino Nutritionist AI...");
    const geminiResult = await analyzeWithGemini(imageBlob, onStatus);
    
    if (geminiResult.is_food && geminiResult.items && geminiResult.items.length > 0) {
      const totals = aggregateItems(geminiResult.items);
      const avgConfidence = geminiResult.items.reduce((s, i) => s + (i.confidence || 0), 0) / geminiResult.items.length;

      return {
        name: geminiResult.items.map(i => i.display_name).join(', '),
        items: geminiResult.items,
        totals,
        summary: geminiResult.summary || undefined,
        confidence: avgConfidence || 0.9,
        isUnknown: geminiResult.items.some(i => !i.verified),
        source: 'Gemini (Filipino Expert) + OpenFoodFacts'
      };
    }
  } catch (geminiError) {
    console.warn('Gemini Filipino analysis failed, trying detection fallback...', geminiError);
  }

  // If configured to use Gemini only but items missing, attempt YOLO to avoid generic fallback
  if (mode === 'gemini') {
    try {
      const detections = await detectFoodItems(imageBlob, onStatus);
      if (detections.length > 0) {
        const items = [];
        for (const det of detections) {
          const nutrition = await fetchNutritionFromOFF(det.label, det.label, onStatus);
          items.push({
            display_name: det.label || 'Food item',
            search_term: det.label || 'Food item',
            calories: nutrition?.calories || 0,
            protein: nutrition?.protein || 0,
            carbs: nutrition?.carbs || 0,
            fat: nutrition?.fat || 0,
            sugar: nutrition?.sugar || 0,
            fiber: nutrition?.fiber || 0,
            sodium: nutrition?.sodium || 0,
            confidence: det.score || 0,
            verified: !!nutrition,
            source: 'YOLO Detection + OpenFoodFacts'
          });
        }
        return {
          name: items.map(i => i.display_name).join(', '),
          items,
          totals: aggregateItems(items),
          summary: undefined,
          confidence: items.reduce((s, i) => s + (i.confidence || 0), 0) / items.length,
          isUnknown: items.some(i => !i.verified),
          source: 'YOLO Detection + OpenFoodFacts'
        };
      }
    } catch {}
    throw new Error('Could not identify food clearly. Try a clearer photo or better lighting.');
  }

  try {
    // Attempt 1: Detection-first pipeline (YOLO + OFF)
    const detections = await detectFoodItems(imageBlob, onStatus);

    if (detections.length > 0) {
      if (onStatus) onStatus(`Detected ${detections.length} item${detections.length > 1 ? 's' : ''}. Classifying...`);

      const items = [];
      for (const det of detections) {
        const nutrition = await fetchNutritionFromOFF(det.label, det.label, onStatus);

        items.push({
          display_name: det.label || 'Food item',
          search_term: det.label || 'Food item',
          calories: nutrition?.calories || 0,
          protein: nutrition?.protein || 0,
          carbs: nutrition?.carbs || 0,
          fat: nutrition?.fat || 0,
          sugar: nutrition?.sugar || 0,
          fiber: nutrition?.fiber || 0,
          sodium: nutrition?.sodium || 0,
          confidence: det.score || 0,
          verified: !!nutrition,
          source: 'YOLO Detection + OpenFoodFacts'
        });
      }

      const totals = aggregateItems(items);
      const avgConfidence = items.reduce((s, i) => s + (i.confidence || 0), 0) / items.length;

      return {
        name: items.map(i => i.display_name).join(', '),
        items,
        totals,
        confidence: avgConfidence || 0.85,
        isUnknown: items.some(i => !i.verified),
        source: 'YOLO Detection + OpenFoodFacts'
      };
    }
  } catch (detectionError) {
    console.warn('Detection pipeline failed, trying HF fallback...', detectionError);
  }

  try {
    // Attempt 2: HF generic classifier fallback
    if (onStatus) onStatus('Using backup vision model...');
    const single = await analyzeWithHuggingFace(imageBlob, onStatus);
    
    // Wrap HF result in items array structure
    const item = {
      display_name: single.name || 'Food',
      search_term: single.name || 'Food',
      calories: single.calories || 0,
      protein: single.protein || 0,
      carbs: single.carbs || 0,
      fat: single.fat || 0,
      confidence: single.confidence || 0,
      verified: !!single.calories,
      source: 'HF Classifier + OFF'
    };
    
    return {
      name: item.display_name,
      items: [item],
      totals: aggregateItems([item]),
      summary: undefined,
      confidence: item.confidence || 0.7,
      isUnknown: !item.verified,
      source: 'HF Classifier + OFF'
    };
  } catch (hfError) {
    console.error('All AI models failed');
    throw new Error('Could not identify food. Try a clearer angle or better lighting.');
  }
}

// Simple rate limiter: max N requests per second
const rateLimiter = (() => {
  const windowMs = 1000;
  const maxPerWindow = 4;
  let timestamps = [];
  return {
    async wait() {
      const now = Date.now();
      // Drop old timestamps
      timestamps = timestamps.filter(t => now - t < windowMs);
      if (timestamps.length < maxPerWindow) {
        timestamps.push(now);
        return;
      }
      const earliest = timestamps[0];
      const waitMs = windowMs - (now - earliest);
      await new Promise(r => setTimeout(r, Math.max(50, waitMs)));
      // After wait, record
      timestamps.push(Date.now());
    }
  };
})();