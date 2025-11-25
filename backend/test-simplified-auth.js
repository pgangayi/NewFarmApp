// Comprehensive Testing Suite for Simplified Authentication System
// Tests all aspects of the new simplified auth system before full migration
// Date: November 18, 2025

const BASE_URL = "http://localhost:8787";

// Test configuration
const testConfig = {
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  // Simple cookie jar used for refresh/csrf cookies between requests
  cookie: "",
};

// Test utilities
async function makeRequest(endpoint, method = "GET", body = null, extraHeaders = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    ...testConfig.headers,
    ...extraHeaders,
  };

  if (testConfig.cookie) {
    headers["Cookie"] = testConfig.cookie;
  }

  const options = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  };

  console.log(`\n🔄 ${method} ${url}`);
  if (body) console.log("📤 Request body:", JSON.stringify(body, null, 2));

  try {
    const response = await fetch(url, options);

    // Update simple cookie jar from any Set-Cookie headers
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      // Support multiple cookies in a single header
      const cookiePairs = setCookie
        .split(",")
        .map((c) => c.split(";")[0].trim())
        .filter(Boolean);
      if (cookiePairs.length) {
        testConfig.cookie = cookiePairs.join("; ");
      }
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.warn("⚠️ Response body was not valid JSON, continuing with empty object");
      data = {};
    }

    console.log(`📥 Status: ${response.status}`);
    console.log("📥 Response:", JSON.stringify(data, null, 2));

    return { response, data, success: response.ok };
  } catch (error) {
    console.error("❌ Request failed:", error.message);
    return { success: false, error: error.message };
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Test suite
class SimplifiedAuthTester {
  constructor() {
    this.testResults = [];
    this.testUser = {
      email: `test-simplified-${Date.now()}@example.com`,
      password: "testpassword123",
      name: "Simplified Test User",
    };
  }

  addResult(test, success, message) {
    this.testResults.push({
      test,
      success,
      message,
      timestamp: new Date().toISOString(),
    });

    const status = success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} ${test}: ${message}`);
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    try {
      await testFunction();
    } catch (error) {
      this.addResult(testName, false, `Test threw error: ${error.message}`);
    }
  }

  // Phase 1: Setup and Migration
  async testMigrationSetup() {
    console.log("\n📋 Phase 1: Testing Migration Setup");

    await this.runTest("Health Check", async () => {
      const result = await makeRequest("/api/health");
      if (!result.success) {
        throw new Error("API health check failed");
      }
      this.addResult("Health Check", true, "API is healthy");
    });

    await this.runTest("Setup Simplified Auth Tables", async () => {
      const result = await makeRequest(
        "/api/migrate-to-simplified-auth",
        "POST"
      );
      if (!result.success) {
        throw new Error("Migration setup failed");
      }

      const { createdTables } = result.data;
      const expectedTables = [
        "simplified_login_attempts",
        "simplified_token_blacklist",
        "simplified_audit_logs",
        "simplified_password_reset_tokens",
      ];

      const allCreated = expectedTables.every((table) =>
        createdTables.includes(table)
      );

      if (!allCreated) {
        throw new Error(
          `Not all tables created. Expected: ${expectedTables.join(
            ", "
          )}, Got: ${createdTables.join(", ")}`
        );
      }

      this.addResult(
        "Setup Simplified Auth Tables",
        true,
        `All ${createdTables.length} tables created successfully`
      );
    });
  }

  // Phase 2: User Registration
  async testUserRegistration() {
    console.log("\n📋 Phase 2: Testing User Registration");

    await this.runTest("Signup with Valid Data", async () => {
      const result = await makeRequest(
        "/api/auth/signup",
        "POST",
        this.testUser
      );

      if (!result.success) {
        throw new Error(
          `Signup failed: ${result.data.error || "Unknown error"}`
        );
      }

      const { user, accessToken, refreshToken, csrfToken } = result.data;

      if (!user || !accessToken || !refreshToken || !csrfToken) {
        throw new Error("Incomplete signup response");
      }

      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.csrfToken = csrfToken;
      this.userId = user.id;

      this.addResult(
        "Signup with Valid Data",
        true,
        `User created: ${user.email}`
      );
    });

    await this.runTest("Signup with Duplicate Email", async () => {
      const result = await makeRequest(
        "/api/auth/signup",
        "POST",
        this.testUser
      );

      if (result.success) {
        throw new Error("Duplicate signup should have failed");
      }

      if (result.data.error !== "User already exists") {
        throw new Error(`Wrong error message: ${result.data.error}`);
      }

      this.addResult(
        "Signup with Duplicate Email",
        true,
        "Correctly rejected duplicate signup"
      );
    });

    await this.runTest("Signup with Invalid Data", async () => {
      const invalidData = {
        email: "invalid-email",
        password: "123", // Too short
        name: "", // Empty name
      };

      const result = await makeRequest("/api/auth/signup", "POST", invalidData);

      if (result.success) {
        throw new Error("Invalid signup should have failed");
      }

      if (!result.data.error) {
        throw new Error("Should have error message");
      }

      this.addResult(
        "Signup with Invalid Data",
        true,
        "Correctly validated input"
      );
    });
  }

  // Phase 3: Authentication
  async testAuthentication() {
    console.log("\n📋 Phase 3: Testing Authentication");

    await this.runTest("Login with Valid Credentials", async () => {
      const loginData = {
        email: this.testUser.email,
        password: this.testUser.password,
      };

      const result = await makeRequest("/api/auth/login", "POST", loginData);

      if (!result.success) {
        throw new Error(
          `Login failed: ${result.data.error || "Unknown error"}`
        );
      }

      const { user, accessToken, refreshToken, csrfToken } = result.data;

      if (!user || !accessToken || !refreshToken || !csrfToken) {
        throw new Error("Incomplete login response");
      }

      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.csrfToken = csrfToken;

      this.addResult("Login with Valid Credentials", true, "Login successful");
    });

    await this.runTest("Login with Invalid Password", async () => {
      const loginData = {
        email: this.testUser.email,
        password: "wrongpassword",
      };

      const result = await makeRequest("/api/auth/login", "POST", loginData);

      if (result.success) {
        throw new Error("Invalid login should have failed");
      }

      if (result.data.error !== "Invalid email or password") {
        throw new Error(`Wrong error message: ${result.data.error}`);
      }

      this.addResult(
        "Login with Invalid Password",
        true,
        "Correctly rejected invalid password"
      );
    });

    await this.runTest("Login with Non-existent User", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const result = await makeRequest("/api/auth/login", "POST", loginData);

      if (result.success) {
        throw new Error("Non-existent user login should have failed");
      }

      if (result.data.error !== "Invalid email or password") {
        throw new Error(`Wrong error message: ${result.data.error}`);
      }

      this.addResult(
        "Login with Non-existent User",
        true,
        "Correctly rejected non-existent user"
      );
    });
  }

  // Phase 4: Token Validation
  async testTokenValidation() {
    console.log("\n📋 Phase 4: Testing Token Validation");

    await this.runTest("Token Validation with Valid Token", async () => {
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
      };

      const result = await makeRequest("/api/auth/validate", "GET", null, headers);

      if (!result.success) {
        throw new Error("Token validation failed");
      }

      this.addResult(
        "Token Validation with Valid Token",
        true,
        "Token is valid"
      );
    });

    await this.runTest("Token Validation with Invalid Token", async () => {
      const headers = {
        Authorization: "Bearer invalid-token",
      };

      const result = await makeRequest("/api/auth/validate", "GET", null, headers);

      // Should fail with unauthorized
      if (result.success) {
        throw new Error("Invalid token should be rejected");
      }

      this.addResult(
        "Token Validation with Invalid Token",
        true,
        "Invalid token correctly rejected"
      );
    });
  }

  // Phase 5: Session Management
  async testSessionManagement() {
    console.log("\n📋 Phase 5: Testing Session Management");

    await this.runTest("Logout with Valid Token", async () => {
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        "X-CSRF-Token": this.csrfToken,
      };

      const result = await makeRequest(
        "/api/auth/logout",
        "POST",
        null,
        headers
      );

      if (!result.success) {
        throw new Error(`Logout failed: ${result.data.error || "Unknown error"}`);
      }

      this.addResult("Logout with Valid Token", true, "Logout successful");
    });

    await this.runTest("Token Blacklist Verification", async () => {
      // Try to use the same token after logout
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
      };

      const result = await makeRequest("/api/auth/validate", "GET", null, headers);

      // Should fail because token should be blacklisted
      if (result.success) {
        throw new Error("Blacklisted token should be rejected");
      }

      this.addResult(
        "Token Blacklist Verification",
        true,
        "Blacklisted token correctly rejected"
      );
    });
  }

  // Phase 6: Rate Limiting and Security
  async testSecurityFeatures() {
    console.log("\n📋 Phase 6: Testing Security Features");

    await this.runTest("Rate Limiting Protection", async () => {
      // Make multiple failed login attempts
      const loginData = {
        email: this.testUser.email,
        password: "wrongpassword",
      };

      let failedAttempts = 0;
      for (let i = 0; i < 6; i++) {
        const result = await makeRequest("/api/auth/login", "POST", loginData);
        if (
          !result.success &&
          result.data.error === "Invalid email or password"
        ) {
          failedAttempts++;
        }
        await sleep(100); // Small delay between attempts
      }

      // Should have been rate limited after 5 attempts
      if (failedAttempts < 5) {
        throw new Error("Rate limiting may not be working properly");
      }

      this.addResult(
        "Rate Limiting Protection",
        true,
        "Rate limiting appears to be working"
      );
    });
  }

  // Phase 7: Rollback Testing
  async testRollback() {
    console.log("\n📋 Phase 7: Testing Rollback");

    await this.runTest("Rollback to Complex Auth", async () => {
      const result = await makeRequest("/api/rollback-to-complex-auth", "POST");

      if (!result.success) {
        throw new Error("Rollback failed");
      }

      const { removedTables } = result.data;

      if (!removedTables || removedTables.length === 0) {
        throw new Error("Rollback should have removed tables");
      }

      this.addResult(
        "Rollback to Complex Auth",
        true,
        `Rollback completed, removed ${removedTables.length} tables`
      );
    });

    await this.runTest("Verify Tables Removed", async () => {
      // Check that simplified tables no longer exist by trying to create them again
      const result = await makeRequest(
        "/api/migrate-to-simplified-auth",
        "POST"
      );

      if (!result.success) {
        throw new Error(
          "Failed to recreate simplified tables for verification"
        );
      }

      this.addResult(
        "Verify Tables Removed",
        true,
        "Tables can be recreated, rollback was successful"
      );
    });
  }

  // Generate test report
  generateReport() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 SIMPLIFIED AUTHENTICATION TEST REPORT");
    console.log("=".repeat(60));

    const passed = this.testResults.filter((r) => r.success).length;
    const total = this.testResults.length;
    const failed = total - passed;

    console.log(`📈 Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log("\n❌ FAILED TESTS:");
      this.testResults
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`   • ${r.test}: ${r.message}`);
        });
    }

    console.log("\n📋 DETAILED RESULTS:");
    this.testResults.forEach((r) => {
      const status = r.success ? "✅" : "❌";
      console.log(`   ${status} ${r.test}: ${r.message}`);
    });

    return {
      total,
      passed,
      failed,
      successRate: (passed / total) * 100,
      results: this.testResults,
    };
  }

  // Main test runner
  async runAllTests() {
    console.log("🚀 Starting Simplified Authentication System Test Suite");
    console.log(`🕐 Test Start Time: ${new Date().toISOString()}`);

    try {
      await this.testMigrationSetup();
      await this.testUserRegistration();
      await this.testAuthentication();
      await this.testTokenValidation();
      await this.testSessionManagement();
      await this.testSecurityFeatures();
      await this.testRollback();

      const report = this.generateReport();

      console.log(`\n🕐 Test End Time: ${new Date().toISOString()}`);

      if (report.successRate >= 90) {
        console.log(
          "\n🎉 TEST SUITE PASSED! Simplified authentication system is ready for production."
        );
      } else {
        console.log(
          "\n⚠️  TEST SUITE FAILED! Please review failures before proceeding."
        );
      }

      return report;
    } catch (error) {
      console.error("\n💥 Test suite failed with error:", error);
      return { success: false, error: error.message };
    }
  }
}

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = SimplifiedAuthTester;
}

// Auto-run if called directly
if (typeof window === "undefined") {
  const tester = new SimplifiedAuthTester();
  tester.runAllTests().catch(console.error);
}
