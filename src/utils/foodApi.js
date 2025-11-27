// utils/foodApi.js

// --- Performance Optimization: Simple In-Memory Cache ---
// Stores previous nutrition results to avoid re-fetching the same food twice.
const nutritionCache = new Map();

// --- 1. Fetch Nutrition (Optimized) ---
export async function fetchNutrition(query) {
  // 1. Check Cache first
  const cleanQuery = query.replace(/_/g, ' ').trim().toLowerCase();
  if (nutritionCache.has(cleanQuery)) {
    return nutritionCache.get(cleanQuery);
  }

  try {
    // 2. Optimize API Call:
    // - fields=... : Only fetch product name and nutrients (saves bandwidth)
    // - page_size=1 : We only check the first result anyway (saves server processing)
    // - country=world : Ensures broader matching
    const fields = "product_name,nutriments";
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=1&fields=${fields}&sort_by=popularity`;
    
    // Set a timeout of 4 seconds to prevent hanging if OFF is slow
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await res.json();
    
    // Default fallback object
    let result = {
      name: cleanQuery,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    if (data.products && data.products.length > 0) {
      const product = data.products[0]; // Take the first popular match
      
      const calories = product.nutriments?.['energy-kcal_100g'] || product.nutriments?.energy_value || 0;
      
      // Update result if we found valid data
      if (calories > 0 || ['water', 'coffee', 'tea'].some(s => cleanQuery.includes(s))) {
        result = {
          name: cleanQuery, // Use AI label as name for consistency
          calories: Math.round(calories),
          protein: Math.round(product.nutriments?.proteins_100g || 0),
          carbs: Math.round(product.nutriments?.carbohydrates_100g || 0),
          fat: Math.round(product.nutriments?.fat_100g || 0),
        };
      }
    }

    // 3. Save to Cache
    nutritionCache.set(cleanQuery, result);
    return result;

  } catch (e) {
    console.warn("Nutrition API slow/failed, returning basic label:", e);
    // Fallback: Return the name with 0 calories so the UI shows *something* instead of error
    return { name: cleanQuery, calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
}

// --- 2. Analyze Image (Nateraw Only) ---
export async function analyzeImageWithHuggingFace(imageBlob) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  const MODEL = "nateraw/food"; 
  const apiUrl = `https://router.huggingface.co/hf-inference/models/${MODEL}`;

  try {
    const response = await fetch(apiUrl, {
      headers: { 
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "image/jpeg",
        "x-use-cache": "true" // ENABLE CACHE: Hugging Face caches common image hashes
      },
      method: "POST",
      body: imageBlob, 
    });

    // --- Handle "Model Loading" (503 Error) ---
    if (response.status === 503) {
      const errorData = await response.json();
      const waitTime = errorData.estimated_time || 3; // Default to shorter wait
      console.log(`Model warming up... ${waitTime}s`);
      
      await new Promise(r => setTimeout(r, waitTime * 1000));
      
      // Retry
      const retryResponse = await fetch(apiUrl, {
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
    console.error(`Analysis failed:`, err.message);
    throw err;
  }
}

// --- 3. Process AI Results ---
async function processResult(result) {
  if (Array.isArray(result) && result.length > 0) {
    const topResult = result[0];
    
    // PERFORMANCE FIX: Lower threshold to 10% (0.10)
    // Even if AI is unsure, it's better to show a guess than an error.
    if (topResult.score < 0.10) {
      // Last ditch effort: If top 2 results are very close (e.g. 0.09 and 0.08), 
      // it might just be confused between similar foods. Take the top one anyway.
      if (result[1] && (topResult.score - result[1].score) < 0.05) {
         // proceed cautiously
      } else {
         throw new Error("Confidence too low");
      }
    }

    const readableName = topResult.label.replace(/_/g, ' '); 
    
    // Parallelize? No, we need name first. But fetchNutrition is now faster.
    const nutrition = await fetchNutrition(topResult.label);

    if (nutrition) {
      return { ...nutrition, confidence: topResult.score, isUnknown: false };
    } 
    
    // Fallback if nutrition fails completely (should cover most cases now due to cache/mock)
    return { 
      name: readableName, 
      calories: 0, protein: 0, carbs: 0, fat: 0, 
      confidence: topResult.score, 
      isUnknown: true 
    };
  }
  throw new Error("Invalid response from AI");
}