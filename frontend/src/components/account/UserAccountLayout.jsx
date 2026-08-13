import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, ShoppingBag, Heart, MapPin, CreditCard,
  Settings, Bell, LogOut, ChevronRight
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { id: 'profile',       label: 'My Profile',       Icon: User,       path: '/user/profile' },
  { id: 'orders',        label: 'My Orders',         Icon: ShoppingBag, path: '/user/orders' },
  { id: 'wishlist',      label: 'Wishlist',          Icon: Heart,       path: '/user/wishlist' },
  { id: 'addresses',     label: 'Addresses',         Icon: MapPin,      path: '/user/profile?tab=addresses' },
  { id: 'payment',       label: 'Payment Methods',   Icon: CreditCard,  path: '/user/profile?tab=payment' },
  { id: 'settings',      label: 'Account Settings',  Icon: Settings,    path: '/user/profile?tab=settings' },
  { id: 'notifications', label: 'Notifications',     Icon: Bell,        path: '/user/profile?tab=notifications' },
  { id: 'logout',        label: 'Logout',            Icon: LogOut,      danger: true },
];

const UserAccountLayout = ({ activeTab = 'wishlist', children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const loadUser = () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      const customAvatar = localStorage.getItem('userProfileAvatar');
      if (storedUser) {
        if (customAvatar) {
          storedUser.avatarUrl = customAvatar;
        }
        setUser(storedUser);
      }
    } catch (e) {
      console.error('Error reading user from localStorage', e);
    }
  };

  useEffect(() => {
    loadUser();
    const handleUpdate = () => loadUser();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('userProfileUpdated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('userProfileUpdated', handleUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userProfileAvatar');
    window.dispatchEvent(new Event('userProfileUpdated'));
    navigate('/user/login');
  };

  const handleSidebarClick = (item) => {
    if (item.id === 'logout') {
      handleLogout();
      return;
    }
    navigate(item.path);
  };

  const getUserDisplayName = () => {
    if (!user) return 'Valued Customer';
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.name || user.username || user.email || 'Valued Customer';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userAvatar = user?.avatarUrl || localStorage.getItem('userProfileAvatar');

  return (
    <div style={S.layoutContainer}>
      <style>{`
        @media (max-width: 880px) {
          .user-account-grid {
            grid-template-columns: 1fr !important;
          }
          .user-account-sidebar {
            width: 100% !important;
            margin-bottom: 20px;
          }
          .user-account-sidebar-list {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            padding-bottom: 6px;
            gap: 8px !important;
          }
          .user-account-sidebar-item {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            width: auto !important;
          }
        }
      `}</style>

      <div className="user-account-grid" style={S.mainGrid}>
        {/* Sidebar */}
        <aside className="user-account-sidebar" style={S.sidebar}>
          {/* User Badge */}
          <div style={S.userHeader}>
            <div style={S.avatarCircle}>
              {userAvatar ? (
                <img src={userAvatar} alt="User Avatar" style={S.avatarImg} />
              ) : (
                <span style={S.avatarInitials}>{getUserInitials()}</span>
              )}
            </div>
            <div style={S.userInfo}>
              <h4 style={S.userName}>{getUserDisplayName()}</h4>
              <p style={S.userEmail}>{user?.email || 'Member'}</p>
            </div>
          </div>

          <div style={S.divider} />

          {/* Nav List */}
          <div className="user-account-sidebar-list" style={S.sidebarList}>
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.Icon;
              return (
                <button
                  key={item.id}
                  className="user-account-sidebar-item"
                  style={S.sidebarItem(isActive, item.danger)}
                  onClick={() => handleSidebarClick(item)}
                  title={item.label}
                >
                  <Icon size={18} color={item.danger ? '#C0392B' : isActive ? '#DE7356' : '#7A6F68'} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <ChevronRight size={14} color="#DE7356" />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Main Content */}
        <main style={S.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

const S = {
  layoutContainer: {
    width: '100%',
    boxSizing: 'border-box',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '270px 1fr',
    gap: 22,
    alignItems: 'start',
  },
  sidebar: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #EFE7DF',
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
    padding: '20px 14px',
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content',
    alignSelf: 'start',
    boxSizing: 'border-box',
  },
  userHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 4px 14px 4px',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #DE7356 0%, #C85E42 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(222, 115, 86, 0.25)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: 700,
  },
  userInfo: {
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
  },
  userName: {
    margin: 0,
    fontSize: 14.5,
    fontWeight: 700,
    color: '#2C221E',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  userEmail: {
    margin: '2px 0 0',
    fontSize: 12.5,
    color: '#7A6F68',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  divider: {
    height: 1,
    background: '#EFE7DF',
    margin: '0 0 14px 0',
  },
  sidebarList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sidebarItem: (active, danger) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '11px 14px',
    background: active ? '#FDEEE9' : 'transparent',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    color: danger ? '#C0392B' : active ? '#DE7356' : '#4A3F38',
    fontWeight: active ? 600 : 400,
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'all 0.15s ease',
    textAlign: 'left',
    boxSizing: 'border-box',
  }),
  mainContent: {
    minWidth: 0,
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #EFE7DF',
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
    padding: '30px 32px',
    boxSizing: 'border-box',
  },
};

export default UserAccountLayout;