import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Products', path: '/admin/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Categories', path: '/admin/categories', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { label: 'Orders', path: '/admin/orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { label: 'Customers', path: '/admin/customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { label: 'Admins', path: '/admin/admins', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { label: 'Coupons', path: '/admin/coupons', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  { label: 'Messages', path: '/admin/messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { label: 'Analytics', path: '/admin/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
];

const AdminSidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { adminUser, logoutAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/login');
  };

  const adminName = adminUser?.firstName 
    ? `${adminUser.firstName} ${adminUser.lastName || ''}` 
    : adminUser?.username || 'Executive Admin';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)} 
          style={styles.mobileBackdrop} 
          aria-hidden="true" 
        />
      )}

      <aside style={{
        ...styles.sidebar,
        width: collapsed ? '72px' : '260px',
        transform: mobileOpen ? 'translateX(0)' : undefined,
      }}>
        {/* Brand Header */}
        <div style={styles.brandHeader}>
          <Logo 
            variant={collapsed ? 'mark' : 'full'}
            size={collapsed ? 'sm' : 'md'}
            subtitle="EXECUTIVE ADMIN"
            mode="gold"
            to="/admin/dashboard"
          />
          
          {/* Collapse Toggle Button */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            style={styles.collapseToggle}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={styles.navContainer}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                ...styles.navLink,
                backgroundColor: isActive ? 'var(--admin-sidebar-active)' : 'transparent',
                color: isActive ? 'var(--admin-gold)' : 'var(--admin-text-secondary)',
                borderLeft: isActive ? '3px solid var(--admin-gold)' : '3px solid transparent',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '12px 0' : '11px 16px',
              })}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0 }}>
                <path d={item.icon} />
              </svg>
              {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Quick Action Button */}
        {!collapsed && (
          <div style={styles.quickActionBox}>
            <NavLink to="/admin/new-product" style={styles.quickAddBtn}>
              + Create Product
            </NavLink>
          </div>
        )}

        {/* Footer User Section */}
        <div style={styles.userSection}>
          <NavLink to="/admin/profile" style={styles.profileLink} title="View Admin Profile">
            <div style={styles.avatarCircle}>
              {adminUser?.avatarUrl ? (
                <img
                  src={adminUser.avatarUrl}
                  alt={adminName}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                adminName.charAt(0).toUpperCase()
              )}
            </div>
            {!collapsed && (
              <div style={styles.userInfo}>
                <span style={styles.userName}>{adminName}</span>
                <span style={styles.userRole}>Admin Profile</span>
              </div>
            )}
          </NavLink>

          <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
};

const styles = {
  sidebar: {
    height: '100vh',
    position: 'sticky',
    top: 0,
    left: 0,
    backgroundColor: 'var(--admin-sidebar-bg)',
    borderRight: '1px solid var(--admin-border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transition: 'width 250ms cubic-bezier(0.16, 1, 0.3, 1), transform 250ms ease',
    boxSizing: 'border-box'
  },
  mobileBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 90
  },
  brandHeader: {
    height: '70px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    borderBottom: '1px solid var(--admin-border-subtle)'
  },
  brandLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none'
  },
  goldLogoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'var(--admin-gold-muted, rgba(212, 175, 55, 0.15))',
    border: '1px solid var(--admin-border-gold)',
    color: 'var(--admin-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontWeight: '700',
    fontSize: '20px',
    flexShrink: 0
  },
  brandTextWrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  brandTitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '2px',
    color: 'var(--admin-gold)'
  },
  brandSubtitle: {
    fontSize: '9px',
    letterSpacing: '1.5px',
    color: 'var(--admin-text-muted)'
  },
  collapseToggle: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-muted)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navContainer: {
    flex: 1,
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 150ms ease'
  },
  navLabel: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  quickActionBox: {
    padding: '0 16px 16px 16px'
  },
  quickAddBtn: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px',
    backgroundColor: 'var(--admin-gold)',
    color: 'var(--active-pill-text)',
    textAlign: 'center',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '12px',
    textDecoration: 'none',
    letterSpacing: '0.5px'
  },
  userSection: {
    height: '66px',
    borderTop: '1px solid var(--admin-border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px'
  },
  profileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    overflow: 'hidden'
  },
  avatarCircle: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: 'var(--admin-gold-muted)',
    color: 'var(--admin-gold)',
    border: '1px solid var(--admin-border-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '13px',
    flexShrink: 0
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  userName: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--admin-text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  userRole: {
    fontSize: '10px',
    color: 'var(--admin-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-muted)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 150ms ease'
  }
};

export default AdminSidebar;
