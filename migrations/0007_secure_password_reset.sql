-- Migration: Secure Password Reset Token Storage
-- Updates password reset tokens to use hashed storage for security
-- Date: November 10, 2025

-- Add token_hash column for secure token storage
ALTER TABLE password_reset_tokens ADD COLUMN token_hash TEXT;

-- Add index for token_hash lookup
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);

-- Migration function to hash existing plaintext tokens
-- This would be run once during deployment
/*
-- Example migration for existing tokens (run manually)
UPDATE password_reset_tokens 
SET token_hash = lower(hex(sha256(token)))
WHERE token_hash IS NULL;
*/