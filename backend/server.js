const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const authRoutes = require('./routes/auth');
const vendorsRoutes = require('./routes/vendors');
const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');
const dishesRoutes = require('./routes/dishes');
const adminRoutes = require('./routes/admin');
const studentsRoutes = require('./routes/students');

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Case-insensitive SRN normalization middleware
app.use((req, res, next) => {
  if (req.body) {
    if (req.body.srn) req.body.srn = req.body.srn.toUpperCase();
    if (req.body.studentSrn) req.body.studentSrn = req.body.studentSrn.toUpperCase();
  }
  if (req.query) {
    if (req.query.srn) req.query.srn = req.query.srn.toUpperCase();
    if (req.query.studentSrn) req.query.studentSrn = req.query.studentSrn.toUpperCase();
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Campus Eats Backend is running!',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    database: 'PostgreSQL/Supabase'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/dishes', dishesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Campus Eats API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register'
      },
      vendors: 'GET /api/vendors',
      search: 'GET /api/vendors/search?q=QUERY&filter=veg|nonveg|all',
      menu: 'GET /api/vendors/:vendorId/menu?filter=veg|nonveg|all',
      orders: {
        create: 'POST /api/orders',
        history: 'GET /api/orders/history'
      },
      dishes: {
        ratings: 'GET /api/dishes/:itemId/ratings',
        rate: 'POST /api/dishes/:itemId/rate',
        reviews: 'GET /api/dishes/:itemId/reviews',
        review: 'POST /api/dishes/:itemId/review'
      }
    }
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 Campus Eats Backend Started!');
  console.log('=================================');
  console.log(`📡 API: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`📚 Docs: http://localhost:${PORT}/`);
  console.log('=================================');
});