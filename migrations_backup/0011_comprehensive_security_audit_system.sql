-- Migration: Add comprehensive audit logging system
-- Date: November 10, 2025
-- Purpose: Enable security event tracking and monitoring

-- Create audit logs table for security events
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY, -- Unique log ID
    event_type TEXT NOT NULL, -- Type of event (login, logout, etc.)
    user_id TEXT, -- User ID (nullable for anonymous events)
    email TEXT, -- User email (nullable for anonymous events)
    ip_address TEXT NOT NULL, -- Client IP address
    user_agent TEXT, -- Client user agent
    metadata TEXT, -- JSON string for additional event data
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address);

-- Create a cleaned up password reset tokens table with proper security
DROP TABLE IF EXISTS password_reset_tokens;
CREATE TABLE password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE, -- Hash of the token for security
    expires_at DATETIME NOT NULL,
    used_at DATETIME, -- NULL means not used yet
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for password reset security
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Create CSRF tokens table for security
CREATE TABLE IF NOT EXISTS csrf_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT, -- NULL for anonymous users
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for CSRF tokens
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_user ON csrf_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_token ON csrf_tokens(token);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_expires ON csrf_tokens(expires_at);

-- Add a rate limiting tracking table for better security
CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    client_ip TEXT NOT NULL,
    violation_type TEXT NOT NULL, -- 'too_many_requests', 'suspicious_activity'
    details TEXT, -- JSON string for additional details
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_ip ON rate_limit_violations(client_ip);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_endpoint ON rate_limit_violations(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_timestamp ON rate_limit_violations(timestamp);

-- Create a sessions table for better session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_token_hash TEXT NOT NULL UNIQUE, -- Hash of the session token
    csrf_token TEXT NOT NULL, -- Associated CSRF token
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for session management
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Create a security settings table for configuration
CREATE TABLE IF NOT EXISTS security_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_name TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default security settings
INSERT OR REPLACE INTO security_settings (setting_name, setting_value, description) VALUES
('max_login_attempts', '5', 'Maximum login attempts before temporary lockout'),
('login_attempt_window', '300', 'Time window in seconds for login attempt tracking'),
('session_timeout', '3600', 'Session timeout in seconds (1 hour)'),
('password_reset_timeout', '3600', 'Password reset token timeout in seconds (1 hour)'),
('csrf_token_timeout', '1800', 'CSRF token timeout in seconds (30 minutes)'),
('enable_audit_logging', 'true', 'Enable comprehensive audit logging'),
('enable_rate_limiting', 'true', 'Enable rate limiting for security'),
('require_strong_passwords', 'true', 'Require strong password policies');

-- Create a backup/cleanup policy view for maintenance
CREATE VIEW IF NOT EXISTS security_maintenance AS
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as total_records,
    MIN(timestamp) as oldest_record,
    MAX(timestamp) as newest_record,
    'Consider archiving records older than 1 year' as recommendation
FROM audit_logs
UNION ALL
SELECT 
    'password_reset_tokens' as table_name,
    COUNT(*) as total_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    'Delete expired tokens regularly' as recommendation
FROM password_reset_tokens
WHERE used_at IS NULL AND expires_at < datetime('now')
UNION ALL
SELECT 
    'csrf_tokens' as table_name,
    COUNT(*) as total_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    'Delete expired CSRF tokens' as recommendation
FROM csrf_tokens
WHERE expires_at < datetime('now')
UNION ALL
SELECT 
    'user_sessions' as table_name,
    COUNT(*) as total_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    'Delete expired sessions' as recommendation
FROM user_sessions
WHERE expires_at < datetime('now');