// src/pages/Alerts.jsx
import { useState, useEffect } from 'react';
import { alertsAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { Bell, CheckCircle, BookOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const SEVERITY_ICON = { critical: '🔴', warning: '🟡', info: '🔵' };
const SEV_CLASS = { critical: 'danger', warning: 'warning', info: 'info' };

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const load = (status) => {
    setLoading(true);
    alertsAPI.list(status === 'all' ? undefined : status)
      .then(r => setAlerts(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleStatus = async (id, status) => {
    try {
      await alertsAPI.updateStatus(id, status);
      load(filter);
      showToast(`Alert marked as ${status}.`);
    } catch { showToast('Failed to update alert.'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Bell size={22} /> Alert Center</h1>
          <p className="page-desc">Monitor and manage farm alerts and notifications</p>
        </div>
        <div className="flex gap-2">
          {['active', 'read', 'resolved', 'all'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        alerts.length === 0
          ? <div className="card">
              <EmptyState
                title={filter === 'active' ? '🎉 No active alerts!' : 'No alerts found'}
                description={filter === 'active' ? 'All your fields are within normal parameters.' : `No ${filter} alerts.`}
              />
            </div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {alerts.map((a) => (
                <div key={a.id} className={`alert-card ${a.severity}`}
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 20, flexShrink: 0 }}>{SEVERITY_ICON[a.severity] || '⚪'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{a.message}</div>
                    <div className="alert-time">
                      {a.field_name} · {a.alert_type.replace('_', ' ')} ·{' '}
                      {a.created_at ? format(parseISO(a.created_at), 'MMM d, HH:mm') : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={`badge badge-${SEV_CLASS[a.severity] || 'neutral'}`}>{a.severity}</span>
                    <span className="badge badge-neutral">{a.status}</span>
                    {a.status === 'active' && (
                      <div className="flex gap-2 mt-1">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleStatus(a.id, 'read')}>
                          <BookOpen size={12} /> Read
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleStatus(a.id, 'resolved')}>
                          <CheckCircle size={12} /> Resolve
                        </button>
                      </div>
                    )}
                    {a.status === 'read' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleStatus(a.id, 'resolved')}>
                        <CheckCircle size={12} /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
      )}

      {toast && <div className="toast-container"><div className="toast success">{toast}</div></div>}
    </div>
  );
}
