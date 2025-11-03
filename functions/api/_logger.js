// Enhanced Logging Utility for Farmers Boot
// Provides environment-based logging levels and consistent formatting

export class Logger {
  constructor(environment = 'development') {
    this.environment = environment;
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    };
    
    this.currentLevel = this.getLogLevel();
  }

  // Get appropriate log level based on environment
  getLogLevel() {
    if (this.environment === 'production') {
      return this.levels.ERROR; // Only errors in production
    }
    if (this.environment === 'test') {
      return this.levels.WARN; // Warnings and errors in tests
    }
    return this.levels.INFO; // Info level for development
  }

  // Check if message should be logged
  shouldLog(level) {
    return level <= this.currentLevel;
  }

  // Format log message with timestamp and context
  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  // Error logging
  error(message, context = {}) {
    if (this.shouldLog(this.levels.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context));
    }
  }

  // Warning logging
  warn(message, context = {}) {
    if (this.shouldLog(this.levels.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  // Info logging
  info(message, context = {}) {
    if (this.shouldLog(this.levels.INFO)) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  // Debug logging
  debug(message, context = {}) {
    if (this.shouldLog(this.levels.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }

  // Trace logging
  trace(message, context = {}) {
    if (this.shouldLog(this.levels.TRACE)) {
      console.trace(this.formatMessage('TRACE', message, context));
    }
  }

  // API request logging with sanitized data
  logRequest(method, url, userId = null, duration = null, status = null) {
    const context = {
      method,
      url: this.sanitizeUrl(url),
      userId,
      duration: duration ? `${duration}ms` : null,
      status
    };
    
    this.info('API Request', context);
  }

  // Database operation logging
  logDatabase(operation, table, duration = null, success = true) {
    const context = {
      operation,
      table,
      duration: duration ? `${duration}ms` : null,
      success
    };
    
    if (success) {
      this.debug('Database Operation', context);
    } else {
      this.error('Database Operation Failed', context);
    }
  }

  // Authentication event logging
  logAuth(event, userId, success = true, details = {}) {
    const context = {
      event,
      userId: userId ? userId.substring(0, 8) + '...' : null, // Partial user ID for privacy
      success,
      ...details
    };
    
    if (success) {
      this.info('Auth Event', context);
    } else {
      this.warn('Auth Event Failed', context);
    }
  }

  // Sanitize URL for logging (remove sensitive parameters)
  sanitizeUrl(url) {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Remove sensitive parameters
      const sensitiveParams = ['password', 'token', 'key', 'secret'];
      sensitiveParams.forEach(param => {
        if (params.has(param)) {
          params.set(param, '[REDACTED]');
        }
      });
      
      urlObj.search = params.toString();
      return urlObj.toString();
    } catch (error) {
      return url; // Return original if parsing fails
    }
  }

  // Performance logging
  logPerformance(operation, startTime, details = {}) {
    const duration = Date.now() - startTime;
    const context = {
      operation,
      duration: `${duration}ms`,
      ...details
    };
    
    if (duration > 1000) {
      this.warn('Slow Operation', context);
    } else {
      this.debug('Performance Metric', context);
    }
  }
}

// Create and export a default logger instance
export const createLogger = (env = 'development') => new Logger(env);

// Export default logger with development environment
export default createLogger('development');