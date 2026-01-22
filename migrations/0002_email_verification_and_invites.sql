-- Email Verification and Farm Invites Migration
-- Adds tables for email verification tokens and farm worker invitations
-- Date: January 22, 2026

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- EMAIL VERIFICATION SYSTEM
-- ============================================================================

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- FARM INVITATION SYSTEM
-- ============================================================================

-- Farm invitations table
CREATE TABLE IF NOT EXISTS farm_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'worker' CHECK (role IN ('owner', 'manager', 'worker', 'member')),
    message TEXT,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired')),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    invited_by INTEGER NOT NULL,
    accepted_at DATETIME,
    accepted_by INTEGER,
    revoked_at DATETIME,
    revoked_by INTEGER,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Email verification tokens indexes
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email ON email_verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_used ON email_verification_tokens(used);

-- Farm invitations indexes
CREATE INDEX IF NOT EXISTS idx_farm_invites_farm_id ON farm_invites(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_invites_email ON farm_invites(email);
CREATE INDEX IF NOT EXISTS idx_farm_invites_token ON farm_invites(token);
CREATE INDEX IF NOT EXISTS idx_farm_invites_status ON farm_invites(status);
CREATE INDEX IF NOT EXISTS idx_farm_invites_expires_at ON farm_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_farm_invites_invited_by ON farm_invites(invited_by);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC CLEANUP
-- ============================================================================

-- Auto-expire verification tokens
CREATE TRIGGER IF NOT EXISTS expire_verification_tokens
    AFTER INSERT ON email_verification_tokens
BEGIN
    DELETE FROM email_verification_tokens WHERE expires_at < datetime('now');
END;

-- Auto-expire farm invitations
CREATE TRIGGER IF NOT EXISTS expire_farm_invites
    AFTER INSERT ON farm_invites
BEGIN
    UPDATE farm_invites 
    SET status = 'expired' 
    WHERE status = 'pending' AND expires_at < datetime('now');
END;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Pending farm invitations view
CREATE VIEW IF NOT EXISTS pending_farm_invites AS
SELECT 
    fi.id,
    fi.farm_id,
    f.farm_name,
    fi.email,
    fi.role,
    fi.message,
    fi.created_at,
    fi.expires_at,
    u.name as inviter_name,
    u.email as inviter_email
FROM farm_invites fi
JOIN farms f ON fi.farm_id = f.id
LEFT JOIN users u ON fi.invited_by = u.id
WHERE fi.status = 'pending' AND fi.expires_at > datetime('now')
ORDER BY fi.created_at DESC;

-- User's pending invitations view
CREATE VIEW IF NOT EXISTS user_pending_invites AS
SELECT 
    fi.id,
    fi.farm_id,
    f.farm_name,
    f.location,
    fi.role,
    fi.message,
    fi.created_at,
    fi.expires_at,
    u.name as inviter_name,
    u.email as inviter_email
FROM farm_invites fi
JOIN farms f ON fi.farm_id = f.id
LEFT JOIN users u ON fi.invited_by = u.id
WHERE fi.status = 'pending' 
  AND fi.expires_at > datetime('now')
  AND fi.email = (SELECT email FROM users WHERE id = ?)
ORDER BY fi.created_at DESC;
