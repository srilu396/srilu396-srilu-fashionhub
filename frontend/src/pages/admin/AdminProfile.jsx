import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import { useToast } from '../../components/common/Toast/useToast';
import { Eye, EyeOff, Upload, Trash2, Camera } from 'lucide-react';

const AdminProfile = () => {
  const { adminUser, updateAdminUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [notice, setNotice] = useState({ text: '', type: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: adminUser?.firstName || 'Srilu',
    lastName: adminUser?.lastName || 'Admin',
    email: adminUser?.email || 'admin@srilufashionhub.com',
    username: adminUser?.username || 'admin',
    avatarUrl: adminUser?.avatarUrl || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (adminUser) {
      setProfileData({
        firstName: adminUser.firstName || 'Srilu',
        lastName: adminUser.lastName || 'Admin',
        email: adminUser.email || 'admin@srilufashionhub.com',
        username: adminUser.username || 'admin',
        avatarUrl: adminUser.avatarUrl || ''
      });
    }
  }, [adminUser]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPEG, PNG, WEBP).', 'Invalid File');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Profile image file must be smaller than 3 MB.', 'File Size Exceeded');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setProfileData(prev => ({ ...prev, avatarUrl: dataUrl }));

      const updated = { ...profileData, avatarUrl: dataUrl };
      if (updateAdminUser) updateAdminUser(updated);

      userAPI.updateProfile({ avatarUrl: dataUrl }).catch(err => console.error('Error syncing admin avatar:', err));
      toast.success('Profile photo uploaded successfully.', 'Photo Updated');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setProfileData(prev => ({ ...prev, avatarUrl: '' }));
    const updated = { ...profileData, avatarUrl: '' };
    if (updateAdminUser) updateAdminUser(updated);

    userAPI.updateProfile({ avatarUrl: '' }).catch(err => console.error('Error clearing admin avatar:', err));
    toast.info('Profile photo removed. Restored standard avatar.', 'Photo Removed');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const res = await userAPI.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        avatarUrl: profileData.avatarUrl
      });

      if (res.success || res.user || res._id) {
        const updated = {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          avatarUrl: profileData.avatarUrl
        };
        if (updateAdminUser) updateAdminUser(updated);
        toast.success('Admin profile updated successfully.', 'Profile Updated');
        setNotice({ text: 'Profile details updated successfully.', type: 'success' });
      } else {
        toast.error(res.message || 'Failed to update profile.', 'Update Failed');
        setNotice({ text: res.message || 'Failed to update profile.', type: 'error' });
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Unable to update profile. Please try again.', 'Error');
      setNotice({ text: 'Error saving profile details.', type: 'error' });
    } finally {
      setProfileLoading(false);
      setTimeout(() => setNotice({ text: '', type: '' }), 4000);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      toast.warning('Please enter your current password.', 'Validation');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters long.', 'Validation');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match.', 'Password Mismatch');
      setNotice({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await userAPI.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (res.success || res.message?.toLowerCase().includes('success')) {
        toast.success('Security credentials updated successfully.', 'Password Changed');
        setNotice({ text: 'Security credentials updated successfully.', type: 'success' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const errMsg = res.message || res.error || 'Failed to change password. Verify your current password.';
        toast.error(errMsg, 'Password Change Failed');
        setNotice({ text: errMsg, type: 'error' });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error('Error updating password. Please check your credentials.', 'Error');
      setNotice({ text: 'Error updating password. Please try again.', type: 'error' });
    } finally {
      setPasswordLoading(false);
      setTimeout(() => setNotice({ text: '', type: '' }), 4000);
    }
  };

  return (
    <AdminLayout title="Account & Security">
      <PageHeader
        title="Admin Profile Management"
        subtitle="Manage executive account credentials, profile image, role security, and personal preferences"
        breadcrumbs={[{ label: 'Profile' }]}
      />

      {/* Hidden File Input for Local System Image Selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        style={{ display: 'none' }}
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
        {/* Profile Details & Image Management Card */}
        <div style={styles.card}>
          <div style={styles.profileHeader}>
            <div
              style={{ position: 'relative', width: '74px', height: '74px', flexShrink: 0, cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
              title="Click to select profile photo from device"
            >
              {profileData.avatarUrl ? (
                <img
                  src={profileData.avatarUrl}
                  alt="Admin Avatar"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--admin-gold)' }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Avatar'; }}
                />
              ) : (
                <div style={styles.avatarLarge}>
                  {(profileData.firstName || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '24px',
                height: '24px',
                backgroundColor: 'var(--admin-gold)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                border: '2px solid var(--admin-card-bg)'
              }}>
                <Camera size={12} color="#000000" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={styles.profileName}>{profileData.firstName} {profileData.lastName}</h3>
                <StatusBadge status="active" customLabel="Super Administrator" />
              </div>
              <span style={styles.profileEmail}>{profileData.email}</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    backgroundColor: 'var(--admin-surface-2)',
                    border: '1px solid var(--admin-border-subtle)',
                    borderRadius: '16px',
                    color: 'var(--admin-gold)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Upload size={12} />
                  {profileData.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                </button>

                {profileData.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--admin-danger)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: '4px 8px'
                    }}
                    title="Remove photo and restore default avatar"
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSave} style={styles.form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>First Name *</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Name *</label>
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
              <label style={styles.label}>Email Address *</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              style={styles.primaryBtn}
            >
              {profileLoading ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Security / Password Change Card */}
        <div style={styles.card}>
          <h3 style={styles.sectionHeading}>Security & Password Management</h3>
          <p style={styles.sectionDesc}>Update your secret administrator password for secure dashboard portal access.</p>

          <form onSubmit={handlePasswordSave} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Current Password *</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  placeholder="Enter your existing current password"
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
              <label style={styles.label}>New Password *</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
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
              <label style={styles.label}>Confirm New Password *</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  placeholder="Re-enter new password"
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

            <button
              type="submit"
              disabled={passwordLoading}
              style={styles.primaryBtn}
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

const styles = {
  gridTwoCols: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px'
  },
  card: {
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--admin-shadow-sm)'
  },
  noticeBox: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid',
    marginBottom: '20px',
    fontSize: '13px',
    fontWeight: '500'
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--admin-border-subtle)'
  },
  avatarWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%'
  },
  avatarLarge: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'var(--admin-gold-muted)',
    border: '2px solid var(--admin-gold)',
    color: 'var(--admin-gold)',
    fontSize: '24px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "var(--font-serif, 'Playfair Display', serif)"
  },
  profileName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    margin: 0,
    fontFamily: "var(--font-serif, 'Playfair Display', serif)"
  },
  profileEmail: {
    fontSize: '0.82rem',
    color: 'var(--admin-text-secondary)'
  },
  sectionHeading: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    margin: '0 0 4px 0',
    fontFamily: "var(--font-serif, 'Playfair Display', serif)"
  },
  sectionDesc: {
    fontSize: '0.82rem',
    color: 'var(--admin-text-secondary)',
    margin: '0 0 20px 0'
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
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'var(--admin-gold)'
  },
  input: {
    padding: '10px 14px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '8px',
    color: 'var(--admin-text-primary)',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box'
  },
  removeAvatarBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-danger)',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px'
  },
  uploadImageBtn: {
    padding: '6px 14px',
    backgroundColor: 'var(--admin-surface-2)',
    border: '1px solid var(--admin-border-subtle)',
    borderRadius: '16px',
    color: 'var(--admin-gold)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease'
  },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--admin-gold)',
    color: 'var(--active-pill-text)',
    border: 'none',
    borderRadius: '24px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    marginTop: '6px',
    boxShadow: 'var(--admin-gold-glow)'
  }
};

export default AdminProfile;
