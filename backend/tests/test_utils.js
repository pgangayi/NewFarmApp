/**
 * Unit tests for _utils.js
 * Tests API utilities, validation, sanitization, and common functions
 */

import { APIUtils, Responses, Validation } from '../api/_utils.js';

// Mock dependencies
jest.mock('../api/_logger.js', () => ({
  createLogger: jest.fn(() => ({
    logPerformance: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    logDatabase: jest.fn()
  }))
}));

jest.mock('../api/_auth.js', () => ({
  AuthUtils: jest.fn().mockImplementation(() => ({
    getUserFromToken: jest.fn(),
    hasFarmAccess: jest.fn()
  })),
  createUnauthorizedResponse: jest.fn(() => ({ status: 401 })),
  createErrorResponse: jest.fn((message, status) => ({ status, message })),
  createSuccessResponse: jest.fn((data, status) => ({ status: status || 200, data }))
}));

jest.mock('../api/_audit.js', () => ({
  AuditLogger: jest.fn().mockImplementation(() => ({
    logOperation: jest.fn()
  }))
}));

describe('APIUtils', () => {
  let apiUtils;
  let mockEnv;
  let mockRequest;
  let mockUser;

  beforeEach(() => {
    mockEnv = {
      DB: {
        prepare: jest.fn(() => ({
          bind: jest.fn(() => ({
            run: jest.fn(() => ({ changes: 1, meta: { last_row_id: 123 } })),
            all: jest.fn(() => ({ results: [{ id: 1 }] }))
          }))
        }))
      }
    };

    mockRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
      headers: new Map()
    };

    mockUser = { id: 'user-123' };

    apiUtils = new APIUtils(mockEnv);
  });

  describe('handleRequest', () => {
    it('should handle successful requests', async () => {
      const handlers = {
        GET: jest.fn().mockResolvedValue({ status: 200, data: 'success' })
      };

      apiUtils.auth.getUserFromToken.mockResolvedValue(mockUser);

      const result = await apiUtils.handleRequest(mockRequest, handlers);

      expect(result).toEqual({ status: 200, data: 'success' });
      expect(handlers.GET).toHaveBeenCalledWith({
        request: mockRequest,
        user: mockUser,
        url: expect.any(URL),
        env: mockEnv
      });
    });

    it('should return 405 for unsupported methods', async () => {
      const handlers = { POST: jest.fn() };
      apiUtils.auth.getUserFromToken.mockResolvedValue(mockUser);

      const result = await apiUtils.handleRequest(mockRequest, handlers);

      expect(result.status).toBe(405);
      expect(result.message).toBe('Method not allowed');
    });

    it('should handle authentication errors', async () => {
      const handlers = { GET: jest.fn() };
      apiUtils.auth.getUserFromToken.mockRejectedValue(new Error('Invalid token'));

      const result = await apiUtils.handleRequest(mockRequest, handlers);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Internal server error');
    });
  });

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      apiUtils.auth.getUserFromToken.mockResolvedValue(mockUser);

      const result = await apiUtils.requireAuth(mockRequest);

      expect(result).toEqual({ user: mockUser });
    });

    it('should return unauthorized when no user and required', async () => {
      apiUtils.auth.getUserFromToken.mockResolvedValue(null);

      const result = await apiUtils.requireAuth(mockRequest, true);

      expect(result).toEqual({ unauthorized: true });
    });

    it('should return user as null when not required', async () => {
      apiUtils.auth.getUserFromToken.mockResolvedValue(null);

      const result = await apiUtils.requireAuth(mockRequest, false);

      expect(result).toEqual({ user: null });
    });
  });

  describe('requireFarmAccess', () => {
    it('should grant access when user has farm access', async () => {
      apiUtils.auth.hasFarmAccess.mockResolvedValue(true);

      const result = await apiUtils.requireFarmAccess('user-123', 'farm-456');

      expect(result).toEqual({ accessGranted: true });
    });

    it('should deny access when user lacks farm access', async () => {
      apiUtils.auth.hasFarmAccess.mockResolvedValue(false);

      const result = await apiUtils.requireFarmAccess('user-123', 'farm-456');

      expect(result).toEqual({ accessDenied: true });
    });
  });

  describe('validateRequiredFields', () => {
    it('should pass validation with all required fields', () => {
      const body = { name: 'Test', email: 'test@example.com' };
      const requiredFields = ['name', 'email'];

      const result = apiUtils.validateRequiredFields(body, requiredFields);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).toEqual([]);
      expect(result.errors).toEqual({});
    });

    it('should fail validation with missing fields', () => {
      const body = { name: 'Test' };
      const requiredFields = ['name', 'email'];

      const result = apiUtils.validateRequiredFields(body, requiredFields);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual(['email']);
      expect(result.errors).toEqual({ email: 'email is required' });
    });

    it('should fail validation with empty strings', () => {
      const body = { name: '', email: 'test@example.com' };
      const requiredFields = ['name', 'email'];

      const result = apiUtils.validateRequiredFields(body, requiredFields);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual(['name']);
    });

    it('should fail validation with null values', () => {
      const body = { name: null, email: 'test@example.com' };
      const requiredFields = ['name', 'email'];

      const result = apiUtils.validateRequiredFields(body, requiredFields);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual(['name']);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize string inputs by removing script tags', () => {
      const input = { name: '<script>alert("xss")</script>Test', email: 'test@example.com' };

      const result = apiUtils.sanitizeInput(input);

      expect(result.name).toBe('Test');
      expect(result.email).toBe('test@example.com');
    });

    it('should sanitize javascript: protocol', () => {
      const input = { url: 'javascript:alert("xss")' };

      const result = apiUtils.sanitizeInput(input);

      expect(result.url).toBe('');
    });

    it('should trim whitespace', () => {
      const input = { name: '  Test  ' };

      const result = apiUtils.sanitizeInput(input);

      expect(result.name).toBe('Test');
    });

    it('should preserve non-string values', () => {
      const input = { count: 42, active: true };

      const result = apiUtils.sanitizeInput(input);

      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
    });

    it('should only process allowed fields when specified', () => {
      const input = { name: 'Test', secret: 'hidden' };

      const result = apiUtils.sanitizeInput(input, ['name']);

      expect(result.name).toBe('Test');
      expect(result.secret).toBeUndefined();
    });

    it('should return empty object for invalid input', () => {
      expect(apiUtils.sanitizeInput(null)).toEqual({});
      expect(apiUtils.sanitizeInput('string')).toEqual({});
      expect(apiUtils.sanitizeInput(42)).toEqual({});
    });
  });

  describe('formatResponse', () => {
    it('should format successful responses', () => {
      const data = { id: 1, name: 'Test' };

      const result = apiUtils.formatResponse(data);

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ data });
    });

    it('should include message when provided', () => {
      const data = { id: 1 };
      const message = 'Created successfully';

      const result = apiUtils.formatResponse(data, 201, message);

      expect(result.status).toBe(201);
      expect(result.data).toEqual({ data, message });
    });
  });

  describe('formatError', () => {
    it('should format error responses', () => {
      const result = apiUtils.formatError('Invalid input', 400);

      expect(result.status).toBe(400);
      expect(result.message).toBe('Invalid input');
    });

    it('should include field name in error message', () => {
      const result = apiUtils.formatError('is required', 400, 'name');

      expect(result.message).toBe('name: is required');
    });
  });

  describe('executeQuery', () => {
    it('should execute SELECT queries successfully', async () => {
      const query = 'SELECT * FROM test_table';
      const params = [];

      const result = await apiUtils.executeQuery(query, params, 'query');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: 1 }]);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should execute mutation queries successfully', async () => {
      const query = 'INSERT INTO test_table (name) VALUES (?)';
      const params = ['Test'];

      const result = await apiUtils.executeQuery(query, params, 'run');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ changes: 1, last_row_id: 123 });
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle database errors', async () => {
      mockEnv.DB.prepare.mockReturnValue({
        bind: jest.fn(() => ({
          run: jest.fn(() => Promise.reject(new Error('Database error')))
        }))
      });

      const query = 'INSERT INTO test_table (name) VALUES (?)';
      const params = ['Test'];

      const result = await apiUtils.executeQuery(query, params, 'run');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPaginationParams', () => {
    it('should return default pagination params', () => {
      const url = new URL('https://api.example.com/test');

      const result = apiUtils.getPaginationParams(url);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        offset: 0
      });
    });

    it('should parse pagination from query params', () => {
      const url = new URL('https://api.example.com/test?page=2&limit=20');

      const result = apiUtils.getPaginationParams(url);

      expect(result).toEqual({
        page: 2,
        limit: 20,
        offset: 20
      });
    });

    it('should enforce minimum values', () => {
      const url = new URL('https://api.example.com/test?page=0&limit=0');

      const result = apiUtils.getPaginationParams(url);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
      expect(result.offset).toBe(0);
    });

    it('should cap limit at 100', () => {
      const url = new URL('https://api.example.com/test?limit=200');

      const result = apiUtils.getPaginationParams(url);

      expect(result.limit).toBe(100);
    });
  });

  describe('buildWhereClause', () => {
    it('should build WHERE clause with valid filters', () => {
      const filters = { status: 'active', type: 'test' };
      const allowedFilters = ['status', 'type'];

      const result = apiUtils.buildWhereClause(filters, allowedFilters);

      expect(result.whereClause).toBe('WHERE status = ? AND type = ?');
      expect(result.params).toEqual(['active', 'test']);
    });

    it('should ignore filters not in allowed list', () => {
      const filters = { status: 'active', secret: 'hidden' };
      const allowedFilters = ['status'];

      const result = apiUtils.buildWhereClause(filters, allowedFilters);

      expect(result.whereClause).toBe('WHERE status = ?');
      expect(result.params).toEqual(['active']);
    });

    it('should ignore null, undefined, and empty values', () => {
      const filters = { status: 'active', name: null, type: undefined, category: '' };
      const allowedFilters = ['status', 'name', 'type', 'category'];

      const result = apiUtils.buildWhereClause(filters, allowedFilters);

      expect(result.whereClause).toBe('WHERE status = ?');
      expect(result.params).toEqual(['active']);
    });

    it('should return empty WHERE clause when no valid filters', () => {
      const filters = {};
      const allowedFilters = ['status'];

      const result = apiUtils.buildWhereClause(filters, allowedFilters);

      expect(result.whereClause).toBe('');
      expect(result.params).toEqual([]);
    });
  });
});

