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
// NOW accepts a specific model name!
async function analyzeWithGemini(imageBlob, modelName = "gemini-1.5-flash") {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Missing Google API Key");

  // Convert Blob to Base64
  const base64Data = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(imageBlob);
  });

  const promptText = `
    Act as a world-renowned nutritionist and food critic. Analyze the image and identify the food.
    
    Rules:
    1. Look specifically for regional dishes (e.g., "Sinigang", "Adobo", "Sisig", "Ramen") rather than generic terms.
    2. Estimate nutrition for a standard serving size (approx 1 serving).
    3. Return STRICT JSON (no markdown) with these keys: 
       name (string), calories (int), protein (int), carbs (int), fat (int), isUnknown (boolean).
    4. If the image is unclear, make your best educated guess.
    5. If it is absolutely not food, set isUnknown: true.
  `;

  const requestBody = {
    contents: [{
      parts: [
        { text: promptText },
        { inline_data: { mime_type: "image/jpeg", data: base64Data } }
      ]
    }]
  };

  // Dynamic URL based on the model passed in
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) throw new Error(`Gemini ${modelName} Error`);

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  
  const jsonString = text.replace(/```json|```/g, '').trim();
  
  try {
    const result = JSON.parse(jsonString);
    if (result.name && result.name !== "Unknown" && result.isUnknown) {
        result.isUnknown = false;
    }
    return { ...result, confidence: 0.98 }; 
  } catch (e) {
    throw new Error("AI parsing error");
  }
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
// 4. MAIN EXPORT (THE LOGIC CONTROLLER)
// ==========================================
export async function analyzeFood(imageBlob) {
  // CONFIG: Define your models here
  const MODEL_FAST = "gemini-1.5-flash"; // 1,500 requests/day
  const MODEL_SMART = "gemini-1.5-pro";  // 50 requests/day (Use sparingly!)
  
  // STEP 1: Try the Fast Model (Flash)
  try {
    console.log(`Attempting analysis with ${MODEL_FAST}...`);
    const result = await analyzeWithGemini(imageBlob, MODEL_FAST);

    // If Flash is confident, return immediately!
    if (!result.isUnknown) {
      return result;
    }
    
    console.warn("Flash model returned 'Unknown'. Escalating to Pro model...");
  } catch (flashError) {
    console.warn("Flash model failed or errored. Escalating to Pro model...", flashError);
  }

  // STEP 2: Try the Smart Model (Pro)
  // We only reach here if Flash said "Unknown" OR crashed
  try {
    console.log(`Attempting analysis with ${MODEL_SMART}...`);
    const result = await analyzeWithGemini(imageBlob, MODEL_SMART);
    
    // Return whatever Pro says (even if unknown, it's our best bet)
    return result; 

  } catch (proError) {
    console.warn("Gemini Pro failed. Switching to Hugging Face fallback...", proError);
    
    // STEP 3: Fallback to Hugging Face
    try {
      return await analyzeWithHuggingFace(imageBlob);
    } catch (hfError) {
      console.error("All AI models failed");
      throw new Error("Could not identify food. Please try again.");
    }
  }
}