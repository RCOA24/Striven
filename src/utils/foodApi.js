// utils/foodApi.js

// ==========================================
// 1. PRIMARY: GOOGLE GEMINI (The "Global Food Expert")
// ==========================================
async function analyzeWithGemini(imageBlob, modelName = "gemini-1.5-flash") {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Missing Google API Key");

  // Convert Blob to Base64
  const base64Data = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(imageBlob);
  });

  const promptText = `
    Act as a world-renowned nutritionist and food critic. Analyze the image and identify the food.
    
    Rules:
    1. Look specifically for regional dishes (e.g., "Sinigang", "Adobo", "Sisig", "Ramen") rather than generic terms.
    2. Estimate nutrition for a standard serving size (approx 1 serving).
    3. Return STRICT JSON (no markdown) with these keys: 
       name (string), calories (int), protein (int), carbs (int), fat (int), isUnknown (boolean).
    4. If the image is unclear, make your best educated guess.
    5. If it is absolutely not food, set isUnknown: true.
  `;

  const requestBody = {
    contents: [{
      parts: [
        { text: promptText },
        { inline_data: { mime_type: "image/jpeg", data: base64Data } }
      ]
    }]
  };

  // Dynamic URL based on the model passed in
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) throw new Error(`Gemini ${modelName} Error`);

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  
  // Clean up code blocks if Gemini returns markdown
  const jsonString = text.replace(/```json|```/g, '').trim();
  
  try {
    const result = JSON.parse(jsonString);
    
    // Safety check: if it found a name but flagged as unknown, correct it
    if (result.name && result.name !== "Unknown" && result.isUnknown) {
        result.isUnknown = false;
    }
    
    return { ...result, confidence: 0.98 }; 
  } catch (e) {
    throw new Error("AI parsing error");
  }
}

// ==========================================
// 2. MAIN EXPORT (THE LOGIC CONTROLLER)
// ==========================================
export async function analyzeFood(imageBlob) {
  // CONFIG: Define your models here
  const MODEL_FAST = "gemini-1.5-flash"; // Fast, cheap, high rate limit
  const MODEL_SMART = "gemini-1.5-pro";  // Slower, smarter, lower rate limit
  
  // STEP 1: Try the Fast Model (Flash)
  try {
    console.log(`Attempting analysis with ${MODEL_FAST}...`);
    const result = await analyzeWithGemini(imageBlob, MODEL_FAST);

    // If Flash is confident and knows the food, return immediately
    if (!result.isUnknown) {
      return result;
    }
    
    console.warn("Flash model returned 'Unknown'. Escalating to Pro model...");
  } catch (flashError) {
    console.warn("Flash model failed or errored. Escalating to Pro model...", flashError);
  }

  // STEP 2: Try the Smart Model (Pro)
  // We only reach here if Flash said "Unknown" OR crashed
  try {
    console.log(`Attempting analysis with ${MODEL_SMART}...`);
    const result = await analyzeWithGemini(imageBlob, MODEL_SMART);
    
    return result; 

  } catch (proError) {
    console.error("All AI models failed", proError);
    throw new Error("Could not identify food. Please try again or enter manually.");
  }
}