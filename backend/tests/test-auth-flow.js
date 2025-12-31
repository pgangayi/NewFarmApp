#!/usr/bin/env node
/**
 * Comprehensive Auth Flow Test
 * Tests: login, signup, token validation, refresh, logout
 * Date: December 2024
 */

const BASE_URL = "http://localhost:8787";

// Test utilities
const log = {
  test: (msg) => console.log(`\n📋 TEST: ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  debug: (msg) => console.log(`🐛 ${msg}`),
};

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: "SecurePassword123!",
  name: "Test User",
};

let authState = {
  accessToken: null,
  refreshToken: null,
  csrfToken: null,
  userId: null,
  user: null,
};

// Test: Signup
async function testSignup() {
  log.test("Signup endpoint");

  try {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
      }),
    });

    const data = await response.json();

    if (response.status === 201 && data.accessToken && data.refreshToken) {
      authState.accessToken = data.accessToken;
      authState.refreshToken = data.refreshToken;
      authState.csrfToken = data.csrfToken;
      authState.user = data.user;
      authState.userId = data.user?.id;

      log.success(`Signup successful`);
      log.debug(`User: ${data.user?.email}`);
      log.debug(`Access token: ${data.accessToken?.substring(0, 20)}...`);
      return true;
    } else {
      log.error(`Signup failed: ${response.status}`);
      log.debug(`Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err) {
    log.error(`Signup error: ${err.message}`);
    return false;
  }
}

// Test: Login
async function testLogin() {
  log.test("Login endpoint");

  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const data = await response.json();

    if (response.status === 200 && data.accessToken && data.refreshToken) {
      authState.accessToken = data.accessToken;
      authState.refreshToken = data.refreshToken;
      authState.csrfToken = data.csrfToken;
      authState.user = data.user;

      log.success(`Login successful`);
      log.debug(`Access token: ${data.accessToken?.substring(0, 20)}...`);
      return true;
    } else {
      log.error(`Login failed: ${response.status}`);
      log.debug(`Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err) {
    log.error(`Login error: ${err.message}`);
    return false;
  }
}

// Test: Validate Token
async function testValidate() {
  log.test("Validate token endpoint");

  if (!authState.accessToken) {
    log.error("No access token available");
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authState.accessToken}`,
      },
    });

    const data = await response.json();

    if (response.status === 200 && data.valid) {
      log.success(`Token validation successful`);
      log.debug(`User: ${data.user?.email}`);
      return true;
    } else {
      log.error(`Token validation failed: ${response.status}`);
      log.debug(`Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err) {
    log.error(`Validation error: ${err.message}`);
    return false;
  }
}

// Test: Refresh Token
async function testRefresh() {
  log.test("Refresh token endpoint");

  if (!authState.refreshToken || !authState.csrfToken) {
    log.error("No refresh or CSRF token available");
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": authState.csrfToken,
      },
      credentials: "include", // Include cookies with refresh token
    });

    const data = await response.json();

    if (response.status === 200 && data.accessToken) {
      authState.accessToken = data.accessToken;
      authState.refreshToken = data.refreshToken || authState.refreshToken;
      authState.csrfToken = data.csrfToken || authState.csrfToken;

      log.success(`Token refresh successful`);
      log.debug(`New access token: ${data.accessToken?.substring(0, 20)}...`);
      return true;
    } else {
      log.error(`Token refresh failed: ${response.status}`);
      log.debug(`Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err) {
    log.error(`Refresh error: ${err.message}`);
    return false;
  }
}

// Test: Logout
async function testLogout() {
  log.test("Logout endpoint");

  if (!authState.accessToken || !authState.csrfToken) {
    log.error("No tokens available");
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authState.accessToken}`,
        "X-CSRF-Token": authState.csrfToken,
      },
      credentials: "include",
    });

    const data = await response.json();

    if (response.status === 200) {
      authState.accessToken = null;
      authState.refreshToken = null;
      authState.csrfToken = null;

      log.success(`Logout successful`);
      return true;
    } else {
      log.error(`Logout failed: ${response.status}`);
      log.debug(`Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err) {
    log.error(`Logout error: ${err.message}`);
    return false;
  }
}

// Test: Verify logout worked (token should be invalid)
async function testValidateAfterLogout() {
  log.test("Validate token after logout (should fail)");

  if (!authState.accessToken) {
    log.success("No token available (as expected)");
    return true;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authState.accessToken}`,
      },
    });

    if (response.status !== 200) {
      log.success(`Token correctly invalidated (${response.status})`);
      return true;
    } else {
      log.error(`Token still valid after logout`);
      return false;
    }
  } catch (err) {
    log.error(`Validation check error: ${err.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 AUTH FLOW TEST SUITE");
  console.log("=".repeat(60));

  const results = {};

  // Test signup
  results.signup = await testSignup();

  // Test login
  results.login = await testLogin();

  // Test validate
  results.validate = await testValidate();

  // Test refresh
  results.refresh = await testRefresh();

  // Test validate after refresh
  results.validateAfterRefresh = await testValidate();

  // Test logout
  results.logout = await testLogout();

  // Test validate after logout
  results.validateAfterLogout = await testValidateAfterLogout();

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));

  const passed = Object.values(results).filter((r) => r).length;
  const total = Object.values(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? "✅" : "❌";
    console.log(`${icon} ${test}: ${passed ? "PASSED" : "FAILED"}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log(`Total: ${passed}/${total} tests passed`);
  console.log("=".repeat(60) + "\n");

  process.exit(passed === total ? 0 : 1);
}

// Main
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch((err) => {
    log.error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
}
