import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

const API = "http://localhost:3000/api";

const Icon = {
  cart: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>),
  history: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4.5"/><polyline points="3 3 3 7 7 7"/></svg>),
  back: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>),
  search: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  filter: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>),
  location: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>),
  clock: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  star: (<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  check: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  plus: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  minus: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  veg: (<svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="4" fill="#16a34a"/></svg>),
  nonveg: (<svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="4" fill="#dc2626"/></svg>),
  receipt: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
  logout: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
  lock: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
  menu: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>),
  user: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  track: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>),
  close: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
};

const VENDOR_COLORS = ["#FF6B35","#E85D04","#F48C06","#DC2F02","#9D0208"];
const VendorPlaceholder = ({ name, color }) => (
  <div className="vph" style={{ background: `linear-gradient(135deg, ${color}dd, ${color}66)` }}>
    <span>{name?.charAt(0) || "?"}</span>
  </div>
);

// ── SIDE MENU ─────────────────────────────────────────────────────────────────
function SideMenu({ open, onClose, student, onNavigate, onLogout }) {
  return (
    <>
      {open && <div className="menu-overlay" onClick={onClose} />}
      <div className={`side-menu ${open ? "open" : ""}`}>
        <div className="sm-header">
          <div className="sm-avatar">{student?.name?.charAt(0) || student?.srn?.charAt(0) || "S"}</div>
          <div className="sm-info">
            <p className="sm-name">{student?.name || "Student"}</p>
            <p className="sm-srn">{student?.srn}</p>
          </div>
          <button className="sm-close" onClick={onClose}>{Icon.close}</button>
        </div>

        <div className="sm-items">
          <button className="sm-item" onClick={() => { onNavigate("profile"); onClose(); }}>
            <span className="sm-ico">{Icon.user}</span>
            <span>Profile</span>
          </button>
          <button className="sm-item" onClick={() => { onNavigate("orderstatus"); onClose(); }}>
            <span className="sm-ico">{Icon.track}</span>
            <span>Order Status</span>
          </button>
          <button className="sm-item" onClick={() => { onNavigate("history"); onClose(); }}>
            <span className="sm-ico">{Icon.history}</span>
            <span>Order History</span>
          </button>
          <div className="sm-divider" />
          <button className="sm-item danger" onClick={() => { onLogout(); onClose(); }}>
            <span className="sm-ico">{Icon.logout}</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  return (
    <div className="login-pg">
      <div className="lb lb1" /><div className="lb lb2" />
      <div className="login-card">
        <div className="login-top">
          <div className="logo-icon">🍽️</div>
          <h1>Campus Eats</h1>
          <p>Order your favourite campus food</p>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Login</button>
          <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>Register</button>
        </div>
        {mode === "login"
          ? <LoginForm onLogin={onLogin} />
          : <RegisterForm onSuccess={() => setMode("login")} />
        }
      </div>
    </div>
  );
}

function LoginForm({ onLogin }) {
  const [srn, setSrn] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("srn");

  const handleSrnNext = (e) => {
    e.preventDefault();
    if (!srn.trim()) { setError("Please enter your SRN"); return; }
    setError(""); setStep("pin");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) { setError("PIN must be exactly 4 digits"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ srn: srn.trim().toUpperCase(), pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("studentSrn", data.student?.srn || srn.trim().toUpperCase());
      localStorage.setItem("studentName", data.student?.name || "");
      localStorage.setItem("studentToken", data.token || "");
      onLogin(data.student);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return step === "srn" ? (
    <form onSubmit={handleSrnNext} className="lform">
      <label className="lbl">Student Registration Number</label>
      <div className="igrp"><span className="ig-ico">🎓</span>
        <input type="text" placeholder="e.g. PES1UG22CS001" value={srn}
          onChange={e => { setSrn(e.target.value); setError(""); }} autoFocus />
      </div>
      {error && <p className="errmsg">{error}</p>}
      <button type="submit" className="btn-org">Continue →</button>
    </form>
  ) : (
    <form onSubmit={handleLogin} className="lform">
      <button type="button" className="chg-srn" onClick={() => { setStep("srn"); setPin(""); setError(""); }}>← Change SRN</button>
      <p className="srn-show">{srn.toUpperCase()}</p>
      <label className="lbl">Enter 4-Digit PIN</label>
      <div className="igrp"><span className="ig-ico ig-svg">{Icon.lock}</span>
        <input type="password" inputMode="numeric" maxLength={4} placeholder="Enter your 4-digit PIN"
          value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g,"").slice(0,4)); setError(""); }}
          autoFocus className="pin-field" />
      </div>
      {error && <p className="errmsg">{error}</p>}
      <button type="submit" className="btn-org" disabled={loading || pin.length < 4}>
        {loading ? "Logging in..." : "Login →"}
      </button>
    </form>
  );
}

