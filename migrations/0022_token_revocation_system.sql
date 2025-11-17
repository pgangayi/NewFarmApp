-- Migration 0022: Token Revocation System
-- Date: November 20, 2025
-- Adds revoked token storage for audit and forced logout flows

CREATE TABLE revoked_tokens (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    token_type TEXT NOT NULL DEFAULT 'access',
    revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    revoked_by TEXT,
    reason TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (revoked_by) REFERENCES users(id)
);

CREATE INDEX idx_revoked_tokens_user ON revoked_tokens(user_id);
CREATE INDEX idx_revoked_tokens_hash ON revoked_tokens(token_hash);
CREATE INDEX idx_revoked_tokens_type ON revoked_tokens(token_type);
CREATE INDEX idx_revoked_tokens_expires ON revoked_tokens(expires_at);
CREATE INDEX idx_revoked_tokens_revoked_at ON revoked_tokens(revoked_at);
