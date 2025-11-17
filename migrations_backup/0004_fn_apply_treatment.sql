-- 0004_fn_apply_treatment.sql
-- Create a PL/pgSQL function `apply_treatment(payload jsonb, user_id uuid, idempotency_key text)`
-- that performs the transactional treatment application using server-side Postgres logic.

CREATE OR REPLACE FUNCTION apply_treatment(payload jsonb, user_id uuid, idempotency_key text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_treatment_id uuid;
  v_item jsonb;
  v_item_id uuid;
  v_qty numeric;
  v_current numeric;
  v_tx_id uuid;
  tx_ids jsonb := '[]'::jsonb;
  res jsonb;
  existing jsonb;
BEGIN
  -- Idempotency: return existing response if present
  IF idempotency_key IS NOT NULL THEN
    SELECT response_body INTO existing FROM operations WHERE idempotency_key = idempotency_key LIMIT 1;
    IF existing IS NOT NULL THEN
      RETURN existing;
    END IF;
  END IF;

  -- Start transactional work (function runs inside a transaction scope of caller)

  -- Insert treatment record first to get id for references
  INSERT INTO treatments (farm_id, target_type, target_id, notes, applied_at, created_by)
    VALUES (
      (payload->> 'farmId')::uuid,
      payload->> 'targetType',
      (payload->> 'targetId')::uuid,
      payload->> 'notes',
      (payload->> 'appliedAt')::timestamptz,
      user_id
    ) RETURNING id INTO v_treatment_id;

  -- Loop through items array
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items') LOOP
    v_item_id := (v_item->> 'inventoryItemId')::uuid;
    v_qty := (v_item->> 'qty')::numeric;

    -- Lock inventory row
    SELECT qty INTO v_current FROM inventory_items WHERE id = v_item_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'inventory_item_not_found: %', v_item_id USING ERRCODE = 'P0001';
    END IF;

    IF v_current < v_qty THEN
      RAISE EXCEPTION 'insufficient_inventory: item=% available=% needed=%', v_item_id, v_current, v_qty USING ERRCODE = 'P0002';
    END IF;

    -- Update inventory
    UPDATE inventory_items SET qty = qty - v_qty WHERE id = v_item_id;

    -- Insert inventory transaction
    INSERT INTO inventory_transactions (inventory_item_id, farm_id, qty_delta, unit, reason_type, reference_type, reference_id, created_by)
      VALUES (
        v_item_id,
        (payload->> 'farmId')::uuid,
        -v_qty,
        v_item->> 'unit',
        'treatment',
        'treatment',
        v_treatment_id,
        user_id
      ) RETURNING id INTO v_tx_id;

    tx_ids := tx_ids || to_jsonb(v_tx_id);

    -- Create finance entry for the cost (if unit_cost provided)
    IF (v_item->> 'unitCost') IS NOT NULL THEN
      INSERT INTO finance_entries (farm_id, entry_date, type, category, amount, currency, description, reference_type, reference_id, created_by)
        VALUES (
          (payload->> 'farmId')::uuid,
          CURRENT_DATE,
          'expense',
          'veterinary',
          ((v_item->> 'unitCost')::numeric * v_qty),
          'USD',
          'Treatment application: ' || (SELECT name FROM inventory_items WHERE id = v_item_id),
          'treatment',
          v_treatment_id,
          user_id
        );
    END IF;
  END LOOP;

  -- Build response
  res := jsonb_build_object('treatmentId', v_treatment_id, 'inventoryTransactionIds', tx_ids);

  -- Persist idempotency response if requested
  IF idempotency_key IS NOT NULL THEN
    INSERT INTO operations (idempotency_key, user_id, request_body, response_body)
      VALUES (idempotency_key, user_id, payload, res)
      ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  RETURN res;
EXCEPTION
  WHEN SQLSTATE 'P0002' THEN
    -- translate insufficient inventory to a JSON error response
    RETURN jsonb_build_object('error', 'insufficient_inventory');
  WHEN OTHERS THEN
    RAISE;
END;
$$;
