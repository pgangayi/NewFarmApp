-- 0002_core_inventory_finance.sql
-- Core tables for farms, inventory items, inventory transactions, finance entries, and treatments
-- Adapt as needed to your canonical schema (Prisma or raw SQL migrations).

-- Farms (minimal)
CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  metadata jsonb,
  owner_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Farm members (for RLS joins)
CREATE TABLE IF NOT EXISTS farm_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  qty numeric NOT NULL DEFAULT 0,
  unit text,
  reorder_threshold numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_items_farm ON inventory_items(farm_id);

-- Inventory transactions (single source of truth)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  qty_delta numeric NOT NULL,
  unit text,
  reason_type text NOT NULL,
  reference_type text,
  reference_id uuid,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_farm ON inventory_transactions(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(inventory_item_id);

-- Finance entries
CREATE TABLE IF NOT EXISTS finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  account text,
  description text,
  reference_type text,
  reference_id uuid,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_finance_entries_farm ON finance_entries(farm_id);

-- Treatments (operational record used by apply-treatment handler)
CREATE TABLE IF NOT EXISTS treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  notes text,
  applied_at timestamptz NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_treatments_farm ON treatments(farm_id);
