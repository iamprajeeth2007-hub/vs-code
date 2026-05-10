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

// Log responses
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
  getAll: () => api.get('/vendors'),
  search: (query, filter = 'all') => api.get(`/vendors/search?q=${query}&filter=${filter}`)
};

export const menuAPI = {
  getByVendor: (vendorId, filter = 'all') => {
    console.log(`📋 Fetching menu for: ${vendorId}, filter: ${filter}`);
    return api.get(`/vendors/${vendorId}/menu?filter=${filter}`);
  },
  getFiltered: (params = {}) => {
    const query = new URLSearchParams();
    if (params.food_type) query.set('food_type', params.food_type);
    if (params.minPrice != null) query.set('minPrice', params.minPrice);
    if (params.maxPrice != null) query.set('maxPrice', params.maxPrice);
    if (params.popular) query.set('popular', 'true');
    console.log(`🔎 Filtering menu: ${query.toString()}`);
    return api.get(`/vendors/menu/filter?${query.toString()}`);
  }
};

export const ordersAPI = {
  create: (data) => {
    console.log('📤 Creating order:', data);
    return api.post('/orders', data);
  },
  getHistory: (srn) => api.get(`/orders/history?srn=${srn}`)
};

export const dishesAPI = {
  getRatings: (itemId) => api.get(`/dishes/${itemId}/ratings`),
  submitRating: (itemId, rating) => api.post(`/dishes/${itemId}/rate`, { rating }),
  getReviews: (itemId) => api.get(`/dishes/${itemId}/reviews`),
  submitReview: (itemId, rating, comment) => api.post(`/dishes/${itemId}/review`, { rating, comment }),
  canReview: (itemId) => api.get(`/dishes/${itemId}/can-review`)
};

export default api;