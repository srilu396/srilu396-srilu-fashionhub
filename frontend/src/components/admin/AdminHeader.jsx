import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDrawer from './NotificationDrawer';
import { notificationAPI } from '../../utils/api';
import { 
  Bell, Sun, Moon 
} from 'lucide-react';

const AdminHeader = ({ onMobileToggle, title }) => {
  const { adminUser } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'dark');

  // Theme switch handler
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('adminTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Fetch Live Notifications
  const fetchNotifs = async () => {
    try {
      const data = await notificationAPI.getAll();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => ((n._id || n.id) === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking single notification read:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id);
      const target = notifications.find(n => (n._id || n.id) === id);
      setNotifications(prev => prev.filter(n => (n._id || n.id) !== id));
      if (target && !target.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      // Clear locally and mark all read on server
      await notificationAPI.markAllRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <button 
          onClick={onMobileToggle} 
          style={styles.mobileHamburger}
          aria-label="Toggle Navigation Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <h2 style={styles.pageTitle}>{title || 'Executive Overview'}</h2>
      </div>

      <div style={styles.rightSection}>
        {/* Live System Status Pill */}
        <div style={styles.statusPill}>
          <span style={styles.statusDot} />
          <span>Atelier Live</span>
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          style={styles.iconBtn}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={17} color="var(--admin-gold)" /> : <Moon size={17} color="var(--admin-text-primary)" />}
        </button>

        {/* Notification Bell Trigger & Enterprise Drawer */}
        <button 
          onClick={() => setNotificationsOpen(true)} 
          style={styles.iconBtn}
          aria-label="Open Notifications"
        >
          <Bell size={18} color="var(--admin-text-secondary)" />
          {unreadCount > 0 && <span style={styles.badgeDot} />}
        </button>

        <NotificationDrawer
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllRead}
          onMarkAsRead={handleMarkAsRead}
          onDeleteNotification={handleDeleteNotification}
          onClearAll={handleClearAll}
        />

        {/* Profile Avatar */}
        <Link to="/admin/profile" style={styles.profileBtn}>
          <div style={styles.headerAvatar}>
            {(adminUser?.firstName || 'A').charAt(0).toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  );
};

const styles = {
  header: {
    height: '70px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--admin-header-bg)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--admin-border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 32px 18px 32px',
    position: 'sticky',
    top: 0,
    zIndex: 80
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    minWidth: 'auto'
  },
  middleSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '0 24px'
  },
  mobileHamburger: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-primary)',
    cursor: 'pointer',
    padding: '4px'
  },
  pageTitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--admin-text-primary)',
    margin: 0,
    whiteSpace: 'nowrap'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    minWidth: 'max-content'
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    backgroundColor: 'var(--admin-success-bg, rgba(16, 185, 129, 0.1))',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '20px',
    fontSize: '11px',
    color: '#10B981',
    fontWeight: '500'
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10B981'
  },
  iconBtn: {
    background: 'none',
    border: '1px solid var(--admin-border-subtle)',
    backgroundColor: 'var(--admin-card-bg)',
    color: 'var(--admin-text-secondary)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'all 0.2s ease'
  },
  badgeDot: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '7px',
    height: '7px',
    backgroundColor: 'var(--admin-gold)',
    borderRadius: '50%'
  },
  notifDropdown: {
    position: 'absolute',
    right: 0,
    top: '48px',
    width: '320px',
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '12px',
    boxShadow: 'var(--admin-shadow-lg)',
    zIndex: 100,
    overflow: 'hidden'
  },
  notifHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--admin-border-subtle)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--admin-bg)'
  },
  notifTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--admin-text-primary)'
  },
  notifCount: {
    fontSize: '11px',
    color: 'var(--admin-text-muted)'
  },
  markReadBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-gold)',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  notifList: {
    maxHeight: '280px',
    overflowY: 'auto'
  },
  notifItem: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--admin-border-subtle)',
    display: 'flex',
    gap: '12px',
    textDecoration: 'none',
    transition: 'background-color 0.15s ease'
  },
  notifContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  notifItemTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--admin-text-primary)'
  },
  notifText: {
    fontSize: '11px',
    color: 'var(--admin-text-secondary)'
  },
  notifTime: {
    fontSize: '10px',
    color: 'var(--admin-text-muted)'
  },
  profileBtn: {
    textDecoration: 'none'
  },
  headerAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--admin-gold-muted)',
    color: 'var(--admin-gold)',
    border: '1px solid var(--admin-border-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '13px'
  }
};

export default AdminHeader;
