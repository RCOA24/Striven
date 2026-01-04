const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  // 1. CORS Handling
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    // 2. Securely use the API Key
    // Using VITE_GOOGLE_API_KEY to match your project's existing configuration
    const apiKey = process.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Server configuration error: API Key is missing");
    }

    // 3. Accept Data
    const body = JSON.parse(event.body);
    const { gender, age, height, weight, goal, activity, target, macros, water } = body;

    // 4. AI Integration (Gemini 2.5 Flash)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: "v1" });

    // 5. Prompt Engineering
    const prompt = `
      You are a concise fitness & nutrition coach. Provide 3 short, actionable bullet tips personalized for this user.
      
      User Profile:
      - Gender: ${gender || 'Not specified'}
      - Age: ${age || 'Not specified'}
      - Height: ${height || 'Not specified'}cm
      - Weight: ${weight || 'Not specified'}kg
      - Goal: ${goal || 'General health'}
      - Activity Level: ${activity || 'Not specified'}
      
      Daily Targets:
      - Calories: ${target || 'N/A'} kcal
      - Protein: ${macros?.protein || 'N/A'}g
      - Carbs: ${macros?.carbs || 'N/A'}g
      - Fats: ${macros?.fats || 'N/A'}g
      - Water: ${water || 'N/A'}ml

      Requirements:
      - Keep each bullet under 18 words.
      - Focus on: meal composition, hydration, and one habit to improve recovery.
      - Avoid generic advice.
      - Return ONLY the 3 bullet points as plain text, separated by newlines. Do not use markdown formatting like ** or -.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: text.trim() }),
    };

  } catch (error) {
    console.error("Function error:", error);
    
    // 6. Error Handling
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || "Internal Server Error",
        details: error.toString() // Log full error details for debugging
      }),
    };
  }
};
