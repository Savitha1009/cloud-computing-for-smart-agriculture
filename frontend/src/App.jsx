// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Fields from './pages/Fields';
import Crops from './pages/Crops';
import SoilMonitoring from './pages/SoilMonitoring';
import WeatherMonitoring from './pages/WeatherMonitoring';
import Irrigation from './pages/Irrigation';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';

/** Protected route — redirects to /login if unauthenticated */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Authenticating…" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

/** Redirect authenticated users away from login/register */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/fields" element={<ProtectedRoute><Fields /></ProtectedRoute>} />
      <Route path="/crops" element={<ProtectedRoute><Crops /></ProtectedRoute>} />
      <Route path="/soil" element={<ProtectedRoute><SoilMonitoring /></ProtectedRoute>} />
      <Route path="/weather" element={<ProtectedRoute><WeatherMonitoring /></ProtectedRoute>} />
      <Route path="/irrigation" element={<ProtectedRoute><Irrigation /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
