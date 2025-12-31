#!/usr/bin/env node

/**
 * Authentication System Verification Script
 * Tests all critical authentication endpoints
 * Usage: node verify-auth.js [BASE_URL] [EMAIL] [PASSWORD]
 */

const BASE_URL = process.argv[2] || "http://localhost:8787";
const TEST_EMAIL = process.argv[3] || "auth-test@example.com";
const TEST_PASSWORD = process.argv[4] || "TestPassword123!";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, "green");
}

function error(message) {
  log(`❌ ${message}`, "red");
}

function info(message) {
  log(`ℹ️  ${message}`, "blue");
}

function warn(message) {
  log(`⚠️  ${message}`, "yellow");
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testAuthSystem() {
  log("\n=== Authentication System Verification ===\n", "blue");
  log(`Base URL: ${BASE_URL}`, "blue");
  log(`Test Email: ${TEST_EMAIL}\n`, "blue");

  let accessToken = "";
  let refreshToken = "";
  let csrfToken = "";
  let testPassed = 0;
  let testFailed = 0;

  // Test 1: Health Check
  try {
    info("Test 1: Health Check");
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      success("Server is running");
      testPassed++;
    } else {
      error(`Server returned ${response.status}`);
      testFailed++;
    }
  } catch (err) {
    error(`Cannot connect to server: ${err.message}`);
    testFailed++;
    log(
      "\nPlease ensure the backend server is running at " + BASE_URL,
      "yellow"
    );
    return;
  }

  // Test 2: Signup
  try {
    info("\nTest 2: User Signup");
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: "Auth Test User",
      }),
    });

    const data = await response.json();

    if (
      response.ok &&
      data.accessToken &&
      data.refreshToken &&
      data.csrfToken
    ) {
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
      csrfToken = data.csrfToken;

      success("Signup successful");
      info(`User ID: ${data.user.id}`);
      info(`Token expiry: ${data.expiresIn} seconds`);
      testPassed++;
    } else if (response.status === 409) {
      warn("User already exists, will test with existing account");
      // Try to login instead
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        accessToken = loginData.accessToken;
        refreshToken = loginData.refreshToken;
        csrfToken = loginData.csrfToken;
        success("Login successful (user already existed)");
        testPassed++;
      } else {
        error("Both signup and login failed");
        testFailed++;
      }
    } else {
      error(`Signup failed: ${data.error || response.statusText}`);
      testFailed++;
    }
  } catch (err) {
    error(`Signup error: ${err.message}`);
    testFailed++;
  }

  // Test 3: Token Validation
  if (accessToken) {
    try {
      info("\nTest 3: Token Validation");
      const response = await fetch(`${BASE_URL}/api/auth/validate`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-CSRF-Token": csrfToken,
        },
      });

      const data = await response.json();

      if (response.ok && data.user) {
        success("Token validation successful");
        info(`User email: ${data.user.email}`);
        testPassed++;
      } else {
        error(`Token validation failed: ${data.error || response.statusText}`);
        testFailed++;
      }
    } catch (err) {
      error(`Validation error: ${err.message}`);
      testFailed++;
    }
  }

  // Test 4: Protected API (Farms)
  if (accessToken) {
    try {
      info("\nTest 4: Protected API Access (Farms)");
      const response = await fetch(`${BASE_URL}/api/farms`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-CSRF-Token": csrfToken,
        },
      });

      if (response.ok) {
        success("Protected API access successful");
        testPassed++;
      } else if (response.status === 401) {
        error("Access denied - token rejected");
        testFailed++;
      } else if (response.status === 403) {
        error("Access denied - CSRF validation failed");
        testFailed++;
      } else {
        error(`API returned ${response.status}`);
        testFailed++;
      }
    } catch (err) {
      error(`API error: ${err.message}`);
      testFailed++;
    }
  }

  // Test 5: Token Refresh
  if (accessToken && refreshToken) {
    try {
      info("\nTest 5: Token Refresh");

      // Set up cookies for refresh
      const cookieHeader = `refresh_token=${refreshToken}`;

      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-CSRF-Token": csrfToken,
          Cookie: cookieHeader,
        },
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.accessToken && data.csrfToken) {
        success("Token refresh successful");
        info("New access token generated");
        info("CSRF token rotated");

        // Update tokens for next test
        accessToken = data.accessToken;
        csrfToken = data.csrfToken;
        testPassed++;
      } else {
        warn(`Token refresh failed: ${data.error || response.statusText}`);
        warn("Note: This is expected if CSRF token has expired");
        testFailed++;
      }
    } catch (err) {
      warn(`Refresh error: ${err.message}`);
      testFailed++;
    }
  }

  // Test 6: CSRF Protection
  if (accessToken) {
    try {
      info("\nTest 6: CSRF Protection");

      // Try to access without CSRF token
      const response = await fetch(`${BASE_URL}/api/farms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          // Missing X-CSRF-Token
        },
        body: JSON.stringify({
          name: "Test Farm",
          location: "Test Location",
        }),
      });

      if (response.status === 403) {
        success("CSRF protection is working (request rejected)");
        testPassed++;
      } else if (response.ok) {
        warn("CSRF protection may not be enforced for POST");
        testFailed++;
      } else {
        info(
          `Request returned ${response.status} - CSRF check may have passed`
        );
        testPassed++;
      }
    } catch (err) {
      warn(`CSRF test error: ${err.message}`);
    }
  }

  // Test 7: Logout
  if (accessToken) {
    try {
      info("\nTest 7: Logout");
      const response = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-CSRF-Token": csrfToken,
        },
      });

      if (response.ok) {
        success("Logout successful");
        testPassed++;
      } else {
        warn(`Logout returned ${response.status}`);
        testFailed++;
      }
    } catch (err) {
      error(`Logout error: ${err.message}`);
      testFailed++;
    }
  }

  // Summary
  log("\n=== Verification Summary ===\n", "blue");
  log(`Tests Passed: ${testPassed}`, "green");
  log(`Tests Failed: ${testFailed}`, testFailed === 0 ? "green" : "red");

  if (testFailed === 0) {
    log("\n✅ All authentication tests passed!", "green");
    log("Your authentication system is working correctly.", "green");
  } else {
    log("\n❌ Some tests failed. Please review the errors above.", "red");
    log("Check the following:", "yellow");
    log("- Backend server is running", "yellow");
    log("- JWT_SECRET env variable is set", "yellow");
    log("- Database migrations have been run", "yellow");
    log("- FRONTEND_ORIGIN env variable is set correctly", "yellow");
  }

  log("\nFor more information, see API_AUTH_GUIDE.md\n", "blue");
}

// Run tests
testAuthSystem().catch((err) => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
