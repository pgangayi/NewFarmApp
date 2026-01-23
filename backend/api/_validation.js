// Security validation utilities for all endpoints

// Email validation regex
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Password validation regex patterns
const PASSWORD_REGEX = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

// Email validation function
export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required" };
  }

  const trimmed = email.trim();

  // Reject consecutive dots in the local part (e.g. "test..double@example.com")
  const parts = trimmed.split("@");
  if (parts.length !== 2 || parts[0].includes("..")) {
    return { valid: false, error: "Invalid email format" };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true, email: trimmed.toLowerCase() };
}

// Password validation function
export function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 12) {
    return {
      valid: false,
      error: "Password must be at least 12 characters long",
    };
  }

  if (!PASSWORD_REGEX.uppercase.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one uppercase letter",
    };
  }

  if (!PASSWORD_REGEX.lowercase.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one lowercase letter",
    };
  }

  if (!PASSWORD_REGEX.number.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }

  if (!PASSWORD_REGEX.special.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one special character",
    };
  }

  return { valid: true };
}

// Name validation function
export function validateName(name) {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Name is required" };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Name is required" };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: "Name too long" };
  }

  return { valid: true, name: trimmed };
}

// ID validation function
export function validateId(id) {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "ID is required" };
  }

  const trimmed = id.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "ID is required" };
  }

  return { valid: true, id: trimmed };
}

// Generic input validation function
export function validateInput(data, rules) {
  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    if (
      rule.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value && rule.type === "email") {
      const emailResult = validateEmail(value);
      if (!emailResult.valid) {
        errors.push(emailResult.error);
      }
    }

    if (value && rule.type === "password") {
      const passwordResult = validatePassword(value);
      if (!passwordResult.valid) {
        errors.push(passwordResult.error);
      }
    }

    if (
      value &&
      rule.type === "string" &&
      rule.maxLength &&
      value.length > rule.maxLength
    ) {
      errors.push(`${field} must be at most ${rule.maxLength} characters`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// CSRF token generation
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Security headers
export function getSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  };
}

// Rate limiting key generator
export function generateRateLimitKey(endpoint, clientIP) {
  return `${endpoint}:${clientIP}`;
}

// Input sanitization
export function sanitizeInput(input, options = {}) {
  const {
    maxLength = 1000,
    allowHtml = false,
    allowQuotes = false,
    allowAngleBrackets = false,
  } = options;

  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input.trim();

  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  // Remove <script> tags (including their content) and javascript: protocols early
  sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  // Remove any javascript: URIs and anything after them
  sanitized = sanitized.replace(/javascript:[\s\S]*/gi, "");

  // If HTML is not allowed, remove common tags including their inner content
  // e.g. <b>bold</b> => removed entirely
  if (!allowHtml) {
    sanitized = sanitized.replace(
      /<([a-z][a-z0-9-]*)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi,
      "",
    );
    // Strip remaining simple tags without content
    sanitized = sanitized.replace(/<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi, "");
  }

  // If angle brackets are not allowed (and HTML not allowed), strip raw < and > characters
  if (!allowAngleBrackets && !allowHtml) {
    sanitized = sanitized.replace(/[<>]/g, "");
  }

  if (!allowQuotes) {
    // Remove quote characters only (preserve the text inside)
    sanitized = sanitized.replace(/["']/g, "");
  }

  // Remove SQL injection patterns
  sanitized = sanitized.replace(
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    "",
  );

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

// Sanitize object recursively
export function sanitizeObject(obj, options = {}) {
  if (typeof obj !== "object" || obj === null) {
    return sanitizeInput(obj, options);
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive fields that shouldn't be sanitized
    if (
      key.toLowerCase().includes("password") ||
      key.toLowerCase().includes("secret")
    ) {
      sanitized[key] = value;
      continue;
    }

    sanitized[key] = sanitizeObject(value, options);
  }

  return sanitized;
}

// Validate and sanitize farm data
export function validateFarmData(data) {
  const errors = [];

  if (!data.name || typeof data.name !== "string") {
    errors.push("Farm name is required");
  } else if (data.name.length > 100) {
    errors.push("Farm name too long");
  }

  if (data.location && typeof data.location !== "string") {
    errors.push("Location must be a string");
  }

  if (
    data.area_hectares &&
    (typeof data.area_hectares !== "number" || data.area_hectares < 0)
  ) {
    errors.push("Area must be a positive number");
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: sanitizeObject(data),
  };
}

// Validate and sanitize user data
export function validateUserData(data) {
  const errors = [];

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.push(emailValidation.error);
  }

  if (data.name) {
    const nameValidation = validateName(data.name);
    if (!nameValidation.valid) {
      errors.push(nameValidation.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: sanitizeObject(data),
  };
}

// Environment variable validation
// Accepts an optional `env` object (Cloudflare Workers pass `env`) and falls back to `process.env` for tests
export function validateEnvironmentVars(
  env = typeof process !== "undefined" ? process.env : {},
) {
  const required = ["JWT_SECRET"];
  const optional = [
    "APP_URL",
    "SENTRY_DSN",
    "FRONTEND_PORT",
    "BACKEND_PORT",
    "TEST_BASE_URL",
    "RESEND_API_KEY",
    "FROM_EMAIL",
  ];

  const vars = {};
  const missing = [];

  // Check required variables
  for (const key of required) {
    const value = env[key];
    if (!value) {
      missing.push(key);
    } else {
      vars[key] = value;
    }
  }

  // Check optional variables
  for (const key of optional) {
    vars[key] = env[key];
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  return vars;
}
