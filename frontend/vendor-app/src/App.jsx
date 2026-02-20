import { useState, useEffect, useRef } from "react";
import "./App.css";

const API = "http://localhost:3000/api";

// Valid vendor IDs that match your backend
const VALID_VENDORS = {
  grub_foods: { id: "grub_foods", name: "GRUB FOODS", password: "grub123" },
  roll_me: { id: "roll_me", name: "ROLL ME", password: "roll123" },
  siddi_vinayaka: { id: "siddi_vinayaka", name: "SIDDI VINAYAKA GARDEN", password: "siddi123" },
};

// ── NOTIFICATION ──────────────────────────────────────────────────────────────
function Notification({ notif }) {
  if (!notif) return null;
  return (
    <div className={`notif ${notif.type} ${notif.visible ? "show" : ""}`}>
      <span className="notif-icon">{notif.type === "success" ? "✅" : "❌"}</span>
      <div>
        <p className="notif-title">{notif.type === "success" ? "Success" : "Error"}</p>
        <p className="notif-msg">{notif.message}</p>
      </div>
    </div>
  );
}

// ── LOGIN PAGE ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [vendorId, setVendorId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!vendorId) { setError("Please select your store"); return; }
    if (!password) { setError("Please enter your password"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/vendor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendorId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("vendorToken", data.token);
      localStorage.setItem("vendorId", data.vendor.vendor_id);
      localStorage.setItem("vendorName", data.vendor.store_name);
      onLogin(data.vendor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-pg">
      <div className="login-bg">
        <div className="bg-orb o1" /><div className="bg-orb o2" /><div className="bg-orb o3" />
      </div>
      <div className="login-card">
        <div className="login-head">
          <div className="chef-icon">👨‍🍳</div>
          <h1>Vendor Dashboard</h1>
          <p>Campus Eats Order Management</p>
        </div>

        <div className="auth-tabs">
          <button className={`atab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>Sign In</button>
          <button className={`atab ${mode === "info" ? "active" : ""}`} onClick={() => { setMode("info"); setError(""); }}>Credentials</button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="vform">
            {error && <div className="verr">{error}</div>}
            <div className="vfg">
              <label>Select Your Store</label>
              <select value={vendorId} onChange={e => { setVendorId(e.target.value); setError(""); }} required>
                <option value="">-- Select your store --</option>
                {Object.values(VALID_VENDORS).map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="vfg">
              <label>Password</label>
              <input type="password" placeholder="Enter store password" value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }} required />
            </div>
            <button type="submit" className="vlogin-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>
        ) : (
          <div className="creds-box">
            <p className="creds-title">Store Credentials</p>
            {Object.values(VALID_VENDORS).map(v => (
              <div key={v.id} className="cred-row">
                <span className="cred-store">{v.name}</span>
                <span className="cred-pw">{v.password}</span>
              </div>
            ))}
            <p className="creds-note">Contact admin to change passwords.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ vendor, onLogout, showNotif }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const prevCountRef = useRef(0);
  const pollRef = useRef(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API}/orders/vendor/${vendor.vendor_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("vendorToken")}` },
      });
      const data = await res.json();
      const fetched = data.orders || [];

      // New order notification
      const pending = fetched.filter(o => o.status === "pending").length;
      if (prevCountRef.current > 0 && pending > prevCountRef.current) {
        showNotif("🔔 New order received!", "success");
      }
      prevCountRef.current = pending;
      setOrders(fetched);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    pollRef.current = setInterval(fetchOrders, 10000); // poll every 10s
    return () => clearInterval(pollRef.current);
  }, [vendor.vendor_id]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("vendorToken")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      const msgs = { preparing: "Order accepted!", ready: "Order marked as ready!", completed: "Order completed!", cancelled: "Order cancelled" };
      showNotif(msgs[newStatus] || "Status updated", "success");
      fetchOrders();
    } catch (err) {
      showNotif("Failed to update order", "error");
    }
  };

  const today = new Date().setHours(0, 0, 0, 0);
  const stats = {
    pending: orders.filter(o => o.status === "pending").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready: orders.filter(o => o.status === "ready").length,
    revenue: orders
      .filter(o => new Date(o.created_at).setHours(0,0,0,0) === today && o.status !== "cancelled")
      .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0),
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const formatTime = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="dash">
      {/* Header */}
      <header className="dash-hdr">
        <div className="dh-left">
          <span className="dh-logo">👨‍🍳</span>
          <div>
            <h1 className="dh-name">{vendor.store_name}</h1>
            <p className="dh-sub">Order Management Dashboard</p>
          </div>
        </div>
        <div className="dh-right">
          <div className="dh-avatar">{vendor.store_name?.charAt(0)}</div>
          <span className="dh-vname">{vendor.store_name}</span>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="dash-content">
        {/* Stats */}
        <div className="stats-grid">
          {[
            { icon: "⏳", label: "Pending Orders", value: stats.pending },
            { icon: "👨‍🍳", label: "Preparing", value: stats.preparing },
            { icon: "✅", label: "Ready", value: stats.ready },
            { icon: "💰", label: "Today's Revenue", value: `₹${stats.revenue.toFixed(0)}` },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-ico">{s.icon}</div>
              <p className="stat-lbl">{s.label}</p>
              <p className="stat-val">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Orders */}
        <div className="orders-box">
          <div className="orders-hdr">
            <h2>Orders</h2>
            <div className="filter-tabs">
              {["all", "pending", "preparing", "ready"].map(f => (
                <button key={f} className={`ftab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="orders-list">
            {loading ? (
              <div className="empty-st"><div className="spin">⏳</div><p>Loading orders...</p></div>
            ) : filtered.length === 0 ? (
              <div className="empty-st">
                <div className="empty-ico">📦</div>
                <p>No {filter === "all" ? "" : filter} orders found</p>
              </div>
            ) : (
              filtered.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-top">
                    <div>
                      <p className="order-num">#{order.order_number}</p>
                      <p className="order-time">{formatTime(order.created_at)}</p>
                    </div>
                    <span className={`sbadge s-${order.status}`}>{order.status}</span>
                  </div>

                  <div className="student-row">
                    <span className="stu-label">Student SRN:</span>
                    <span className="stu-srn">{order.srn || "N/A"}</span>
                    {order.pickup_code && (
                      <span className="pickup-code">Code: <strong>{order.pickup_code}</strong></span>
                    )}
                  </div>

                  <div className="order-items">
                    {/* Items shown via count since vendor route returns count */}
                    <p className="items-count">{order.items_count} item{order.items_count !== 1 ? "s" : ""}</p>
                  </div>

                  <div className="order-foot">
                    <p className="order-total">₹{parseFloat(order.total_amount).toFixed(0)}</p>
                    <div className="order-actions">
                      {order.status === "pending" && (<>
                        <button className="abtn accept" onClick={() => updateStatus(order.id, "preparing")}>Accept</button>
                        <button className="abtn reject" onClick={() => updateStatus(order.id, "cancelled")}>Reject</button>
                      </>)}
                      {order.status === "preparing" && (
                        <button className="abtn ready" onClick={() => updateStatus(order.id, "ready")}>Mark Ready</button>
                      )}
                      {order.status === "ready" && (
                        <button className="abtn complete" onClick={() => updateStatus(order.id, "completed")}>Complete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [vendor, setVendor] = useState(() => {
    const id = localStorage.getItem("vendorId");
    const name = localStorage.getItem("vendorName");
    return id ? { vendor_id: id, store_name: name } : null;
  });
  const [notif, setNotif] = useState(null);
  const notifRef = useRef(null);

  const showNotif = (message, type = "success") => {
    if (notifRef.current) clearTimeout(notifRef.current);
    setNotif({ message, type, visible: true });
    notifRef.current = setTimeout(() => setNotif(n => n ? { ...n, visible: false } : null), 3500);
  };

  const logout = () => {
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorId");
    localStorage.removeItem("vendorName");
    setVendor(null);
    showNotif("Logged out successfully");
  };

  return (
    <>
      <Notification notif={notif} />
      {vendor
        ? <Dashboard vendor={vendor} onLogout={logout} showNotif={showNotif} />
        : <LoginPage onLogin={v => { setVendor(v); showNotif(`Welcome to ${v.store_name}!`); }} />
      }
    </>
  );
}