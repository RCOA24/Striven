// utils/foodApi.js

// ==========================================
// 1. HELPER: OPEN FOOD FACTS (Fallback Database)
// ==========================================
async function fetchNutritionFromOFF(query) {
  try {
    const cleanQuery = query.replace(/_/g, ' ').trim().toLowerCase();
    const fields = "product_name,nutriments";
    // sort_by=popularity helps find the "general" version of the food
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=3&fields=${fields}&sort_by=popularity`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.products || data.products.length === 0) return null;

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
    return null;
  }
}

// ==========================================
// 2. PRIMARY: GOOGLE GEMINI (The "Global Food Expert")
// ==========================================
async function analyzeWithGemini(imageBlob) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Missing Google API Key");

  // Convert Blob to Base64
  const base64Data = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(imageBlob);
  });

  // --- THE SECRET SAUCE: BETTER PROMPTING ---
  // We explicitly tell it to look for international and specific regional dishes.
  const promptText = `
    Act as a world-renowned nutritionist and food critic with expertise in Asian, Filipino, Western, and International cuisines. 
    Analyze the image and identify the food.
    
    Rules:
    1. Look specifically for regional dishes (e.g., "Sinigang", "Adobo", "Sisig", "Ramen", "Paella") rather than generic terms like "Stew" or "Rice".
    2. Estimate nutrition for a standard serving size (approx 1 serving).
    3. Return STRICT JSON (no markdown) with these keys: 
       name (string), calories (int), protein (int), carbs (int), fat (int), isUnknown (boolean).
    4. If the image is unclear, make your best educated guess based on visible ingredients. Do not give up easily.
    5. If it is absolutely not food (like a shoe or a car), set isUnknown: true.
  `;

  const requestBody = {
    contents: [{
      parts: [
        { text: promptText },
        { inline_data: { mime_type: "image/jpeg", data: base64Data } }
      ]
    }]
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) throw new Error("Gemini Error");

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  
  // Clean Markdown
  const jsonString = text.replace(/```json|```/g, '').trim();
  
  try {
    const result = JSON.parse(jsonString);
    // If Gemini returns "Unknown" but gave a name, force it to be known
    if (result.name && result.name !== "Unknown" && result.isUnknown) {
        result.isUnknown = false;
    }
    return { ...result, confidence: 0.98 }; 
  } catch (e) {
    console.error("Failed to parse Gemini JSON", text);
    throw new Error("AI parsing error");
  }
}

// ==========================================
// 3. FALLBACK: HUGGING FACE (Good for generic foods)
// ==========================================
async function analyzeWithHuggingFace(imageBlob) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing HF API Key");

  // NOTE: 'nateraw/food' is trained on Western Food-101. 
  // It is BAD at Filipino/Asian food. We only use this if Google fails.
  const MODEL = "nateraw/food"; 
  const apiUrl = `https://router.huggingface.co/hf-inference/models/${MODEL}`;

  const response = await fetch(apiUrl, {
    headers: { 
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "image/jpeg",
    },
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
    // Lower threshold heavily because nateraw is bad at international food
    if (top.score < 0.10) throw new Error("HF Confidence Low");

    const nutrition = await fetchNutritionFromOFF(top.label);
    const readableName = top.label.replace(/_/g, ' ');

    if (nutrition && nutrition.calories > 0) {
      return { ...nutrition, confidence: top.score, isUnknown: false };
    }
    
    return { name: readableName, calories: 0, protein: 0, carbs: 0, fat: 0, confidence: top.score, isUnknown: true };
  }
  
  throw new Error("HF Analysis failed");
}

// ==========================================
// 4. MAIN EXPORT
// ==========================================
export async function analyzeFood(imageBlob) {
  try {
    // 1. Try Google Gemini (Smartest for International Food)
    return await analyzeWithGemini(imageBlob);
  } catch (geminiError) {
    console.warn("Gemini failed, switching to Hugging Face...", geminiError);
    
    try {
      // 2. Fallback to Hugging Face (Dumb but reliable backup)
      return await analyzeWithHuggingFace(imageBlob);
    } catch (hfError) {
      console.error("All AI models failed");
      throw new Error("Could not identify food. Please try again.");
    }
  }
}