-- Add MFA support to users table
-- Migration: 0030_add_mfa
-- Date: January 22, 2026

ALTER TABLE users ADD COLUMN mfa_secret TEXT;
ALTER TABLE users ADD COLUMN mfa_enabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN mfa_backup_codes TEXT; -- JSON array of backup codes

-- Create index for MFA enabled users
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled);