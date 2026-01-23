import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import type { Plugin } from 'vite';

// Plugin to fix chrome-extension:// URL issues
const fixChromeExtensionPlugin = (): Plugin => ({
  name: 'fix-chrome-extension',
  configureServer(server) {
    // Add middleware to handle chrome-extension URLs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url && req.url.includes('chrome-extension://')) {
        console.warn('Blocked chrome-extension URL:', req.url);
        // Don't rewrite - just block to prevent infinite loops
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      next();
    });
  },
  // Also handle during build
  resolveId(id) {
    if (id.includes('chrome-extension://')) {
      return null;
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    fixChromeExtensionPlugin(),
    react({
      jsxRuntime: 'automatic',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB to handle large bundles
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            urlPattern: /\/api\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: false,
      },
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-slot'],
          maps: ['mapbox-gl'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
          query: ['@tanstack/react-query'],
          validation: ['zod'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: 'localhost',
    strictPort: false,
    fs: {
      strict: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
    },
  },
  optimizeDeps: {
    exclude: ['@vite/client', '@vite/env'],
  },
  preview: {
    port: 4173,
    strictPort: true,
    // Add proper headers for SPA routing
    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  },
});