function RegisterForm({ onSuccess }) {
  const [srn, setSrn] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!srn.trim()) { setError("SRN is required"); return; }
    if (pin.length !== 4) { setError("PIN must be exactly 4 digits"); return; }
    if (pin !== confirmPin) { setError("PINs do not match"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ srn: srn.trim().toUpperCase(), pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setSuccess(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (success) return (
    <div className="reg-success"><div className="reg-succ-icon">✅</div>
      <p className="reg-succ-txt">Registered successfully!</p>
      <p className="reg-succ-sub">Redirecting to login...</p>
    </div>
  );

  return (
    <form onSubmit={handleRegister} className="lform">
      <label className="lbl">Student Registration Number</label>
      <div className="igrp"><span className="ig-ico">🎓</span>
        <input type="text" placeholder="e.g. PES1UG22CS001" value={srn}
          onChange={e => { setSrn(e.target.value); setError(""); }} autoFocus />
      </div>
      <label className="lbl">Create 4-Digit PIN</label>
      <div className="igrp"><span className="ig-ico ig-svg">{Icon.lock}</span>
        <input type="password" inputMode="numeric" maxLength={4} placeholder="Choose a 4-digit PIN"
          value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g,"").slice(0,4)); setError(""); }} className="pin-field" />
      </div>
      <label className="lbl">Confirm PIN</label>
      <div className="igrp"><span className="ig-ico ig-svg">{Icon.lock}</span>
        <input type="password" inputMode="numeric" maxLength={4} placeholder="Re-enter your PIN"
          value={confirmPin} onChange={e => { setConfirmPin(e.target.value.replace(/\D/g,"").slice(0,4)); setError(""); }} className="pin-field" />
      </div>
      <p className="reg-note">You can add your name, phone & email from your profile after logging in.</p>
      {error && <p className="errmsg">{error}</p>}
      <button type="submit" className="btn-org" disabled={loading || pin.length < 4 || confirmPin.length < 4}>
        {loading ? "Registering..." : "Create Account →"}
      </button>
    </form>
  );
}

// ── PROFILE PAGE ──────────────────────────────────────────────────────────────
function ProfilePage({ student, onBack }) {
  return (
    <div className="page">
      <header className="app-hdr">
        <div className="hl"><button className="ibtn" onClick={onBack}>{Icon.back}</button><span className="h-title">Profile</span></div>
      </header>
      <div className="profile-body">
        <div className="profile-avatar">{student?.name?.charAt(0) || student?.srn?.charAt(0) || "S"}</div>
        <h2 className="profile-name">{student?.name || "Student"}</h2>
        <p className="profile-srn">{student?.srn}</p>
        <div className="profile-card">
          <div className="prow"><span className="plbl">SRN</span><span className="pval">{student?.srn}</span></div>
          <div className="prow"><span className="plbl">Name</span><span className="pval">{student?.name || "Not set"}</span></div>
          <div className="prow"><span className="plbl">Email</span><span className="pval">{student?.email || "Not set"}</span></div>
        </div>
        <p className="profile-note">To update your profile details, contact your campus admin.</p>
      </div>
    </div>
  );
}

