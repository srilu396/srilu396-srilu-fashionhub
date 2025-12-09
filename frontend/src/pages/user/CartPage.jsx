import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { 
  fetchCart, removeFromCart, updateCartQuantity, 
  clearCart, createOrder 
} from '../../redux/slices/cartSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  ShoppingBag, Trash2, ChevronLeft, Plus, Minus,
  Shield, Truck, Package, CreditCard, X,
  MapPin, Phone, FileText, Tag
} from 'lucide-react';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalItems, totalAmount, loading } = useSelector((state) => state.cart);
  const [orderLoading, setOrderLoading] = React.useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = React.useState(false);
  const [couponCode, setCouponCode] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState(null);
  const [couponLoading, setCouponLoading] = React.useState(false);
  const [couponError, setCouponError] = React.useState('');
  const [showCouponForm, setShowCouponForm] = React.useState(false);

  const [shippingDetails, setShippingDetails] = React.useState({
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      dispatch(removeFromCart(productId));
    } else {
      dispatch(updateCartQuantity({ productId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (productId) => {
    if (window.confirm('Remove this item from cart?')) {
      dispatch(removeFromCart(productId));
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Clear all items from cart?')) {
      dispatch(clearCart());
      if (user) {
  const userId = user._id || user.id;
  if (userId) {
    localStorage.setItem(`userCart_${userId}`, JSON.stringify([]));
  }
}
    }
  };

  // ADD THESE COUPON FUNCTIONS
const validateCoupon = async (code) => {
  try {
    setCouponLoading(true);
    setCouponError('');
    
    const token = localStorage.getItem('userToken');
    const response = await fetch(`http://localhost:5000/api/coupons/validate/${code}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      setAppliedCoupon(data.coupon);
      setCouponError('');
      alert(`Coupon "${code}" applied successfully!`);
      return true;
    } else {
      setAppliedCoupon(null);
      setCouponError(data.message || 'Invalid coupon code');
      return false;
    }
  } catch (error) {
    console.error('Error validating coupon:', error);
    setCouponError('Failed to validate coupon. Please try again.');
    setAppliedCoupon(null);
    return false;
  } finally {
    setCouponLoading(false);
  }
};

const handleApplyCoupon = async () => {
  if (!couponCode.trim()) {
    setCouponError('Please enter a coupon code');
    return;
  }

  const isValid = await validateCoupon(couponCode);
  if (isValid) {
    setCouponCode('');
    setShowCouponForm(false);
  }
};

const handleRemoveCoupon = () => {
  setAppliedCoupon(null);
  setCouponError('');
  alert('Coupon removed successfully');
};

const calculateDiscount = () => {
  if (!appliedCoupon) return 0;
  
  const subtotal = totalAmount;
  
  // Check minimum order value
  if (appliedCoupon.min_order_value && subtotal < appliedCoupon.min_order_value) {
    return 0;
  }

  // Check excluded categories
  if (appliedCoupon.excluded_categories && appliedCoupon.excluded_categories.length > 0) {
    const hasExcludedItems = items.some(item => 
      appliedCoupon.excluded_categories.includes(item.product.category)
    );
    if (hasExcludedItems) {
      return 0;
    }
  }

  // Calculate discount
  if (appliedCoupon.discount_type === 'percentage') {
    return (subtotal * appliedCoupon.discount_value) / 100;
  } else {
    return Math.min(appliedCoupon.discount_value, subtotal);
  }
};

const getFinalAmount = () => {
  const discount = calculateDiscount();
  const tax = totalAmount * 0.1;
  const shipping = 0; // Free shipping as per your code
  
  return totalAmount + tax + shipping - discount;
};

// Calculate savings from product discounts
const calculateProductSavings = () => {
  return items.reduce((total, item) => {
    const originalPrice = item.product.originalPrice || item.product.price;
    const discount = (originalPrice - item.product.price) * item.quantity;
    return total + (discount > 0 ? discount : 0);
  }, 0);
};

const productSavings = calculateProductSavings();
const couponDiscount = calculateDiscount();
const finalAmount = getFinalAmount();


const handleCheckout = async () => {
  if (items.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  const { address, city, postalCode, phone } = shippingDetails;
  if (!address || !city || !postalCode || !phone) {
    alert('Please fill in all required shipping details');
    return;
  }

  setOrderLoading(true);
  try {
    const discount = calculateDiscount();
    const tax = totalAmount * 0.1;
    
    const orderData = {
      orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      items: items.map(item => ({
        product: item.product._id || item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
        category: item.product.category,
        brand: item.product.brand,
        originalPrice: item.product.originalPrice || null,
      })),
      shippingAddress: shippingDetails,
      totalAmount: totalAmount,
      finalAmount: finalAmount,
      tax: tax,
      discount: productSavings + discount,
      coupon: appliedCoupon ? {
        code: appliedCoupon.coupon_code,
        type: appliedCoupon.discount_type,
        value: appliedCoupon.discount_value,
        discount: discount
      } : null,
      paymentMethod: 'credit_card',
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(), // Add this
      status: 'processing',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Apply coupon usage if coupon was used
    if (appliedCoupon) {
      try {
        const token = localStorage.getItem('userToken');
        await fetch(`http://localhost:5000/api/coupons/apply/${appliedCoupon.coupon_code}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Error applying coupon:', error);
        // Continue with order even if coupon application fails
      }
    }

    // ✅ FIXED: Save order to user-specific localStorage
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      const userId = user._id || user.id;
      if (userId) {
        // Add user info to order
        orderData.user = userId;
        orderData.userName = user.name || user.username || 'Customer';
        orderData.userEmail = user.email;
        
        // Save to user-specific key
        const userOrders = JSON.parse(localStorage.getItem(`userOrders_${userId}`) || '[]');
        userOrders.unshift(orderData);
        localStorage.setItem(`userOrders_${userId}`, JSON.stringify(userOrders));
        
        // Also save to shared key for compatibility
        const sharedOrders = JSON.parse(localStorage.getItem('luxuryOrders') || '[]');
        sharedOrders.unshift(orderData);
        localStorage.setItem('luxuryOrders', JSON.stringify(sharedOrders));
        
        console.log('✅ Order saved for user:', userId);
      } else {
        // Fallback if user doesn't have ID
        const existingOrders = JSON.parse(localStorage.getItem('luxuryOrders') || '[]');
        existingOrders.unshift(orderData);
        localStorage.setItem('luxuryOrders', JSON.stringify(existingOrders));
      }
    } else {
      // User not logged in
      const existingOrders = JSON.parse(localStorage.getItem('luxuryOrders') || '[]');
      existingOrders.unshift(orderData);
      localStorage.setItem('luxuryOrders', JSON.stringify(existingOrders));
    }

    // Clear user's cart from localStorage
    if (user) {
      const userId = user._id || user.id;
      if (userId) {
        localStorage.setItem(`userCart_${userId}`, JSON.stringify([]));
      }
    }

    // Simulate API call
    setTimeout(() => {
      let successMessage = `Order placed successfully!\nOrder ID: ${orderData.orderId}\nTotal: $${orderData.finalAmount.toFixed(2)}`;
      
      if (appliedCoupon) {
        successMessage += `\n\nCoupon Applied: ${appliedCoupon.coupon_code}`;
        if (appliedCoupon.discount_type === 'percentage') {
          successMessage += ` (${appliedCoupon.discount_value}% OFF)`;
        } else {
          successMessage += ` ($${appliedCoupon.discount_value} OFF)`;
        }
      }
      
      alert(successMessage);
      
      // Clear cart and coupon after successful order
      dispatch(clearCart());
      setAppliedCoupon(null);
      
      navigate('/user/orders', { 
        state: { 
          newOrder: orderData,
          showSuccess: true 
        } 
      });
      
      setOrderLoading(false);
      setShowCheckoutModal(false);
    }, 1500);

  } catch (error) {
    console.error('Checkout error:', error);
    alert('Failed to place order. Please try again.');
    setOrderLoading(false);
  }
};
  const calculateSavings = () => {
    return items.reduce((total, item) => {
      const originalPrice = item.product.originalPrice || item.product.price;
      const discount = (originalPrice - item.product.price) * item.quantity;
      return total + (discount > 0 ? discount : 0);
    }, 0);
  };

  const savings = calculateSavings();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="cart-page">
      <Header />
      
      <div className="cart-container">
        {/* Header */}
        <div className="cart-header">
          <button className="back-btn" onClick={() => navigate('/user/dashboard')}>
            <ChevronLeft size={20} />
            Back to Collections
          </button>
          <div className="header-content">
            <div className="header-icon">
              <ShoppingBag size={32} />
            </div>
            <div className="header-text">
              <h1 className="page-title">Your Luxury Collection</h1>
              <p className="page-subtitle">{totalItems} exquisite items awaiting checkout</p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <ShoppingBag size={80} />
            </div>
            <h2>Your Luxury Collection Awaits</h2>
            <p>Add timeless pieces to your cart</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/user/dashboard')}
            >
              Explore Collections
            </button>
          </div>
        ) : (
          <div className="cart-content">
            {/* Main Cart Section */}
            <div className="main-cart">
              <div className="cart-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <Package size={24} />
                    Selected Items
                  </h2>
                  <button 
                    className="clear-cart-btn"
                    onClick={handleClearCart}
                  >
                    <Trash2 size={18} />
                    Clear Collection
                  </button>
                </div>
                
                <div className="cart-items">
                  {items.map((item) => (
                    <div key={item.product._id || item.product.id} className="cart-item">
                      <div className="item-image-container">
                        <div className="item-image">
                          <img src={item.product.image} alt={item.product.name} />
                          {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                            <div className="discount-badge">
                              <Tag size={12} />
                              Save ${((item.product.originalPrice - item.product.price) * item.quantity).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="item-details">
                        <div className="item-info">
                          <div className="item-category">{item.product.category}</div>
                          <h3 className="item-name">{item.product.name}</h3>
                          <div className="item-meta">
                            <span className="item-brand">{item.product.brand}</span>
                            <span className="item-size">Size: {item.product.size || 'One Size'}</span>
                          </div>
                        </div>
                        
                        <div className="item-actions">
                          <div className="price-section">
                            <div className="current-price">${(item.product.price * item.quantity).toFixed(2)}</div>
                            {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                              <div className="original-price">
                                ${(item.product.originalPrice * item.quantity).toFixed(2)}
                              </div>
                            )}
                          </div>
                          
                          <div className="action-buttons">
                            <div className="quantity-control">
                              <button 
                                className="quantity-btn"
                                onClick={() => handleQuantityChange(item.product._id || item.product.id, item.quantity - 1)}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="quantity-value">{item.quantity}</span>
                              <button 
                                className="quantity-btn"
                                onClick={() => handleQuantityChange(item.product._id || item.product.id, item.quantity + 1)}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            
                            <button 
                              className="remove-btn"
                              onClick={() => handleRemoveItem(item.product._id || item.product.id)}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

{/* Order Summary */}
<div className="order-summary">
  <div className="summary-card">
    <h2 className="summary-title">Order Summary</h2>
    
    <div className="summary-content">
      {/* COUPON SECTION - ADD THIS */}
      <div className="coupon-section">
        {!appliedCoupon ? (
          <div className="coupon-input-group">
            <div className="coupon-input-wrapper">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponError('');
                }}
                placeholder="Enter coupon code"
                className="coupon-input"
                disabled={couponLoading}
              />
              {couponCode && (
                <button 
                  className="clear-coupon-btn"
                  onClick={() => {
                    setCouponCode('');
                    setCouponError('');
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <button 
              className="apply-coupon-btn"
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
            >
              {couponLoading ? 'Validating...' : 'Apply'}
            </button>
          </div>
        ) : (
          <div className="applied-coupon">
            <div className="coupon-success">
              <Tag size={16} />
              <div className="coupon-info">
                <span className="coupon-code">{appliedCoupon.coupon_code}</span>
                <span className="coupon-value">
                  {appliedCoupon.discount_type === 'percentage' 
                    ? `${appliedCoupon.discount_value}% OFF` 
                    : `$${appliedCoupon.discount_value} OFF`}
                </span>
              </div>
            </div>
            <button 
              className="remove-coupon-btn"
              onClick={handleRemoveCoupon}
            >
              Remove
            </button>
          </div>
        )}
        
        {couponError && (
          <div className="coupon-error">{couponError}</div>
        )}
        
        {!appliedCoupon && (
          <button 
            className="view-coupons-btn"
            onClick={() => navigate('/user/coupons')}
          >
            View Available Coupons
          </button>
        )}
      </div>
      
      <div className="summary-section">
        <div className="summary-row">
          <span className="label">Subtotal</span>
          <span className="value">${totalAmount.toFixed(2)}</span>
        </div>
        
        {productSavings > 0 && (
          <div className="summary-row discount">
            <span className="label">Product Discount</span>
            <span className="value">-${productSavings.toFixed(2)}</span>
          </div>
        )}
        
        {couponDiscount > 0 && (
          <div className="summary-row coupon-discount">
            <span className="label">
              Coupon Discount
              {appliedCoupon && (
                <span className="coupon-tag">
                  {appliedCoupon.coupon_code}
                </span>
              )}
            </span>
            <span className="value">-${couponDiscount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="summary-row">
          <span className="label">Shipping</span>
          <span className="value free">Complimentary</span>
        </div>
        
        <div className="summary-row">
          <span className="label">Tax & Duties</span>
          <span className="value">${(totalAmount * 0.1).toFixed(2)}</span>
        </div>
      </div>
      
      <div className="summary-divider"></div>
      
      <div className="total-section">
        <div className="summary-row total">
          <span className="label">Total Amount</span>
          <span className="total-value">
            ${finalAmount.toFixed(2)}
          </span>
        </div>
        <div className="total-note">Including all taxes and duties</div>
      </div>
      
      <div className="security-info">
        <div className="security-badge">
          <Shield size={16} />
          <span>Secure 256-bit SSL Encryption</span>
        </div>
        <div className="delivery-info">
          <Truck size={16} />
          <span>Express 2-3 Day Delivery • Luxury Packaging</span>
        </div>
      </div>
      
      <button 
        className="checkout-btn"
        onClick={() => setShowCheckoutModal(true)}
        disabled={orderLoading}
      >
        {orderLoading ? (
          <div className="spinner"></div>
        ) : (
          <>
            <CreditCard size={20} />
            Proceed to Secure Checkout
          </>
        )}
      </button>
    </div>
  </div>
</div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="modal-overlay">
          <div className="checkout-modal">
            <div className="modal-header">
              <div className="modal-title">
                <h2>Complete Your Purchase</h2>
                <p className="modal-subtitle">Final step to secure your luxury items</p>
              </div>
              <button 
                className="close-modal"
                onClick={() => setShowCheckoutModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid">
                {/* Order Review */}
                <div className="modal-section">
                  <h3 className="section-title">
                    <ShoppingBag size={20} />
                    Order Review
                  </h3>
                  <div className="review-items">
                    {items.slice(0, 3).map((item) => (
                      <div key={item.product._id} className="review-item">
                        <div className="review-image">
                          <img src={item.product.image} alt={item.product.name} />
                        </div>
                        <div className="review-details">
                          <span className="review-name">{item.product.name}</span>
                          <div className="review-meta">
                            <span className="review-qty">Qty: {item.quantity}</span>
                            <span className="review-category">{item.product.category}</span>
                          </div>
                        </div>
                        <span className="review-price">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="more-items">
                        +{items.length - 3} additional luxury items
                      </div>
                    )}
                  </div>
                  
                  <div className="total-review">
                    <div className="review-total">
                      <span>Total Amount:</span>
                      <span className="review-total-amount">
                        ${(totalAmount * 1.1).toFixed(2)}
                      </span>
                    </div>
                    <div className="review-note">Including all taxes and duties</div>
                  </div>
                </div>

                {/* Shipping Form */}
                <div className="modal-section">
                  <h3 className="section-title">
                    <MapPin size={20} />
                    Delivery Information
                  </h3>
                  <div className="shipping-form">
                    <div className="form-group">
                      <label>Luxury Delivery Address *</label>
                      <input
                        type="text"
                        value={shippingDetails.address}
                        onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                        placeholder="Enter your exclusive delivery address"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>City *</label>
                        <input
                          type="text"
                          value={shippingDetails.city}
                          onChange={(e) => setShippingDetails({...shippingDetails, city: e.target.value})}
                          placeholder="City"
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Postal Code *</label>
                        <input
                          type="text"
                          value={shippingDetails.postalCode}
                          onChange={(e) => setShippingDetails({...shippingDetails, postalCode: e.target.value})}
                          placeholder="Postal Code"
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>
                        <Phone size={16} />
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        value={shippingDetails.phone}
                        onChange={(e) => setShippingDetails({...shippingDetails, phone: e.target.value})}
                        placeholder="Your contact number"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>
                        <FileText size={16} />
                        Special Instructions
                      </label>
                      <textarea
                        value={shippingDetails.notes}
                        onChange={(e) => setShippingDetails({...shippingDetails, notes: e.target.value})}
                        placeholder="Any special delivery preferences or gift instructions"
                        rows="3"
                        className="form-textarea"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="footer-content">
                <div className="footer-security">
                  <Shield size={16} />
                  <span>Your payment is secured and encrypted</span>
                </div>
                <div className="footer-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowCheckoutModal(false)}
                  >
                    Continue Shopping
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleCheckout}
                    disabled={orderLoading}
                  >
                    {orderLoading ? 'Processing...' : 'Confirm & Pay'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Base Styles */
        .cart-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #F5F5F5;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .cart-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 2rem;
        }

        /* Header */
        .cart-header {
          margin-bottom: 3rem;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.2);
          color: #D4AF37;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 1.5rem;
        }

        .back-btn:hover {
          background: rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.4);
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

        /* Empty Cart */
        .empty-cart {
          text-align: center;
          padding: 6rem 2rem;
          background: rgba(28, 28, 28, 0.6);
          border-radius: 24px;
          border: 1px solid rgba(212, 175, 55, 0.15);
          backdrop-filter: blur(10px);
        }

        .empty-cart-icon {
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

        .empty-cart h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          color: #F5F5F5;
          margin-bottom: 0.5rem;
        }

        .empty-cart p {
          color: rgba(245, 245, 245, 0.7);
          margin-bottom: 2.5rem;
          font-size: 1.1rem;
        }

        /* Cart Content */
        .cart-content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 2.5rem;
        }

        /* Main Cart */
        .cart-section {
          background: rgba(28, 28, 28, 0.7);
          border-radius: 24px;
          padding: 2rem;
          border: 1px solid rgba(212, 175, 55, 0.1);
          backdrop-filter: blur(10px);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #F5F5F5;
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          margin: 0;
        }

        .clear-cart-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.3);
          color: #ff6b6b;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .clear-cart-btn:hover {
          background: rgba(255, 107, 107, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
        }

        /* Cart Items */
        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .cart-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1.5rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .cart-item:hover {
          border-color: rgba(212, 175, 55, 0.2);
          background: rgba(212, 175, 55, 0.02);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(212, 175, 55, 0.1);
        }

        .item-image-container {
          position: relative;
        }

        .item-image {
          width: 140px;
          height: 180px;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .cart-item:hover .item-image img {
          transform: scale(1.05);
        }

        .discount-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(45deg, #4B1C2F, #014421);
          color: #F7E7CE;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          z-index: 1;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .item-info {
          margin-bottom: 1rem;
        }

        .item-category {
          color: #D4AF37;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .item-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          color: #F5F5F5;
          margin: 0 0 0.75rem 0;
          line-height: 1.3;
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.9rem;
        }

        .item-brand {
          color: #D4AF37;
          font-weight: 500;
        }

        .item-actions {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .price-section {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .current-price {
          color: #F5F5F5;
          font-size: 1.6rem;
          font-weight: 700;
          font-family: 'Playfair Display', serif;
        }

        .original-price {
          color: rgba(245, 245, 245, 0.4);
          text-decoration: line-through;
          font-size: 1rem;
        }

        .action-buttons {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .quantity-control {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          padding: 0.5rem;
        }

        .quantity-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .quantity-btn:hover {
          background: rgba(212, 175, 55, 0.2);
          transform: scale(1.1);
        }

        .quantity-value {
          color: #F5F5F5;
          font-size: 1.1rem;
          font-weight: 600;
          min-width: 36px;
          text-align: center;
        }

        .remove-btn {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.2);
          color: rgba(255, 107, 107, 0.7);
          width: 44px;
          height: 44px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .remove-btn:hover {
          background: rgba(255, 107, 107, 0.2);
          border-color: rgba(255, 107, 107, 0.4);
          color: #ff6b6b;
          transform: scale(1.1);
        }

        /* Order Summary */
        .order-summary {
          position: sticky;
          top: 2rem;
          height: fit-content;
        }

        .summary-card {
          background: linear-gradient(135deg, 
            rgba(28, 28, 28, 0.95) 0%,
            rgba(45, 45, 45, 0.95) 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 24px;
          padding: 2rem;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        .summary-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          color: #F5F5F5;
          margin: 0 0 2rem 0;
          text-align: center;
          position: relative;
          padding-bottom: 1rem;
        }

        .summary-title:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 25%;
          right: 25%;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent, 
            #D4AF37, 
            transparent
          );
        }

        .summary-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
        }

        .summary-row .label {
          color: rgba(245, 245, 245, 0.8);
          font-size: 0.95rem;
        }

        .summary-row .value {
          color: #F5F5F5;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .summary-row.discount .value {
          color: #4CAF50;
        }

        .summary-row .value.free {
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

        .total-section {
          margin-top: 0.5rem;
        }

        .summary-row.total {
          margin-bottom: 0.5rem;
        }

        .summary-row.total .label {
          font-size: 1.2rem;
          font-weight: 600;
          color: #F5F5F5;
        }

        .total-value {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(45deg, #D4AF37, #F7E7CE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .total-note {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.85rem;
          text-align: right;
          margin-top: -0.5rem;
        }

        .security-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .security-badge,
        .delivery-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
        }

        .security-badge {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }

        .delivery-info {
          background: rgba(1, 68, 33, 0.1);
          border: 1px solid rgba(1, 68, 33, 0.2);
          color: rgba(245, 245, 245, 0.7);
        }

        .checkout-btn {
          width: 100%;
          padding: 1.25rem;
          background: linear-gradient(45deg, 
            #4B1C2F 0%,
            #014421 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 16px;
          color: #F7E7CE;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 1rem;
          position: relative;
          overflow: hidden;
        }

        .checkout-btn:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(212, 175, 55, 0.2), 
            transparent
          );
          transition: 0.5s;
        }

        .checkout-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(75, 28, 47, 0.4);
        }

        .checkout-btn:hover:not(:disabled):before {
          left: 100%;
        }

        .checkout-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(247, 231, 206, 0.2);
          border-top: 3px solid #F7E7CE;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Modal */
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

        .checkout-modal {
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

        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
        }

        .modal-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .review-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .review-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          border: 1px solid rgba(212, 175, 55, 0.1);
          transition: all 0.3s ease;
        }

        .review-item:hover {
          border-color: rgba(212, 175, 55, 0.2);
          background: rgba(212, 175, 55, 0.02);
        }

        .review-image {
          width: 70px;
          height: 70px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .review-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .review-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .review-name {
          color: #F5F5F5;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .review-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
          color: rgba(245, 245, 245, 0.6);
        }

        .review-price {
          color: #D4AF37;
          font-weight: 700;
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          white-space: nowrap;
        }

        .more-items {
          text-align: center;
          padding: 1rem;
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.9rem;
          background: rgba(212, 175, 55, 0.05);
          border-radius: 12px;
          border: 1px dashed rgba(212, 175, 55, 0.2);
        }

        .total-review {
          padding-top: 1.5rem;
          border-top: 1px solid rgba(212, 175, 55, 0.2);
        }

        .review-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.2rem;
          font-weight: 600;
          color: #F5F5F5;
          margin-bottom: 0.25rem;
        }

        .review-total-amount {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem;
          background: linear-gradient(45deg, #D4AF37, #F7E7CE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .review-note {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.85rem;
          text-align: right;
        }

        /* Shipping Form */
        .shipping-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(245, 245, 245, 0.9);
          font-size: 0.95rem;
          font-weight: 500;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .form-input,
        .form-textarea {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          padding: 0.9rem 1.25rem;
          color: #F5F5F5;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: rgba(245, 245, 245, 0.4);
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        /* Modal Footer */
        .modal-footer {
          padding: 1.5rem 2.5rem;
          border-top: 1px solid rgba(212, 175, 55, 0.2);
          background: rgba(28, 28, 28, 0.9);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-security {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.9rem;
        }

        .footer-actions {
          display: flex;
          gap: 1rem;
        }

        /* Buttons */
        .btn {
          padding: 1rem 2rem;
          border-radius: 14px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: linear-gradient(45deg, #D4AF37, #F7E7CE);
          color: #1C1C1C;
          font-weight: 700;
          border: 1px solid rgba(212, 175, 55, 0.3);
          min-width: 160px;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4);
        }

        .btn-secondary {
          background: rgba(75, 28, 47, 0.3);
          border: 1px solid rgba(75, 28, 47, 0.4);
          color: #F5F5F5;
          min-width: 160px;
        }

        .btn-secondary:hover {
          background: rgba(75, 28, 47, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(75, 28, 47, 0.3);
        }

        /* Animations */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

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
        @media (max-width: 1200px) {
          .cart-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          
          .order-summary {
            position: static;
          }
        }

        @media (max-width: 992px) {
          .modal-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          
          .footer-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
          
          .footer-actions {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .cart-container {
            padding: 1.5rem;
          }
          
          .page-title {
            font-size: 2rem;
          }
          
          .cart-item {
            grid-template-columns: 1fr;
            text-align: center;
          }
          
          .item-image {
            width: 100%;
            height: 240px;
          }
          
          .item-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 1.5rem;
          }
          
          .action-buttons {
            justify-content: space-between;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .modal-header,
          .modal-body,
          .modal-footer {
            padding: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
          
          .clear-cart-btn {
            justify-content: center;
          }
          
          .footer-actions {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
          }
        }

        /* COUPON STYLES */
.coupon-section {
  background: rgba(212, 175, 55, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.coupon-input-group {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.coupon-input-wrapper {
  position: relative;
  flex: 1;
}

.coupon-input {
  width: 100%;
  background: rgba(28, 28, 28, 0.6);
  border: 2px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  padding: 0.9rem 1rem;
  color: #F5F5F5;
  font-size: 0.95rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.coupon-input::placeholder {
  color: rgba(245, 245, 245, 0.4);
  letter-spacing: normal;
  font-family: inherit;
}

.coupon-input:focus {
  outline: none;
  border-color: #D4AF37;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.clear-coupon-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: rgba(245, 245, 245, 0.5);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  transition: color 0.2s ease;
}

.clear-coupon-btn:hover {
  color: #ff6b6b;
}

.apply-coupon-btn {
  background: linear-gradient(45deg, rgba(1, 68, 33, 0.8), rgba(76, 175, 80, 0.8));
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: #F5F5F5;
  padding: 0.9rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 100px;
}

.apply-coupon-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, rgba(1, 68, 33, 1), rgba(76, 175, 80, 1));
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
}

.apply-coupon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.applied-coupon {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(1, 68, 33, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.coupon-success {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.coupon-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.coupon-code {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #4CAF50;
  font-size: 1rem;
}

.coupon-value {
  color: rgba(245, 245, 245, 0.8);
  font-size: 0.9rem;
}

.remove-coupon-btn {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-coupon-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  transform: translateY(-2px);
}

.coupon-error {
  color: #ff6b6b;
  font-size: 0.85rem;
  text-align: center;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 107, 0.2);
}

.view-coupons-btn {
  width: 100%;
  background: transparent;
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: #D4AF37;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.view-coupons-btn:hover {
  background: rgba(212, 175, 55, 0.1);
  transform: translateY(-2px);
}

/* Update summary row for coupon discount */
.summary-row.coupon-discount {
  background: rgba(1, 68, 33, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
}

.summary-row.coupon-discount .label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4CAF50;
  font-weight: 600;
}

.coupon-tag {
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: #4CAF50;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}
      `}</style>
    </div>
  );
};

export default CartPage;