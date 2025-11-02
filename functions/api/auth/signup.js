import { AuthUtils, createErrorResponse } from '../_auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = new AuthUtils(env);

  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return createErrorResponse('Email, password, and name required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400);
    }

    // Check if user already exists
    const { results: existingUsers } = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).all();

    if (existingUsers && existingUsers.length > 0) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash password
    const passwordHash = await auth.hashPassword(password);

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user in database
    await env.DB.prepare(
      'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
    ).bind(userId, email, name, passwordHash).run();

    // Generate JWT token
    const token = auth.generateToken(userId, email);

    // Return user data and token
    const user = {
      id: userId,
      email,
      name,
      created_at: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      user,
      token,
      message: 'User created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return createErrorResponse('Internal server error: ' + error.message, 500);
  }
}