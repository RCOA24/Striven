# OAuth Authentication Flow Guide

## Overview

Striven uses **PKCE (Proof Key for Code Exchange)** flow for OAuth authentication with Supabase, which is more secure than the implicit flow.

## PKCE vs Implicit Flow

### PKCE Flow (Current - Recommended ✅)
- **Authorization Code**: Supabase redirects with a `code` parameter in **query string** (`?code=...`)
- **Code Exchange**: App exchanges code for session using `supabase.auth.exchangeCodeForSession(code)`
- **More Secure**: Code is single-use and short-lived
- **Configured in**: `supabaseClient.js` with `flowType: 'pkce'`

### Implicit Flow (Legacy - Not Used ❌)
- **Direct Tokens**: Supabase redirects with `access_token` and `refresh_token` in **URL hash** (`#access_token=...`)
- **Session Creation**: App directly sets session using `supabase.auth.setSession({ access_token, refresh_token })`
- **Less Secure**: Tokens exposed in URL

## Platform-Specific Handling

### 🌐 Web (PWA)
**Redirect URL**: `https://striven.netlify.app/` (site URL)

**Flow**:
1. User clicks "Sign in with Google"
2. Redirects to Google OAuth
3. Google redirects back to: `https://striven.netlify.app/?code=ABC123...`
4. Supabase client automatically detects and exchanges code (via `detectSessionInUrl: true`)
5. Session is set, `onAuthStateChange` fires

**Code Location**: 
- Login: [authService.js](src/services/authService.js) - `signInWithGoogle()`
- Auto-handling: [supabaseClient.js](src/lib/supabaseClient.js) - `detectSessionInUrl: true`

### 📱 Android (Native App)
**Redirect URL**: `leaderboardapp://google-auth` (deep link)

**Flow**:
1. User clicks "Sign in with Google"
2. Opens external browser for Google OAuth
3. Google redirects to: `leaderboardapp://google-auth?code=ABC123...`
4. Android opens app via deep link
5. App's `appUrlOpen` listener catches the URL
6. App extracts `code` from query params
7. App calls `supabase.auth.exchangeCodeForSession(code)`
8. Session is set, `onAuthStateChange` fires

**Code Location**:
- Login: [authService.js](src/services/authService.js) - `signInWithGoogle()`
- Deep link handler: [App.jsx](src/App.jsx) - `CapacitorApp.addListener('appUrlOpen', ...)`

## Configuration Files

### Supabase Configuration
File: [supabaseClient.js](src/lib/supabaseClient.js)

```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,  // Auto-handles OAuth on web
    storage: window.localStorage,
    storageKey: 'striven-auth-token',  // Same for web and mobile
    flowType: 'pkce'  // PKCE flow enabled
  }
});
```

### Supabase Dashboard Settings
**Authentication > URL Configuration**:
- **Site URL**: `https://striven.netlify.app`
- **Redirect URLs**:
  - `https://striven.netlify.app/` (web)
  - `leaderboardapp://google-auth` (Android deep link)

### Capacitor Configuration
File: [capacitor.config.json](capacitor.config.json)

```json
{
  "appId": "com.striven.app",
  "appName": "Striven",
  "webDir": "dist",
  "plugins": {
    "App": {
      "deepLinks": [
        {
          "scheme": "leaderboardapp",
          "host": "*"
        }
      ]
    }
  }
}
```

⚠️ **IMPORTANT**: Do NOT include `server.url` in production config! See [CAPACITOR_CONFIG_README.md](CAPACITOR_CONFIG_README.md)

