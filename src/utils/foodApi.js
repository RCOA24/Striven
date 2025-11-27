// utils/foodApi.js

// Helper to resize image before sending to API (Drastically improves speed)
async function compressImage(base64Str, maxWidth = 512) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob directly for the API
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8); // 80% quality jpeg
    };
  });
}

export async function fetchNutrition(query) {
  try {
    // 1. Clean the query (Food-101 returns 'french_fries', we need 'french fries')
    const cleanQuery = query.replace(/_/g, ' ').trim();
    
    // 2. Search OpenFoodFacts
    // We request specific fields and sort by popularity (scan_count) to find the most common version of that food
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=5&sort_by=unique_scans_n`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.products || data.products.length === 0) return null;

    // 3. Find the best match that actually has nutrition data
    // Sometimes the top result is a placeholder with 0 calories
    const product = data.products.find(p => 
      p.nutriments && 
      (p.nutriments.energy_kcal > 0 || p.nutriments.energy_value > 0)
    ) || data.products[0];

    const cals = product.nutriments?.energy_kcal || product.nutriments?.energy_value || 0;

    return {
      name: cleanQuery,
      // Default to standard serving size approximation if per 100g is all we have
      // Visual estimation usually implies a serving of ~200-300g for a meal, but let's stick to 100g standard or scaled
      calories: Math.round(cals), 
      protein: Math.round(product.nutriments?.proteins || 0),
      carbs: Math.round(product.nutriments?.carbohydrates || 0),
      fat: Math.round(product.nutriments?.fat || 0),
      image: product.image_url // Optional: store the official product image if needed
    };
  } catch (e) {
    console.error("Nutrition Fetch Error:", e);
    return null;
  }
}

export async function analyzeImageWithHuggingFace(base64Image) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing Hugging Face API Key");

  try {
    // 1. Compress Image (Huge performance boost)
    const imageBlob = await compressImage(base64Image);

    // 2. Use a Vision Transformer fine-tuned on Food-101
    // This model is much better at identifying specific dishes than BLIP
    const MODEL_ID = "dima806/food-101-resnet50"; 
    // Alternative if that one is down: "nateraw/food"

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL_ID}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        method: "POST",
        body: imageBlob,
      }
    );

    if (!response.ok) {
      throw new Error(`HF API Error: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Classification models return an array: [{ label: "pizza", score: 0.98 }, ...]
    if (Array.isArray(result) && result.length > 0) {
      const topResult = result[0];
      const foodName = topResult.label;
      const confidence = topResult.score;

      console.log(`AI Identified: ${foodName} (${(confidence * 100).toFixed(1)}%)`);

      // Only accept if confidence is decent (e.g., > 30%)
      // If it's too low, it might be looking at a wall or table
      if (confidence < 0.3) {
        throw new Error("Could not clearly identify food.");
      }

      // 3. Get Nutrition
      const nutrition = await fetchNutrition(foodName);
      
      if (nutrition) {
        return { ...nutrition, confidence };
      }
      
      return {
        name: foodName.replace(/_/g, ' '),
        calories: 0, protein: 0, carbs: 0, fat: 0,
        isUnknown: true
      };
    }
    
    return null;
  } catch (error) {
    console.error("Hugging Face Error:", error);
    throw error; // Re-throw to be caught by UI
  }
}