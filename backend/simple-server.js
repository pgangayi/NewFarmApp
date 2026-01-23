// Simple Node.js server for testing
import http from 'http';

const port = 8788;

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Simple routing
  const url = new URL(req.url, `http://localhost:${port}`);
  const path = url.pathname;
  const method = req.method;
  
  console.log(`${method} ${path} - ${new Date().toISOString()}`);
  
  // Auth routes
  if (path.startsWith('/api/auth/')) {
    if (method === 'POST' && path === '/api/auth/signup') {
      try {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', () => {
          const data = JSON.parse(body || '{}');
          console.log('Signup request:', data);
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            message: 'Signup successful (test mode)',
            user: {
              id: 'test-user-id',
              email: data.email,
              name: data.name
            }
          }));
        });
      } catch (error) {
        console.error('Signup error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    } else if (method === 'POST' && path === '/api/auth/login') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Login endpoint (test mode)',
        token: 'test-jwt-token'
      }));
    } else if (method === 'GET' && path === '/api/auth/me') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Auth me endpoint (test mode)',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Auth endpoint not found: ${method} ${path}` }));
    }
  }
  // Health endpoint
  else if (method === 'GET' && path === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString()
    }));
  }
  // Farms endpoint
  else if (path.startsWith('/api/farms')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Farms endpoint (test mode)',
      farms: []
    }));
  }
  // Crops endpoint
  else if (path.startsWith('/api/crops')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Crops endpoint (test mode)',
      crops: []
    }));
  }
  // Default 404
  else {
    console.log(`404: ${method} ${path}`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Endpoint not found',
      method,
      path,
      availableEndpoints: [
        'POST /api/auth/signup',
        'POST /api/auth/login', 
        'GET /api/auth/me',
        'GET /api/health',
        'GET /api/farms',
        'GET /api/crops'
      ]
    }));
  }
});

server.listen(port, () => {
  console.log(`🚀 Test server running on http://localhost:${port}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   POST http://localhost:${port}/api/auth/signup`);
  console.log(`   POST http://localhost:${port}/api/auth/login`);
  console.log(`   GET  http://localhost:${port}/api/auth/me`);
  console.log(`   GET  http://localhost:${port}/api/health`);
  console.log(`   GET  http://localhost:${port}/api/farms`);
  console.log(`   GET  http://localhost:${port}/api/crops`);
});
