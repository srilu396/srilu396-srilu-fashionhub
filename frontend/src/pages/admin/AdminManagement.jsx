import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import Drawer from '../../components/admin/Drawer';
import Button from '../../components/admin/Button';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import { useToast } from '../../components/common/Toast/useToast';
import {
  Pencil, UserX, UserCheck, Trash2,
  Eye, EyeOff, ShieldCheck, Mail, User, Clock, Plus
} from 'lucide-react';

const AdminManagement = () => {
  const toast = useToast();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete admin confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        toast.success('Admin account created successfully!', 'Admin Created');
        setFormData({
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          password: '',
          permissions: ['products', 'orders', 'customers', 'coupons', 'admins']
        });
        setModalOpen(false);
        fetchAdmins();
      } else {
        toast.error(data.message || 'Failed to create admin account.', 'Create Admin Error');
        setError(data.message || 'Failed to create admin account.');
      }
    } catch (err) {
      console.error('Create admin error:', err);
      toast.error('Network error. Please try again.');
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
        toast.info(`Admin status updated successfully.`, 'Status Updated');
        fetchAdmins();
      } else {
        toast.error(data.message || 'Failed to update admin status.');
      }
    } catch (err) {
      console.error('Status toggle error:', err);
    }
  };

  const openDeleteConfirmation = (admin) => {
    if (admin.isMainAdmin) {
      toast.warning('Main Administrator account cannot be deleted.', 'Action Restricted');
      return;
    }
    setAdminToDelete(admin);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    if (adminToDelete.isMainAdmin) {
      toast.warning('Main Administrator account cannot be deleted.', 'Action Restricted');
      setDeleteModalOpen(false);
      setAdminToDelete(null);
      return;
    }

    setDeleteLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/admins/${adminToDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Administrator account deleted successfully.', 'Admin Deleted');
        fetchAdmins();
      } else {
        toast.error(data.message || 'Failed to delete admin account.');
      }
    } catch (err) {
      console.error('Delete admin error:', err);
      toast.error('Network error. Failed to delete admin account.');
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setAdminToDelete(null);
    }
  };

  const adminColumns = [
    {
      header: 'Administrator Name',
      accessor: (row) => `${row.firstName || ''} ${row.lastName || ''}`,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.avatarCircle}>
            {row.avatarUrl ? (
              <img
                src={row.avatarUrl}
                alt={row.firstName || 'Admin'}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              (row.firstName || row.username || 'A').charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: '600', color: 'var(--admin-text-primary)' }}>
                {row.firstName} {row.lastName}
              </span>
              {row.isMainAdmin ? (
                <span style={styles.mainBadge}>MAIN ADMIN</span>
              ) : (
                <span style={styles.subBadge}>SUB ADMIN</span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>@{row.username}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Email Address',
      accessor: 'email',
      render: (row) => <span style={{ color: 'var(--admin-gold)' }}>{row.email}</span>
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
            ...(isMainAdminUser && !row.isMainAdmin ? [
              {
                label: row.status === 'active' ? 'Deactivate Admin' : 'Activate Admin',
                icon: row.status === 'active' ? <UserX size={14} color="var(--admin-danger)" /> : <UserCheck size={14} color="var(--admin-success, #10B981)" />,
                danger: row.status === 'active',
                onClick: () => handleToggleStatus(row._id, row.status)
              },
              {
                label: 'Delete Admin',
                icon: <Trash2 size={14} color="var(--admin-danger)" />,
                danger: true,
                onClick: () => openDeleteConfirmation(row)
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

      {/* Add New Admin Modal */}
      {modalOpen && (
        <div style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Administrator</h3>
              <button onClick={() => setModalOpen(false)} style={styles.modalClose}>×</button>
            </div>

            {error && <div style={styles.errorAlert}>{error}</div>}

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
      {/* Confirmation Delete Modal for Admin Accounts */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAdminToDelete(null);
        }}
        onConfirm={handleConfirmDeleteAdmin}
        title="Delete Administrator Account"
        message={
          adminToDelete
            ? `Are you sure you want to delete ${adminToDelete.firstName || ''} ${adminToDelete.lastName || ''} (@${adminToDelete.username || ''})? This will permanently remove their admin account from this portal.`
            : "Are you sure you want to delete this administrator account? This step cannot be reversed."
        }
        confirmText="Delete Admin"
        cancelText="Cancel"
        danger={true}
        loading={deleteLoading}
      />
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
    backgroundColor: 'var(--admin-gold-muted)',
    color: 'var(--admin-gold)',
    border: '1px solid var(--admin-border-gold)',
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
    backgroundColor: 'var(--admin-gold-muted)',
    color: 'var(--admin-gold)',
    border: '1px solid var(--admin-border-gold)',
    fontWeight: '700'
  },
  subBadge: {
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'var(--admin-input-bg)',
    color: 'var(--admin-text-secondary)',
    border: '1px solid var(--admin-border-subtle)',
    fontWeight: '600'
  },
  adminChatCard: {
    padding: '14px 16px',
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '420px',
    backgroundColor: 'var(--admin-card-bg)',
    borderRadius: '10px',
    border: '1px solid var(--admin-border-gold)',
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
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    color: 'var(--admin-text-primary)',
    borderBottomRightRadius: '2px'
  },
  chatBubblePeer: {
    backgroundColor: 'var(--admin-surface-2)',
    border: '1px solid var(--admin-border-subtle)',
    color: 'var(--admin-text-primary)',
    borderBottomLeftRadius: '2px'
  },
  chatSender: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--admin-gold)',
    marginBottom: '2px',
    textTransform: 'uppercase'
  },
  chatText: {
    color: 'var(--admin-text-primary)',
    whiteSpace: 'pre-wrap'
  },
  chatMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '4px',
    fontSize: '10px',
    color: 'var(--admin-text-secondary)',
    marginTop: '4px'
  },
  chatInputRow: {
    padding: '12px',
    backgroundColor: 'var(--admin-card-bg)',
    borderTop: '1px solid var(--admin-border-subtle)',
    display: 'flex',
    gap: '8px'
  },
  chatInputField: {
    flex: 1,
    padding: '10px 14px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '20px',
    color: 'var(--admin-text-primary)',
    fontSize: '13px',
    outline: 'none'
  },
  chatSendBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'var(--admin-gold)',
    color: 'var(--active-pill-text)',
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
    zIndex: 'var(--z-modal, 9999)',
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'var(--admin-modal-bg)',
    border: '1px solid var(--admin-border-gold)',
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
    color: 'var(--admin-text-primary)',
    margin: 0,
    fontFamily: "var(--font-serif, 'Playfair Display', serif)"
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-muted)',
    fontSize: '24px',
    cursor: 'pointer'
  },
  errorAlert: {
    backgroundColor: 'var(--admin-danger-bg)',
    border: '1px solid var(--admin-danger)',
    color: 'var(--admin-danger)',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '16px'
  },
  successAlert: {
    backgroundColor: 'var(--admin-success-bg)',
    border: '1px solid var(--admin-success)',
    color: 'var(--admin-success)',
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
    color: 'var(--admin-gold)'
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 12px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '6px',
    color: 'var(--admin-text-primary)',
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
    color: 'var(--admin-text-primary)',
    cursor: 'pointer'
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--admin-gold)',
    color: 'var(--active-pill-text)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    marginTop: '8px',
    cursor: 'pointer'
  }
};

export default AdminManagement;

