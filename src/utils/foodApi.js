// utils/foodApi.js

// --- 1. Fetch Nutrition from OpenFoodFacts ---
export async function fetchNutrition(query) {
  try {
    // Clean up label (e.g., "hot_dog" -> "hot dog")
    const cleanQuery = query.replace(/_/g, ' ').trim();
    
    // API Call: Sort by popularity to avoid obscure variations
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
    
    // Guard clause: If calories are 0 and it's not water, it's likely a bad match.
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

// --- 2. Analyze Image with Hugging Face (Direct Router) ---
export async function analyzeImageWithHuggingFace(imageBlob) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  // We use the specific router URL for better stability
  const MODELS = [
    "nateraw/food", 
    "Kaludi/food-category-classification-v2.0"
  ];

  for (const model of MODELS) {
    try {
      console.log(`Analyzing with ${model}...`);
      
      // NEW ENDPOINT: router.huggingface.co
      const apiUrl = `https://router.huggingface.co/hf-inference/models/${model}`;

      // We send the Blob directly. No JSON.stringify needed for raw image uploads.
      const response = await fetch(apiUrl, {
        headers: { 
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "image/jpeg", // Explicitly set for binary upload
          "x-use-cache": "false"        // Optional: force fresh inference
        },
        method: "POST",
        body: imageBlob, 
      });

      // --- Handle Cold Boot (Model Loading 503) ---
      if (response.status === 503) {
        const errorData = await response.json();
        const waitTime = errorData.estimated_time || 5;
        console.log(`Model loading... waiting ${waitTime.toFixed(1)}s`);
        
        // Wait
        await new Promise(r => setTimeout(r, waitTime * 1000));
        
        // Retry exact same request
        const retryResponse = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "image/jpeg" },
          method: "POST",
          body: imageBlob,
        });
        
        if (retryResponse.ok) return processResult(await retryResponse.json());
      }

      if (!response.ok) {
        throw new Error(`HF API Error: ${response.status}`);
      }

      const result = await response.json();
      return await processResult(result);

    } catch (err) {
      console.warn(`Model ${model} failed:`, err.message);
      // Loop continues to next model...
    }
  }

  throw new Error("Could not identify food. Try moving closer or checking lighting.");
}

// --- 3. Process Logic ---
async function processResult(result) {
  // HuggingFace returns an array: [{ label: "pizza", score: 0.99 }, ...]
  if (Array.isArray(result) && result.length > 0) {
    const topResult = result[0];
    
    // Confidence Check (e.g. 20%)
    if (topResult.score < 0.20) throw new Error("Confidence too low");

    // Fetch Nutrition
    const nutrition = await fetchNutrition(topResult.label);
    const readableName = topResult.label.replace(/_/g, ' ');

    if (nutrition) {
      return { ...nutrition, confidence: topResult.score, isUnknown: false };
    } else {
      // Recognized visual, but no nutrition found
      return { 
        name: readableName, 
        calories: 0, protein: 0, carbs: 0, fat: 0, 
        confidence: topResult.score, 
        isUnknown: true 
      };
    }
  }
  throw new Error("Invalid response format from AI");
}