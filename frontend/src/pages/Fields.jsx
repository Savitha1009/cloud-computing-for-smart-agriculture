// src/pages/Fields.jsx
import { useState, useEffect } from 'react';
import { fieldsAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Edit2, Trash2, MapPin, X } from 'lucide-react';

const EMPTY_FORM = {
  name: '', location: '', latitude: '', longitude: '',
  area_hectares: '', soil_type: '', description: ''
};

export default function Fields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = () => {
    setLoading(true);
    fieldsAPI.list().then(r => setFields(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setModal(true); };
  const openEdit = (f) => {
    setEditing(f.id);
    setForm({ name: f.name, location: f.location, latitude: f.latitude,
      longitude: f.longitude, area_hectares: f.area_hectares,
      soil_type: f.soil_type || '', description: f.description || '' });
    setError('');
    setModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        area_hectares: parseFloat(form.area_hectares),
      };
      if (editing) await fieldsAPI.update(editing, payload);
      else await fieldsAPI.create(payload);
      setModal(false);
      load();
      showToast(editing ? 'Field updated!' : 'Field created!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save field.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this field and all its data? This cannot be undone.')) return;
    try {
      await fieldsAPI.delete(id);
      load();
      showToast('Field deleted.');
    } catch { showToast('Delete failed.'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><MapPin size={22} /> Fields</h1>
          <p className="page-desc">Manage your agricultural fields and monitoring zones</p>
        </div>
        <button id="add-field-btn" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Field
        </button>
      </div>

      {fields.length === 0
        ? <div className="card">
            <EmptyState
              title="No fields registered"
              description="Add your first agricultural field to start monitoring soil and weather conditions."
              action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Field</button>}
            />
          </div>
        : <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Field Name</th>
                    <th>Location</th>
                    <th>Area (ha)</th>
                    <th>Soil Type</th>
                    <th>Coordinates</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f) => (
                    <tr key={f.id}>
                      <td><strong>{f.name}</strong></td>
                      <td>{f.location}</td>
                      <td>{f.area_hectares}</td>
                      <td>{f.soil_type || '—'}</td>
                      <td className="text-sm text-muted">{f.latitude?.toFixed(4)}, {f.longitude?.toFixed(4)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)}>
                            <Edit2 size={14} /> Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      }

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Field' : 'Add Field'}</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Field Name *</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} required placeholder="North Field" />
              </div>
              <div className="form-group">
                <label className="form-label">Location *</label>
                <input className="form-input" name="location" value={form.location} onChange={handleChange} required placeholder="Karnataka, India" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Latitude *</label>
                  <input className="form-input" name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} required placeholder="13.0827" />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude *</label>
                  <input className="form-input" name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} required placeholder="80.2707" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Area (hectares) *</label>
                  <input className="form-input" name="area_hectares" type="number" step="0.1" min="0.1" value={form.area_hectares} onChange={handleChange} required placeholder="2.5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Soil Type</label>
                  <input className="form-input" name="soil_type" value={form.soil_type} onChange={handleChange} placeholder="Loamy, Sandy, Clay…" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Optional notes about this field" />
              </div>
              <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className="toast success">{toast}</div>
        </div>
      )}
    </div>
  );
}
