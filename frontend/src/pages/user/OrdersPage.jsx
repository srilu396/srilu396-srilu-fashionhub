import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomerShoppingHeader from '../../components/CustomerShoppingHeader';
import {
  Package, Truck, CheckCircle, Clock, XCircle, Search,
  ShoppingBag, ChevronRight, Star, MapPin, Phone,
  Download, Eye, CreditCard, Home, Sparkles, X, Map
} from 'lucide-react';
import { useToast } from '../../components/common/Toast/useToast';
import { resolveOrderStatus, getSimulatedTimeline } from '../../utils/orderUtils';
import './OrdersPage.css';

export default function OrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      let savedOrders = [];

      if (user) {
        const userId = user._id || user.id;
        if (userId) {
          savedOrders = JSON.parse(localStorage.getItem(`userOrders_${userId}`) || '[]');
        } else {
          savedOrders = JSON.parse(localStorage.getItem('luxuryOrders') || '[]');
        }
      }

      // Fetch orders from backend (merge with localStorage)
      try {
        const token = localStorage.getItem('userToken');
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        if (token) {
          const res = await fetch(`${API_BASE}/api/orders/myorders`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const backendOrders = Array.isArray(data) ? data : (data.orders || []);
            const localIds = new Set(savedOrders.map(o => o.orderId || o._id));
            const newFromBackend = backendOrders.filter(o => !localIds.has(o.orderId || o._id));
            savedOrders = [...newFromBackend, ...savedOrders];
          }
        }
      } catch (apiErr) {
        console.warn('Could not fetch orders from API, using localStorage:', apiErr.message);
      }

      setOrders(savedOrders);

      if (location.state?.showSuccess) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const handleStorageChange = (e) => {
      if (e.key?.startsWith('userOrders_')) {
        loadOrders();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location.state]);

  // Filter orders based on search & status using resolveOrderStatus
  const filteredOrders = orders.filter(order => {
    const items = order.items || [];
    const orderId = order.orderId || order._id || '';

    const matchesSearch =
      orderId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      items.some(item =>
        item && item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const resolvedStatus = resolveOrderStatus(order);
    const matchesStatus =
      statusFilter === 'all' ||
      resolvedStatus === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (order) => {
    const resolved = typeof order === 'string' ? order.toLowerCase() : resolveOrderStatus(order);
    switch (resolved) {
      case 'delivered':
        return {
          label: 'Delivered',
          icon: <CheckCircle size={12} color="#27AE60" />,
          className: 'order-status-pill delivered'
        };
      case 'out_for_delivery':
        return {
          label: 'Out for Delivery',
          icon: <Truck size={12} color="#E67E22" />,
          className: 'order-status-pill out-for-delivery'
        };
      case 'shipped':
        return {
          label: 'Shipped',
          icon: <Truck size={12} color="#2980B9" />,
          className: 'order-status-pill shipped'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: <XCircle size={12} color="#C0392B" />,
          className: 'order-status-pill cancelled'
        };
      case 'processing':
      default:
        return {
          label: 'Processing',
          icon: <Clock size={12} color="#D4AF37" />,
          className: 'order-status-pill processing'
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (_) {
      return 'N/A';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return 'N/A';
    }
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleDownloadInvoice = (order) => {
    const oId = order.orderId || order._id || 'Order';
    toast.info(`Invoice for Order #${oId} downloaded`, 'Invoice Downloaded');
  };

  const handleTrackOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const promptCancelOrder = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      setCancelling(true);
      const oId = orderToCancel._id || orderToCancel.orderId;

      // Update via backend API
      try {
        const token = localStorage.getItem('userToken');
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        if (token && oId) {
          await fetch(`${API_BASE}/api/orders/${oId}/cancel`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (apiErr) {
        console.warn('Backend cancel sync failed (updating locally):', apiErr.message);
      }

      // Update locally in localStorage
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const userId = user?._id || user?.id;

      const updateOrderList = (list) => {
        return list.map(o => {
          if (o._id === oId || o.orderId === orderToCancel.orderId) {
            return {
              ...o,
              status: 'cancelled',
              cancelledAt: new Date().toISOString()
            };
          }
          return o;
        });
      };

      if (userId) {
        const userOrders = JSON.parse(localStorage.getItem(`userOrders_${userId}`) || '[]');
        localStorage.setItem(`userOrders_${userId}`, JSON.stringify(updateOrderList(userOrders)));
      }
      const sharedOrders = JSON.parse(localStorage.getItem('luxuryOrders') || '[]');
      localStorage.setItem('luxuryOrders', JSON.stringify(updateOrderList(sharedOrders)));

      // Update state
      setOrders(prev => updateOrderList(prev));

      if (selectedOrder && (selectedOrder._id === oId || selectedOrder.orderId === orderToCancel.orderId)) {
        setSelectedOrder(prev => ({ ...prev, status: 'cancelled', cancelledAt: new Date().toISOString() }));
      }

      toast.info(`Order #${orderToCancel.orderId || oId} has been cancelled`, 'Order Cancelled');
      setShowCancelModal(false);
      setOrderToCancel(null);
    } catch (err) {
      console.error('Cancellation error:', err);
      toast.error('Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  // Stats calculation
  const totalSpent = orders.reduce((sum, order) => {
    const isCancelled = resolveOrderStatus(order) === 'cancelled';
    if (isCancelled) return sum;
    const amount = order.finalAmount || order.totalAmount || 0;
    return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
  }, 0);

  const activeOrdersCount = orders.filter(o => {
    const st = resolveOrderStatus(o);
    return ['processing', 'shipped', 'out_for_delivery'].includes(st);
  }).length;

  const deliveredOrdersCount = orders.filter(o => resolveOrderStatus(o) === 'delivered').length;

  return (
    <div className="orders-page">
      <CustomerShoppingHeader />

      <div className="orders-content-area">
        {/* Success Toast for Checkout */}
        {showSuccess && location.state?.newOrder && (
          <div className="orders-success-toast">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={22} color="#27AE60" />
              <div>
                <div style={{ fontWeight: 700, color: '#2C221E', fontSize: 14 }}>Order Placed Successfully!</div>
                <div style={{ fontSize: 13, color: '#7A6F68' }}>
                  Your order #{location.state.newOrder.orderId} has been confirmed.
                </div>
              </div>
            </div>
            <button className="toast-close-btn" onClick={() => setShowSuccess(false)}>
              <X size={16} color="#7A6F68" />
            </button>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="orders-breadcrumb" aria-label="Breadcrumb">
          <span className="bread-home-link" onClick={() => navigate('/user/dashboard')}>
            <span className="bread-icon-circle">
              <Home size={11} color="#FFF" />
            </span>
            Home
          </span>
          <ChevronRight size={13} color="#B0A8A0" />
          <span className="bread-active-link">
            <span className="bread-icon-circle" style={{ background: '#E8967F' }}>
              <Package size={11} color="#FFF" />
            </span>
            My Orders
          </span>
        </nav>

        {/* Page Header */}
        <div className="orders-header-block">
          <h1 className="orders-page-title">
            My Orders {orders.length > 0 && <span className="orders-item-count">({orders.length})</span>}
          </h1>
          <p className="orders-page-subtitle">Track, manage, and review all your luxury purchases in one place.</p>
        </div>

        {/* Stats Grid */}
        <div className="orders-stats-grid">
          <div className="orders-stat-card">
            <div className="orders-stat-icon" style={{ background: '#FDEEE9', color: '#DE7356' }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="orders-stat-value">{orders.length}</div>
              <div className="orders-stat-label">Total Orders</div>
            </div>
          </div>

          <div className="orders-stat-card">
            <div className="orders-stat-icon" style={{ background: '#FFF8E7', color: '#D4AF37' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div className="orders-stat-value">₹{Math.round(totalSpent).toLocaleString('en-IN')}</div>
              <div className="orders-stat-label">Total Spent</div>
            </div>
          </div>

          <div className="orders-stat-card">
            <div className="orders-stat-icon" style={{ background: '#E8F8F0', color: '#27AE60' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="orders-stat-value">{deliveredOrdersCount}</div>
              <div className="orders-stat-label">Delivered</div>
            </div>
          </div>

          <div className="orders-stat-card">
            <div className="orders-stat-icon" style={{ background: '#EBF5FF', color: '#2980B9' }}>
              <Truck size={20} />
            </div>
            <div>
              <div className="orders-stat-value">{activeOrdersCount}</div>
              <div className="orders-stat-label">Active Orders</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="orders-filter-bar">
          <div className="orders-search-box">
            <Search size={16} color="#7A6F68" />
            <input
              type="text"
              placeholder="Search orders by ID or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="orders-search-input"
            />
          </div>

          <div className="orders-filter-pills">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'processing', label: 'Processing' },
              { id: 'shipped', label: 'Shipped' },
              { id: 'out_for_delivery', label: 'Out for Delivery' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map(({ id, label }) => {
              const isActive = statusFilter === id;
              return (
                <button
                  key={id}
                  className={`orders-filter-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setStatusFilter(id)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#7A6F68' }}>
            Loading your orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty-card">
            <div className="orders-empty-icon-circle">
              <Package size={40} color="#DE7356" />
            </div>
            <h2 className="orders-empty-title">No Orders Found</h2>
            <p className="orders-empty-desc">
              {searchTerm || statusFilter !== 'all'
                ? 'No orders matched your search or status filter criteria.'
                : 'Explore our curated fashion collections and place your first order.'}
            </p>
            <button className="orders-explore-btn" onClick={() => navigate('/user/dashboard')}>
              <Sparkles size={16} style={{ marginRight: 8 }} />
              Explore Collection
            </button>
          </div>
        ) : (
          <div className="orders-grid-list">
            {filteredOrders.map((order) => {
              const orderId = order.orderId || order._id || `SRL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
              const orderDate = order.createdAt || order.orderDate || new Date().toISOString();
              const items = order.items || [];
              const finalAmount = order.finalAmount || order.totalAmount || 0;
              const resolvedStatus = resolveOrderStatus(order);
              const badge = getStatusBadge(resolvedStatus);

              const canCancel = ['processing', 'shipped'].includes(resolvedStatus);
              const isActiveOrder = ['processing', 'shipped', 'out_for_delivery'].includes(resolvedStatus);
              const isDelivered = resolvedStatus === 'delivered';

              return (
                <div key={orderId} className="order-luxury-card">
                  {/* Card Top Row */}
                  <div className="order-card-header">
                    <div>
                      <div className="order-card-id">Order #{orderId}</div>
                      <div className="order-card-date">Placed on {formatDate(orderDate)}</div>
                    </div>
                    <span className={badge.className}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>

                  {/* Items Preview */}
                  <div className="order-items-preview">
                    {items.map((item, idx) => {
                      const itemImage = item?.image || item?.product?.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80';
                      const itemPrice = Number(item?.price || item?.product?.price || 0);

                      return (
                        <div key={idx} className="order-item-row">
                          <img
                            src={itemImage}
                            alt={item?.name || 'Product'}
                            className="order-item-thumb"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="order-item-info">
                            <div className="order-item-name">{item?.name || 'Product'}</div>
                            <div className="order-item-meta">
                              Qty: {item?.quantity || 1} • {item?.category || 'Fashion'}
                            </div>
                          </div>
                          <div className="order-item-price">
                            ₹{(itemPrice * (item?.quantity || 1)).toLocaleString('en-IN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Bottom / Total & Actions */}
                  <div className="order-card-footer">
                    <div>
                      <span className="order-total-label">
                        {order.paymentMethod === 'cash_on_delivery' ? 'Amount Due (COD)' : 'Total Paid'}
                      </span>
                      <div className="order-total-val">₹{Math.round(finalAmount).toLocaleString('en-IN')}</div>
                    </div>

                    <div className="order-actions-group">
                      <button
                        className="order-btn-secondary"
                        onClick={() => handleViewOrderDetails(order)}
                      >
                        <Eye size={14} />
                        View Details
                      </button>

                      {isActiveOrder && (
                        <button
                          className="order-btn-primary"
                          onClick={() => handleTrackOrder(order)}
                        >
                          <Truck size={14} />
                          Track Lifecycle
                        </button>
                      )}

                      {canCancel && (
                        <button
                          className="order-btn-danger"
                          onClick={() => promptCancelOrder(order)}
                        >
                          <XCircle size={14} />
                          Cancel Order
                        </button>
                      )}

                      {isDelivered && (
                        <button
                          className="order-btn-outline"
                          onClick={() => handleDownloadInvoice(order)}
                        >
                          <Download size={14} />
                          Invoice
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && orderToCancel && (
        <div className="order-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="order-modal-container cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div>
                <h2 className="order-modal-title" style={{ color: '#C0392B' }}>Cancel Order</h2>
                <p className="order-modal-subtitle">Order #{orderToCancel.orderId || orderToCancel._id}</p>
              </div>
              <button className="order-modal-close" onClick={() => setShowCancelModal(false)}>
                <X size={18} color="#2C221E" />
              </button>
            </div>

            <div className="order-modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
              <XCircle size={44} color="#C0392B" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2C221E', margin: '0 0 8px' }}>
                Are you sure you want to cancel this order?
              </h3>
              <p style={{ fontSize: 13, color: '#7A6F68', margin: 0 }}>
                This action is permanent. Your order will stop delivery progression and move to the Cancelled section.
              </p>
            </div>

            <div className="order-modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
              <button
                className="order-btn-secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                className="order-btn-danger-solid"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS & VISUAL TRACKING MODAL */}
      {showOrderDetails && selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setShowOrderDetails(false)}>
          <div className="order-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div>
                <h2 className="order-modal-title">Order Details & Lifecycle Tracking</h2>
                <p className="order-modal-subtitle">Order #{selectedOrder.orderId || selectedOrder._id}</p>
              </div>
              <button className="order-modal-close" onClick={() => setShowOrderDetails(false)}>
                <X size={18} color="#2C221E" />
              </button>
            </div>

            <div className="order-modal-body">
              {/* Visual Order Lifecycle Timeline */}
              <div className="order-modal-section">
                <h3 className="order-section-heading">
                  <Truck size={16} color="#DE7356" />
                  Delivery Progression
                </h3>

                <div className="timeline-tracker">
                  {getSimulatedTimeline(selectedOrder).map((step, idx) => (
                    <div
                      key={step.id}
                      className={`timeline-step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''} ${step.isError ? 'error' : ''}`}
                    >
                      <div className="timeline-icon-node">
                        {step.isError ? (
                          <XCircle size={14} color="#FFF" />
                        ) : step.completed ? (
                          <CheckCircle size={14} color="#FFF" />
                        ) : (
                          <Clock size={12} color="#7A6F68" />
                        )}
                      </div>
                      <div className="timeline-info">
                        <div className="timeline-step-label">{step.label}</div>
                        <div className="timeline-step-date">{step.date}</div>
                      </div>
                      {idx < getSimulatedTimeline(selectedOrder).length - 1 && (
                        <div className={`timeline-connector ${step.completed ? 'filled' : ''}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Overview Section */}
              <div className="order-modal-section">
                <h3 className="order-section-heading">
                  <ShoppingBag size={16} color="#DE7356" />
                  Overview
                </h3>

                <div className="order-detail-grid">
                  <div className="order-detail-cell">
                    <span className="order-cell-label">Order Date</span>
                    <span className="order-cell-val">{formatDateTime(selectedOrder.createdAt || selectedOrder.orderDate)}</span>
                  </div>

                  <div className="order-detail-cell">
                    <span className="order-cell-label">Current Status</span>
                    <span className={getStatusBadge(selectedOrder).className}>
                      {getStatusBadge(selectedOrder).icon}
                      {getStatusBadge(selectedOrder).label}
                    </span>
                  </div>

                  <div className="order-detail-cell">
                    <span className="order-cell-label">Payment Method</span>
                    <span className="order-cell-val">
                      <CreditCard size={14} color="#7A6F68" style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {selectedOrder.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Demo Online Payment'}
                    </span>
                  </div>

                  <div className="order-detail-cell">
                    <span className="order-cell-label">Payment Status</span>
                    <span className="order-cell-val" style={{
                      color: selectedOrder.paymentStatus === 'successful' ? '#27AE60' : '#D4AF37',
                      fontWeight: 700
                    }}>
                      {selectedOrder.paymentStatus === 'successful' ? 'Successful' : 'Pending (On Delivery)'}
                    </span>
                  </div>

                  {selectedOrder.transactionId && (
                    <div className="order-detail-cell">
                      <span className="order-cell-label">Transaction ID</span>
                      <span className="order-cell-val">{selectedOrder.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Section */}
              <div className="order-modal-section">
                <h3 className="order-section-heading">
                  <Package size={16} color="#DE7356" />
                  Order Items ({selectedOrder.items?.length || 0})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(selectedOrder.items || []).map((item, idx) => {
                    const itemImage = item?.image || item?.product?.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80';
                    const price = Number(item?.price || item?.product?.price || 0);

                    return (
                      <div key={idx} className="order-modal-item-row">
                        <img
                          src={itemImage}
                          alt={item?.name || 'Item'}
                          className="order-modal-item-img"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80';
                          }}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2C221E' }}>{item?.name || 'Product'}</div>
                          <div style={{ fontSize: 12, color: '#7A6F68', marginTop: 2 }}>
                            {item?.category || 'Fashion'} {item?.brand ? `• ${item.brand}` : ''}
                          </div>
                          <div style={{ fontSize: 12, color: '#7A6F68' }}>Quantity: {item?.quantity || 1}</div>

                          <button
                            type="button"
                            className="order-rate-review-btn"
                            onClick={() => {
                              const pId = item?.product?._id || item?.product || item?.id;
                              if (pId) {
                                setShowOrderDetails(false);
                                navigate(`/product/${pId}`);
                              }
                            }}
                          >
                            <Star size={12} fill="#DE7356" color="#DE7356" />
                            Rate & Review Product
                          </button>
                        </div>

                        <div style={{ fontSize: 14, fontWeight: 700, color: '#2C221E' }}>
                          ₹{(price * (item?.quantity || 1)).toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping Address Section */}
              {selectedOrder.shippingAddress && (
                <div className="order-modal-section">
                  <h3 className="order-section-heading">
                    <MapPin size={16} color="#DE7356" />
                    Shipping Address
                  </h3>

                  <div className="order-detail-grid">
                    <div className="order-detail-cell">
                      <span className="order-cell-label">Recipient</span>
                      <span className="order-cell-val">{selectedOrder.shippingAddress.name || 'Customer'}</span>
                    </div>

                    <div className="order-detail-cell">
                      <span className="order-cell-label">Address</span>
                      <span className="order-cell-val">{selectedOrder.shippingAddress.address || 'N/A'}</span>
                    </div>

                    <div className="order-detail-cell">
                      <span className="order-cell-label">City / Postal Code</span>
                      <span className="order-cell-val">
                        {selectedOrder.shippingAddress.city || ''} {selectedOrder.shippingAddress.postalCode ? `- ${selectedOrder.shippingAddress.postalCode}` : ''}
                      </span>
                    </div>

                    <div className="order-detail-cell">
                      <span className="order-cell-label">Contact Phone</span>
                      <span className="order-cell-val">
                        <Phone size={13} color="#7A6F68" style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {selectedOrder.shippingAddress.phone || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Summary Section */}
              <div className="order-modal-section">
                <h3 className="order-section-heading">
                  <CreditCard size={16} color="#DE7356" />
                  Payment Summary
                </h3>

                <div className="order-payment-box">
                  <div className="order-summary-row">
                    <span style={{ color: '#7A6F68' }}>Subtotal</span>
                    <span style={{ color: '#2C221E', fontWeight: 600 }}>
                      ₹{Math.round(selectedOrder.subtotal || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {selectedOrder.discount > 0 && (
                    <div className="order-summary-row">
                      <span style={{ color: '#7A6F68' }}>Discount Applied</span>
                      <span style={{ color: '#27AE60', fontWeight: 600 }}>
                        -₹{Math.round(selectedOrder.discount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="order-summary-row">
                    <span style={{ color: '#7A6F68' }}>Shipping</span>
                    <span style={{ color: '#27AE60', fontWeight: 700 }}>FREE</span>
                  </div>

                  <div className="order-summary-row">
                    <span style={{ color: '#7A6F68' }}>Tax (10%)</span>
                    <span style={{ color: '#2C221E', fontWeight: 600 }}>
                      ₹{Math.round(selectedOrder.tax || ((selectedOrder.subtotal || 0) * 0.1)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div style={{ height: 1, background: '#EFE7DF', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#2C221E' }}>
                      {selectedOrder.paymentMethod === 'cash_on_delivery' ? 'Amount Due' : 'Total Paid'}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#DE7356' }}>
                      ₹{Math.round(selectedOrder.finalAmount || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="order-modal-footer">
              <button className="order-btn-secondary" onClick={() => setShowOrderDetails(false)}>
                Close
              </button>

              {['processing', 'shipped'].includes(resolveOrderStatus(selectedOrder)) && (
                <button
                  className="order-btn-danger"
                  onClick={() => {
                    setShowOrderDetails(false);
                    promptCancelOrder(selectedOrder);
                  }}
                >
                  <XCircle size={14} />
                  Cancel Order
                </button>
              )}

              <button className="order-btn-primary" onClick={() => handleDownloadInvoice(selectedOrder)}>
                <Download size={14} />
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}