import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Search,
  Calendar,
  DollarSign,
  ShoppingBag,
  ChevronRight,
  Star,
  Shield,
  MapPin,
  Phone,
  FileText,
  Download,
  Eye,
  CreditCard // Added missing import
} from 'lucide-react';

const OrdersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load orders from localStorage - USER SPECIFIC
    const loadOrders = () => {
      try {
        // Get current user
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        let savedOrders = [];
        
        if (user) {
          // Get user-specific orders using the same key pattern as orderSlice
          const userId = user._id || user.id;
          if (userId) {
            savedOrders = JSON.parse(localStorage.getItem(`userOrders_${userId}`) || '[]');
          } else {
            // Fallback to old key if user doesn't have id
            savedOrders = JSON.parse(localStorage.getItem('luxuryOrders') || '[]');
          }
        } else {
          // No user logged in
          savedOrders = [];
        }
        
        setOrders(savedOrders);
        
        // Show success message if redirected from checkout
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

    loadOrders();
    
    // Listen for storage changes (in case orders are updated from other tabs)
    const handleStorageChange = (e) => {
      if (e.key?.startsWith('userOrders_')) {
        loadOrders();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.state]);

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    // Check if order.items exists and is an array
    const items = order.items || [];
    const orderId = order.orderId || order._id || '';
    
    const matchesSearch = 
      orderId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      items.some(item => 
        item && item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (order.status && order.status === statusFilter);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={20} className="text-green-500" />;
      case 'processing': return <Clock size={20} className="text-yellow-500" />;
      case 'shipped': return <Truck size={20} className="text-blue-500" />;
      case 'cancelled': return <XCircle size={20} className="text-red-500" />;
      default: return <Package size={20} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/20 text-green-500';
      case 'processing': return 'bg-yellow-500/20 text-yellow-500';
      case 'shipped': return 'bg-blue-500/20 text-blue-500';
      case 'cancelled': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleDownloadInvoice = (order) => {
    alert(`Downloading invoice for order ${order.orderId}`);
  };

  const handleTrackOrder = (order) => {
    alert(`Tracking for order ${order.orderId} would open here`);
  };

  const totalSpent = orders.reduce((sum, order) => {
    const amount = order.finalAmount || order.totalAmount || 0;
    return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
  }, 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="orders-page">
      <Header />
      
      <div className="orders-container">
        {/* Success Toast */}
        {showSuccess && location.state?.newOrder && (
          <div className="success-toast">
            <div className="toast-content">
              <CheckCircle size={24} />
              <div className="toast-text">
                <strong>Order Placed Successfully!</strong>
                <p>Your order #{location.state.newOrder.orderId} has been confirmed</p>
              </div>
            </div>
            <button 
              className="toast-close"
              onClick={() => setShowSuccess(false)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="orders-header">
          <div className="header-left">
            <button 
              className="back-btn"
              onClick={() => navigate('/user/dashboard')}
            >
              ← Back to Dashboard
            </button>
            <div className="header-content">
              <div className="header-icon">
                <ShoppingBag size={32} />
              </div>
              <div className="header-text">
                <h1 className="page-title">Your Orders</h1>
                <p className="page-subtitle">
                  {orders.length} orders • ${totalSpent.toFixed(2)} total spent
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <ShoppingBag size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{orders.length}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">${totalSpent.toFixed(2)}</div>
              <div className="stat-label">Total Spent</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {orders.filter(o => o.status === 'delivered').length}
              </div>
              <div className="stat-label">Delivered</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Truck size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {orders.filter(o => o.status === 'processing' || o.status === 'shipped').length}
              </div>
              <div className="stat-label">Active</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search orders or products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Orders
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'processing' ? 'active' : ''}`}
              onClick={() => setStatusFilter('processing')}
            >
              Processing
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'shipped' ? 'active' : ''}`}
              onClick={() => setStatusFilter('shipped')}
            >
              Shipped
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
              onClick={() => setStatusFilter('delivered')}
            >
              Delivered
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="empty-orders">
            <div className="empty-icon">
              <Package size={80} />
            </div>
            <h2>No Orders Found</h2>
            <p>{searchTerm || statusFilter !== 'all' 
              ? 'Try changing your search or filter' 
              : 'Start shopping to see your orders here'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/user/dashboard')}
              >
                Browse Collections
              </button>
            )}
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => {
              const orderId = order.orderId || order._id || `ORDER-${Math.random().toString(36).substr(2, 9)}`;
              const orderDate = order.orderDate || order.createdAt || new Date().toISOString();
              const items = order.items || [];
              const finalAmount = order.finalAmount || order.totalAmount || 0;
              
              return (
                <div key={orderId} className="order-card">
                  <div className="order-header">
                    <div className="order-id">
                      <span className="order-label">Order ID:</span>
                      <span className="order-value">{orderId}</span>
                    </div>
                    <div className={`status-badge ${getStatusColor(order.status || 'processing')}`}>
                      {getStatusIcon(order.status || 'processing')}
                      <span>{(order.status || 'processing').charAt(0).toUpperCase() + (order.status || 'processing').slice(1)}</span>
                    </div>
                  </div>
                  
                  <div className="order-content">
                    <div className="order-date">
                      <Calendar size={16} />
                      <span>Placed on {formatDate(orderDate)}</span>
                    </div>
                    
                    <div className="order-items">
                      <div className="items-preview">
                        {items.slice(0, 3).map((item, index) => (
                          <div key={index} className="item-preview">
                            {item && item.image ? (
                              <img src={item.image} alt={item.name || 'Item'} />
                            ) : (
                              <div className="placeholder-image">📦</div>
                            )}
                            {items.length > 3 && index === 2 && (
                              <div className="more-items">+{items.length - 3}</div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="items-count">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div className="order-total">
                      <div className="total-label">Total Amount</div>
                      <div className="total-value">
                        <DollarSign size={16} />
                        <span>{typeof finalAmount === 'number' ? finalAmount.toFixed(2) : parseFloat(finalAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-footer">
                    <button 
                      className="btn btn-outline"
                      onClick={() => handleViewOrderDetails(order)}
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                    
                    {(order.status === 'shipped' || order.status === 'delivered') && (
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleTrackOrder(order)}
                      >
                        <Truck size={16} />
                        Track Order
                      </button>
                    )}
                    
                    {order.status === 'delivered' && (
                      <button 
                        className="btn btn-outline"
                        onClick={() => handleDownloadInvoice(order)}
                      >
                        <Download size={16} />
                        Invoice
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="modal-overlay">
          <div className="order-details-modal">
            <div className="modal-header">
              <div className="modal-title">
                <h2>Order Details</h2>
                <p className="modal-subtitle">Order #{selectedOrder.orderId || selectedOrder._id}</p>
              </div>
              <button 
                className="close-modal"
                onClick={() => setShowOrderDetails(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {/* Order Summary */}
              <div className="modal-section">
                <h3 className="section-title">
                  <ShoppingBag size={20} />
                  Order Summary
                </h3>
                
                <div className="order-details-grid">
                  <div className="detail-row">
                    <span className="detail-label">Order Date</span>
                    <span className="detail-value">{formatDateTime(selectedOrder.orderDate || selectedOrder.createdAt)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Order Status</span>
                    <span className={`detail-value status ${getStatusColor(selectedOrder.status || 'processing')}`}>
                      {getStatusIcon(selectedOrder.status || 'processing')}
                      {(selectedOrder.status || 'processing').charAt(0).toUpperCase() + (selectedOrder.status || 'processing').slice(1)}
                    </span>
                  </div>
                  {selectedOrder.estimatedDelivery && (
                    <div className="detail-row">
                      <span className="detail-label">Estimated Delivery</span>
                      <span className="detail-value">{formatDate(selectedOrder.estimatedDelivery)}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Payment Method</span>
                    <span className="detail-value">
                      <CreditCard size={16} />
                      {selectedOrder.paymentMethod === 'credit_card' ? 'Credit Card' : 
                       selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                       selectedOrder.paymentMethod || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="modal-section">
                <h3 className="section-title">
                  <Package size={20} />
                  Order Items ({selectedOrder.items?.length || 0})
                </h3>
                
                <div className="items-list">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div key={index} className="item-detail">
                      <div className="item-image">
                        {item?.image ? (
                          <img src={item.image} alt={item.name || 'Item'} />
                        ) : (
                          <div className="placeholder-image-large">📦</div>
                        )}
                      </div>
                      <div className="item-info">
                        <h4 className="item-name">{item?.name || 'Unnamed Item'}</h4>
                        <div className="item-meta">
                          {item?.category && <span className="item-category">{item.category}</span>}
                          {item?.brand && <span className="item-brand">{item.brand}</span>}
                        </div>
                        <div className="item-quantity">Quantity: {item?.quantity || 1}</div>
                      </div>
                      <div className="item-price">
                        <div className="price-amount">
                          ${((item?.price || 0) * (item?.quantity || 1)).toFixed(2)}
                        </div>
                        {item?.originalPrice && item.originalPrice > (item.price || 0) && (
                          <div className="original-price">
                            ${((item.originalPrice || 0) * (item.quantity || 1)).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Details */}
              {selectedOrder.shippingAddress && (
                <div className="modal-section">
                  <h3 className="section-title">
                    <MapPin size={20} />
                    Shipping Details
                  </h3>
                  
                  <div className="shipping-details">
                    <div className="detail-row">
                      <span className="detail-label">Address</span>
                      <span className="detail-value">{selectedOrder.shippingAddress.address || 'Not specified'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">City</span>
                      <span className="detail-value">{selectedOrder.shippingAddress.city || 'Not specified'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Postal Code</span>
                      <span className="detail-value">{selectedOrder.shippingAddress.postalCode || 'Not specified'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">
                        <Phone size={16} />
                        {selectedOrder.shippingAddress.phone || 'Not specified'}
                      </span>
                    </div>
                    {selectedOrder.shippingAddress.notes && (
                      <div className="detail-row">
                        <span className="detail-label">Notes</span>
                        <span className="detail-value">
                          <FileText size={16} />
                          {selectedOrder.shippingAddress.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="modal-section">
                <h3 className="section-title">
                  <DollarSign size={20} />
                  Payment Summary
                </h3>
                
                <div className="payment-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${(selectedOrder.totalAmount || selectedOrder.finalAmount || 0).toFixed(2)}</span>
                  </div>
                  
                  {selectedOrder.discount > 0 && (
                    <div className="summary-row discount">
                      <span>Discount</span>
                      <span>-${(selectedOrder.discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span className="free">FREE</span>
                  </div>
                  
                  <div className="summary-row">
                    <span>Tax (10%)</span>
                    <span>${(selectedOrder.tax || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="summary-divider"></div>
                  
                  <div className="summary-row total">
                    <span>Total Paid</span>
                    <span className="total-amount">
                      ${(selectedOrder.finalAmount || selectedOrder.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowOrderDetails(false)}
              >
                Close
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleDownloadInvoice(selectedOrder)}
              >
                <Download size={16} />
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Base Styles */
        .orders-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #F5F5F5;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .orders-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        /* Success Toast */
        .success-toast {
          position: fixed;
          top: 100px;
          right: 2rem;
          background: linear-gradient(45deg, #014421, #4CAF50);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
          max-width: 400px;
          box-shadow: 0 10px 30px rgba(1, 68, 33, 0.3);
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .toast-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .toast-text strong {
          font-size: 1rem;
          font-weight: 700;
          color: #F7E7CE;
        }

        .toast-text p {
          font-size: 0.9rem;
          color: rgba(247, 231, 206, 0.8);
          margin: 0;
        }

        .toast-close {
          background: transparent;
          border: none;
          color: rgba(247, 231, 206, 0.8);
          cursor: pointer;
          font-size: 1.2rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .toast-close:hover {
          background: rgba(247, 231, 206, 0.1);
          color: #F7E7CE;
        }

        /* Header */
        .orders-header {
          margin-bottom: 2.5rem;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .back-btn {
          align-self: flex-start;
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.2);
          color: #D4AF37;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(212, 175, 55, 0.1);
          transform: translateX(-5px);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .header-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #D4AF37 0%, #F7E7CE 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1C1C1C;
        }

        .header-text {
          flex: 1;
        }

        .page-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(45deg, #F5F5F5, #D4AF37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
        }

        .page-subtitle {
          color: rgba(245, 245, 245, 0.7);
          font-size: 1rem;
          font-weight: 400;
          margin: 0;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          background: rgba(28, 28, 28, 0.7);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .stat-card:hover {
          border-color: rgba(212, 175, 55, 0.3);
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.1);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(75, 28, 47, 0.1));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D4AF37;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 700;
          color: #F5F5F5;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* Filters */
        .filters-section {
          background: rgba(28, 28, 28, 0.7);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          padding: 0.75rem 1.25rem;
          margin-bottom: 1.5rem;
        }

        .search-box svg {
          color: rgba(245, 245, 245, 0.5);
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #F5F5F5;
          font-size: 0.95rem;
          outline: none;
          font-family: inherit;
        }

        .search-input::placeholder {
          color: rgba(245, 245, 245, 0.4);
        }

        .filter-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          color: rgba(245, 245, 245, 0.8);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-btn:hover {
          background: rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.3);
        }

        .filter-btn.active {
          background: linear-gradient(45deg, #4B1C2F, #014421);
          border-color: rgba(212, 175, 55, 0.4);
          color: #F7E7CE;
          font-weight: 600;
        }

        /* Placeholder images */
        .placeholder-image {
          width: 100%;
          height: 100%;
          background: rgba(212, 175, 55, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: #D4AF37;
        }

        .placeholder-image-large {
          width: 100%;
          height: 100%;
          background: rgba(212, 175, 55, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: #D4AF37;
          border-radius: 12px;
        }

        /* Empty State */
        .empty-orders {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(28, 28, 28, 0.6);
          border-radius: 24px;
          border: 1px solid rgba(212, 175, 55, 0.15);
          backdrop-filter: blur(10px);
        }

        .empty-icon {
          width: 120px;
          height: 120px;
          margin: 0 auto 2rem;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(75, 28, 47, 0.1));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D4AF37;
        }

        .empty-orders h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          color: #F5F5F5;
          margin-bottom: 0.5rem;
        }

        .empty-orders p {
          color: rgba(245, 245, 245, 0.7);
          margin-bottom: 2.5rem;
          font-size: 1.1rem;
        }

        /* Orders Grid */
        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .order-card {
          background: rgba(28, 28, 28, 0.7);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .order-card:hover {
          border-color: rgba(212, 175, 55, 0.3);
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.1);
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .order-id {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .order-label {
          font-size: 0.85rem;
          color: rgba(245, 245, 245, 0.6);
          font-weight: 500;
        }

        .order-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #D4AF37;
          font-family: 'Playfair Display', serif;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .order-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .order-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.9rem;
        }

        .order-items {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .items-preview {
          display: flex;
          gap: 0.5rem;
        }

        .item-preview {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .item-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .more-items {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          color: #F5F5F5;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .items-count {
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .order-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
        }

        .total-label {
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .total-value {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: #D4AF37;
        }

        .order-footer {
          display: flex;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          flex: 1;
        }

        .btn-primary {
          background: linear-gradient(45deg, #4B1C2F, #014421);
          color: #F7E7CE;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(75, 28, 47, 0.3);
        }

        .btn-outline {
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
        }

        .btn-outline:hover {
          background: rgba(212, 175, 55, 0.1);
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: rgba(75, 28, 47, 0.3);
          border: 1px solid rgba(75, 28, 47, 0.4);
          color: #F5F5F5;
        }

        .btn-secondary:hover {
          background: rgba(75, 28, 47, 0.4);
          transform: translateY(-2px);
        }

        /* Order Details Modal */
        .modal-overlay {
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
          padding: 2rem;
          animation: fadeIn 0.3s ease-out;
        }

        .order-details-modal {
          background: linear-gradient(135deg, 
            rgba(28, 28, 28, 0.98) 0%,
            rgba(45, 45, 45, 0.98) 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 28px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(212, 175, 55, 0.2);
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 2rem 2.5rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
          background: linear-gradient(135deg, 
            rgba(75, 28, 47, 0.3) 0%,
            rgba(75, 28, 47, 0.1) 100%
          );
        }

        .modal-title h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          color: #F5F5F5;
          margin: 0 0 0.25rem 0;
          background: linear-gradient(45deg, #F5F5F5, #D4AF37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .modal-subtitle {
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.95rem;
          margin: 0;
        }

        .close-modal {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .close-modal:hover {
          background: rgba(212, 175, 55, 0.2);
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 2.5rem;
          overflow-y: auto;
          max-height: calc(90vh - 200px);
        }

        .modal-section {
          margin-bottom: 2rem;
        }

        .modal-section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #F5F5F5;
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem;
          margin: 0 0 1.5rem 0;
        }

        /* Order Details Grid */
        .order-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .detail-row {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-label {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .detail-value {
          color: #F5F5F5;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .detail-value.status {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          width: fit-content;
        }

        /* Items List */
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .item-detail {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1.25rem;
          align-items: center;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .item-detail:hover {
          border-color: rgba(212, 175, 55, 0.2);
          background: rgba(212, 175, 55, 0.02);
        }

        .item-image {
          width: 80px;
          height: 100px;
          border-radius: 12px;
          overflow: hidden;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .item-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          color: #F5F5F5;
          margin: 0;
        }

        .item-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
          color: rgba(245, 245, 245, 0.6);
        }

        .item-category {
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .item-brand {
          color: #D4AF37;
          font-weight: 500;
        }

        .item-quantity {
          color: rgba(245, 245, 245, 0.8);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .item-price {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .price-amount {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #D4AF37;
        }

        .original-price {
          color: rgba(245, 245, 245, 0.4);
          text-decoration: line-through;
          font-size: 0.9rem;
        }

        /* Shipping Details */
        .shipping-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
        }

        /* Payment Summary */
        .payment-summary {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          color: rgba(245, 245, 245, 0.8);
        }

        .summary-row.discount {
          color: #4CAF50;
        }

        .summary-row .free {
          color: #D4AF37;
          font-weight: 700;
        }

        .summary-divider {
          height: 1px;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(212, 175, 55, 0.3), 
            transparent
          );
          margin: 0.5rem 0;
        }

        .summary-row.total {
          font-size: 1.2rem;
          font-weight: 700;
          color: #F5F5F5;
          margin-top: 0.5rem;
        }

        .total-amount {
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          background: linear-gradient(45deg, #D4AF37, #F7E7CE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Modal Footer */
        .modal-footer {
          padding: 1.5rem 2.5rem;
          border-top: 1px solid rgba(212, 175, 55, 0.2);
          background: rgba(28, 28, 28, 0.9);
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .orders-container {
            padding: 1.5rem;
          }
          
          .page-title {
            font-size: 2rem;
          }
          
          .orders-grid {
            grid-template-columns: 1fr;
          }
          
          .order-header {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .status-badge {
            align-self: flex-start;
          }
          
          .order-footer {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
          }
          
          .modal-header,
          .modal-body,
          .modal-footer {
            padding: 1.5rem;
          }
          
          .item-detail {
            grid-template-columns: 1fr;
            text-align: center;
          }
          
          .item-image {
            margin: 0 auto;
          }
          
          .item-price {
            text-align: center;
          }
          
          .modal-footer {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .filter-buttons {
            flex-direction: column;
          }
          
          .filter-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default OrdersPage;