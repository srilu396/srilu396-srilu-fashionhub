import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import CustomerShoppingHeader from '../../components/CustomerShoppingHeader';
import { 
  fetchCart, removeFromCart, updateCartQuantity, 
  clearCart
} from '../../redux/slices/cartSlice';
import { useToast } from '../../components/common/Toast/useToast';
import { useAuth } from '../../context/AuthContext';
import { 
  ShoppingBag, Trash2, ChevronRight, Plus, Minus,
  Shield, Truck, Package, CreditCard, X,
  MapPin, Phone, FileText, Tag, Crown, Home, Sparkles
} from 'lucide-react';
import { calculateOrderTotals } from '../../utils/orderUtils';

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { items = [], totalItems = 0, totalAmount = 0, loading = false } = useSelector((state) => state.cart || {});

  const [orderLoading, setOrderLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [shippingDetails, setShippingDetails] = useState({
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

  const handleRemoveItem = (productId, productName) => {
    dispatch(removeFromCart(productId));
    toast.info(`"${productName || 'Item'}" removed from cart`);
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    if (user) {
      const userId = user._id || user.id;
      if (userId) {
        localStorage.setItem(`userCart_${userId}`, JSON.stringify([]));
      }
    }
    toast.info('Cart cleared');
  };

  const validateCoupon = async (code) => {
    try {
      setCouponLoading(true);
      setCouponError('');
      
      const token = localStorage.getItem('userToken');
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_BASE}/api/coupons/validate/${code}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAppliedCoupon(data.coupon);
        setCouponError('');
        toast.success(`Coupon "${code}" applied successfully!`, 'Coupon Applied');
        return true;
      } else {
        setAppliedCoupon(null);
        setCouponError(data.message || 'Invalid coupon code');
        toast.error(data.message || 'Invalid coupon code', 'Coupon Error');
        return false;
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Failed to validate coupon. Please try again.');
      toast.error('Failed to validate coupon. Please try again.');
      setAppliedCoupon(null);
      return false;
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      toast.warning('Please enter a coupon code');
      return;
    }

    const isValid = await validateCoupon(couponCode);
    if (isValid) {
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    toast.info('Coupon removed successfully');
  };

  const totals = useMemo(() => {
    return calculateOrderTotals({ items, appliedCoupon });
  }, [items, appliedCoupon]);

  const { subtotal, productSavings, couponDiscount, shipping, tax, finalAmount } = totals;

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      toast.warning('Your cart is empty!');
      return;
    }
    navigate('/user/checkout', {
      state: {
        appliedCoupon,
        totals
      }
    });
  };

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
        createdAt: new Date().toISOString(),
        status: 'processing',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (appliedCoupon) {
        try {
          const token = localStorage.getItem('userToken');
          const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
          await fetch(`${API_BASE}/api/coupons/apply/${appliedCoupon.coupon_code}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error('Error applying coupon:', error);
        }
      }

      const localUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (localUser) {
        const userId = localUser._id || localUser.id;
        if (userId) {
          orderData.user = userId;
          orderData.userName = localUser.name || localUser.username || 'Customer';
          orderData.userEmail = localUser.email;
          const userOrders = JSON.parse(localStorage.getItem(`userOrders_${userId}`) || '[]');
          userOrders.unshift(orderData);
          localStorage.setItem(`userOrders_${userId}`, JSON.stringify(userOrders));
          const sharedOrders = JSON.parse(localStorage.getItem('luxuryOrders') || '[]');
          sharedOrders.unshift(orderData);
          localStorage.setItem('luxuryOrders', JSON.stringify(sharedOrders));
          localStorage.setItem(`userCart_${userId}`, JSON.stringify([]));
        }
      }

      try {
        const token = localStorage.getItem('userToken');
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        await fetch(`${API_BASE}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            orderId: orderData.orderId,
            items: orderData.items,
            shippingAddress: orderData.shippingAddress,
            totalAmount: orderData.finalAmount,
            paymentMethod: orderData.paymentMethod,
            discount: orderData.discount,
            tax: orderData.tax,
            coupon: orderData.coupon,
            status: 'processing',
          })
        });
      } catch (backendErr) {
        console.warn('Backend order sync failed (order saved locally):', backendErr.message);
      }

      dispatch(clearCart());
      setAppliedCoupon(null);
      setOrderLoading(false);
      setShowCheckoutModal(false);

      toast.success('Order placed successfully!', 'Thank You');

      navigate('/user/orders', {
        state: {
          newOrder: orderData,
          showSuccess: true
        }
      });

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order. Please try again.');
      setOrderLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <CustomerShoppingHeader />

      <div style={S.contentArea}>
        {/* Breadcrumb matching WishlistPage */}
        <nav style={S.breadcrumb} aria-label="Breadcrumb">
          <span style={S.breadHomeLink} onClick={() => navigate('/user/dashboard')}>
            <span style={S.breadIconCircle}>
              <Home size={11} color="#FFF" />
            </span>
            Home
          </span>
          <ChevronRight size={13} color="#B0A8A0" />
          <span style={S.breadActiveLink}>
            <span style={{ ...S.breadIconCircle, background: '#E8967F' }}>
              <ShoppingBag size={11} color="#FFF" />
            </span>
            Shopping Cart
          </span>
        </nav>

        {/* Page Header */}
        <div style={S.headerBlock}>
          <h1 style={S.pageTitle}>
            Shopping Cart {totalItems > 0 && <span style={S.itemCount}>({totalItems})</span>}
          </h1>
          <p style={S.pageSubtitle}>Review your selected items and proceed to luxury checkout.</p>
        </div>

        {loading ? (
          null
        ) : items.length === 0 ? (
          /* Empty Cart State matching WishlistPage */
          <div style={S.emptyCard}>
            <div style={S.emptyBagCircle}>
              <ShoppingBag size={40} color="#DE7356" />
            </div>
            <h2 style={S.emptyTitle}>Your cart is empty</h2>
            <p style={S.emptyDesc}>Explore our collection and add pieces you love.</p>
            <button 
              style={S.exploreBtn} 
              onClick={() => navigate('/user/dashboard')}
            >
              <Sparkles size={16} style={{ marginRight: 8 }} />
              Explore Collection
            </button>
          </div>
        ) : (
          /* Cart Content: 2 Columns */
          <div className="cart-grid-layout" style={S.cartGrid}>
            {/* Left Column: Cart Items List */}
            <div style={S.leftCol}>
              <div style={S.sectionHeader}>
                <h2 style={S.sectionTitle}>
                  Selected Items <span style={S.sectionCount}>({items.length})</span>
                </h2>
                <button 
                  style={S.clearCartBtn}
                  onClick={handleClearCart}
                >
                  <Trash2 size={13} />
                  Clear Cart
                </button>
              </div>

              <div style={S.itemsList}>
                {items.map((item) => {
                  const productId = item.product._id || item.product.id;
                  const price = Number(item.product.price || 0);
                  const originalPrice = item.product.originalPrice && Number(item.product.originalPrice) > price 
                    ? Number(item.product.originalPrice) 
                    : null;
                  const itemTotal = price * item.quantity;
                  const itemImage = item.product.image || item.product.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80';

                  return (
                    <div key={productId} style={S.itemCard} className="cart-item-card">
                      <div 
                        style={S.itemImageWrap}
                        onClick={() => navigate(`/product/${productId}`)}
                      >
                        <img 
                          src={itemImage} 
                          alt={item.product.name} 
                          style={S.itemImg}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>

                      <div style={S.itemDetails}>
                        <div style={S.itemMetaRow}>
                          <span style={S.categoryMeta}>{item.product.category || item.product.brand || 'Fashion'}</span>
                          {item.product.brand && (
                            <span style={S.brandTag}>{item.product.brand}</span>
                          )}
                        </div>

                        <h3 
                          style={S.itemTitle}
                          onClick={() => navigate(`/product/${productId}`)}
                        >
                          {item.product.name}
                        </h3>

                        <div style={S.priceRow}>
                          <span style={S.currentPrice}>₹{price.toLocaleString('en-IN')}</span>
                          {originalPrice && (
                            <span style={S.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</span>
                          )}
                        </div>

                        <div style={S.itemFooter}>
                          {/* Quantity control */}
                          <div style={S.qtyGroup}>
                            <button 
                              style={S.qtyBtn}
                              onClick={() => handleQuantityChange(productId, item.quantity - 1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} color="#2C221E" />
                            </button>
                            <span style={S.qtyVal}>{item.quantity}</span>
                            <button 
                              style={S.qtyBtn}
                              onClick={() => handleQuantityChange(productId, item.quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} color="#2C221E" />
                            </button>
                          </div>

                          <span style={S.itemSubtotal}>
                            Total: ₹{itemTotal.toLocaleString('en-IN')}
                          </span>

                          <button 
                            style={S.removeBtn}
                            onClick={() => handleRemoveItem(productId, item.product.name)}
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} color="#C0392B" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div style={S.rightCol}>
              <div style={S.summaryCard}>
                <h2 style={S.summaryTitle}>Order Summary</h2>


                {/* Coupon Section */}
                <div style={S.couponBlock}>
                  {!appliedCoupon ? (
                    <div style={S.couponFormGroup}>
                      <input 
                        type="text"
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        style={S.couponInput}
                      />
                      <button 
                        style={S.applyCouponBtn}
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div style={S.appliedCouponPill}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={14} color="#DE7356" />
                        <span style={S.appliedCouponCode}>{appliedCoupon.coupon_code}</span>
                        <span style={S.appliedCouponVal}>
                          ({appliedCoupon.discount_type === 'percentage' 
                            ? `${appliedCoupon.discount_value}% OFF` 
                            : `₹${appliedCoupon.discount_value} OFF`})
                        </span>
                      </div>
                      <button style={S.removeCouponBtn} onClick={handleRemoveCoupon}>
                        Remove
                      </button>
                    </div>
                  )}

                  {couponError && <div style={S.couponErrorMsg}>{couponError}</div>}
                  
                  {!appliedCoupon && (
                    <button 
                      style={S.viewCouponsLink}
                      onClick={() => navigate('/user/coupons')}
                    >
                      View Available Coupons
                    </button>
                  )}
                </div>

                {/* Breakdown Rows */}
                <div style={S.summaryRows}>
                  <div style={S.summaryRow}>
                    <span style={S.rowLabel}>Subtotal ({totalItems} items)</span>
                    <span style={S.rowValue}>₹{Math.round(totalAmount).toLocaleString('en-IN')}</span>
                  </div>

                  {productSavings > 0 && (
                    <div style={S.summaryRow}>
                      <span style={S.rowLabel}>Product Savings</span>
                      <span style={{ ...S.rowValue, color: '#27AE60' }}>
                        -₹{Math.round(productSavings).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div style={S.summaryRow}>
                      <span style={S.rowLabel}>Coupon Discount</span>
                      <span style={{ ...S.rowValue, color: '#DE7356' }}>
                        -₹{Math.round(couponDiscount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div style={S.summaryRow}>
                    <span style={S.rowLabel}>Shipping</span>
                    <span style={{ ...S.rowValue, color: '#DE7356', fontWeight: 600 }}>Complimentary</span>
                  </div>

                  <div style={S.summaryRow}>
                    <span style={S.rowLabel}>Estimated Taxes (10%)</span>
                    <span style={S.rowValue}>₹{Math.round(totalAmount * 0.1).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div style={S.divider} />

                {/* Total */}
                <div style={S.totalRow}>
                  <span style={S.totalLabel}>Total</span>
                  <span style={S.totalVal}>₹{Math.round(finalAmount).toLocaleString('en-IN')}</span>
                </div>

                {/* Badges */}
                <div style={S.badgesBox}>
                  <div style={S.badgeItem}>
                    <Shield size={14} color="#27AE60" />
                    <span>Secure 256-bit SSL Checkout</span>
                  </div>
                  <div style={S.badgeItem}>
                    <Truck size={14} color="#DE7356" />
                    <span>Express Delivery • Luxury Packaging</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button 
                  style={S.checkoutBtn}
                  onClick={handleProceedToCheckout}
                  disabled={orderLoading}
                >
                  <CreditCard size={16} />
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div style={S.modalOverlay}>
          <div style={S.modalCard}>
            <div style={S.modalHeader}>
              <div>
                <h2 style={S.modalTitle}>Complete Your Purchase</h2>
                <p style={S.modalSubtitle}>Final step to secure your items</p>
              </div>
              <button 
                style={S.closeModalBtn}
                onClick={() => setShowCheckoutModal(false)}
              >
                <X size={18} color="#2C221E" />
              </button>
            </div>

            <div style={S.modalBody}>
              <div style={S.modalGrid}>
                {/* Order Summary Column */}
                <div style={S.modalSection}>
                  <h3 style={S.modalSecTitle}>
                    <Package size={16} color="#DE7356" /> Order Items ({items.length})
                  </h3>
                  <div style={S.modalItemsList}>
                    {items.slice(0, 3).map((item) => (
                      <div key={item.product._id || item.product.id} style={S.modalItemRow}>
                        <img 
                          src={item.product.image || item.product.imageUrl} 
                          alt={item.product.name} 
                          style={S.modalItemImg}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={S.modalItemName}>{item.product.name}</div>
                          <div style={S.modalItemQty}>Qty: {item.quantity}</div>
                        </div>
                        <div style={S.modalItemPrice}>
                          ₹{Math.round(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div style={S.modalMoreItems}>
                        +{items.length - 3} additional item(s)
                      </div>
                    )}
                  </div>

                  <div style={S.modalTotalBox}>
                    <span>Total Amount Payable:</span>
                    <strong style={{ color: '#DE7356', fontSize: 16 }}>
                      ₹{Math.round(finalAmount).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {/* Shipping Details Column */}
                <div style={S.modalSection}>
                  <h3 style={S.modalSecTitle}>
                    <MapPin size={16} color="#DE7356" /> Shipping Details
                  </h3>
                  
                  <div style={S.formGroup}>
                    <label style={S.label}>Delivery Address *</label>
                    <input
                      type="text"
                      value={shippingDetails.address}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                      placeholder="Street address, apartment, suite"
                      style={S.input}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={S.formGroup}>
                      <label style={S.label}>City *</label>
                      <input
                        type="text"
                        value={shippingDetails.city}
                        onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                        placeholder="City"
                        style={S.input}
                      />
                    </div>

                    <div style={S.formGroup}>
                      <label style={S.label}>Postal Code *</label>
                      <input
                        type="text"
                        value={shippingDetails.postalCode}
                        onChange={(e) => setShippingDetails({ ...shippingDetails, postalCode: e.target.value })}
                        placeholder="PIN Code"
                        style={S.input}
                      />
                    </div>
                  </div>

                  <div style={S.formGroup}>
                    <label style={S.label}>Contact Phone *</label>
                    <input
                      type="tel"
                      value={shippingDetails.phone}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                      placeholder="+91 Mobile number"
                      style={S.input}
                    />
                  </div>

                  <div style={S.formGroup}>
                    <label style={S.label}>Delivery Notes</label>
                    <textarea
                      value={shippingDetails.notes}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, notes: e.target.value })}
                      placeholder="Special instructions (optional)"
                      rows={2}
                      style={{ ...S.input, height: 'auto', paddingTop: 8 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={S.modalFooter}>
              <button 
                style={S.modalCancelBtn}
                onClick={() => setShowCheckoutModal(false)}
              >
                Cancel
              </button>
              <button 
                style={S.modalConfirmBtn}
                onClick={handleCheckout}
                disabled={orderLoading}
              >
                {orderLoading ? 'Processing...' : 'Confirm & Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cart-item-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .cart-item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.05) !important;
        }
        @media (max-width: 900px) {
          .cart-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

/* ─── Styles matching SRILU FashionHub Wishlist visual identity ─── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#FAF4F0',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  contentArea: {
    maxWidth: 1140,
    width: '100%',
    margin: '0 auto',
    padding: '24px 24px 60px',
    boxSizing: 'border-box',
  },
  /* Breadcrumb */
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
    fontSize: 13,
  },
  breadIconCircle: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: '#DE7356',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(222,115,86,0.25)',
  },
  breadHomeLink: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#2C221E',
    cursor: 'pointer',
    fontWeight: 500,
  },
  breadActiveLink: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#7A6F68',
    fontWeight: 500,
  },
  headerBlock: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#2C221E',
    margin: '0 0 6px',
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  itemCount: {
    fontSize: 18,
    fontWeight: 400,
    color: '#7A6F68',
    fontFamily: 'Inter, system-ui, sans-serif',
    marginLeft: 6,
  },
  pageSubtitle: {
    fontSize: 13.5,
    color: '#7A6F68',
    margin: 0,
  },
  /* Empty state */
  emptyCard: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #EFE7DF',
    padding: '60px 24px',
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
  },
  emptyBagCircle: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: '#FDEEE9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#2C221E',
    margin: '0 0 8px',
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  emptyDesc: {
    fontSize: 14,
    color: '#7A6F68',
    margin: '0 0 24px',
  },
  exploreBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 26px',
    background: '#DE7356',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    boxShadow: '0 4px 12px rgba(222, 115, 86, 0.2)',
  },
  /* Grid Layout */
  cartGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: 24,
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 700,
    color: '#2C221E',
    margin: 0,
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: 400,
    color: '#7A6F68',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  clearCartBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    background: '#FDF2F2',
    border: '1px solid #F5C6CB',
    color: '#C0392B',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  itemCard: {
    background: '#FFFFFF',
    borderRadius: 14,
    border: '1px solid #EFE7DF',
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    padding: 14,
    display: 'flex',
    gap: 16,
    boxSizing: 'border-box',
  },
  itemImageWrap: {
    width: 100,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    background: '#FAF4F0',
    flexShrink: 0,
    cursor: 'pointer',
  },
  itemImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  itemMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryMeta: {
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#7A6F68',
    fontWeight: 600,
  },
  brandTag: {
    fontSize: 10.5,
    color: '#DE7356',
    fontWeight: 600,
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: 600,
    color: '#2C221E',
    margin: '0 0 6px',
    lineHeight: '1.3',
    cursor: 'pointer',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  currentPrice: {
    fontSize: 15,
    fontWeight: 700,
    color: '#2C221E',
  },
  originalPrice: {
    fontSize: 12,
    color: '#7A6F68',
    textDecoration: 'line-through',
  },
  itemFooter: {
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  qtyGroup: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid #EFE7DF',
    borderRadius: 8,
    background: '#FAF4F0',
    padding: '2px 4px',
  },
  qtyBtn: {
    width: 26,
    height: 26,
    border: 'none',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: 4,
  },
  qtyVal: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: '#2C221E',
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: 600,
    color: '#2C221E',
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: '1px solid #F5C6CB',
    background: '#FDF2F2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  /* Summary Column */
  rightCol: {
    position: 'sticky',
    top: 24,
  },
  summaryCard: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #EFE7DF',
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#2C221E',
    margin: 0,
    fontFamily: "'Playfair Display', Georgia, serif",
    paddingBottom: 10,
    borderBottom: '1px solid #EFE7DF',
  },
  vipBanner: {
    background: 'rgba(212, 175, 55, 0.1)',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    borderRadius: 10,
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  vipBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#D4AF37',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  vipTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#8A6D00',
  },
  vipDesc: {
    fontSize: 11,
    color: '#555',
  },
  couponBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  couponFormGroup: {
    display: 'flex',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    border: '1px solid #EFE7DF',
    background: '#FAF4F0',
    padding: '0 10px',
    fontSize: 12.5,
    color: '#2C221E',
    outline: 'none',
  },
  applyCouponBtn: {
    height: 36,
    padding: '0 16px',
    background: '#DE7356',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
  appliedCouponPill: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#FDEEE9',
    border: '1px solid #F5C6CB',
    borderRadius: 8,
    padding: '8px 12px',
  },
  appliedCouponCode: {
    fontSize: 12.5,
    fontWeight: 700,
    color: '#DE7356',
  },
  appliedCouponVal: {
    fontSize: 11.5,
    color: '#7A6F68',
  },
  removeCouponBtn: {
    border: 'none',
    background: 'transparent',
    color: '#C0392B',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  couponErrorMsg: {
    fontSize: 11.5,
    color: '#C0392B',
  },
  viewCouponsLink: {
    border: 'none',
    background: 'transparent',
    color: '#DE7356',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    padding: 0,
  },
  summaryRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
  },
  rowLabel: {
    color: '#7A6F68',
  },
  rowValue: {
    fontWeight: 600,
    color: '#2C221E',
  },
  divider: {
    height: 1,
    background: '#EFE7DF',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: '#2C221E',
  },
  totalVal: {
    fontSize: 22,
    fontWeight: 700,
    color: '#DE7356',
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  badgesBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    background: '#FAF4F0',
    borderRadius: 10,
    padding: 10,
  },
  badgeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11.5,
    color: '#7A6F68',
  },
  checkoutBtn: {
    width: '100%',
    height: 44,
    background: '#DE7356',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(222, 115, 86, 0.25)',
    transition: 'background 0.2s ease',
  },

  /* Modal */
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modalCard: {
    background: '#FFFFFF',
    borderRadius: 20,
    border: '1px solid #EFE7DF',
    width: '100%',
    maxWidth: 780,
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    background: '#FAF4F0',
    borderBottom: '1px solid #EFE7DF',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 700,
    color: '#2C221E',
    margin: 0,
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: '#7A6F68',
    margin: 0,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '1px solid #EFE7DF',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  modalBody: {
    padding: 24,
    overflowY: 'auto',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
  },
  modalSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  modalSecTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#2C221E',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  modalItemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  modalItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#FAF4F0',
    padding: 8,
    borderRadius: 8,
  },
  modalItemImg: {
    width: 44,
    height: 44,
    borderRadius: 6,
    objectFit: 'cover',
  },
  modalItemName: {
    fontSize: 12.5,
    fontWeight: 600,
    color: '#2C221E',
  },
  modalItemQty: {
    fontSize: 11,
    color: '#7A6F68',
  },
  modalItemPrice: {
    fontSize: 12.5,
    fontWeight: 700,
    color: '#DE7356',
  },
  modalMoreItems: {
    fontSize: 11.5,
    color: '#7A6F68',
    textAlign: 'center',
  },
  modalTotalBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTop: '1px solid #EFE7DF',
    fontSize: 13,
    fontWeight: 600,
    color: '#2C221E',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#2C221E',
  },
  input: {
    height: 36,
    borderRadius: 8,
    border: '1px solid #EFE7DF',
    background: '#FAF4F0',
    padding: '0 10px',
    fontSize: 12.5,
    color: '#2C221E',
    outline: 'none',
  },
  modalFooter: {
    padding: '14px 24px',
    background: '#FAF4F0',
    borderTop: '1px solid #EFE7DF',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    padding: '8px 18px',
    background: '#FFFFFF',
    border: '1px solid #EFE7DF',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: '#2C221E',
    cursor: 'pointer',
  },
  modalConfirmBtn: {
    padding: '8px 22px',
    background: '#DE7356',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: '#FFFFFF',
    cursor: 'pointer',
  },
};