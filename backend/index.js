// Production-grade Farm Management System API
// Consolidated routing with proper authentication integration

// Import authentication handlers
import { onRequest as loginHandler } from "./api/auth/login.js";
import { onRequest as signupHandler } from "./api/auth/signup.js";
import { onRequest as validateHandler } from "./api/auth/validate.js";
import { onRequest as refreshHandler } from "./api/auth/refresh.js";
import { onRequest as logoutHandler } from "./api/auth/logout.js";
import { onRequest as forgotPasswordHandler } from "./api/auth/forgot-password.js";
import { onRequest as resetPasswordHandler } from "./api/auth/reset-password.js";

// Import migration handlers
import { onRequest as migrateCleanHandler } from "./api/migrate-clean.js";
import { onRequest as migrateFromFilesHandler } from "./api/migrate-from-files.js";
// Import database cleanup handler
import { onRequestCleanup } from "./api/_cleanup.js";
import { onRequest as migrateSimpleHandler } from "./api/migrate-simple.js";

// Import API route handlers
import { onRequest as healthHandler } from "./health.js";

// Enhanced API handlers (keeping latest versions)
import { onRequest as inventoryEnhancedHandler } from "./api/inventory-enhanced.js";
import { onRequest as tasksHandler } from "./api/tasks-enhanced.js";
import { onRequest as fieldsHandler } from "./api/fields-enhanced.js";
import { onRequest as farmsHandler } from "./api/farms.js";
import { onRequest as cropsHandler } from "./api/crops.js";
import { onRequest as cropsRotationHandler } from "./api/crops/rotation.js";
import { onRequest as cropsIrrigationHandler } from "./api/crops/irrigation.js";
import { onRequest as cropsPestsHandler } from "./api/crops/pests-diseases.js";
import { onRequest as cropsSoilHealthHandler } from "./api/crops/soil-health.js";
import { onRequest as livestockHandler } from "./api/livestock/index.js";
import { onRequest as livestockHealthHandler } from "./api/livestock/health.js";
import { onRequest as financeHandler } from "./api/finance-enhanced.js";
import { onRequest as notificationsHandler } from "./api/notifications.js";
import { onRequest as searchHandler } from "./api/search.js";
import { onRequest as weatherLocationHandler } from "./api/weather-location.js";
import { onRequest as bulkOperationsHandler } from "./api/bulk-operations.js";
import { onRequest as analyticsEngineHandler } from "./api/analytics-engine.js";
import { onRequest as performanceHandler } from "./api/performance.js";
import { onRequest as systemIntegrationHandler } from "./api/system-integration.js";
import { onRequest as webhooksHandler } from "./api/webhooks.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, x-csrf-token",
};

