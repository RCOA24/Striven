export async function fetchNutrition(query) {
  try {
    // Clean up query (remove 'raw', 'fresh', etc. to get better matches)
    const cleanQuery = query.split(',')[0].trim();
    
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=1`);
    const data = await res.json();
    const p = data.products?.[0];
    if (!p) return null;
    
    return {
      name: p.product_name || cleanQuery,
      calories: Math.round(p.nutriments?.energy_kcal || 0),
      protein: Math.round(p.nutriments?.proteins || 0),
      carbs: Math.round(p.nutriments?.carbohydrates || 0),
      fat: Math.round(p.nutriments?.fat || 0),
    };
  } catch (e) {
    return null;
  }
}

export async function analyzeImageWithHuggingFace(base64Image) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    throw new Error("Missing Hugging Face API Key");
  }

  try {
    // Convert Base64 to Blob for Hugging Face API
    const base64Response = await fetch(base64Image);
    const blob = await base64Response.blob();

    // Use a specific food classification model (Vision Transformer fine-tuned on Food-101)
    const response = await fetch(
      "https://api-inference.huggingface.co/models/nateraw/food",
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        method: "POST",
        body: blob,
      }
    );

    const result = await response.json();
    
    // Hugging Face returns an array of predictions: [{ label: "fried_chicken", score: 0.9 }, ...]
    if (Array.isArray(result) && result.length > 0) {
      const topPrediction = result[0];
      // Clean label (e.g. "fried_chicken" -> "fried chicken")
      const foodName = topPrediction.label.replace(/_/g, ' ');
      
      // Get nutrition data for the identified food
      const nutrition = await fetchNutrition(foodName);
      
      if (nutrition) {
        return nutrition;
      }
      
      // Fallback if we identified the food but couldn't find nutrition
      return {
        name: foodName,
        calories: 0, protein: 0, carbs: 0, fat: 0,
        isUnknown: true
      };
    }
    
    return null;
  } catch (error) {
    console.error("Hugging Face Error:", error);
    return null;
  }
}
