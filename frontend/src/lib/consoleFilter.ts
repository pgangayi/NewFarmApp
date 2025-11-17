// Console filter to suppress known harmless errors during development
// This must be loaded AFTER React to avoid interfering with Fast Refresh

if (import.meta.env.DEV) {
  // Wait for next tick to ensure React is initialized
  setTimeout(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    // Filter out known harmless errors
    const ignoredPatterns = [
      /Download the React DevTools/i,
      /chrome-extension:/i,
      /Denying load of chrome-extension/i,
      /Failed to fetch dynamically imported module.*chrome-extension/i,
      /TypeError: Failed to fetch dynamically imported module/i,
      /The installed version of React DevTools is too old/i,
      /can't detect preamble/i,
      /net::ERR_FAILED/i,
      /Failed to load resource: net::ERR_FAILED/i,
      /Resources must be listed in the web_accessible_resources manifest key/i,
      /\[NEW\] Explain Console errors/i,
    ];

    console.error = (...args: unknown[]) => {
      const message = String(args[0] || '');
      if (!ignoredPatterns.some(pattern => pattern.test(message))) {
        originalError.apply(console, args);
      }
    };

    console.warn = (...args: unknown[]) => {
      const message = String(args[0] || '');
      if (!ignoredPatterns.some(pattern => pattern.test(message))) {
        originalWarn.apply(console, args);
      }
    };

    // Global unhandled rejection handler for dynamic imports
    window.addEventListener('unhandledrejection', event => {
      const reason = event.reason;
      if (reason instanceof Error) {
        const message = reason.message;
        if (ignoredPatterns.some(pattern => pattern.test(message))) {
          // Suppress this error
          event.preventDefault();
        }
      }
    });
  }, 0);
}

export {};