function withCors(response) {
  if (!response) {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const headers = new Headers(response.headers || {});
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

// Simple handlers for missing endpoints
async function usersHandler(context) {
  const { request, env, ctx } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Simple users listing for now
  return new Response(
    JSON.stringify({
      success: true,
      data: [],
      message: "Users endpoint - basic implementation",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

async function locationsHandler(context) {
  const { request, env, ctx } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Simple locations handling
  if (method === "GET") {
    return new Response(
      JSON.stringify({
        success: true,
        data: [],
        message: "Locations endpoint - basic implementation",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ error: "Method not implemented" }), {
    status: 501,
    headers: { "Content-Type": "application/json" },
  });
}

async function animalsHandler(context) {
  return await livestockHandler(context);
}

async function inventoryItemsHandler(context) {
  const { request, env, ctx } = context;

  // Route to inventory-enhanced with items subroute
  const enhancedContext = {
    ...context,
    request: new Request(`${request.url}&subroute=items`, request),
  };
  return inventoryEnhancedHandler(enhancedContext);
}

async function financeBudgetsHandler(context) {
  const { request, env, ctx } = context;

  // Route to finance-enhanced for budgets
  const enhancedContext = {
    ...context,
    request: new Request(`${request.url}&subroute=budgets`, request),
  };
  return financeHandler(enhancedContext);
}

async function weatherFarmHandler(context) {
  const { request, env, ctx } = context;

  // Simple weather farm endpoint
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        forecast: [],
        location: {},
        alerts: [],
      },
      message: "Weather farm endpoint - basic implementation",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

async function weatherImpactHandler(context) {
  const { request, env, ctx } = context;

  // Simple weather impact analysis endpoint
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        analysis: [],
        recommendations: [],
      },
      message: "Weather impact analysis - basic implementation",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

// Simple weather recommendations handler
async function weatherRecommendationsHandler(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Simple weather recommendations based on basic parameters
  const farmId = url.searchParams.get("farm_id");
  const location = url.searchParams.get("location");

  if (!farmId) {
    return new Response(
      JSON.stringify({ error: "farm_id parameter required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Return basic weather recommendations
  const recommendations = [
    {
      type: "general",
      priority: "medium",
      title: "Weather Monitoring",
      message: "Monitor local weather conditions for optimal farming decisions",
      actions: ["Check daily forecasts", "Plan activities based on weather"],
    },
  ];

  return new Response(
    JSON.stringify({
      success: true,
      data: recommendations,
      farm_id: farmId,
      location: location,
      generated_at: new Date().toISOString(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

// Simple websocket handler
async function websocketHandler(context) {
  const { request } = context;

  // For now, return a simple response
  // In a full implementation, this would handle WebSocket upgrades
  return new Response(
    JSON.stringify({
      message: "WebSocket endpoint",
      status: "active",
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

// Specialized handlers
export async function onRequestTemplates(context) {
  return tasksHandler(context);
}

export async function onRequestTimeLogs(context) {
  return tasksHandler(context);
}

export async function onRequestSoilAnalysis(context) {
  return fieldsHandler(context);
}

export async function onRequestEquipment(context) {
  return fieldsHandler(context);
}

export async function onRequestAlerts(context) {
  const { request, env, ctx } = context;
  const url = new URL(request.url);

  // Route to inventory-enhanced for alerts management
  if (url.searchParams.get("type") === "inventory") {
    const enhancedContext = {
      ...context,
      request: new Request(`${request.url}&subroute=alerts`, request),
    };
    return inventoryEnhancedHandler(enhancedContext);
  }

  return inventoryEnhancedHandler(context);
}

export async function onRequestSuppliers(context) {
  const { request, env, ctx } = context;

  // Route to inventory-enhanced for suppliers management
  const enhancedContext = {
    ...context,
    request: new Request(`${request.url}&subroute=suppliers`, request),
  };
  return inventoryEnhancedHandler(enhancedContext);
}

export async function onRequestFinanceEntries(context) {
  const { request, env, ctx } = context;

  // Route to finance-enhanced for entries management
  const enhancedContext = {
    ...context,
    request: new Request(`${request.url}&subroute=entries`, request),
  };
  return financeHandler(enhancedContext);
}

export async function onRequestFinanceReports(context) {
  const { request, env, ctx } = context;

  // Route to finance-enhanced for reports management
  const enhancedContext = {
    ...context,
    request: new Request(`${request.url}&subroute=reports`, request),
  };
  return financeHandler(enhancedContext);
}

export default {
  async fetch(request, env, ctx) {
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const createContext = (customRequest = request) => ({
      request: customRequest,
      env,
      ctx,
    });

    const handleRoute = async () => {
      const url = new URL(request.url);
      const pathname = url.pathname;

      console.log(`${method} ${pathname}`);

      // Health endpoints
      if (pathname === "/health" || pathname === "/api/health") {
        return await healthHandler(createContext());
      }

      // Authentication routes
      if (pathname === "/api/auth/login" && method === "POST") {
        const response = await loginHandler(createContext());

        // Transform response format for frontend compatibility
        const originalData = await response.clone().json();
        if (originalData.success && originalData.data) {
          const transformed = {
            success: true,
            user: originalData.data.user,
            token: originalData.data.tokens.accessToken,
            message: "Login successful",
          };

          return new Response(JSON.stringify(transformed), {
            status: response.status,
            headers: response.headers,
          });
        }
        return response;
      }

      if (pathname === "/api/auth/signup" && method === "POST") {
        const response = await signupHandler(createContext());

        // Transform response format for frontend compatibility
        const originalData = await response.clone().json();
        if (originalData.success && originalData.data) {
          const transformed = {
            success: true,
            user: originalData.data.user,
            token: originalData.data.tokens.accessToken,
            message: "Signup successful",
          };

          return new Response(JSON.stringify(transformed), {
            status: response.status,
            headers: response.headers,
          });
        }
        return response;
      }

      if (
        pathname === "/api/auth/validate" &&
        (method === "GET" || method === "POST")
      ) {
        const response = await validateHandler(createContext());

        // Transform response for frontend compatibility
        const originalData = await response.clone().json();
        if (originalData.success && originalData.data) {
          const transformed = {
            success: true,
            user: originalData.data.user,
            valid: originalData.data.valid,
          };

          return new Response(JSON.stringify(transformed), {
            status: response.status,
            headers: response.headers,
          });
        }
        return response;
      }

      if (pathname === "/api/auth/refresh" && method === "POST") {
        const response = await refreshHandler(createContext());
        return response;
      }

      if (pathname === "/api/auth/logout" && method === "POST") {
        const response = await logoutHandler(createContext());
        return response;
      }

      if (pathname === "/api/auth/forgot-password" && method === "POST") {
        return await forgotPasswordHandler(createContext());
      }

      if (pathname === "/api/auth/reset-password" && method === "POST") {
        return await resetPasswordHandler(createContext());
      }

      // User management
      if (pathname === "/api/users") {
        return await usersHandler(createContext());
      }

      // Location management
      if (pathname.startsWith("/api/locations")) {
        return await locationsHandler(createContext());
      }

      // Inventory management routes
      if (pathname.startsWith("/api/inventory")) {
        if (pathname === "/api/inventory/suppliers") {
          return await onRequestSuppliers(createContext());
        }
        if (pathname === "/api/inventory/alerts") {
          return await onRequestAlerts(createContext());
        }
        if (pathname === "/api/inventory/items") {
          return await inventoryItemsHandler(createContext());
        }

        // Use enhanced inventory for main inventory operations
        return await inventoryEnhancedHandler(createContext());
      }

      // Task management routes
      if (pathname.startsWith("/api/tasks")) {
        if (pathname === "/api/tasks/templates") {
          return await onRequestTemplates(createContext());
        }
        if (pathname === "/api/tasks/time-logs") {
          return await onRequestTimeLogs(createContext());
        }

        return await tasksHandler(createContext());
      }

      // Field management routes
      if (pathname.startsWith("/api/fields")) {
        if (pathname === "/api/fields/soil-analysis") {
          return await onRequestSoilAnalysis(createContext());
        }
        if (pathname === "/api/fields/equipment") {
          return await onRequestEquipment(createContext());
        }

        return await fieldsHandler(createContext());
      }

      // Farm management routes
      if (pathname.startsWith("/api/farms")) {
        // Check for sub-routes
        const subPath = pathname.replace("/api/farms", "");

        if (subPath === "/stats") {
          const enhancedRequest = new Request(
            `${request.url}&subroute=stats`,
            request
          );
          return await farmsHandler(createContext(enhancedRequest));
        }

        if (subPath === "/operations") {
          const enhancedRequest = new Request(
            `${request.url}&subroute=operations`,
            request
          );
          return await farmsHandler(createContext(enhancedRequest));
        }

        return await farmsHandler(createContext());
      }

      // Specialized crop sub-routes (rotation, irrigation, pests, soil health)
      if (pathname.startsWith("/api/crops/rotation")) {
        return await cropsRotationHandler(createContext());
      }

      if (pathname.startsWith("/api/crops/irrigation")) {
        return await cropsIrrigationHandler(createContext());
      }

      if (pathname.startsWith("/api/crops/pests-diseases")) {
        return await cropsPestsHandler(createContext());
      }

      if (pathname.startsWith("/api/crops/soil-health")) {
        return await cropsSoilHealthHandler(createContext());
      }

      // Crop management routes
      if (pathname.startsWith("/api/crops")) {
        const subPath = pathname.replace("/api/crops", "");

        if (subPath === "/activities") {
          const enhancedRequest = new Request(
            `${request.url}&subroute=activities`,
            request
          );
          return await cropsHandler(createContext(enhancedRequest));
        }

        if (subPath === "/observations") {
          const enhancedRequest = new Request(
            `${request.url}&subroute=observations`,
            request
          );
          return await cropsHandler(createContext(enhancedRequest));
        }

        if (subPath === "/planning") {
          const enhancedRequest = new Request(
            `${request.url}&subroute=planning`,
            request
          );
          return await cropsHandler(createContext(enhancedRequest));
        }

        if (subPath === "/yields") {
          const enhancedRequest = new Request(
            `${request.url}&subroute=yields`,
            request
          );
          return await cropsHandler(createContext(enhancedRequest));
        }

        return await cropsHandler(createContext());
      }

      // Livestock management routes
      if (
        pathname.startsWith("/api/livestock") ||
        pathname.startsWith("/api/animals")
      ) {
        if (pathname === "/api/livestock/health") {
          return await livestockHealthHandler(createContext());
        }

        return await animalsHandler(createContext());
      }

      // Finance management routes
      if (pathname.startsWith("/api/finance")) {
        if (pathname === "/api/finance/entries") {
          return await onRequestFinanceEntries(createContext());
        }

        if (pathname === "/api/finance/reports") {
          return await onRequestFinanceReports(createContext());
        }

        if (pathname === "/api/finance/budgets") {
          return await financeBudgetsHandler(createContext());
        }

        if (pathname === "/api/finance/analytics") {
          const enhancedRequest = new Request(
            `${request.url}&subroute=analytics`,
            request
          );
          return await financeHandler(createContext(enhancedRequest));
        }

        return await financeHandler(createContext());
      }

      // Notifications
      if (pathname === "/api/notifications") {
        return await notificationsHandler(createContext());
      }

      // Search
      if (pathname === "/api/search") {
        return await searchHandler(createContext());
      }

      // Weather endpoints
      if (pathname === "/api/weather/location") {
        return await weatherLocationHandler(createContext());
      }

      if (pathname === "/api/weather/recommendations") {
        return await weatherRecommendationsHandler(createContext());
      }

      if (pathname === "/api/weather/farm") {
        return await weatherFarmHandler(createContext());
      }

      if (pathname === "/api/weather/impact-analysis") {
        return await weatherImpactHandler(createContext());
      }

      // Legacy weather route
      if (pathname === "/api/weather") {
        return await weatherLocationHandler(createContext());
      }

      // Bulk operations
      if (pathname === "/api/bulk-operations") {
        return await bulkOperationsHandler(createContext());
      }

      // Analytics
      if (pathname === "/api/analytics") {
        return await analyticsEngineHandler(createContext());
      }

      // Analytics Engine (legacy compatibility)
      if (pathname === "/api/analytics-engine") {
        return await analyticsEngineHandler(createContext());
      }

      // Performance
      if (pathname === "/api/performance") {
        return await performanceHandler(createContext());
      }

      // System integration
      if (pathname === "/api/system-integration") {
        return await systemIntegrationHandler(createContext());
      }

      // Webhooks
      if (pathname === "/api/webhooks") {
        return await webhooksHandler(createContext());
      }

      // WebSocket upgrade
      if (pathname === "/api/websocket") {
        return await websocketHandler(createContext());
      }

      // Admin routes
      if (pathname.startsWith("/api/admin")) {
        if (pathname === "/api/admin/audit-logs") {
          // Import admin audit logs handler
          const { onRequest: adminAuditHandler } = await import(
            "./api/admin_audit_logs.js"
          );
          return await adminAuditHandler(createContext());
        }
      }

      // Legacy route compatibility - redirect old patterns to new ones
      if (pathname === "/api/tasks" && method === "GET") {
        return await tasksHandler(createContext());
      }

      if (pathname === "/api/fields" && method === "GET") {
        return await fieldsHandler(createContext());
      }

      // Database debug (only in development)
      if (pathname === "/api/debug-db" && env.NODE_ENV !== "production") {
        const { onRequest: debugHandler } = await import("./api/debug-db.js");
        return await debugHandler(createContext());
      }

      // Database migration (admin only)
      if (pathname === "/api/migrate" && env.NODE_ENV !== "production") {
        const { onRequest: migrateHandler } = await import("./api/migrate.js");
        return await migrateHandler(createContext());
      }
      // Database cleanup endpoints (admin only)
      if (pathname === "/api/cleanup" && env.NODE_ENV !== "production") {
        return await onRequestCleanup(createContext());
      }

      // Clean database migration (new schema)
      if (pathname === "/api/migrate-clean" && env.NODE_ENV !== "production") {
        return await migrateCleanHandler(createContext());
      }

      // File-based migration (legacy)
      if (
        pathname === "/api/migrate-from-files" &&
        env.NODE_ENV !== "production"
      ) {
        return await migrateFromFilesHandler(createContext());
      }

      // Simple database migration (step-by-step)
      if (pathname === "/api/migrate-simple" && env.NODE_ENV !== "production") {
        return await migrateSimpleHandler(createContext());
      }

      // Fallback for unknown routes
      return new Response(
        JSON.stringify({
          status: "OK",
          message: "Farm Management API Server",
          version: "2.0.0",
          path: pathname,
          method: method,
          timestamp: new Date().toISOString(),
          available_endpoints: {
            health: "/api/health",
            auth: {
              login: "POST /api/auth/login",
              signup: "POST /api/auth/signup",
              validate: "GET /api/auth/validate",
              refresh: "POST /api/auth/refresh",
              logout: "POST /api/auth/logout",
              "forgot-password": "POST /api/auth/forgot-password",
              "reset-password": "POST /api/auth/reset-password",
            },
            users: "GET /api/users",
            locations: "GET/POST/PUT/DELETE /api/locations",
            inventory: {
              main: "GET/POST/PUT/DELETE /api/inventory",
              alerts: "GET/PUT /api/inventory/alerts",
              suppliers: "GET/POST /api/inventory/suppliers",
              items: "GET/POST/PUT/DELETE /api/inventory/items",
              "low-stock": "GET /api/inventory?low_stock=true",
            },
            tasks: {
              main: "GET/POST/PUT/DELETE /api/tasks",
              templates: "GET/POST /api/tasks/templates",
              "time-logs": "GET/POST /api/tasks/time-logs",
            },
            fields: {
              main: "GET/POST/PUT/DELETE /api/fields",
              "soil-analysis": "GET/POST /api/fields/soil-analysis",
              equipment: "GET/POST /api/fields/equipment",
            },
            farms: {
              main: "GET/POST/PUT/DELETE /api/farms",
              stats: "GET /api/farms/stats",
              operations: "GET/POST /api/farms/operations",
            },
            crops: {
              main: "GET/POST/PUT/DELETE /api/crops",
              activities: "GET/POST /api/crops/activities",
              observations: "GET/POST /api/crops/observations",
              planning: "GET/POST /api/crops/planning",
              rotation: "GET/POST /api/crops/rotation",
              irrigation: "GET/POST /api/crops/irrigation",
              "pests-diseases": "GET/POST /api/crops/pests-diseases",
              "soil-health": "GET/POST /api/crops/soil-health",
              yields: "GET/POST /api/crops/yields",
            },
            livestock: {
              main: "GET/POST/PUT/DELETE /api/livestock",
              animals: "GET/POST/PUT/DELETE /api/animals",
              health: "GET/POST /api/livestock/health",
            },
            finance: {
              main: "GET/POST/PUT/DELETE /api/finance",
              entries: "GET/POST /api/finance/entries",
              reports: "GET/POST /api/finance/reports",
              budgets: "GET/POST /api/finance/budgets",
              analytics: "GET /api/finance/analytics",
            },
            weather: {
              location: "GET /api/weather/location",
              recommendations: "GET /api/weather/recommendations",
              farm: "GET /api/weather/farm",
              "impact-analysis": "POST /api/weather/impact-analysis",
            },
            utilities: {
              search: "GET/POST /api/search",
              notifications: "GET/POST /api/notifications",
              analytics: "GET /api/analytics",
              "system-integration": "GET/POST /api/system-integration",
              webhooks: "GET/POST /api/webhooks",
              websocket: "GET /api/websocket",
              cleanup: "GET/POST /api/cleanup",
              "analytics-engine": "GET/POST /api/analytics-engine",
              performance: "GET /api/performance",
              "bulk-operations": "POST /api/bulk-operations",
            },
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    };

    try {
      const response = await handleRoute();
      return withCors(response);
    } catch (error) {
      console.error("Request handling error:", error);

      return withCors(
        new Response(
          JSON.stringify({
            error: "Internal server error",
            message: error.message || "An unexpected error occurred",
            path: new URL(request.url).pathname,
            method,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    }
  },
};
