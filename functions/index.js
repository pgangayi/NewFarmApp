import { onRequestPost as signoutHandler } from "./api/auth/signout.js";

// Import all API handlers
import { onRequestPost as forgotPasswordHandler } from "./api/auth/forgot-password.js";
import { onRequestPost as loginHandler } from "./api/auth/login.js";
import { onRequestPost as signupHandler } from "./api/auth/signup.js";
import { onRequestPost as resetPasswordHandler } from "./api/auth/reset-password.js";
import { onRequestGet as validateHandler } from "./api/auth/validate.js";
import { onRequest as farmsHandler } from "./api/farms.js";
import { WebSocketHandler } from "./api/websocket.js";
import { onRequest as searchHandler } from "./api/search.js";
import { onRequest as notificationsHandler } from "./api/notifications.js";
import { onRequest as performanceHandler } from "./api/performance.js";
import { onRequest as bulkOperationsHandler } from "./api/bulk-operations.js";

import { onRequest as healthHandler } from "./health.js";

// Initialize WebSocket handler
let websocketHandler;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    // Initialize WebSocket handler if not already done
    if (!websocketHandler) {
      websocketHandler = new WebSocketHandler(env);
    }

    // Handle WebSocket upgrades
    if (
      pathname === "/api/websocket" &&
      request.headers.get("Upgrade") === "websocket"
    ) {
      return await websocketHandler.handleUpgrade(request);
    }

    // CORS preflight requests
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Route matching
    try {
      let handler;

      if (pathname === "/api/auth/forgot-password") {
        if (method === "POST") {
          handler = forgotPasswordHandler;
        } else {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } else if (pathname === "/api/auth/login") {
        if (method === "POST") {
          handler = loginHandler;
        } else {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } else if (pathname === "/api/auth/signup") {
        if (method === "POST") {
          handler = signupHandler;
        } else {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } else if (pathname === "/api/auth/validate") {
        if (method === "GET") {
          handler = validateHandler;
        } else {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } else if (pathname === "/api/auth/signout") {
        if (method === "POST" || method === "GET") {
          handler = signoutHandler;
        } else {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } else if (pathname === "/api/auth/reset-password") {
        if (method === "POST") {
          handler = resetPasswordHandler;
        } else {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } else if (pathname === "/api/farms") {
        handler = farmsHandler;
      } else if (pathname === "/api/health") {
        if (method === "GET") {
          handler = healthHandler;
        } else {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } else if (pathname === "/api/search") {
        handler = searchHandler;
      } else if (pathname === "/api/notifications") {
        handler = notificationsHandler;
      } else if (pathname === "/api/performance") {
        handler = performanceHandler;
      } else if (pathname === "/api/bulk-operations") {
        handler = bulkOperationsHandler;
      } else {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: `Route ${method} ${pathname} not found`,
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      // Execute handler with proper context
      const context = { request, env, ctx };
      const response = await handler(context);

      // Add CORS headers to all responses
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      responseHeaders.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};
