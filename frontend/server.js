import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy API requests to the local backend (Wrangler dev running on 8787)
app.use('/api', createProxyMiddleware({ target: 'http://localhost:8787', changeOrigin: true, ws: false }))

// Serve static files from dist
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback - send all non-API routes to index.html
// Use a RegExp route to avoid path-to-regexp parsing issues ("*" can break some versions)
app.get(/.*/, (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Send index.html for all other routes
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Preview server running at http://localhost:${PORT}`);
  console.log(`📱 SPA routing enabled for all routes`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down preview server...');
  process.exit(0);
});
