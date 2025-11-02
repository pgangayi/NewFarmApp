export async function onRequest(context) {
  const { env } = context;

  try {
    // Test basic database connectivity
    const { results, error } = await env.DB.prepare(
      'SELECT name FROM sqlite_master WHERE type="table"'
    ).all();

    if (error) {
      return new Response(JSON.stringify({ 
        error: 'Database error', 
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check farms table schema
    const { results: farmSchema } = await env.DB.prepare(
      'PRAGMA table_info(farms)'
    ).all();

    // Check users table schema
    const { results: userSchema } = await env.DB.prepare(
      'PRAGMA table_info(users)'
    ).all();

    // Count users
    const { results: userCount } = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).all();

    // Count farms
    const { results: farmCount } = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM farms'
    ).all();

    return new Response(JSON.stringify({
      status: 'ok',
      tables: results,
      schemas: {
        farms: farmSchema,
        users: userSchema
      },
      counts: {
        users: userCount?.[0]?.count || 0,
        farms: farmCount?.[0]?.count || 0
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
