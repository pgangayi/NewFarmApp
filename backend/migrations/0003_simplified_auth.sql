-- Simplified Authentication Migration
-- Reduces complexity while maintaining essential security
-- Date: November 18, 2025

-- Fix existing users with null IDs using simple UUID generation
UPDATE users SET id = hex(randomblob(16)) WHERE id IS NULL;

-- Simplified login attempts (reduced scope)
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    email_hash TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    success INTEGER NOT NULL DEFAULT 0,
    failure_reason TEXT,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    blocked_until DATETIME,
    attempt_count INTEGER DEFAULT 1
);

-- Simplified token blacklist (no complex hashing)
CREATE TABLE IF NOT EXISTS token_blacklist (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    reason TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Simplified audit log (critical events only)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address TEXT,
    success INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Password reset tokens (keep as-is, it's necessary)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes (simplified)
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_ip ON login_attempts(email_hash, ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_blocked ON login_attempts(blocked_until);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);