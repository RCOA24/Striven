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
async function fetchNutritionFromOFF(query, onStatus) {
  try {
    if (onStatus) onStatus(`Searching database for "${query}"...`);
    
    // Clean query more aggressively
    const cleanQuery = query.replace(/_/g, ' ').replace(/[^\w\s]/gi, '').trim().toLowerCase();
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
      name: cleanQuery, // Keep the AI's detected name for display
      calories: Math.round(product.nutriments?.['energy-kcal_100g'] || product.nutriments?.energy_value || 0),
      protein: Math.round(product.nutriments?.proteins_100g || 0),
      carbs: Math.round(product.nutriments?.carbohydrates_100g || 0),
      fat: Math.round(product.nutriments?.fat_100g || 0),
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

  // 2. Improved Prompt Engineering
  const promptText = `
    Analyze this food image professionally. 
    1. Identify the dish based on visual texture, ingredients, and plating.
    2. Context: Prioritize Filipino/Asian cuisine if applicable.
    3. Estimation: Estimate nutritional values for ONE standard serving size (e.g., 1 cup or 1 bowl).
    
    Return ONLY a raw JSON object (no markdown formatting).
    
    If it is NOT food, return: {"isUnknown": true}
    
    If it IS food, return:
    { 
      "name": "Food Name (e.g. Sinigang na Baboy)", 
      "calories": 0, 
      "protein": 0, 
      "carbs": 0, 
      "fat": 0, 
      "confidence": 0.95, 
      "isUnknown": false 
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
  
  if (result.isUnknown) throw new Error("Gemini could not identify food");
  
  return { ...result, confidence: 0.98 }; 
}

// ==========================================
// 3. FALLBACK: HUGGING FACE
// ==========================================
async function analyzeWithHuggingFace(imageBlob, onStatus) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing HF API Key");

  if (onStatus) onStatus("Connecting to Vision Model...");

  // Use processed image here too
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

    const nutrition = await fetchNutritionFromOFF(top.label, onStatus);
    const readableName = top.label.replace(/_/g, ' ');

    if (nutrition && nutrition.calories > 0) {
      return { ...nutrition, confidence: top.score, isUnknown: false };
    }
    
    // If OFF fails, return basic info so user can manually edit
    return { name: readableName, calories: 0, protein: 0, carbs: 0, fat: 0, confidence: top.score, isUnknown: true };
  }
  
  throw new Error("HF Analysis failed");
}

// ==========================================
// 4. MAIN EXPORT
// ==========================================
export async function analyzeFood(imageBlob, onStatus) {
  try {
    // Attempt 1: Gemini (Best Quality)
    return await analyzeWithGemini(imageBlob, onStatus);
  } catch (geminiError) {
    console.warn("Gemini failed, switching to Hugging Face...", geminiError);
    
    if (onStatus) onStatus("Gemini unsure. Trying backup AI...");
    
    try {
      // Attempt 2: Hugging Face + OpenFoodFacts
      return await analyzeWithHuggingFace(imageBlob, onStatus);
    } catch (hfError) {
      console.error("All AI models failed");
      // Return a gentle error state instead of crashing
      throw new Error("Could not identify food. Try getting closer or better lighting.");
    }
  }
}