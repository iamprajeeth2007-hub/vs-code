import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:3000/api';
const OWNER_PASSWORD = 'campus2025';
const COMMISSION_RATE = 0.05;
const RAZORPAY_RATE = 0.02;
const NET_PROFIT_RATE = COMMISSION_RATE - RAZORPAY_RATE;

function isToday(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function AdminApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('today'); // 'today' | 'alltime'
  const [allOrders, setAllOrders] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    const loggedIn = localStorage.getItem('adminLoggedIn');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
      fetchData();
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, studentsRes] = await Promise.all([
        axios.get(`${API}/orders/all`),
        axios.get(`${API}/students/count`)
      ]);
      setAllOrders(ordersRes.data.orders || []);
      setTotalUsers(studentsRes.data.count || 0);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === OWNER_PASSWORD) {
      localStorage.setItem('adminLoggedIn', 'true');
      setIsLoggedIn(true);
      fetchData();
    } else {
      alert('Incorrect password!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    setIsLoggedIn(false);
    setPassword('');
  };

  // Filter orders based on selected view
  const orders = filter === 'today'
    ? allOrders.filter(o => isToday(o.created_at))
    : allOrders;

  // Compute stats from filtered orders
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const commission = totalRevenue * COMMISSION_RATE;
  const razorpayFees = totalRevenue * RAZORPAY_RATE;
  const netProfit = totalRevenue * NET_PROFIT_RATE;

  // Status counts
  const statusCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: completedOrders,
  };

  // Vendor stats
  const vendorMap = {};
  orders.forEach(order => {
    const vendor = order.store_name || 'Unknown';
    if (!vendorMap[vendor]) vendorMap[vendor] = { orders: 0, revenue: 0 };
    vendorMap[vendor].orders++;
    vendorMap[vendor].revenue += parseFloat(order.total_amount || 0);
  });

  const vendors = Object.entries(vendorMap).map(([name, data]) => ({
    name,
    orders: data.orders,
    revenue: data.revenue,
    commission: data.revenue * COMMISSION_RATE,
    razorpay: data.revenue * RAZORPAY_RATE,
    payout: data.revenue * (1 - COMMISSION_RATE),
  }));

  // Today's total payout to all vendors
  const totalPayout = vendors.reduce((sum, v) => sum + v.payout, 0);

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
        <div className="header-right">
          <div className="filter-toggle">
            <button
              className={`toggle-btn ${filter === 'today' ? 'active' : ''}`}
              onClick={() => setFilter('today')}
            >
              Today
            </button>
            <button
              className={`toggle-btn ${filter === 'alltime' ? 'active' : ''}`}
              onClick={() => setFilter('alltime')}
            >
              All Time
            </button>
          </div>
          <button className="refresh-btn-header" onClick={fetchData} disabled={loading}>
            {loading ? '⏳' : '🔄'}
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="content">

        {/* Filter label */}
        <div className="filter-label">
          {filter === 'today'
            ? `📅 Showing data for today — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`
            : '📦 Showing all-time data'}
        </div>

        {/* Main Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">📦</div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{totalOrders}</div>
            <div className="stat-change">{completedOrders} completed</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">💰</div>
            <div className="stat-label">Gross Revenue</div>
            <div className="stat-value">₹{Math.round(totalRevenue).toLocaleString()}</div>
            <div className="stat-change">Across all vendors</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">💎</div>
            <div className="stat-label">Your Net Profit</div>
            <div className="stat-value">₹{Math.round(netProfit).toLocaleString()}</div>
            <div className="stat-change">After Razorpay deduction</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon danger">🏪</div>
            <div className="stat-label">Total Vendor Payout</div>
            <div className="stat-value">₹{Math.round(totalPayout).toLocaleString()}</div>
            <div className="stat-change">To pay vendors {filter === 'today' ? 'today' : 'overall'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">👥</div>
            <div className="stat-label">Registered Users</div>
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-change">Total students</div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="chart-section">
          <div className="section-header">
            <h2 className="section-title">💸 Revenue Breakdown</h2>
          </div>
          <div className="breakdown-section">
            <div className="breakdown-row">
              <span className="breakdown-label">Gross Revenue</span>
              <span className="breakdown-value">₹{Math.round(totalRevenue).toLocaleString()}</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Your Commission (5%)</span>
              <span className="breakdown-value">₹{Math.round(commission).toLocaleString()}</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Razorpay Fees (2% — within 5%)</span>
              <span className="breakdown-value negative">− ₹{Math.round(razorpayFees).toLocaleString()}</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Your True Net Profit (3%)</span>
              <span className="breakdown-value profit">₹{Math.round(netProfit).toLocaleString()}</span>
            </div>
            <div className="breakdown-row total-row">
              <span className="breakdown-label">Total to Pay Vendors (95%)</span>
              <span className="breakdown-value payout-total">₹{Math.round(totalPayout).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Vendor Payout Cards */}
        <div className="chart-section">
          <div className="section-header">
            <h2 className="section-title">🏪 Vendor Payouts {filter === 'today' ? '— Today' : '— All Time'}</h2>
            <span className="section-subtitle">Pay each vendor their amount after your 5% deduction</span>
          </div>

          {vendors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏪</div>
              <p>{filter === 'today' ? 'No orders today yet' : 'No orders yet'}</p>
            </div>
          ) : (
            <div className="vendor-grid">
              {vendors.map(v => (
                <div key={v.name} className="vendor-card">
                  <div className="vendor-header">
                    <div className="vendor-name">🍽️ {v.name}</div>
                    <div className="vendor-orders">{v.orders} orders</div>
                  </div>
                  <div className="vendor-body">
                    <div className="vendor-row">
                      <span>Gross Revenue</span>
                      <span>₹{Math.round(v.revenue).toLocaleString()}</span>
                    </div>
                    <div className="vendor-row deduction">
                      <span>Your 5% Commission</span>
                      <span>− ₹{Math.round(v.commission).toLocaleString()}</span>
                    </div>
                    <div className="vendor-row deduction">
                      <span>Razorpay (2%)</span>
                      <span>− ₹{Math.round(v.razorpay).toLocaleString()}</span>
                    </div>
                    <div className="vendor-payout-box">
                      <span>Pay Vendor</span>
                      <span className="payout-amount">₹{Math.round(v.payout).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Status */}
        <div className="chart-section">
          <div className="section-header">
            <h2 className="section-title">📋 Order Status</h2>
          </div>
          <div className="status-grid">
            {[
              { label: '⏳ Pending', value: statusCounts.pending, color: 'warning' },
              { label: '👨‍🍳 Preparing', value: statusCounts.preparing, color: 'primary' },
              { label: '✅ Ready', value: statusCounts.ready, color: 'success' },
              { label: '🎉 Completed', value: statusCounts.completed, color: 'purple' },
            ].map(s => (
              <div key={s.label} className={`status-card status-${s.color}`}>
                <div className="status-label">{s.label}</div>
                <div className="status-value">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}