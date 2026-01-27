// Enhanced Error Handling System
// Uses snake_case naming convention throughout

import { z } from 'zod';

// Error severity levels
export enum ERROR_SEVERITY {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ERROR_CATEGORY {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  SYSTEM = 'system',
  USER_INPUT = 'user_input',
  BUSINESS_LOGIC = 'business_logic',
}

// Base error schema
const base_error_schema = z.object({
  id: z.string(),
  message: z.string(),
  code: z.string().optional(),
  severity: z.nativeEnum(ERROR_SEVERITY),
  category: z.nativeEnum(ERROR_CATEGORY),
  timestamp: z.string().datetime(),
  user_id: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
  stack_trace: z.string().optional(),
  retry_count: z.number().default(0),
  is_resolved: z.boolean().default(false),
});

// Error interface
export interface AppError extends z.infer<typeof base_error_schema> {
  id: string;
  message: string;
  code?: string;
  severity: ERROR_SEVERITY;
  category: ERROR_CATEGORY;
  timestamp: string;
  user_id?: string;
  context?: Record<string, any>;
  stack_trace?: string;
  retry_count: number;
  is_resolved: boolean;
}

// Error response schema
const error_response_schema = z.object({
  success: z.literal(false),
  error: base_error_schema,
  request_id: z.string().optional(),
});

// Error response interface
export interface ErrorResponse extends z.infer<typeof error_response_schema> {
  success: false;
  error: AppError;
  request_id?: string;
}

// Error handling configuration
interface ErrorHandlingConfig {
  enable_logging: boolean;
  enable_user_feedback: boolean;
  enable_retry: boolean;
  max_retry_attempts: number;
  retry_delay_ms: number;
  enable_error_reporting: boolean;
  error_reporting_endpoint?: string;
}

const default_config: ErrorHandlingConfig = {
  enable_logging: true,
  enable_user_feedback: true,
  enable_retry: true,
  max_retry_attempts: 3,
  retry_delay_ms: 1000,
  enable_error_reporting: true,
  error_reporting_endpoint: '/api/errors',
};

// Enhanced error handler class
export class EnhancedErrorHandler {
  private config: ErrorHandlingConfig;
  private error_store: Map<string, AppError> = new Map();
  private error_callbacks: Map<ERROR_CATEGORY, ((error: AppError) => void)[]> = new Map();

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = { ...default_config, ...config };
    this.setup_global_handlers();
  }

