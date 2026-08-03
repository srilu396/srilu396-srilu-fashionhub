import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Bell, X, CheckCheck, Trash2, ShoppingBag, 
  Crown, UserCheck, AlertTriangle, MessageSquare 
} from 'lucide-react';

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Just now';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getGroupKey = (dateStr) => {
  if (!dateStr) return 'Today';
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= oneWeekAgo) return 'This Week';
  return 'Earlier';
};

const getNotifIcon = (type) => {
  switch (type) {
    case 'order':
      return <ShoppingBag size={16} color="#10B981" />;
    case 'vip':
      return <Crown size={16} color="var(--admin-gold, #D4AF37)" />;
    case 'customer':
      return <UserCheck size={16} color="#3B82F6" />;
    case 'inventory':
      return <AlertTriangle size={16} color="#F59E0B" />;
    case 'message':
    default:
      return <MessageSquare size={16} color="var(--admin-gold, #D4AF37)" />;
  }
};

const NotificationDrawer = ({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onMarkAsRead,
  onDeleteNotification,
  onClearAll
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Group notifications by Today, Yesterday, This Week, Earlier with memoization
  const groupedNotifs = useMemo(() => {
    return notifications.reduce((acc, notif) => {
      const group = getGroupKey(notif.createdAt);
      if (!acc[group]) acc[group] = [];
      acc[group].push(notif);
      return acc;
    }, {});
  }, [notifications]);

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <div style={styles.overlay} onClick={onClose}>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={styles.drawerPanel}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.headerLeft}>
                <div style={styles.bellIconCircle}>
                  <Bell size={18} color="var(--admin-gold, #D4AF37)" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={styles.title}>Notifications</h3>
                    {unreadCount > 0 && (
                      <span style={styles.unreadBadge}>{unreadCount} new</span>
                    )}
                  </div>
                  <span style={styles.subtitle}>Activity and live system alerts</span>
                </div>
              </div>

              <button onClick={onClose} style={styles.closeBtn} aria-label="Close notification center">
                <X size={18} />
              </button>
            </div>

            {/* Actions Bar */}
            <div style={styles.actionsBar}>
              {unreadCount > 0 ? (
                <button onClick={onMarkAllRead} style={styles.actionTextBtn}>
                  <CheckCheck size={14} /> Mark all as read
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted, #6B7280)' }}>
                  All notifications caught up
                </span>
              )}

              {notifications.length > 0 && (
                <button onClick={onClearAll} style={styles.clearAllBtn}>
                  <Trash2 size={13} /> Clear all
                </button>
              )}
            </div>

            {/* Body / List */}
            <div style={styles.bodyList}>
              {notifications.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <Bell size={36} color="var(--admin-border-gold, #D4AF37)" style={{ opacity: 0.5 }} />
                  <h4 style={styles.emptyTitle}>No notifications yet</h4>
                  <p style={styles.emptyDesc}>You're all set! Live system alerts will appear here in real time.</p>
                </div>
              ) : (
                groupOrder.map((group) => {
                  const items = groupedNotifs[group];
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={group} style={styles.groupSection}>
                      <div style={styles.groupHeader}>{group}</div>

                      <div style={styles.groupItems}>
                        {items.map((n) => (
                          <div
                            key={n._id || n.id}
                            onClick={() => !n.isRead && onMarkAsRead && onMarkAsRead(n._id || n.id)}
                            style={{
                              ...styles.cardItem,
                              backgroundColor: n.isRead
                                ? 'var(--admin-card-bg, #141419)'
                                : 'var(--admin-gold-muted, rgba(212, 175, 55, 0.08))',
                              borderLeft: n.isRead
                                ? '3px solid transparent'
                                : '3px solid var(--admin-gold, #D4AF37)'
                            }}
                          >
                            <div style={styles.cardIconWrapper}>
                              {getNotifIcon(n.type)}
                            </div>

                            <div style={styles.cardMain}>
                              <div style={styles.cardTitleRow}>
                                <span style={styles.cardTitle}>{n.title}</span>
                                <span style={styles.cardTime}>
                                  {formatRelativeTime(n.createdAt)}
                                </span>
                              </div>

                              <p style={styles.cardMessage}>{n.message}</p>

                              {n.link && (
                                <Link
                                  to={n.link}
                                  onClick={onClose}
                                  style={styles.cardLink}
                                >
                                  View details →
                                </Link>
                              )}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNotification && onDeleteNotification(n._id || n.id);
                              }}
                              style={styles.deleteItemBtn}
                              title="Delete notification"
                              aria-label="Delete notification"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={styles.footer}>
              <span style={styles.footerCount}>
                Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
              <button onClick={onClose} style={styles.footerCloseBtn}>
                Close Center
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(drawerContent, document.body);
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 'var(--z-modal, 9999)',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  drawerPanel: {
    height: '100vh',
    width: '420px',
    maxWidth: '90vw',
    backgroundColor: 'var(--admin-modal-bg)',
    color: 'var(--admin-text-primary)',
    borderLeft: '1px solid var(--admin-border-gold)',
    boxShadow: 'var(--admin-shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '18px 20px',
    backgroundColor: 'var(--admin-card-bg)',
    borderBottom: '1px solid var(--admin-border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  bellIconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '17px',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  unreadBadge: {
    backgroundColor: 'var(--admin-gold)',
    color: 'var(--active-pill-text)',
    fontSize: '9.5px',
    fontWeight: '800',
    padding: '2px 7px',
    borderRadius: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  subtitle: {
    fontSize: '11px',
    color: 'var(--admin-text-muted)',
    display: 'block',
    marginTop: '1px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-muted)',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionsBar: {
    padding: '10px 20px',
    backgroundColor: 'var(--admin-surface-2)',
    borderBottom: '1px solid var(--admin-border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  actionTextBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-gold)',
    fontSize: '11.5px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: 0
  },
  clearAllBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-muted)',
    fontSize: '11.5px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: 0
  },
  bodyList: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px 20px',
    textAlign: 'center'
  },
  emptyTitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '15px',
    color: 'var(--admin-text-primary)',
    margin: '10px 0 4px 0'
  },
  emptyDesc: {
    fontSize: '11.5px',
    color: 'var(--admin-text-muted)',
    maxWidth: '240px',
    margin: 0,
    lineHeight: '1.4'
  },
  groupSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  groupHeader: {
    fontSize: '10.5px',
    fontWeight: '700',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    color: 'var(--admin-gold)',
    opacity: 0.9,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  groupItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px'
  },
  cardItem: {
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-subtle)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    position: 'relative',
    transition: 'transform 0.15s ease, border-color 0.15s ease',
    cursor: 'pointer'
  },
  cardIconWrapper: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'var(--admin-gold-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '1px'
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px'
  },
  cardTitle: {
    fontSize: '12.5px',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    lineHeight: '1.3'
  },
  cardTime: {
    fontSize: '10.5px',
    color: 'var(--admin-text-muted)',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },
  cardMessage: {
    fontSize: '11.5px',
    color: 'var(--admin-text-secondary)',
    margin: 0,
    lineHeight: '1.35',
    wordBreak: 'break-word'
  },
  cardLink: {
    fontSize: '10.5px',
    color: 'var(--admin-gold)',
    fontWeight: '600',
    textDecoration: 'none',
    marginTop: '3px',
    display: 'inline-block'
  },
  deleteItemBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-muted)',
    cursor: 'pointer',
    padding: '3px',
    opacity: 0.5,
    transition: 'opacity 0.15s',
    marginTop: '-2px',
    marginRight: '-3px'
  },
  footer: {
    padding: '12px 20px',
    backgroundColor: 'var(--admin-card-bg)',
    borderTop: '1px solid var(--admin-border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  footerCount: {
    fontSize: '11.5px',
    color: 'var(--admin-text-muted)'
  },
  footerCloseBtn: {
    padding: '6px 14px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    color: 'var(--admin-text-primary)',
    borderRadius: '14px',
    fontSize: '11.5px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default NotificationDrawer;
