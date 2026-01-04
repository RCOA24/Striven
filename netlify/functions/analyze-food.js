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
    // 2. Payload Parsing
    const body = JSON.parse(event.body);
    const { image } = body;

    if (!image) {
      throw new Error("No image provided in request body");
    }

    // 5. Configuration
    const apiKey = process.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Server configuration error: VITE_GOOGLE_API_KEY is missing");
    }

    // 3. AI Integration
    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-2.5-flash as requested for stability
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: "v1" });

    // Detailed prompt to ensure JSON output compatible with the frontend
    const prompt = `
      Identify the food in this image and estimate the calories and macros.
      
      IMPORTANT: You must return the result as a valid JSON object with the following structure:
      {
        "is_food": true,
        "summary": "A short description of the meal",
        "items": [
          {
            "display_name": "Name of the food item",
            "search_term": "Generic name for search",
            "portion_desc": "Estimated portion size",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "confidence": 0.9
          }
        ]
      }
      
      If the image is not food, return {"is_food": false}.
      Do not include markdown formatting (like \`\`\`json). Return only the raw JSON string.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    let text = response.text();

    // Clean up any potential markdown formatting
    text = text.replace(/```json|```/g, "").trim();

    // Validate JSON
    try {
      JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI response:", text);
      throw new Error("AI returned invalid JSON");
    }

    return {
      statusCode: 200,
      headers,
      body: text,
    };

  } catch (error) {
    console.error("Function error:", error);
    
    // 4. Error Handling
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
