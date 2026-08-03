import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import CouponForm from '../../components/admin/CouponForm';
import { couponAPI } from '../../utils/api';
import { useToast } from '../../components/common/Toast/useToast';

const NewCoupon = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    setLoading(true);

    try {
      await couponAPI.createCoupon(payload);
      toast.success('Changes have been saved.', 'Coupon Created');
      setTimeout(() => navigate('/admin/coupons'), 1200);
    } catch (err) {
      console.error('Error creating coupon:', err);
      toast.error(err.message || 'Error creating coupon.', 'Coupon Error');
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
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    color: 'var(--admin-text-primary)',
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