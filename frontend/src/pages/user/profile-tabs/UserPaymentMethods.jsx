import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Check, X, ShieldCheck } from 'lucide-react';
import { useToast } from '../../../components/common/Toast/useToast';

const accent = '#DE7356';

const DEFAULT_DEMO_CARDS = [
  {
    id: 'card_demo_1',
    name: 'Demo Card (Visa)',
    number: '•••• •••• •••• 4242',
    expiry: 'Exp: 12/30',
    isDefault: true
  }
];

const UserPaymentMethods = () => {
  const toast = useToast();
  const [cards, setCards] = useState(() => {
    try {
      const saved = localStorage.getItem('userPaymentCards');
      return saved ? JSON.parse(saved) : DEFAULT_DEMO_CARDS;
    } catch (_) {
      return DEFAULT_DEMO_CARDS;
    }
  });

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Demo Platinum Card',
    number: '4242 4242 4242 4242',
    expiry: '12/30',
    isDefault: false
  });

  useEffect(() => {
    try {
      localStorage.setItem('userPaymentCards', JSON.stringify(cards));
    } catch (_) {}
  }, [cards]);

  const handleDelete = (id) => {
    const updated = cards.filter(c => c.id !== id);
    if (updated.length > 0 && !updated.some(c => c.isDefault)) {
      updated[0].isDefault = true;
    }
    setCards(updated);
    toast.info('Demo payment method removed');
  };

  const handleSaveCard = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.number.trim() || !formData.expiry.trim()) {
      toast.warning('Please fill in demo card details.');
      return;
    }

    const last4 = formData.number.trim().slice(-4) || '4242';
    const newCard = {
      id: `card_${Date.now()}`,
      name: formData.name,
      number: `•••• •••• •••• ${last4}`,
      expiry: `Exp: ${formData.expiry}`,
      isDefault: cards.length === 0 || formData.isDefault
    };

    let updated = [...cards];
    if (newCard.isDefault) {
      updated = updated.map(c => ({ ...c, isDefault: false }));
    }
    updated.push(newCard);

    setCards(updated);
    toast.success('New demo payment method added!');
    setShowModal(false);
    setFormData({ name: 'Demo Platinum Card', number: '4242 4242 4242 4242', expiry: '12/30', isDefault: false });
  };

  return (
    <div>
      <h2 style={S.title}>Payment Preferences & Demo Methods</h2>

      <div style={S.infoBanner}>
        <ShieldCheck size={18} color="#27AE60" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ fontSize: 13.5, color: '#2C221E' }}>Portfolio Demo Payment System</strong>
          <p style={{ fontSize: 12.5, color: '#7A6F68', margin: '2px 0 0' }}>
            Checkout supports Cash on Delivery and Demo Online Payment (UPI & Card). Saved methods are optional convenience preferences for portfolio demonstration. No real financial credentials or CVVs are stored.
          </p>
        </div>
      </div>

      {cards.length === 0 ? (
        <div style={S.emptyBox}>
          <div style={S.emptyIconWrap}>
            <CreditCard size={32} color="#DE7356" />
          </div>
          <h3 style={S.emptyTitle}>No Demo Payment Methods Saved</h3>
          <p style={S.emptyDesc}>Add a demo card preference for simulated portfolio checkout.</p>
          <button style={S.addPrimaryBtn} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Demo Payment Method
          </button>
        </div>
      ) : (
        <div>
          <div style={S.grid}>
            {cards.map(card => (
              <div key={card.id} style={S.card(card.isDefault)}>
                <div style={S.cardIcon(card.isDefault)}>
                  <CreditCard size={24} />
                </div>
                <div style={S.cardInfo}>
                  <div style={S.cardName(card.isDefault)}>{card.name}</div>
                  <div style={S.cardNum(card.isDefault)}>{card.number}</div>
                  <div style={S.cardExpiry(card.isDefault)}>{card.expiry} • Portfolio Demo</div>
                </div>
                <div style={S.actions}>
                  {card.isDefault ? (
                    <span style={S.defaultBadge}>DEFAULT</span>
                  ) : (
                    <button style={S.deleteBtn} onClick={() => handleDelete(card.id)}>
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button style={S.addBtn} onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add New Demo Method
          </button>
        </div>
      )}

      {/* Add Demo Card Modal */}
      {showModal && (
        <div style={S.modalOverlay}>
          <div style={S.modalCard}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>Add Demo Payment Method</h3>
              <button style={S.closeBtn} onClick={() => setShowModal(false)}>
                <X size={18} color="#2C221E" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} style={S.modalBody}>
              <div style={S.formGroup}>
                <label style={S.label}>Demo Method Label *</label>
                <input
                  style={S.input}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Demo Platinum Card"
                  required
                />
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Demo Card Number *</label>
                <input
                  style={S.input}
                  type="text"
                  maxLength={19}
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="4242 4242 4242 4242"
                  required
                />
                <span style={{ fontSize: 11.5, color: '#7A6F68', marginTop: 2 }}>
                  Only last 4 digits will be referenced for portfolio display.
                </span>
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Expiry Date (MM/YY) *</label>
                <input
                  style={S.input}
                  type="text"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={formData.expiry}
                  onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="chkCardDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <label htmlFor="chkCardDefault" style={{ fontSize: 13, color: '#2C221E', cursor: 'pointer' }}>
                  Set as default demo payment method
                </label>
              </div>

              <div style={S.modalFooter}>
                <button type="button" style={S.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={S.saveModalBtn}>
                  <Check size={16} /> Save Demo Preference
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
  title: { fontSize: 18, fontWeight: 700, color: '#2C221E', margin: '0 0 16px', fontFamily: "'Playfair Display', Georgia, serif" },
  infoBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    background: '#E8F8F0',
    border: '1px solid #C3E6CB',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 20
  },
  grid: { display: 'flex', flexDirection: 'column', gap: 14 },
  card: (active) => ({
    borderRadius: 16,
    padding: '22px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    background: active
      ? 'linear-gradient(135deg, #2C221E 0%, #4A3020 100%)'
      : '#FFFFFF',
    border: active ? 'none' : '1.5px solid #EFE7DF',
    boxShadow: active ? '0 6px 24px rgba(44,34,30,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'all 0.2s'
  }),
  cardIcon: (active) => ({
    background: active ? 'rgba(255,255,255,0.12)' : '#FDEEE9',
    padding: 12, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: active ? '#FFF' : accent,
    flexShrink: 0
  }),
  cardInfo: { flex: 1 },
  cardName: (active) => ({ fontSize: 15, fontWeight: 600, color: active ? '#FFF' : '#2C221E', margin: '0 0 4px' }),
  cardNum: (active) => ({ fontSize: 13.5, color: active ? 'rgba(255,255,255,0.6)' : '#7A6F68' }),
  cardExpiry: (active) => ({ fontSize: 12, color: active ? 'rgba(255,255,255,0.5)' : '#9A8F88', marginTop: 2 }),
  actions: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 },
  defaultBadge: {
    background: accent, color: '#FFF',
    fontSize: 10, padding: '3px 9px', borderRadius: 20,
    fontWeight: 700, letterSpacing: 0.5
  },
  deleteBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(192,57,43,0.75)', display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 12, padding: 0, fontFamily: 'Inter, system-ui, sans-serif'
  },
  addBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', padding: 14, marginTop: 14,
    background: '#FFFFFF', border: '1.5px dashed #DE7356',
    borderRadius: 10, color: '#DE7356',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  emptyBox: {
    background: '#FFFFFF', borderRadius: 16, border: '1px solid #EFE7DF',
    padding: '40px 24px', textAlign: 'center', display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: '50%', background: '#FDEEE9',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14
  },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#2C221E', margin: '0 0 6px', fontFamily: "'Playfair Display', Georgia, serif" },
  emptyDesc: { fontSize: 13, color: '#7A6F68', margin: '0 0 18px' },
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
    width: '100%', maxWidth: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
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

export default UserPaymentMethods;
