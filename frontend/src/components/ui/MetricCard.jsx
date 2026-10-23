// src/components/ui/MetricCard.jsx
export default function MetricCard({ icon, label, value, sub, accent = '#22c55e' }) {
  return (
    <div className="metric-card" style={{ '--metric-accent': accent, '--metric-bg': `${accent}18` }}>
      <div className="metric-icon">{icon}</div>
      <div>
        <div className="metric-value">{value ?? '—'}</div>
        <div className="metric-label">{label}</div>
        {sub && <div className="metric-sub">{sub}</div>}
      </div>
    </div>
  );
}
