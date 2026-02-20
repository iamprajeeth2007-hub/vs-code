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
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================================
// ADMIN ANALYTICS API
// ==========================================
export const analyticsAPI = {
  // Get overall stats
  getOverallStats: () => 
    api.get('/admin/stats'),
  
  // Get vendor-wise breakdown
  getVendorStats: () => 
    api.get('/admin/vendor-stats'),
  
  // Get orders trend (daily/weekly/monthly)
  getOrdersTrend: (period = 'daily') => 
    api.get(`/admin/orders-trend?period=${period}`),
  
  // Get revenue breakdown
  getRevenueStats: () => 
    api.get('/admin/revenue-stats')
};

// ==========================================
// VENDORS API
// ==========================================
export const vendorsAPI = {
  getAll: () => api.get('/vendors'),
  
  updateStatus: (vendorId, isActive) => 
    api.put(`/vendors/${vendorId}/status`, { isActive })
};

// ==========================================
// ORDERS API
// ==========================================
export const ordersAPI = {
  // Get all orders (all vendors)
  getAllOrders: (status = null) => {
    const url = status ? `/admin/orders?status=${status}` : '/admin/orders';
    return api.get(url);
  },
  
  // Get order details
  getOrderDetails: (orderId) => 
    api.get(`/orders/${orderId}`)
};

// ==========================================
// STUDENTS API
// ==========================================
export const studentsAPI = {
  // Get student statistics
  getStats: () => 
    api.get('/admin/students-stats'),
  
  // Get recent students
  getRecent: () => 
    api.get('/admin/recent-students')
};

export default api;