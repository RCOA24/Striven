# Capacitor Configuration Files

## Files

### `capacitor.config.json` (Production)
This is the **production configuration** - used for building release APKs.
- **Does NOT include** `server.url`
- App uses bundled assets from the `dist` folder
- OAuth deep linking works correctly with `leaderboardapp://` scheme

### `capacitor.config.dev.json` (Development)
This is the **development configuration** for live reload during development.
- **Includes** `server.url` pointing to Netlify
- Useful for testing without rebuilding the app
- To use: `cp capacitor.config.dev.json capacitor.config.json`

## Important Notes

⚠️ **Never deploy with `server.url` enabled!**

When `server.url` is configured, the Android app loads your website from that URL instead of using bundled assets. This causes:
- OAuth redirects to go to the web URL instead of staying in the app
- Slower performance (network requests vs local files)
- App won't work offline

## Usage

### For Production Builds:
```bash
# Make sure you're using the production config
npm run build
npx cap sync
npx cap run android
```

### For Development (Live Reload):
```bash
# Temporarily switch to dev config
cp capacitor.config.dev.json capacitor.config.json

# Sync and run
npx cap sync
npx cap run android

# Don't forget to switch back before building for release!
cp capacitor.config.json.bak capacitor.config.json  # or just remove server.url
```
