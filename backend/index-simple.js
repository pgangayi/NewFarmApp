// Simple inline handler - no itty-router to avoid hangs
// This is a minimal drop-in replacement for testing

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
  "Access-Control-Allow-Credentials": "true",
};

function handleCors(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
}

async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  console.log(`[handler] ${method} ${pathname}`);

  // Handle CORS preflight
  const corsPreflight = handleCors(request);
  if (corsPreflight) return corsPreflight;

  // Health check
  if (pathname === "/" || pathname === "/api/health") {
    return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  // Favicon
  if (pathname === "/favicon.ico") {
    return new Response(null, { status: 204 });
  }

  // Auth endpoints
  if (pathname === "/api/auth/signup" && method === "POST") {
    try {
      console.log("[signup] Loading handler...");
      const { onRequest: signupHandler } = await import("./api/auth/signup.js");
      console.log("[signup] Calling handler...");
      const response = await signupHandler({ request, env, ctx });
      console.log("[signup] Handler returned");
      return new Response(response.body, {
        status: response.status,
        headers: { ...response.headers, ...CORS_HEADERS },
      });
    } catch (e) {
      console.error("[signup] Error:", e);
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  }

  if (pathname === "/api/auth/login" && method === "POST") {
    try {
      const { onRequest: loginHandler } = await import("./api/auth/login.js");
      const response = await loginHandler({ request, env, ctx });
      return new Response(response.body, {
        status: response.status,
        headers: { ...response.headers, ...CORS_HEADERS },
      });
    } catch (e) {
      console.error("[login] Error:", e);
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  }

  if (pathname === "/api/auth/me" && method === "GET") {
    try {
      const { onRequest: validateHandler } = await import("./api/auth/validate.js");
      const response = await validateHandler({ request, env, ctx });
      return new Response(response.body, {
        status: response.status,
        headers: { ...response.headers, ...CORS_HEADERS },
      });
    } catch (e) {
      console.error("[validate] Error:", e);
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  }

  // Fallback - endpoint not found
  return new Response(JSON.stringify({ error: "Not found", path: pathname, method }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx);
    } catch (e) {
      console.error("[global] Unhandled error:", e);
      return new Response(JSON.stringify({ error: "Internal server error", message: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  },
};
