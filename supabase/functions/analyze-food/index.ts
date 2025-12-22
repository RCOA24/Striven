// @ts-ignore - Deno URL import resolved at edge runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Provide minimal typings so VS Code TypeScript understands Deno
declare const Deno: {
  env: { get(name: string): string | undefined };
};

const ALLOWED_ORIGINS = new Set<string>([
  "http://localhost:5173",
  "https://striven.netlify.app",
  "https://striven.app",
]);

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

// Rate limiter using simple in-memory storage (resets on function restart)
class RateLimiter {
  minDelayMs: number;
  lastRequestTime: number;
  constructor(minDelayMs = 500) {
    this.minDelayMs = minDelayMs;
    this.lastRequestTime = 0;
  }

  async wait() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelayMs) {
      await new Promise((r) =>
        setTimeout(r, this.minDelayMs - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }
}

const rateLimiter = new RateLimiter(500);

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 3,
  backoffBase = 1000
): Promise<Response> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status !== 429 && res.status !== 500 && res.status !== 503) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (i < retries - 1) {
      const delay = backoffBase * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

/**
 * Analyze food image using Google Gemini API
 * Secure version that keeps API key server-side
 */
async function analyzeWithGemini(
  base64Data: string,
  imageType: string = "image/jpeg"
): Promise<{
  is_food: boolean;
  summary?: string;
  items?: Array<{
    display_name: string;
    search_term: string;
    portion_desc: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: number;
  }>;
}> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const promptText = `
You are a Filipino Nutritionist AI Expert specializing in both Filipino and global cuisine.

ANALYZE this food image and identify EACH DISTINCT ITEM visible. Pay special attention to:
- Filipino dishes: Distinguish cultural specifics (e.g., "Chicken Joy" vs generic "Fried Chicken", "Sinigang" vs generic "Meat Stew")
- Rice & Sauce: Filipino meals often combine white rice + sauce-heavy dishes (adobo, sinigang, etc.). Detect rice separately!
- Hidden calories: Cooking oil/butter in sauces, coconut milk, fried preparations

For EACH food item detected, return:
- display_name: The culturally-specific or local name (e.g., "Tortang Talong", "Lumpia", "Tokwa't Baboy")
- search_term: The English/generic equivalent for database lookup (e.g., "Eggplant Omelet", "Spring Roll", "Fried Tofu and Pork")
- portion_desc: e.g., "1 plate (200g rice)", "1 serving"
- calories, protein, carbs, fat: For ONE serving of this item

Also include a brief paragraph field named "summary" explaining the meal in natural language for the user (e.g., describing a silog combination: rice + egg + meat), and highlight sodium and hidden fats if relevant.

Return ONLY a raw JSON object (no markdown). Do NOT include any explanatory text, code fences, or additional commentary.

If NOT food: {"is_food": false}

If IS food:
{
  "is_food": true,
  "summary": "Short descriptive overview of the meal",
  "items": [
    {
      "display_name": "Food Name (e.g. Sinigang na Baboy)",
      "search_term": "English/generic equivalent (e.g. Pork Stew)",
      "portion_desc": "1 bowl (300g)",
      "calories": 250,
      "protein": 20,
      "carbs": 15,
      "fat": 12,
      "confidence": 0.9
    }
  ]
}
`;

  await rateLimiter.wait();

  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: imageType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
      }),
    },
    3,
    1000
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const parts = data.candidates?.flatMap((c: any) => c.content?.parts || []) || [];

  let rawText = "";
  for (const p of parts) {
    if (p.text && p.text.includes("{")) {
      rawText = p.text;
      break;
    }
  }
  if (!rawText && parts[0]?.text) rawText = parts[0].text;

  // Clean markdown/code fences and extract JSON
  const clean = (rawText || "").replace(/```json|```/g, "").trim();
  const objMatch = clean.match(/\{[\s\S]*\}/);
  const arrMatch = clean.match(/\[[\s\S]*\]/);
  let jsonStr = null;

  if (objMatch) jsonStr = objMatch[0];
  else if (arrMatch) jsonStr = arrMatch[0];
  else throw new Error("Invalid JSON from Gemini");

  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch (e) {
    // Attempt to fix trailing commas
    const fixed = jsonStr.replace(/,\s*([}\]])/g, "$1");
    result = JSON.parse(fixed);
  }

  return result;
}

// Handle CORS preflight
function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: buildCorsHeaders(req) });
  }
  return null;
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Only POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const { image, imageType } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "Missing image in request body" }),
        {
          status: 400,
          headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // Analyze food with Gemini
    const result = await analyzeWithGemini(
      image,
      imageType || "image/jpeg"
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
