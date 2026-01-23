-- Remove MFA support from users table
-- Migration: 0031_remove_mfa
-- Date: January 22, 2026

-- Drop MFA columns from users table
ALTER TABLE users DROP COLUMN mfa_secret;
ALTER TABLE users DROP COLUMN mfa_enabled;
ALTER TABLE users DROP COLUMN mfa_backup_codes;

-- Drop MFA-related indexes
DROP INDEX IF EXISTS idx_users_mfa_enabled;

-- Note: Keeping mfa_backup_codes table and mfa_attempts table for historical data
-- They can be dropped later if not needed