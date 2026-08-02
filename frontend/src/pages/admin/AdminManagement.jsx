import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import Drawer from '../../components/admin/Drawer';
import Button from '../../components/admin/Button';
import { chatAPI } from '../../utils/api';
import { 
  Pencil, UserX, UserCheck, Trash2, MessageCircle, 
  Send, CheckCheck, Eye, EyeOff, ShieldCheck, Mail, User, Clock, Plus
} from 'lucide-react';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Admin Chat Drawer state
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [selectedAdminForChat, setSelectedAdminForChat] = useState(null);
  const [adminChatMessages, setAdminChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    permissions: ['products', 'orders', 'customers', 'coupons', 'admins']
  });

  const currentAdmin = JSON.parse(localStorage.getItem('adminUser') || 'null');
  const isMainAdminUser = currentAdmin?.isMainAdmin || currentAdmin?.email === 'admin@srilufashionhub.com' || currentAdmin?.role === 'superadmin';

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openAdminChat = async (admin) => {
    setSelectedAdminForChat(admin);
    setChatDrawerOpen(true);
    fetchAdminMessages(admin._id);
  };

  const fetchAdminMessages = async (adminId) => {
    try {
      const data = await chatAPI.getMessages(adminId);
      if (data.success && Array.isArray(data.messages)) {
        setAdminChatMessages(data.messages);
      } else {
        setAdminChatMessages([]);
      }
    } catch (err) {
      console.error('Error fetching admin chat messages:', err);
      setAdminChatMessages([]);
    }
  };

  const handleSendAdminChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedAdminForChat) return;
    const targetId = selectedAdminForChat._id;
    setChatSending(true);
    try {
      const data = await chatAPI.sendMessage({
        customerId: targetId,
        sender: 'admin',
        senderName: currentAdmin?.firstName ? `${currentAdmin.firstName} (Admin)` : 'Main Admin',
        message: chatInput.trim()
      });
      if (data.success && data.chatMessage) {
        setAdminChatMessages(prev => [...prev, data.chatMessage]);
        setChatInput('');
      }
    } catch (err) {
      console.error('Error sending admin message:', err);
    } finally {
      setChatSending(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePermissionToggle = (perm) => {
    setFormData((prev) => {
      const current = prev.permissions || [];
      const updated = current.includes(perm)
        ? current.filter(p => p !== perm)
        : [...current, perm];
      return { ...prev, permissions: updated };
    });
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/admins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Admin account created successfully!');
        setFormData({
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          password: '',
          permissions: ['products', 'orders', 'customers', 'coupons', 'admins']
        });
        setTimeout(() => {
          setModalOpen(false);
          setSuccessMsg('');
          fetchAdmins();
        }, 1200);
      } else {
        setError(data.message || 'Failed to create admin account.');
      }
    } catch (err) {
      console.error('Create admin error:', err);
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('adminToken');
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const res = await fetch(`${API_BASE}/api/admin/admins/${adminId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchAdmins();
      } else {
        alert(data.message || 'Failed to update admin status.');
      }
    } catch (err) {
      console.error('Status toggle error:', err);
    }
  };

  const handleDeleteAdmin = async (adminId, isMainAdmin) => {
    if (isMainAdmin) {
      alert('Main Administrator account cannot be deleted.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this admin account?')) return;

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/admins/${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchAdmins();
      } else {
        alert(data.message || 'Failed to delete admin account.');
      }
    } catch (err) {
      console.error('Delete admin error:', err);
    }
  };

  const adminColumns = [
    {
      header: 'Administrator Name',
      accessor: (row) => `${row.firstName || ''} ${row.lastName || ''}`,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.avatarCircle}>
            {(row.firstName || row.username || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: '600', color: '#F9F6F0' }}>
                {row.firstName} {row.lastName}
              </span>
              {row.isMainAdmin ? (
                <span style={styles.mainBadge}>MAIN ADMIN</span>
              ) : (
                <span style={styles.subBadge}>SUB ADMIN</span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#A0A0AB' }}>@{row.username}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Email Address',
      accessor: 'email',
      render: (row) => <span style={{ color: '#D4AF37' }}>{row.email}</span>
    },
    {
      header: 'Status',
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
              label: 'Direct Admin Chat',
              icon: <MessageCircle size={14} color="#D4AF37" />,
              onClick: () => openAdminChat(row)
            },
            ...(isMainAdminUser && !row.isMainAdmin ? [
              {
                label: row.status === 'active' ? 'Deactivate Admin' : 'Activate Admin',
                icon: row.status === 'active' ? <UserX size={14} color="#EF4444" /> : <UserCheck size={14} color="#10B981" />,
                danger: row.status === 'active',
                onClick: () => handleToggleStatus(row._id, row.status)
              },
              {
                label: 'Delete Admin',
                icon: <Trash2 size={14} color="#EF4444" />,
                danger: true,
                onClick: () => handleDeleteAdmin(row._id, row.isMainAdmin)
              }
            ] : [])
          ]}
        />
      )
    }
  ];

  return (
    <AdminLayout title="Admin Management">
      <PageHeader
        title="Admin Management"
        subtitle="Manage administrator accounts and access credentials."
        breadcrumbs={[{ label: 'Admins' }]}
        actions={
          isMainAdminUser ? (
            <Button
              onClick={() => setModalOpen(true)}
              variant="primary"
              icon={<Plus size={15} />}
            >
               Add Admin
            </Button>
          ) : (
            <span style={{ fontSize: '13px', color: '#B07D3A', fontWeight: '600', fontStyle: 'italic' }}>
              Main Admin Rights Required
            </span>
          )
        }
      />

      {!isMainAdminUser && (
        <div style={{
          padding: '12px 18px',
          backgroundColor: 'rgba(176, 125, 58, 0.12)',
          border: '1px solid rgba(176, 125, 58, 0.3)',
          borderRadius: '8px',
          color: '#B07D3A',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          ⓘ Restricted Access: Only the Main Administrator can create, delete, or modify admin accounts and permissions.
        </div>
      )}

      <DataTable
        columns={adminColumns}
        data={admins}
        loading={loading}
        searchPlaceholder="Search by name, email, or user ID..."
        searchWidth="520px"
        secondaryFilterKey="role"
        secondaryFilterLabel="Select Roles"
        secondaryFilterOptions={[
          { label: 'Select Roles', value: 'ALL' },
          { label: 'Super Admin', value: 'Super Admin' },
          { label: 'Product Manager', value: 'Product Manager' },
          { label: 'Order Manager', value: 'Order Manager' }
        ]}
        filterKey="status"
        filterLabel="All Status"
        filterOptions={[
          { label: 'All Status', value: 'ALL' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' }
        ]}
        emptyTitle="No Admins Found"
        emptyDescription="Create an admin account to delegate store management."
      />

      {/* Admin-to-Admin Live Chat Drawer */}
      <Drawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        title={selectedAdminForChat ? `${selectedAdminForChat.firstName} ${selectedAdminForChat.lastName || ''}` : 'Admin Channel'}
        subtitle={selectedAdminForChat ? `@${selectedAdminForChat.username} • Administrator` : 'Real-time Admin Chat'}
        width="540px"
      >
        {selectedAdminForChat && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={styles.adminChatCard}>
              <div style={styles.avatarCircle}>
                {(selectedAdminForChat.firstName || selectedAdminForChat.username || 'A').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '700', color: '#F9F6F0', fontSize: '15px' }}>
                    {selectedAdminForChat.firstName} {selectedAdminForChat.lastName}
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>ONLINE</span>
                </div>
                <span style={{ fontSize: '12px', color: '#A0A0AB' }}>{selectedAdminForChat.email}</span>
              </div>
            </div>

            <div style={styles.chatContainer}>
              <div style={styles.chatFeed}>
                {adminChatMessages.length === 0 ? (
                  <div style={styles.chatEmpty}>
                    <MessageCircle size={32} color="#D4AF37" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0, color: '#A0A0AB', fontSize: '13px' }}>
                      Direct communication channel with {selectedAdminForChat.firstName}.
                    </p>
                  </div>
                ) : (
                  adminChatMessages.map((msg, i) => {
                    const isSelf = msg.senderName?.includes(currentAdmin?.firstName || 'Admin');
                    return (
                      <div key={i} style={{ ...styles.chatBubbleWrap, justifyContent: isSelf ? 'flex-end' : 'flex-start' }}>
                        <div style={{ ...styles.chatBubble, ...(isSelf ? styles.chatBubbleSelf : styles.chatBubblePeer) }}>
                          <div style={styles.chatSender}>{msg.senderName || 'Admin'}</div>
                          <div style={styles.chatText}>{msg.message}</div>
                          <div style={styles.chatMeta}>
                            <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isSelf && <CheckCheck size={12} color="#D4AF37" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendAdminChatMessage} style={styles.chatInputRow}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type message to admin..."
                  style={styles.chatInputField}
                />
                <button type="submit" disabled={chatSending || !chatInput.trim()} style={styles.chatSendBtn}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add New Admin Modal */}
      {modalOpen && (
        <div style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Administrator</h3>
              <button onClick={() => setModalOpen(false)} style={styles.modalClose}>×</button>
            </div>

            {error && <div style={styles.errorAlert}>{error}</div>}
            {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

            <form onSubmit={handleCreateAdmin} style={styles.form}>
              <div style={styles.nameRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Alex"
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Smith"
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="alexsmith"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin2@srilufashionhub.com"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    required
                    minLength={6}
                    style={{ ...styles.input, paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#A0A0AB',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Permissions</label>
                <div style={styles.permGrid}>
                  {['products', 'orders', 'customers', 'coupons', 'admins'].map(perm => (
                    <label key={perm} style={styles.permLabel}>
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm)}
                        onChange={() => handlePermissionToggle(perm)}
                        style={{ accentColor: '#D4AF37' }}
                      />
                      <span>{perm.charAt(0).toUpperCase() + perm.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={submitting} style={styles.submitBtn}>
                {submitting ? 'Creating Admin...' : 'Create Admin Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const styles = {
  primaryBtn: {
    padding: '9px 16px',
    backgroundColor: '#D4AF37',
    color: '#0D0D0E',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  avatarCircle: {
    width: '36px',
    height: '36px',
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
  mainBadge: {
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    color: '#D4AF37',
    border: '1px solid rgba(212, 175, 55, 0.4)',
    fontWeight: '700'
  },
  subBadge: {
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#A0A0AB',
    fontWeight: '600'
  },
  adminChatCard: {
    padding: '14px 16px',
    backgroundColor: '#0D0D11',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
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
  chatBubbleSelf: {
    backgroundColor: '#1C1917',
    border: '1px solid rgba(212, 175, 55, 0.4)',
    color: '#F9F6F0',
    borderBottomRightRadius: '2px'
  },
  chatBubblePeer: {
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
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#16161A',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '460px',
    padding: '28px'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#F9F6F0',
    margin: 0,
    fontFamily: "'Playfair Display', serif"
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#A0A0AB',
    fontSize: '24px',
    cursor: 'pointer'
  },
  errorAlert: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    color: '#F87171',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '16px'
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34D399',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '16px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  nameRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
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
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 12px',
    backgroundColor: 'rgba(13, 13, 14, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    color: '#F9F6F0',
    fontSize: '13px',
    outline: 'none'
  },
  permGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '4px'
  },
  permLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#F9F6F0',
    cursor: 'pointer'
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#D4AF37',
    color: '#0D0D0E',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    marginTop: '8px',
    cursor: 'pointer'
  }
};

export default AdminManagement;

