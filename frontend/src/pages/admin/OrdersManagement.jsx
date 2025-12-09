import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchAllOrders, 
  updateOrderStatus,
  cancelOrder 
} from '../../redux/slices/orderSlice';
import { 
  Search, Filter, Download, Eye, X, Check, Clock, 
  Package, Truck, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronUp, RefreshCw, MoreVertical,
  Calendar, DollarSign, User, MapPin, Phone,
  CreditCard, ShoppingBag, ExternalLink, Printer,
  BarChart3, TrendingUp, TrendingDown, Activity,
  Mail, Users as UsersIcon, Store, ShoppingCart,
  FileText, Archive, Award, Globe, Hash, Tag,
  BarChart2, PieChart, LineChart, Target
} from 'lucide-react';

// Helper function to format address
const formatAddress = (address) => {
  if (!address) return 'No address provided';
  
  if (typeof address === 'string') return address;
  
  if (typeof address === 'object') {
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    
    if (parts.length === 0 && address.address) {
      return address.address;
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Address available';
  }
  
  return 'No address provided';
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Helper function to get time ago
const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return formatDate(dateString);
  } catch (error) {
    return '';
  }
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    processing: { 
      label: 'Processing', 
      color: '#FFA726', 
      icon: <Package size={14} />,
      bgColor: '#FFA72620',
      borderColor: '#FFA726'
    },
    pending: { 
      label: 'Pending', 
      color: '#FFB74D', 
      icon: <Clock size={14} />,
      bgColor: '#FFB74D20',
      borderColor: '#FFB74D'
    },
    confirmed: { 
      label: 'Confirmed', 
      color: '#29B6F6', 
      icon: <Check size={14} />,
      bgColor: '#29B6F620',
      borderColor: '#29B6F6'
    },
    shipped: { 
      label: 'Shipped', 
      color: '#42A5F5', 
      icon: <Truck size={14} />,
      bgColor: '#42A5F520',
      borderColor: '#42A5F5'
    },
    delivered: { 
      label: 'Delivered', 
      color: '#4CAF50', 
      icon: <CheckCircle size={14} />,
      bgColor: '#4CAF5020',
      borderColor: '#4CAF50'
    },
    completed: { 
      label: 'Completed', 
      color: '#4CAF50', 
      icon: <CheckCircle size={14} />,
      bgColor: '#4CAF5020',
      borderColor: '#4CAF50'
    },
    cancelled: { 
      label: 'Cancelled', 
      color: '#EF5350', 
      icon: <XCircle size={14} />,
      bgColor: '#EF535020',
      borderColor: '#EF5350'
    },
    canceled: { 
      label: 'Cancelled', 
      color: '#EF5350', 
      icon: <XCircle size={14} />,
      bgColor: '#EF535020',
      borderColor: '#EF5350'
    }
  };

  const config = statusConfig[status?.toLowerCase()] || { 
    label: 'Unknown', 
    color: '#9E9E9E', 
    icon: <AlertCircle size={14} />,
    bgColor: '#9E9E9E20',
    borderColor: '#9E9E9E'
  };

  return (
    <span 
      className="status-badge"
      style={{ 
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        color: config.color
      }}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onStatusUpdate, onCancel }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleStatusUpdate = async (newStatus) => {
    if (!order?.orderId) return;
    
    setIsUpdating(true);
    try {
      await onStatusUpdate(order.orderId, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleCancel = async () => {
    if (!order?.orderId) return;
    
    if (window.confirm(`Are you sure you want to cancel order ${order.orderId}? This action cannot be undone.`)) {
      setIsUpdating(true);
      try {
        await onCancel(order.orderId);
      } finally {
        setIsUpdating(false);
      }
    }
  };
  
  if (!order) return null;
  
  const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  
  return (
    <div className="order-details-modal-overlay" onClick={onClose}>
      <div className="order-details-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>
              <Package size={24} />
              Order Details: {order.orderId ? `#${order.orderId}` : 'Unknown Order'}
            </h3>
            <span className="order-date">
              <Calendar size={14} />
              {formatDate(order.createdAt || order.orderDate)}
            </span>
          </div>
          <button className="close-button" onClick={onClose} disabled={isUpdating}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          {/* Order Status & Actions */}
          <div className="status-section">
            <div className="current-status">
              <h4>Current Status</h4>
              <div className="status-display">
                <StatusBadge status={order.status} />
                <span className="status-help">
                  {order.status === 'processing' && 'Order is being processed'}
                  {order.status === 'shipped' && 'Order has been shipped'}
                  {order.status === 'delivered' && 'Order has been delivered'}
                  {order.status === 'cancelled' && 'Order has been cancelled'}
                </span>
              </div>
            </div>
            <div className="status-actions">
              {!['cancelled', 'delivered', 'completed'].includes(order.status) && (
                <>
                  {order.status === 'processing' && (
                    <button 
                      className="status-action-btn shipped"
                      onClick={() => handleStatusUpdate('shipped')}
                      disabled={isUpdating}
                    >
                      <Truck size={18} />
                      Mark as Shipped
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button 
                      className="status-action-btn delivered"
                      onClick={() => handleStatusUpdate('delivered')}
                      disabled={isUpdating}
                    >
                      <CheckCircle size={18} />
                      Mark as Delivered
                    </button>
                  )}
                  <button 
                    className="status-action-btn cancel"
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    <XCircle size={18} />
                    Cancel Order
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="detail-section">
            <h4>
              <User size={20} />
              Customer Information
            </h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Customer Name:</span>
                <span className="value">
                  <User size={16} />
                  {order.userName || order.user?.name || 'Customer'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">
                  <Mail size={16} />
                  {order.userEmail || order.user?.email || 'No email'}
                </span>
              </div>
              {order.userPhone && (
                <div className="info-item">
                  <span className="label">Phone:</span>
                  <span className="value">
                    <Phone size={16} />
                    {order.userPhone}
                  </span>
                </div>
              )}
              <div className="info-item full-width">
                <span className="label">Shipping Address:</span>
                <span className="value">
                  <MapPin size={16} />
                  {formatAddress(order.shippingAddress || order.userAddress)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Order Items */}
          <div className="detail-section">
            <h4>
              <ShoppingBag size={20} />
              Order Items ({totalItems})
            </h4>
            <div className="items-list">
              {(order.items || []).map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-image">
                    {item.image || item.product?.image ? (
                      <img src={item.image || item.product?.image} alt={item.name} />
                    ) : (
                      <div className="image-placeholder">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div className="item-details">
                    <h5>{item.name || item.product?.name || `Product ${index + 1}`}</h5>
                    <div className="item-meta">
                      <span>Quantity: {item.quantity || 1}</span>
                      <span>Price: ${(item.price || item.product?.price || 0).toFixed(2)}</span>
                      {item.size && <span>Size: {item.size}</span>}
                      {item.color && <span>Color: {item.color}</span>}
                      {item.category && <span>Category: {item.category}</span>}
                    </div>
                  </div>
                  <div className="item-total">
                    ${((item.price || item.product?.price || 0) * (item.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="detail-section">
            <h4>
              <CreditCard size={20} />
              Order Summary
            </h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Subtotal:</span>
                <span className="value">${(order.subtotal || order.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0).toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span className="label">Shipping:</span>
                <span className="value">${(order.shippingFee || order.shipping || 0).toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span className="label">Tax:</span>
                <span className="value">${(order.tax || 0).toFixed(2)}</span>
              </div>
              {order.discount && order.discount > 0 && (
                <div className="summary-item">
                  <span className="label">Discount:</span>
                  <span className="value discount">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-item total">
                <span className="label">Total Amount:</span>
                <span className="value">${(order.totalAmount || order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Payment & Shipping Info */}
          <div className="detail-section">
            <h4>
              <Activity size={20} />
              Additional Information
            </h4>
            <div className="info-grid">
              {order.paymentMethod && (
                <div className="info-item">
                  <span className="label">Payment Method:</span>
                  <span className="value">{order.paymentMethod}</span>
                </div>
              )}
              {order.paymentStatus && (
                <div className="info-item">
                  <span className="label">Payment Status:</span>
                  <span className="value">
                    <StatusBadge status={order.paymentStatus} />
                  </span>
                </div>
              )}
              {order.trackingNumber && (
                <div className="info-item">
                  <span className="label">Tracking Number:</span>
                  <span className="value tracking-number">
                    <Hash size={16} />
                    {order.trackingNumber}
                  </span>
                </div>
              )}
              {order.notes && (
                <div className="info-item full-width">
                  <span className="label">Order Notes:</span>
                  <span className="value notes">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="secondary-btn" onClick={() => window.print()}>
            <Printer size={18} />
            Print Invoice
          </button>
          <button className="primary-btn" onClick={() => {
            // Navigate to customer profile
            const userId = order.userId || order.user?._id;
            if (userId) {
              localStorage.setItem('viewedCustomerId', userId);
              window.open(`/admin/customers/${userId}`, '_blank');
            }
          }}>
            <User size={18} />
            View Customer Profile
          </button>
          <button className="primary-btn" onClick={() => {
            // Send email to customer
            const email = order.userEmail || order.user?.email;
            if (email) {
              window.location.href = `mailto:${email}?subject=Order Update: ${order.orderId}`;
            }
          }}>
            <Mail size={18} />
            Contact Customer
          </button>
        </div>
      </div>
    </div>
  );
};

// Orders Management Main Component
const OrdersManagement = () => {
  const dispatch = useDispatch();
  const { allOrders: orders, loading, error, stats } = useSelector((state) => state.orders);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all orders on component mount
  useEffect(() => {
    console.log('🚀 OrdersManagement mounted, fetching all orders...');
    dispatch(fetchAllOrders());
  }, [dispatch]);

  // Set up auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing orders...');
      dispatch(fetchAllOrders());
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [dispatch]);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    
    return orders
      .filter(order => {
        // Search filter
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          (order.orderId && order.orderId.toLowerCase().includes(searchLower)) ||
          (order.userName && order.userName.toLowerCase().includes(searchLower)) ||
          (order.userEmail && order.userEmail.toLowerCase().includes(searchLower)) ||
          (order.user?.name && order.user.name.toLowerCase().includes(searchLower)) ||
          (order.user?.email && order.user.email.toLowerCase().includes(searchLower));
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || 
          order.status?.toLowerCase() === statusFilter.toLowerCase();
        
        // Date filter (simplified)
        const matchesDate = dateFilter === 'all' || true;
        
        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.orderDate || 0);
        const dateB = new Date(b.createdAt || b.orderDate || 0);
        const amountA = a.totalAmount || a.total || 0;
        const amountB = b.totalAmount || b.total || 0;
        
        switch (sortBy) {
          case 'date-desc':
            return dateB - dateA;
          case 'date-asc':
            return dateA - dateB;
          case 'amount-desc':
            return amountB - amountA;
          case 'amount-asc':
            return amountA - amountB;
          default:
            return dateB - dateA;
        }
      });
  }, [orders, searchTerm, statusFilter, dateFilter, sortBy]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchAllOrders()).unwrap();
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  // Handle order status update
  const handleStatusUpdate = useCallback(async (orderId, status) => {
    try {
      await dispatch(updateOrderStatus({ orderId, status })).unwrap();
      // Refresh orders after update
      dispatch(fetchAllOrders());
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status: ' + error.message);
    }
  }, [dispatch]);

  // Handle order cancellation
  const handleCancelOrder = useCallback(async (orderId) => {
    try {
      await dispatch(cancelOrder(orderId)).unwrap();
      // Refresh orders after cancellation
      dispatch(fetchAllOrders());
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order: ' + error.message);
    }
  }, [dispatch]);

  // Export orders to CSV
  const exportToCSV = useCallback(() => {
    const csvContent = [
      ['Order ID', 'Customer', 'Email', 'Date', 'Status', 'Items', 'Amount', 'Phone', 'Address'],
      ...filteredOrders.map(order => [
        order.orderId || 'N/A',
        order.userName || order.user?.name || 'Customer',
        order.userEmail || order.user?.email || 'N/A',
        formatDate(order.createdAt || order.orderDate),
        order.status || 'N/A',
        order.items?.length || 0,
        `$${(order.totalAmount || order.total || 0).toFixed(2)}`,
        order.userPhone || 'N/A',
        formatAddress(order.shippingAddress || order.userAddress)
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredOrders]);

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'processing', label: 'Processing' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'amount-desc', label: 'Highest Amount' },
    { value: 'amount-asc', label: 'Lowest Amount' }
  ];

  // Debug function to check localStorage
  const debugLocalStorage = useCallback(() => {
    console.log('🔍 Debugging localStorage...');
    const userOrdersCount = {};
    let totalOrders = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('userOrders_')) {
        try {
          const orders = JSON.parse(localStorage.getItem(key) || '[]');
          userOrdersCount[key] = orders.length;
          totalOrders += orders.length;
        } catch (e) {
          console.error(`Error parsing ${key}:`, e);
        }
      }
    }
    
    console.log('LocalStorage userOrders:', userOrdersCount);
    console.log('Total orders in localStorage:', totalOrders);
    console.log('Current adminToken:', localStorage.getItem('adminToken') ? 'Present' : 'Missing');
  }, []);

  return (
    <div className="orders-management">
      {/* CSS Styles */}
      <style jsx>{`
        .orders-management {
          min-height: 100vh;
          background: linear-gradient(135deg, 
            rgba(10, 10, 10, 0.95) 0%,
            rgba(28, 28, 28, 0.95) 50%,
            rgba(10, 10, 10, 0.95) 100%
          );
          padding: 2rem;
          position: relative;
          overflow-x: hidden;
          font-family: 'Playfair Display', 'Cormorant Garamond', serif;
          color: #F5F5F5;
        }

        /* Luxury Background */
        .luxury-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(75, 28, 47, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(1, 68, 33, 0.05) 0%, transparent 50%);
          z-index: 0;
        }

        /* Page Header */
        .page-header {
          position: relative;
          z-index: 2;
          margin-bottom: 3rem;
        }

        .page-title {
          color: #D4AF37;
          font-size: 3.2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          font-family: 'Cormorant Garamond', serif;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          background: linear-gradient(45deg, #D4AF37, #F7E7CE, #D4AF37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          color: rgba(245, 245, 245, 0.8);
          font-size: 1.2rem;
          margin: 0;
          font-style: italic;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }

        .stat-card {
          background: rgba(28, 28, 28, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.2rem;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          border-color: rgba(212, 175, 55, 0.3);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
          transition: left 0.6s ease;
        }

        .stat-card:hover::before {
          left: 100%;
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.2);
          color: #D4AF37;
        }

        .stat-content {
          flex: 1;
        }

        .stat-content h3 {
          margin: 0 0 0.5rem 0;
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.9rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #F5F5F5;
          margin-bottom: 0.3rem;
        }

        .stat-change {
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .stat-change.positive {
          color: #4CAF50;
        }

        .stat-change.negative {
          color: #ff6b6b;
        }

        /* Filters Section */
        .filters-section {
          background: rgba(28, 28, 28, 0.7);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          align-items: end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .filter-label {
          color: #D4AF37;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-input, .filter-select {
          padding: 0.8rem 1rem;
          background: rgba(245, 245, 245, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.25);
          border-radius: 12px;
          color: #F5F5F5;
          font-size: 1rem;
          font-family: 'Playfair Display', serif;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .filter-input:focus, .filter-select:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
          background: rgba(245, 245, 245, 0.12);
        }

        .search-input-wrapper {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #D4AF37;
        }

        .search-input-wrapper input {
          padding-left: 3rem;
          width: 100%;
        }

        .filter-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-button {
          padding: 0.8rem 1.5rem;
          background: linear-gradient(135deg, 
            rgba(212, 175, 55, 0.15) 0%,
            rgba(212, 175, 55, 0.05) 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          color: #D4AF37;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Playfair Display', serif;
          white-space: nowrap;
        }

        .filter-button:hover:not(:disabled) {
          background: linear-gradient(135deg, 
            rgba(212, 175, 55, 0.25) 0%,
            rgba(212, 175, 55, 0.15) 100%
          );
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(212, 175, 55, 0.2);
        }

        .filter-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .filter-button.secondary {
          background: rgba(1, 68, 33, 0.1);
          border: 1px solid rgba(1, 68, 33, 0.3);
          color: #4CAF50;
        }

        .filter-button.secondary:hover:not(:disabled) {
          background: rgba(1, 68, 33, 0.2);
        }

        .filter-button.danger {
          background: rgba(239, 83, 80, 0.1);
          border: 1px solid rgba(239, 83, 80, 0.3);
          color: #EF5350;
        }

        .filter-button.danger:hover:not(:disabled) {
          background: rgba(239, 83, 80, 0.2);
        }

        /* Loading Spinner Small */
        .loading-spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(212, 175, 55, 0.2);
          border-top: 2px solid #D4AF37;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Orders Table Container */
        .orders-table-container {
          background: linear-gradient(135deg, 
            rgba(28, 28, 28, 0.7) 0%,
            rgba(28, 28, 28, 0.9) 100%
          );
          backdrop-filter: blur(30px);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 25px;
          overflow: hidden;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        }

        .table-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
          background: linear-gradient(135deg, 
            rgba(75, 28, 47, 0.2) 0%,
            rgba(75, 28, 47, 0.1) 100%
          );
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .table-header h2 {
          color: #F5F5F5;
          font-size: 1.5rem;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .table-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .table-wrapper {
          overflow-x: auto;
          max-height: 600px;
          overflow-y: auto;
        }

        .orders-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 1000px;
        }

        .table-header-row {
          background: linear-gradient(135deg, 
            rgba(75, 28, 47, 0.3) 0%,
            rgba(75, 28, 47, 0.1) 100%
          );
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .table-header-cell {
          padding: 1.2rem 1.5rem;
          text-align: left;
          color: #D4AF37;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          border-bottom: 2px solid rgba(212, 175, 55, 0.2);
          white-space: nowrap;
          cursor: pointer;
          user-select: none;
        }

        .table-header-cell:hover {
          background: rgba(212, 175, 55, 0.05);
        }

        .table-row {
          background: rgba(28, 28, 28, 0.5);
          border-bottom: 1px solid rgba(212, 175, 55, 0.05);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          cursor: pointer;
        }

        .table-row:hover {
          background: rgba(212, 175, 55, 0.08);
          transform: translateX(5px);
        }

        .table-cell {
          padding: 1.2rem 1.5rem;
          color: #F5F5F5;
          font-size: 0.95rem;
          vertical-align: middle;
          white-space: nowrap;
        }

        /* Order ID Cell */
        .order-id-cell {
          font-family: monospace;
          font-weight: 600;
          color: #D4AF37;
        }

        /* Customer Cell */
        .customer-cell {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 200px;
        }

        .customer-name {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .customer-email {
          font-size: 0.85rem;
          color: rgba(245, 245, 245, 0.6);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Date Cell */
        .date-cell {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 180px;
        }

        .date-value {
          font-weight: 500;
        }

        .time-ago {
          font-size: 0.85rem;
          color: rgba(245, 245, 245, 0.5);
        }

        /* Amount Cell */
        .amount-cell {
          font-weight: 600;
          color: #D4AF37;
          font-size: 1.1rem;
          white-space: nowrap;
        }

        /* Items Cell */
        .items-cell {
          text-align: center;
          color: rgba(245, 245, 245, 0.8);
        }

        /* Actions Cell */
        .actions-cell {
          display: flex;
          gap: 0.5rem;
        }

        .action-button {
          padding: 0.5rem;
          border-radius: 10px;
          border: 1px solid rgba(212, 175, 55, 0.2);
          background: rgba(212, 175, 55, 0.05);
          color: #D4AF37;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-button:hover {
          background: rgba(212, 175, 55, 0.15);
          transform: translateY(-2px);
        }

        .action-button.view {
          color: #4CAF50;
          border-color: rgba(76, 175, 80, 0.2);
          background: rgba(76, 175, 80, 0.05);
        }

        .action-button.view:hover {
          background: rgba(76, 175, 80, 0.15);
        }

        .action-button.cancel {
          color: #ff6b6b;
          border-color: rgba(255, 107, 107, 0.2);
          background: rgba(255, 107, 107, 0.05);
        }

        .action-button.cancel:hover {
          background: rgba(255, 107, 107, 0.15);
        }

        /* Loading State */
        .loading-container {
          padding: 4rem 2rem;
          text-align: center;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(212, 175, 55, 0.2);
          border-top: 4px solid #D4AF37;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 2rem;
        }

        .loading-text {
          color: #D4AF37;
          font-size: 1.2rem;
        }

        /* No Data State */
        .no-data {
          padding: 4rem 2rem;
          text-align: center;
        }

        .no-data-icon {
          font-size: 4rem;
          opacity: 0.3;
          margin-bottom: 1.5rem;
        }

        .no-data h3 {
          color: #F5F5F5;
          margin-bottom: 0.5rem;
        }

        .no-data p {
          color: rgba(245, 245, 245, 0.6);
          margin: 0;
        }

        /* Order Details Modal */
        .order-details-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
          padding: 1rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .order-details-modal {
          background: linear-gradient(135deg, 
            rgba(28, 28, 28, 0.95) 0%,
            rgba(45, 45, 45, 0.95) 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 30px;
          width: 95%;
          max-width: 1200px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 
            0 40px 80px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(212, 175, 55, 0.2);
          animation: modalSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(60px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          padding: 2rem;
          background: linear-gradient(135deg, 
            rgba(75, 28, 47, 0.4) 0%,
            rgba(1, 68, 33, 0.3) 100%
          );
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
          overflow: hidden;
        }

        .modal-header-content {
          flex: 1;
        }

        .modal-header h3 {
          color: #F5F5F5;
          margin: 0 0 0.5rem 0;
          font-size: 1.8rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .order-date {
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .close-button {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D4AF37;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .close-button:hover:not(:disabled) {
          background: rgba(212, 175, 55, 0.2);
          transform: rotate(90deg);
        }

        .close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Status Section */
        .status-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          background: rgba(28, 28, 28, 0.6);
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
        }

        .current-status {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .current-status h4 {
          color: rgba(245, 245, 245, 0.7);
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .status-display {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .status-help {
          font-size: 0.85rem;
          color: rgba(245, 245, 245, 0.5);
          font-style: italic;
        }

        .status-actions {
          display: flex;
          gap: 1rem;
        }

        .status-action-btn {
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          border: 1px solid;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
        }

        .status-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .status-action-btn.shipped {
          background: rgba(66, 165, 245, 0.1);
          border-color: rgba(66, 165, 245, 0.3);
          color: #42A5F5;
        }

        .status-action-btn.shipped:hover:not(:disabled) {
          background: rgba(66, 165, 245, 0.2);
        }

        .status-action-btn.delivered {
          background: rgba(76, 175, 80, 0.1);
          border-color: rgba(76, 175, 80, 0.3);
          color: #4CAF50;
        }

        .status-action-btn.delivered:hover:not(:disabled) {
          background: rgba(76, 175, 80, 0.2);
        }

        .status-action-btn.cancel {
          background: rgba(239, 83, 80, 0.1);
          border-color: rgba(239, 83, 80, 0.3);
          color: #EF5350;
        }

        .status-action-btn.cancel:hover:not(:disabled) {
          background: rgba(239, 83, 80, 0.2);
        }

        /* Modal Body */
        .modal-body {
          padding: 2rem;
          overflow-y: auto;
          max-height: calc(90vh - 250px);
        }

        .detail-section {
          background: rgba(28, 28, 28, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 15px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .detail-section h4 {
          color: #D4AF37;
          margin: 0 0 1rem 0;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .info-item.full-width {
          grid-column: 1 / -1;
        }

        .info-item .label {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .info-item .value {
          color: #F5F5F5;
          font-size: 1rem;
          font-weight: 500;
          word-break: break-word;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .value.tracking-number, .value.notes {
          background: rgba(212, 175, 55, 0.05);
          padding: 0.5rem;
          border-radius: 8px;
          border: 1px solid rgba(212, 175, 55, 0.1);
          margin-top: 0.5rem;
        }

        .value.discount {
          color: #4CAF50;
        }

        /* Order Items */
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .order-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          border: 1px solid rgba(212, 175, 55, 0.1);
        }

        .item-image {
          width: 80px;
          height: 80px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid rgba(212, 175, 55, 0.2);
          background: rgba(212, 175, 55, 0.05);
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212, 175, 55, 0.1);
          color: #D4AF37;
        }

        .item-details {
          flex: 1;
        }

        .item-details h5 {
          margin: 0 0 0.5rem 0;
          color: #F5F5F5;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .item-meta {
          display: flex;
          gap: 1.5rem;
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.9rem;
          flex-wrap: wrap;
        }

        .item-meta span {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .item-total {
          font-weight: 700;
          color: #D4AF37;
          font-size: 1.2rem;
          min-width: 100px;
          text-align: right;
        }

        /* Summary Grid */
        .summary-grid {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          max-width: 400px;
          margin-left: auto;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 0;
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
        }

        .summary-item.total {
          border-bottom: none;
          padding-top: 1rem;
          border-top: 2px solid rgba(212, 175, 55, 0.3);
        }

        .summary-item.total .label {
          font-size: 1.2rem;
          font-weight: 600;
          color: #F5F5F5;
        }

        .summary-item.total .value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #D4AF37;
        }

        /* Modal Footer */
        .modal-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          background: rgba(28, 28, 28, 0.9);
        }

        .modal-footer button {
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          border: 1px solid;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modal-footer .secondary-btn {
          background: rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.3);
          color: #D4AF37;
        }

        .modal-footer .secondary-btn:hover {
          background: rgba(212, 175, 55, 0.2);
        }

        .modal-footer .primary-btn {
          background: linear-gradient(135deg, 
            rgba(212, 175, 55, 0.2) 0%,
            rgba(212, 175, 55, 0.1) 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.4);
          color: #D4AF37;
        }

        .modal-footer .primary-btn:hover {
          background: linear-gradient(135deg, 
            rgba(212, 175, 55, 0.3) 0%,
            rgba(212, 175, 55, 0.2) 100%
          );
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .order-details-modal {
            max-width: 95%;
          }
        }

        @media (max-width: 768px) {
          .orders-management {
            padding: 1rem;
          }

          .page-title {
            font-size: 2.5rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }

          .filter-actions {
            flex-direction: column;
          }

          .filter-button {
            width: 100%;
            justify-content: center;
          }

          .status-section {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .status-actions {
            flex-direction: column;
          }

          .table-header {
            flex-direction: column;
            text-align: center;
          }

          .table-actions {
            width: 100%;
            justify-content: center;
          }

          .modal-header {
            flex-direction: column;
            gap: 1rem;
          }

          .modal-body {
            padding: 1rem;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .order-item {
            flex-direction: column;
            text-align: center;
          }

          .item-total {
            text-align: center;
            min-width: auto;
          }

          .summary-grid {
            margin: 0;
          }

          .modal-footer {
            flex-direction: column;
          }

          .modal-footer button {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 2rem;
          }

          .stat-value {
            font-size: 1.8rem;
          }

          .table-header h2 {
            font-size: 1.2rem;
          }
        }
      `}</style>

      {/* Luxury Background */}
      <div className="luxury-background"></div>

      <div className="page-header">
        <h1 className="page-title">📦 Orders Management</h1>
        <p className="page-subtitle">
          Real-time view of ALL customer orders from your e-commerce store
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setStatusFilter('all')}>
          <div className="stat-icon" style={{ background: 'rgba(212, 175, 55, 0.15)' }}>
            <ShoppingBag size={28} />
          </div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-change positive">
              <UsersIcon size={16} />
              From {stats.customerCount || 0} customers
            </div>
          </div>
        </div>

        <div className="stat-card" onClick={() => setStatusFilter('processing')}>
          <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.15)' }}>
            <DollarSign size={28} />
          </div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <div className="stat-value">${(stats.totalRevenue || 0).toFixed(2)}</div>
            <div className="stat-change positive">
              <TrendingUp size={16} />
              Real-time tracking
            </div>
          </div>
        </div>

        <div className="stat-card" onClick={() => setStatusFilter('delivered')}>
          <div className="stat-icon" style={{ background: 'rgba(66, 165, 245, 0.15)' }}>
            <UsersIcon size={28} />
          </div>
          <div className="stat-content">
            <h3>Total Customers</h3>
            <div className="stat-value">{stats.customerCount || 0}</div>
            <div className="stat-change positive">
              <TrendingUp size={16} />
              Active users with orders
            </div>
          </div>
        </div>

        <div className="stat-card" onClick={() => setStatusFilter('processing')}>
          <div className="stat-icon" style={{ background: 'rgba(255, 167, 38, 0.15)' }}>
            <Clock size={28} />
          </div>
          <div className="stat-content">
            <h3>Processing</h3>
            <div className="stat-value">{stats.processing || 0}</div>
            <div className="stat-change negative">
              <AlertCircle size={16} />
              Needs attention
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">
              <Search size={16} />
              Search Orders
            </label>
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                className="filter-input"
                placeholder="Search by Order ID, Customer Name, or Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Filter size={16} />
              Filter by Status
            </label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <BarChart2 size={16} />
              Sort By
            </label>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button 
              className="filter-button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSortBy('date-desc');
              }}
            >
              <X size={18} />
              Clear Filters
            </button>
            <button 
              className="filter-button secondary"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
            >
              {loading || isRefreshing ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Refresh Now
                </>
              )}
            </button>
            <button 
              className="filter-button"
              onClick={exportToCSV}
              disabled={filteredOrders.length === 0}
            >
              <Download size={18} />
              Export CSV
            </button>
            <button 
              className="filter-button danger"
              onClick={debugLocalStorage}
              title="Debug localStorage"
            >
              🐛 Debug
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <div className="table-header">
          <h2>
            <Store size={24} />
            All Customer Orders ({filteredOrders.length})
            {stats.lastUpdated && (
              <span className="order-date" style={{ fontSize: '0.9rem', marginLeft: '1rem' }}>
                Last updated: {getTimeAgo(stats.lastUpdated)}
              </span>
            )}
          </h2>
          <div className="table-actions">
            <button 
              className="filter-button secondary"
              onClick={() => console.log('Viewing all orders from backend')}
              title="Connected to real backend data"
            >
              <Globe size={18} />
              Live Data
            </button>
          </div>
        </div>

        {loading && !isRefreshing ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading All Customer Orders...</div>
          </div>
        ) : error ? (
          <div className="no-data">
            <div className="no-data-icon">⚠️</div>
            <h3>Error Loading Orders</h3>
            <p>{error}</p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#D4AF37' }}>
              Make sure you're logged in as admin and backend is running
            </p>
            <div className="filter-actions" style={{ marginTop: '1rem', justifyContent: 'center' }}>
              <button 
                className="filter-button" 
                onClick={handleRefresh}
              >
                <RefreshCw size={18} />
                Try Again
              </button>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📦</div>
            <h3>No Orders Found</h3>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search filters' 
                : 'No orders have been placed yet. When customers place orders, they will appear here automatically.'}
            </p>
            <div className="filter-actions" style={{ marginTop: '1rem', justifyContent: 'center' }}>
              <button 
                className="filter-button" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                <X size={18} />
                Clear All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="orders-table">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell">Order ID</th>
                  <th className="table-header-cell">Customer</th>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Items</th>
                  <th className="table-header-cell">Amount</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.orderId || order._id} 
                    className="table-row"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="table-cell order-id-cell">
                      <Hash size={14} />
                      {order.orderId || order._id?.slice(-8) || 'Unknown'}
                    </td>
                    <td className="table-cell">
                      <div className="customer-cell">
                        <span className="customer-name">
                          <User size={14} />
                          {order.userName || order.user?.name || 'Customer'}
                        </span>
                        <span className="customer-email">
                          <Mail size={12} />
                          {order.userEmail || order.user?.email || 'No email'}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="date-cell">
                        <span className="date-value">
                          {formatDate(order.createdAt || order.orderDate)}
                        </span>
                        <span className="time-ago">
                          {getTimeAgo(order.createdAt || order.orderDate)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="table-cell items-cell">
                      <ShoppingCart size={14} />
                      {order.items?.length || 0} items
                    </td>
                    <td className="table-cell amount-cell">
                      <DollarSign size={14} />
                      ${(order.totalAmount || order.total || 0).toFixed(2)}
                    </td>
                    <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="actions-cell">
                        <button 
                          className="action-button view"
                          onClick={() => setSelectedOrder(order)}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {(order.status === 'processing' || order.status === 'pending') && (
                          <button 
                            className="action-button cancel"
                            onClick={() => handleCancelOrder(order.orderId || order._id)}
                            title="Cancel Order"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          onCancel={handleCancelOrder}
        />
      )}
    </div>
  );
};

export default OrdersManagement;