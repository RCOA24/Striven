# Quick Setup Guide - CORS Fix

## 🚀 Immediate Steps

### 1. Environment Setup (Already Done)
The `.env.local` file has been created with:
```bash
VITE_API_BASE_URL=/api
```

### 2. Build and Test Locally
```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Test in browser at http://localhost:5173
# Check DevTools Network tab - requests should go to /api/v1/...
```

### 3. Deploy to Netlify

#### Option A: Git Push (Recommended)
```bash
# Commit changes
git add .
git commit -m "Fix: Implement Netlify proxy to resolve CORS issues"
git push origin main

# Netlify will auto-deploy if connected to your repo
```

#### Option B: Manual Deploy
```bash
# Build the project
npm run build

# Verify _redirects is in dist folder
ls dist/_redirects  # Should exist

# Deploy dist/ folder to Netlify via web UI or CLI
```

### 4. Configure Netlify Environment Variables

**In Netlify Dashboard:**
1. Go to **Site Settings** → **Environment Variables**
2. Click **Add a variable**
3. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `/api`
4. Save and **Rebuild** your site

### 5. Verify It Works

After deployment:
1. Open your site: `https://striven.netlify.app`
2. Open DevTools → **Network** tab
3. Navigate to Exercise Library
4. Check requests:
   - ✅ Should see: `https://striven.netlify.app/api/v1/exercises`
   - ❌ Should NOT see: `https://exercisedb-api.vercel.app`
   - ✅ Should have NO CORS errors

---

## 📋 Files Modified/Created

### Created:
- ✅ `public/_redirects` - Netlify proxy configuration
- ✅ `.env.example` - Environment template
- ✅ `.env.local` - Local environment (gitignored)
- ✅ `src/config/api.config.js` - Centralized API config
- ✅ `vercel.json` - Optional CORS config for API
- ✅ `CORS_FIX_DOCUMENTATION.md` - Full documentation

### Modified:
- ✅ `src/api/exercises.js` - Uses environment-based API URL
- ✅ `vite.config.js` - Added local dev proxy

---

## 🔍 Quick Troubleshooting

### Still getting CORS errors?
1. **Check Netlify env vars** - Must set `VITE_API_BASE_URL=/api`
2. **Rebuild site** - Env vars require rebuild
3. **Clear cache** - Hard refresh (Ctrl+Shift+R)
4. **Verify _redirects** - Check `dist/_redirects` exists after build

### _redirects not in dist folder?
- Vite copies `public/*` to `dist/` during build
- Run `npm run build` and check `dist/_redirects`

### Works locally but not production?
- Environment variable not set in Netlify
- Forgot to rebuild after adding env var
- Check Netlify deploy logs for errors

---

## 🎯 Next Steps (Optional)

### If API is under your control:
Upload `vercel.json` to your Vercel API project for additional CORS support.

### For additional APIs:
Use the same pattern:
1. Add proxy rule to `_redirects`
2. Add to `vite.config.js` for local dev
3. Use environment variables in code

---

**Need Help?** See `CORS_FIX_DOCUMENTATION.md` for detailed explanation.
