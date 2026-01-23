// Production-grade Farm Management System API
// Simplified & Secure Core

import { Router } from "itty-router";
import { AuthCore } from "./api/auth/simple-core.js";
import { onRequest as farmsHandler } from "./api/farms.js";
import { onRequest as cropsHandler } from "./api/crops.js";
import { onRequest as livestockHandler } from "./api/livestock/index.js";
import { onRequest as tasksHandler } from "./api/tasks-enhanced.js";
import {
  onRequest as inventoryHandler,
  onRequestAlerts as inventoryAlertsHandler,
} from "./api/inventory-enhanced.js";
import { onRequest as financeHandler } from "./api/finance-enhanced.js";
import { onRequest as lookupHandler } from "./api/lookup.js";
import { onRequest as rotationsHandler } from "./api/rotations.js";
import { onRequest as pestDiseaseHandler } from "./api/pest-disease.js";
import { onRequest as locationsHandler } from "./api/locations.js";
import { onRequest as fieldsHandler } from "./api/fields-enhanced.js";
import { onRequest as weatherLocationHandler } from "./api/weather-location.js";
import { onRequest as weatherRecommendationsHandler } from "./api/weather-recommendations.js";
import { onRequest as aiHandler } from "./api/ai/index.js";
import { onRequest as marketDataHandler } from "./api/market-data.js";
import { onRequest as equipmentIntegrationHandler } from "./api/equipment-integration.js";
import { onRequest as gdprHandler } from "./api/gdpr.js";
import { onRequest as performanceHandler } from "./api/performance.js";
import { RateLimiter } from "./api/_rate-limit.js";

// --- CORS Configuration (Production-Ready) ---
function getCorsHeaders(request) {
  const origin = request.headers.get("origin");
  
  // Check if this is local development
  const isLocalDev = origin && (
    origin.includes("localhost") || 
    origin.includes("127.0.0.1") ||
    origin.includes("::1")
  );
  
  // Allowed origins for production
  const allowedOrigins = [
    "https://47cfb08b.farmers-boot.pages.dev",
    "https://cfa73f19.farmers-boot.pages.dev",
    "https://farmers-boot.pages.dev",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://localhost:8787",
    "http://localhost:8788"
  ];

  const corsHeaders = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
  };

  // Allow any localhost origin for development, otherwise check allowed list
  if (isLocalDev || !origin || allowedOrigins.includes(origin)) {
    corsHeaders["Access-Control-Allow-Origin"] = origin || "*";
  } else {
    // For production, only allow specific origins
    corsHeaders["Access-Control-Allow-Origin"] = allowedOrigins[0]; // Default to first allowed
  }

  return corsHeaders;
}

function handleCors(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(request) });
  }
}

function wrapCors(response, request) {
  const newHeaders = new Headers(response.headers);
  const corsHeaders = getCorsHeaders(request);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}

// --- Router ---
const router = Router();

