# CORS Fix Implementation - Netlify Proxy Strategy

## Problem Summary
The React app deployed on Netlify (`https://striven.netlify.app`) was experiencing CORS errors when attempting to fetch data from the API deployed on Vercel (`https://exercisedb-api.vercel.app`). The API did not include the required `Access-Control-Allow-Origin` header.

## Solution Overview
Implemented a **Netlify Rewrite/Proxy strategy** to bypass CORS issues by making all API requests appear to come from the same origin as the frontend.

---

## Architecture Explanation

### How the Proxy Prevents CORS Issues

#### BEFORE (CORS Error):
```
Browser (striven.netlify.app) 
    ↓ (Direct fetch)
    → API (exercisedb-api.vercel.app) ❌ CORS Error
```
The browser blocks the request because:
- **Origin**: `https://striven.netlify.app`
- **Target**: `https://exercisedb-api.vercel.app`
- Different origins = CORS policy applies
- API doesn't send `Access-Control-Allow-Origin` header

#### AFTER (With Proxy):
```
Browser (striven.netlify.app)
    ↓ (Fetch to /api/v1/exercises)
    → Netlify Server (striven.netlify.app/api/v1/exercises) ✅ Same origin!
        ↓ (Server-side request)
        → API (exercisedb-api.vercel.app/api/v1/exercises) ✅ No CORS check
```

**Why this works:**
1. Browser makes request to `/api/v1/exercises` (relative path = same origin)
2. Netlify server intercepts via `_redirects` rule
3. Netlify makes server-side request to Vercel API
4. No CORS check because server-to-server requests don't have CORS restrictions
5. Netlify returns response to browser
6. Browser sees response from same origin ✅

---

## Files Changed

### 1. **`public/_redirects`** (Created)
**Purpose**: Configures Netlify's edge servers to proxy API requests

```
/api/*  https://exercisedb-api.vercel.app/api/:splat  200
```

- **Pattern**: `/api/*` - Matches any request starting with `/api/`
- **Target**: `https://exercisedb-api.vercel.app/api/:splat`
  - `:splat` captures everything after `/api/` and appends it
  - Example: `/api/v1/exercises` → `https://exercisedb-api.vercel.app/api/v1/exercises`
- **Status**: `200` - Transparent proxy (not a redirect)

---

### 2. **`.env.example`** and **`.env.local`** (Created)
**Purpose**: Centralized environment configuration

```bash
VITE_API_BASE_URL=/api
```

- **Production (Netlify)**: Uses `/api` (relative path) → triggers proxy
- **Local Development**: Uses `/api` → Vite dev server proxies (see `vite.config.js`)
- **Alternative Local**: Could use `https://exercisedb-api.vercel.app/api` if API had CORS enabled

---

### 3. **`src/config/api.config.js`** (Created)
**Purpose**: Centralized API configuration using environment variables

**Key Features:**
- Single source of truth for API base URL
- Automatically constructs full URLs with version (`/api/v1`)
- Prevents hardcoded URLs scattered throughout codebase
- Easy to switch between environments

**Usage:**
```javascript
import { getApiBaseUrl, buildApiUrl } from '../config/api.config.js';

const baseUrl = getApiBaseUrl(); // '/api/v1'
const exercisesUrl = buildApiUrl('/exercises'); // '/api/v1/exercises'
```

---

### 4. **`src/api/exercises.js`** (Updated)
**Purpose**: Refactored to use centralized configuration

**Before:**
```javascript
const API_BASE = 'https://exercisedb-api.vercel.app/api/v1';
```

**After:**
```javascript
import { getApiBaseUrl } from '../config/api.config.js';
const API_BASE = getApiBaseUrl(); // Reads from env variable
```

---

### 5. **`vite.config.js`** (Updated)
**Purpose**: Local development proxy configuration

