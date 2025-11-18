
-- Step 1: Recreate token_blacklist from backup (explicit create+insert)
CREATE TABLE IF NOT EXISTS token_blacklist (
	token_hash TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	reason TEXT,
	expires_at DATETIME NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT OR REPLACE INTO token_blacklist (token_hash, user_id, reason, expires_at, created_at)
SELECT token_hash, user_id, reason, expires_at, created_at FROM token_blacklist_backup;

DELETE FROM revoked_tokens WHERE id LIKE 'migrated_%';

SELECT 'token_blacklist count' as table_name, COUNT(*) as count FROM token_blacklist
UNION ALL
SELECT 'revoked_tokens count' as table_name, COUNT(*) as count FROM revoked_tokens;