describe('Responses', () => {
  it('should create success responses', () => {
    const data = { id: 1 };
    const result = Responses.success(data, 'Success message');

    expect(result.status).toBe(200);
    expect(result.data).toEqual({ data, message: 'Success message' });
  });

  it('should create created responses', () => {
    const data = { id: 1 };
    const result = Responses.created(data);

    expect(result.status).toBe(201);
    expect(result.data).toEqual({ data, message: 'Created successfully' });
  });

  it('should create error responses', () => {
    const result = Responses.badRequest('Invalid input', 'email');

    expect(result.status).toBe(400);
    expect(result.message).toBe('email: Invalid input');
  });

  it('should create unauthorized responses', () => {
    const result = Responses.unauthorized();

    expect(result.status).toBe(401);
  });

  it('should create forbidden responses', () => {
    const result = Responses.forbidden('Access denied');

    expect(result.status).toBe(403);
    expect(result.message).toBe('Access denied');
  });

  it('should create not found responses', () => {
    const result = Responses.notFound('Resource not found');

    expect(result.status).toBe(404);
    expect(result.message).toBe('Resource not found');
  });

  it('should create internal error responses', () => {
    const result = Responses.error('Server error');

    expect(result.status).toBe(500);
    expect(result.message).toBe('Server error');
  });
});

