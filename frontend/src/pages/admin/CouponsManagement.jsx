import React, { useState, useEffect } from 'react';
import { couponAPI } from '../../utils/api';
import CouponModal from '../../components/CouponModal';

const CouponsManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [duplicatingCoupon, setDuplicatingCoupon] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    filterAndSortCoupons();
  }, [coupons, searchTerm, statusFilter, sortBy]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await couponAPI.getCoupons();
      // Ensure we always set coupons to an array
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      // Set empty array on error
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

const filterAndSortCoupons = () => {
  // Ensure coupons is always treated as an array
  if (!Array.isArray(coupons)) {
    setFilteredCoupons([]);
    return;
  }

  let filtered = coupons.filter(coupon => {
    if (!coupon || typeof coupon !== 'object') return false;
    
    const matchesSearch = coupon.coupon_code && 
      coupon.coupon_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && coupon.active_status) ||
      (statusFilter === 'inactive' && !coupon.active_status);
    
    return matchesSearch && matchesStatus;
  });

  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'created_at':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      case 'valid_until':
        return new Date(a.valid_until || 0) - new Date(b.valid_until || 0);
      case 'discount_value':
        return (b.discount_value || 0) - (a.discount_value || 0);
      case 'used_count':
        return (b.used_count || 0) - (a.used_count || 0);
      default:
        return 0;
    }
  });

  setFilteredCoupons(filtered);
};

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setShowModal(true);
  };

  const handleDuplicate = (coupon) => {
    const duplicated = {
      ...coupon,
      coupon_code: coupon.coupon_code + '_COPY',
      _id: undefined,
      created_at: undefined
    };
    setDuplicatingCoupon(duplicated);
    setShowModal(true);
  };

  const handleDelete = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await couponAPI.deleteCoupon(couponId);
        fetchCoupons();
      } catch (error) {
        console.error('Error deleting coupon:', error);
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setDuplicatingCoupon(null);
  };

  const handleModalSave = () => {
    fetchCoupons();
    handleModalClose();
  };

  const toggleCouponStatus = async (coupon) => {
    try {
      await couponAPI.updateCoupon(coupon._id, {
        ...coupon,
        active_status: !coupon.active_status
      });
      fetchCoupons();
    } catch (error) {
      console.error('Error updating coupon status:', error);
    }
  };

  const getStatusBadge = (coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.valid_until);
    
    if (!coupon.active_status) {
      return <span style={styles.statusBadgeInactive}>Inactive</span>;
    }
    
    if (now > validUntil) {
      return <span style={styles.statusBadgeExpired}>Expired</span>;
    }
    
    return <span style={styles.statusBadgeActive}>Active</span>;
  };

  const getUsagePercentage = (coupon) => {
    if (!coupon.usage_limit_total) return 0;
    return (coupon.used_count / coupon.usage_limit_total) * 100;
  };

  return (
    <div style={styles.container}>
      {/* Animated Background Elements */}
      <div style={styles.backgroundElements}>
        <div style={styles.floatingElement1}></div>
        <div style={styles.floatingElement2}></div>
        <div style={styles.floatingElement3}></div>
        <div style={styles.floatingElement4}></div>
        <div style={styles.particleContainer}>
          {[...Array(15)].map((_, i) => (
            <div key={i} style={styles.particle}></div>
          ))}
        </div>
      </div>
      
      <div style={styles.glassContainer}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            <span style={styles.emoji}>💰</span>
            <span style={styles.titleText}>Coupons Management</span>
          </h1>
          <p style={styles.subtitle}>Manage and track your promotional offers</p>
        </div>

        <div style={styles.controlsRow}>
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
              disabled={loading}
            />
            <span style={styles.searchIcon}>🔍</span>
          </div>

          <div style={styles.filterControls}>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.filterSelect}
              disabled={loading}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.filterSelect}
              disabled={loading}
            >
              <option value="created_at">Newest First</option>
              <option value="valid_until">Expiring Soon</option>
              <option value="discount_value">Highest Discount</option>
              <option value="used_count">Most Used</option>
            </select>
          </div>
        </div>

        <div style={styles.tableContainer}>
          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.loadingSpinner}></div>
              <p>Loading coupons...</p>
            </div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.tableHeaderCell}>Code</th>
                    <th style={styles.tableHeaderCell}>Discount</th>
                    <th style={styles.tableHeaderCell}>Status</th>
                    <th style={styles.tableHeaderCell}>Usage</th>
                    <th style={styles.tableHeaderCell}>Validity Period</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon, index) => (
                    <tr 
                      key={coupon._id} 
                      style={{
                        ...styles.tableRow,
                        animationDelay: `${index * 0.05}s`
                      }}
                    >
                      <td style={styles.tableCell}>
                        <span style={styles.codeText}>{coupon.coupon_code}</span>
                      </td>
                      
                      <td style={styles.tableCell}>
                        <div style={styles.discountValue}>
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%` 
                            : `$${coupon.discount_value}`
                          }
                        </div>
                        <div style={styles.discountType}>
                          {coupon.discount_type}
                        </div>
                      </td>
                      
                      <td style={styles.tableCell}>
                        <div style={styles.statusCell}>
                          {getStatusBadge(coupon)}
                          <button 
                            onClick={() => toggleCouponStatus(coupon)}
                            style={styles.statusToggle}
                            disabled={loading}
                          >
                            {coupon.active_status ? '⏸️' : '▶️'}
                          </button>
                        </div>
                      </td>
                      
                      <td style={styles.tableCell}>
                        <div style={styles.usageText}>
                          {coupon.used_count}
                          {coupon.usage_limit_total && ` / ${coupon.usage_limit_total}`}
                        </div>
                        {coupon.usage_limit_total && (
                          <div style={styles.usageBar}>
                            <div 
                              style={{
                                ...styles.usageFill,
                                width: `${getUsagePercentage(coupon)}%`
                              }}
                            ></div>
                          </div>
                        )}
                      </td>
                      
                      <td style={styles.tableCell}>
                        <div style={styles.validFrom}>
                          {new Date(coupon.valid_from).toLocaleDateString()}
                        </div>
                        <div style={styles.validUntil}>
                          to {new Date(coupon.valid_until).toLocaleDateString()}
                        </div>
                      </td>
                      
                      <td style={styles.tableCell}>
                        <div style={styles.actions}>
                          <button 
                            onClick={() => handleEdit(coupon)}
                            style={styles.actionButton}
                            disabled={loading}
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDuplicate(coupon)}
                            style={styles.actionButton}
                            disabled={loading}
                          >
                            📋
                          </button>
                          <button 
                            onClick={() => handleDelete(coupon._id)}
                            style={styles.actionButton}
                            disabled={loading}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCoupons.length === 0 && !loading && (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🎫</div>
                  <h3 style={styles.emptyTitle}>No coupons found</h3>
                  <p style={styles.emptyText}>Create your first coupon to get started!</p>
                </div>
              )}
            </>
          )}
        </div>

        {showModal && (
          <CouponModal
            coupon={editingCoupon || duplicatingCoupon}
            onClose={handleModalClose}
            onSave={handleModalSave}
            isEditing={!!editingCoupon}
          />
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 50%, #2d1b1b 100%)',
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  floatingElement1: {
    position: 'absolute',
    top: '10%',
    left: '5%',
    width: '200px',
    height: '200px',
    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'floatElement 8s ease-in-out infinite',
    filter: 'blur(20px)',
  },
  floatingElement2: {
    position: 'absolute',
    top: '60%',
    right: '10%',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(75, 28, 47, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'floatElement 12s ease-in-out infinite reverse',
    filter: 'blur(25px)',
  },
  floatingElement3: {
    position: 'absolute',
    bottom: '20%',
    left: '15%',
    width: '150px',
    height: '150px',
    background: 'radial-gradient(circle, rgba(1, 68, 33, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'floatElement 10s ease-in-out infinite 2s',
    filter: 'blur(15px)',
  },
  floatingElement4: {
    position: 'absolute',
    top: '30%',
    right: '20%',
    width: '100px',
    height: '100px',
    background: 'radial-gradient(circle, rgba(247, 231, 206, 0.05) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'floatElement 6s ease-in-out infinite 1s',
    filter: 'blur(10px)',
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 1px, transparent 1px)',
    backgroundSize: '50px 50px',
    animation: 'particleFloat 20s linear infinite',
    width: '2px',
    height: '2px',
  },
  glassContainer: {
    background: 'rgba(18, 18, 18, 0.75)',
    backdropFilter: 'blur(25px)',
    border: '1px solid rgba(212, 175, 55, 0.15)',
    borderRadius: '24px',
    padding: '2.5rem',
    maxWidth: '1400px',
    margin: '0 auto',
    boxShadow: `
      0 25px 50px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(212, 175, 55, 0.1),
      0 0 0 1px rgba(255, 255, 255, 0.05)
    `,
    position: 'relative',
    zIndex: 1,
    animation: 'glassEntrance 1s ease-out',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '3rem',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  },
  emoji: {
    fontSize: '2.5rem',
    animation: 'pulseGold 2s ease-in-out infinite',
  },
  titleText: {
    background: 'linear-gradient(45deg, #D4AF37, #F7E7CE, #D4AF37)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    backgroundSize: '200% 100%',
    animation: 'shimmer 3s ease-in-out infinite',
  },
  subtitle: {
    color: '#E5DCC3',
    fontSize: '1.2rem',
    opacity: '0.9',
    animation: 'fadeInUp 1s ease-out 0.3s both',
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
    gap: '1.5rem',
    animation: 'slideInUp 0.8s ease-out 0.5s both',
  },
  searchBox: {
    position: 'relative',
    flex: 1,
    maxWidth: '450px',
  },
  searchInput: {
    width: '100%',
    background: 'rgba(28, 28, 28, 0.8)',
    border: '2px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '16px',
    padding: '1rem 1rem 1rem 3.5rem',
    color: '#F5F5F5',
    fontSize: '1.1rem',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Playfair Display', serif",
  },
  searchIcon: {
    position: 'absolute',
    left: '1.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#D4AF37',
    fontSize: '1.2rem',
  },
  filterControls: {
    display: 'flex',
    gap: '1.5rem',
  },
  filterSelect: {
    background: 'rgba(28, 28, 28, 0.8)',
    border: '2px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    color: '#F5F5F5',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Playfair Display', serif",
    minWidth: '160px',
  },
  tableContainer: {
    background: 'rgba(28, 28, 28, 0.6)',
    borderRadius: '18px',
    border: '1px solid rgba(212, 175, 55, 0.15)',
    overflow: 'hidden',
    minHeight: '500px',
    backdropFilter: 'blur(10px)',
    animation: 'scaleIn 0.8s ease-out 0.7s both',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5rem 2rem',
    color: '#E5DCC3',
  },
  loadingSpinner: {
    width: '60px',
    height: '60px',
    border: '3px solid rgba(212, 175, 55, 0.3)',
    borderTop: '3px solid #D4AF37',
    borderRadius: '50%',
    animation: 'spin 1.5s linear infinite',
    marginBottom: '1.5rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    background: 'linear-gradient(135deg, rgba(1, 68, 33, 0.4), rgba(0, 31, 63, 0.4))',
    borderBottom: '2px solid rgba(212, 175, 55, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  tableHeaderCell: {
    padding: '1.75rem 1.5rem',
    color: '#D4AF37',
    fontWeight: '700',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: '0.95rem',
    fontFamily: "'Playfair Display', serif",
  },
  tableRow: {
    borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    animation: 'slideInRow 0.6s ease-out both',
  },
  tableCell: {
    padding: '1.75rem 1.5rem',
    color: '#E5DCC3',
    transition: 'all 0.3s ease',
  },
  codeText: {
    background: 'linear-gradient(45deg, #D4AF37, #F7E7CE)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: '700',
    fontSize: '1.15rem',
    fontFamily: "'Courier New', monospace",
    letterSpacing: '0.5px',
  },
  discountValue: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: "'Playfair Display', serif",
  },
  discountType: {
    fontSize: '0.85rem',
    color: '#E5DCC3',
    textTransform: 'capitalize',
    opacity: '0.8',
    fontStyle: 'italic',
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  statusBadgeActive: {
    padding: '0.5rem 1rem',
    borderRadius: '25px',
    fontSize: '0.85rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: 'rgba(1, 68, 33, 0.4)',
    color: '#4CAF50',
    border: '1px solid #4CAF50',
    backdropFilter: 'blur(10px)',
    animation: 'pulseGreen 2s ease-in-out infinite',
  },
  statusBadgeInactive: {
    padding: '0.5rem 1rem',
    borderRadius: '25px',
    fontSize: '0.85rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: 'rgba(117, 117, 117, 0.4)',
    color: '#9E9E9E',
    border: '1px solid #9E9E9E',
    backdropFilter: 'blur(10px)',
  },
  statusBadgeExpired: {
    padding: '0.5rem 1rem',
    borderRadius: '25px',
    fontSize: '0.85rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: 'rgba(244, 67, 54, 0.4)',
    color: '#F44336',
    border: '1px solid #F44336',
    backdropFilter: 'blur(10px)',
    animation: 'pulseRed 2s ease-in-out infinite',
  },
  statusToggle: {
    background: 'rgba(212, 175, 55, 0.1)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    cursor: 'pointer',
    fontSize: '1.1rem',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },
  usageText: {
    fontWeight: '700',
    marginBottom: '0.75rem',
    color: '#F5F5F5',
    fontSize: '1.1rem',
  },
  usageBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(245, 245, 245, 0.15)',
    borderRadius: '4px',
    overflow: 'hidden',
    backdropFilter: 'blur(5px)',
  },
  usageFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #D4AF37, #F7E7CE, #D4AF37)',
    backgroundSize: '200% 100%',
    borderRadius: '4px',
    transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
    animation: 'shimmer 2s ease-in-out infinite',
  },
  validFrom: {
    fontSize: '1rem',
    color: '#F5F5F5',
    fontWeight: '600',
  },
  validUntil: {
    fontSize: '0.9rem',
    color: '#E5DCC3',
    opacity: '0.8',
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
  },
  actionButton: {
    background: 'rgba(245, 245, 245, 0.08)',
    border: '1px solid rgba(212, 175, 55, 0.25)',
    borderRadius: '10px',
    padding: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: '1.1rem',
    backdropFilter: 'blur(10px)',
  },
  emptyState: {
    textAlign: 'center',
    padding: '5rem 2rem',
    color: '#E5DCC3',
    animation: 'fadeInScale 0.8s ease-out',
  },
  emptyIcon: {
    fontSize: '5rem',
    marginBottom: '1.5rem',
    opacity: '0.7',
    animation: 'bounceIn 2s ease-in-out infinite',
  },
  emptyTitle: {
    color: '#D4AF37',
    marginBottom: '1rem',
    fontSize: '2rem',
    fontFamily: "'Playfair Display', serif",
  },
  emptyText: {
    opacity: '0.8',
    fontSize: '1.1rem',
  },
};

// Enhanced CSS Animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes floatElement {
    0%, 100% {
      transform: translateY(0) rotate(0deg) scale(1);
      opacity: 0.6;
    }
    33% {
      transform: translateY(-30px) rotate(120deg) scale(1.1);
      opacity: 0.8;
    }
    66% {
      transform: translateY(20px) rotate(240deg) scale(0.9);
      opacity: 0.4;
    }
  }

  @keyframes particleFloat {
    0% {
      transform: translateY(100vh) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100px) rotate(360deg);
      opacity: 0;
    }
  }

  @keyframes glassEntrance {
    0% {
      opacity: 0;
      transform: scale(0.9) translateY(50px);
      backdrop-filter: blur(0px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
      backdrop-filter: blur(25px);
    }
  }

  @keyframes shimmer {
    0%, 100% {
      background-position: -200% 0;
    }
    50% {
      background-position: 200% 0;
    }
  }

  @keyframes pulseGold {
    0%, 100% {
      transform: scale(1) rotate(0deg);
      filter: brightness(1);
    }
    50% {
      transform: scale(1.1) rotate(5deg);
      filter: brightness(1.3);
    }
  }

  @keyframes pulseGreen {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
    }
  }

  @keyframes pulseRed {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
    }
  }

  @keyframes slideInRow {
    0% {
      opacity: 0;
      transform: translateX(100px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInUp {
    0% {
      opacity: 0;
      transform: translateY(50px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scaleIn {
    0% {
      opacity: 0;
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes fadeInScale {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes bounceIn {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Enhanced Interactive Effects */
  input:focus, select:focus {
    outline: none;
    border-color: #D4AF37 !important;
    box-shadow: 
      0 0 0 3px rgba(212, 175, 55, 0.2),
      0 10px 30px rgba(212, 175, 55, 0.3) !important;
    transform: translateY(-2px);
  }

  .table-row:hover {
    background: rgba(212, 175, 55, 0.08) !important;
    transform: translateX(8px) scale(1.01);
    border-left: 3px solid #D4AF37;
  }

  .status-toggle:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.3) !important;
    transform: scale(1.15) rotate(90deg);
    box-shadow: 0 5px 15px rgba(212, 175, 55, 0.4);
  }

  .action-button:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.1);
    box-shadow: 
      0 8px 25px rgba(212, 175, 55, 0.4),
      0 0 0 1px rgba(212, 175, 55, 0.1);
  }

  .action-button:nth-child(1):hover:not(:disabled) {
    background: rgba(33, 150, 243, 0.15) !important;
    border-color: #2196F3 !important;
  }

  .action-button:nth-child(2):hover:not(:disabled) {
    background: rgba(76, 175, 80, 0.15) !important;
    border-color: #4CAF50 !important;
  }

  .action-button:nth-child(3):hover:not(:disabled) {
    background: rgba(244, 67, 54, 0.15) !important;
    border-color: #F44336 !important;
  }

  /* Generate random particle positions */
  ${[...Array(15)].map((_, i) => `
    .particle:nth-child(${i + 1}) {
      left: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 20}s;
      animation-duration: ${15 + Math.random() * 15}s;
    }
  `).join('')}

  /* Responsive Design */
  @media (max-width: 1024px) {
    .table {
      display: block;
      overflow-x: auto;
    }
    
    .controls-row {
      flex-direction: column;
      align-items: stretch;
    }
    
    .search-box {
      max-width: none;
    }
    
    .filter-controls {
      justify-content: space-between;
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }
    
    .glass-container {
      padding: 1.5rem;
    }
    
    .table-header-cell,
    .table-cell {
      padding: 1.25rem 0.75rem;
    }
    
    .actions {
      flex-direction: column;
    }
    
    .title {
      font-size: 2.5rem;
      flex-direction: column;
      gap: 0.5rem;
    }
  }

  @media (max-width: 480px) {
    .title {
      font-size: 2rem;
    }
    
    .glass-container {
      padding: 1rem;
    }
    
    .filter-controls {
      flex-direction: column;
    }
    
    .filter-select {
      min-width: auto;
    }
  }
`;

document.head.appendChild(styleSheet);

export default CouponsManagement;