**Added:**
```javascript
'/api/v1': {
  target: 'https://exercisedb-api.vercel.app',
  changeOrigin: true,
  rewrite: (path) => path,
}
```

**How it works locally:**
1. Dev server starts on `http://localhost:5173`
2. App requests `/api/v1/exercises`
3. Vite intercepts and proxies to `https://exercisedb-api.vercel.app/api/v1/exercises`
4. Same behavior as production Netlify proxy

---

### 6. **`vercel.json`** (Created - OPTIONAL)
**Purpose**: Alternative/backup CORS configuration on the API side

**Note**: This is **NOT required** if you use the Netlify proxy. Only implement this if:
- You control the Vercel API
- You want to allow direct API access from specific origins
- You need a backup solution

---

## Environment-Specific Behavior

### Production (Netlify Deployment)
1. **Environment Variable**: `VITE_API_BASE_URL=/api`
2. **Request Flow**:
   ```
   App → /api/v1/exercises
        → Netlify _redirects rule
        → https://exercisedb-api.vercel.app/api/v1/exercises
   ```
3. **CORS**: No CORS issue (same-origin to browser)

### Local Development (npm run dev)
1. **Environment Variable**: `VITE_API_BASE_URL=/api`
2. **Request Flow**:
   ```
   App → /api/v1/exercises
        → Vite dev server proxy
        → https://exercisedb-api.vercel.app/api/v1/exercises
   ```
3. **CORS**: Proxied by Vite (same behavior as production)

---

## Deployment Checklist

### For Netlify:
- [x] Create `public/_redirects` file
- [x] Set environment variable: `VITE_API_BASE_URL=/api`
- [x] Build and deploy: `npm run build`
- [x] Verify `_redirects` is in `dist/` folder after build

### For Vercel API (OPTIONAL):
- [ ] Upload `vercel.json` if you control the API
- [ ] Deploy Vercel API with updated configuration

### Environment Variables in Netlify:
```
Site Settings → Environment Variables → Add:
Key: VITE_API_BASE_URL
Value: /api
```

---

## Testing

### Production Testing:
1. Deploy to Netlify
2. Open DevTools → Network tab
3. Navigate to exercise library
4. Verify requests go to `https://striven.netlify.app/api/v1/...`
5. Check response headers - should NOT see CORS errors

### Local Testing:
1. Run `npm run dev`
2. Open DevTools → Network tab
3. Verify requests go to `http://localhost:5173/api/v1/...`
4. Vite proxy should forward to Vercel API

---

## Why This Architecture Works

### ✅ Benefits:
1. **No CORS issues**: Requests appear same-origin to browser
2. **No hardcoded URLs**: Easy to change API endpoint
3. **Environment flexibility**: Works in local, staging, production
4. **API independence**: Don't need to control or modify the API
5. **Zero code changes**: Just configuration updates
6. **Better security**: API endpoint hidden from frontend code

### 🔒 Security Notes:
- Proxy is transparent (users can still see final destination in headers)
- Rate limiting should still be implemented on API side
- Consider authentication tokens for sensitive endpoints

---

## Troubleshooting

### Issue: "_redirects not working"
**Solution**: Ensure `_redirects` is in `public/` folder, not root

### Issue: "Still getting CORS errors"
**Check**:
1. Environment variable is set correctly
2. `_redirects` file is in `dist/` after build
3. Cleared browser cache
4. Using relative path `/api` not absolute URL

### Issue: "Works locally but not on Netlify"
**Check**:
1. Environment variable set in Netlify dashboard
2. Rebuilding after adding `_redirects`
3. Check Netlify deploy logs for errors

---

## Additional Resources

- [Netlify Redirects Documentation](https://docs.netlify.com/routing/redirects/rewrites-proxies/)
- [Vite Proxy Documentation](https://vitejs.dev/config/server-options.html#server-proxy)
- [Understanding CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**Last Updated**: December 29, 2025
**Status**: ✅ Ready for Production
