export type AuditLog = {
  id: string;
  timestamp: string;
  event_type: string;
  user_id?: string | null;
  email?: string | null;
  farm_id?: string | number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: string | null;
};
