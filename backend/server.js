const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database (connection test runs automatically on import)
const pool = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const orderRoutes = require('./routes/orders');
const studentsRoutes = require('./routes/students');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Campus Eats API is running' });
});

// ==========================================
// ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/students', studentsRoutes);

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
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
  console.log('=================================');
  console.log('📋 Available Routes:');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/vendors');
  console.log('   GET  /api/vendors/:id/menu');
  console.log('   POST /api/orders');
  console.log('   GET  /api/orders/history');
  console.log('   GET  /api/students/count');
  console.log('=================================');
});

module.exports = app;