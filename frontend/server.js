import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy API requests to the local backend (Wrangler dev running on 8787)
app.use(
  '/api',
  createProxyMiddleware({ target: 'http://localhost:8787', changeOrigin: true, ws: false })
);

// Serve static files from dist
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback - send all non-API routes to index.html
// Use a RegExp route to avoid path-to-regexp parsing issues ("*" can break some versions)
app.get(/.*/, (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // If an E2E session file exists, inject a small script into index.html
  const sessionPath = join(__dirname, '..', '.e2e_session.json');
  const indexPath = join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(sessionPath)) {
    try {
      const indexHtml = fs.readFileSync(indexPath, { encoding: 'utf8' });
      const sessionRaw = fs.readFileSync(sessionPath, { encoding: 'utf8' });
      // Build injection script that sets localStorage before the app bootstraps
      const injectionScript = `\n<script>\n  try {\n    const s = ${sessionRaw};\n    if (s.token) { window.localStorage.setItem('auth_token', s.token); }\n    if (s.user) { window.localStorage.setItem('current_user', JSON.stringify(s.user)); }\n  } catch (e) { console.error('Failed to inject E2E session', e); }\n</script>\n`;
      // Optionally inject a CSRF meta tag if session contains csrfToken
      let final = indexHtml;
      try {
        const parsed = JSON.parse(sessionRaw || '{}');
        const csrf = parsed.csrfToken;
        if (csrf) {
          const meta = `\n<meta name="csrf-token" content=${JSON.stringify(csrf)} />\n`;
          final = final.includes('</head>')
            ? final.replace('</head>', `${meta}</head>`)
            : meta + final;
        }
      } catch (e) {
        // ignore parse errors
      }

      // Insert script inside <head> so it runs before the main bundle executes
      final = final.includes('</head>')
        ? final.replace('</head>', `${injectionScript}</head>`)
        : injectionScript + final;
      res.setHeader('Content-Type', 'text/html');
      return res.send(final);
    } catch (e) {
      console.error('Error injecting E2E session:', e);
      // fallback to sending the file
      return res.sendFile(indexPath);
    }
  }

  // Send index.html for all other routes
  res.sendFile(indexPath);
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
