// Simple inline handler - no itty-router to avoid hangs
// This is a minimal drop-in replacement for testing

import { Buffer } from "buffer";
globalThis.Buffer = Buffer;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
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
    return new Response(
      JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      },
    );
  }

  // Favicon
  if (pathname === "/favicon.ico") {
    return new Response(null, { status: 204 });
  }

  // Route to handler mapping with STATIC imports for reliability
  const dispatch = async (path) => {
    switch (path) {
      case "/api/migrate":
        return await import("./api/migrate.js");
      case "/api/auth/signup":
        return await import("./api/auth/signup.js");
      case "/api/auth/login":
        return await import("./api/auth/login.js");
      case "/api/auth/logout":
        return await import("./api/auth/logout.js");
      case "/api/auth/refresh":
        return await import("./api/auth/refresh.js");
      case "/api/auth/forgot-password":
        return await import("./api/auth/forgot-password.js");
      case "/api/auth/reset-password":
        return await import("./api/auth/reset-password.js");
      case "/api/auth/verify":
        return await import("./api/auth/verification.js");
      case "/api/auth/me":
      case "/api/auth/validate":
        return await import("./api/auth/validate.js");
      default:
        // Handle parameterized routes
        if (path.startsWith("/api/farms"))
          return await import("./api/farms.js");
        if (path.startsWith("/api/animals"))
          return await import("./api/livestock/index.js");
        if (path.startsWith("/api/crops"))
          return await import("./api/crops.js");
        if (path.startsWith("/api/tasks"))
          return await import("./api/tasks-enhanced.js");
        if (path.startsWith("/api/inventory"))
          return await import("./api/inventory-enhanced.js");
        if (path.startsWith("/api/locations"))
          return await import("./api/locations.js");
        if (path.startsWith("/api/finance-enhanced"))
          return await import("./api/finance-enhanced.js");
        return null;
    }
  };

  // API Route definitions for parameter extraction
  const routeConfigs = [
    { pattern: /^\/api\/farms(?:\/([^\/]+))?$/, params: ["id"] },
    { pattern: /^\/api\/animals(?:\/([^\/]+))?$/, params: ["id"] },
    { pattern: /^\/api\/crops(?:\/([^\/]+))?$/, params: ["id"] },
    { pattern: /^\/api\/tasks(?:\/([^\/]+))?$/, params: ["id"] },
    { pattern: /^\/api\/inventory(?:\/([^\/]+))?$/, params: ["id"] },
    { pattern: /^\/api\/locations(?:\/([^\/]+))?$/, params: ["id"] },
    { pattern: /^\/api\/finance-enhanced(?:\/([^\/]+))?$/, params: ["id"] },
  ];

  try {
    const module = await dispatch(pathname);
    if (module) {
      const handler = module.onRequest || module.default?.fetch;
      if (!handler) throw new Error("No handler found");

      // Extract params if applicable
      let routeParams = {};
      const config = routeConfigs.find((c) => pathname.match(c.pattern));
      if (config) {
        const match = pathname.match(config.pattern);
        if (match && match.length > 1 && match[1]) {
          config.params.forEach((name, index) => {
            routeParams[name] = match[index + 1];
          });
        }
      }

      // Create a request proxy with params
      const requestProxy = new Proxy(request, {
        get(target, prop) {
          if (prop === "params") return routeParams;
          const value = target[prop];
          if (typeof value === "function") {
            return value.bind(target);
          }
          return value;
        },
      });

      const response = await handler({
        request: requestProxy,
        env,
        ctx,
        params: routeParams,
      });

      const newResponse = new Response(response.body, response);
      Object.entries(CORS_HEADERS).forEach(([k, v]) =>
        newResponse.headers.set(k, v),
      );
      return newResponse;
    }
  } catch (e) {
    console.error(`[route] Error handling ${pathname}:`, e);
    return new Response(JSON.stringify({ error: e.message, path: pathname }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  // Fallback - endpoint not found
  return new Response(
    JSON.stringify({ error: "Not found", path: pathname, method }),
    {
      status: 404,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    },
  );
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx);
    } catch (e) {
      console.error("[global] Unhandled error:", e);
      return new Response(
        JSON.stringify({ error: "Internal server error", message: e.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        },
      );
    }
  },
};
