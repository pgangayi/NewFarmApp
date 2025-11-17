import React, { useEffect, useState } from 'react';
import { AuditLog } from '../../types/audit';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(50);
  const [offset, setOffset] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    user_id: '',
    farm_id: '',
    event_type: '',
    date_from: '',
    date_to: '',
  });
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // Check auth validity first
    (async () => {
      try {
        const res = await fetch('/api/auth/validate');
        if (!res.ok) {
          setIsAdmin(false);
          setError('Authentication required');
          return;
        }
        const body = await res.json();
        // We treat any authenticated user as allowed to view farm-scoped logs;
        // global access requires server-side ADMIN_API_KEY or SUPER_ADMIN_ID.
        setIsAdmin(true);
      } catch (err: any) {
        setIsAdmin(false);
        setError(err.message || 'Auth check failed');
      }
    })();
  }, []);

  useEffect(() => {
    if (isAdmin) fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, limit, offset]);

  function buildQuery(cursor?: string) {
    const q = new URLSearchParams();
    if (filters.user_id) q.set('user_id', filters.user_id);
    if (filters.farm_id) q.set('farm_id', filters.farm_id);
    if (filters.event_type) q.set('event_type', filters.event_type);
    if (filters.date_from) q.set('date_from', filters.date_from);
    if (filters.date_to) q.set('date_to', filters.date_to);
    q.set('limit', String(limit));
    if (cursor) {
      q.set('cursor', cursor);
    } else {
      q.set('offset', String(offset));
    }
    return q.toString();
  }

  async function fetchLogs() {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery();
      const res = await fetch(`/api/admin/audit-logs?${qs}`);
      if (res.status === 401) {
        setIsAdmin(false);
        setError('Unauthorized');
        return;
      }
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const body = await res.json();
      setLogs(body.data || []);
      setTotal(body.total || 0);
      setNextCursor(body.next_cursor || null);
      setPrevCursor(body.prev_cursor || null);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function onChangeFilter<K extends keyof typeof filters>(key: K, value: string) {
    setFilters(f => ({ ...f, [key]: value }));
  }

  function exportCsv() {
    if (
      !window.confirm(
        'Export current results to CSV? This will download potentially sensitive data.'
      )
    )
      return;
    const header = [
      'id',
      'timestamp',
      'event_type',
      'user_id',
      'email',
      'farm_id',
      'ip_address',
      'user_agent',
      'metadata',
    ];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      l.event_type,
      l.user_id || '',
      l.email || '',
      String(l.farm_id || ''),
      l.ip_address || '',
      l.user_agent || '',
      l.metadata ? JSON.stringify(l.metadata) : '',
    ]);

    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Audit Logs</h2>
      {isAdmin === false && <div style={{ color: 'red' }}>Not authorized</div>}
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          placeholder="user_id"
          value={filters.user_id}
          onChange={e => onChangeFilter('user_id', e.target.value)}
        />
        <input
          placeholder="farm_id"
          value={filters.farm_id}
          onChange={e => onChangeFilter('farm_id', e.target.value)}
        />
        <input
          placeholder="event_type"
          value={filters.event_type}
          onChange={e => onChangeFilter('event_type', e.target.value)}
        />
        <input
          type="date"
          value={filters.date_from}
          onChange={e => onChangeFilter('date_from', e.target.value)}
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={e => onChangeFilter('date_to', e.target.value)}
        />
        <button
          onClick={() => {
            setOffset(0);
            fetchLogs();
          }}
        >
          Apply
        </button>
        <button onClick={() => exportCsv()} disabled={logs.length === 0}>
          Export CSV
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Timestamp</th>
              <th style={{ textAlign: 'left' }}>Event</th>
              <th style={{ textAlign: 'left' }}>User</th>
              <th style={{ textAlign: 'left' }}>Email</th>
              <th style={{ textAlign: 'left' }}>IP</th>
              <th style={{ textAlign: 'left' }}>Metadata</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td>{l.timestamp}</td>
                <td>{l.event_type}</td>
                <td>{l.user_id}</td>
                <td>{l.email}</td>
                <td>{l.ip_address}</td>
                <td style={{ maxWidth: 400, overflow: 'hidden' }}>{l.metadata}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => {
            if (prevCursor) {
              // fetch using prev cursor
              (async () => {
                setLoading(true);
                setError(null);
                try {
                  const qs = buildQuery(prevCursor);
                  const res = await fetch(`/api/admin/audit-logs?${qs}`);
                  if (!res.ok) throw new Error(`Failed: ${res.status}`);
                  const body = await res.json();
                  setLogs(body.data || []);
                  setTotal(body.total || 0);
                  setNextCursor(body.next_cursor || null);
                  setPrevCursor(body.prev_cursor || null);
                } catch (err: any) {
                  setError(err.message || 'Unknown error');
                } finally {
                  setLoading(false);
                }
              })();
            } else {
              setOffset(Math.max(0, offset - limit));
              fetchLogs();
            }
          }}
          disabled={offset === 0 && !prevCursor}
        >
          Prev
        </button>

        <button
          onClick={() => {
            if (nextCursor) {
              (async () => {
                setLoading(true);
                setError(null);
                try {
                  const qs = buildQuery(nextCursor);
                  const res = await fetch(`/api/admin/audit-logs?${qs}`);
                  if (!res.ok) throw new Error(`Failed: ${res.status}`);
                  const body = await res.json();
                  setLogs(body.data || []);
                  setTotal(body.total || 0);
                  setNextCursor(body.next_cursor || null);
                  setPrevCursor(body.prev_cursor || null);
                } catch (err: any) {
                  setError(err.message || 'Unknown error');
                } finally {
                  setLoading(false);
                }
              })();
            } else {
              setOffset(offset + limit);
              fetchLogs();
            }
          }}
          disabled={offset + limit >= total && !nextCursor}
        >
          Next
        </button>

        <span>
          Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
        </span>

        <select
          value={limit}
          onChange={e => {
            setLimit(parseInt(e.target.value, 10));
            setOffset(0);
          }}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
}
