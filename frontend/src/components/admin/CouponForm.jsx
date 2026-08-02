import React, { useState, useEffect, useMemo } from 'react';
import SelectDropdown from './SelectDropdown';
import StatusBadge from './StatusBadge';

const CouponForm = ({
  initialData = null,
  isEditing = false,
  onSubmit,
  onCancel,
  loading = false,
  submitText = null,
  showCancel = false
}) => {
  const [formData, setFormData] = useState({
    coupon_code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_cart_value: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    usage_limit_total: '100',
    active_status: true
  });

  useEffect(() => {
    if (initialData) {
      // Format valid_from and valid_until to YYYY-MM-DD format for date input
      const formatDate = (val) => {
        if (!val) return '';
        try {
          return new Date(val).toISOString().split('T')[0];
        } catch {
          return val;
        }
      };

      setFormData({
        coupon_code: initialData.coupon_code || initialData.code || '',
        discount_type: initialData.discount_type || 'percentage',
        discount_value: initialData.discount_value !== undefined ? initialData.discount_value : (initialData.discount || ''),
        min_cart_value: initialData.min_cart_value !== undefined ? initialData.min_cart_value : (initialData.minOrderAmount || ''),
        valid_from: formatDate(initialData.valid_from || initialData.startDate) || new Date().toISOString().split('T')[0],
        valid_until: formatDate(initialData.valid_until || initialData.expiryDate),
        usage_limit_total: initialData.usage_limit || initialData.usage_limit_total || '100',
        active_status: initialData.active_status !== false && initialData.isActive !== false
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  // Memoized live preview status calculation
  const statusPreview = useMemo(() => {
    if (!formData.active_status) {
      return { statusKey: 'inactive', label: 'Inactive', color: '#9CA3AF', bg: 'rgba(107, 114, 128, 0.15)', border: 'rgba(107, 114, 128, 0.3)', subText: 'Manually deactivated' };
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (formData.valid_until && formData.valid_until < todayStr) {
      return { statusKey: 'inactive', label: 'Inactive', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', subText: 'Expired coupon' };
    }
    if (formData.valid_from && formData.valid_from > todayStr) {
      const formattedStart = new Date(formData.valid_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      return { statusKey: 'upcoming', label: 'Upcoming', color: '#60A5FA', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', subText: `Starts on ${formattedStart}` };
    }
    return { statusKey: 'active', label: 'Active', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', subText: 'Ready for use' };
  }, [formData.active_status, formData.valid_from, formData.valid_until]);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'LUXE';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, coupon_code: code }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        ...formData,
        coupon_code: formData.coupon_code.toUpperCase(),
        discount_value: parseFloat(formData.discount_value),
        min_cart_value: formData.min_cart_value ? parseFloat(formData.min_cart_value) : 0,
        usage_limit: formData.usage_limit_total ? parseInt(formData.usage_limit_total, 10) : 100
      });
    }
  };

  return (
    <div style={styles.formLayout}>
      {/* Left Column: Form Controls */}
      <form onSubmit={handleFormSubmit} style={styles.formContainer}>
        <div style={styles.formSection}>
          <h3 style={styles.sectionHeading}>Coupon Code & Discount</h3>

          <div style={styles.inputGroup}>
            <div style={styles.labelRow}>
              <label style={styles.label} htmlFor="coupon_code">Coupon Code *</label>
              <button type="button" onClick={generateRandomCode} style={styles.genBtn}>
                ⚡ Generate Random Code
              </button>
            </div>
            <input
              id="coupon_code"
              type="text"
              name="coupon_code"
              value={formData.coupon_code}
              onChange={handleChange}
              placeholder="e.g. SUMMER25"
              required
              style={{ ...styles.input, textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: '700' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={styles.inputGroup}>
              <SelectDropdown
                label="Discount Type"
                required
                searchable={false}
                value={formData.discount_type}
                onChange={(val) => setFormData(prev => ({ ...prev, discount_type: val }))}
                options={[
                  { label: 'Percentage OFF (%)', value: 'percentage' },
                  { label: 'Fixed Amount OFF (₹)', value: 'fixed' }
                ]}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="discount_value">
                {formData.discount_type === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
              </label>
              <input
                id="discount_value"
                type="number"
                step="0.01"
                name="discount_value"
                value={formData.discount_value}
                onChange={handleChange}
                placeholder={formData.discount_type === 'percentage' ? '20' : '500.00'}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="min_cart_value">Minimum Cart Order Value (₹)</label>
            <input
              id="min_cart_value"
              type="number"
              step="1"
              name="min_cart_value"
              value={formData.min_cart_value}
              onChange={handleChange}
              placeholder="1000"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.formSection}>
          <h3 style={styles.sectionHeading}>Validity & Usage Limits</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="valid_from">Valid From Date</label>
              <input
                id="valid_from"
                type="date"
                name="valid_from"
                aria-label="Valid From Date"
                value={formData.valid_from}
                onChange={handleChange}
                style={styles.dateInput}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="valid_until">Expiration Date</label>
              <input
                id="valid_until"
                type="date"
                name="valid_until"
                aria-label="Expiration Date"
                value={formData.valid_until}
                onChange={handleChange}
                style={styles.dateInput}
              />
            </div>
          </div>

          {/* Status Preview Box */}
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            backgroundColor: statusPreview.bg,
            border: `1px solid ${statusPreview.border}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#A0A0AB', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
                Status Preview:
              </span>
              <StatusBadge status={statusPreview.statusKey} customLabel={statusPreview.label} />
            </div>
            <span style={{ fontSize: '12px', color: statusPreview.color, fontWeight: '500' }}>
              {statusPreview.subText}
            </span>
          </div>

          <div style={{ ...styles.inputGroup, marginTop: '16px' }}>
            <label style={styles.label} htmlFor="usage_limit_total">Max Total Redemption Count</label>
            <input
              id="usage_limit_total"
              type="number"
              name="usage_limit_total"
              value={formData.usage_limit_total}
              onChange={handleChange}
              placeholder="100"
              style={styles.input}
            />
          </div>

          <label style={{ ...styles.checkboxLabel, marginTop: '8px' }}>
            <input
              type="checkbox"
              name="active_status"
              checked={formData.active_status}
              onChange={handleChange}
              style={styles.checkbox}
            />
            <span>Activate Coupon Immediately Upon Creation</span>
          </label>
        </div>

        <div style={styles.buttonRow}>
          {showCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={styles.secondaryBtn}
            >
              Cancel
            </button>
          )}
          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? (isEditing ? 'Saving Changes...' : 'Creating Coupon...') : (submitText || (isEditing ? 'Update Coupon Rules' : 'Publish Promotional Coupon'))}
          </button>
        </div>
      </form>

      {/* Right Column: Live Voucher Ticket Preview */}
      <div style={styles.previewContainer}>
        <h4 style={styles.previewHeader}>Live Voucher Preview</h4>
        <div style={styles.ticketCard}>
          <div style={styles.ticketTop}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={styles.ticketTag}>SPECIAL PROMOTION</span>
              <StatusBadge status={statusPreview.statusKey} customLabel={statusPreview.label} />
            </div>
            <h3 style={styles.ticketCode}>
              {formData.coupon_code.toUpperCase() || 'PROMO2026'}
            </h3>
            <div style={styles.ticketDiscount}>
              {formData.discount_type === 'percentage'
                ? `${formData.discount_value || '0'}% OFF`
                : `₹${parseFloat(formData.discount_value || 0).toFixed(2)} OFF`}
            </div>
          </div>

          <div style={styles.ticketDottedLine} />

          <div style={styles.ticketBottom}>
            <p style={styles.ticketDetail}>
              Min Order: {formData.min_cart_value ? `₹${formData.min_cart_value}` : 'No minimum'}
            </p>
            <p style={styles.ticketDetail}>
              Expires: {formData.valid_until ? new Date(formData.valid_until).toLocaleDateString('en-GB') : 'Never'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  formLayout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '32px',
    alignItems: 'start'
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  formSection: {
    backgroundColor: '#141417',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  sectionHeading: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '16px',
    fontWeight: '600',
    color: '#F9F6F0',
    margin: '0 0 4px 0'
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  genBtn: {
    background: 'none',
    border: 'none',
    color: '#D4AF37',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: '#D4AF37'
  },
  input: {
    padding: '11px 14px',
    backgroundColor: '#0D0D0E',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    color: '#F9F6F0',
    fontSize: '13px',
    outline: 'none'
  },
  dateInput: {
    padding: '11px 14px',
    backgroundColor: '#0D0D0E',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '8px',
    color: '#F9F6F0',
    fontSize: '13px',
    fontFamily: "'Sora', sans-serif",
    outline: 'none',
    colorScheme: 'dark',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#A0A0AB',
    cursor: 'pointer'
  },
  checkbox: {
    accentColor: '#D4AF37',
    width: '15px',
    height: '15px'
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  primaryBtn: {
    padding: '12px 24px',
    backgroundColor: '#D4AF37',
    color: '#0D0D0E',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  secondaryBtn: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#F9F6F0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  previewContainer: {
    position: 'sticky',
    top: '90px'
  },
  previewHeader: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '14px',
    fontWeight: '600',
    color: '#A0A0AB',
    margin: '0 0 12px 0',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  ticketCard: {
    backgroundColor: '#141417',
    border: '1px dashed rgba(212, 175, 55, 0.4)',
    borderRadius: '10px',
    padding: '24px',
    textAlign: 'center',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)'
  },
  ticketTop: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  ticketTag: {
    fontSize: '10px',
    color: '#D4AF37',
    fontWeight: '700',
    letterSpacing: '1.5px'
  },
  ticketCode: {
    fontFamily: 'monospace',
    fontSize: '24px',
    fontWeight: '700',
    color: '#F9F6F0',
    margin: 0,
    letterSpacing: '3px'
  },
  ticketDiscount: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '28px',
    fontWeight: '700',
    color: '#D4AF37'
  },
  ticketDottedLine: {
    height: '1px',
    borderTop: '1px stroke rgba(255, 255, 255, 0.1)',
    margin: '16px 0'
  },
  ticketBottom: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  ticketDetail: {
    fontSize: '11px',
    color: '#A0A0AB',
    margin: 0
  }
};

export default CouponForm;