// Authentication
// Temporary test handler for signup to isolate hangs during debugging.
// Revert to `AuthCore.signup` after diagnosis.
router.post("/api/auth/signup", async (req, env) => {
  console.log('Signup test handler invoked');
  try {
    // quick echo body for debugging
    const body = await req.json().catch(() => null);
    return new Response(JSON.stringify({ ok: true, body }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error('Test signup handler error', e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
});
router.post("/api/auth/login", (req, env) => AuthCore.login(req, env));
router.get("/api/auth/me", (req, env) => AuthCore.me(req, env));


// Email Verification
router.post("/api/auth/send-verification", (req, env) => AuthCore.sendVerification(req, env));
router.post("/api/auth/verify-email", (req, env) => AuthCore.verifyEmail(req, env));
router.post("/api/auth/resend-verification", (req, env) => AuthCore.resendVerification(req, env));

// Farm Invitations
router.post("/api/auth/send-invite", (req, env) => AuthCore.sendInvite(req, env));
router.post("/api/auth/accept-invite", (req, env) => AuthCore.acceptInvite(req, env));
router.get("/api/auth/invites", (req, env) => AuthCore.listInvites(req, env));
router.delete("/api/auth/invites", (req, env) => AuthCore.revokeInvite(req, env));
router.get("/api/auth/my-invites", (req, env) => AuthCore.myInvites(req, env));

// Default health check
router.get(
  "/api/health",
  () =>
    new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    })
);

// Farms
router.all("/api/farms", (req, env) => farmsHandler({ request: req, env }));
router.all("/api/farms/:id?", (req, env) =>
  farmsHandler({ request: req, env })
);

// Crops
router.all("/api/crops", (req, env) => cropsHandler({ request: req, env }));
router.all("/api/crops/:id?", (req, env) =>
  cropsHandler({ request: req, env })
);

// Livestock/Animals
router.all("/api/livestock", (req, env) =>
  livestockHandler({ request: req, env })
);
router.all("/api/livestock/:id?", (req, env) =>
  livestockHandler({ request: req, env })
);

// Tasks
router.all("/api/tasks", (req, env) => tasksHandler({ request: req, env }));
router.all("/api/tasks/:id?", (req, env) =>
  tasksHandler({ request: req, env })
);

// Inventory
router.all("/api/inventory/alerts", (req, env) =>
  inventoryAlertsHandler({ request: req, env })
);
router.all("/api/inventory", (req, env) =>
  inventoryHandler({ request: req, env })
);
router.all("/api/inventory/:id?", (req, env) =>
  inventoryHandler({ request: req, env })
);

// Finance Enhanced
router.all("/api/finance-enhanced", (req, env) =>
  financeHandler({ request: req, env })
);

// Locations
router.all("/api/locations", (req, env) =>
  locationsHandler({ request: req, env })
);
router.all("/api/locations/:id?", (req, env) =>
  locationsHandler({ request: req, env })
);

// Fields
router.all("/api/fields", (req, env) =>
  fieldsHandler({ request: req, env })
);
router.all("/api/fields/:id?", (req, env) =>
  fieldsHandler({ request: req, env })
);

// Weather
router.all("/api/weather/farm", (req, env) =>
  weatherLocationHandler({ request: req, env })
);
router.all("/api/weather/impact-analysis", (req, env) =>
  weatherLocationHandler({ request: req, env })
);
router.all("/api/weather/recommendations", (req, env) =>
  weatherRecommendationsHandler({ request: req, env })
);

// Lookup
router.all("/api/lookup/*", (req, env) => lookupHandler({ request: req, env }));

// Rotations
router.all("/api/rotations", (req, env) =>
  rotationsHandler({ request: req, env })
);
router.all("/api/rotations/:id", (req, env) =>
  rotationsHandler({ request: req, env })
);

// Pest & Disease
router.all("/api/pest-disease", (req, env) =>
  pestDiseaseHandler({ request: req, env })
);
router.all("/api/pest-disease/:id", (req, env) =>
  pestDiseaseHandler({ request: req, env })
);

// AI Services
router.all("/api/ai/*", (req, env) =>
  aiHandler({ request: req, env })
);

// Market Data Integration
router.all("/api/market/*", (req, env) =>
  marketDataHandler({ request: req, env })
);

// Equipment Integration
router.all("/api/equipment/*", (req, env) =>
  equipmentIntegrationHandler({ request: req, env })
);

// Performance Monitoring
router.get("/api/performance", (req, env) =>
  performanceHandler({ request: req, env })
);

// GDPR Compliance
router.post("/api/gdpr", (req, env) =>
  gdprHandler({ request: req, env })
);

// Fallback
router.all("*", () => {
  console.log("Fallback hit");
  return new Response(JSON.stringify({ error: "Endpoint not found" }), {
    status: 404,
  });
});

export default {
  async fetch(request, env, ctx) {
    console.log("Incoming request:", request.method, request.url);

    // 1. Handle Preflight
    const preflight = handleCors(request);
    if (preflight) return preflight;

    // 2. Apply Rate Limiting
    const rateLimiter = new RateLimiter(env);
    const rateLimitResponse = await rateLimiter.middleware()(request, env);
    if (rateLimitResponse) {
      return wrapCors(rateLimitResponse, request);
    }

    // 3. Handle Request
    try {
      // Quick paths: respond directly for common health/static paths to avoid router hangs during debugging
      const pathname = new URL(request.url).pathname;
      if (pathname === "/") {
        return wrapCors(
          new Response(JSON.stringify({ status: "ok", path: "/" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
          request,
        );
      }

      if (pathname === "/api/health") {
        return wrapCors(
          new Response(JSON.stringify({ status: "ok", path: "/api/health" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
          request,
        );
      }

      if (pathname === "/favicon.ico") {
        return new Response(null, { status: 204 });
      }

      // Auth endpoints - bypass router to avoid hangs
      if (pathname === "/api/auth/signup" && method === "POST") {
        const { onRequest: signupHandler } = await import("./api/auth/signup.js");
        return wrapCors(await signupHandler({ request, env, ctx }), request);
      }

      if (pathname === "/api/auth/login" && method === "POST") {
        const { onRequest: loginHandler } = await import("./api/auth/login.js");
        return wrapCors(await loginHandler({ request, env, ctx }), request);
      }

      if (pathname === "/api/auth/me" && method === "GET") {
        const { onRequest: validateHandler } = await import("./api/auth/validate.js");
        return wrapCors(await validateHandler({ request, env, ctx }), request);
      }

      // Fall back to router for other endpoints
      console.log("Calling router.handle for:", pathname, method);
      const response = await router.handle(request, env, ctx);
      console.log("Router handled");
      // 4. Wrap Response with CORS
      return wrapCors(response, request);
    } catch (e) {
      console.error("Global Error:", e);
      return wrapCors(
        new Response(JSON.stringify({ error: e.message }), { status: 500 }),
        request
      );
    }
  },
};
