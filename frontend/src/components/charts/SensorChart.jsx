// src/components/charts/SensorChart.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13
    }}>
      <div style={{ color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value?.toFixed(2)}</strong>
        </div>
      ))}
    </div>
  );
};

export default function SensorChart({ data = [] }) {
  const chartData = [...data].reverse().map((r) => ({
    time: r.timestamp ? format(parseISO(r.timestamp), 'HH:mm') : '',
    Moisture: r.soil_moisture,
    'Soil Temp': r.soil_temperature,
    pH: r.soil_ph,
  }));

  return (
    <div className="chart-wrapper" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(v) => <span style={{ color: 'var(--color-text-muted)' }}>{v}</span>}
          />
          <Line type="monotone" dataKey="Moisture" stroke="#22c55e" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Soil Temp" stroke="#f59e0b" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="pH" stroke="#58a6ff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
