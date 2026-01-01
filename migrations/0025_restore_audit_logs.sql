-- Restore Audit Logs and Operations tables for SQLite
-- Adapted from 0005_audit_logs_and_operations.sql

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  farm_id INTEGER,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  changes TEXT, -- JSON string
  ip_address TEXT,
  user_agent TEXT,
  performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_farm_entity ON audit_logs(farm_id, entity_type, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, performed_at DESC);

CREATE TABLE IF NOT EXISTS operations (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  user_id TEXT,
  request_body TEXT,
  response_body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
