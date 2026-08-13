import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Home, Briefcase, Check, X, Star } from 'lucide-react';
import { useToast } from '../../../components/common/Toast/useToast';
import { sanitizeAddresses, setDefaultAddress } from '../../../utils/addressUtils';

const accent = '#DE7356';

const DEFAULT_INITIAL = [
  {
    id: 'addr_1',
    type: 'Home',
    isDefault: true,
    name: 'Sri Vijaya Lakshmi',
    line1: '12-34, MG Road, Koramangala',
    line2: 'Bengaluru, Karnataka – 560034',
    phone: '+91 98765 43210'
  },
  {
    id: 'addr_2',
    type: 'Work',
    isDefault: false,
    name: 'Sri Vijaya Lakshmi',
    line1: 'Plot 7, Software Layout, ITPL Main Road',
    line2: 'Whitefield, Bengaluru – 560066',
    phone: '+91 98765 43210'
  }
];

const UserAddresses = () => {
  const toast = useToast();
  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem('userAddresses');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_INITIAL;
      return sanitizeAddresses(parsed);
    } catch (_) {
      return sanitizeAddresses(DEFAULT_INITIAL);
    }
  });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    type: 'Home',
    name: '',
    line1: '',
    line2: '',
    phone: '',
    isDefault: false
  });

  useEffect(() => {
    try {
      const sanitized = sanitizeAddresses(addresses);
      localStorage.setItem('userAddresses', JSON.stringify(sanitized));
    } catch (_) {}
  }, [addresses]);

  const handleMakeDefault = (id, type) => {
    const updated = setDefaultAddress(addresses, id);
    setAddresses(updated);
    toast.success(`${type || 'Address'} is now set as default delivery address`);
  };

  const handleDelete = (id, type) => {
    const filtered = addresses.filter(a => a.id !== id);
    const sanitized = sanitizeAddresses(filtered);
    setAddresses(sanitized);
    toast.info(`${type || 'Address'} removed`);
  };

  const handleOpenAdd = () => {
    if (addresses.length >= 4) {
      toast.warning('Maximum 4 delivery addresses can be saved.', 'Address Limit Reached');
      return;
    }
    setEditingId(null);
    setFormData({
      type: addresses.some(a => a.type === 'Home') ? 'Work' : 'Home',
      name: '',
      line1: '',
      line2: '',
      phone: '',
      isDefault: addresses.length === 0
    });
    setShowModal(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingId(addr.id);
    setFormData({
      type: addr.type || 'Home',
      name: addr.name || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      phone: addr.phone || '',
      isDefault: addr.isDefault || false
    });
    setShowModal(true);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.line1.trim() || !formData.phone.trim()) {
      toast.warning('Please fill in Name, Street Address, and Phone number.');
      return;
    }

    let updatedList = [];
    if (editingId) {
      // Edit mode
      updatedList = addresses.map(a => {
        if (a.id === editingId) {
          return { ...a, ...formData };
        }
        if (formData.isDefault) {
          return { ...a, isDefault: false };
        }
        return a;
      });
      toast.success('Address updated successfully!');
    } else {
      // Add mode
      const newAddr = {
        id: `addr_${Date.now()}`,
        ...formData
      };

      updatedList = [...addresses];
      if (formData.isDefault) {
        updatedList = updatedList.map(a => ({ ...a, isDefault: false }));
      }
      updatedList.push(newAddr);
      toast.success('New address added successfully!');
    }

    setAddresses(sanitizeAddresses(updatedList));
    setShowModal(false);
  };

  return (
    <div>
      <h2 style={S.title}>Saved Addresses</h2>
      <p style={{ fontSize: 13, color: '#7A6F68', margin: '-16px 0 20px' }}>
        Manage your delivery locations for faster luxury checkout. ({addresses.length} saved)
      </p>

      {addresses.length === 0 ? (
        <div style={S.emptyCard}>
          <MapPin size={36} color="#DE7356" style={{ marginBottom: 10 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2C221E', margin: '0 0 6px' }}>No Saved Addresses</h3>
          <p style={{ fontSize: 13, color: '#7A6F68', margin: '0 0 16px' }}>Add a delivery address to complete checkout faster.</p>
          <button style={S.addPrimaryBtn} onClick={handleOpenAdd}>
            <Plus size={16} /> Add New Address
          </button>
        </div>
      ) : (
        <div style={S.grid}>
          {addresses.map(addr => {
            const isHome = addr.type === 'Home';
            const AddrIcon = isHome ? Home : Briefcase;

            return (
              <div key={addr.id} style={S.card(addr.isDefault)}>
                <div style={S.iconWrap(addr.isDefault)}>
                  <AddrIcon size={20} />
                </div>

                <div style={S.info}>
                  <div style={S.row}>
                    <span style={S.badge(addr.isDefault)}>
                      {addr.isDefault ? 'DEFAULT' : (addr.type || 'HOME').toUpperCase()}
                    </span>
                  </div>
                  <div style={S.addrName}>{addr.name}</div>
                  <div style={S.addrText}>
                    {addr.line1}<br />
                    {addr.line2 && <>{addr.line2}<br /></>}
                    📞 {addr.phone}
                  </div>

                  <div style={S.actions}>
                    {!addr.isDefault && (
                      <button style={S.setDefaultBtn} onClick={() => handleMakeDefault(addr.id, addr.type)}>
                        <Star size={13} color="#DE7356" /> Set as Default
                      </button>
                    )}
                    <button style={S.iconBtn(false)} onClick={() => handleOpenEdit(addr)}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button style={S.iconBtn(true)} onClick={() => handleDelete(addr.id, addr.type)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {addresses.length < 4 && (
        <button style={S.addBtn} onClick={handleOpenAdd}>
          <Plus size={18} /> Add New Address
        </button>
      )}

      {/* Add / Edit Address Modal */}
      {showModal && (
        <div style={S.modalOverlay}>
          <div style={S.modalCard}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>{editingId ? 'Edit Address' : 'Add New Address'}</h3>
              <button style={S.closeBtn} onClick={() => setShowModal(false)}>
                <X size={18} color="#2C221E" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} style={S.modalBody}>
              <div style={S.formGroup}>
                <label style={S.label}>Address Label / Type</label>
                <select
                  style={S.input}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Recipient Name *</label>
                <input
                  style={S.input}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                  required
                />
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Street Address & House No. *</label>
                <input
                  style={S.input}
                  type="text"
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  placeholder="e.g. 12-34, MG Road, Koramangala"
                  required
                />
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>City, State & Pincode</label>
                <input
                  style={S.input}
                  type="text"
                  value={formData.line2}
                  onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                  placeholder="e.g. Bengaluru, Karnataka – 560034"
                />
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Contact Phone Number *</label>
                <input
                  style={S.input}
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="chkDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <label htmlFor="chkDefault" style={{ fontSize: 13, color: '#2C221E', cursor: 'pointer' }}>
                  Set as default delivery address
                </label>
              </div>

              <div style={S.modalFooter}>
                <button type="button" style={S.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={S.saveModalBtn}>
                  <Check size={16} /> Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const S = {
  title: { fontSize: 18, fontWeight: 700, color: '#2C221E', margin: '0 0 22px', fontFamily: "'Playfair Display', Georgia, serif" },
  grid: { display: 'flex', flexDirection: 'column', gap: 14 },
  card: (active) => ({
    border: `1.5px solid ${active ? accent : '#EFE7DF'}`,
    borderRadius: 14,
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    background: active ? '#FFF9F7' : '#FFFFFF',
    cursor: 'default',
    transition: 'border-color 0.2s'
  }),
  iconWrap: (active) => ({
    background: active ? '#FDEEE9' : '#F5EDE5',
    padding: 10,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: active ? accent : '#7A6F68',
    flexShrink: 0
  }),
  info: { flex: 1 },
  row: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge: (active) => ({
    background: active ? accent : '#E0D8D2',
    color: active ? '#FFF' : '#5A5148',
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 20,
    fontWeight: 700,
    letterSpacing: 0.5
  }),
  addrName: { fontSize: 15, fontWeight: 600, color: '#2C221E' },
  addrText: { fontSize: 13.5, color: '#6E655F', lineHeight: 1.6, margin: '6px 0 12px' },
  actions: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  setDefaultBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#DE7356', display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 12.5, padding: 0, fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600
  },
  iconBtn: (danger) => ({
    background: 'none', border: 'none', cursor: 'pointer',
    color: danger ? '#C0392B' : '#7A6F68',
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 13, padding: '4px 0',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 600
  }),
  addBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', padding: 14, marginTop: 14,
    background: '#FFFFFF', border: '1.5px dashed #DE7356',
    borderRadius: 10, color: '#DE7356',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  emptyCard: {
    background: '#FFFFFF', borderRadius: 16, border: '1px solid #EFE7DF',
    padding: '36px 20px', textAlign: 'center', display: 'flex',
    flexDirection: 'column', alignItems: 'center'
  },
  addPrimaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 20px', background: accent, color: '#FFFFFF',
    border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20
  },
  modalCard: {
    background: '#FFFFFF', borderRadius: 16, border: '1px solid #EFE7DF',
    width: '100%', maxWidth: 460, boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    overflow: 'hidden'
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: '#FAF4F0', borderBottom: '1px solid #EFE7DF'
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: '#2C221E', margin: 0, fontFamily: "'Playfair Display', Georgia, serif" },
  closeBtn: { border: 'none', background: 'transparent', cursor: 'pointer' },
  modalBody: { padding: 20, display: 'flex', flexDirection: 'column', gap: 14 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12.5, fontWeight: 600, color: '#4A3F38' },
  input: {
    width: '100%', height: 38, border: '1px solid #EFE7DF', borderRadius: 8,
    background: '#FAF4F0', padding: '0 12px', fontSize: 13, color: '#2C221E',
    outline: 'none', boxSizing: 'border-box'
  },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: '8px 16px', background: '#FFFFFF', border: '1px solid #EFE7DF', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#2C221E', cursor: 'pointer' },
  saveModalBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: accent, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }
};

export default UserAddresses;
