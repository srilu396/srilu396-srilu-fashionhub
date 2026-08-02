import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import Drawer from '../../components/admin/Drawer';
import { chatAPI } from '../../utils/api';
import { 
  User, ShoppingBag, Tag, MessageSquare, Send, CheckCheck, 
  Clock, Eye, UserCheck, UserX, TicketPercent, Calendar, 
  Mail, Phone, ShieldCheck, Heart, ShoppingCart, Award
} from 'lucide-react';

const CustomersManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'orders', 'coupons', 'chat'

  // Activity & Chat state
  const [activityData, setActivityData] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/customer`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCustomerDrawer = async (customer, tab = 'profile') => {
    setSelectedCustomer(customer);
    setActiveTab(tab);
    setDrawerOpen(true);
    fetchCustomerActivity(customer._id || customer.id);
    if (tab === 'chat') {
      fetchChatMessages(customer._id || customer.id);
    }
  };

  const fetchCustomerActivity = async (customerId) => {
    setActivityLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/users/${customerId}/activity`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setActivityData(data.activity);
      }
    } catch (err) {
      console.error('Error loading customer activity:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchChatMessages = async (customerId) => {
    try {
      const data = await chatAPI.getMessages(customerId);
      if (data.success && Array.isArray(data.messages)) {
        setChatMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedCustomer) return;
    const customerId = selectedCustomer._id || selectedCustomer.id;
    setChatSending(true);
    try {
      const data = await chatAPI.sendMessage({
        customerId,
        sender: 'admin',
        senderName: 'VIP Concierge',
        message: chatInput.trim()
      });
      if (data.success && data.chatMessage) {
        setChatMessages(prev => [...prev, data.chatMessage]);
        setChatInput('');
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
    } finally {
      setChatSending(false);
    }
  };

  const toggleCustomerStatus = async (customer) => {
    const targetId = String(customer._id || customer.id || '');
    if (!targetId) return;

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const adminToken = localStorage.getItem('adminToken');
      const newStatus = customer.status === 'inactive' ? 'active' : 'inactive';
      
      const response = await fetch(`${API_BASE}/api/customer/${targetId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        setCustomers(prev => prev.map(c => {
          const currentId = String(c._id || c.id || '');
          return currentId === targetId ? { ...c, status: newStatus } : c;
        }));
      }
    } catch (err) {
      console.error('Error updating customer status:', err);
    }
  };

  const columns = [
    {
      header: 'Customer Roster',
      accessor: (row) => `${row.firstName || ''} ${row.lastName || ''}`,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={styles.avatarCircle}>
            {((row.firstName || row.username || 'C').charAt(0)).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', color: '#F9F6F0' }}>
              {row.firstName ? `${row.firstName} ${row.lastName || ''}` : row.username}
            </span>
            <span style={{ fontSize: '12px', color: '#A0A0AB' }}>{row.email}</span>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Username',
      accessor: 'username',
      render: (row) => <span style={{ color: '#D4AF37', fontSize: '13px' }}>@{row.username}</span>
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => (
        <span style={{ textTransform: 'capitalize', color: '#A0A0AB', fontSize: '12px' }}>
          {row.role || 'customer'}
        </span>
      )
    },
    {
      header: 'Account Status',
      accessor: 'status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status || 'active'} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <ActionMenu
          items={[
            { 
              label: 'View Profile', 
              icon: <Eye size={14} color="#D4AF37" />,
              onClick: () => openCustomerDrawer(row, 'profile') 
            },
            { 
              label: 'View Orders', 
              icon: <ShoppingBag size={14} color="#D4AF37" />,
              onClick: () => openCustomerDrawer(row, 'orders') 
            },
            { 
              label: 'View Coupons', 
              icon: <TicketPercent size={14} color="#D4AF37" />,
              onClick: () => openCustomerDrawer(row, 'coupons') 
            },
            { 
              label: 'Live Concierge Chat', 
              icon: <MessageSquare size={14} color="#D4AF37" />,
              onClick: () => openCustomerDrawer(row, 'chat') 
            },
            { 
              label: row.status === 'inactive' ? 'Activate Account' : 'Deactivate Account', 
              icon: row.status === 'inactive' ? <UserCheck size={14} color="#10B981" /> : <UserX size={14} color="#EF4444" />,
              danger: row.status !== 'inactive',
              onClick: () => toggleCustomerStatus(row) 
            }
          ]}
        />
      )
    }
  ];

  return (
    <AdminLayout title="Customers Management">
      <PageHeader
        title="Customer Directory"
        subtitle="Manage client accounts, view purchase intelligence, and launch WhatsApp-style live concierge chat"
        breadcrumbs={[{ label: 'Customers' }]}
      />

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        onRowClick={(row) => openCustomerDrawer(row, 'profile')}
        searchPlaceholder="Search customers by name, email..."
        searchWidth="520px"
        filterKey="status"
        filterOptions={[
          { label: 'All Users', value: 'ALL' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' }
        ]}
        emptyTitle="No Customers Registered"
        emptyDescription="Registered user accounts will be listed here."
      />

      {/* Right-Side Slide-Over Customer Profile Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedCustomer?.firstName ? `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}` : selectedCustomer?.username || 'Client Profile'}
        subtitle={`@${selectedCustomer?.username || 'user'} • ${selectedCustomer?.email || ''}`}
        width="580px"
      >
        {selectedCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Drawer Header Badge Card */}
            <div style={styles.profileHeaderCard}>
              <div style={styles.avatarLarge}>
                {((selectedCustomer.firstName || selectedCustomer.username || 'C').charAt(0)).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={styles.profileName}>
                  {selectedCustomer.firstName ? `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}` : selectedCustomer.username}
                </h4>
                <div style={styles.profileMetaRow}>
                  <span style={styles.metaBadge}><Mail size={12} /> {selectedCustomer.email}</span>
                  {selectedCustomer.phone && (
                    <span style={styles.metaBadge}><Phone size={12} /> {selectedCustomer.phone}</span>
                  )}
                  <span style={styles.metaBadge}>
                    <Calendar size={12} /> Joined {new Date(selectedCustomer.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <StatusBadge status={selectedCustomer.status || 'active'} />
            </div>

            {/* Drawer Tab Header Bar */}
            <div style={styles.tabBar}>
              <button 
                onClick={() => setActiveTab('profile')} 
                style={{ ...styles.tabBtn, ...(activeTab === 'profile' ? styles.tabBtnActive : {}) }}
              >
                <User size={14} /> Profile
              </button>
              <button 
                onClick={() => setActiveTab('orders')} 
                style={{ ...styles.tabBtn, ...(activeTab === 'orders' ? styles.tabBtnActive : {}) }}
              >
                <ShoppingBag size={14} /> Orders ({activityData?.totalOrders || 0})
              </button>
              <button 
                onClick={() => setActiveTab('coupons')} 
                style={{ ...styles.tabBtn, ...(activeTab === 'coupons' ? styles.tabBtnActive : {}) }}
              >
                <Tag size={14} /> Coupons
              </button>
              <button 
                onClick={() => { setActiveTab('chat'); fetchChatMessages(selectedCustomer._id || selectedCustomer.id); }} 
                style={{ ...styles.tabBtn, ...(activeTab === 'chat' ? styles.tabBtnActive : {}) }}
              >
                <MessageSquare size={14} /> Live Chat
              </button>
            </div>

            {/* Tab 1: Profile */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={styles.cardBox}>
                  <div style={styles.cardHeaderRow}>
                    <ShieldCheck size={14} color="#D4AF37" />
                    <span style={styles.cardHeader}>Client Credentials</span>
                  </div>
                  <div style={styles.grid2}>
                    <div>
                      <span style={styles.label}>Full Name</span>
                      <span style={styles.val}>{selectedCustomer.firstName ? `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}` : 'N/A'}</span>
                    </div>
                    <div>
                      <span style={styles.label}>Email Address</span>
                      <span style={styles.val}>{selectedCustomer.email}</span>
                    </div>
                    <div>
                      <span style={styles.label}>Account Role</span>
                      <span style={styles.val}>{selectedCustomer.role || 'customer'}</span>
                    </div>
                    <div>
                      <span style={styles.label}>Status</span>
                      <StatusBadge status={selectedCustomer.status || 'active'} />
                    </div>
                  </div>
                </div>

                <div style={styles.cardBox}>
                  <div style={styles.cardHeaderRow}>
                    <Award size={14} color="#D4AF37" />
                    <span style={styles.cardHeader}>Intelligence Analytics</span>
                  </div>
                  {activityLoading ? (
                    <p style={{ color: '#A0A0AB', fontSize: '13px' }}>Loading analytics...</p>
                  ) : (
                    <div style={styles.grid2}>
                      <div style={styles.statMini}>
                        <span style={styles.statLabel}>Lifetime Orders</span>
                        <span style={styles.statVal}>{activityData?.totalOrders || 0}</span>
                      </div>
                      <div style={styles.statMini}>
                        <span style={styles.statLabel}>Total Expenditure</span>
                        <span style={styles.statVal}>₹{(activityData?.totalSpent || 0).toLocaleString('en-IN')}</span>
                      </div>
                      {activityData?.wishlistCount !== undefined && (
                        <div style={styles.statMini}>
                          <span style={styles.statLabel}>Wishlist Items</span>
                          <span style={styles.statVal}><Heart size={13} style={{ display: 'inline', marginRight: '4px' }} />{activityData.wishlistCount}</span>
                        </div>
                      )}
                      {activityData?.cartCount !== undefined && (
                        <div style={styles.statMini}>
                          <span style={styles.statLabel}>Active Cart</span>
                          <span style={styles.statVal}><ShoppingCart size={13} style={{ display: 'inline', marginRight: '4px' }} />{activityData.cartCount}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Orders */}
            {activeTab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activityData?.orders?.length > 0 ? (
                  activityData.orders.map((ord, i) => (
                    <div key={i} style={styles.cardBox}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#D4AF37', fontSize: '13px' }}>Order #{ord._id?.substring(0, 8)}</span>
                        <StatusBadge status={ord.status || 'delivered'} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#A0A0AB' }}>
                        <span><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />{new Date(ord.createdAt || Date.now()).toLocaleDateString()}</span>
                        <span style={{ color: '#F9F6F0', fontWeight: '700', fontSize: '13px' }}>₹{ord.totalAmount?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyState}>
                    <ShoppingBag size={28} color="#D4AF37" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0, color: '#A0A0AB', fontSize: '13px' }}>No orders placed yet by this client.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Coupons */}
            {activeTab === 'coupons' && (
              <div style={styles.cardBox}>
                <div style={styles.cardHeaderRow}>
                  <TicketPercent size={14} color="#D4AF37" />
                  <span style={styles.cardHeader}>Assigned VIP Coupons</span>
                </div>
                <p style={{ color: '#A0A0AB', fontSize: '13px', margin: '0 0 12px 0' }}>Client is eligible for all storewide active promotional codes.</p>
                <div style={styles.couponBadgeGrid}>
                  <div style={styles.couponCard}>
                    <span style={styles.couponCode}>SRILU10</span>
                    <span style={styles.couponDesc}>10% Off Storewide</span>
                    <span style={styles.couponStatus}>Active</span>
                  </div>
                  <div style={styles.couponCard}>
                    <span style={styles.couponCode}>WELCOMEVIP</span>
                    <span style={styles.couponDesc}>₹500 Off First Order</span>
                    <span style={styles.couponStatus}>Eligible</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Live Chat */}
            {activeTab === 'chat' && (
              <div style={styles.chatContainer}>
                {/* Chat Message Window */}
                <div style={styles.chatFeed}>
                  {chatMessages.length === 0 ? (
                    <div style={styles.chatEmpty}>
                      <MessageSquare size={32} color="#D4AF37" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: 0, color: '#A0A0AB', fontSize: '13px' }}>Start a live concierge discussion with {selectedCustomer.firstName || 'Client'}.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div key={i} style={{ ...styles.chatBubbleWrap, justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                          <div style={{ ...styles.chatBubble, ...(isAdmin ? styles.chatBubbleAdmin : styles.chatBubbleClient) }}>
                            <div style={styles.chatSender}>{isAdmin ? 'VIP Concierge' : (selectedCustomer.firstName || 'Customer')}</div>
                            <div style={styles.chatText}>{msg.message}</div>
                            <div style={styles.chatMeta}>
                              <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isAdmin && <CheckCheck size={12} color="#D4AF37" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* WhatsApp Chat Input Box */}
                <form onSubmit={handleSendChatMessage} style={styles.chatInputRow}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type concierge reply..."
                    style={styles.chatInputField}
                  />
                  <button type="submit" disabled={chatSending || !chatInput.trim()} style={styles.chatSendBtn}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </AdminLayout>
  );
};

const styles = {
  avatarCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    color: '#D4AF37',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px'
  },
  profileHeaderCard: {
    padding: '16px',
    backgroundColor: '#0D0D11',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  avatarLarge: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    color: '#D4AF37',
    border: '1px solid rgba(212, 175, 55, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '18px'
  },
  profileName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#F9F6F0',
    fontFamily: "'Playfair Display', serif"
  },
  profileMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '4px'
  },
  metaBadge: {
    fontSize: '11px',
    color: '#A0A0AB',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  tabBar: {
    display: 'flex',
    gap: '6px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '12px'
  },
  tabBtn: {
    padding: '8px 14px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    borderRadius: '6px',
    color: '#A0A0AB',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  tabBtnActive: {
    backgroundColor: '#0D0D11',
    border: '1px solid rgba(212, 175, 55, 0.4)',
    color: '#D4AF37',
    fontWeight: '600'
  },
  cardBox: {
    backgroundColor: '#0D0D11',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '16px'
  },
  cardHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '12px'
  },
  cardHeader: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  label: {
    fontSize: '10px',
    color: '#A0A0AB',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '2px'
  },
  val: {
    fontSize: '13px',
    color: '#F9F6F0',
    fontWeight: '600'
  },
  statMini: {
    backgroundColor: '#141419',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.04)'
  },
  statLabel: {
    fontSize: '10px',
    color: '#A0A0AB',
    textTransform: 'uppercase',
    display: 'block'
  },
  statVal: {
    fontSize: '16px',
    fontFamily: "'Playfair Display', serif",
    fontWeight: '700',
    color: '#D4AF37'
  },
  emptyState: {
    padding: '30px',
    textAlign: 'center',
    color: '#A0A0AB',
    fontSize: '13px',
    border: '1px dashed rgba(255,255,255,0.1)',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  couponBadgeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  couponCard: {
    backgroundColor: '#141419',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  couponCode: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: '0.5px'
  },
  couponDesc: {
    fontSize: '11px',
    color: '#A0A0AB'
  },
  couponStatus: {
    fontSize: '10px',
    color: '#10B981',
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: '2px'
  },
  /* WhatsApp Style Chat Styles */
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '420px',
    backgroundColor: '#0A0A0D',
    borderRadius: '10px',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    overflow: 'hidden'
  },
  chatFeed: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  chatEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center'
  },
  chatBubbleWrap: {
    display: 'flex',
    width: '100%'
  },
  chatBubble: {
    maxWidth: '80%',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    lineHeight: '1.4'
  },
  chatBubbleAdmin: {
    backgroundColor: '#1C1917',
    border: '1px solid rgba(212, 175, 55, 0.4)',
    color: '#F9F6F0',
    borderBottomRightRadius: '2px'
  },
  chatBubbleClient: {
    backgroundColor: '#18181B',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#E4E4E7',
    borderBottomLeftRadius: '2px'
  },
  chatSender: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: '2px',
    textTransform: 'uppercase'
  },
  chatText: {
    color: '#F9F6F0',
    whiteSpace: 'pre-wrap'
  },
  chatMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '4px',
    fontSize: '10px',
    color: '#A0A0AB',
    marginTop: '4px'
  },
  chatInputRow: {
    padding: '12px',
    backgroundColor: '#121217',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    gap: '8px'
  },
  chatInputField: {
    flex: 1,
    padding: '10px 14px',
    backgroundColor: '#070709',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '20px',
    color: '#F9F6F0',
    fontSize: '13px',
    outline: 'none'
  },
  chatSendBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#D4AF37',
    color: '#0D0D0E',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  }
};

export default CustomersManagement;