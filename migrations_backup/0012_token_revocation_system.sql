-- Migration: Token Revocation System
-- Date: November 12, 2025
-- Purpose: Enable forced token invalidation for security incidents

-- Create revoked tokens table for security incident response
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id TEXT PRIMARY KEY, -- Unique revocation ID
    token_hash TEXT NOT NULL UNIQUE, -- Hash of the revoked token
    user_id TEXT NOT NULL, -- User who owns the token
    token_type TEXT NOT NULL DEFAULT 'access', -- 'access', 'refresh', 'reset'
    revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    revoked_by TEXT, -- User ID who initiated revocation (for admin actions)
    reason TEXT NOT NULL, -- Reason for revocation
    ip_address TEXT, -- IP address where revocation was requested
    user_agent TEXT, -- User agent of revocation request
    expires_at DATETIME NOT NULL, -- Original token expiration
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (revoked_by) REFERENCES users(id)
);

-- Create indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user_id ON revoked_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_token_hash ON revoked_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_revoked_at ON revoked_tokens(revoked_at);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_type ON revoked_tokens(token_type);

-- Create session invalidation tracking table
CREATE TABLE IF NOT EXISTS session_invalidations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_token_hash TEXT NOT NULL UNIQUE,
    invalidation_type TEXT NOT NULL, -- 'logout', 'force_logout', 'password_change', 'security_breach'
    reason TEXT NOT NULL,
    invalidated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    invalidated_by TEXT, -- User who initiated (null for self-logout)
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (invalidated_by) REFERENCES users(id)
);

-- Create indexes for session invalidation
CREATE INDEX IF NOT EXISTS idx_session_invalidations_user_id ON session_invalidations(user_id);
CREATE INDEX IF NOT EXISTS idx_session_invalidations_token ON session_invalidations(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_session_invalidations_invalidated_at ON session_invalidations(invalidated_at);

-- Create login attempt tracking for security
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    email TEXT, -- Can be null for security (don't store failed emails)
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    attempt_type TEXT NOT NULL, -- 'login', 'password_reset', 'signup'
    success BOOLEAN NOT NULL DEFAULT FALSE,
    failure_reason TEXT, -- Generic failure reason (no specific details)
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    blocked_until DATETIME, -- Until when the IP is blocked
    attempt_count INTEGER DEFAULT 1
);

-- Create indexes for login attempt tracking
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_blocked_until ON login_attempts(blocked_until);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);

-- Add security event tracking table
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'suspicious_login', 'multiple_failures', 'token_abuse', 'privilege_escalation'
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    user_id TEXT, -- User involved (if applicable)
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    event_data TEXT, -- JSON string with additional event details
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolution_notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for security events
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_detected_at ON security_events(detected_at);

-- Insert default security configuration
INSERT OR REPLACE INTO security_settings (setting_name, setting_value, description) VALUES
('max_login_attempts_per_ip', '5', 'Maximum login attempts per IP before temporary block'),
('login_attempt_window_minutes', '15', 'Time window in minutes for login attempt tracking'),
('temp_block_duration_minutes', '30', 'Temporary IP block duration in minutes'),
('enable_token_revocation', 'true', 'Enable token revocation system'),
('require_token_blacklist_check', 'true', 'Check token blacklist on every validation'),
('max_sessions_per_user', '5', 'Maximum concurrent sessions per user'),
('session_cleanup_hours', '24', 'Hours after which expired sessions are cleaned up'),
('security_event_retention_days', '90', 'Days to retain security events'),
('token_revocation_retention_days', '30', 'Days to retain revoked tokens after expiration');

-- Create view for active security threats
CREATE VIEW IF NOT EXISTS active_security_threats AS
SELECT 
    'login_attempts' as threat_type,
    ip_address,
    COUNT(*) as attempt_count,
    MAX(attempted_at) as last_attempt,
    MAX(blocked_until) as blocked_until
FROM login_attempts 
WHERE blocked_until IS NOT NULL AND blocked_until > datetime('now')
GROUP BY ip_address
HAVING COUNT(*) >= 3
UNION ALL
SELECT 
    'security_events' as threat_type,
    ip_address,
    COUNT(*) as event_count,
    MAX(detected_at) as last_event,
    NULL as blocked_until
FROM security_events 
WHERE severity IN ('high', 'critical') 
  AND resolved_at IS NULL
GROUP BY ip_address
HAVING COUNT(*) >= 2;

-- Create function to clean up expired tokens and sessions
CREATE VIEW IF NOT EXISTS security_cleanup_needed AS
SELECT 
    'expired_revoked_tokens' as cleanup_type,
    COUNT(*) as record_count,
    'DELETE FROM revoked_tokens WHERE expires_at < datetime("now")' as cleanup_sql
FROM revoked_tokens 
WHERE expires_at < datetime('now')
UNION ALL
SELECT 
    'expired_sessions' as cleanup_type,
    COUNT(*) as record_count,
    'DELETE FROM user_sessions WHERE expires_at < datetime("now")' as cleanup_sql
FROM user_sessions 
WHERE expires_at < datetime('now')
UNION ALL
SELECT 
    'old_login_attempts' as cleanup_type,
    COUNT(*) as record_count,
    'DELETE FROM login_attempts WHERE attempted_at < datetime("now", "-30 days")' as cleanup_sql
FROM login_attempts 
WHERE attempted_at < datetime('now', '-30 days')
UNION ALL
SELECT 
    'resolved_security_events' as cleanup_type,
    COUNT(*) as record_count,
    'DELETE FROM security_events WHERE resolved_at IS NOT NULL AND resolved_at < datetime("now", "-90 days")' as cleanup_sql
FROM security_events 
WHERE resolved_at IS NOT NULL 
  AND resolved_at < datetime('now', '-90 days');