// utils/foodApi.js

// 1. Fetch Nutrition (Optimized Search)
export async function fetchNutrition(query) {
  try {
    // Clean up label (e.g., "hot_dog" -> "hot dog")
    const cleanQuery = query.replace(/_/g, ' ').trim();
    
    // Search OpenFoodFacts
    // sort_by=popularity helps get the generic version of the food
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=5&sort_by=popularity`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.products || data.products.length === 0) return null;

    // Filter: Find first product that actually has calorie data
    const product = data.products.find(p => 
      p.nutriments && 
      (p.nutriments['energy-kcal_100g'] > 0 || p.nutriments.energy_value > 0)
    ) || data.products[0];

    // normalize values
    const calories = product.nutriments?.['energy-kcal_100g'] || product.nutriments?.energy_value || 0;
    
    // If calories are 0, it's likely a bad match or water, return null to force "Unknown" state or handle gracefully
    if (calories === 0 && cleanQuery.toLowerCase() !== 'water') return null;

    return {
      name: cleanQuery,
      calories: Math.round(calories),
      protein: Math.round(product.nutriments?.proteins_100g || 0),
      carbs: Math.round(product.nutriments?.carbohydrates_100g || 0),
      fat: Math.round(product.nutriments?.fat_100g || 0),
    };
  } catch (e) {
    console.error("Nutrition fetch error:", e);
    return null;
  }
}

// 2. Analyze Image (Accepts Blob directly for speed)
export async function analyzeImageWithHuggingFace(imageBlob) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  // Segformer is often faster/more accurate for food, but ViT is standard.
  // We stick to the models you had, they are good.
  const MODELS = [
    "nateraw/food", 
    "Kaludi/food-category-classification-v2.0"
  ];

  for (const model of MODELS) {
    try {
      // Ensure your Vite proxy is set up for /api/hf -> https://api-inference.huggingface.co
      const proxyUrl = `/api/hf/models/${model}`;

      const response = await fetch(proxyUrl, {
        headers: { 
          Authorization: `Bearer ${apiKey}`,
          // Don't set Content-Type manually when sending Blob/File usually, 
          // but for HF inference raw body, 'image/jpeg' or 'application/octet-stream' is okay.
          "Content-Type": "image/jpeg" 
        },
        method: "POST",
        body: imageBlob,
      });

      // Handle Model Loading (Cold Boot)
      if (response.status === 503) {
        const errorData = await response.json();
        const waitTime = errorData.estimated_time || 5;
        console.warn(`Model ${model} loading... waiting ${waitTime}s`);
        
        await new Promise(r => setTimeout(r, waitTime * 1000));
        
        // Retry once
        const retryResponse = await fetch(proxyUrl, {
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "image/jpeg" },
          method: "POST",
          body: imageBlob,
        });
        
        if (retryResponse.ok) return processResult(await retryResponse.json());
      }

      if (!response.ok) throw new Error(`HF Status ${response.status}`);

      const result = await response.json();
      return await processResult(result);

    } catch (err) {
      console.warn(`Model ${model} failed, trying next...`, err.message);
    }
  }

  throw new Error("Could not recognize food. Please try again.");
}

async function processResult(result) {
  if (Array.isArray(result) && result.length > 0) {
    const topResult = result[0];
    
    // Threshold: If AI is less than 20% sure, don't guess.
    if (topResult.score < 0.20) throw new Error("Image unclear");

    const nutrition = await fetchNutrition(topResult.label);
    
    // Clean Label
    const readableName = topResult.label.replace(/_/g, ' ');

    if (nutrition) {
      return { ...nutrition, confidence: topResult.score, isUnknown: false };
    } else {
      // recognized the object, but no nutrition info found
      return { 
        name: readableName, 
        calories: 0, protein: 0, carbs: 0, fat: 0, 
        confidence: topResult.score, 
        isUnknown: true 
      };
    }
  }
  throw new Error("Invalid AI response");
}