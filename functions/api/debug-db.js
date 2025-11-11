// DEPRECATED: Debug Database Endpoint - SECURITY REMEDIATION
// This endpoint has been DISABLED for production security
// Date: November 10, 2025

// 🚨 SECURITY ALERT: This file contained debug endpoints that exposed
// database schema, user counts, and internal system information.
// This poses a CRITICAL security risk and has been deprecated.

// PRODUCTION SECURITY CONTROLS IMPLEMENTED:
// 1. Debug endpoints removed from production
// 2. Database schema information now protected
// 3. Sensitive system information no longer exposed
// 4. Production monitoring implemented via proper logging

// REPLACEMENT: Use production monitoring endpoints
// - Health checks: /api/health
// - Status monitoring: /api/status
// - Database health: Use proper monitoring tools

export async function onRequest(context) {
  // SECURITY FIX: Always return 404 for debug endpoints
  // This prevents any potential exploitation of debug information

  const { request } = context;
  const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
  const userAgent = request.headers.get("User-Agent") || "unknown";

  // Log attempted access to debug endpoint for security monitoring
  console.warn("SECURITY: Blocked access attempt to debug endpoint", {
    timestamp: new Date().toISOString(),
    clientIP,
    userAgent,
    method: request.method,
    url: request.url,
    severity: "HIGH",
  });

  return new Response(
    JSON.stringify({
      error: "Endpoint not found",
      message: "Debug endpoints are not available in production",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      },
    }
  );
}

// ADDITIONAL SECURITY NOTES:
// - Original debug code exposed table schemas, user counts, and system structure
// - This information could be used for targeted attacks
// - Production deployments should never include debug endpoints
// - Use proper monitoring and health check endpoints instead
// - Audit logs should track any attempts to access deprecated endpoints
