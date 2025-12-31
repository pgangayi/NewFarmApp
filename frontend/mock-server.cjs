/* eslint-disable node/no-unpublished-require, node/no-missing-require, no-console, no-unused-vars, node/no-unsupported-features/node-builtins */
// Simple mock server for development testing
// Run this with: node mock-server.js

const http = require('http');
const url = require('url');

// Mock user database
const users = [];

// Generate a simple JWT-like token
function generateToken() {
  return 'mock_token_' + Math.random().toString(36).substr(2, 9);
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const server = http.createServer((req, res) => {
  // Enable CORS
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  if (path === '/api/auth/signup' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { email, password, name } = JSON.parse(body);

        // Basic validation
        if (!email || !password || !name) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing required fields' }));
          return;
        }

        // Check if user already exists
        if (users.find(u => u.email === email)) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'User already exists' }));
          return;
        }

        // Create new user
        const newUser = {
          id: (users.length + 1).toString(),
          email,
          name,
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);

        // Generate tokens
        const accessToken = generateToken();
        const refreshToken = generateToken();

        res.writeHead(201);
        res.end(
          JSON.stringify({
            user: newUser,
            accessToken,
            refreshToken,
            csrfToken: 'mock_csrf_token',
          })
        );

        console.log(`✅ New user registered: ${email}`);
      } catch (error) {
        console.error('❌ Signup error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  } else if (path === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { email } = JSON.parse(body);

        // Find user
        const user = users.find(u => u.email === email);

        if (!user) {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
          return;
        }

        // Generate tokens
        const accessToken = generateToken();
        const refreshToken = generateToken();

        res.writeHead(200);
        res.end(
          JSON.stringify({
            user,
            accessToken,
            refreshToken,
            csrfToken: 'mock_csrf_token',
          })
        );

        console.log(`✅ User logged in: ${email}`);
      } catch (error) {
        console.error('❌ Login error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  } else {
    // 404 for unknown routes
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Route not found' }));
  }
});

const PORT = 8787;
server.listen(PORT, () => {
  console.log(`🚀 Mock server running on http://localhost:${PORT}`);
  console.log('📝 Available endpoints:');
  console.log('  POST /api/auth/signup - Register new user');
  console.log('  POST /api/auth/login - Login user');
  console.log('\n💡 Use this for development testing while the real backend is being built.');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down mock server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
