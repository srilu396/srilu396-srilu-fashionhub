import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Tag, ShoppingBag, Star, Shield } from 'lucide-react';

const accent = '#DE7356';

const S = {
  title: { fontSize: 18, fontWeight: 700, color: '#2C221E', margin: '0 0 22px', fontFamily: "'Playfair Display', Georgia, serif" },
  row: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 0', borderBottom: '1px solid #F0E8E0',
  },
  icon: {
    background: '#F5EDE5', padding: 9, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#7A6F68', flexShrink: 0,
  },
  text: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: 600, color: '#2C221E', margin: '0 0 2px' },
  rowSub: { fontSize: 12.5, color: '#7A6F68', margin: 0 },
  toggle: (on) => ({
    width: 46, height: 26, borderRadius: 13,
    background: on ? accent : '#D6CCc5',
    border: 'none', cursor: 'pointer',
    position: 'relative', flexShrink: 0,
    transition: 'background 0.25s',
    padding: 0,
  }),
  knob: (on) => ({
    position: 'absolute',
    top: 3, left: on ? 23 : 3,
    width: 20, height: 20, borderRadius: '50%',
    background: '#FFFFFF',
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
    transition: 'left 0.25s',
  }),
};

const NOTIFICATIONS = [
  { id: 'email_promo', icon: Mail, title: 'Promotional Emails', desc: 'Sales, offers, and new arrivals', on: true },
  { id: 'sms', icon: MessageSquare, title: 'SMS Alerts', desc: 'Order updates via text message', on: false },
  { id: 'offers', icon: Tag, title: 'Exclusive Deals', desc: 'Flash sales and coupon notifications', on: true },
  { id: 'orders', icon: ShoppingBag, title: 'Order Status', desc: 'Shipping and delivery updates', on: true },
  { id: 'reviews', icon: Star, title: 'Review Reminders', desc: 'Prompts to review recent purchases', on: false },
  { id: 'security', icon: Shield, title: 'Security Alerts', desc: 'Login and account activity alerts', on: true },
];

const UserNotifications = () => {
  const [prefs, setPrefs] = useState(() => {
    const init = {};
    NOTIFICATIONS.forEach(n => { init[n.id] = n.on; });
    return init;
  });

  const toggle = (id) => setPrefs(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <h2 style={S.title}>Notification Preferences</h2>

      {NOTIFICATIONS.map(({ id, icon: Icon, title, desc }) => (
        <div key={id} style={S.row}>
          <div style={S.icon}><Icon size={18} /></div>
          <div style={S.text}>
            <p style={S.rowTitle}>{title}</p>
            <p style={S.rowSub}>{desc}</p>
          </div>
          <button style={S.toggle(prefs[id])} onClick={() => toggle(id)}>
            <span style={S.knob(prefs[id])} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default UserNotifications;