### Android Manifest
File: [android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml)

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="leaderboardapp" />
</intent-filter>
```

## Deep Link Handler Implementation

File: [App.jsx](src/App.jsx)

The `appUrlOpen` listener handles both PKCE and implicit flows:

```javascript
useEffect(() => {
  const handleDeepLink = async (data) => {
    const url = new URL(data.url);
    
    // Extract from both query and hash
    const queryParams = new URLSearchParams(url.search);
    const hashParams = new URLSearchParams(url.hash.substring(1));
    
    // PKCE: code in query params
    const code = queryParams.get('code');
    
    // Implicit: tokens in hash (fallback)
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');
    
    // Errors in either
    const error = queryParams.get('error') || hashParams.get('error');
    
    if (code) {
      // PKCE Flow
      await supabase.auth.exchangeCodeForSession(code);
    } else if (access_token && refresh_token) {
      // Implicit Flow (fallback)
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  };
  
  CapacitorApp.addListener('appUrlOpen', handleDeepLink);
}, []);
```

## Platform Detection

File: [authService.js](src/services/authService.js)

```javascript
export const signInWithGoogle = async () => {
  const isNativePlatform = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  let finalRedirectTo;
  if (isNativePlatform) {
    // Mobile: Use deep link
    finalRedirectTo = 'leaderboardapp://google-auth';
  } else {
    // Web: Use site URL
    finalRedirectTo = window.location.origin;
  }
  
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: finalRedirectTo
    }
  });
};
```

## Expected URL Formats

### PKCE Flow (Current)
```
Web:     https://striven.netlify.app/?code=ABC123...
Android: leaderboardapp://google-auth?code=ABC123...
```

### Implicit Flow (Legacy - Fallback)
```
Web:     https://striven.netlify.app/#access_token=...&refresh_token=...
Android: leaderboardapp://google-auth#access_token=...&refresh_token=...
```

### Error Handling
```
Web:     https://striven.netlify.app/?error=access_denied&error_description=...
Android: leaderboardapp://google-auth?error=access_denied&error_description=...
```

## Debug Logs

When you run the app and sign in, you'll see comprehensive logs:

### On App Startup ([main.jsx](src/main.jsx))
```
🚀 ============ APP STARTUP ============
🔍 Capacitor Detection:
   - window.Capacitor exists: true
   - Capacitor.getPlatform(): android
   - Capacitor.isNativePlatform(): true
```

### On Login Click ([authService.js](src/services/authService.js))
```
========================================
🔐 SIGN IN WITH GOOGLE - DEBUG START
========================================
📱 Capacitor.getPlatform(): android
📱 Capacitor.isNativePlatform(): true
✅ NATIVE PLATFORM DETECTED - Using deep link
🎯 FINAL REDIRECT URL BEING SENT TO SUPABASE:
    leaderboardapp://google-auth
```

### On Deep Link Open ([App.jsx](src/App.jsx))
```
==========================================
🔗 DEEP LINK OPENED - APP URL OPEN EVENT
==========================================
🔗 Full URL received: leaderboardapp://google-auth?code=...
🔗 OAuth parameters extracted:
   - PKCE code present (query): true
   - access_token present (hash): false
🔑 PKCE flow detected - exchanging code for session...
✅ PKCE session exchange successful!
```

## Troubleshooting

### Issue: App redirects to Netlify instead of staying in app
**Cause**: `server.url` is set in `capacitor.config.json`  
**Fix**: Remove `server` block from config (see [CAPACITOR_CONFIG_README.md](CAPACITOR_CONFIG_README.md))

### Issue: "No code or tokens found in URL"
**Cause**: Supabase redirect URL doesn't match configured deep link  
**Fix**: Verify Supabase dashboard has `leaderboardapp://google-auth` in redirect URLs

### Issue: Deep link not opening app
**Cause**: Intent filter not configured or app not installed  
**Fix**: 
1. Check [AndroidManifest.xml](android/app/src/main/AndroidManifest.xml) has intent-filter
2. Rebuild and reinstall app: `npx cap run android`

### Issue: Web version doesn't work
**Cause**: `detectSessionInUrl` disabled or wrong redirect URL  
**Fix**: 
1. Verify `detectSessionInUrl: true` in [supabaseClient.js](src/lib/supabaseClient.js)
2. Verify site URL in Supabase dashboard matches deployment URL

## Storage Consistency

The `storageKey: 'striven-auth-token'` is intentionally the same across web and mobile. This means:
- ✅ Session persists if user switches between PWA and native app
- ✅ Single source of truth for authentication state
- ✅ Logout on one platform logs out on both (if using same device)

## Testing Checklist

### Before Testing
- [ ] Remove `server.url` from `capacitor.config.json`
- [ ] Build app: `npm run build`
- [ ] Sync to Android: `npx cap sync android`
- [ ] Verify Supabase redirect URLs include `leaderboardapp://google-auth`

### Test on Android
- [ ] Run app: `npx cap run android`
- [ ] Open Chrome DevTools: `chrome://inspect` > Remote devices
- [ ] Click "Sign in with Google"
- [ ] Check console for platform detection logs
- [ ] Complete Google OAuth
- [ ] Verify app opens (not browser)
- [ ] Check console for deep link and session logs
- [ ] Verify user is signed in

### Test on Web
- [ ] Deploy to Netlify (or run locally)
- [ ] Click "Sign in with Google"
- [ ] Complete Google OAuth
- [ ] Verify redirect back to site
- [ ] Verify session detected automatically
- [ ] Verify user is signed in

## References

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [PKCE Flow Explanation](https://oauth.net/2/pkce/)
