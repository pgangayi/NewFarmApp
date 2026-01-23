/**
 * Unit tests for _validation.js
 * Tests email, password, input validation, sanitization, and security functions
 */

import {
  validateEmail,
  validatePassword,
  validateName,
  validateId,
  validateInput,
  generateCSRFToken,
  getSecurityHeaders,
  generateRateLimitKey,
  sanitizeInput,
  sanitizeObject,
  validateFarmData,
  validateUserData,
  validateEnvironmentVars,
} from "../api/_validation.js";

describe("validateEmail", () => {
  it("should validate correct email addresses", () => {
    expect(validateEmail("test@example.com")).toEqual({
      valid: true,
      email: "test@example.com",
    });

    expect(validateEmail("user.name+tag@domain.co.uk")).toEqual({
      valid: true,
      email: "user.name+tag@domain.co.uk",
    });

    expect(validateEmail("TEST@EXAMPLE.COM")).toEqual({
      valid: true,
      email: "test@example.com",
    });
  });

  it("should reject invalid email formats", () => {
    expect(validateEmail("")).toEqual({
      valid: false,
      error: "Email is required",
    });

    expect(validateEmail(null)).toEqual({
      valid: false,
      error: "Email is required",
    });

    expect(validateEmail(123)).toEqual({
      valid: false,
      error: "Email is required",
    });

    expect(validateEmail("invalid")).toEqual({
      valid: false,
      error: "Invalid email format",
    });

    expect(validateEmail("test@")).toEqual({
      valid: false,
      error: "Invalid email format",
    });

    expect(validateEmail("@example.com")).toEqual({
      valid: false,
      error: "Invalid email format",
    });

    expect(validateEmail("test..double@example.com")).toEqual({
      valid: false,
      error: "Invalid email format",
    });
  });
});

describe("validatePassword", () => {
  it("should validate strong passwords", () => {
    expect(validatePassword("StrongPass123!")).toEqual({ valid: true });
    expect(validatePassword("MySecurePassword456@")).toEqual({ valid: true });
  });

  it("should reject weak passwords", () => {
    expect(validatePassword("")).toEqual({
      valid: false,
      error: "Password is required",
    });

    expect(validatePassword(null)).toEqual({
      valid: false,
      error: "Password is required",
    });

    expect(validatePassword(123)).toEqual({
      valid: false,
      error: "Password is required",
    });

    expect(validatePassword("short")).toEqual({
      valid: false,
      error: "Password must be at least 12 characters long",
    });

    expect(validatePassword("nouppercase123!")).toEqual({
      valid: false,
      error: "Password must contain at least one uppercase letter",
    });

    expect(validatePassword("NOLOWERCASE123!")).toEqual({
      valid: false,
      error: "Password must contain at least one lowercase letter",
    });

    expect(validatePassword("NoNumbersLong!")).toEqual({
      valid: false,
      error: "Password must contain at least one number",
    });

    expect(validatePassword("NoSpecialChars123")).toEqual({
      valid: false,
      error: "Password must contain at least one special character",
    });
  });
});

describe("validateName", () => {
  it("should validate correct names", () => {
    expect(validateName("John Doe")).toEqual({
      valid: true,
      name: "John Doe",
    });

    expect(validateName("  Jane Smith  ")).toEqual({
      valid: true,
      name: "Jane Smith",
    });
  });

  it("should reject invalid names", () => {
    expect(validateName("")).toEqual({
      valid: false,
      error: "Name is required",
    });

    expect(validateName(null)).toEqual({
      valid: false,
      error: "Name is required",
    });

    expect(validateName(123)).toEqual({
      valid: false,
      error: "Name is required",
    });

    expect(validateName("   ")).toEqual({
      valid: false,
      error: "Name is required",
    });

    expect(validateName("a".repeat(101))).toEqual({
      valid: false,
      error: "Name too long",
    });
  });
});

describe("validateId", () => {
  it("should validate correct IDs", () => {
    expect(validateId("user-123")).toEqual({
      valid: true,
      id: "user-123",
    });

    expect(validateId("  farm-456  ")).toEqual({
      valid: true,
      id: "farm-456",
    });
  });

  it("should reject invalid IDs", () => {
    expect(validateId("")).toEqual({
      valid: false,
      error: "ID is required",
    });

    expect(validateId(null)).toEqual({
      valid: false,
      error: "ID is required",
    });

    expect(validateId(123)).toEqual({
      valid: false,
      error: "ID is required",
    });

    expect(validateId("   ")).toEqual({
      valid: false,
      error: "ID is required",
    });
  });
});

