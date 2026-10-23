// src/pages/Crops.jsx
import { useState, useEffect } from 'react';
import { cropsAPI, fieldsAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Edit2, Trash2, Sprout, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STAGES = ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvest', 'dormant'];

const EMPTY_FORM = {
  name: '', field_id: '', planting_date: '',
  soil_type: '', growth_stage: 'seedling', variety: '', notes: '',
  moisture_threshold_low: 30, moisture_threshold_high: 80
};

export default function Crops() {
  const [crops, setCrops] = useState([]);
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
    Promise.all([cropsAPI.list(), fieldsAPI.list()])
      .then(([c, f]) => { setCrops(c.data); setFields(f.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setModal(true); };
  const openEdit = (c) => {
    setEditing(c.id);
    setForm({
      name: c.name, field_id: c.field_id, planting_date: c.planting_date?.slice(0, 10),
      soil_type: c.soil_type || '', growth_stage: c.growth_stage, variety: c.variety || '',
      notes: c.notes || '', moisture_threshold_low: c.moisture_threshold_low,
      moisture_threshold_high: c.moisture_threshold_high
    });
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
        moisture_threshold_low: parseFloat(form.moisture_threshold_low),
        moisture_threshold_high: parseFloat(form.moisture_threshold_high),
      };
      if (editing) await cropsAPI.update(editing, payload);
      else await cropsAPI.create(payload);
      setModal(false);
      load();
      showToast(editing ? 'Crop updated!' : 'Crop added!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save crop.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this crop record?')) return;
    try { await cropsAPI.delete(id); load(); showToast('Crop deleted.'); }
    catch { showToast('Delete failed.'); }
  };

  const fieldName = (id) => fields.find(f => f.id === id)?.name || id;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Sprout size={22} /> Crops</h1>
          <p className="page-desc">Track crops across all your fields</p>
        </div>
        <button id="add-crop-btn" className="btn btn-primary" onClick={openCreate} disabled={fields.length === 0}>
          <Plus size={16} /> Add Crop
        </button>
      </div>

      {fields.length === 0 && (
        <div className="auth-error" style={{ marginBottom: 16 }}>
          ⚠ You need to create a field before adding crops.
        </div>
      )}

      {crops.length === 0
        ? <div className="card">
            <EmptyState title="No crops yet" description="Add your first crop to start tracking growth stages and moisture needs."
              action={fields.length > 0 ? <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Crop</button> : null} />
          </div>
        : <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Crop</th><th>Field</th><th>Variety</th>
                    <th>Planting Date</th><th>Stage</th>
                    <th>Moisture Range</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {crops.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td>{fieldName(c.field_id)}</td>
                      <td>{c.variety || '—'}</td>
                      <td className="text-sm">{c.planting_date?.slice(0, 10)}</td>
                      <td><span className="badge badge-info">{c.growth_stage}</span></td>
                      <td className="text-sm">{c.moisture_threshold_low}% – {c.moisture_threshold_high}%</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      }

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Crop' : 'Add Crop'}</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Crop Name *</label>
                  <input className="form-input" name="name" value={form.name} onChange={handleChange} required placeholder="Tomato, Wheat…" />
                </div>
                <div className="form-group">
                  <label className="form-label">Variety</label>
                  <input className="form-input" name="variety" value={form.variety} onChange={handleChange} placeholder="e.g. Roma" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Field *</label>
                  <select className="form-select" name="field_id" value={form.field_id} onChange={handleChange} required>
                    <option value="">Select field…</option>
                    {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Planting Date *</label>
                  <input className="form-input" type="date" name="planting_date" value={form.planting_date} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Growth Stage</label>
                  <select className="form-select" name="growth_stage" value={form.growth_stage} onChange={handleChange}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Soil Type</label>
                  <input className="form-input" name="soil_type" value={form.soil_type} onChange={handleChange} placeholder="Loamy, Sandy…" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Low Moisture Threshold (%)</label>
                  <input className="form-input" type="number" name="moisture_threshold_low" min="0" max="100" value={form.moisture_threshold_low} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">High Moisture Threshold (%)</label>
                  <input className="form-input" type="number" name="moisture_threshold_high" min="0" max="100" value={form.moisture_threshold_high} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Any additional notes" />
              </div>
              <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Crop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast success">{toast}</div></div>}
    </div>
  );
}
