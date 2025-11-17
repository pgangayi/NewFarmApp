-- 0005_audit_logs_and_operations.sql
-- Audit logs table for tracking operational mutations
-- Operations table for idempotency (if not already created)

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  action text NOT NULL, -- 'create', 'update', 'delete'
  entity_type text NOT NULL, -- 'farm', 'field', 'animal', 'task', 'inventory_item', 'treatment', etc.
  entity_id uuid,
  changes jsonb, -- {before: {...}, after: {...}}
  ip_address inet,
  user_agent text,
  performed_at timestamptz DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_audit_logs_farm_entity ON audit_logs(farm_id, entity_type, performed_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, performed_at DESC);

-- Operations table for idempotency (if not already exists)
CREATE TABLE IF NOT EXISTS operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL,
  user_id uuid,
  request_body jsonb,
  response_body jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (idempotency_key)
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_logs
CREATE POLICY "Users can view audit logs for farms they belong to" ON audit_logs
  FOR SELECT
  USING (
    farm_id IN (
      SELECT farm_id FROM farm_members WHERE user_id = auth.uid()
    ) OR
    user_id = auth.uid()
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- RLS policies for operations
CREATE POLICY "Users can view their own operations" ON operations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage operations" ON operations
  FOR ALL
  USING (true);