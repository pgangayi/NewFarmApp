import { AuthUtils, createErrorResponse, createSuccessResponse } from '../_auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = new AuthUtils(env);

  try {
    const body = await request.json();
    const { email } = body;

    console.log('Password reset request for email:', email);

    if (!email) {
      return createErrorResponse('Email is required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400);
    }

    // Check if user exists
    const { results } = await env.DB.prepare(
      'SELECT id, email FROM users WHERE email = ?'
    ).bind(email).all();

    // Always return success even if user doesn't exist (security best practice)
    const response = {
      message: 'If an account with that email exists, a password reset token has been generated.',
      status: 'sent'
    };

    if (results && results.length > 0) {
      const user = results[0];
      console.log('User found, generating reset token for:', user.email);

      // Generate secure reset token
      const resetToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Clean up any existing unused tokens for this user
      await env.DB.prepare(
        'DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL'
      ).bind(user.id).run();

      // Store new reset token
      await env.DB.prepare(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
      ).bind(user.id, resetToken, expiresAt.toISOString()).run();

      // In a real application, send email here
      // For demo purposes, we'll return the token
      response.resetToken = resetToken;
      response.expiresAt = expiresAt.toISOString();
      response.message = 'Password reset token generated. In production, this would be sent via email.';

      console.log('Reset token generated for user:', user.email);
    }

    // Log the response for debugging
    console.log('Password reset response:', response.message);

    return createSuccessResponse(response);

  } catch (error) {
    console.error('Password reset error:', error);
    return createErrorResponse('Internal server error: ' + error.message, 500);
  }
}

// Generate secure token
function generateSecureToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}