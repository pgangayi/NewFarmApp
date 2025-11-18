-- Rollback: Restore token_blacklist from backup
-- Date: November 18, 2025
-- This script restores the token_blacklist table from backup if migration fails.

-- Step 1: Recreate token_blacklist from backup
CREATE TABLE token_blacklist AS SELECT * FROM token_blacklist_backup;

-- Step 2: Remove migrated records from revoked_tokens
DELETE FROM revoked_tokens WHERE id LIKE 'migrated_%';

-- Step 3: Verify rollback
SELECT 'token_blacklist count' as table_name, COUNT(*) as count FROM token_blacklist
UNION ALL
SELECT 'revoked_tokens count' as table_name, COUNT(*) as count FROM revoked_tokens;

-- Step 4: Clean up backup (optional, after verification)
-- DROP TABLE token_blacklist_backup;

-- Note: Only run this if the migration failed and you need to rollback.