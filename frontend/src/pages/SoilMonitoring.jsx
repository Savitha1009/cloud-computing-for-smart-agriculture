// src/pages/SoilMonitoring.jsx
import { useState, useEffect } from 'react';
import { sensorsAPI, fieldsAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import SensorChart from '../components/charts/SensorChart';
import MetricCard from '../components/ui/MetricCard';
import { Activity, Droplets, Thermometer, FlaskConical, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';

function ReadingBar({ value, max = 100, color = '#22c55e' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="reading-bar">
      <div className="reading-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function SoilMonitoring() {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState('');
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fieldsAPI.list().then(r => {
      setFields(r.data);
      if (r.data.length > 0) setSelectedField(r.data[0].id);
    });
  }, []);

  const load = (fieldId, silent = false) => {
    if (!fieldId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    Promise.all([
      sensorsAPI.latest(fieldId),
      sensorsAPI.history(fieldId, 50)
    ])
      .then(([l, h]) => {
        setLatest(l.data);
        setHistory(h.data.data || []);
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { if (selectedField) load(selectedField); }, [selectedField]);

  const handleRefresh = () => load(selectedField, true);

  if (fields.length === 0) {
    return (
      <div className="card">
        <EmptyState title="No fields" description="Add a field first, then view soil monitoring data." />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Activity size={22} /> Soil Monitoring</h1>
          <p className="page-desc">Real-time and historical soil readings for your fields</p>
        </div>
        <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      <div className="field-selector">
        <label>Field:</label>
        <select className="form-select" value={selectedField} onChange={e => setSelectedField(e.target.value)} style={{ maxWidth: 240 }}>
          {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        {latest?.simulated && (
          <span className="badge badge-warning">⚠ Simulated Data</span>
        )}
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {latest ? (
            <div className="metrics-grid" style={{ marginBottom: 24 }}>
              <MetricCard
                icon={<Droplets size={22} />}
                label="Soil Moisture"
                value={`${latest.soil_moisture?.toFixed(1)}%`}
                sub={<ReadingBar value={latest.soil_moisture} />}
                accent="#38bdf8"
              />
              <MetricCard
                icon={<Thermometer size={22} />}
                label="Soil Temperature"
                value={`${latest.soil_temperature?.toFixed(1)}°C`}
                sub={`Range: -10°C to 80°C`}
                accent="#f59e0b"
              />
              <MetricCard
                icon={<FlaskConical size={22} />}
                label="Soil pH"
                value={latest.soil_ph?.toFixed(2)}
                sub={<ReadingBar value={latest.soil_ph} max={14} color="#a78bfa" />}
                accent="#a78bfa"
              />
              <MetricCard
                icon={<Activity size={22} />}
                label="Air Temperature"
                value={latest.air_temperature != null ? `${latest.air_temperature?.toFixed(1)}°C` : '—'}
                sub={latest.humidity != null ? `Humidity: ${latest.humidity?.toFixed(0)}%` : 'No humidity data'}
                accent="#22c55e"
              />
            </div>
          ) : (
            <div className="card" style={{ marginBottom: 24 }}>
              <EmptyState title="No sensor data" description="No readings recorded for this field yet. Run the sensor simulator or connect a physical sensor." />
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <div className="card-title">📈 Sensor History (last 50 readings)</div>
              {latest && (
                <span className="text-sm text-muted">
                  Last updated: {format(parseISO(latest.timestamp), 'MMM d, HH:mm')}
                </span>
              )}
            </div>
            {history.length > 0
              ? <SensorChart data={history} />
              : <EmptyState title="No history yet" description="Sensor history will appear here once readings are collected." />
            }
          </div>

          {history.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header">
                <div className="card-title">📋 Recent Readings</div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Moisture %</th>
                      <th>Soil Temp °C</th>
                      <th>pH</th>
                      <th>Air Temp °C</th>
                      <th>Humidity %</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 20).map((r) => (
                      <tr key={r.id}>
                        <td className="text-sm">{r.timestamp ? format(parseISO(r.timestamp), 'MMM d, HH:mm:ss') : '—'}</td>
                        <td>{r.soil_moisture?.toFixed(1)}</td>
                        <td>{r.soil_temperature?.toFixed(1)}</td>
                        <td>{r.soil_ph?.toFixed(2)}</td>
                        <td>{r.air_temperature?.toFixed(1) ?? '—'}</td>
                        <td>{r.humidity?.toFixed(0) ?? '—'}</td>
                        <td><span className={`badge badge-${r.simulated ? 'warning' : 'success'}`}>{r.simulated ? 'Simulated' : 'Sensor'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
