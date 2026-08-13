import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import CustomerShoppingHeader from '../../components/CustomerShoppingHeader';
import { clearCart, fetchCart } from '../../redux/slices/cartSlice';
import { useToast } from '../../components/common/Toast/useToast';
import { useAuth } from '../../context/AuthContext';
import { calculateOrderTotals } from '../../utils/orderUtils';
import { sanitizeAddresses } from '../../utils/addressUtils';
import {
  ShoppingBag, MapPin, CreditCard, ShieldCheck, Truck, CheckCircle,
  XCircle, ChevronRight, Home, ArrowLeft, Lock, Smartphone, RefreshCw, AlertCircle
} from 'lucide-react';

const DEFAULT_ADDRESSES = [
  {
    id: 'addr_1',
    type: 'Home',
    isDefault: true,
    name: 'Sri Vijaya Lakshmi',
    line1: '12-34, MG Road, Koramangala',
    line2: 'Bengaluru, Karnataka – 560034',
    phone: '+91 98765 43210'
  }
];

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user } = useAuth();

  const { items = [], loading = false } = useSelector((state) => state.cart || {});

  // Saved addresses from local storage with safe sanitization
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem('userAddresses');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_ADDRESSES;
      return sanitizeAddresses(parsed);
    } catch (_) {
      return sanitizeAddresses(DEFAULT_ADDRESSES);
    }
  });

  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
    return defaultAddr ? defaultAddr.id : 'custom';
  });

  // Shipping Form State - pre-filled with saved default address
  const [shippingDetails, setShippingDetails] = useState(() => {
    const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
    if (defaultAddr) {
      return {
        name: defaultAddr.name || '',
        phone: defaultAddr.phone || '',
        address: defaultAddr.line1 || '',
        city: (defaultAddr.line2 || '').split(',')[0]?.trim() || 'Bengaluru',
        state: 'Karnataka',
        postalCode: (defaultAddr.line2 || '').split('–')[1]?.trim() || (defaultAddr.line2 || '').split('-')[1]?.trim() || '560034',
        notes: ''
      };
    }
    return {
      name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Customer' : '',
      phone: user?.phone || user?.mobile || '',
      address: '',
      city: '',
      state: 'Karnataka',
      postalCode: '',
      notes: ''
    };
  });

  // Sync selected address to form
  useEffect(() => {
    if (selectedAddressId !== 'custom') {
      const selected = savedAddresses.find(a => a.id === selectedAddressId);
      if (selected) {
        setShippingDetails({
          name: selected.name || '',
          phone: selected.phone || '',
          address: selected.line1 || '',
          city: (selected.line2 || '').split(',')[0] || 'Bengaluru',
          state: 'Karnataka',
          postalCode: (selected.line2 || '').split('–')[1]?.trim() || '560034',
          notes: ''
        });
      }
    }
  }, [selectedAddressId, savedAddresses]);

  // Applied Coupon from location state
  const appliedCoupon = location.state?.appliedCoupon || null;

  // Order Totals
  const totals = useMemo(() => {
    return calculateOrderTotals({ items, appliedCoupon });
  }, [items, appliedCoupon]);

  const { subtotal, productSavings, couponDiscount, shipping, tax, finalAmount } = totals;

  // Payment Selection: 'cod' | 'demo_online'
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Online Sub-type: 'demo_upi' | 'demo_card'
  const [onlineType, setOnlineType] = useState('demo_upi');

  // Demo Card Form State
  const [cardForm, setCardForm] = useState({
    cardholder: 'John Doe',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/30',
    cvv: '123'
  });

  // Demo UPI Form State
  const [upiId, setUpiId] = useState('example@demo');

  // Test Failure Mode Switch
  const [simulateFailure, setSimulateFailure] = useState(false);

  // Statuses
  const [checkoutStep, setCheckoutStep] = useState('review'); // 'review' | 'processing' | 'confirmed' | 'failed'
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState(null);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Validate form
  const validateShipping = () => {
    const { name, phone, address, city, postalCode } = shippingDetails;
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !postalCode.trim()) {
      toast.warning('Please complete all required delivery address fields.', 'Missing Address Information');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      navigate('/user/cart');
      return;
    }

    if (!validateShipping()) return;

    setOrderProcessing(true);
    setCheckoutStep('processing');

    // Simulate payment processing delay (1.5 seconds)
    setTimeout(async () => {
      // Handle simulated payment failure if failure toggle is checked
      if (paymentMethod === 'demo_online' && simulateFailure) {
        setOrderProcessing(false);
        setCheckoutStep('failed');
        toast.error('Simulated payment failed. No amount has been charged.', 'Payment Failed');
        return;
      }

      try {
        const orderId = `SRL-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
        const isCOD = paymentMethod === 'cod';
        const isUPI = !isCOD && onlineType === 'demo_upi';
        const isCard = !isCOD && onlineType === 'demo_card';

        const paymentMethodLabel = isCOD
          ? 'cash_on_delivery'
          : isUPI
            ? 'demo_upi'
            : 'demo_card';

        const paymentStatus = isCOD ? 'pending' : 'successful';
        const transactionId = isCOD ? null : `DEMO-TXN-${Math.floor(100000 + Math.random() * 900000)}`;

        // Safe card metadata (NEVER store full card number or CVV)
        const last4 = isCard ? (cardForm.cardNumber.replace(/\s+/g, '').slice(-4) || '4242') : null;

        const orderPayload = {
          orderId,
          items: items.map(item => ({
            product: item.product?._id || item.product?.id || item.product,
            name: item.product?.name || item.name,
            price: Number(item.product?.price || item.price || 0),
            quantity: Number(item.quantity || 1),
            image: item.product?.image || item.product?.imageUrl || item.image,
            category: item.product?.category || item.category || 'Fashion',
            brand: item.product?.brand || item.brand
          })),
          shippingAddress: {
            address: shippingDetails.address,
            city: shippingDetails.city,
            state: shippingDetails.state,
            postalCode: shippingDetails.postalCode,
            phone: shippingDetails.phone,
            name: shippingDetails.name,
            notes: shippingDetails.notes
          },
          subtotal,
          tax,
          discount: totals.totalDiscount,
          shipping: 0,
          totalAmount: finalAmount,
          finalAmount,
          coupon: appliedCoupon ? {
            code: appliedCoupon.coupon_code || appliedCoupon.code,
            discount: couponDiscount
          } : null,
          paymentMethod: paymentMethodLabel,
          paymentMethodMeta: isCard
            ? { cardBrand: 'Demo Card', last4 }
            : isUPI
              ? { upiId }
              : { type: 'COD' },
          paymentStatus,
          transactionId,
          status: 'processing',
          createdAt: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        };

        // Save order locally for persistence
        const localUser = JSON.parse(localStorage.getItem('user') || 'null');
        const userId = localUser?._id || localUser?.id || user?._id || user?.id;

        if (userId) {
          const userOrders = JSON.parse(localStorage.getItem(`userOrders_${userId}`) || '[]');
          userOrders.unshift(orderPayload);
          localStorage.setItem(`userOrders_${userId}`, JSON.stringify(userOrders));
          localStorage.setItem(`userCart_${userId}`, JSON.stringify([]));
        }

        const sharedOrders = JSON.parse(localStorage.getItem('luxuryOrders') || '[]');
        sharedOrders.unshift(orderPayload);
        localStorage.setItem('luxuryOrders', JSON.stringify(sharedOrders));

        // Sync with backend API
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
              orderId: orderPayload.orderId,
              items: orderPayload.items,
              shippingAddress: orderPayload.shippingAddress,
              totalAmount: orderPayload.finalAmount,
              finalAmount: orderPayload.finalAmount,
              subtotal: orderPayload.subtotal,
              tax: orderPayload.tax,
              discount: orderPayload.discount,
              coupon: orderPayload.coupon,
              paymentMethod: orderPayload.paymentMethod,
              paymentStatus: orderPayload.paymentStatus,
              transactionId: orderPayload.transactionId,
              status: 'processing'
            })
          });
        } catch (apiErr) {
          console.warn('Backend order sync warning:', apiErr.message);
        }

        // Clear Redux Cart
        dispatch(clearCart());

        setCreatedOrderData(orderPayload);
        setOrderProcessing(false);
        setCheckoutStep('confirmed');

        if (isCOD) {
          toast.success('Order placed successfully via Cash on Delivery!', 'Order Confirmed');
        } else {
          toast.success('Demo Online Payment successful!', 'Payment Successful');
        }
      } catch (err) {
        console.error('Order creation error:', err);
        setOrderProcessing(false);
        setCheckoutStep('failed');
        toast.error('Failed to create order. Please try again.');
      }
    }, 1500);
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (_) {
      return 'N/A';
    }
  };

  return (
    <div style={S.page}>
      <CustomerShoppingHeader />

      <div style={S.contentArea}>
        {/* Breadcrumb */}
        <nav style={S.breadcrumb} aria-label="Breadcrumb">
          <span style={S.breadLink} onClick={() => navigate('/user/dashboard')}>
            <span style={S.breadIconCircle}><Home size={11} color="#FFF" /></span>
            Home
          </span>
          <ChevronRight size={13} color="#B0A8A0" />
          <span style={S.breadLink} onClick={() => navigate('/user/cart')}>
            <span style={S.breadIconCircle}><ShoppingBag size={11} color="#FFF" /></span>
            Shopping Cart
          </span>
          <ChevronRight size={13} color="#B0A8A0" />
          <span style={S.breadActive}>
            <span style={{ ...S.breadIconCircle, background: '#E8967F' }}><CreditCard size={11} color="#FFF" /></span>
            Checkout
          </span>
        </nav>

        {/* PROCESSING SCREEN */}
        {checkoutStep === 'processing' && (
          <div style={S.processingCard}>
            <RefreshCw size={44} color="#DE7356" className="spin-animation" />
            <h2 style={S.processingTitle}>Processing Your Order...</h2>
            <p style={S.processingSubtitle}>
              {paymentMethod === 'cod'
                ? 'Securing your Cash on Delivery order...'
                : 'Simulating secure payment authorization...'}
            </p>
            <div style={S.secureBadge}>
              <Lock size={14} color="#27AE60" />
              <span>256-bit Encrypted Transaction</span>
            </div>
          </div>
        )}

        {/* PAYMENT FAILED SCREEN */}
        {checkoutStep === 'failed' && (
          <div style={S.failedCard}>
            <div style={S.failedIconCircle}>
              <XCircle size={44} color="#C0392B" />
            </div>
            <h2 style={S.failedTitle}>Payment Failed</h2>
            <p style={S.failedSubtitle}>
              Your simulated payment transaction could not be processed. No amount has been charged.
            </p>
            <div style={S.failedActions}>
              <button
                style={S.retryBtn}
                onClick={() => {
                  setSimulateFailure(false);
                  setCheckoutStep('review');
                }}
              >
                Try Again
              </button>
              <button
                style={S.changeMethodBtn}
                onClick={() => {
                  setSimulateFailure(false);
                  setPaymentMethod('cod');
                  setCheckoutStep('review');
                }}
              >
                Change Payment Method
              </button>
            </div>
          </div>
        )}

        {/* ORDER CONFIRMED SCREEN */}
        {checkoutStep === 'confirmed' && createdOrderData && (
          <div style={S.confirmedCard}>
            <div style={S.confirmedHeader}>
              <div style={S.confirmedCheckCircle}>
                <CheckCircle size={44} color="#27AE60" />
              </div>
              <h1 style={S.confirmedTitle}>
                {createdOrderData.paymentMethod === 'cash_on_delivery'
                  ? '✓ Order Placed Successfully'
                  : '✓ Payment Successful & Order Confirmed'}
              </h1>
              <p style={S.confirmedSubtitle}>
                Thank you for shopping with SRILU FashionHub. Your luxury order has been confirmed.
              </p>
            </div>

            <div style={S.confirmedDetailsGrid}>
              <div style={S.confCell}>
                <span style={S.confLabel}>Order Reference ID</span>
                <strong style={S.confValHighlight}>#{createdOrderData.orderId}</strong>
              </div>

              <div style={S.confCell}>
                <span style={S.confLabel}>Payment Method</span>
                <span style={S.confVal}>
                  {createdOrderData.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Demo Online Payment'}
                </span>
              </div>

              <div style={S.confCell}>
                <span style={S.confLabel}>Payment Status</span>
                <span style={{
                  ...S.confBadge,
                  background: createdOrderData.paymentStatus === 'successful' ? '#E8F8F0' : '#FFF8E7',
                  color: createdOrderData.paymentStatus === 'successful' ? '#27AE60' : '#D4AF37'
                }}>
                  {createdOrderData.paymentStatus === 'successful' ? 'Successful' : 'Pending (On Delivery)'}
                </span>
              </div>

              {createdOrderData.transactionId && (
                <div style={S.confCell}>
                  <span style={S.confLabel}>Transaction ID</span>
                  <span style={S.confVal}>{createdOrderData.transactionId}</span>
                </div>
              )}

              <div style={S.confCell}>
                <span style={S.confLabel}>
                  {createdOrderData.paymentMethod === 'cash_on_delivery' ? 'Amount Due on Delivery' : 'Amount Paid'}
                </span>
                <strong style={{ fontSize: 18, color: '#DE7356', fontWeight: 700 }}>
                  ₹{createdOrderData.finalAmount.toLocaleString('en-IN')}
                </strong>
              </div>

              <div style={S.confCell}>
                <span style={S.confLabel}>Estimated Delivery</span>
                <span style={S.confVal}>{formatDate(createdOrderData.estimatedDelivery)}</span>
              </div>
            </div>

            {/* Delivery Address Summary */}
            <div style={S.confAddressBox}>
              <h3 style={S.confSecHeading}><MapPin size={16} color="#DE7356" /> Delivery Address</h3>
              <div style={{ fontSize: 14, color: '#2C221E', fontWeight: 600 }}>{createdOrderData.shippingAddress.name}</div>
              <div style={{ fontSize: 13, color: '#7A6F68', marginTop: 4 }}>
                {createdOrderData.shippingAddress.address}, {createdOrderData.shippingAddress.city}, {createdOrderData.shippingAddress.state} - {createdOrderData.shippingAddress.postalCode}
              </div>
              <div style={{ fontSize: 13, color: '#7A6F68', marginTop: 2 }}>
                📞 {createdOrderData.shippingAddress.phone}
              </div>
            </div>

            <div style={S.confActions}>
              <button
                style={S.viewOrderBtn}
                onClick={() => navigate('/user/orders', { state: { showSuccess: true, newOrder: createdOrderData } })}
              >
                View My Orders
              </button>
              <button
                style={S.continueBtn}
                onClick={() => navigate('/user/dashboard')}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}

        {/* MAIN CHECKOUT FORM STEP */}
        {checkoutStep === 'review' && (
          <div>
            <div style={S.pageHeader}>
              <h1 style={S.pageTitle}>Checkout & Payment</h1>
              <p style={S.pageSubtitle}>Review your shipping details, choose payment method, and complete purchase.</p>
            </div>

            <div style={S.checkoutGrid}>
              {/* Left Column: Address & Payment Method */}
              <div style={S.leftCol}>
                {/* STEP 1: DELIVERY ADDRESS */}
                <div style={S.sectionCard}>
                  <div style={S.sectionHeader}>
                    <div style={S.stepBadge}>1</div>
                    <div>
                      <h2 style={S.sectionTitle}>Delivery Address</h2>
                      <p style={S.sectionDesc}>Select a saved address or enter a new delivery address.</p>
                    </div>
                  </div>

                  {/* Saved Address Selector */}
                  {savedAddresses.length > 0 && (
                    <div style={S.savedAddressesGrid}>
                      {savedAddresses.map(addr => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            style={S.addressOptionCard(isSelected)}
                            onClick={() => setSelectedAddressId(addr.id)}
                          >
                            <input
                              type="radio"
                              name="addressSelection"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              style={{ accentColor: '#DE7356' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <strong style={{ fontSize: 14, color: '#2C221E' }}>{addr.name}</strong>
                                <span style={S.addrTag}>{addr.type}</span>
                              </div>
                              <div style={{ fontSize: 13, color: '#7A6F68', marginTop: 4 }}>
                                {addr.line1}, {addr.line2}
                              </div>
                              <div style={{ fontSize: 12.5, color: '#7A6F68', marginTop: 2 }}>
                                📞 {addr.phone}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div
                        style={S.addressOptionCard(selectedAddressId === 'custom')}
                        onClick={() => setSelectedAddressId('custom')}
                      >
                        <input
                          type="radio"
                          name="addressSelection"
                          checked={selectedAddressId === 'custom'}
                          onChange={() => setSelectedAddressId('custom')}
                          style={{ accentColor: '#DE7356' }}
                        />
                        <div>
                          <strong style={{ fontSize: 14, color: '#2C221E' }}>+ Deliver to Different Address</strong>
                          <div style={{ fontSize: 12.5, color: '#7A6F68', marginTop: 2 }}>
                            Enter custom delivery address below
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address Inputs Form */}
                  <div style={S.addressForm}>
                    <div style={S.formRow}>
                      <div style={S.formGroup}>
                        <label style={S.label}>Full Name *</label>
                        <input
                          type="text"
                          style={S.input}
                          placeholder="Recipient Full Name"
                          value={shippingDetails.name}
                          onChange={(e) => setShippingDetails({ ...shippingDetails, name: e.target.value })}
                        />
                      </div>

                      <div style={S.formGroup}>
                        <label style={S.label}>Contact Phone *</label>
                        <input
                          type="tel"
                          style={S.input}
                          placeholder="+91 Mobile Number"
                          value={shippingDetails.phone}
                          onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={S.formGroup}>
                      <label style={S.label}>Address Line (Street, Flat / House No.) *</label>
                      <input
                        type="text"
                        style={S.input}
                        placeholder="e.g. 12-34, MG Road, Koramangala"
                        value={shippingDetails.address}
                        onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                      />
                    </div>

                    <div style={S.formRowThree}>
                      <div style={S.formGroup}>
                        <label style={S.label}>City *</label>
                        <input
                          type="text"
                          style={S.input}
                          placeholder="City"
                          value={shippingDetails.city}
                          onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                        />
                      </div>

                      <div style={S.formGroup}>
                        <label style={S.label}>State *</label>
                        <input
                          type="text"
                          style={S.input}
                          placeholder="State"
                          value={shippingDetails.state}
                          onChange={(e) => setShippingDetails({ ...shippingDetails, state: e.target.value })}
                        />
                      </div>

                      <div style={S.formGroup}>
                        <label style={S.label}>Postal Code *</label>
                        <input
                          type="text"
                          style={S.input}
                          placeholder="PIN Code"
                          value={shippingDetails.postalCode}
                          onChange={(e) => setShippingDetails({ ...shippingDetails, postalCode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEP 2: PAYMENT METHOD */}
                <div style={S.sectionCard}>
                  <div style={S.sectionHeader}>
                    <div style={S.stepBadge}>2</div>
                    <div>
                      <h2 style={S.sectionTitle}>Payment Method</h2>
                      <p style={S.sectionDesc}>Choose how you want to pay for your luxury order.</p>
                    </div>
                  </div>

                  <div style={S.paymentOptionsList}>
                    {/* Option 1: Cash on Delivery */}
                    <div
                      style={S.paymentOptionBox(paymentMethod === 'cod')}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <div style={S.payOptHeader}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          style={{ accentColor: '#DE7356' }}
                        />
                        <div>
                          <div style={S.payOptTitle}>Cash on Delivery (COD)</div>
                          <div style={S.payOptDesc}>Pay in cash or UPI when your order arrives. No online payment required.</div>
                        </div>
                      </div>

                      {paymentMethod === 'cod' && (
                        <div style={S.codNotice}>
                          <div style={{ fontSize: 13, color: '#4A3F38' }}>
                            <strong>Amount Due on Delivery:</strong> <span style={{ color: '#DE7356', fontWeight: 700 }}>₹{finalAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#7A6F68', marginTop: 4 }}>
                            You will pay the delivery partner upon parcel arrival. Order status will be Processing with payment status Pending.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Option 2: Demo Online Payment */}
                    <div
                      style={S.paymentOptionBox(paymentMethod === 'demo_online')}
                      onClick={() => setPaymentMethod('demo_online')}
                    >
                      <div style={S.payOptHeader}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'demo_online'}
                          onChange={() => setPaymentMethod('demo_online')}
                          style={{ accentColor: '#DE7356' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={S.payOptTitle}>Demo Online Payment</span>
                            <span style={S.demoPill}>PORTFOLIO DEMO</span>
                          </div>
                          <div style={S.payOptDesc}>
                            Simulated online payment for demonstration purposes. No real money will be charged.
                          </div>
                        </div>
                      </div>

                      {paymentMethod === 'demo_online' && (
                        <div style={S.onlineSubForm}>
                          <div style={S.tabBar}>
                            <button
                              style={S.tabBtn(onlineType === 'demo_upi')}
                              onClick={(e) => { e.stopPropagation(); setOnlineType('demo_upi'); }}
                            >
                              <Smartphone size={15} /> Demo UPI
                            </button>
                            <button
                              style={S.tabBtn(onlineType === 'demo_card')}
                              onClick={(e) => { e.stopPropagation(); setOnlineType('demo_card'); }}
                            >
                              <CreditCard size={15} /> Demo Card
                            </button>
                          </div>

                          {onlineType === 'demo_upi' && (
                            <div style={S.upiBlock} onClick={(e) => e.stopPropagation()}>
                              <label style={S.label}>Demo UPI ID</label>
                              <input
                                type="text"
                                style={S.input}
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                placeholder="username@demo"
                              />
                              <p style={{ fontSize: 12, color: '#7A6F68', margin: '6px 0 0' }}>
                                Fictional UPI handle for portfolio simulation.
                              </p>
                            </div>
                          )}

                          {onlineType === 'demo_card' && (
                            <div style={S.cardBlock} onClick={(e) => e.stopPropagation()}>
                              <div style={S.formGroup}>
                                <label style={S.label}>Cardholder Name *</label>
                                <input
                                  type="text"
                                  style={S.input}
                                  value={cardForm.cardholder}
                                  onChange={(e) => setCardForm({ ...cardForm, cardholder: e.target.value })}
                                />
                              </div>

                              <div style={S.formGroup}>
                                <label style={S.label}>Demo Card Number *</label>
                                <input
                                  type="text"
                                  style={S.input}
                                  value={cardForm.cardNumber}
                                  onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                                />
                              </div>

                              <div style={S.formRow}>
                                <div style={S.formGroup}>
                                  <label style={S.label}>Expiry Date (MM/YY) *</label>
                                  <input
                                    type="text"
                                    style={S.input}
                                    value={cardForm.expiry}
                                    onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                                  />
                                </div>
                                <div style={S.formGroup}>
                                  <label style={S.label}>Demo CVV *</label>
                                  <input
                                    type="password"
                                    style={S.input}
                                    value={cardForm.cvv}
                                    maxLength={3}
                                    onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Simulation test failure toggle */}
                          <div style={S.simulateFailBox} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              id="chkSimulateFail"
                              checked={simulateFailure}
                              onChange={(e) => setSimulateFailure(e.target.checked)}
                            />
                            <label htmlFor="chkSimulateFail" style={{ fontSize: 12.5, color: '#C0392B', cursor: 'pointer', fontWeight: 500 }}>
                              Simulate Payment Failure (for testing error handling)
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Review Summary & Confirm */}
              <div style={S.rightCol}>
                <div style={S.summaryCard}>
                  <h2 style={S.summaryTitle}>Order Summary</h2>

                  <div style={S.summaryItemsList}>
                    {items.map((item, idx) => {
                      const itemPrice = Number(item.product?.price || item.price || 0);
                      const itemQty = Number(item.quantity || 1);
                      const itemImage = item.product?.image || item.product?.imageUrl || item.image;

                      return (
                        <div key={idx} style={S.summaryItemRow}>
                          <img src={itemImage} alt={item.product?.name} style={S.summaryItemThumb} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#2C221E' }}>
                              {item.product?.name || item.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#7A6F68' }}>Qty: {itemQty}</div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#2C221E' }}>
                            ₹{(itemPrice * itemQty).toLocaleString('en-IN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={S.divider} />

                  <div style={S.summaryRows}>
                    <div style={S.summaryRow}>
                      <span>Subtotal ({items.length} items)</span>
                      <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>

                    {productSavings > 0 && (
                      <div style={S.summaryRow}>
                        <span>Product Savings</span>
                        <span style={{ color: '#27AE60' }}>-₹{productSavings.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {couponDiscount > 0 && (
                      <div style={S.summaryRow}>
                        <span>Coupon Discount</span>
                        <span style={{ color: '#DE7356' }}>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div style={S.summaryRow}>
                      <span>Shipping</span>
                      <span style={{ color: '#DE7356', fontWeight: 600 }}>Complimentary</span>
                    </div>

                    <div style={S.summaryRow}>
                      <span>Estimated Tax (10%)</span>
                      <span>₹{tax.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div style={S.divider} />

                  <div style={S.totalRow}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#2C221E' }}>Total Amount</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#DE7356' }}>
                      ₹{finalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div style={S.securityBadges}>
                    <div style={S.secBadgeItem}>
                      <ShieldCheck size={14} color="#27AE60" />
                      <span>256-bit Encrypted Portfolio Checkout</span>
                    </div>
                    <div style={S.secBadgeItem}>
                      <Truck size={14} color="#DE7356" />
                      <span>Complimentary Luxury Delivery</span>
                    </div>
                  </div>

                  <button
                    style={S.placeOrderBtn}
                    onClick={handlePlaceOrder}
                    disabled={orderProcessing}
                  >
                    {paymentMethod === 'cod' ? `Place Order • ₹${finalAmount.toLocaleString('en-IN')}` : `Pay ₹${finalAmount.toLocaleString('en-IN')}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1.2s linear infinite;
        }
        @media (max-width: 900px) {
          .checkout-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const S = {
  page: {
    minHeight: '100vh',
    background: '#FAF4F0',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
  },
  contentArea: {
    maxWidth: 1140,
    margin: '0 auto',
    padding: '24px 24px 60px',
    boxSizing: 'border-box'
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    fontSize: 13
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
    flexShrink: 0
  },
  breadLink: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#2C221E',
    cursor: 'pointer',
    fontWeight: 500
  },
  breadActive: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#7A6F68',
    fontWeight: 500
  },
  pageHeader: { marginBottom: 24 },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#2C221E',
    margin: '0 0 6px',
    fontFamily: "'Playfair Display', Georgia, serif"
  },
  pageSubtitle: { fontSize: 13.5, color: '#7A6F68', margin: 0 },
  checkoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: 24,
    alignItems: 'start'
  },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 20 },
  rightCol: { position: 'sticky', top: 90 },
  sectionCard: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #EFE7DF',
    padding: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 20
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#DE7356',
    color: '#FFF',
    fontSize: 14,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#2C221E',
    margin: '0 0 4px',
    fontFamily: "'Playfair Display', Georgia, serif"
  },
  sectionDesc: { fontSize: 13, color: '#7A6F68', margin: 0 },
  savedAddressesGrid: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 },
  addressOptionCard: (active) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    border: `1.5px solid ${active ? '#DE7356' : '#EFE7DF'}`,
    background: active ? '#FFF9F7' : '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  }),
  addrTag: {
    background: '#FDEEE9',
    color: '#DE7356',
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 10
  },
  addressForm: { display: 'flex', flexDirection: 'column', gap: 12 },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  formRowThree: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: '#4A3F38' },
  input: {
    width: '100%',
    height: 38,
    border: '1.5px solid #EFE7DF',
    borderRadius: 8,
    background: '#FAF4F0',
    padding: '0 12px',
    fontSize: 13,
    color: '#2C221E',
    outline: 'none',
    boxSizing: 'border-box'
  },
  paymentOptionsList: { display: 'flex', flexDirection: 'column', gap: 14 },
  paymentOptionBox: (active) => ({
    border: `1.5px solid ${active ? '#DE7356' : '#EFE7DF'}`,
    borderRadius: 12,
    padding: 16,
    background: active ? '#FFF9F7' : '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  }),
  payOptHeader: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  payOptTitle: { fontSize: 15, fontWeight: 700, color: '#2C221E' },
  payOptDesc: { fontSize: 12.5, color: '#7A6F68', marginTop: 4 },
  demoPill: {
    background: '#DE7356',
    color: '#FFF',
    fontSize: 9.5,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 10
  },
  codNotice: {
    marginTop: 12,
    padding: 12,
    background: '#FDEEE9',
    borderRadius: 8,
    border: '1px solid #F5D0C5'
  },
  onlineSubForm: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: '1px solid #EFE7DF'
  },
  tabBar: { display: 'flex', gap: 10, marginBottom: 14 },
  tabBtn: (active) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 8,
    border: `1px solid ${active ? '#DE7356' : '#EFE7DF'}`,
    background: active ? '#DE7356' : '#FAF4F0',
    color: active ? '#FFF' : '#4A3F38',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer'
  }),
  upiBlock: { display: 'flex', flexDirection: 'column', gap: 6 },
  cardBlock: { display: 'flex', flexDirection: 'column', gap: 10 },
  simulateFailBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 10,
    background: '#FDF2F2',
    borderRadius: 8,
    border: '1px solid #F8D7DA'
  },
  summaryCard: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #EFE7DF',
    padding: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#2C221E',
    margin: '0 0 16px',
    fontFamily: "'Playfair Display', Georgia, serif"
  },
  summaryItemsList: { display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' },
  summaryItemRow: { display: 'flex', alignItems: 'center', gap: 10 },
  summaryItemThumb: { width: 42, height: 42, borderRadius: 6, objectFit: 'cover' },
  divider: { height: 1, background: '#EFE7DF', margin: '14px 0' },
  summaryRows: { display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#7A6F68' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 16px' },
  securityBadges: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 },
  secBadgeItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#7A6F68' },
  placeOrderBtn: {
    width: '100%',
    padding: 14,
    background: '#DE7356',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(222,115,86,0.25)'
  },

  // State Screens
  processingCard: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #EFE7DF',
    padding: '60px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#2C221E',
    margin: '20px 0 8px',
    fontFamily: "'Playfair Display', Georgia, serif"
  },
  processingSubtitle: { fontSize: 14, color: '#7A6F68', margin: '0 0 20px' },
  secureBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    background: '#E8F8F0',
    borderRadius: 20,
    fontSize: 12.5,
    color: '#27AE60',
    fontWeight: 600
  },

  failedCard: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #EFE7DF',
    padding: '50px 24px',
    textAlign: 'center',
    maxWidth: 540,
    margin: '40px auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
  },
  failedIconCircle: { marginBottom: 14 },
  failedTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#C0392B',
    margin: '0 0 8px',
    fontFamily: "'Playfair Display', Georgia, serif"
  },
  failedSubtitle: { fontSize: 14, color: '#7A6F68', margin: '0 0 24px' },
  failedActions: { display: 'flex', justifyContent: 'center', gap: 12 },
  retryBtn: {
    padding: '10px 22px',
    background: '#DE7356',
    color: '#FFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer'
  },
  changeMethodBtn: {
    padding: '10px 22px',
    background: '#FFFFFF',
    border: '1px solid #EFE7DF',
    color: '#2C221E',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer'
  },

  confirmedCard: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #EFE7DF',
    padding: '40px 32px',
    maxWidth: 640,
    margin: '20px auto',
    boxShadow: '0 4px 24px rgba(0,0,0,0.05)'
  },
  confirmedHeader: { textAlign: 'center', marginBottom: 28 },
  confirmedCheckCircle: { marginBottom: 12 },
  confirmedTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#2C221E',
    margin: '0 0 6px',
    fontFamily: "'Playfair Display', Georgia, serif"
  },
  confirmedSubtitle: { fontSize: 13.5, color: '#7A6F68', margin: 0 },
  confirmedDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    background: '#FAF4F0',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20
  },
  confCell: { display: 'flex', flexDirection: 'column', gap: 4 },
  confLabel: { fontSize: 11.5, color: '#7A6F68', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 },
  confVal: { fontSize: 13.5, color: '#2C221E', fontWeight: 600 },
  confValHighlight: { fontSize: 15, color: '#DE7356', fontWeight: 700 },
  confBadge: {
    display: 'inline-flex',
    alignSelf: 'flex-start',
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 11.5,
    fontWeight: 700
  },
  confAddressBox: {
    background: '#FFFFFF',
    border: '1px solid #EFE7DF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 24
  },
  confSecHeading: {
    fontSize: 14,
    fontWeight: 700,
    color: '#2C221E',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    margin: '0 0 8px'
  },
  confActions: { display: 'flex', gap: 14, justifyContent: 'center' },
  viewOrderBtn: {
    padding: '12px 24px',
    background: '#DE7356',
    color: '#FFF',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer'
  },
  continueBtn: {
    padding: '12px 24px',
    background: '#FFFFFF',
    border: '1px solid #EFE7DF',
    color: '#2C221E',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer'
  }
};
