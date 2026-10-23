// src/pages/WeatherMonitoring.jsx
import { useState, useEffect } from 'react';
import { weatherAPI, fieldsAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import MetricCard from '../components/ui/MetricCard';
import { CloudSun, Thermometer, Droplets, Wind, RefreshCw } from 'lucide-react';

const WMO_CODES = {
  0: ['☀️', 'Clear sky'], 1: ['🌤️', 'Mainly clear'], 2: ['⛅', 'Partly cloudy'],
  3: ['☁️', 'Overcast'], 45: ['🌫️', 'Fog'], 48: ['🌫️', 'Icy fog'],
  51: ['🌦️', 'Light drizzle'], 53: ['🌧️', 'Moderate drizzle'], 55: ['🌧️', 'Dense drizzle'],
  61: ['🌧️', 'Slight rain'], 63: ['🌧️', 'Moderate rain'], 65: ['🌧️', 'Heavy rain'],
  71: ['❄️', 'Slight snow'], 73: ['❄️', 'Moderate snow'], 75: ['❄️', 'Heavy snow'],
  80: ['🌦️', 'Slight showers'], 81: ['🌧️', 'Moderate showers'], 82: ['⛈️', 'Violent showers'],
  95: ['⛈️', 'Thunderstorm'], 96: ['⛈️', 'Hail storm'], 99: ['⛈️', 'Heavy hail storm'],
};

const weatherInfo = (code) => WMO_CODES[code] || ['🌡️', 'Unknown'];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeatherMonitoring() {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fieldsAPI.list().then(r => {
      setFields(r.data);
      if (r.data.length > 0) setSelectedField(r.data[0].id);
    });
  }, []);

  const load = (fieldId) => {
    if (!fieldId) return;
    setLoading(true);
    setError('');
    weatherAPI.get(fieldId)
      .then(r => setWeather(r.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to fetch weather data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (selectedField) load(selectedField); }, [selectedField]);

  if (fields.length === 0) {
    return <div className="card"><EmptyState title="No fields" description="Add a field with coordinates to view weather data." /></div>;
  }

  const cur = weather?.current;
  const [emoji] = weatherInfo(cur?.weather_code);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><CloudSun size={22} /> Weather Monitoring</h1>
          <p className="page-desc">Live weather and 7-day forecast via Open-Meteo API</p>
        </div>
        <button className="btn btn-secondary" onClick={() => load(selectedField)} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="field-selector">
        <label>Field:</label>
        <select className="form-select" value={selectedField}
          onChange={e => setSelectedField(e.target.value)} style={{ maxWidth: 240 }}>
          {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {loading && <LoadingSpinner text="Fetching weather data…" />}
      {error && <div className="auth-error">{error}</div>}

      {!loading && weather && (
        <>
          {/* Current Weather */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">🌡️ Current Conditions — {weather.field_name}</div>
              <span className="text-sm text-muted">{cur?.time ? cur.time.replace('T', ' ') : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 64 }}>{emoji}</div>
              <div>
                <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
                  {cur?.temperature?.toFixed(1)}°C
                </div>
                <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {weatherInfo(cur?.weather_code)[1]}
                </div>
              </div>
            </div>
            <div className="metrics-grid">
              <MetricCard icon={<Droplets size={22} />} label="Humidity"
                value={`${cur?.humidity}%`} accent="#38bdf8" />
              <MetricCard icon={<CloudSun size={22} />} label="Precipitation"
                value={`${cur?.precipitation} mm`} accent="#818cf8" />
              <MetricCard icon={<Wind size={22} />} label="Wind Speed"
                value={`${cur?.wind_speed} km/h`} accent="#6ee7b7" />
              <MetricCard icon={<Thermometer size={22} />} label="Coordinates"
                value={`${weather.latitude?.toFixed(2)}°`}
                sub={`${weather.longitude?.toFixed(2)}° longitude`} accent="#f59e0b" />
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📅 7-Day Forecast</div>
            </div>
            <div className="weather-grid">
              {(weather.daily || []).map((d, i) => {
                const dayDate = new Date(d.date);
                const dayName = i === 0 ? 'Today' : DAYS[dayDate.getDay()];
                const [dEmoji, dLabel] = weatherInfo(d.weather_code);
                return (
                  <div key={d.date} className="weather-day-card">
                    <div className="weather-day">{dayName}</div>
                    <div className="weather-emoji">{dEmoji}</div>
                    <div className="weather-temp-max">{d.temp_max?.toFixed(0)}°</div>
                    <div className="weather-temp-min">{d.temp_min?.toFixed(0)}°</div>
                    {d.precipitation_sum > 0 && (
                      <div className="weather-rain">💧 {d.precipitation_sum?.toFixed(1)}mm</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
