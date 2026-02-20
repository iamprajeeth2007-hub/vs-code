import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:3000/api';

export default function AdminApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    netProfit: 0,
    totalUsers: 0,
    completedOrders: 0,
    commission: 0,
    razorpayFees: 0,
    stallStats: {},
    statusCounts: {
      pending: 0,
      preparing: 0,
      ready: 0,
      completed: 0
    }
  });

  const OWNER_PASSWORD = 'campus2025'; // Change this!
  const COMMISSION_RATE = 0.05; // 05%
  const RAZORPAY_FEE_RATE = 0.0236; // 2.36%

  useEffect(() => {
    const loggedIn = localStorage.getItem('adminLoggedIn');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
      loadDashboard();
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadDashboard, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === OWNER_PASSWORD) {
      localStorage.setItem('adminLoggedIn', 'true');
      setIsLoggedIn(true);
      loadDashboard();
    } else {
      alert('Incorrect password!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    setIsLoggedIn(false);
    setPassword('');
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Fetch all orders
      const ordersRes = await axios.get(`${API}/orders/all`);
      const orders = ordersRes.data.orders || [];

      // Fetch all students
      const studentsRes = await axios.get(`${API}/students/count`);
      const totalUsers = studentsRes.data.count || 0;

      // Calculate stats
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

      // Calculate commission and fees
      const commission = totalRevenue * COMMISSION_RATE;
      const razorpayFees = totalRevenue * RAZORPAY_FEE_RATE;
      const netProfit = commission - razorpayFees;

      // Calculate stall stats
      const stallStats = {};
      orders.forEach(order => {
        const stall = order.store_name || 'Unknown';
        if (!stallStats[stall]) {
          stallStats[stall] = { orders: 0, revenue: 0 };
        }
        stallStats[stall].orders++;
        stallStats[stall].revenue += parseFloat(order.total_amount || 0);
      });

      // Calculate status counts
      const statusCounts = {
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        completed: completedOrders
      };

      setStats({
        totalOrders,
        totalRevenue,
        netProfit,
        totalUsers,
        completedOrders,
        commission,
        razorpayFees,
        stallStats,
        statusCounts
      });

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="logo-icon">👨‍💼</div>
          <h1>Owner Dashboard</h1>
          <p>Admin Access Only</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter owner password"
                required
              />
            </div>
            <button type="submit" className="btn-login">Login</button>
          </form>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <div className="header-logo">📊</div>
          <div className="header-title">
            <h1>Campus Eats Analytics</h1>
            <p>Owner Dashboard</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      {/* Content */}
      <div className="content">
        {/* Main Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">📦</div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-change">{stats.completedOrders} completed</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">💰</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">₹{Math.round(stats.totalRevenue).toLocaleString()}</div>
            <div className="stat-change">From {stats.totalOrders} orders</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">💎</div>
            <div className="stat-label">Your Profit</div>
            <div className="stat-value">₹{Math.round(stats.netProfit).toLocaleString()}</div>
            <div className="stat-change">{COMMISSION_RATE * 100}% commission</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">👥</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-change">Registered students</div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="chart-section">
          <div className="section-header">
            <h2 className="section-title">Revenue Breakdown</h2>
            <button className="refresh-btn" onClick={loadDashboard} disabled={loading}>
              🔄 {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <div className="breakdown-section">
            <div className="breakdown-row">
              <span className="breakdown-label">Gross Revenue</span>
              <span className="breakdown-value">₹{Math.round(stats.totalRevenue).toLocaleString()}</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Platform Commission (10%)</span>
              <span className="breakdown-value">₹{Math.round(stats.commission).toLocaleString()}</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Razorpay Fees (2.36%)</span>
              <span className="breakdown-value">₹{Math.round(stats.razorpayFees).toLocaleString()}</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Net Profit</span>
              <span className="breakdown-value profit">₹{Math.round(stats.netProfit).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Stalls Performance */}
        <div className="chart-section">
          <div className="section-header">
            <h2 className="section-title">Stalls Performance</h2>
          </div>
          <div className="stalls-grid">
            {Object.keys(stats.stallStats).length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <p>No stall data yet</p>
              </div>
            ) : (
              Object.entries(stats.stallStats).map(([stall, data]) => (
                <div key={stall} className="stall-card">
                  <div className="stall-header">
                    <div className="stall-name">{stall}</div>
                    <div className="stall-status">Active</div>
                  </div>
                  <div className="stall-stats">
                    <div className="stall-stat">
                      <div className="stall-stat-label">Orders</div>
                      <div className="stall-stat-value">{data.orders}</div>
                    </div>
                    <div className="stall-stat">
                      <div className="stall-stat-label">Revenue</div>
                      <div className="stall-stat-value">₹{Math.round(data.revenue).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Status */}
        <div className="chart-section">
          <div className="section-header">
            <h2 className="section-title">Order Status Breakdown</h2>
          </div>
          <div className="stalls-grid">
            <div className="stall-card">
              <div className="stall-header">
                <div className="stall-name">⏳ Pending</div>
              </div>
              <div className="stall-stat-value">{stats.statusCounts.pending}</div>
            </div>
            <div className="stall-card">
              <div className="stall-header">
                <div className="stall-name">👨‍🍳 Preparing</div>
              </div>
              <div className="stall-stat-value">{stats.statusCounts.preparing}</div>
            </div>
            <div className="stall-card">
              <div className="stall-header">
                <div className="stall-name">✅ Ready</div>
              </div>
              <div className="stall-stat-value">{stats.statusCounts.ready}</div>
            </div>
            <div className="stall-card">
              <div className="stall-header">
                <div className="stall-name">🎉 Completed</div>
              </div>
              <div className="stall-stat-value">{stats.statusCounts.completed}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}