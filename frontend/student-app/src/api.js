import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (srn, pin, name) => api.post('/auth/register', { srn, pin, name }),
  login: (srn, pin) => api.post('/auth/login', { srn, pin })
};

export const vendorsAPI = {
  getAll: () => api.get('/vendors')
};

export const menuAPI = {
  // CORRECTED: Use vendors/:vendorId/menu endpoint
  getByVendor: (vendorId) => {
    console.log(`📋 Fetching menu for: ${vendorId}`);
    return api.get(`/vendors/${vendorId}/menu`);
  }
};

export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getHistory: () => api.get('/orders/history')
};

export default api;