  // Setup global error handlers
  private setup_global_handlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', event => {
        this.handle_error({
          message: 'Unhandled promise rejection',
          severity: ERROR_SEVERITY.HIGH,
          category: ERROR_CATEGORY.SYSTEM,
          context: { reason: event.reason },
          stack_trace: event.reason?.stack,
        });
      });

      // Handle uncaught errors
      window.addEventListener('error', event => {
        this.handle_error({
          message: event.message || 'Uncaught error',
          severity: ERROR_SEVERITY.CRITICAL,
          category: ERROR_CATEGORY.SYSTEM,
          context: { filename: event.filename, lineno: event.lineno, colno: event.colno },
          stack_trace: event.error?.stack,
        });
      });
    }
  }

  // Create a new error
  create_error(params: Partial<AppError>): AppError {
    const error: AppError = {
      id: this.generate_error_id(),
      timestamp: new Date().toISOString(),
      retry_count: 0,
      is_resolved: false,
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORY.SYSTEM,
      message: 'Unknown error occurred',
      ...params,
    };

    // Validate error structure
    const validation_result = base_error_schema.safeParse(error);
    if (!validation_result.success) {
      console.error('Invalid error structure:', validation_result.error);
      // Create a fallback error
      return {
        id: this.generate_error_id(),
        message: 'Error validation failed',
        severity: ERROR_SEVERITY.HIGH,
        category: ERROR_CATEGORY.SYSTEM,
        timestamp: new Date().toISOString(),
        retry_count: 0,
        is_resolved: false,
      };
    }

    return validation_result.data;
  }

  // Handle an error
  handle_error(params: Partial<AppError>): AppError {
    const error = this.create_error(params);

    // Store error
    this.error_store.set(error.id, error);

    // Log error
    if (this.config.enable_logging) {
      this.log_error(error);
    }

    // Execute callbacks
    this.execute_callbacks(error);

    // Report error if enabled
    if (this.config.enable_error_reporting) {
      this.report_error(error);
    }

    // Show user feedback if enabled
    if (this.config.enable_user_feedback) {
      this.show_user_feedback(error);
    }

    return error;
  }

  // Handle API error response
  handle_api_error(response: unknown): AppError {
    try {
      const parsed_response = error_response_schema.parse(response);
      return this.handle_error(parsed_response.error);
    } catch (parse_error) {
      return this.handle_error({
        message: 'Failed to parse API error response',
        severity: ERROR_SEVERITY.HIGH,
        category: ERROR_CATEGORY.NETWORK,
        context: {
          response,
          parse_error: parse_error instanceof Error ? parse_error.message : String(parse_error),
        },
      });
    }
  }

  // Retry an operation
  async retry_operation<T>(
    operation: () => Promise<T>,
    error_category: ERROR_CATEGORY,
    context?: Record<string, any>
  ): Promise<T> {
    if (!this.config.enable_retry) {
      return operation();
    }

    let last_error: AppError | null = null;

    for (let attempt = 1; attempt <= this.config.max_retry_attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        last_error = this.handle_error({
          message: error instanceof Error ? error.message : 'Operation failed',
          severity: ERROR_SEVERITY.MEDIUM,
          category: error_category,
          context: { ...context, attempt, max_attempts: this.config.max_retry_attempts },
          stack_trace: error instanceof Error ? error.stack : undefined,
          retry_count: attempt,
        });

        if (attempt < this.config.max_retry_attempts) {
          await this.delay(this.config.retry_delay_ms * attempt);
        }
      }
    }

    // All retries failed, throw the last error
    throw new Error(last_error?.message || 'Operation failed after all retries');
  }

  // Register error callback
  register_callback(category: ERROR_CATEGORY, callback: (error: AppError) => void): void {
    if (!this.error_callbacks.has(category)) {
      this.error_callbacks.set(category, []);
    }
    this.error_callbacks.get(category)!.push(callback);
  }

  // Unregister error callback
  unregister_callback(category: ERROR_CATEGORY, callback: (error: AppError) => void): void {
    const callbacks = this.error_callbacks.get(category);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Get error by ID
  get_error(id: string): AppError | undefined {
    return this.error_store.get(id);
  }

  // Get all errors
  get_all_errors(): AppError[] {
    return Array.from(this.error_store.values());
  }

  // Get errors by category
  get_errors_by_category(category: ERROR_CATEGORY): AppError[] {
    return this.get_all_errors().filter(error => error.category === category);
  }

  // Get errors by severity
  get_errors_by_severity(severity: ERROR_SEVERITY): AppError[] {
    return this.get_all_errors().filter(error => error.severity === severity);
  }

  // Mark error as resolved
  resolve_error(id: string): boolean {
    const error = this.error_store.get(id);
    if (error) {
      error.is_resolved = true;
      return true;
    }
    return false;
  }

  // Clear resolved errors
  clear_resolved_errors(): number {
    let cleared_count = 0;
    for (const [id, error] of this.error_store.entries()) {
      if (error.is_resolved) {
        this.error_store.delete(id);
        cleared_count++;
      }
    }
    return cleared_count;
  }

  // Get error statistics
  get_error_stats(): Record<string, number> {
    const errors = this.get_all_errors();
    const stats: Record<string, number> = {
      total_errors: errors.length,
      unresolved_errors: errors.filter(e => !e.is_resolved).length,
      critical_errors: errors.filter(e => e.severity === ERROR_SEVERITY.CRITICAL).length,
      high_errors: errors.filter(e => e.severity === ERROR_SEVERITY.HIGH).length,
      medium_errors: errors.filter(e => e.severity === ERROR_SEVERITY.MEDIUM).length,
      low_errors: errors.filter(e => e.severity === ERROR_SEVERITY.LOW).length,
    };

    // Add category counts
    Object.values(ERROR_CATEGORY).forEach(category => {
      stats[`${category}_errors`] = errors.filter(e => e.category === category).length;
    });

    return stats;
  }

  // Private methods
  private generate_error_id(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log_error(error: AppError): void {
    const log_level = this.get_log_level(error.severity);
    console[log_level](`[${error.severity.toUpperCase()}] ${error.category}: ${error.message}`, {
      id: error.id,
      code: error.code,
      context: error.context,
      timestamp: error.timestamp,
    });
  }

  private get_log_level(severity: ERROR_SEVERITY): 'error' | 'warn' | 'info' | 'debug' {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
      case ERROR_SEVERITY.HIGH:
        return 'error';
      case ERROR_SEVERITY.MEDIUM:
        return 'warn';
      case ERROR_SEVERITY.LOW:
        return 'info';
      default:
        return 'debug';
    }
  }

  private execute_callbacks(error: AppError): void {
    const callbacks = this.error_callbacks.get(error.category);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(error);
        } catch (callback_error) {
          console.error('Error in error callback:', callback_error);
        }
      });
    }
  }

  private async report_error(error: AppError): Promise<void> {
    if (!this.config.error_reporting_endpoint) {
      return;
    }

    try {
      await fetch(this.config.error_reporting_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error,
          user_agent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (reporting_error) {
      console.error('Failed to report error:', reporting_error);
    }
  }

  private show_user_feedback(error: AppError): void {
    // Only show user feedback for high and critical errors
    if (error.severity === ERROR_SEVERITY.HIGH || error.severity === ERROR_SEVERITY.CRITICAL) {
      // You can integrate with your notification system here
      console.warn('User feedback would be shown for:', error.message);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
export const error_handler = new EnhancedErrorHandler();

// Utility functions for common error scenarios
export const handle_network_error = (error: unknown, context?: Record<string, any>): AppError => {
  return error_handler.handle_error({
    message: error instanceof Error ? error.message : 'Network error occurred',
    severity: ERROR_SEVERITY.HIGH,
    category: ERROR_CATEGORY.NETWORK,
    context,
    stack_trace: error instanceof Error ? error.stack : undefined,
  });
};

export const handle_validation_error = (
  message: string,
  context?: Record<string, any>
): AppError => {
  return error_handler.handle_error({
    message,
    severity: ERROR_SEVERITY.MEDIUM,
    category: ERROR_CATEGORY.VALIDATION,
    context,
  });
};

export const handle_auth_error = (message: string, context?: Record<string, any>): AppError => {
  return error_handler.handle_error({
    message,
    severity: ERROR_SEVERITY.HIGH,
    category: ERROR_CATEGORY.AUTHENTICATION,
    context,
  });
};

export const handle_database_error = (error: unknown, context?: Record<string, any>): AppError => {
  return error_handler.handle_error({
    message: error instanceof Error ? error.message : 'Database error occurred',
    severity: ERROR_SEVERITY.HIGH,
    category: ERROR_CATEGORY.DATABASE,
    context,
    stack_trace: error instanceof Error ? error.stack : undefined,
  });
};

export const handle_user_input_error = (
  message: string,
  context?: Record<string, any>
): AppError => {
  return error_handler.handle_error({
    message,
    severity: ERROR_SEVERITY.LOW,
    category: ERROR_CATEGORY.USER_INPUT,
    context,
  });
};

// React error boundary integration
export const create_error_boundary_fallback = (error: AppError) => {
  return {
    id: error.id,
    message: error.message,
    severity: error.severity,
    category: error.category,
    timestamp: error.timestamp,
    context: error.context,
  };
};

// Export types and utilities
export type { ErrorHandlingConfig };
export { base_error_schema, error_response_schema };
