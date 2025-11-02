import { AuthUtils } from './_auth.js';

export async function onRequest(context) {
  const { env } = context;
  const auth = new AuthUtils(env);

  try {
    console.log('Seed endpoint called - attempting to create test user');

    // Check if test user already exists
    const { results: existingUser } = await env.DB.prepare(
      'SELECT id, email FROM users WHERE email = ?'
    ).bind('test@example.com').all();

    if (existingUser && existingUser.length > 0) {
      console.log('Test user already exists:', existingUser[0]);
      return new Response(JSON.stringify({
        message: 'Test user already exists',
        user: existingUser[0],
        credentials: {
          email: 'test@example.com',
          password: 'TestPassword123!'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Creating test user...');

    // Hash password for test user
    const passwordHash = await auth.hashPassword('TestPassword123!');
    console.log('Password hashed');

    // Create test user
    const userId = `user_${Date.now()}_test`;
    const { success, error } = await env.DB.prepare(
      'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
    ).bind(userId, 'test@example.com', 'Test User', passwordHash).run();

    if (error) {
      console.error('Insert error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to create user',
        details: error
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Test user created successfully');

    return new Response(JSON.stringify({
      message: 'Test user created successfully',
      userId,
      credentials: {
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: 'Test User'
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Seed error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to seed database',
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
