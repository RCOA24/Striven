// utils/foodApi.js

// --- 1. Fetch Nutrition from OpenFoodFacts ---
export async function fetchNutrition(query) {
  try {
    const cleanQuery = query.replace(/_/g, ' ').trim();
    
    // API Call: sort_by=popularity gets the most common food item
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=6&sort_by=popularity`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.products || data.products.length === 0) return null;

    // Filter: Find the first product that actually has calorie data
    const product = data.products.find(p => 
      p.nutriments && 
      (p.nutriments['energy-kcal_100g'] > 0 || p.nutriments.energy_value > 0)
    ) || data.products[0];

    const calories = product.nutriments?.['energy-kcal_100g'] || product.nutriments?.energy_value || 0;
    
    // Ignore results with 0 calories unless it's water/diet soda
    const isZeroCalDrink = ['water', 'diet', 'zero'].some(term => cleanQuery.toLowerCase().includes(term));
    if (calories === 0 && !isZeroCalDrink) return null;

    return {
      name: cleanQuery,
      calories: Math.round(calories),
      protein: Math.round(product.nutriments?.proteins_100g || 0),
      carbs: Math.round(product.nutriments?.carbohydrates_100g || 0),
      fat: Math.round(product.nutriments?.fat_100g || 0),
    };
  } catch (e) {
    console.error("Nutrition API Error:", e);
    return null;
  }
}

// --- 2. Analyze Image (Nateraw Only) ---
export async function analyzeImageWithHuggingFace(imageBlob) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  // We are strictly using nateraw/food now as it is reliable on the Inference API
  const MODEL = "nateraw/food"; 
  const apiUrl = `https://router.huggingface.co/hf-inference/models/${MODEL}`;

  try {
    console.log(`Analyzing with ${MODEL}...`);

    const response = await fetch(apiUrl, {
      headers: { 
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "image/jpeg", // Optimized for binary upload
        "x-use-cache": "false"
      },
      method: "POST",
      body: imageBlob, 
    });

    // --- Handle "Model Loading" (503 Error) ---
    if (response.status === 503) {
      const errorData = await response.json();
      const waitTime = errorData.estimated_time || 5;
      console.log(`Model loading... waiting ${waitTime.toFixed(1)}s`);
      
      await new Promise(r => setTimeout(r, waitTime * 1000));
      
      // Retry
      const retryResponse = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "image/jpeg" },
        method: "POST",
        body: imageBlob,
      });
      
      if (retryResponse.ok) return processResult(await retryResponse.json());
    }

    if (!response.ok) {
      throw new Error(`HF Status ${response.status}`);
    }

    const result = await response.json();
    return await processResult(result);

  } catch (err) {
    console.error(`Analysis failed:`, err.message);
    throw err;
  }
}

// --- 3. Process AI Results ---
async function processResult(result) {
  if (Array.isArray(result) && result.length > 0) {
    const topResult = result[0];
    
    // LOWERED THRESHOLD: Changed from 0.20 to 0.15 to be more forgiving
    if (topResult.score < 0.15) throw new Error("Confidence too low");

    // Fetch Nutrition
    const readableName = topResult.label.replace(/_/g, ' '); 
    const nutrition = await fetchNutrition(topResult.label);

    if (nutrition) {
      return { ...nutrition, confidence: topResult.score, isUnknown: false };
    } else {
      return { 
        name: readableName, 
        calories: 0, protein: 0, carbs: 0, fat: 0, 
        confidence: topResult.score, 
        isUnknown: true 
      };
    }
  }
  throw new Error("Invalid response from AI");
}