-- 0003_operations_idempotency_and_rls.sql
-- Idempotency/operations table and example RLS policies for key tables

-- Operations table for idempotency keys and stored responses (simple schema)
CREATE TABLE IF NOT EXISTS operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL,
  user_id uuid,
  request_body jsonb,
  response_body jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (idempotency_key)
);

-- Enable row-level security on tables we want to restrict (example)
-- NOTE: adjust policy logic to match your farm membership schema.

ALTER TABLE IF EXISTS inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS finance_entries ENABLE ROW LEVEL SECURITY;

-- Example policy: allow farm members (owner/manager/worker) to select inventory_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'select_inventory_items') THEN
    EXECUTE $$
      CREATE POLICY select_inventory_items ON inventory_items
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM farm_members fm WHERE fm.farm_id = inventory_items.farm_id AND fm.user_id = auth.uid()
          )
        );
    $$;
  END IF;
END$$;

-- Example policy: allow insert/update by members with role in ('owner','manager')
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'modify_inventory_items') THEN
    EXECUTE $$
      CREATE POLICY modify_inventory_items ON inventory_items
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM farm_members fm WHERE fm.farm_id = inventory_items.farm_id AND fm.user_id = auth.uid() AND fm.role IN ('owner','manager')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM farm_members fm WHERE fm.farm_id = inventory_items.farm_id AND fm.user_id = auth.uid() AND fm.role IN ('owner','manager')
          )
        );
    $$;
  END IF;
END$$;

-- Do the same for inventory_transactions and finance_entries as needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'select_inventory_transactions') THEN
    EXECUTE $$
      CREATE POLICY select_inventory_transactions ON inventory_transactions
        FOR SELECT
        USING (
          EXISTS (SELECT 1 FROM farm_members fm WHERE fm.farm_id = inventory_transactions.farm_id AND fm.user_id = auth.uid())
        );
    $$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'insert_inventory_transactions') THEN
    EXECUTE $$
      CREATE POLICY insert_inventory_transactions ON inventory_transactions
        FOR INSERT
        WITH CHECK (
          EXISTS (SELECT 1 FROM farm_members fm WHERE fm.farm_id = inventory_transactions.farm_id AND fm.user_id = auth.uid() AND fm.role IN ('owner','manager'))
        );
    $$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'select_finance_entries') THEN
    EXECUTE $$
      CREATE POLICY select_finance_entries ON finance_entries
        FOR SELECT
        USING (
          EXISTS (SELECT 1 FROM farm_members fm WHERE fm.farm_id = finance_entries.farm_id AND fm.user_id = auth.uid())
        );
    $$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'insert_finance_entries') THEN
    EXECUTE $$
      CREATE POLICY insert_finance_entries ON finance_entries
        FOR INSERT
        WITH CHECK (
          EXISTS (SELECT 1 FROM farm_members fm WHERE fm.farm_id = finance_entries.farm_id AND fm.user_id = auth.uid() AND fm.role IN ('owner','accounting','admin'))
        );
    $$;
  END IF;
END$$;

-- NOTE: The above policy creation statements will fail if the named policies already exist.
-- In a production migration, guard with conditional checks or use explicit DROP POLICY if present.
