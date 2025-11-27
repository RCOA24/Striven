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

export async function analyzeImageWithGPT(base64Image) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("Missing OpenAI API Key");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // Changed from gpt-4o-mini to gpt-4o for better accuracy
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Identify the main food dish in this image. Return ONLY a JSON object with these keys: name (string), calories (number), protein (number), carbs (number), fat (number). Estimate for a standard serving size. If not food, return { isUnknown: true, name: 'Unknown' }." 
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI Error:", error);
    return null;
  }
}
