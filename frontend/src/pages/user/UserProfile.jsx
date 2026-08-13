import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CustomerShoppingHeader from '../../components/CustomerShoppingHeader';
import { useToast } from '../../components/common/Toast/useToast';
import {
  User, ShoppingBag, Heart, MapPin, CreditCard,
  Settings, Bell, LogOut, ChevronRight, Camera, Trash2, Home, Tag, MessageSquare
} from 'lucide-react';

// Tab sub-components
import UserAddresses       from './profile-tabs/UserAddresses';
import UserPaymentMethods  from './profile-tabs/UserPaymentMethods';
import UserSettings        from './profile-tabs/UserSettings';
import UserNotifications   from './profile-tabs/UserNotifications';
import UserCouponsTab      from './profile-tabs/UserCouponsTab';
import UserChatTab         from './profile-tabs/UserChatTab';
import ShoppingSelect      from '../../components/common/ShoppingSelect';

/* ─── Sidebar ─────────────────────────────────────── */
const SIDEBAR_ITEMS = [
  { id: 'profile',       label: 'My Profile',       Icon: User },
  { id: 'orders',        label: 'My Orders',         Icon: ShoppingBag },
  { id: 'coupons',       label: 'My Coupons',        Icon: Tag },
  { id: 'wishlist',      label: 'Wishlist',          Icon: Heart },
  { id: 'addresses',     label: 'Addresses',         Icon: MapPin },
  { id: 'payment',       label: 'Payment Methods',   Icon: CreditCard },
  { id: 'settings',      label: 'Account Settings',  Icon: Settings },
  { id: 'notifications', label: 'Notifications',     Icon: Bell },
  { id: 'chat',          label: 'Live Chat',         Icon: MessageSquare },
  { id: 'logout',        label: 'Logout',            Icon: LogOut, danger: true },
];

/* ─── localStorage helpers ────────────────────────── */
const AVATAR_KEY = 'userProfileAvatar';

const persistAvatar = (dataUrl) => {
  try {
    localStorage.setItem(AVATAR_KEY, dataUrl);
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    u.avatarUrl = dataUrl;
    localStorage.setItem('user', JSON.stringify(u));
    window.dispatchEvent(new StorageEvent('storage', { key: 'user', newValue: JSON.stringify(u) }));
  } catch (_) {}
};

const clearAvatar = () => {
  localStorage.removeItem(AVATAR_KEY);
  const u = JSON.parse(localStorage.getItem('user') || '{}');
  delete u.avatarUrl;
  localStorage.setItem('user', JSON.stringify(u));
  window.dispatchEvent(new StorageEvent('storage', { key: 'user', newValue: JSON.stringify(u) }));
};

