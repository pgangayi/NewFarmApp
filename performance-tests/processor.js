// Artillery processor for custom logic during performance tests
module.exports = {
  // Generate random data for tests
  generateRandomData: function(context, events, done) {
    context.vars.randomInt = Math.floor(Math.random() * 1000);
    context.vars.randomString = Math.random().toString(36).substring(7);
    return done();
  },

  // Log response times for analysis
  logResponseTime: function(requestParams, response, context, ee, next) {
    const responseTime = response.timings.phases.total;
    const statusCode = response.statusCode;

    // Log slow responses (>500ms)
    if (responseTime > 500) {
      console.log(`Slow response: ${responseTime}ms for ${requestParams.url} (status: ${statusCode})`);
    }

    // Log errors
    if (statusCode >= 400) {
      console.log(`Error response: ${statusCode} for ${requestParams.url}`);
    }

    return next();
  },

  // Setup function called before tests start
  beforeRequest: function(requestParams, context, ee, next) {
    // Add timestamp for tracking
    context.vars.timestamp = new Date().toISOString();

    // Add custom headers if needed
    requestParams.headers = requestParams.headers || {};
    requestParams.headers['X-Performance-Test'] = 'true';

    return next();
  },

  // Cleanup function called after tests complete
  afterResponse: function(requestParams, response, context, ee, next) {
    // Store response data for analysis
    if (response.statusCode === 200) {
      context.vars.successCount = (context.vars.successCount || 0) + 1;
    } else {
      context.vars.errorCount = (context.vars.errorCount || 0) + 1;
    }

    return next();
  }
};