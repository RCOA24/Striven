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

// netlify/functions/exercises.js
var exercises_exports = {};
__export(exercises_exports, {
  config: () => config,
  handler: () => handler
});
module.exports = __toCommonJS(exercises_exports);
var RAPIDAPI_HOST = "exercisedb.p.rapidapi.com";
var RAPIDAPI_KEY = process.env.VITE_RAPIDAPI_KEY || "a1ef16478dmshfa2196906761101p1da34ejsn088c64356d48";
var handler = async (event) => {
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
  try {
    let path = event.path;
    const functionPrefix = "/.netlify/functions/exercises";
    const apiPrefix = "/api/exercises";
    let apiPath = "";
    if (path.startsWith(functionPrefix)) {
      apiPath = path.substring(functionPrefix.length);
    } else if (path.startsWith(apiPrefix)) {
      apiPath = path.substring(apiPrefix.length);
    }
    const targetPath = "/exercises" + apiPath;
    const params = new URLSearchParams(event.queryStringParameters);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const targetUrl = `https://${RAPIDAPI_HOST}${targetPath}${queryString}`;
    console.log(`Proxying ${path} to ${targetUrl}`);
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
        "Content-Type": "application/json"
      }
    });
    const data = await response.text();
    let isJson = false;
    let jsonData = null;
    try {
      jsonData = JSON.parse(data);
      isJson = true;
    } catch (e) {
      isJson = false;
    }
    if (!isJson) {
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({ error: "Invalid response from upstream API", details: data.slice(0, 200) })
      };
    }
    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": response.ok ? "public, max-age=3600" : "no-cache"
      },
      body: JSON.stringify(jsonData)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
var config = {
  path: "/api/exercises/*"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config,
  handler
});
//# sourceMappingURL=exercises.js.map
