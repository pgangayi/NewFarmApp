#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Use bcryptjs from backend dependencies
const bcrypt = require('bcryptjs');

async function runSeed() {
  try {
    const password = process.env.E2E_PASSWORD || 'TestPass123!';
    const hash = bcrypt.hashSync(password, 10);

    const userId = 'e2e-test-user-1';
    const userEmail = 'e2e+user@example.com';
    const userName = 'E2E User';

    const sql = `
BEGIN TRANSACTION;
DELETE FROM users WHERE id = '${userId}';
INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
VALUES ('${userId}', '${userEmail}', '${userName}', '${hash}', datetime('now'), datetime('now'));

-- Create a default farm and link the user as owner
DELETE FROM farms WHERE name = 'E2E Farm';
INSERT INTO farms (name, location, area_hectares, owner_id, created_at, updated_at)
VALUES ('E2E Farm', 'Localhost', 1.0, '${userId}', datetime('now'), datetime('now'));

-- Get the farm id and insert a farm_member row
-- Note: Using a simple approach - fetch last_insert_rowid in application is complex here,
-- so we'll insert a farm and then link by selecting the id via a subquery if supported.

COMMIT;
`;

    const tmpFile = path.join(__dirname, '..', '..', 'temp-seed.sql');
    fs.writeFileSync(tmpFile, sql);

    console.log('Seeding D1 via Wrangler (local) using SQL file:', tmpFile);
    const cmd = `cd backend && npx wrangler d1 execute farmers-boot-local --file=../${path.basename(tmpFile)} --local`;
    // Use execSync to run the command and inherit output
    const out = execSync(cmd, { encoding: 'utf8' });
    console.log(out);

    // Clean up
    try { fs.unlinkSync(tmpFile); } catch (e) {}

    console.log('✅ D1 seeding completed successfully.');
    console.log(`E2E test user: ${userEmail} password: ${password}`);
  } catch (err) {
    console.error('❌ D1 seed failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

runSeed();
