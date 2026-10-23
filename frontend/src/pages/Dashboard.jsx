// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { dashboardAPI, fieldsAPI } from '../services/api';
import MetricCard from '../components/ui/MetricCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SensorChart from '../components/charts/SensorChart';
import { sensorsAPI } from '../services/api';
import {
  MapPin, Sprout, Bell, Droplets,
  Thermometer, Wind, CloudRain, Activity
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const SEVERITY_CLASS = { critical: 'danger', warning: 'warning', info: 'info', none: 'neutral' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState([]);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    Promise.all([dashboardAPI.get(), fieldsAPI.list()])
      .then(([dash, flds]) => {
        setData(dash.data);
        setFields(flds.data);
        // Load chart data from first field
        if (flds.data.length > 0) {
          return sensorsAPI.history(flds.data[0].id, 30);
        }
      })
      .then((h) => { if (h) setChartData(h.data.data || []); })
      .catch(() => setError('Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard…" />;
  if (error) return <div className="auth-error">{error}</div>;

  const reading = data?.latest_reading;
  const weather = data?.latest_weather?.current;

  return (
    <div>
      {/* Metrics */}
      <div className="metrics-grid">
        <MetricCard
          icon={<MapPin size={22} />}
          label="Registered Fields"
          value={data?.field_count ?? 0}
          sub="Active monitoring zones"
          accent="#22c55e"
        />
        <MetricCard
          icon={<Sprout size={22} />}
          label="Active Crops"
          value={data?.crop_count ?? 0}
          sub="Across all fields"
          accent="#a3e635"
        />
        <MetricCard
          icon={<Droplets size={22} />}
          label="Soil Moisture"
          value={reading ? `${reading.soil_moisture?.toFixed(1)}%` : '—'}
          sub={reading ? `Updated ${format(parseISO(reading.timestamp), 'HH:mm')}` : 'No data'}
          accent="#38bdf8"
        />
        <MetricCard
          icon={<Thermometer size={22} />}
          label="Soil Temperature"
          value={reading ? `${reading.soil_temperature?.toFixed(1)}°C` : '—'}
          sub={reading?.simulated ? '⚠ Simulated data' : 'Sensor reading'}
          accent="#f59e0b"
        />
        <MetricCard
          icon={<CloudRain size={22} />}
          label="Current Rainfall"
          value={weather ? `${weather.precipitation} mm` : '—'}
          sub={weather ? `Humidity: ${weather.humidity}%` : 'No weather data'}
          accent="#818cf8"
        />
        <MetricCard
          icon={<Bell size={22} />}
          label="Active Alerts"
          value={data?.active_alerts ?? 0}
          sub={data?.active_alerts > 0 ? 'Needs attention' : 'All clear'}
          accent={data?.active_alerts > 0 ? '#f85149' : '#3fb950'}
        />
      </div>

      <div className="dashboard-grid">
        {/* Sensor History Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📈 Sensor History</div>
              <div className="card-subtitle">
                {fields[0] ? `Field: ${fields[0].name}` : 'No field data'}
              </div>
            </div>
          </div>
          {chartData.length > 0
            ? <SensorChart data={chartData} />
            : <div className="text-muted text-sm" style={{ padding: '40px 0', textAlign: 'center' }}>
                No sensor readings yet. Use the sensor simulator or add a field first.
              </div>
          }
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔔 Recent Alerts</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data?.recent_alerts?.length > 0
              ? data.recent_alerts.map((a) => (
                  <div key={a.id} className={`alert-card ${a.severity}`}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{a.message}</div>
                      <div className="alert-time">
                        {a.field_name} · {a.created_at ? format(parseISO(a.created_at), 'MMM d, HH:mm') : ''}
                      </div>
                    </div>
                    <span className={`badge badge-${SEVERITY_CLASS[a.severity] || 'neutral'}`}>
                      {a.severity}
                    </span>
                  </div>
                ))
              : <div className="text-muted text-sm" style={{ textAlign: 'center', padding: 24 }}>
                  🎉 No active alerts. Your farm looks healthy!
                </div>
            }
          </div>
        </div>

        {/* Recent Recommendations */}
        <div className="card dashboard-grid-full">
          <div className="card-header">
            <div className="card-title">💧 Recent Irrigation Recommendations</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data?.recent_recommendations?.length > 0
              ? data.recent_recommendations.map((r) => (
                  <div key={r.id} className={`irrigation-rec ${r.severity}`}>
                    <div className="rec-title">{r.recommendation}</div>
                    <div className="rec-reason">{r.reason}</div>
                    <div className="rec-advisory">{r.advisory_note}</div>
                  </div>
                ))
              : <div className="text-muted text-sm" style={{ textAlign: 'center', padding: 24 }}>
                  No recommendations yet. Go to Irrigation to generate one.
                </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
