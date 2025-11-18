#!/usr/bin/env node

/**
 * Rollback Script: Restore Token Revocation Schema
 * Restores token_blacklist from backup if migration fails
 * Run with: node scripts/rollback-token-revocation.js
 */

const fs = require('fs');
const path = require('path');

// Read the SQL rollback file
const sqlFile = path.join(__dirname, '..', 'migrations', 'rollback-token-revocation-schema.sql');
const rollbackSQL = fs.readFileSync(sqlFile, 'utf8');

console.log('Token Revocation Schema Rollback');
console.log('=================================');
console.log('This script will restore token_blacklist from backup.');
console.log('Only run this if the migration failed!');
console.log('');

// Split SQL into individual statements
const statements = rollbackSQL
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

console.log('Rollback SQL Preview:');
console.log('---------------------');
statements.forEach((stmt, i) => {
  console.log(`${i + 1}. ${stmt.substring(0, 80)}${stmt.length > 80 ? '...' : ''}`);
});

console.log('');
console.log('To execute this rollback:');
console.log('1. Connect to your D1 database');
console.log('2. Run the SQL statements in order');
console.log('3. Verify the rollback succeeded');
console.log('4. Optionally drop the backup table');

console.log('');
console.log('Example wrangler command:');
console.log('wrangler d1 execute your-db-name --file=migrations/rollback-token-revocation-schema.sql');