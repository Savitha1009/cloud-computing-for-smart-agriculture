// src/components/layout/Navbar.jsx
import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/fields': 'Field Management',
  '/crops': 'Crop Management',
  '/soil': 'Soil Monitoring',
  '/weather': 'Weather Monitoring',
  '/irrigation': 'Irrigation Recommendations',
  '/alerts': 'Alert Center',
  '/profile': 'User Profile',
};

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Smart Agriculture';
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'FA';

  return (
    <header className="navbar">
      <h1 className="navbar-title">{title}</h1>
      <div className="navbar-actions">
        <div className="navbar-user">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{user?.name || 'Farmer'}</div>
            <div className="user-role">{user?.role || 'farmer'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
