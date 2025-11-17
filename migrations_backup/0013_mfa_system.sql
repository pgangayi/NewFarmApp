-- Migration: Multi-Factor Authentication (MFA) System
-- Date: November 12, 2025
-- Purpose: Add TOTP-based 2FA support to the authentication system

-- Add MFA columns to users table
ALTER TABLE users ADD COLUMN totp_secret TEXT; -- Base32 encoded TOTP secret
ALTER TABLE users ADD COLUMN mfa_enabled INTEGER DEFAULT 0; -- Boolean flag for MFA status
ALTER TABLE users ADD COLUMN mfa_enabled_at DATETIME; -- When MFA was enabled
ALTER TABLE users ADD COLUMN backup_codes_enabled INTEGER DEFAULT 0; -- Whether backup codes are enabled
ALTER TABLE users ADD COLUMN backup_codes_generated_at DATETIME; -- When backup codes were generated

-- Create MFA backup codes table
CREATE TABLE IF NOT EXISTS mfa_backup_codes (
    id TEXT PRIMARY KEY, -- Unique backup code ID
    user_id TEXT NOT NULL, -- User who owns these codes
    code_hash TEXT NOT NULL, -- Hash of the backup code
    used_at DATETIME, -- NULL means not used yet
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for MFA backup codes
CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_user_id ON mfa_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_used ON mfa_backup_codes(used_at);

-- Create MFA attempts tracking table
CREATE TABLE IF NOT EXISTS mfa_attempts (
    id TEXT PRIMARY KEY, -- Unique attempt ID
    user_id TEXT NOT NULL, -- User attempting MFA
    method TEXT NOT NULL DEFAULT 'TOTP', -- 'TOTP', 'backup_code'
    success BOOLEAN NOT NULL DEFAULT FALSE, -- Whether the attempt succeeded
    failure_reason TEXT, -- Reason for failure (if applicable)
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT, -- IP address of the attempt
    user_agent TEXT, -- User agent of the attempt
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for MFA attempts
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_user_id ON mfa_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_attempted_at ON mfa_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_ip_address ON mfa_attempts(ip_address);

-- Add MFA-related security settings
INSERT OR REPLACE INTO security_settings (setting_name, setting_value, description) VALUES
('enable_mfa', 'true', 'Enable multi-factor authentication for all users'),
('mfa_backup_codes_count', '8', 'Number of backup codes to generate per user'),
('mfa_code_validity_window', '3', 'TOTP time step tolerance (allows for clock skew)'),
('require_mfa_for_admin', 'true', 'Require MFA for administrative accounts'),
('max_mfa_attempts_per_hour', '10', 'Maximum MFA attempts per hour before temporary lockout'),
('mfa_lockout_duration_minutes', '30', 'Duration of MFA lockout in minutes'),
('backup_codes_expire_days', '365', 'Days until backup codes expire if unused');

-- Create view for MFA status monitoring
CREATE VIEW IF NOT EXISTS mfa_status_summary AS
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN mfa_enabled = 1 THEN 1 ELSE 0 END) as users_with_mfa,
    SUM(CASE WHEN mfa_enabled = 0 THEN 1 ELSE 0 END) as users_without_mfa,
    ROUND(AVG(CASE WHEN mfa_enabled = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) as mfa_adoption_rate_percent
FROM users;

-- Create view for MFA attempt statistics
CREATE VIEW IF NOT EXISTS mfa_attempts_summary AS
SELECT 
    DATE(attempted_at) as attempt_date,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_attempts,
    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_attempts,
    ROUND(AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate_percent,
    COUNT(DISTINCT user_id) as unique_users
FROM mfa_attempts 
WHERE attempted_at >= datetime('now', '-30 days')
GROUP BY DATE(attempted_at)
ORDER BY attempt_date DESC;

-- Create function to clean up expired MFA data
CREATE VIEW IF NOT EXISTS mfa_cleanup_needed AS
SELECT 
    'expired_mfa_backup_codes' as cleanup_type,
    COUNT(*) as record_count,
    'DELETE FROM mfa_backup_codes WHERE created_at < datetime("now", "-365 days")' as cleanup_sql
FROM mfa_backup_codes 
WHERE created_at < datetime('now', '-365 days')
    AND (used_at IS NULL OR used_at < datetime('now', '-365 days'))
UNION ALL
SELECT 
    'old_mfa_attempts' as cleanup_type,
    COUNT(*) as record_count,
    'DELETE FROM mfa_attempts WHERE attempted_at < datetime("now", "-90 days")' as cleanup_sql
FROM mfa_attempts 
WHERE attempted_at < datetime('now', '-90 days');

-- Update audit logs table to include MFA-specific events
-- (This assumes audit_logs table exists from previous migrations)
INSERT OR IGNORE INTO audit_logs (event_type, description) VALUES
('mfa_setup_initiated', 'User initiated MFA setup process'),
('mfa_setup_completed', 'User successfully completed MFA setup'),
('mfa_code_validated', 'User successfully validated MFA code'),
('mfa_code_failed', 'User failed MFA code validation'),
('mfa_disabled', 'User disabled MFA for their account'),
('backup_code_generated', 'New backup codes were generated for user'),
('backup_code_used', 'Backup code was successfully used for authentication'),
('backup_code_invalid', 'Invalid or expired backup code was attempted');

-- Add MFA-related indexes to audit_logs if they don't exist
CREATE INDEX IF NOT EXISTS idx_audit_logs_mfa_events ON audit_logs(event_type) WHERE event_type LIKE 'mfa_%';

-- Create procedure-like function for MFA statistics (SQLite compatible)
CREATE VIEW IF NOT EXISTS mfa_security_overview AS
SELECT 
    'Total Users' as metric,
    COUNT(*)::text as value
FROM users
UNION ALL
SELECT 
    'Users with MFA Enabled' as metric,
    COUNT(*)::text as value
FROM users WHERE mfa_enabled = 1
UNION ALL
SELECT 
    'MFA Adoption Rate (%)' as metric,
    ROUND(AVG(CASE WHEN mfa_enabled = 1 THEN 1.0 ELSE 0.0 END) * 100, 2)::text as value
FROM users
UNION ALL
SELECT 
    'Total MFA Attempts (30 days)' as metric,
    COUNT(*)::text as value
FROM mfa_attempts WHERE attempted_at >= datetime('now', '-30 days')
UNION ALL
SELECT 
    'Failed MFA Attempts (24h)' as metric,
    COUNT(*)::text as value
FROM mfa_attempts 
WHERE success = 0 
  AND attempted_at >= datetime('now', '-24 hours')
UNION ALL
SELECT 
    'Active Backup Code Users' as metric,
    COUNT(DISTINCT user_id)::text as value
FROM mfa_backup_codes WHERE used_at IS NULL;