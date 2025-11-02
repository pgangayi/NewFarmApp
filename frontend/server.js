import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4173;

// Serve static files from dist
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback - send all non-API routes to index.html
app.get('*', (req, res) => {
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