describe("validateInput", () => {
  it("should validate required fields", () => {
    const rules = {
      name: { required: true },
      email: { required: true, type: "email" },
    };

    expect(
      validateInput({ name: "John", email: "john@example.com" }, rules),
    ).toEqual({
      valid: true,
      errors: [],
    });

    expect(validateInput({ name: "John" }, rules)).toEqual({
      valid: false,
      errors: ["email is required"],
    });

    expect(validateInput({ email: "john@example.com" }, rules)).toEqual({
      valid: false,
      errors: ["name is required"],
    });
  });

  it("should validate email fields", () => {
    const rules = {
      email: { type: "email" },
    };

    expect(validateInput({ email: "john@example.com" }, rules)).toEqual({
      valid: true,
      errors: [],
    });

    expect(validateInput({ email: "invalid" }, rules)).toEqual({
      valid: false,
      errors: ["Invalid email format"],
    });
  });

  it("should validate password fields", () => {
    const rules = {
      password: { type: "password" },
    };

    expect(validateInput({ password: "StrongPass123!" }, rules)).toEqual({
      valid: true,
      errors: [],
    });

    expect(validateInput({ password: "weak" }, rules)).toEqual({
      valid: false,
      errors: ["Password must be at least 12 characters long"],
    });
  });

  it("should validate string length", () => {
    const rules = {
      description: { type: "string", maxLength: 10 },
    };

    expect(validateInput({ description: "short" }, rules)).toEqual({
      valid: true,
      errors: [],
    });

    expect(validateInput({ description: "this is too long" }, rules)).toEqual({
      valid: false,
      errors: ["description must be at most 10 characters"],
    });
  });
});

describe("generateCSRFToken", () => {
  it("should generate a CSRF token", () => {
    const token = generateCSRFToken();

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    // Should be URL-safe (no +, /, =)
    expect(token).not.toMatch(/[+/=]/);
  });
});

describe("getSecurityHeaders", () => {
  it("should return security headers object", () => {
    const headers = getSecurityHeaders();

    expect(headers).toHaveProperty("X-Content-Type-Options", "nosniff");
    expect(headers).toHaveProperty("X-Frame-Options", "DENY");
    expect(headers).toHaveProperty("X-XSS-Protection", "1; mode=block");
    expect(headers).toHaveProperty(
      "Referrer-Policy",
      "strict-origin-when-cross-origin",
    );
    expect(headers).toHaveProperty("Content-Security-Policy");
    expect(headers).toHaveProperty("Strict-Transport-Security");
  });
});

describe("generateRateLimitKey", () => {
  it("should generate rate limit key", () => {
    const key = generateRateLimitKey("/api/users", "192.168.1.1");

    expect(key).toBe("/api/users:192.168.1.1");
  });
});

describe("sanitizeInput", () => {
  it("should sanitize string inputs", () => {
    expect(sanitizeInput("normal text")).toBe("normal text");
    expect(sanitizeInput("  trimmed  ")).toBe("trimmed");
  });

  it("should remove control characters", () => {
    expect(sanitizeInput("text\x00with\x01control")).toBe("textwithcontrol");
  });

  it("should remove HTML tags by default", () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe("");
    expect(sanitizeInput("<b>bold</b>")).toBe("");
  });

  it("should allow HTML when specified", () => {
    expect(sanitizeInput("<b>bold</b>", { allowHtml: true })).toBe(
      "<b>bold</b>",
    );
  });

  it("should remove angle brackets by default", () => {
    expect(sanitizeInput("text < with > brackets")).toBe(
      "text  with  brackets",
    );
  });

  it("should allow angle brackets when specified", () => {
    expect(
      sanitizeInput("text < with > brackets", { allowAngleBrackets: true }),
    ).toBe("text < with > brackets");
  });

  it("should remove quotes by default", () => {
    expect(sanitizeInput("text \"with\" 'quotes'")).toBe("text with quotes");
  });

  it("should allow quotes when specified", () => {
    expect(sanitizeInput("text \"with\" 'quotes'", { allowQuotes: true })).toBe(
      "text \"with\" 'quotes'",
    );
  });

  it("should remove SQL injection patterns", () => {
    expect(sanitizeInput("SELECT * FROM users")).toBe(" * FROM users");
    expect(sanitizeInput("DROP TABLE users")).toBe(" TABLE users");
  });

  it("should remove script tags and javascript protocols", () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe("");
    expect(sanitizeInput('javascript:alert("xss")')).toBe("");
  });

  it("should limit length", () => {
    const longText = "a".repeat(2000);
    expect(sanitizeInput(longText, { maxLength: 100 })).toBe("a".repeat(100));
  });

  it("should handle non-string inputs", () => {
    expect(sanitizeInput(null)).toBe("");
    expect(sanitizeInput(123)).toBe("");
    expect(sanitizeInput({})).toBe("");
  });
});