/* ─── Component ──────────────────────────────────── */
const UserProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast    = useToast();
  const fileRef  = useRef(null);

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    dob: '',
    gender: '',
  });

  // avatar: null = no photo; string = data-url or server url
  const [avatar, setAvatar] = useState(() => localStorage.getItem(AVATAR_KEY) || null);

  useEffect(() => { fetchUserProfile(); }, []);

  // Read ?tab= query param and set active tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) { navigate('/user/login'); return; }

      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (res.status === 401) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('user');
        navigate('/user/login');
        return;
      }

      const data = await res.json();
      if (data.success) {
        const fName = data.user.firstName || '';
        const lName = data.user.lastName  || '';
        const full  = (fName || lName) ? `${fName} ${lName}`.trim() : (data.user.name || 'Fashion Hub User');

        setFormData({
          fullName: full,
          email:    data.user.email  || '',
          mobile:   data.user.mobile || data.user.phone || '',
          dob:      data.user.dob    || '',
          gender:   data.user.gender || '',
        });

        // If no local avatar and server has one, use server's
        if (!localStorage.getItem(AVATAR_KEY) && data.user.avatarUrl) {
          setAvatar(data.user.avatarUrl);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  /* ── Form field handlers ──────────────────────────── */
  const handleFieldChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('userToken');
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  /* ── Avatar handlers ──────────────────────────────── */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3 MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      persistAvatar(reader.result);
      toast.success('Profile photo updated!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = (e) => {
    e.stopPropagation();
    setAvatar(null);
    clearAvatar();
    toast.success('Profile photo removed');
  };

  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const fetchUnreadChat = async () => {
    try {
      const u = localStorage.getItem('user');
      const parsed = u && u !== 'undefined' ? JSON.parse(u) : null;
      const cId = parsed?._id || parsed?.id || 'demo_user_123';
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_BASE}/api/chat/unread/user/${cId}`);
      const data = await res.json();
      if (data.success) setUnreadChatCount(data.unreadCount || 0);
    } catch (_) {}
  };

  useEffect(() => {
    fetchUnreadChat();
    const timer = setInterval(fetchUnreadChat, 10000);
    const handleUpd = () => fetchUnreadChat();
    window.addEventListener('updateUserChatUnread', handleUpd);
    return () => {
      clearInterval(timer);
      window.removeEventListener('updateUserChatUnread', handleUpd);
    };
  }, []);

  /* ── Auth / nav ──────────────────────────────────── */
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    navigate('/user/login');
  };

  const handleSidebarClick = (id) => {
    if (id === 'logout')   { handleLogout();             return; }
    if (id === 'orders')   { navigate('/user/orders');   return; }
    if (id === 'wishlist') { navigate('/user/wishlist'); return; }
    setActiveTab(id);
  };

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#FAF4F0' }} />
    );
  }

  /* ─── Styles ─────────────────────────────────────── */
  const S = {
    page: { minHeight:'100vh', background:'#FAF4F0', fontFamily:'Inter, system-ui, sans-serif' },

    contentArea: {
      maxWidth: 1140, width:'100%', margin:'0 auto',
      padding:'28px 24px 60px', boxSizing:'border-box',
    },

    breadcrumb:    { display:'flex', alignItems:'center', gap:8, marginBottom:16, fontSize:13 },
    breadIcon:     { width:22, height:22, borderRadius:'50%', background:'#DE7356', display:'inline-flex', alignItems:'center', justifyContent:'center', marginRight:6, flexShrink:0, boxShadow:'0 2px 6px rgba(222,115,86,0.25)' },
    pageTitle:     { fontSize:28, fontWeight:700, color:'#2C221E', margin:'0 0 6px', fontFamily:"'Playfair Display', Georgia, serif" },
    pageSubtitle:  { fontSize:13.5, color:'#7A6F68', margin:'0 0 28px' },

    mainGrid: {
      display:'grid',
      gridTemplateColumns:'210px 1fr 240px',
      gap:22,
      alignItems:'stretch',
    },

    /* Sidebar */
    sidebar: {
      background:'#FFFFFF', borderRadius:16,
      border:'1px solid #EFE7DF',
      boxShadow:'0 2px 12px rgba(0,0,0,0.03)',
      padding:'14px 8px',
      display:'flex', flexDirection:'column',
      height:'100%', boxSizing:'border-box',
    },
    sidebarList: { display:'flex', flexDirection:'column', gap:2 },
    sidebarSpacer: { flex:1 },
    sidebarItem: (active, danger) => ({
      display:'flex', alignItems:'center', gap:10,
      width:'100%', padding:'8px 10px',
      background: active ? '#FDEEE9' : 'transparent',
      border:'none', borderRadius:8,
      cursor:'pointer', fontSize:13,
      color: danger ? '#C0392B' : active ? '#DE7356' : '#4A3F38',
      fontWeight: active ? 600 : 400,
      fontFamily:'Inter, system-ui, sans-serif',
      transition:'all 0.15s ease', textAlign:'left',
    }),

    /* Center — profile form card */
    formCard: {
      background:'#FFFFFF', borderRadius:16,
      border:'1px solid #EFE7DF', padding:'30px 32px',
      boxShadow:'0 2px 12px rgba(0,0,0,0.03)',
      display:'flex', flexDirection:'column',
    },

    sectionTitle: { fontSize:18, fontWeight:700, color:'#2C221E', margin:'0 0 22px', fontFamily:"'Playfair Display', Georgia, serif" },

    /* Avatar + form row */
    profileRow: { display:'flex', gap:32, alignItems:'flex-start', flexWrap:'wrap' },

    avatarBlock: { display:'flex', flexDirection:'column', alignItems:'center', width:110, flexShrink:0 },
    avatarWrap:  { position:'relative', width:110, height:110, cursor:'pointer', borderRadius:'50%' },
    avatarCircle: (hasImg) => ({
      width:110, height:110, borderRadius:'50%',
      overflow:'hidden',
      background: hasImg ? 'transparent' : '#F0E8E2',
      boxShadow:'0 4px 18px rgba(222,115,86,0.15)',
      border: hasImg ? '2.5px solid #DE7356' : '2.5px dashed #C8B8AE',
      display:'flex', alignItems:'center', justifyContent:'center',
    }),
    avatarImg: { width:'100%', height:'100%', objectFit:'cover' },
    placeholder: { display:'flex', flexDirection:'column', alignItems:'center', gap:5, color:'#A89890' },

    changePhotoText: {
      marginTop:10, fontSize:13, fontWeight:600, color:'#DE7356',
      background:'none', border:'none', cursor:'pointer', padding:0,
      fontFamily:'Inter, system-ui, sans-serif',
    },
    removePhotoText: {
      marginTop:4, fontSize:11.5, fontWeight:500, color:'#B0463A',
      background:'none', border:'none', cursor:'pointer', padding:0,
      fontFamily:'Inter, system-ui, sans-serif',
    },

    /* Form fields */
    formFields: { flex:'1 1 300px', display:'flex', flexDirection:'column', gap:16 },
    fieldGroup: { display:'flex', flexDirection:'column', gap:6 },
    fieldRow:   { display:'flex', gap:16 },
    label: { fontSize:12.5, fontWeight:600, color:'#4A3F38' },
    input: {
      width:'100%', padding:'10px 14px',
      border:'1.5px solid #EFE7DF', borderRadius:10,
      fontSize:14, color:'#2C221E', background:'#FEFCFA',
      fontFamily:'Inter, system-ui, sans-serif',
      boxSizing:'border-box', outline:'none',
    },
    select: {
      width:'100%', padding:'10px 14px',
      border:'1.5px solid #EFE7DF', borderRadius:10,
      fontSize:14, color:'#2C221E', background:'#FEFCFA',
      fontFamily:'Inter, system-ui, sans-serif',
      boxSizing:'border-box', outline:'none', cursor:'pointer',
    },

    saveBtn: {
      width:'100%', marginTop:8, padding:'13px',
      background:'#DE7356', color:'#FFFFFF',
      border:'none', borderRadius:10,
      fontSize:14.5, fontWeight:700, cursor:'pointer',
      fontFamily:'Inter, system-ui, sans-serif',
    },

    /* Right panel — two separate stacked cards */
    rightCol: { display:'flex', flexDirection:'column', gap:22, height:'100%', boxSizing:'border-box' },
    rightCard: {
      background:'#FFFFFF', borderRadius:16,
      border:'1px solid #EFE7DF',
      boxShadow:'0 2px 12px rgba(0,0,0,0.03)',
      padding:'18px 20px',
      flex:1, display:'flex', flexDirection:'column',
      boxSizing:'border-box',
    },
    rightCardList: { flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' },
    panelTitle: { fontSize:14, fontWeight:700, color:'#2C221E', margin:'0 0 12px', fontFamily:"'Playfair Display', Georgia, serif" },
    summaryRow: {
      display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'7px 0', fontSize:13, borderBottom:'1px solid #F5EDE5',
    },
    summaryLabel: { color:'#6E655F' },
    summaryValue: { fontWeight:700, color:'#2C221E' },
    quickBtn: {
      display:'flex', alignItems:'center', gap:10,
      width:'100%', padding:'9px 0',
      background:'none', border:'none',
      cursor:'pointer', fontSize:13, color:'#4A3F38',
      fontFamily:'Inter, system-ui, sans-serif', textAlign:'left',
      borderBottom:'1px solid #F5EDE5',
    },
  };

  /* ─── Profile Tab ────────────────────────────────── */
  const ProfileTab = () => (
    <div>
      <h2 style={S.sectionTitle}>Profile Information</h2>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileChange} />

      <div style={S.profileRow}>

        {/* Avatar block */}
        <div style={S.avatarBlock}>
          <div style={S.avatarWrap} onClick={() => fileRef.current?.click()}>
            <div style={S.avatarCircle(!!avatar)}>
              {avatar
                ? <img src={avatar} alt="Profile" style={S.avatarImg} />
                : (
                  <div style={S.placeholder}>
                    <Camera size={26} />
                  </div>
                )
              }
            </div>
          </div>
          <button style={S.changePhotoText} onClick={() => fileRef.current?.click()}>
            Change Photo
          </button>
          {avatar && (
            <button style={S.removePhotoText} onClick={handleRemoveAvatar}>
              <Trash2 size={11} style={{ marginRight:4, verticalAlign:'middle' }} />
              Remove
            </button>
          )}
        </div>

        {/* Form fields */}
        <div style={S.formFields}>

          <div style={S.fieldGroup}>
            <label style={S.label}>Full Name</label>
            <input
              style={S.input}
              type="text"
              value={formData.fullName}
              onChange={handleFieldChange('fullName')}
              placeholder="Your full name"
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Email Address</label>
            <input
              style={S.input}
              type="email"
              value={formData.email}
              onChange={handleFieldChange('email')}
              placeholder="you@example.com"
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Mobile Number</label>
            <input
              style={S.input}
              type="tel"
              value={formData.mobile}
              onChange={handleFieldChange('mobile')}
              placeholder="+91 XXXXXXXXXX"
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Date of Birth</label>
            <input
              style={S.input}
              type="date"
              value={formData.dob}
              onChange={handleFieldChange('dob')}
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Gender</label>
            <ShoppingSelect
              options={[
                { label: 'Select Gender', value: '' },
                { label: 'Female', value: 'Female' },
                { label: 'Male', value: 'Male' },
                { label: 'Other', value: 'Other' },
                { label: 'Prefer not to say', value: 'Prefer not to say' }
              ]}
              value={formData.gender}
              onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
              placeholder="Select Gender"
              className="user-profile-gender-select"
            />
          </div>

          <button style={S.saveBtn} onClick={handleSaveChanges} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>

        </div>
      </div>
    </div>
  );

  /* ─── Tab renderer ─── */
  const renderCenter = () => {
    switch (activeTab) {
      case 'addresses':     return <UserAddresses />;
      case 'payment':       return <UserPaymentMethods />;
      case 'settings':      return <UserSettings />;
      case 'notifications': return <UserNotifications />;
      case 'coupons':       return <UserCouponsTab />;
      case 'chat':          return <UserChatTab />;
      default:              return <ProfileTab />;
    }
  };

  /* ─── Render ─────────────────────────────────────── */
  return (
    <div style={S.page}>
      <CustomerShoppingHeader />

      <div style={S.contentArea}>

        {/* Breadcrumb */}
        <nav style={S.breadcrumb} aria-label="Breadcrumb">
          <span style={{ display:'inline-flex', alignItems:'center', color:'#2C221E', cursor:'pointer', fontWeight:500 }} onClick={() => navigate('/user/dashboard')}>
            <span style={S.breadIcon}><Home size={11} color="#FFF" /></span>
            Home
          </span>
          <ChevronRight size={13} color="#B0A8A0" />
          <span style={{ display:'inline-flex', alignItems:'center', color:'#7A6F68', fontWeight:500 }}>
            <span style={{...S.breadIcon, background:'#E8967F'}}><User size={11} color="#FFF" /></span>
            My Profile
          </span>
        </nav>

        <h1 style={S.pageTitle}>My Profile</h1>
        <p style={S.pageSubtitle}>Manage your account information and preferences</p>

        {/* 3-col grid */}
        <div style={S.mainGrid}>

          {/* LEFT — Sidebar */}
          <aside style={S.sidebar}>
            <div style={S.sidebarList}>
              {SIDEBAR_ITEMS.map(({ id, label, Icon, danger }) => {
                const isActive = activeTab === id && id !== 'logout';
                return (
                  <button key={id} style={S.sidebarItem(isActive, danger)} onClick={() => handleSidebarClick(id)}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Icon size={16} style={{ color: danger ? '#C0392B' : isActive ? '#DE7356' : '#7A6F68', flexShrink:0 }} />
                      {id === 'chat' && unreadChatCount > 0 && (
                        <span style={{
                          position: 'absolute', top: -3, right: -4,
                          width: 7, height: 7, borderRadius: '50%',
                          backgroundColor: '#DE7356', border: '1px solid #FFF'
                        }} />
                      )}
                    </div>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            <div style={S.sidebarSpacer} />
          </aside>

          {/* CENTER */}
          <section style={S.formCard}>{renderCenter()}</section>

          {/* RIGHT — two separate stacked cards */}
          <div style={S.rightCol}>

            <aside style={S.rightCard}>
              <h3 style={S.panelTitle}>Account Summary</h3>
              <div style={S.rightCardList}>
                {[
                  { label:'Total Orders',   value:12 },
                  { label:'Wishlist Items', value:18 },
                  { label:'Addresses',      value:2 },
                  { label:'Reward Points',  value:'250 pts' },
                  { label:'Wallet',         value:'₹450' },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} style={{ ...S.summaryRow, borderBottom: i === arr.length - 1 ? 'none' : '1px solid #F5EDE5' }}>
                    <span style={S.summaryLabel}>{label}</span>
                    <span style={S.summaryValue}>{value}</span>
                  </div>
                ))}
              </div>
            </aside>

            <aside style={S.rightCard}>
              <h3 style={S.panelTitle}>Quick Actions</h3>
              <div style={S.rightCardList}>
                {[
                  { label:'My Orders',        Icon:ShoppingBag, tab:null,         path:'/user/orders' },
                  { label:'Manage Addresses', Icon:MapPin,       tab:'addresses' },
                  { label:'Payment Methods',  Icon:CreditCard,   tab:'payment' },
                  { label:'Change Password',  Icon:Settings,     tab:'settings' },
                ].map(({ label, Icon, tab, path }, i, arr) => (
                  <button
                    key={label}
                    style={{ ...S.quickBtn, borderBottom: i === arr.length - 1 ? 'none' : '1px solid #F5EDE5' }}
                    onClick={() => path ? navigate(path) : setActiveTab(tab)}
                  >
                    <Icon size={15} color="#DE7356" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </aside>

          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;