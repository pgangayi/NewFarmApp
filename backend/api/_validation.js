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

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true, email: email.trim().toLowerCase() };
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
export function sanitizeInput(input) {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/[<>\"']/g, "") // Remove potentially dangerous characters
    .trim()
    .substring(0, 1000); // Limit length
}

// Environment variable validation
export function validateEnvironmentVars() {
  const required = ["JWT_SECRET"];
  const optional = ["APP_URL", "SENTRY_DSN"];

  const vars = {};
  const missing = [];

  // Check required variables
  for (const key of required) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else {
      vars[key] = value;
    }
  }

  // Check optional variables
  for (const key of optional) {
    vars[key] = process.env[key];
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  return vars;
}
