/**
 * @typedef {Object} AuditLog
 * @property {string} id
 * @property {string} timestamp
 * @property {string} event_type
 * @property {string|null} [user_id]
 * @property {string|null} [email]
 * @property {number|string|null} [farm_id]
 * @property {string|null} [ip_address]
 * @property {string|null} [user_agent]
 * @property {string|null} [metadata]
 */

// Export a helper used by server-side code if needed
export const AuditTypes = {
  AuditLog: /** @type {AuditLog} */ ({}),
};