describe("sanitizeObject", () => {
  it("should sanitize object recursively", () => {
    const obj = {
      name: '<script>alert("xss")</script>John',
      details: {
        description: 'Test "with" quotes',
        nested: {
          value: "<b>bold</b>",
        },
      },
      password: "secret123", // Should not be sanitized
    };

    const result = sanitizeObject(obj);

    expect(result.name).toBe("John");
    expect(result.details.description).toBe("Test with quotes");
    expect(result.details.nested.value).toBe("");
    expect(result.password).toBe("secret123");
  });

  it("should handle arrays", () => {
    const arr = ["<script>xss</script>", "normal", { field: "<b>html</b>" }];

    const result = sanitizeObject(arr);

    expect(result[0]).toBe("");
    expect(result[1]).toBe("normal");
    expect(result[2].field).toBe("");
  });

  it("should handle non-object inputs", () => {
    expect(sanitizeObject("string")).toBe("string");
    expect(sanitizeObject(123)).toBe("");
    expect(sanitizeObject(null)).toBe("");
  });
});

describe("validateFarmData", () => {
  it("should validate correct farm data", () => {
    const data = {
      name: "Green Acres Farm",
      location: "Rural Area",
      area_hectares: 50,
    };

    const result = validateFarmData(data);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.sanitized.name).toBe("Green Acres Farm");
  });

  it("should reject invalid farm data", () => {
    const data = {
      name: "", // Required
      location: 123, // Should be string
      area_hectares: -10, // Should be positive
    };

    const result = validateFarmData(data);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Farm name is required");
    expect(result.errors).toContain("Location must be a string");
    expect(result.errors).toContain("Area must be a positive number");
  });

  it("should validate farm name length", () => {
    const data = {
      name: "a".repeat(101),
      location: "Test",
    };

    const result = validateFarmData(data);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Farm name too long");
  });
});

describe("validateUserData", () => {
  it("should validate correct user data", () => {
    const data = {
      email: "john@example.com",
      name: "John Doe",
    };

    const result = validateUserData(data);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should reject invalid user data", () => {
    const data = {
      email: "invalid-email",
      name: "a".repeat(101),
    };

    const result = validateUserData(data);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Invalid email format");
    expect(result.errors).toContain("Name too long");
  });
});

describe("validateEnvironmentVars", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should validate when required vars are present", () => {
    process.env.JWT_SECRET = "secret";

    const result = validateEnvironmentVars();

    expect(result.JWT_SECRET).toBe("secret");
  });

  it("should throw error when required vars are missing", () => {
    delete process.env.JWT_SECRET;

    expect(() => validateEnvironmentVars()).toThrow(
      "Missing required environment variables: JWT_SECRET",
    );
  });

  it("should include optional vars when present", () => {
    process.env.JWT_SECRET = "secret";
    process.env.APP_URL = "https://example.com";
    process.env.SENTRY_DSN = "dsn";

    const result = validateEnvironmentVars();

    expect(result.APP_URL).toBe("https://example.com");
    expect(result.SENTRY_DSN).toBe("dsn");
  });

  it("should include port and test base url when present", () => {
    process.env.JWT_SECRET = "secret";
    process.env.FRONTEND_PORT = "3005";
    process.env.BACKEND_PORT = "8788";
    process.env.TEST_BASE_URL = "http://localhost:8788";

    const result = validateEnvironmentVars();

    expect(result.FRONTEND_PORT).toBe("3005");
    expect(result.BACKEND_PORT).toBe("8788");
    expect(result.TEST_BASE_URL).toBe("http://localhost:8788");
  });
});
