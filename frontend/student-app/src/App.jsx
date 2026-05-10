import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Settings, 
  ShoppingCart, 
  History, 
  ChevronRight, 
  Star, 
  Plus, 
  X, 
  LayoutGrid,
  Heart,
  Menu,
  LogOut,
  Bell,
  Package,
  User
} from 'lucide-react';
import './App.css';
import { authAPI, vendorsAPI, menuAPI, ordersAPI } from './api';

function App() {
  // State Management
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Data State
  const [restaurants, setRestaurants] = useState([]);
  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  
  // UI State
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL STALLS');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  const CATEGORIES = [
    { name: 'ALL STALLS', icon: '🍽️' },
    { name: 'BIRYANI', icon: '🍛' },
    { name: 'ROLLS', icon: '🌯' },
    { name: 'NOODLES', icon: '🍜' },
    { name: 'DOSA', icon: '🥞' },
    { name: 'BREAKFAST', icon: '☀️' },
    { name: 'CHICKEN', icon: '🍗' },
    { name: 'COMBOS', icon: '🍱' },
    { name: 'SIDES', icon: '🍟' },
    { name: 'SHAWARMA', icon: '🌮' },
    { name: 'BEVERAGES', icon: '☕' },
    { name: 'LUNCH', icon: '🍲' },
    { name: 'DESSERT', icon: '🍨' },
  ];

  const PRICE_FILTERS = [
    { label: 'All', filter: null },
    { label: '₹49 & under', max: 49 },
    { label: '₹49 – ₹99', min: 50, max: 99 },
    { label: '₹99 – ₹149', min: 100, max: 149 },
    { label: '₹149 – ₹199', min: 150, max: 199 },
    { label: '₹199 – ₹299', min: 200, max: 299 },
    { label: 'Above ₹299', min: 300 },
    { label: 'Most Popular', popular: true },
  ];

  // Are we actively filtering (not default view)?
  const isFiltering = selectedFilter !== 'ALL STALLS' || selectedPriceFilter !== null;

  // Auto-login on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setCurrentUser(JSON.parse(user));
      setCurrentScreen('home');
      loadRestaurants();
    }
  }, []);

  // Fetch filtered items when chips change
  useEffect(() => {
    if (currentScreen !== 'home') return;
    if (!isFiltering) { setFilteredItems([]); return; }
    const fetchFiltered = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedFilter !== 'ALL STALLS') params.food_type = selectedFilter;
        if (selectedPriceFilter) {
          if (selectedPriceFilter.popular) params.popular = true;
          if (selectedPriceFilter.min != null) params.minPrice = selectedPriceFilter.min;
          if (selectedPriceFilter.max != null) params.maxPrice = selectedPriceFilter.max;
        }
        const res = await menuAPI.getFiltered(params);
        setFilteredItems(res.data || []);
      } catch (err) {
        console.error('Filter error:', err);
        setNotification('Filter failed. Check connection.');
        setTimeout(() => setNotification(''), 3000);
      }
      setLoading(false);
    };
    fetchFiltered();
  }, [selectedFilter, selectedPriceFilter, currentScreen]);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const response = await vendorsAPI.getAll();
      setRestaurants(response.data);
    } catch (error) {
      console.error('Restaurant load error:', error);
    }
    setLoading(false);
  };

  const loadMenu = async (restaurant) => {
    setCurrentRestaurant(restaurant);
    setLoading(true);
    try {
      const res = await menuAPI.getByVendor(restaurant.vendor_id);
      // Handle both array response and categorized object response
      let flatMenu = [];
      if (Array.isArray(res.data)) {
        flatMenu = res.data;
      } else if (res.data && typeof res.data === 'object') {
        flatMenu = Object.values(res.data).flat();
      }
      setMenuItems(flatMenu);
      setCurrentScreen('menu');
    } catch (error) {
       console.error('Menu load error:', error);
       setNotification('Failed to load menu. Check connection.');
       setTimeout(() => setNotification(''), 3000);
    }
    setLoading(false);
  };

  const loadHistory = async () => {
    if (!currentUser) return;
    try {
      const res = await ordersAPI.getHistory(currentUser.srn);
      setOrderHistory(res.data.orders || []);
    } catch (err) {
      console.error('History load error:', err);
    }
  };

  useEffect(() => {
    if (showSidebar) loadHistory();
  }, [showSidebar]);

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setCurrentScreen('welcome');
    setShowSidebar(false);
  };

  const addToCart = (item) => {
    const existing = cart.find(i => i.item_id === item.item_id);
    if (existing) {
      setCart(cart.map(i => i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    setNotification(`${item.name} added!`);
    setTimeout(() => setNotification(''), 2000);
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(i => i.item_id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const calculateTotal = () => cart.reduce((s, i) => s + (i.price * i.quantity), 0);

  // ==========================================
  // RENDER: WELCOME
  // ==========================================
  if (currentScreen === 'welcome') {
    return (
      <div className="app welcome-view" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🍱</div>
        <h1 style={{ color: '#F97316', fontWeight: '800', fontSize: '32px' }}>Campus Eats</h1>
        <p style={{ color: '#6B7280', marginBottom: '40px' }}>Your favorite campus stalls, at your fingertips.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 40px' }}>
          <button className="v-btn" onClick={() => setCurrentScreen('login')}>Sign In</button>
          <button className="v-btn" style={{ background: '#FFF', color: '#F97316', border: '1px solid #F97316' }} onClick={() => setCurrentScreen('register')}>Register</button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: LOGIN/REGISTER (Simplified)
  // ==========================================
  if (currentScreen === 'login') {
    return (
      <div className="app header-padding" style={{ padding: '60px 40px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Sign In</h1>
        <p style={{ color: '#6B7280', marginBottom: '32px' }}>Welcome back! Log in to continue.</p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await authAPI.login(e.target.srn.value, e.target.pin.value);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setCurrentUser(res.data.user);
            setCurrentScreen('home');
            loadRestaurants();
          } catch (err) { alert('Login failed'); }
        }}>
          <input className="v-input" name="srn" placeholder="SRN (e.g., R26EA001)" required />
          <input className="v-input" name="pin" type="password" placeholder="4-digit PIN" required />
          <button className="v-btn" type="submit">Log In</button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#6B7280' }}>
          New student? <span style={{ color: '#F97316', fontWeight: '600', cursor: 'pointer' }} onClick={() => setCurrentScreen('register')}>Register here</span>
        </p>
      </div>
    );
  }

  if (currentScreen === 'register') {
     return (
      <div className="app header-padding" style={{ padding: '60px 40px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Create Account</h1>
        <p style={{ color: '#6B7280', marginBottom: '32px' }}>Join the campus food community!</p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await authAPI.register(e.target.srn.value, e.target.pin.value, e.target.name.value);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setCurrentUser(res.data.user);
            setCurrentScreen('home');
            loadRestaurants();
          } catch (err) { alert('Registration failed'); }
        }}>
          <input className="v-input" name="srn" placeholder="SRN" required />
          <input className="v-input" name="name" placeholder="Full Name" required />
          <input className="v-input" name="pin" type="password" placeholder="4-digit PIN" required />
          <button className="v-btn" type="submit">Sign Up</button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#6B7280' }}>
          Already have an account? <span style={{ color: '#F97316', fontWeight: '600', cursor: 'pointer' }} onClick={() => setCurrentScreen('login')}>Sign In</span>
        </p>
      </div>
    );
  }

  // ==========================================
  // RENDER: HOME
  // ==========================================
  if (currentScreen === 'home') {
    return (
      <div className="app">
        {notification && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#333', color: 'white', padding: '10px 20px', borderRadius: '100px', zIndex: 1000, fontSize: '14px' }}>{notification}</div>}
        
        {/* Navbar */}
        <header className="navbar">
          <div className="nav-top">
            <button className="icon-btn hamburger-btn" onClick={() => setShowSidebar(true)}>
              <Menu size={24} />
            </button>
            <div className="location-picker">
              <MapPin size={18} color="#F97316" />
              <span>Reva University</span>
            </div>
            <div style={{ width: 40 }} />
          </div>
          
          <div className="search-box-wrap">
            <Search className="icon" size={18} />
            <input type="text" placeholder="Search for food..." />
          </div>
        </header>

        {/* Categories Ribbons */}
        <div className="categories-scroll">
          {CATEGORIES.map(cat => (
            <div 
              key={cat.name} 
              className={`category-item ${selectedFilter === cat.name ? 'active' : ''}`}
              onClick={() => setSelectedFilter(cat.name)}
            >
              <div className="cat-icon-box">{cat.icon}</div>
              <span>{cat.name}</span>
            </div>
          ))}
        </div>

        {/* Filter Pills */}
        <div className="filters-container">
          <div className="filter-pill"><Settings size={14} /></div>
          {PRICE_FILTERS.map(pf => (
            <div 
              key={pf.label} 
              className={`filter-pill ${selectedPriceFilter === pf ? 'active' : (pf.filter === null && selectedPriceFilter === null) ? 'active' : ''}`}
              onClick={() => setSelectedPriceFilter(pf.filter === null ? null : pf)}
            >
              {pf.label}
            </div>
          ))}
        </div>

        {/* Welcome Section */}
        <div style={{ padding: '0 20px 20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Welcome, {currentUser?.name?.split(' ')[0] || 'iqtre'}!</h1>
          <p style={{ color: '#6B7280', fontSize: '15px' }}>What are you craving today?</p>
        </div>

        {/* Content: Filtered Items OR Stalls */}
        {isFiltering ? (
          <div className="home-section">
            <div className="section-head">
              <h2>{selectedFilter !== 'ALL STALLS' ? selectedFilter : 'Filtered'} Items</h2>
              <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{filteredItems.length} found</span>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>Loading...</div>
            ) : filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>No items match your filters</div>
            ) : (
              <div className="menu-grid">
                {filteredItems.map(item => (
                  <div key={item.item_id} className="grid-item-card">
                    <div className="grid-img-wrap">
                      <span className="item-badge" style={{ color: item.veg_non_veg === 'VEG' ? '#10B981' : '#EF4444' }}>{item.veg_non_veg === 'VEG' ? '● Veg' : '● Non-Veg'}</span>
                      {item.veg_non_veg === 'NON-VEG' ? '🍗' : item.food_type === 'BIRYANI' ? '🍛' : item.food_type === 'NOODLES' ? '🍜' : item.food_type === 'DOSA' ? '🥞' : item.food_type === 'ROLLS' ? '🌯' : item.food_type === 'BEVERAGES' ? '☕' : item.food_type === 'DESSERT' ? '🍨' : '🥬'}
                    </div>
                    <h4>{item.name}</h4>
                    <p className="brand">by {item.vendor_name}</p>
                    <div className="card-meta" style={{ fontSize: '10px' }}>
                      <span><Star size={10} fill="#F97316" color="#F97316" /> {item.avg_rating || '–'}</span>
                      {item.is_popular && <span className="tag-pill" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '9px', padding: '1px 6px' }}>Popular</span>}
                    </div>
                    <div className="item-bot-row" style={{ marginTop: '8px' }}>
                      <span className="price">₹{item.price}</span>
                      <button className="card-add-btn" style={{ position: 'static' }} onClick={() => addToCart(item)}><Plus size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="home-section">
            <div className="section-head">
              <h2>Popular Stalls</h2>
              <span className="see-all">See All <ChevronRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
            </div>
            
            {restaurants.map(stall => (
              <div key={stall.vendor_id} className="popular-card" onClick={() => loadMenu(stall)}>
                <div className="card-img-wrap">
                  {stall.name === 'GRUB FOODS' ? '🍛' : stall.name === 'ROLL ME' ? '🌯' : stall.name === 'SIDDI VINAYAKA GARDEN' ? '🏪' : '🍽️'}
                </div>
                <div className="card-content">
                  <h3>{stall.name}</h3>
                  <div className="card-meta">
                    <span><Star size={12} fill="#F97316" color="#F97316" /> {stall.rating}</span>
                    <span>• {stall.prep_time} mins</span>
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '12px', marginBottom: '8px' }}>{stall.location}</div>
                  <div className="card-tags">
                    <span className="tag-pill">Free Delivery</span>
                    <span className="tag-pill">Lowest Price</span>
                  </div>
                </div>
                <div className="card-add-btn">
                  <Plus size={18} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sidebar Overlay */}
        {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />}
        <div className={`sidebar sidebar-left ${showSidebar ? 'open' : ''}`}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>My Account</h2>
            <button className="icon-btn" onClick={() => setShowSidebar(false)}><X size={22} /></button>
          </div>

          {/* Profile Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#FFF7ED', padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F97316', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', flexShrink: 0 }}>
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>{currentUser?.name}</h3>
              <p style={{ color: '#6B7280', fontSize: '13px', fontWeight: '600' }}>{currentUser?.srn}</p>
            </div>
          </div>

          {/* Current Order */}
          {currentOrder && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>🔴 Live Order</p>
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '16px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>{currentOrder.storeName}</span>
                  <span style={{ color: '#F97316', fontWeight: '700', fontSize: '13px' }}>#{currentOrder.orderId}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>{currentOrder.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ background: '#F97316', color: 'white', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>PREPARING</span>
                  <span style={{ fontWeight: '800', color: '#F97316' }}>₹{currentOrder.totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order History */}
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Order History</p>
          <div style={{ overflowY: 'auto', maxHeight: '240px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orderHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: '13px' }}>No past orders yet</div>
            ) : (
              orderHistory.slice(0, 5).map(order => (
                <div key={order.id} style={{ background: '#F3F4F6', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{order.store_name}</span>
                    <span style={{ color: '#F97316', fontWeight: '700', fontSize: '12px' }}>#{order.order_number}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '6px' }}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: order.status === 'completed' ? '#D1FAE5' : '#FEF3C7', color: order.status === 'completed' ? '#065F46' : '#92400E' }}>{order.status?.toUpperCase()}</span>
                    <span style={{ fontWeight: '800', fontSize: '13px' }}>₹{order.total_amount}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Full History Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#F3F4F6', borderRadius: '12px', cursor: 'pointer', marginBottom: '12px' }} onClick={() => { setCurrentScreen('history'); setShowSidebar(false); }}>
            <History size={18} color="#6B7280" />
            <span style={{ fontWeight: '600', fontSize: '14px' }}>View All Orders</span>
            <ChevronRight size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </div>

          {/* Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#FFF1F2', borderRadius: '12px', cursor: 'pointer' }} onClick={handleLogout}>
            <LogOut size={18} color="#EF4444" />
            <span style={{ fontWeight: '600', color: '#EF4444', fontSize: '14px' }}>Log Out</span>
          </div>
        </div>

        {/* Bottom Nav */}
        <nav className="bottom-nav">
          <div className="nav-tab active">
            <LayoutGrid size={24} />
            <span>Home</span>
          </div>
          <div className="nav-tab" onClick={() => setCurrentScreen('history')}>
            <History size={24} />
            <span>Search</span>
          </div>
          <div className="nav-tab">
            <Heart size={24} />
            <span>Fav</span>
          </div>
          <div className="nav-tab" onClick={() => setCurrentScreen('cart')}>
            <ShoppingCart size={24} />
            <span style={{ position: 'relative' }}>Cart {cart.length > 0 && <span style={{ position: 'absolute', top: -5, right: -10, background: '#F97316', color: 'white', fontSize: '8px', padding: '2px 5px', borderRadius: '50%' }}>{cart.length}</span>}</span>
          </div>
        </nav>
      </div>
    );
  }

  // ==========================================
  // RENDER: MENU (Grid View)
  // ==========================================
  if (currentScreen === 'menu') {
    return (
      <div className="app">
        <header className="sub-header">
           <button className="back-btn" onClick={() => setCurrentScreen('home')}><X size={18} /></button>
           <h2>{currentRestaurant?.name}</h2>
        </header>

        <div className="home-section" style={{ paddingTop: '20px' }}>
           <div className="section-head">
              <h2>Top Menu Items</h2>
           </div>
           
           <div className="menu-grid">
              {menuItems.map(item => (
                <div key={item.item_id} className="grid-item-card">
                  <div className="grid-img-wrap">
                    <span className="item-badge">● Veg</span>
                    {item.veg_non_veg === 'NON-VEG' ? '🍗' : '🥬'}
                  </div>
                  <h4>{item.name}</h4>
                  <p className="brand">by {currentRestaurant?.name}</p>
                  <div className="card-meta" style={{ fontSize: '10px' }}>
                    <span><Star size={10} fill="#F97316" color="#F97316" /> 4.3</span>
                    <span>• 15-20 mins</span>
                  </div>
                  <div className="item-bot-row" style={{ marginTop: '8px' }}>
                    <span className="price">₹{item.price}</span>
                    <button className="card-add-btn" style={{ position: 'static' }} onClick={() => addToCart(item)}><Plus size={16} /></button>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <div onClick={() => setCurrentScreen('cart')} style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#F97316', color: 'white', padding: '16px 32px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 30px rgba(249,115,22,0.4)', cursor: 'pointer', zIndex: 100 }}>
             <ShoppingCart size={20} />
             <span style={{ fontWeight: '700' }}>View Cart ({cart.length}) • ₹{calculateTotal()}</span>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: CART
  // ==========================================
  if (currentScreen === 'cart') {
    return (
      <div className="app">
        <header className="sub-header">
           <button className="back-btn" onClick={() => setCurrentScreen('home')}>←</button>
           <h2>Bill Summary</h2>
        </header>

        <div className="cart-list">
           {cart.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <ShoppingCart size={64} color="#E5E7EB" style={{ margin: '0 auto 20px' }} />
                <p style={{ color: '#9CA3AF' }}>Your cart is empty</p>
                <button className="v-btn" style={{ width: 'auto', marginTop: '20px', padding: '12px 24px' }} onClick={() => setCurrentScreen('home')}>Explore Food</button>
             </div>
           ) : (
             <>
                <div style={{ background: '#F3F4F6', padding: '16px', borderRadius: '20px', marginBottom: '24px' }}>
                   {cart.map(i => (
                     <div key={i.item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #E5E7EB' }}>
                        <div>
                           <div style={{ fontWeight: '700' }}>{i.name}</div>
                           <div style={{ color: '#F97316', fontSize: '14px', fontWeight: '600' }}>₹{i.price}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '4px 12px', borderRadius: '100px' }}>
                           <button onClick={() => updateQty(i.item_id, -1)} style={{ border: 'none', background: 'none', fontSize: '20px', color: '#9CA3AF' }}>-</button>
                           <span style={{ fontWeight: '700' }}>{i.quantity}</span>
                           <button onClick={() => updateQty(i.item_id, 1)} style={{ border: 'none', background: 'none', fontSize: '18px', color: '#F97316' }}>+</button>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="c-summary">
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ color: '#6B7280' }}>Total Price</span>
                      <span style={{ fontWeight: '700' }}>₹{calculateTotal()}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ color: '#6B7280' }}>Delivery/Package</span>
                      <span style={{ fontWeight: '700' }}>₹20</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px dashed #E5E7EB' }}>
                      <span style={{ fontWeight: '800', fontSize: '18px' }}>Grand Total</span>
                      <span style={{ fontWeight: '800', fontSize: '18px', color: '#F97316' }}>₹{calculateTotal() + 20}</span>
                   </div>
                   
                   <button className="v-btn" style={{ marginTop: '30px' }} onClick={async () => {
                      setLoading(true);
                      try {
                        const orderPayload = {
                          vendorId: currentRestaurant.vendor_id,
                          storeName: currentRestaurant.name,
                          totalAmount: calculateTotal() + 20,
                          items: cart.map(c => ({ item_id: c.item_id, name: c.name, quantity: c.quantity, price: c.price })),
                          studentSrn: currentUser.srn
                        };
                        const res = await ordersAPI.create(orderPayload);
                        setCurrentOrder({ ...orderPayload, orderId: res.data?.order_number || res.data?.id || '—' });
                        setCart([]);
                        setCurrentScreen('success');
                      } catch (err) { alert('Order failed: ' + (err.response?.data?.message || err.message)); }
                      setLoading(false);
                   }}>{loading ? 'Processing...' : 'Place Order'}</button>
                </div>
             </>
           )}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: SUCCESS
  // ==========================================
  if (currentScreen === 'success') {
    return (
      <div className="app header-padding" style={{ textAlign: 'center', padding: '100px 40px' }}>
         <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉</div>
         <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>Order Placed!</h1>
         <p style={{ color: '#6B7280', marginBottom: '40px' }}>Head over to the stall and show your pickup code.</p>
         <button className="v-btn" onClick={() => setCurrentScreen('home')}>Back to Home</button>
      </div>
    );
  }

  // ==========================================
  // RENDER: HISTORY
  // ==========================================
  if (currentScreen === 'history') {
    return (
      <div className="app">
        <header className="sub-header">
           <button className="back-btn" onClick={() => setCurrentScreen('home')}>←</button>
           <h2>Order History</h2>
        </header>
        <div style={{ padding: '20px' }}>
           {orderHistory.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '100px 0' }}><p style={{ color: '#9CA3AF' }}>No orders yet</p></div>
           ) : (
             orderHistory.map(order => (
               <div key={order.id} style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #F3F4F6', marginBottom: '12px', boxShadow: 'var(--card-shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                     <span style={{ fontWeight: '700' }}>{order.store_name}</span>
                     <span style={{ color: '#F97316', fontWeight: '600' }}>#{order.order_number}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                     <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', background: '#F3F4F6', fontWeight: '700' }}>{order.status.toUpperCase()}</span>
                     <span style={{ fontWeight: '800' }}>₹{order.total_amount}</span>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    );
  }

  return null;
}

export default App;