// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🌾</div>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join SmartAgri and monitor your farm from the cloud</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input id="reg-name" className="form-input" type="text" name="name"
              placeholder="John Farmer" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input id="reg-email" className="form-input" type="email" name="email"
              placeholder="farmer@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input id="reg-password" className="form-input" type="password" name="password"
                placeholder="Min 8 characters" value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
              <input id="reg-confirm" className="form-input" type="password" name="confirm"
                placeholder="Repeat password" value={form.confirm} onChange={handleChange} required />
            </div>
          </div>
          <button id="reg-submit" type="submit" className="btn btn-primary w-full btn-lg"
            disabled={loading} style={{ marginTop: 8, justifyContent: 'center' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
