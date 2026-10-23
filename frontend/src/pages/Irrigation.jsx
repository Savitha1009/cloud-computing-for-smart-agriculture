// src/pages/Irrigation.jsx
import { useState, useEffect } from 'react';
import { irrigationAPI, fieldsAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { Droplets, RefreshCw, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const SEVERITY_COLOR = { high: 'danger', medium: 'warning', low: 'info', none: 'success' };

export default function Irrigation() {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fieldsAPI.list().then(r => {
      setFields(r.data);
      if (r.data.length > 0) setSelectedField(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedField) loadHistory(selectedField);
  }, [selectedField]);

  const loadHistory = (fieldId) => {
    setHistLoading(true);
    irrigationAPI.history(fieldId)
      .then(r => setHistory(r.data.data || []))
      .finally(() => setHistLoading(false));
  };

  const handleGenerate = () => {
    if (!selectedField) return;
    setLoading(true);
    setError('');
    irrigationAPI.recommend(selectedField)
      .then(r => {
        setRecommendation(r.data);
        loadHistory(selectedField);
      })
      .catch(err => setError(err.response?.data?.detail || 'Could not generate recommendation.'))
      .finally(() => setLoading(false));
  };

  if (fields.length === 0) {
    return <div className="card"><EmptyState title="No fields" description="Add a field to generate irrigation recommendations." /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Droplets size={22} /> Irrigation Recommendations</h1>
          <p className="page-desc">Advisory irrigation decisions based on soil moisture and weather forecasts</p>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !selectedField}>
          <RefreshCw size={16} /> {loading ? 'Generating…' : 'Generate Recommendation'}
        </button>
      </div>

      <div className="field-selector">
        <label>Field:</label>
        <select className="form-select" value={selectedField}
          onChange={e => setSelectedField(e.target.value)} style={{ maxWidth: 240 }}>
          {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {loading ? <LoadingSpinner text="Analysing soil and weather data…" /> : recommendation && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>💧 Latest Recommendation</div>
          <div className={`irrigation-rec ${recommendation.severity}`}>
            <div className="rec-title">{recommendation.recommendation}</div>
            <div className="rec-reason">{recommendation.reason}</div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 13, color: 'var(--color-text-muted)' }}>
              {recommendation.soil_moisture_at_time != null && (
                <span>💧 Moisture: {recommendation.soil_moisture_at_time?.toFixed(1)}%</span>
              )}
              {recommendation.rainfall_forecast_mm != null && (
                <span>🌧️ Tomorrow rain: {recommendation.rainfall_forecast_mm?.toFixed(1)} mm</span>
              )}
              <span>Severity: <span className={`badge badge-${SEVERITY_COLOR[recommendation.severity]}`}>{recommendation.severity}</span></span>
            </div>
            <div className="rec-advisory">{recommendation.advisory_note}</div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><Clock size={16} /> Recommendation History</div>
        </div>
        {histLoading ? <LoadingSpinner /> : history.length === 0
          ? <EmptyState title="No history yet" description="Generate a recommendation to see it here." />
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((r) => (
                <div key={r.id} className={`irrigation-rec ${r.severity}`} style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div className="rec-title" style={{ fontSize: 14, margin: 0 }}>{r.recommendation}</div>
                    <span className="text-xs text-muted">
                      {r.created_at ? format(parseISO(r.created_at), 'MMM d, HH:mm') : ''}
                    </span>
                  </div>
                  <div className="rec-reason">{r.reason}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}