// ── ORDER STATUS PAGE ─────────────────────────────────────────────────────────
const STATUS_STEPS = ["pending", "preparing", "ready", "completed"];
const STATUS_META = {
  pending:   { icon: "⏳", label: "Order Received",    desc: "Waiting for vendor to accept your order", color: "#f59e0b" },
  preparing: { icon: "👨‍🍳", label: "Being Prepared",   desc: "Your food is being cooked right now",      color: "#3b82f6" },
  ready:     { icon: "✅", label: "Ready for Pickup!", desc: "Your order is ready — show pickup code",   color: "#16a34a" },
  completed: { icon: "🎉", label: "Completed",          desc: "Order picked up. Enjoy your meal!",        color: "#6b7280" },
  cancelled: { icon: "❌", label: "Cancelled",          desc: "This order was cancelled by the vendor",   color: "#dc2626" },
};

function OrderStatusPage({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const pollRef = useRef(null);

  const fetchOrders = async () => {
    const srn = localStorage.getItem("studentSrn");
    try {
      const res = await fetch(`${API}/orders/history?srn=${srn}`);
      const data = await res.json();
      const fetched = data.orders || [];
      setOrders(fetched);
      // Update selected order if open
      if (selectedOrder) {
        const updated = fetched.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrders();
    pollRef.current = setInterval(fetchOrders, 5000); // poll every 5s
    return () => clearInterval(pollRef.current);
  }, []);

  // Active orders (not completed/cancelled) shown first
  const active = orders.filter(o => o.status !== "completed" && o.status !== "cancelled");
  const past = orders.filter(o => o.status === "completed" || o.status === "cancelled");

  if (selectedOrder) return <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />;

  return (
    <div className="page">
      <header className="app-hdr">
        <div className="hl"><button className="ibtn" onClick={onBack}>{Icon.back}</button><span className="h-title">Order Status</span></div>
        <div className="hr"><span className="live-dot" />Live</div>
      </header>

      {loading ? (
        <div className="skel-wrap">{[1,2].map(i => <div key={i} className="skel-i" />)}</div>
      ) : orders.length === 0 ? (
        <div className="empty-st"><div style={{fontSize:48,marginBottom:12}}>📋</div><p>No orders yet</p></div>
      ) : (
        <div style={{padding:"12px"}}>
          {active.length > 0 && (
            <>
              <p className="os-section-lbl">🔴 Active Orders</p>
              {active.map(o => <OrderStatusCard key={o.id} order={o} onClick={() => setSelectedOrder(o)} />)}
            </>
          )}
          {past.length > 0 && (
            <>
              <p className="os-section-lbl" style={{marginTop:16}}>Past Orders</p>
              {past.map(o => <OrderStatusCard key={o.id} order={o} onClick={() => setSelectedOrder(o)} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function OrderStatusCard({ order, onClick }) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  return (
    <div className="os-card" onClick={onClick}>
      <div className="os-card-left">
        <span className="os-icon">{meta.icon}</span>
        <div>
          <p className="os-store">{order.store_name}</p>
          <p className="os-num">#{order.order_number}</p>
          <p className="os-label" style={{color: meta.color}}>{meta.label}</p>
        </div>
      </div>
      <div className="os-card-right">
        <p className="os-amt">₹{order.total_amount}</p>
        <span className="os-arrow">›</span>
      </div>
    </div>
  );
}

function OrderDetail({ order, onBack }) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const stepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="page">
      <header className="app-hdr">
        <div className="hl"><button className="ibtn" onClick={onBack}>{Icon.back}</button><span className="h-title">Order Detail</span></div>
        <div className="hr"><span className="live-dot" />Live</div>
      </header>
      <div style={{padding:"16px"}}>

        {/* Status hero */}
        <div className="od-hero" style={{borderColor: meta.color}}>
          <div className="od-hero-icon">{meta.icon}</div>
          <h2 className="od-hero-label" style={{color: meta.color}}>{meta.label}</h2>
          <p className="od-hero-desc">{meta.desc}</p>
          {order.status === "ready" && order.pickup_code && (
            <div className="od-pickup">
              <p className="od-pickup-lbl">Your Pickup Code</p>
              <p className="od-pickup-code">{order.pickup_code}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {!isCancelled && (
          <div className="od-progress">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="od-step">
                <div className={`od-step-dot ${i <= stepIdx ? "done" : ""}`}
                  style={i <= stepIdx ? {background: meta.color, borderColor: meta.color} : {}}>
                  {i < stepIdx ? "✓" : i === stepIdx ? "●" : ""}
                </div>
                <p className={`od-step-lbl ${i <= stepIdx ? "active" : ""}`}>{STATUS_META[s]?.label?.split(" ")[0]}</p>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`od-step-line ${i < stepIdx ? "done" : ""}`}
                    style={i < stepIdx ? {background: meta.color} : {}} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Order info */}
        <div className="od-card">
          <h3 className="od-card-title">Order Details</h3>
          <div className="od-row"><span>Order ID</span><span className="od-val">#{order.order_number}</span></div>
          <div className="od-row"><span>Restaurant</span><span className="od-val">{order.store_name}</span></div>
          <div className="od-row"><span>Items</span><span className="od-val">{order.items_count} item{order.items_count !== 1 ? "s" : ""}</span></div>
          <div className="od-row"><span>Total Paid</span><span className="od-val od-total">₹{order.total_amount}</span></div>
          <div className="od-row"><span>Placed</span><span className="od-val">{new Date(order.created_at).toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit"})}</span></div>
          {order.pickup_code && (
            <div className="od-row"><span>Pickup Code</span><span className="od-val" style={{color:"#E85D04",fontWeight:800,letterSpacing:3}}>{order.pickup_code}</span></div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomePage({ cart, onVendorSelect, onCartOpen, student, onMenuOpen }) {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const cartCount = Object.values(cart).reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    fetch(`${API}/vendors`).then(r => r.json()).then(d => setVendors(d.vendors || [])).catch(() => setVendors([])).finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter(v => v.store_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <header className="app-hdr">
        <div className="hl">
          <button className="ibtn" onClick={onMenuOpen}>{Icon.menu}</button>
          <span className="h-logo">🍽️</span>
          <span className="h-title">Campus Eats</span>
        </div>
        <div className="hr">
          <button className="ibtn cart-ibtn" onClick={onCartOpen}>{Icon.cart}{cartCount > 0 && <span className="cbadge">{cartCount}</span>}</button>
        </div>
      </header>
      <div className="hero-band">
        <p className="hero-hi">Hey {student?.name?.split(" ")[0] || "there"} 👋</p>
        <h2 className="hero-q">What are you craving today?</h2>
        <div className="srch-row">
          <span className="srch-ico">{Icon.search}</span>
          <input type="text" placeholder="Search restaurants or dishes..." value={search} onChange={e => setSearch(e.target.value)} />
          <span className="filt-ico">{Icon.filter}</span>
        </div>
      </div>
      <p className="sec-lbl">All Restaurants</p>
      {loading ? (
        <div className="skel-wrap">{[1,2,3].map(i => <div key={i} className="skel-v" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-st">No restaurants found</div>
      ) : (
        <div className="vlist">
          {filtered.map((v, idx) => (
            <div key={v.vendor_id} className="vcard" onClick={() => onVendorSelect(v)}>
              <div className="vcard-img">
                <VendorPlaceholder name={v.store_name} color={VENDOR_COLORS[idx % VENDOR_COLORS.length]} />
                <span className="tag-ta">TAKEAWAY AVAILABLE</span>
                <span className="prep-tag"><span className="pt-i">{Icon.clock}</span>{v.prep_time || "20-30 min"}</span>
              </div>
              <div className="vcard-body">
                <div className="vcard-row"><h3>{v.store_name}</h3><span className="rtag"><span className="star-i">{Icon.star}</span>{v.rating || "4.0"}</span></div>
                <p className="vloc"><span className="loc-i">{Icon.location}</span>{v.location || "Campus Food Court"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MENU ──────────────────────────────────────────────────────────────────────
function MenuPage({ vendor, cart, onUpdateCart, onBack, onCartOpen }) {
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const cartCount = Object.values(cart).reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    fetch(`${API}/vendors/${vendor.vendor_id}/menu`).then(r => r.json()).then(d => setMenu(d)).catch(() => setMenu({})).finally(() => setLoading(false));
  }, [vendor.vendor_id]);

  const getQty = (item) => cart[item.id]?.quantity || 0;
  const add = (item) => onUpdateCart(item.id, getQty(item) + 1, item, vendor);
  const remove = (item) => onUpdateCart(item.id, Math.max(0, getQty(item) - 1), item, vendor);

  return (
    <div className="page">
      <header className="app-hdr">
        <div className="hl"><button className="ibtn" onClick={onBack}>{Icon.back}</button><span className="h-title">{vendor.store_name}</span></div>
        <button className="ibtn cart-ibtn" onClick={onCartOpen}>{Icon.cart}{cartCount > 0 && <span className="cbadge">{cartCount}</span>}</button>
      </header>
      <div className="v-hero"><VendorPlaceholder name={vendor.store_name} color={VENDOR_COLORS[1]} />
        <div className="vh-info">
          <h2>{vendor.store_name}</h2>
          <div className="vh-meta">
            <span><span className="vm-i">{Icon.location}</span>{vendor.location || "Campus"}</span>
            <span><span className="vm-i">{Icon.clock}</span>{vendor.prep_time || "20-30 min"}</span>
            <span className="rtag"><span className="star-i">{Icon.star}</span>{vendor.rating || "4.0"}</span>
          </div>
        </div>
      </div>
      <p className="sec-lbl" style={{padding:"14px 16px 4px"}}>Menu</p>
      {loading ? (
        <div className="skel-wrap">{[1,2,3].map(i => <div key={i} className="skel-i" />)}</div>
      ) : Object.keys(menu).length === 0 ? (
        <div className="empty-st">No items available</div>
      ) : (
        Object.entries(menu).map(([cat, items]) => (
          <div key={cat} className="mcat">
            <h3 className="mcat-hd"><span className="cat-bar" />{cat}</h3>
            {items.map(item => {
              const qty = getQty(item);
              return (
                <div key={item.id} className="mitem">
                  <div className="mitem-l">
                    <span className="veg-i">{item.veg_non_veg === "non-veg" ? Icon.nonveg : Icon.veg}</span>
                    <div><p className="mi-name">{item.name}</p><p className="mi-price">₹{item.price}</p></div>
                  </div>
                  <div className="mitem-r">
                    <div className="mi-thumb">{item.name?.charAt(0)}</div>
                    {qty === 0 ? (
                      <button className="add-btn" onClick={() => add(item)}>Add <span className="add-ico">{Icon.plus}</span></button>
                    ) : (
                      <div className="qty-ctrl"><button onClick={() => remove(item)}>{Icon.minus}</button><span>{qty}</span><button onClick={() => add(item)}>{Icon.plus}</button></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
      {cartCount > 0 && <div className="cart-bar" onClick={onCartOpen}><span>{cartCount} item{cartCount > 1 ? "s" : ""} added</span><span>View Cart →</span></div>}
    </div>
  );
}

// ── CART ──────────────────────────────────────────────────────────────────────
function CartPage({ cart, onUpdateCart, onBack, onOrderPlaced }) {
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const items = Object.values(cart);
  const vendorName = items[0]?.storeName || "";
  const vendorId = items[0]?.vendorId || "";
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const placeOrder = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("studentToken") || ""}` },
        body: JSON.stringify({ vendorId, storeName: vendorName, totalAmount: total, studentSrn: localStorage.getItem("studentSrn"), paymentStatus: "paid", paymentId: "cash_" + Date.now(), items: items.map(i => ({ menuItemId: i.id, name: i.name, quantity: i.quantity, price: i.price })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");
      onOrderPlaced(data.order);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (items.length === 0) return (
    <div className="page">
      <header className="app-hdr"><div className="hl"><button className="ibtn" onClick={onBack}>{Icon.back}</button><span className="h-title">Your Cart</span></div></header>
      <div className="empty-st" style={{marginTop:80}}><div style={{fontSize:48,marginBottom:12}}>🛒</div><p>Your cart is empty</p><button className="btn-org" style={{marginTop:16,width:"auto",padding:"12px 28px"}} onClick={onBack}>Browse Restaurants</button></div>
    </div>
  );

  return (
    <div className="page">
      <header className="app-hdr"><div className="hl"><button className="ibtn" onClick={onBack}>{Icon.back}</button><span className="h-title">Your Cart</span></div></header>
      <div className="cv-row"><span className="cv-ico">🏪</span><div><p className="cv-lbl">ORDERING FROM</p><p className="cv-name">{vendorName}</p></div></div>
      <div className="ctabs"><button className="ctab active">🛍️ Pickup</button><button className="ctab">🚲 Delivery</button></div>
      <div className="csec">
        <h3 className="csec-ttl">{Icon.receipt} Order Summary</h3>
        {items.map(item => (
          <div key={item.id} className="citem">
            <div className="citem-l"><span className="veg-i">{Icon.veg}</span><div><p className="ci-name">{item.name}</p><p className="ci-sub">₹{item.price}</p></div></div>
            <div className="citem-r">
              <span className="ci-amt">₹{item.price * item.quantity}</span>
              <div className="qty-ctrl sm"><button onClick={() => onUpdateCart(item.id, item.quantity - 1, item, { store_name: vendorName, vendor_id: vendorId })}>{Icon.minus}</button><span>{item.quantity}</span><button onClick={() => onUpdateCart(item.id, item.quantity + 1, item, { store_name: vendorName, vendor_id: vendorId })}>{Icon.plus}</button></div>
            </div>
          </div>
        ))}
      </div>
      <div className="csec"><h3 className="csec-ttl">Cooking Instructions</h3><textarea className="cook-ta" placeholder="E.g. Less spicy, no onions..." value={instructions} onChange={e => setInstructions(e.target.value)} rows={3} /></div>
      <div className="csec">
        <h3 className="csec-ttl">Bill Details</h3>
        <div className="bill-r"><span>Item Total</span><span>₹{total}</span></div>
        <div className="bill-r"><span>Platform Fee</span><span className="free-lbl">FREE</span></div>
        <div className="bill-div" />
        <div className="bill-r bill-tot"><span>Total</span><span>₹{total}</span></div>
      </div>
      {error && <p className="errmsg" style={{margin:"0 16px 12px"}}>⚠️ {error}</p>}
      <div className="cart-ftr"><div><p className="cf-lbl">TOTAL</p><p className="cf-amt">₹{total}</p></div><button className="place-btn" onClick={placeOrder} disabled={loading}>{loading ? "Placing..." : `Place Order  ₹${total}`}</button></div>
    </div>
  );
}

// ── SUCCESS ───────────────────────────────────────────────────────────────────
function SuccessPage({ order, onHome, onTrack }) {
  return (
    <div className="page succ-pg">
      <header className="app-hdr"><span className="h-title">Order Placed</span></header>
      <div className="succ-body">
        <div className="succ-circle">{Icon.check}</div>
        <h2>Order Placed!</h2>
        <p className="succ-sub">Your order has been placed successfully.</p>
        <div className="succ-card">
          <p className="sc-lbl">Total Paid</p>
          <p className="sc-amt">₹{order?.total_amount}</p>
          <div className="sc-div" />
          <p className="sc-pickup">🕐 Pickup in ~10 min</p>
          {order?.pickup_code && (<><p className="sc-code-lbl">Pickup Code</p><p className="sc-code">{order.pickup_code}</p></>)}
        </div>
        <button className="btn-org" style={{marginBottom:12}} onClick={onTrack}>Track Order Status</button>
        <button className="btn-dark" onClick={onHome}>Back to Home</button>
      </div>
    </div>
  );
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
function HistoryPage({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const srn = localStorage.getItem("studentSrn");
    fetch(`${API}/orders/history?srn=${srn}`).then(r => r.json()).then(d => setOrders(d.orders || [])).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <header className="app-hdr"><div className="hl"><button className="ibtn" onClick={onBack}>{Icon.back}</button><span className="h-title">Order History</span></div></header>
      {loading ? <div className="skel-wrap">{[1,2,3].map(i => <div key={i} className="skel-i" />)}</div>
        : orders.length === 0 ? <div className="empty-st"><div style={{fontSize:48,marginBottom:12}}>📋</div><p>No orders yet</p></div>
        : (
          <div className="hist-list">
            {orders.map(o => (
              <div key={o.id} className="hcard">
                <div className="hcard-top">
                  <div><p className="hc-store">{o.store_name}</p><p className="hc-date">{new Date(o.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p></div>
                  <span className={`sbadge s-${o.status}`}>{o.status}</span>
                </div>
                <div className="hcard-bot"><span className="hc-items">{o.items_count} item{o.items_count > 1 ? "s" : ""}</span><span className="hc-amt">₹{o.total_amount}</span></div>
                {o.pickup_code && <p className="hc-code">Pickup Code: <strong>{o.pickup_code}</strong></p>}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [student, setStudent] = useState(() => {
    const srn = localStorage.getItem("studentSrn");
    const name = localStorage.getItem("studentName");
    return srn ? { srn, name } : null;
  });
  const [page, setPage] = useState("home");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [cart, setCart] = useState({});
  const [completedOrder, setCompletedOrder] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const updateCart = useCallback((itemId, qty, item, vendor) => {
    setCart(prev => {
      const next = { ...prev };
      if (qty <= 0) delete next[itemId];
      else next[itemId] = { ...item, quantity: qty, vendorId: vendor.vendor_id, storeName: vendor.store_name };
      return next;
    });
  }, []);

  const logout = () => { localStorage.clear(); setStudent(null); setCart({}); setPage("home"); setMenuOpen(false); };
  const navigate = (p) => setPage(p);

  if (!student) return <LoginPage onLogin={s => setStudent(s)} />;

  return (
    <>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} student={student} onNavigate={navigate} onLogout={logout} />

      {page === "profile" && <ProfilePage student={student} onBack={() => setPage("home")} />}
      {page === "orderstatus" && <OrderStatusPage onBack={() => setPage("home")} />}
      {page === "history" && <HistoryPage onBack={() => setPage("home")} />}
      {page === "success" && <SuccessPage order={completedOrder} onHome={() => { setCart({}); setCompletedOrder(null); setPage("home"); }} onTrack={() => { setCart({}); setCompletedOrder(null); setPage("orderstatus"); }} />}
      {page === "cart" && <CartPage cart={cart} onUpdateCart={updateCart} onBack={() => setPage(selectedVendor ? "menu" : "home")} onOrderPlaced={o => { setCompletedOrder(o); setPage("success"); }} />}
      {page === "menu" && selectedVendor && <MenuPage vendor={selectedVendor} cart={cart} onUpdateCart={updateCart} onBack={() => setPage("home")} onCartOpen={() => setPage("cart")} />}
      {page === "home" && <HomePage cart={cart} student={student} onVendorSelect={v => { setSelectedVendor(v); setPage("menu"); }} onCartOpen={() => setPage("cart")} onMenuOpen={() => setMenuOpen(true)} />}
    </>
  );
}