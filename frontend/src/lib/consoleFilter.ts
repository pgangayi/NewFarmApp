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
      /The installed version of React DevTools is too old/i,
      /can't detect preamble/i,
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
  }, 0);
}

export {};
