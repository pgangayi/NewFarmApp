import { AuthUtils, createErrorResponse } from '../_auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = new AuthUtils(env);

  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Login attempt for email:', email);

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user from database
    console.log('Looking up user:', email);
    const { results } = await env.DB.prepare(
      'SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?'
    ).bind(email).all();

    console.log('Query results:', results);

    if (!results || results.length === 0) {
      console.log('User not found:', email);
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = results[0];
    console.log('User found:', user.email);

    // Verify password
    console.log('Verifying password...');
    const isValidPassword = await auth.verifyPassword(password, user.password_hash);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate JWT token
    console.log('Generating token for user:', user.id);
    const token = auth.generateToken(user.id, user.email);

    // Return user data and token
    const { password_hash, ...userWithoutPassword } = user;
    console.log('Login successful for:', email);
    
    return new Response(JSON.stringify({
      user: userWithoutPassword,
      token,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Internal server error: ' + error.message, 500);
  }
}
