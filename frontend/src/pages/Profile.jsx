// src/pages/Profile.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Profile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await authAPI.updateMe(form);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed.');
    } finally { setSaving(false); }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'FA';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><User size={22} /> Profile</h1>
          <p className="page-desc">Manage your account information</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, maxWidth: 900 }}>
        {/* Avatar Card */}
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--green-600), var(--green-400))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: 'white', margin: '0 auto 16px'
          }}>{initials}</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
          <div className="text-muted text-sm mt-1">{user?.email}</div>
          <div className="mt-3">
            <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
          {user?.created_at && (
            <div className="text-xs text-muted mt-3">
              Member since {format(parseISO(user.created_at), 'MMMM yyyy')}
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>Edit Profile</div>
          {error && <div className="auth-error">{error}</div>}
          {success && (
            <div style={{
              background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.3)',
              borderRadius: 8, padding: '10px 14px', fontSize: 14, color: 'var(--color-success)', marginBottom: 16
            }}>{success}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-input" value={user?.role || ''} disabled style={{ opacity: 0.6 }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
