
  PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;
-- Clean up any existing references before deleting or recreating the user
DELETE FROM csrf_tokens WHERE user_id = 'e2e-test-user-1';
DELETE FROM user_sessions WHERE user_id = 'e2e-test-user-1';
DELETE FROM audit_logs WHERE user_id = 'e2e-test-user-1' OR email = 'e2e+user@example.com';
DELETE FROM operations WHERE user_id = 'e2e-test-user-1';
DELETE FROM tasks WHERE assigned_to = 'e2e-test-user-1' OR created_by = 'e2e-test-user-1';
DELETE FROM treatments WHERE created_by = 'e2e-test-user-1';
DELETE FROM inventory_transactions WHERE created_by = 'e2e-test-user-1';
DELETE FROM finance_entries WHERE created_by = 'e2e-test-user-1';
DELETE FROM farm_members WHERE user_id = 'e2e-test-user-1' OR farm_id IN (
  SELECT id FROM farms WHERE owner_id = 'e2e-test-user-1'
);
DELETE FROM password_reset_tokens WHERE user_id = 'e2e-test-user-1';
DELETE FROM farms WHERE owner_id = 'e2e-test-user-1' OR name = 'E2E Farm';
DELETE FROM users WHERE id = 'e2e-test-user-1';

-- Recreate deterministic E2E user and farm
INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
VALUES ('e2e-test-user-1', 'e2e+user@example.com', 'E2E User', '$2b$10$6339cS36LuG3JdL3zcIGz.q2KhGWAaM01cBmT4z2FzZF49MgoU4kK', datetime('now'), datetime('now'));

INSERT INTO farms (name, location, area_hectares, owner_id, created_at, updated_at)
VALUES ('E2E Farm', 'Localhost', 1.0, 'e2e-test-user-1', datetime('now'), datetime('now'));

INSERT INTO farm_members (farm_id, user_id, role, created_at)
VALUES (last_insert_rowid(), 'e2e-test-user-1', 'owner', datetime('now'));

COMMIT;
PRAGMA foreign_keys = ON;
