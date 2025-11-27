// utils/foodApi.js

/**
 * 1. Compress Image
 * Resizes image to 384x384 (native resolution for Vision Transformers).
 * This prevents timeouts and makes uploads instant.
 */
async function compressImage(base64Str) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 384; 
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio while resizing
      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob (approx 15-30KB)
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.7);
    };
  });
}

/**
 * 2. Fetch Nutrition from OpenFoodFacts
 */
export async function fetchNutrition(query) {
  try {
    // Clean up label (e.g., "hot_dog" -> "hot dog")
    const cleanQuery = query.replace(/_/g, ' ').trim();
    
    // Sort by unique scans to get the most popular product (avoids obscure 0-cal entries)
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=5&sort_by=unique_scans_n`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.products || data.products.length === 0) return null;

    // Find the first product that actually has calorie data
    const product = data.products.find(p => 
      p.nutriments && (p.nutriments['energy-kcal_100g'] > 0 || p.nutriments.energy_value > 0)
    ) || data.products[0];

    // Default to 100g serving size values
    const cals = product.nutriments?.['energy-kcal_100g'] || product.nutriments?.energy_value || 0;

    return {
      name: cleanQuery,
      calories: Math.round(cals),
      protein: Math.round(product.nutriments?.proteins_100g || 0),
      carbs: Math.round(product.nutriments?.carbohydrates_100g || 0),
      fat: Math.round(product.nutriments?.fat_100g || 0),
    };
  } catch (e) {
    console.warn("Nutrition lookup failed:", e);
    return null;
  }
}

/**
 * 3. Analyze Image with Retry & Fallback Logic
 */
export async function analyzeImageWithHuggingFace(base64Image) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing Hugging Face API Key");

  // LIST OF MODELS TO TRY (In order of preference)
  // If 'nateraw' is sleeping/erroring, it will try 'Kaludi', etc.
  const MODELS = [
    "nateraw/food",                             // Best Accuracy (Vision Transformer)
    "Kaludi/food-category-classification-v2.0", // Good Backup
    "dima806/food_type_image_detection_new"     // The one from your list
  ];

  const imageBlob = await compressImage(base64Image);

  // Loop through models until one works
  for (const model of MODELS) {
    try {
      console.log(`Trying model: ${model}...`);
      
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          method: "POST",
          body: imageBlob,
        }
      );

      // Handle "Model Loading" (503) by waiting once
      if (response.status === 503) {
        const errorData = await response.json();
        const waitTime = errorData.estimated_time || 5;
        console.log(`Model ${model} is loading. Waiting ${waitTime}s...`);
        await new Promise(r => setTimeout(r, waitTime * 1000));
        
        // Retry the same model once after waiting
        const retryResponse = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          { headers: { Authorization: `Bearer ${apiKey}` }, method: "POST", body: imageBlob }
        );
        if (retryResponse.ok) {
           return processResult(await retryResponse.json());
        }
      }

      if (!response.ok) {
        // If 404/500/CORS, throw to move to next model
        throw new Error(`Model ${model} failed with status ${response.status}`);
      }

      const result = await response.json();
      return await processResult(result);

    } catch (err) {
      console.warn(`Failed with ${model}:`, err.message);
      // Continue loop to next model...
    }
  }

  throw new Error("All AI models failed. Please check connection or API key.");
}

// Helper to process AI response
async function processResult(result) {
  // Classification format: [{ label: "pizza", score: 0.9 }]
  if (Array.isArray(result) && result.length > 0) {
    const topResult = result[0];
    const confidence = topResult.score;

    console.log("AI Match:", topResult.label, Math.round(confidence * 100) + "%");

    if (confidence < 0.25) {
      throw new Error("Subject unclear");
    }

    const nutrition = await fetchNutrition(topResult.label);
    if (nutrition) {
      return { ...nutrition, confidence };
    }

    // Fallback if nutrition not found
    return {
      name: topResult.label.replace(/_/g, ' '),
      calories: 0, protein: 0, carbs: 0, fat: 0,
      isUnknown: true
    };
  }
  
  throw new Error("Invalid AI response format");
}