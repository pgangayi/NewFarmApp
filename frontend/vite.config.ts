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
        ],
      },
      manifest: {
        name: 'Farmers Boot',
        short_name: 'Farm Mgmt',
        description: 'Complete farm management platform',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%2316a34a" width="192" height="192"/><text x="50%" y="50%" font-size="80" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold" font-family="Arial">FB</text></svg>',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect fill="%2316a34a" width="512" height="512"/><text x="50%" y="50%" font-size="250" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold" font-family="Arial">FB</text></svg>',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
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
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          maps: ['mapbox-gl'],
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
        rewrite: path => path,
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
