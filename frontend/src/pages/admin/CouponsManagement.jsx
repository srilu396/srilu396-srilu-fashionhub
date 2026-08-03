import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import Button from '../../components/admin/Button';
import Drawer from '../../components/admin/Drawer';
import CouponModal from '../../components/CouponModal';
import { couponAPI } from '../../utils/api';
import { Eye, Pencil, CheckCircle, XCircle, Trash2, Plus } from 'lucide-react';
import { useToast } from '../../components/common/Toast/useToast';

export const getCouponStatus = (coupon) => {
  if (coupon.active_status === false || coupon.isActive === false) return 'inactive';
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) return 'expired';
  return 'active';
};

const CouponsManagement = () => {
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await couponAPI.getAll();
      if (data.success && Array.isArray(data.coupons)) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
      toast.error('Failed to load coupons list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleToggleStatus = async (coupon) => {
    const couponId = coupon._id || coupon.id;
    const currentActive = coupon.active_status !== false && coupon.isActive !== false;
    try {
      await couponAPI.updateCoupon(couponId, { active_status: !currentActive });
      toast.info(`Coupon "${coupon.coupon_code || coupon.code}" status updated`, 'Coupon Updated');
      fetchCoupons();
    } catch (err) {
      console.error('Error toggling coupon status:', err);
      toast.error('Failed to update coupon status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCoupon) return;
    setDeleteLoading(true);
    try {
      await couponAPI.deleteCoupon(selectedCoupon._id || selectedCoupon.id);
      toast.success(`Coupon "${selectedCoupon.coupon_code || selectedCoupon.code}" deleted successfully`, 'Coupon Deleted');
      fetchCoupons();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error('Failed to delete coupon');
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setDrawerOpen(false);
      setSelectedCoupon(null);
    }
  };

  const handleEditSave = () => {
    toast.success('Coupon details updated successfully', 'Coupon Saved');
    setEditModalOpen(false);
    fetchCoupons();
  };

  const formattedCoupons = React.useMemo(() => {
    return coupons.map(c => ({ ...c, computedStatus: getCouponStatus(c) }));
  }, [coupons]);

  const columns = [
    {
      header: 'Coupon Code',
      accessor: (row) => row.coupon_code || row.code || '',
      render: (row) => {
        const code = row.coupon_code || row.code || 'N/A';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={styles.codeBadge}>{code}</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(code); }}
              style={styles.copyBtn}
              title="Copy Code"
            >
              {copiedCode === code ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        );
      },
      sortable: true
    },
    {
      header: 'Discount',
      accessor: (row) => `${row.discount_value || row.discount || 0}${row.discount_type === 'percentage' ? '%' : '$'}`,
      render: (row) => (
        <span style={{ fontWeight: '600', color: 'var(--admin-gold)', fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
          {row.discount_type === 'percentage'
            ? `${row.discount_value || row.discount || 0}% OFF`
            : `₹${Math.round(row.discount_value || row.discount || 0)} OFF`}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Validity Period',
      accessor: 'valid_until',
      render: (row) => {
        const validUntil = row.valid_until || row.expiryDate;
        if (!validUntil) return <span style={{ color: 'var(--admin-text-secondary)' }}>Never Expires</span>;
        const formatted = new Date(validUntil).toLocaleDateString();
        const isExpired = new Date(validUntil) < new Date();
        return (
          <span style={{ color: isExpired ? 'var(--admin-danger)' : 'var(--admin-text-secondary)' }}>
            {formatted} {isExpired ? '(Expired)' : ''}
          </span>
        );
      },
      sortable: true
    },
    {
      header: 'Usage Limit',
      accessor: (row) => `${row.used_count || 0} / ${row.usage_limit || '∞'}`,
      render: (row) => (
        <span style={{ color: 'var(--admin-text-secondary)' }}>
          {row.used_count || 0} used {row.usage_limit ? `(Max ${row.usage_limit})` : ''}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row) => getCouponStatus(row),
      align: 'center',
      render: (row) => <StatusBadge status={getCouponStatus(row)} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const isActive = row.active_status !== false && row.isActive !== false;
        return (
          <ActionMenu
            items={[
              { 
                label: 'View Rule Specification', 
                icon: <Eye size={14} color="var(--admin-gold)" />,
                onClick: () => { setSelectedCoupon(row); setDrawerOpen(true); } 
              },
              { 
                label: 'Edit Coupon', 
                icon: <Pencil size={14} color="var(--admin-gold)" />,
                onClick: () => { setSelectedCoupon(row); setEditModalOpen(true); } 
              },
              {
                label: isActive ? 'Deactivate Coupon' : 'Activate Coupon',
                icon: isActive ? <XCircle size={14} color="var(--admin-danger)" /> : <CheckCircle size={14} color="var(--admin-success, #10B981)" />,
                onClick: () => handleToggleStatus(row)
              },
              { 
                label: 'Delete Coupon', 
                icon: <Trash2 size={14} color="var(--admin-danger)" />,
                danger: true, 
                onClick: () => { setSelectedCoupon(row); setDeleteModalOpen(true); } 
              }
            ]}
          />
        );
      }
    }
  ];

  return (
    <AdminLayout title="Promotions & Offers">
      <PageHeader
        title="Coupons Management"
        subtitle="Create discount codes, set validity rules, and track promotional usage"
        breadcrumbs={[{ label: 'Coupons' }]}
        actions={
          <Button to="/admin/new-coupon" variant="primary" icon={<Plus size={15} />}>
            Create New Coupon
          </Button>
        }
      />

      {/* Coupons Table */}
      <DataTable
        columns={columns}
        data={formattedCoupons}
        loading={loading}
        onRowClick={(row) => { setSelectedCoupon(row); setDrawerOpen(true); }}
        searchPlaceholder="Search coupon codes..."
        filterKey="computedStatus"
        filterLabel="All Status"
        filterOptions={[
          { label: 'All Status', value: 'ALL' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Upcoming', value: 'upcoming' }
        ]}
        emptyTitle="No Coupons Created"
        emptyDescription="Generate discount codes to launch promotional campaigns."
      />

      {/* Edit Coupon Modal */}
      {editModalOpen && (
        <CouponModal
          coupon={selectedCoupon}
          isEditing={true}
          onClose={() => setEditModalOpen(false)}
          onSave={handleEditSave}
        />
      )}

      {/* Right-Side Coupon Details Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedCoupon?.coupon_code || selectedCoupon?.code || 'Coupon Rule Specification'}
        subtitle="Promotional Discount Details"
        width="480px"
      >
        {selectedCoupon && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: 'var(--admin-card-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--admin-border-gold)', textAlign: 'center' }}>
              <span style={styles.codeBadge}>{selectedCoupon.coupon_code || selectedCoupon.code}</span>
              <div style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '28px', color: 'var(--admin-gold)', fontWeight: '700', marginTop: '12px' }}>
                {selectedCoupon.discount_type === 'percentage' ? `${selectedCoupon.discount_value || selectedCoupon.discount || 0}% OFF` : `₹${selectedCoupon.discount_value || selectedCoupon.discount || 0} OFF`}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', display: 'block', marginTop: '4px' }}>
                {selectedCoupon.description || 'Promotional coupon code for checkout savings.'}
              </span>
            </div>

            <div style={{ backgroundColor: 'var(--admin-card-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--admin-gold)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Rules & Constraints</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Min Order Spend:</span>
                  <strong style={{ color: 'var(--admin-text-primary)' }}>₹{(selectedCoupon.min_order_value || selectedCoupon.minOrderAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Times Used:</span>
                  <strong style={{ color: 'var(--admin-text-primary)' }}>{selectedCoupon.used_count || 0} times</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Usage Limit:</span>
                  <strong style={{ color: 'var(--admin-text-primary)' }}>{selectedCoupon.usage_limit || 'Unlimited'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Expiry Date:</span>
                  <strong style={{ color: 'var(--admin-text-primary)' }}>{selectedCoupon.valid_until || selectedCoupon.expiryDate ? new Date(selectedCoupon.valid_until || selectedCoupon.expiryDate).toLocaleDateString() : 'Never'}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setDrawerOpen(false); setEditModalOpen(true); }}
                style={{ flex: 1, padding: '12px', backgroundColor: 'var(--admin-gold-muted)', color: 'var(--admin-gold)', border: '1px solid var(--admin-border-gold)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
              >
                Edit Coupon Rules
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                style={{ flex: 1, padding: '12px', backgroundColor: 'var(--admin-danger-bg)', color: 'var(--admin-danger)', border: '1px solid var(--admin-danger)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
              >
                Delete Coupon
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Coupon Offer"
        message={`Are you sure you want to delete coupon "${selectedCoupon?.coupon_code || selectedCoupon?.code}"? Customers will no longer be able to apply this discount.`}
        confirmText="Delete Coupon"
        danger={true}
        loading={deleteLoading}
      />
    </AdminLayout>
  );
};

const styles = {
  primaryBtn: {
    padding: '9px 16px',
    backgroundColor: 'var(--admin-gold)',
    color: 'var(--active-pill-text)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    textDecoration: 'none'
  },
  codeBadge: {
    padding: '4px 10px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '4px',
    color: 'var(--admin-gold)',
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: '13px',
    letterSpacing: '1px'
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-muted)',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '2px 4px'
  }
};

export default CouponsManagement;