/**
 * src/services/api.js
 * Centralized Axios API service layer.
 * All API calls go through this module — no fetch/axios calls in components.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
  updateMe: (data) => api.put('/api/auth/me', data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/api/dashboard'),
};

// ─── Fields ──────────────────────────────────────────────────────────────────
export const fieldsAPI = {
  list: () => api.get('/api/fields'),
  get: (id) => api.get(`/api/fields/${id}`),
  create: (data) => api.post('/api/fields', data),
  update: (id, data) => api.put(`/api/fields/${id}`, data),
  delete: (id) => api.delete(`/api/fields/${id}`),
};

// ─── Crops ───────────────────────────────────────────────────────────────────
export const cropsAPI = {
  list: (fieldId) => api.get('/api/crops', { params: fieldId ? { field_id: fieldId } : {} }),
  create: (data) => api.post('/api/crops', data),
  update: (id, data) => api.put(`/api/crops/${id}`, data),
  delete: (id) => api.delete(`/api/crops/${id}`),
};

// ─── Sensors ─────────────────────────────────────────────────────────────────
export const sensorsAPI = {
  latest: (fieldId) => api.get('/api/sensors/latest', { params: { field_id: fieldId } }),
  history: (fieldId, limit = 50, skip = 0) =>
    api.get('/api/sensors/history', { params: { field_id: fieldId, limit, skip } }),
  ingest: (data) => api.post('/api/sensors/data', data),
};

// ─── Weather ─────────────────────────────────────────────────────────────────
export const weatherAPI = {
  get: (fieldId) => api.get('/api/weather', { params: { field_id: fieldId } }),
};

// ─── Irrigation ──────────────────────────────────────────────────────────────
export const irrigationAPI = {
  recommend: (fieldId) => api.get('/api/irrigation/recommendation', { params: { field_id: fieldId } }),
  history: (fieldId, limit = 20, skip = 0) =>
    api.get('/api/irrigation/history', { params: { field_id: fieldId, limit, skip } }),
};

// ─── Alerts ──────────────────────────────────────────────────────────────────
export const alertsAPI = {
  list: (status) => api.get('/api/alerts', { params: status ? { status } : {} }),
  updateStatus: (id, status) => api.patch(`/api/alerts/${id}`, { status }),
};

export default api;
