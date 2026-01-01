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

// --- CORS Configuration (The "Foolproof" Approach) ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all for development simplicity
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function handleCors(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
}

function wrapCors(response) {
  const newHeaders = new Headers(response.headers);
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
router.post("/api/auth/signup", (req, env) => AuthCore.signup(req, env));
router.post("/api/auth/login", (req, env) => AuthCore.login(req, env));
router.get("/api/auth/me", (req, env) => AuthCore.me(req, env));

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

    // 2. Handle Request
    try {
      console.log("Calling router.handle");
      const response = await router.handle(request, env, ctx);
      console.log("Router handled");
      // 3. Wrap Response with CORS
      return wrapCors(response);
    } catch (e) {
      console.error("Global Error:", e);
      return wrapCors(
        new Response(JSON.stringify({ error: e.message }), { status: 500 })
      );
    }
  },
};