describe('Validation', () => {
  describe('email', () => {
    it('should validate correct email addresses', () => {
      expect(Validation.email('test@example.com')).toBe(true);
      expect(Validation.email('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(Validation.email('invalid')).toBe(false);
      expect(Validation.email('test@')).toBe(false);
      expect(Validation.email('@example.com')).toBe(false);
      expect(Validation.email('')).toBe(false);
    });
  });

  describe('password', () => {
    it('should validate passwords with minimum length', () => {
      expect(Validation.password('12345678')).toBe(true);
      expect(Validation.password('longpassword')).toBe(true);
    });

    it('should reject short passwords', () => {
      expect(Validation.password('123')).toBe(false);
      expect(Validation.password('')).toBe(false);
      expect(Validation.password('1234567')).toBe(false);
    });
  });

  describe('schemas', () => {
    it('should define farm validation schema', () => {
      expect(Validation.farm.required).toEqual(['name', 'location']);
      expect(Validation.farm.sanitize).toEqual(['name', 'location']);
    });

    it('should define animal validation schema', () => {
      expect(Validation.animal.required).toEqual(['name', 'species']);
      expect(Validation.animal.sanitize).toEqual(['name', 'species', 'breed']);
    });

    it('should define task validation schema', () => {
      expect(Validation.task.required).toEqual(['title', 'status']);
      expect(Validation.task.sanitize).toEqual(['title', 'description']);
    });
  });
});