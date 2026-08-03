import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const AdminProfile = () => {
  const { adminUser } = useAuth();
  const [notice, setNotice] = useState({ text: '', type: '' });
  const [profileData, setProfileData] = useState({
    firstName: adminUser?.firstName || 'Srilu',
    lastName: adminUser?.lastName || 'Admin',
    email: adminUser?.email || 'admin@srilufashionhub.com',
    username: adminUser?.username || 'admin'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProfileSave = (e) => {
    e.preventDefault();
    setNotice({ text: 'Profile details updated successfully.', type: 'success' });
    setTimeout(() => setNotice({ text: '', type: '' }), 3000);
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotice({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    setNotice({ text: 'Security credentials updated successfully.', type: 'success' });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setNotice({ text: '', type: '' }), 3000);
  };

  return (
    <AdminLayout title="Account & Security">
      <PageHeader
        title="Admin Profile Management"
        subtitle="Manage your executive account credentials, role security, and personal preferences"
        breadcrumbs={[{ label: 'Profile' }]}
      />

      {notice.text && (
        <div style={{
          ...styles.noticeBox,
          backgroundColor: notice.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          borderColor: notice.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          color: notice.type === 'success' ? '#10B981' : '#EF4444'
        }}>
          {notice.text}
        </div>
      )}

      <div style={styles.gridTwoCols}>
        {/* Profile Card */}
        <div style={styles.card}>
          <div style={styles.profileHeader}>
            <div style={styles.avatarLarge}>
              {(profileData.firstName || 'A').charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={styles.profileName}>{profileData.firstName} {profileData.lastName}</h3>
              <span style={styles.profileEmail}>{profileData.email}</span>
              <div style={{ marginTop: '4px' }}>
                <StatusBadge status="active" customLabel="Super Administrator" />
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSave} style={styles.form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.primaryBtn}>
              Save Profile
            </button>
          </form>
        </div>

        {/* Security / Password Change Card */}
        <div style={styles.card}>
          <h3 style={styles.sectionHeading}>Security Credentials</h3>
          <p style={styles.sectionDesc}>Update your secret password for secure portal access.</p>

          <form onSubmit={handlePasswordSave} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Current Password</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  style={{ ...styles.input, width: '100%', boxSizing: 'border-box', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--admin-text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    zIndex: 2
                  }}
                  title={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  style={{ ...styles.input, width: '100%', boxSizing: 'border-box', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--admin-text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    zIndex: 2
                  }}
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm New Password</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  style={{ ...styles.input, width: '100%', boxSizing: 'border-box', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--admin-text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    zIndex: 2
                  }}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" style={styles.secondaryBtn}>
              Update Password
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

const styles = {
  noticeBox: {
    padding: '12px 16px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '13px',
    marginBottom: '24px'
  },
  gridTwoCols: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px'
  },
  card: {
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '10px',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: 'var(--admin-shadow-sm)'
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingBottom: '18px',
    borderBottom: '1px solid var(--admin-border-subtle)'
  },
  avatarLarge: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'var(--admin-gold-muted)',
    color: 'var(--admin-gold)',
    border: '2px solid var(--admin-border-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontWeight: '700',
    fontSize: '24px'
  },
  profileName: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  profileEmail: {
    fontSize: '12px',
    color: 'var(--admin-text-secondary)'
  },
  sectionHeading: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  sectionDesc: {
    fontSize: '12px',
    color: 'var(--admin-text-secondary)',
    margin: '4px 0 12px 0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
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
    padding: '11px 14px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '6px',
    color: 'var(--admin-text-primary)',
    fontSize: '13px',
    outline: 'none'
  },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--admin-gold)',
    color: 'var(--active-pill-text)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    marginTop: '6px'
  },
  secondaryBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-border-gold)',
    color: 'var(--admin-gold)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    marginTop: '6px'
  }
};

export default AdminProfile;
