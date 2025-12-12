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

      // Calculate new dimensions (Max 1024px)
      const MAX_SIZE = 1024;
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
      }, 'image/jpeg', 0.85); // 85% quality is the sweet spot for AI
    };
    
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

// ==========================================
// 1. HELPER: OPEN FOOD FACTS (Fallback Database)
// ==========================================
async function fetchNutritionFromOFF(searchTerm, displayName, onStatus) {
  try {
    if (onStatus) onStatus(`Searching database for "${displayName}"...`);
    
    // Clean query more aggressively
    const cleanQuery = searchTerm.replace(/_/g, ' ').replace(/[^\w\s]/gi, '').trim().toLowerCase();
    const fields = "product_name,nutriments";
    
    // Try exact search first
    let url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=5&fields=${fields}&sort_by=popularity`;

    let res = await fetch(url);
    let data = await res.json();

    // If no results, try a looser search (splitting words)
    if (!data.products || data.products.length === 0) {
      const firstWord = cleanQuery.split(' ')[0];
      if (firstWord && firstWord.length > 3) {
        url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(firstWord)}&search_simple=1&action=process&json=1&page_size=5&fields=${fields}&sort_by=popularity`;
        res = await fetch(url);
        data = await res.json();
      }
    }

    if (!data.products || data.products.length === 0) return null;

    // Filter for products that actually have calorie data
    const product = data.products.find(p => 
      p.nutriments && (p.nutriments['energy-kcal_100g'] > 0 || p.nutriments.energy_value > 0)
    ) || data.products[0];

    return {
      display_name: displayName,
      search_term: searchTerm,
      calories: Math.round(product.nutriments?.['energy-kcal_100g'] || product.nutriments?.energy_value || 0),
      protein: Math.round(product.nutriments?.proteins_100g || 0),
      carbs: Math.round(product.nutriments?.carbohydrates_100g || 0),
      fat: Math.round(product.nutriments?.fat_100g || 0),
      verified: true
    };
  } catch (e) {
    console.warn("OFF API Error:", e);
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

  // 2. Filipino Nutritionist Expert Prompt (Dual-Naming Strategy)
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
    
    Return ONLY a raw JSON object (no markdown).
    
    If NOT food: {"is_food": false}
    
    If IS food:
    {
      "is_food": true,
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  // Clean markdown code blocks if Gemini adds them (```json ... ```)
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  
  const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid JSON from Gemini");
  
  const result = JSON.parse(jsonMatch[0]);
  
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

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "image/jpeg" },
    method: "POST",
    body: processedBlob,
  });

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
    .filter(det => (det.score || 0) >= 0.2)
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

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "image/jpeg" },
    method: "POST",
    body: processedBlob,
  });

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
      return { ...nutrition, confidence: top.score, isUnknown: false };
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
export async function analyzeFood(imageBlob, onStatus) {
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
        confidence: avgConfidence || 0.9,
        isUnknown: geminiResult.items.some(i => !i.verified),
        source: 'Gemini (Filipino Expert) + OpenFoodFacts'
      };
    }
  } catch (geminiError) {
    console.warn('Gemini Filipino analysis failed, trying detection fallback...', geminiError);
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
      confidence: item.confidence || 0.7,
      isUnknown: !item.verified,
      source: 'HF Classifier + OFF'
    };
  } catch (hfError) {
    console.error('All AI models failed');
    throw new Error('Could not identify food. Try a clearer angle or better lighting.');
  }
}