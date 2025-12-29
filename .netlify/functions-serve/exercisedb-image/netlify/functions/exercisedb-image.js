var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/exercisedb-image.js
var exercisedb_image_exports = {};
__export(exercisedb_image_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(exercisedb_image_exports);
var RAPIDAPI_HOST = "exercisedb.p.rapidapi.com";
var RAPIDAPI_KEY = process.env.VITE_RAPIDAPI_KEY || "a1ef16478dmshfa2196906761101p1da34ejsn088c64356d48";
var handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: ""
    };
  }
  const { queryStringParameters } = event;
  const exerciseId = queryStringParameters.exerciseId;
  const resolution = queryStringParameters.resolution || "360";
  if (!exerciseId) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "exerciseId is required" })
    };
  }
  const targetUrl = `https://${RAPIDAPI_HOST}/image?exerciseId=${exerciseId}&resolution=${resolution}`;
  console.log(`[ExerciseDB Image Proxy] ${event.httpMethod} ${targetUrl}`);
  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY
      }
    });
    if (!response.ok) {
      console.error(`[ExerciseDB Image Proxy] Error: ${response.status}`);
      return {
        statusCode: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: ""
      };
    }
    const imageBuffer = await response.arrayBuffer();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/gif",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=2592000, immutable"
        // 30 days
      },
      body: Buffer.from(imageBuffer).toString("base64"),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error("[ExerciseDB Image Proxy] Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=exercisedb-image.js.map
