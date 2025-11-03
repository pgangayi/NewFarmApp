import { AuthUtils, createErrorResponse, createSuccessResponse } from '../_auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = new AuthUtils(env);

  try {
    const body = await request.json();
    const { token, newPassword } = body;

    console.log('Password reset with token:', token ? 'provided' : 'missing');

    if (!token || !newPassword) {
      return createErrorResponse('Token and new password are required', 400);
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return createErrorResponse('Password must be at least 8 characters long', 400);
    }

    // Find valid reset token
    const { results } = await env.DB.prepare(`
      SELECT prt.user_id, u.email 
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = ? 
        AND prt.expires_at > datetime('now')
        AND prt.used_at IS NULL
    `).bind(token).all();

    if (!results || results.length === 0) {
      console.log('Invalid or expired reset token');
      return createErrorResponse('Invalid or expired reset token', 400);
    }

    const resetData = results[0];
    console.log('Valid reset token found for user:', resetData.email);

    // Hash the new password
    const newPasswordHash = await auth.hashPassword(newPassword);

    // Update user's password
    await env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(newPasswordHash, resetData.user_id).run();

    // Mark token as used
    await env.DB.prepare(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = ?'
    ).bind(token).run();

    console.log('Password reset successful for user:', resetData.email);

    return createSuccessResponse({
      message: 'Password has been reset successfully',
      status: 'success'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return createErrorResponse('Internal server error: ' + error.message, 500);
  }
}