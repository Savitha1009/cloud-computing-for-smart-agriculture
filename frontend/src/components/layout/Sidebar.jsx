// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, MapPin, Sprout, Activity,
  CloudSun, Droplets, Bell, User, LogOut, Leaf
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { alertsAPI } from '../../services/api';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/fields', icon: MapPin, label: 'Fields' },
  { to: '/crops', icon: Sprout, label: 'Crops' },
  { to: '/soil', icon: Activity, label: 'Soil Monitoring' },
  { to: '/weather', icon: CloudSun, label: 'Weather' },
  { to: '/irrigation', icon: Droplets, label: 'Irrigation' },
  { to: '/alerts', icon: Bell, label: 'Alerts', badgeKey: 'alerts' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    alertsAPI.list('active')
      .then(r => setAlertCount(r.data.length))
      .catch(() => {});
    const interval = setInterval(() => {
      alertsAPI.list('active')
        .then(r => setAlertCount(r.data.length))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🌾</div>
        <div>
          <div className="sidebar-logo-text">SmartAgri</div>
          <div className="sidebar-logo-sub">Cloud Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV_ITEMS.map(({ to, icon: Icon, label, badgeKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            {label}
            {badgeKey === 'alerts' && alertCount > 0 && (
              <span className="nav-badge">{alertCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-link w-full" onClick={handleLogout} style={{ color: '#f85149' }}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
