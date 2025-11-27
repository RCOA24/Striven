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

    // Switch to BLIP (Image Captioning) for better accuracy on general foods
    // The previous model (nateraw/food) was limited to specific dishes (Food-101 dataset)
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        method: "POST",
        body: blob,
      }
    );

    const result = await response.json();
    
    // BLIP returns: [{ generated_text: "a close up of a fried egg" }]
    if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
      let description = result[0].generated_text.toLowerCase();
      
      // Clean up common prefixes to get to the food name
      const prefixes = ["a close up of ", "a plate of ", "a view of ", "an image of ", "a picture of "];
      for (const prefix of prefixes) {
        if (description.startsWith(prefix)) {
          description = description.slice(prefix.length);
        }
      }
      
      // Further cleanup: remove "on a white plate", "with a fork", etc.
      description = description.split(' on ')[0];
      description = description.split(' with ')[0];
      description = description.trim();

      console.log("AI Identified:", description);

      // Get nutrition data for the identified food
      const nutrition = await fetchNutrition(description);
      
      if (nutrition) {
        return nutrition;
      }
      
      // Fallback
      return {
        name: description,
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
