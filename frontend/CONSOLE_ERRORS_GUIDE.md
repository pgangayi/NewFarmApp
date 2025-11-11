# Console Errors - Resolution Guide

## Browser Extension Errors (SAFE TO IGNORE)

The following errors are from browser extensions trying to inject into your dev environment:

```
Denying load of chrome-extension://...
GET chrome-extension://invalid/ net::ERR_FAILED
TypeError: Failed to fetch dynamically imported module: chrome-extension://...
```

### Why This Happens

- Browser extensions (like ad blockers, password managers, etc.) try to inject scripts
- Vite's development server blocks these for security
- **These errors do NOT affect your app's functionality**

### Solutions

**Option 1: Ignore (Recommended for Development)**

- The console filter in `src/lib/consoleFilter.ts` now suppresses these
- Your app works perfectly despite these errors

**Option 2: Disable Extensions During Development**

1. Open Chrome/Edge in incognito mode (extensions disabled by default)
2. Or create a separate browser profile for development
3. Or disable specific extensions in `chrome://extensions`

**Option 3: Use a Clean Browser Profile**

```powershell
# Launch Chrome with a clean profile
chrome.exe --user-data-dir="C:\temp\chrome-dev-profile" http://localhost:3000
```

## React DevTools Message (SAFE TO IGNORE)

```
Download the React DevTools for a better development experience
```

### Already Handled

- Console filter now suppresses this message
- React DevTools browser extension is recommended but optional
- Install from: https://react-devtools-link/

## Service Worker Message (INFORMATIONAL)

```
SW registered: ServiceWorkerRegistration {...}
```

This is **normal and good** - your PWA service worker registered successfully!

## How the Console Filter Works

The filter in `src/lib/consoleFilter.ts`:

- Only runs in **development mode**
- Filters out harmless extension-related errors
- Lets real errors through
- Can be customized to filter additional patterns

## When to Worry

❌ **DO worry about these errors:**

- API connection failures
- Component rendering errors
- TypeScript/JavaScript errors in YOUR code
- Network request failures to your backend

✅ **DON'T worry about:**

- chrome-extension:// errors
- React DevTools download message
- Service worker registration success
- Browser extension injection warnings

## Testing in Production Mode

To test without dev-mode noise:

```powershell
npm run build
npm run preview
```

This runs a production build without dev tools and extension interference.

## Need Help?

If you see errors NOT listed here, they might be real issues. Check:

1. Browser console (F12) for the actual error
2. Network tab for failed requests
3. VS Code Problems panel for TypeScript errors
