require('dotenv').config();
const { createDbFromConnectionString } = require('./db_pg');
const { applyTreatment } = require('./apply-treatment');
const fs = require('fs');
const path = require('path');

async function runMigrations(db) {
  const migrationsDir = path.join(__dirname, '../../../migrations');
  const files = ['0001_enable_postgis.sql', '0002_core_inventory_finance.sql', '0003_operations_idempotency_and_rls.sql'];
  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
    console.log('Running migration', f);
    await db.query(sql);
  }
}

async function run() {
  const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL || `postgres://postgres:postgres@localhost:5432/postgres`;
  const db = createDbFromConnectionString(conn);
  await db.connect();
  try {
    // Run migrations
    await runMigrations(db);

    // Seed a farm and inventory item
    const farmRes = await db.query('INSERT INTO farms (name) VALUES ($1) RETURNING id', ['test-farm']);
    const farmId = farmRes.rows[0].id;

    const itemRes = await db.query('INSERT INTO inventory_items (farm_id, name, qty, unit) VALUES ($1,$2,$3,$4) RETURNING id', [farmId, 'Test Item', 10, 'unit']);
    const itemId = itemRes.rows[0].id;

    // Prepare payload
    const payload = {
      farmId,
      targetType: 'livestock',
      targetId: 'dummy-animal',
      appliedAt: new Date().toISOString(),
      items: [{ inventoryItemId: itemId, qty: 4, unit: 'unit' }]
    };

    const res = await applyTreatment({ payload, deps: { db, userId: 'test-user' } });
    console.log('applyTreatment result:', res);
    if (res.status !== 200) throw new Error('applyTreatment failed: ' + JSON.stringify(res));

    // Verify inventory decreased
    const inv = await db.query('SELECT qty FROM inventory_items WHERE id = $1', [itemId]);
    const remaining = Number(inv.rows[0].qty);
    if (remaining !== 6) throw new Error(`Expected remaining qty 6, got ${remaining}`);

    console.log('Integration test passed');
  } finally {
    await db.end();
  }
}

run().catch(err => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
