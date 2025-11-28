// utils/foodApi.js

export async function analyzeFood(imageBlob) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) throw new Error("API Key missing in environment variables");

  // 1. Convert Blob to Base64
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(imageBlob);
  });

  // 2. The Prompt - Optimized for strict JSON
  const promptText = `
    Identify this food. Return ONLY a JSON object. Do not include markdown formatting (like \`\`\`json).
    
    If it is NOT food, return: {"isFood": false}
    If it is food, return:
    {
      "isFood": true,
      "name": "Short food name",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "confidence": 0.95
    }
    
    Rules:
    - Estimate calories for 1 standard serving.
    - Round numbers to integers.
    - If unsure of exact dish, guess the closest generic dish.
  `;

  // 3. Call Gemini 1.5 Flash (Fast & Cheap)
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) throw new Error("No data received from AI");

    // 4. CLEANUP: Extract ONLY the JSON part (Fixes the crashing)
    // This Regex finds the first '{' and the last '}'
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        throw new Error("AI response was not valid JSON");
    }

    const result = JSON.parse(jsonMatch[0]);

    // 5. Validation
    if (!result.isFood) {
        throw new Error("Not recognized as food");
    }

    return {
        name: result.name || "Unknown Food",
        calories: result.calories || 0,
        protein: result.protein || 0,
        carbs: result.carbs || 0,
        fat: result.fat || 0,
        confidence: result.confidence || 0.8,
        isUnknown: false
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Return a safe fallback object to prevent UI crashing
    throw error; // Re-throw to let UI handle the error message
  }
}