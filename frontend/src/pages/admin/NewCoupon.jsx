import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import CouponForm from '../../components/admin/CouponForm';
import { couponAPI } from '../../utils/api';

const NewCoupon = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await couponAPI.createCoupon(payload);
      setMessage({ text: 'Coupon offer created successfully!', type: 'success' });
      setTimeout(() => navigate('/admin/coupons'), 1200);
    } catch (err) {
      console.error('Error creating coupon:', err);
      setMessage({ text: err.message || 'Error creating coupon.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Promotions Engine">
      <PageHeader
        title="Create Promotional Coupon"
        subtitle="Configure discount rules, cart thresholds, and promo validity periods"
        breadcrumbs={[
          { label: 'Coupons', path: '/admin/coupons' },
          { label: 'New Coupon' }
        ]}
        actions={
          <Link to="/admin/coupons" style={styles.secondaryBtn}>
            ← Back to Coupons
          </Link>
        }
      />

      {message.text && (
        <div style={{
          ...styles.messageBox,
          backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          borderColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          color: message.type === 'success' ? '#10B981' : '#EF4444'
        }}>
          {message.text}
        </div>
      )}

      <CouponForm
        isEditing={false}
        onSubmit={handleSubmit}
        loading={loading}
        submitText="Publish Promotional Coupon"
      />
    </AdminLayout>
  );
};

const styles = {
  secondaryBtn: {
    padding: '9px 16px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#F9F6F0',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textDecoration: 'none'
  },
  messageBox: {
    padding: '12px 16px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '13px',
    marginBottom: '24px'
  }
};

export default NewCoupon;