/**
 * Lightweight serverless handler for /api/operations/apply-treatment
 * - Designed to be unit-testable with an injectable `db` dependency (a minimal pg-like client).
 * - Does basic validation and performs a simulated transactional flow when a `db` with transaction
 *   semantics is provided. For real usage, supply a `pg` Client and call as a Pages Function or similar.
 *
 * This file intentionally avoids external dependencies so it can be reviewed and tested easily.
 */

// Exported for tests and for use as a function handler
function validatePayload(payload) {
  if (!payload) throw { status: 400, message: 'Missing payload' };
  const { farmId, targetType, targetId, items, appliedAt } = payload;
  if (!farmId) throw { status: 400, message: 'farmId is required' };
  if (!targetType || !['livestock', 'crop'].includes(targetType)) throw { status: 400, message: 'targetType must be "livestock" or "crop"' };
  if (!targetId) throw { status: 400, message: 'targetId is required' };
  if (!items || !Array.isArray(items) || items.length === 0) throw { status: 400, message: 'items must be a non-empty array' };
  for (const it of items) {
    if (!it.inventoryItemId) throw { status: 400, message: 'each item requires inventoryItemId' };
    if (typeof it.qty !== 'number' || it.qty <= 0) throw { status: 400, message: 'each item qty must be a positive number' };
  }
  if (!appliedAt) throw { status: 400, message: 'appliedAt is required' };
  return true;
}

async function applyTreatment({ payload, deps = {} }) {
  // deps.db is expected to be an object with methods: connect(), query(text, params), begin/commit/rollback helpers
  validatePayload(payload);

  const { db, idempotencyKey } = deps;

  // Simple idempotency check hook; implementers should replace with real operations table lookup.
  if (idempotencyKey && deps.checkIdempotency) {
    const existing = await deps.checkIdempotency(idempotencyKey);
    if (existing) return { status: 200, body: existing };
  }

  // If no DB client provided, return a dry-run success for review
  if (!db) {
    return {
      status: 200,
      body: { message: 'dry-run: payload validated', payloadSummary: { farmId: payload.farmId, itemsCount: payload.items.length } }
    };
  }

  // Begin transaction - db is expected to provide a simple transaction API used in tests below
  try {
    await db.begin();

    const txResults = { inventoryTransactions: [] };

    // For each item, lock/select for update and decrement if possible
    for (const it of payload.items) {
      // Query current qty for the inventory item
      const res = await db.query('SELECT id, qty FROM inventory_items WHERE id = $1 FOR UPDATE', [it.inventoryItemId]);
      if (!res || res.rowCount === 0) {
        throw { status: 400, message: `inventory item not found: ${it.inventoryItemId}` };
      }
      const current = Number(res.rows[0].qty || 0);
      if (current < it.qty && !payload.overrideIfInsufficient) {
        // rollback and return 409 conflict
        await db.rollback();
        return { status: 409, body: { message: 'insufficient inventory', inventoryItemId: it.inventoryItemId, available: current } };
      }

      // perform update
      await db.query('UPDATE inventory_items SET qty = qty - $1 WHERE id = $2', [it.qty, it.inventoryItemId]);

      // insert inventory transaction record
      const insert = await db.query(
        `INSERT INTO inventory_transactions (inventory_item_id, farm_id, qty_delta, unit, reason_type, created_by)
         VALUES ($1, $2, $3, $4, 'treatment', $5) RETURNING id`,
        [it.inventoryItemId, payload.farmId, -Math.abs(it.qty), it.unit || null, deps.userId || null]
      );
      txResults.inventoryTransactions.push(insert.rows[0].id);
    }

    // Insert a treatment record (simplified)
    const treatment = await db.query(
      `INSERT INTO treatments (farm_id, target_type, target_id, notes, applied_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [payload.farmId, payload.targetType, payload.targetId, payload.notes || null, payload.appliedAt, deps.userId || null]
    );

    await db.commit();

    return { status: 200, body: { treatmentId: treatment.rows[0].id, inventoryTransactionIds: txResults.inventoryTransactions } };
  } catch (err) {
    // try to rollback if possible
    try { if (db) await db.rollback(); } catch (e) { /* ignore */ }
    if (err && err.status) return { status: err.status, body: { message: err.message } };
    return { status: 500, body: { message: err && err.message ? err.message : String(err) } };
  }
}

// Minimal compatibility wrapper so this file can be used as a Netlify/Vercel/Pages Function
async function handler(req, res, deps = {}) {
  try {
    const payload = req.body || (req.method === 'GET' ? req.query : undefined);
    const result = await applyTreatment({ payload, deps });
    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || String(err) });
  }
}

module.exports = { validatePayload, applyTreatment, handler };
