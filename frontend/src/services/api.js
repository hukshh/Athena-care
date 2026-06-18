import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('athena_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('athena_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API service functions
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

export const reportsAPI = {
  upload: (formData) => api.post('/reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  getAll: () => api.get('/reports/'),
  getById: (id) => api.get(`/reports/${id}`),
  analyze: (id) => api.post(`/reports/${id}/analyze`),
  delete: (id) => api.delete(`/reports/${id}`),
};

export const hospitalsAPI = {
  search: (params) => api.post('/hospitals/search', params),
  getAll: (params) => api.get('/hospitals/', { params }),
  getById: (id) => api.get(`/hospitals/${id}`),
  getRecommendations: (data) => api.post('/hospitals/recommend', data),
};

export const doctorsAPI = {
  search: (params) => api.post('/doctors/search', params),
  getAll: (params) => api.get('/doctors/', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getRecommendations: (data) => api.post('/doctors/recommend', data),
};

export const costAPI = {
  predict: (data) => api.post('/cost/predict', data),
  getBreakdown: (data) => api.post('/cost/breakdown', data),
  compareCountries: (data) => api.post('/cost/compare', data),
};

export const travelAPI = {
  generatePlan: (data) => api.post('/travel/plan', data),
  getVisaInfo: (country) => api.get(`/travel/visa/${country}`),
  getPlan: (id) => api.get(`/travel/plans/${id}`),
};

export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
  getHistory: () => api.get('/chat/history'),
  clearHistory: () => api.delete('/chat/history'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
  getInsights: () => api.get('/dashboard/insights'),
};

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getStats: () => api.get('/admin/stats'),
  getReports: (params) => api.get('/admin/reports', { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateHospital: (id, data) => api.put(`/admin/hospitals/${id}`, data),
};
