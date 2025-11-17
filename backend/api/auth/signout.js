import {
  AuthUtils,
  createSuccessResponse,
  createErrorResponse,
} from "../_auth.js";

export async function onRequest(context) {
  const { request } = context;
  const method = request.method;

  if (method === "POST" || method === "GET") {
    return handleSignout(context);
  } else {
    return createErrorResponse("Method not allowed", 405);
  }
}

async function handleSignout(context) {
  const { request, env } = context;

  try {
    // For JWT-based auth, we don't need to do much on the server side
    // since tokens expire naturally. This endpoint is mainly for
    // consistency and potential future refresh token invalidation.

    console.log("User signed out successfully");

    // Return success response
    return createSuccessResponse(
      {
        message: "Signed out successfully",
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    console.error("Sign out error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
