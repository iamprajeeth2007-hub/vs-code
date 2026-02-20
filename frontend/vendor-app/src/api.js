import axios from 'axios';

// Backend API URL
const API_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vendorToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vendorToken');
      localStorage.removeItem('vendor');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ==========================================
// VENDOR AUTH (Manual login with vendor ID)
// ==========================================
export const vendorAuthAPI = {
  // Login vendor with vendor_id
  login: (vendorId, password) => 
    api.post('/vendors/login', { vendorId, password }),
  
  // Get vendor profile
  getProfile: (vendorId) => 
    api.get(`/vendors/${vendorId}`)
};

// ==========================================
// ORDERS API
// ==========================================
export const ordersAPI = {
  // Get all orders for a vendor
  getVendorOrders: (vendorId, status = null) => {
    const url = status 
      ? `/orders/vendor/${vendorId}?status=${status}`
      : `/orders/vendor/${vendorId}`;
    return api.get(url);
  },
  
  // Get single order details
  getOrderDetails: (orderId) => 
    api.get(`/orders/${orderId}`),
  
  // Update order status
  updateStatus: (orderId, status) => 
    api.put(`/orders/${orderId}/status`, { status }),
  
  // Get vendor stats
  getStats: (vendorId) => 
    api.get(`/orders/vendor/${vendorId}/stats`)
};

export default api;