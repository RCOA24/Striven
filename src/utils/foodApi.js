// utils/foodApi.js

// --- 1. Fetch Nutrition from OpenFoodFacts ---
export async function fetchNutrition(query) {
  try {
    // Clean up label (e.g., "hot_dog" -> "hot dog")
    const cleanQuery = query.replace(/_/g, ' ').trim();
    
    // API Call: sort_by=popularity gets the most common food item (avoids obscure results)
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=6&sort_by=popularity`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.products || data.products.length === 0) return null;

    // Filter: Find the first product that actually has calorie data
    const product = data.products.find(p => 
      p.nutriments && 
      (p.nutriments['energy-kcal_100g'] > 0 || p.nutriments.energy_value > 0)
    ) || data.products[0];

    // Extract values
    const calories = product.nutriments?.['energy-kcal_100g'] || product.nutriments?.energy_value || 0;
    
    // Guard clause: If calories are 0, return null (unless it's water)
    if (calories === 0 && !cleanQuery.toLowerCase().includes('water')) return null;

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

// --- 2. Analyze Image (Direct to Hugging Face Router) ---
export async function analyzeImageWithHuggingFace(imageBlob) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  // We list both models. The code will try them in order.
  const MODELS = [
    "Kaludi/food-category-classification-v2.0", // Great for general food categories
    "nateraw/food"                              // Backup model
  ];

  for (const model of MODELS) {
    try {
      console.log(`Analyzing with ${model}...`);
      
      // OPTIMIZATION: Use the 'router' subdomain for better routing & stability
      const apiUrl = `https://router.huggingface.co/hf-inference/models/${model}`;

      const response = await fetch(apiUrl, {
        headers: { 
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "image/jpeg", // We send binary data, not JSON
          "x-use-cache": "false"        // Request fresh inference
        },
        method: "POST",
        body: imageBlob, 
      });

      // --- Handle "Model Loading" (503 Error) ---
      // This happens if the model is "cold". We wait and retry automatically.
      if (response.status === 503) {
        const errorData = await response.json();
        const waitTime = errorData.estimated_time || 5;
        console.log(`Model loading... waiting ${waitTime.toFixed(1)}s`);
        
        await new Promise(r => setTimeout(r, waitTime * 1000));
        
        // Retry the request
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
      console.warn(`Model ${model} failed:`, err.message);
      // If Kaludi fails, loop continues to nateraw
    }
  }

  throw new Error("Could not identify food. Try moving closer.");
}

// --- 3. Process AI Results ---
async function processResult(result) {
  // HuggingFace returns an array: [{ label: "hamburger", score: 0.98 }, ...]
  if (Array.isArray(result) && result.length > 0) {
    const topResult = result[0];
    
    // Confidence Threshold (20%)
    if (topResult.score < 0.20) throw new Error("Confidence too low");

    // Get Nutrition Data
    const nutrition = await fetchNutrition(topResult.label);
    const readableName = topResult.label.replace(/_/g, ' '); // "hot_dog" -> "hot dog"

    if (nutrition) {
      return { ...nutrition, confidence: topResult.score, isUnknown: false };
    } else {
      // Recognized the food visually, but OpenFoodFacts didn't have data
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