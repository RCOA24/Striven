// utils/foodApi.js

// ==========================================
// 1. HELPER: OPEN FOOD FACTS (Fallback Database)
// ==========================================
async function fetchNutritionFromOFF(query) {
  try {
    const cleanQuery = query.replace(/_/g, ' ').trim().toLowerCase();
    const fields = "product_name,nutriments";
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=3&fields=${fields}&sort_by=popularity`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.products || data.products.length === 0) return null;

    // Find first product with valid calories
    const product = data.products.find(p => 
      p.nutriments && (p.nutriments['energy-kcal_100g'] > 0 || p.nutriments.energy_value > 0)
    ) || data.products[0];

    return {
      name: cleanQuery,
      calories: Math.round(product.nutriments?.['energy-kcal_100g'] || product.nutriments?.energy_value || 0),
      protein: Math.round(product.nutriments?.proteins_100g || 0),
      carbs: Math.round(product.nutriments?.carbohydrates_100g || 0),
      fat: Math.round(product.nutriments?.fat_100g || 0),
    };
  } catch (e) {
    console.warn("OFF API Error", e);
    return null;
  }
}

// ==========================================
// 2. PRIMARY: GOOGLE GEMINI (Robust Version)
// ==========================================
async function analyzeWithGemini(imageBlob) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Missing Google API Key");

  const base64Data = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(imageBlob);
  });

  const promptText = `
    Identify this food. Return ONLY a JSON object. Do not include markdown formatting.
    
    If it is NOT food, return: {"isUnknown": true}
    If it is food, return:
    {
      "name": "Food Name",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "confidence": 0.95,
      "isUnknown": false
    }
    
    Rules:
    1. Look specifically for Filipino/Asian dishes (e.g., "Sinigang", "Adobo", "Sisig") if applicable.
    2. Estimate nutrition for 1 serving.
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

  if (!response.ok) throw new Error("Gemini API Error");

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  // ROBUST PARSING: Extract strictly the JSON part to prevent crashes
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid JSON from Gemini");
  
  const result = JSON.parse(jsonMatch[0]);
  
  if (result.isUnknown) throw new Error("Gemini could not identify food");
  
  return { ...result, confidence: 0.98 }; 
}

// ==========================================
// 3. FALLBACK: HUGGING FACE
// ==========================================
async function analyzeWithHuggingFace(imageBlob) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing HF API Key");

  const MODEL = "nateraw/food"; 
  const apiUrl = `https://router.huggingface.co/hf-inference/models/${MODEL}`;

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "image/jpeg" },
    method: "POST",
    body: imageBlob, 
  });

  if (response.status === 503) {
    const errorData = await response.json();
    const waitTime = errorData.estimated_time || 2;
    await new Promise(r => setTimeout(r, waitTime * 1000));
    return analyzeWithHuggingFace(imageBlob); 
  }

  const result = await response.json();
  
  if (Array.isArray(result) && result.length > 0) {
    const top = result[0];
    if (top.score < 0.15) throw new Error("HF Confidence Low");

    const nutrition = await fetchNutritionFromOFF(top.label);
    const readableName = top.label.replace(/_/g, ' ');

    if (nutrition && nutrition.calories > 0) {
      return { ...nutrition, confidence: top.score, isUnknown: false };
    }
    
    // If OFF fails, return just the name and 0 cals
    return { name: readableName, calories: 0, protein: 0, carbs: 0, fat: 0, confidence: top.score, isUnknown: true };
  }
  
  throw new Error("HF Analysis failed");
}

// ==========================================
// 4. MAIN EXPORT
// ==========================================
export async function analyzeFood(imageBlob) {
  try {
    // Attempt 1: Gemini
    return await analyzeWithGemini(imageBlob);
  } catch (geminiError) {
    console.warn("Gemini failed, switching to Hugging Face...", geminiError);
    try {
      // Attempt 2: Hugging Face + OpenFoodFacts
      return await analyzeWithHuggingFace(imageBlob);
    } catch (hfError) {
      console.error("All AI models failed");
      throw new Error("Could not identify food. Please try again.");
    }
  }
}