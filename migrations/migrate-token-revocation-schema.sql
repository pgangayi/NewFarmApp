-- Migration: Standardize token revocation to revoked_tokens table
-- Date: November 18, 2025
-- This script migrates data from token_blacklist to revoked_tokens and drops the old table.

-- Step 1: Backup token_blacklist table
CREATE TABLE token_blacklist_backup AS SELECT * FROM token_blacklist;

-- Step 2: Migrate data from token_blacklist to revoked_tokens
-- Assuming token_blacklist has: token_hash, user_id, reason, expires_at
-- And revoked_tokens has: id, token_hash, user_id, token_type, reason, revoked_by, ip_address, user_agent, expires_at, revoked_at

INSERT INTO revoked_tokens (
  id,
  token_hash,
  user_id,
  token_type,
  reason,
  revoked_by,
  ip_address,
  user_agent,
  expires_at,
  revoked_at
)
SELECT
  'migrated_' || rowid,  -- Generate ID for migrated records
  token_hash,
  user_id,
  'refresh',  -- Assume refresh tokens for blacklist migration
  COALESCE(reason, 'migration_from_blacklist'),
  'system',
  'unknown',
  'unknown',
  expires_at,
  datetime('now')
FROM token_blacklist
WHERE expires_at > datetime('now');  -- Only migrate non-expired tokens

-- Step 3: Verify migration
-- Check counts
SELECT 'token_blacklist count' as table_name, COUNT(*) as count FROM token_blacklist
UNION ALL
SELECT 'revoked_tokens count' as table_name, COUNT(*) as count FROM revoked_tokens;

-- Step 4: Drop old table (after verification)
-- DROP TABLE token_blacklist;

-- Note: Uncomment the DROP TABLE line after verifying the migration in staging.
-- Keep token_blacklist_backup for rollback if needed.