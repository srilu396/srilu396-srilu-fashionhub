import React, { useState, useEffect } from 'react';
import { Tag, Copy, Percent, Calendar, Clock, Check, ChevronRight, Gift } from 'lucide-react';
import { useToast } from '../../../components/common/Toast/useToast';
import { useNavigate } from 'react-router-dom';

const accent = '#DE7356';

const UserCouponsTab = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('userToken');
      const res = await fetch(`${API_BASE}/api/coupons/available`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.coupons)) {
        setCoupons(data.coupons);
      } else {
        setCoupons(getFallbackCoupons());
      }
    } catch (err) {
      console.error('Error fetching available coupons:', err);
      setCoupons(getFallbackCoupons());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackCoupons = () => [
    {
      _id: 'c1',
      coupon_code: 'LUXURY20',
      discount_type: 'percentage',
      discount_value: 20,
      description: 'Get 20% OFF on luxury apparel & accessories',
      min_cart_value: 2000,
      valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'c2',
      coupon_code: 'WELCOME10',
      discount_type: 'percentage',
      discount_value: 10,
      description: 'Exclusive 10% OFF welcome reward for new clients',
      min_cart_value: 1000,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'c3',
      coupon_code: 'ATELIER500',
      discount_type: 'fixed',
      discount_value: 500,
      description: 'Flat ₹500 OFF on orders above ₹3,000',
      min_cart_value: 3000,
      valid_until: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleApplyCoupon = (coupon) => {
    localStorage.setItem('selectedCoupon', JSON.stringify({
      code: coupon.coupon_code,
      type: coupon.discount_type,
      value: coupon.discount_value,
      minOrder: coupon.min_cart_value || coupon.min_order_value || 0,
      description: coupon.description
    }));
    toast.success(`Coupon ${coupon.coupon_code} applied! Proceed to cart or checkout.`, 'Coupon Applied');
  };

  return (
    <div>
      <h2 style={S.title}>Exclusive Coupons</h2>
      <p style={{ fontSize: 13, color: '#7A6F68', margin: '-16px 0 20px' }}>
        Browse available promotional offers and apply them directly at checkout.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#DE7356' }}>
          Loading available coupons...
        </div>
      ) : (
        <div style={S.scrollContainer}>
          {coupons.map((coupon) => (
            <div key={coupon._id || coupon.coupon_code} style={S.card}>
              <div style={S.cardHeader}>
                <div style={S.codeBadge}>
                  <Tag size={14} color="#DE7356" />
                  <span style={S.codeText}>{coupon.coupon_code}</span>
                </div>
                <button style={S.copyBtn} onClick={() => handleCopyCode(coupon.coupon_code)}>
                  {copiedCode === coupon.coupon_code ? <Check size={14} color="#4CAF50" /> : <Copy size={14} />}
                  {copiedCode === coupon.coupon_code ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div style={S.discountRow}>
                <span style={S.discountVal}>
                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                </span>
                {(coupon.min_cart_value || coupon.min_order_value) > 0 && (
                  <span style={S.minOrder}>
                    Min. spend ₹{coupon.min_cart_value || coupon.min_order_value}
                  </span>
                )}
              </div>

              <p style={S.desc}>{coupon.description}</p>

              <div style={S.cardFooter}>
                <div style={S.expiry}>
                  <Calendar size={13} color="#7A6F68" />
                  <span>Expires {new Date(coupon.valid_until || Date.now()).toLocaleDateString()}</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={S.applyBtn} onClick={() => handleApplyCoupon(coupon)}>
                    <Gift size={14} /> Apply
                  </button>
                  <button style={S.cartBtn} onClick={() => { handleApplyCoupon(coupon); navigate('/user/cart'); }}>
                    Cart <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const S = {
  title: { fontSize: 18, fontWeight: 700, color: '#2C221E', margin: '0 0 22px', fontFamily: "'Playfair Display', Georgia, serif" },
  scrollContainer: {
    maxHeight: 460,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    paddingRight: 6
  },
  card: {
    border: '1.5px solid #EFE7DF',
    borderRadius: 14,
    padding: '16px 18px',
    background: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  codeBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#FDEEE9', border: '1px solid rgba(222,115,86,0.3)',
    borderRadius: 8, padding: '4px 10px'
  },
  codeText: { fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#DE7356', letterSpacing: 0.5 },
  copyBtn: {
    background: 'none', border: '1px solid #EFE7DF', borderRadius: 6,
    padding: '4px 10px', fontSize: 12, color: '#7A6F68', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600
  },
  discountRow: { display: 'flex', alignItems: 'baseline', gap: 10 },
  discountVal: { fontSize: 18, fontWeight: 700, color: '#2C221E', fontFamily: "'Playfair Display', Georgia, serif" },
  minOrder: { fontSize: 12, color: '#7A6F68', background: '#FAF4F0', padding: '2px 8px', borderRadius: 12 },
  desc: { fontSize: 13, color: '#5A5148', margin: 0, lineHeight: 1.4 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  expiry: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#7A6F68' },
  applyBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: '#DE7356', color: '#FFF', border: 'none',
    borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
  },
  cartBtn: {
    display: 'flex', alignItems: 'center', gap: 2,
    background: '#FAF4F0', color: '#2C221E', border: '1px solid #EFE7DF',
    borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
  }
};

export default UserCouponsTab;
