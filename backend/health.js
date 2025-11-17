// Health check endpoint for monitoring
export async function onRequest(context) {
  const { env } = context;

  try {
    // Basic health checks
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {}
    };

    // Check D1 database connection
    try {
      const result = await env.DB.prepare('SELECT 1 as test').run();
      checks.checks.d1_database = result.success ? 'healthy' : 'unhealthy';
    } catch (error) {
      checks.checks.d1_database = 'unhealthy';
    }

    // Check JWT_SECRET is configured
    if (env.JWT_SECRET && env.JWT_SECRET !== 'your-jwt-secret-change-in-production') {
      checks.checks.jwt_auth = 'configured';
    } else {
      checks.checks.jwt_auth = 'not_configured';
    }

    // Check KV (if configured)
    if (env.RATE_LIMIT_KV) {
      try {
        await env.RATE_LIMIT_KV.put('health_check', 'ok', { expirationTtl: 60 });
        checks.checks.kv = 'healthy';
      } catch (error) {
        checks.checks.kv = 'unhealthy';
      }
    }

    // Check Workers environment
    checks.checks.workers_environment = 'healthy';

    // Determine overall status
    const criticalServices = ['d1_database', 'jwt_auth'];
    const criticalHealthy = criticalServices.every(service => 
      checks.checks[service] === 'healthy' || checks.checks[service] === 'configured'
    );
    
    const allServicesHealthy = Object.values(checks.checks).every(status => 
      status === 'healthy' || status === 'configured'
    );
    
    checks.status = criticalHealthy ? 
      (allServicesHealthy ? 'healthy' : 'degraded') : 'unhealthy';

    return new Response(JSON.stringify(checks, null, 2), {
      headers: { 'Content-Type': 'application/json' },
      status: checks.status === 'unhealthy' ? 503 : (checks.status === 'degraded' ? 200 : 200)
    });

  } catch (error) {
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  }
}