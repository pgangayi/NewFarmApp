-- Add session tracking for enhanced security
-- Migration: 0031_add_session_tracking
-- Date: January 22, 2026

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    device_fingerprint TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, user_id);

-- Add session_id to users table for tracking
ALTER TABLE users ADD COLUMN last_session_id TEXT;
ALTER TABLE users ADD COLUMN concurrent_sessions INTEGER DEFAULT 1;