#!/usr/bin/env node

/**
 * Migration Script: Standardize Token Revocation Schema
 * Migrates token_blacklist to revoked_tokens table
 * Run with: node scripts/migrate-token-revocation.js
 */

const fs = require('fs');
const path = require('path');

// Read the SQL migration file
const sqlFile = path.join(__dirname, '..', 'migrations', 'migrate-token-revocation-schema.sql');
const migrationSQL = fs.readFileSync(sqlFile, 'utf8');

console.log('Token Revocation Schema Migration');
console.log('==================================');
console.log('This script will migrate token_blacklist to revoked_tokens.');
console.log('');

// Split SQL into individual statements
const statements = migrationSQL
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

console.log(`Found ${statements.length} SQL statements to execute.`);
console.log('');

// Note: This is a template script. In a real D1 environment, you would:
// 1. Connect to your D1 database
// 2. Execute each statement in a transaction
// 3. Handle errors appropriately
// 4. Log results

console.log('Migration SQL Preview:');
console.log('----------------------');
statements.forEach((stmt, i) => {
  console.log(`${i + 1}. ${stmt.substring(0, 80)}${stmt.length > 80 ? '...' : ''}`);
});

console.log('');
console.log('To execute this migration:');
console.log('1. Connect to your D1 database');
console.log('2. Run the SQL statements in order');
console.log('3. Verify the migration succeeded');
console.log('4. Uncomment and run the DROP TABLE statement');
console.log('5. Remove this migration file after successful rollout');

console.log('');
console.log('Example wrangler command:');
console.log('wrangler d1 execute your-db-name --file=migrations/migrate-token-revocation-schema.sql');

// For actual execution, you would use something like:
// const { createClient } = require('@cloudflare/d1');
// const client = createClient({ accountId, databaseId, token });
// await client.execute(migrationSQL);