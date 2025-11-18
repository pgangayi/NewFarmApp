#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Use bcryptjs from backend dependencies
const bcrypt = require("bcryptjs");

async function runSeed() {
  try {
    const password = process.env.E2E_PASSWORD || "TestPass123!";
    const hash = bcrypt.hashSync(password, 10);

    const userId = "e2e-test-user-1";
    const userEmail = "e2e+user@example.com";
    const userName = "E2E User";

    const sql = `
  PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;
-- Clean up any existing references before deleting or recreating the user
DELETE FROM csrf_tokens WHERE user_id = '${userId}';
DELETE FROM user_sessions WHERE user_id = '${userId}';
DELETE FROM audit_logs WHERE user_id = '${userId}';
DELETE FROM operations WHERE user_id = '${userId}';
DELETE FROM tasks WHERE assigned_to = '${userId}' OR created_by = '${userId}';
DELETE FROM treatments WHERE created_by = '${userId}';
DELETE FROM inventory_transactions WHERE created_by = '${userId}';
DELETE FROM finance_entries WHERE created_by = '${userId}';
DELETE FROM farm_members WHERE user_id = '${userId}' OR farm_id IN (
  SELECT id FROM farms WHERE owner_id = '${userId}'
);
DELETE FROM password_reset_tokens WHERE user_id = '${userId}';
DELETE FROM farms WHERE owner_id = '${userId}' OR name = 'E2E Farm';
DELETE FROM users WHERE id = '${userId}';

-- Recreate deterministic E2E user and farm
INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
VALUES ('${userId}', '${userEmail}', '${userName}', '${hash}', datetime('now'), datetime('now'));

INSERT INTO farms (name, location, area_hectares, owner_id, created_at, updated_at)
VALUES ('E2E Farm', 'Localhost', 1.0, '${userId}', datetime('now'), datetime('now'));

INSERT INTO farm_members (farm_id, user_id, role, created_at)
VALUES (last_insert_rowid(), '${userId}', 'owner', datetime('now'));

COMMIT;
PRAGMA foreign_keys = ON;
`;

    const tmpSeedFileName = ".tmp-seed.sql";
    const tmpFile = path.join(__dirname, "..", tmpSeedFileName);
    fs.writeFileSync(tmpFile, sql);

    console.log("Seeding D1 via Wrangler (local) using SQL file:", tmpFile);

    // Reset the local D1 state to guarantee a clean schema before migrations
    try {
      const d1StateDir = path.join(
        __dirname,
        "..",
        ".wrangler",
        "state",
        "v3",
        "d1"
      );
      if (fs.existsSync(d1StateDir)) {
        fs.rmSync(d1StateDir, { recursive: true, force: true });
        console.log("Reset local D1 state at", d1StateDir);
      }
    } catch (stateErr) {
      console.warn(
        "Warning: failed to reset local D1 state (continuing):",
        stateErr && stateErr.message ? stateErr.message : stateErr
      );
    }

    // Apply required migrations (base schema + targeted enhancements)
    const migrationFiles = [
      "../migrations_backup/0001_d1_complete_schema.sql",
      "migrations/0002_create_missing_tables.sql",
      "migrations/0003_enhanced_task_finance.sql",
      "../migrations/0004_security_auth.sql",
      "../migrations/0005_session_tracking.sql",
      "../migrations/0006_password_reset_tokens.sql",
    ];

    for (const relativePath of migrationFiles) {
      console.log("Applying D1 migration", relativePath);
      const migrateCmd = `cd backend && npx wrangler d1 execute farmers-boot-local --file=${relativePath} --local`;
      try {
        const migrateOut = execSync(migrateCmd, { encoding: "utf8" });
        console.log(migrateOut);
      } catch (mErr) {
        throw new Error(
          `Failed to apply migration ${relativePath}: ${
            mErr && mErr.message ? mErr.message : mErr
          }`
        );
      }
    }

    // Wait for the local worker health endpoint to report healthy before seeding
    try {
      const healthUrl =
        process.env.E2E_HEALTH_URL || "http://localhost:8787/api/health";
      const maxHealthAttempts = 20;
      let healthAttempt = 0;
      let healthy = false;
      console.log("Polling worker health at", healthUrl);
      while (healthAttempt < maxHealthAttempts && !healthy) {
        healthAttempt += 1;
        try {
          const healthCmd = `curl -s ${healthUrl}`;
          const healthOut = execSync(healthCmd, { encoding: "utf8" }).trim();
          if (
            healthOut &&
            (healthOut.indexOf('"status":"healthy"') !== -1 ||
              healthOut.indexOf('"status": "healthy"') !== -1)
          ) {
            healthy = true;
            console.log(
              "Worker health reported healthy (attempt",
              healthAttempt + ")"
            );
            break;
          }
        } catch (hErr) {
          // ignore and retry
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      if (!healthy) {
        console.warn(
          "Warning: worker did not report healthy after polling; continuing with seed (this may be flaky)"
        );
      }
    } catch (e) {
      console.warn(
        "Health check polling failed (continuing):",
        e && e.message ? e.message : e
      );
    }

    const cmd = `cd backend && npx wrangler d1 execute farmers-boot-local --file=${tmpSeedFileName} --local`;
    // Use execSync to run the command and inherit output
    const out = execSync(cmd, { encoding: "utf8" });
    console.log(out);

    // Try to log in via the local worker to obtain a real JWT/session
    // Retry a few times because Wrangler dev may still be booting
    const loginUrl =
      process.env.E2E_AUTH_URL || "http://localhost:8787/api/auth/login";
    const maxAttempts = parseInt(process.env.E2E_LOGIN_ATTEMPTS || "12", 10);
    let attempt = 0;
    let token = null;
    let user = null;

    while (attempt < maxAttempts && !token) {
      attempt += 1;
      try {
        console.log(
          `Attempting login to ${loginUrl} (attempt ${attempt}/${maxAttempts})`
        );
        const response = await fetch(loginUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, password }),
        });
        const bodyText = await response.text();
        if (!bodyText) {
          console.log(
            `Login attempt returned empty body (status ${response.status})`
          );
        } else {
          try {
            const parsed = JSON.parse(bodyText);
            token =
              parsed?.token ||
              parsed?.accessToken ||
              parsed?.data?.token ||
              parsed?.data?.tokens?.accessToken;
            user = parsed?.user || parsed?.data?.user;
            if (token) {
              console.log("Obtained login token from backend");
              break;
            }
            console.log(
              "Login response JSON did not include a token. Raw:",
              bodyText.slice(0, 200)
            );
          } catch (parseErr) {
            console.log(
              "Login response was not valid JSON:",
              bodyText.slice(0, 200)
            );
          }
        }
      } catch (err) {
        console.log(
          "Login attempt failed (fetch error):",
          err && err.message ? err.message : err
        );
      }
      // wait between attempts
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!token) {
      console.warn(
        "⚠️  Could not obtain login token from backend; E2E auto-auth may not work."
      );
    } else {
      // Persist a lightweight session file that the preview server will inject into index.html
      // Write { token: string, user: {...}, csrfToken: string }
      const csrfToken = `e2e-csrf-${Date.now()}`;
      const session = {
        token,
        user: user || { id: userId, email: userEmail, name: userName },
        csrfToken,
      };
      const sessionFile = path.join(__dirname, "..", "..", ".e2e_session.json");
      fs.writeFileSync(sessionFile, JSON.stringify(session));
      console.log("✅ Wrote E2E session to", sessionFile);
      console.log(`E2E test user session token: ${token}`);
    }

    // Clean up temp SQL file
    try {
      fs.unlinkSync(tmpFile);
    } catch (e) {}

    console.log("✅ D1 seeding completed successfully.");
    console.log(`E2E test user: ${userEmail} password: ${password}`);
  } catch (err) {
    console.error("❌ D1 seed failed:", err && err.message ? err.message : err);
    process.exit(1);
  }
}

runSeed();
