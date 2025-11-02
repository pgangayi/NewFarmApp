import { AuthUtils, createErrorResponse, createSuccessResponse } from '../_auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    // Initialize AuthUtils
    const auth = new AuthUtils(env);

    // Get user from token
    const user = await auth.getUserFromToken(request);

    if (!user) {
      return createErrorResponse('Invalid token', 401);
    }

    return createSuccessResponse({
      user: user,
      valid: true
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function onRequestPost(context) {
  // Also support POST requests for validation
  return onRequestGet(context);
}