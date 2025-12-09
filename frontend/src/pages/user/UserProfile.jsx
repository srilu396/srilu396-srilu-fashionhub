import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import AnimatedBackground from '../../components/AnimatedBackground';
import LoadingSpinner from '../../components/LoadingSpinner';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, ShoppingBag, Heart, Package, LogOut } from 'lucide-react';

const UserProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
    cartCount: 0,
    averageOrderValue: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    country: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      
      if (!token) {
        navigate('/user/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('user');
        navigate('/user/login');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setStats(data.stats);
        setFormData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          phone: data.user.phone || '',
          address: data.user.address || '',
          city: data.user.city || '',
          country: data.user.country || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('userToken');
      
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    navigate('/user/login');
  };

  if (loading) {
    return (
      <div className="user-profile-page">
        <AnimatedBackground />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-profile-page">
        <AnimatedBackground />
        <Header />
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 20px', 
          color: '#F5F5F5' 
        }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>No User Found</h2>
          <button 
            onClick={() => navigate('/user/login')} 
            style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #D4AF37, #F7E7CE)',
              color: '#1C1C1C',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: "'Playfair Display', serif"
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Ensure all values are strings before rendering
  const safeFirstName = String(user.firstName || '');
  const safeLastName = String(user.lastName || '');
  const safeEmail = String(user.email || '');
  const safePhone = String(user.phone || 'Not provided');
  const safeAddress = String(user.address || 'Not provided');
  const safeCity = String(user.city || 'Not provided');
  const safeCountry = String(user.country || 'Not provided');
  const safeCreatedAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

  return (
    <div className="user-profile-page">
      <AnimatedBackground />
      <Header />
      
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {safeFirstName[0]}{safeLastName[0]}
          </div>
          <div className="profile-badges">
            <span className="badge premium">PREMIUM MEMBER</span>
            <span className="badge verified">✓ VERIFIED</span>
          </div>
        </div>
        
        <div className="profile-info">
          <h1>{safeFirstName} {safeLastName}</h1>
          <p className="email">
            <Mail size={16} /> {safeEmail}
          </p>
          <p className="joined">
            <Calendar size={16} /> Member since {safeCreatedAt}
          </p>
        </div>
        
        <div className="profile-actions">
          <button 
            className={`btn-action ${isEditing ? 'save' : 'edit'}`}
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            disabled={saving}
          >
            {isEditing ? (
              <>
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </>
            ) : (
              <>
                <Edit size={18} />
                Edit Profile
              </>
            )}
          </button>
          <button className="btn-action logout" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <h2>Your Activity</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon orders">
              <ShoppingBag size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{Number(stats.totalOrders) || 0}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon spent">
              <span className="currency">$</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{Number(stats.totalSpent).toFixed(2) || '0.00'}</div>
              <div className="stat-label">Total Spent</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon wishlist">
              <Heart size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{Number(stats.wishlistCount) || 0}</div>
              <div className="stat-label">Wishlist Items</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon cart">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{Number(stats.cartCount) || 0}</div>
              <div className="stat-label">Cart Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="profile-details">
        <h2>Personal Information</h2>
        <div className="details-grid">
          <div className="detail-field">
            <label>
              <User size={16} />
              First Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="detail-input"
              />
            ) : (
              <div className="detail-value">{safeFirstName}</div>
            )}
          </div>
          
          <div className="detail-field">
            <label>
              <User size={16} />
              Last Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="detail-input"
              />
            ) : (
              <div className="detail-value">{safeLastName}</div>
            )}
          </div>
          
          <div className="detail-field">
            <label>
              <Mail size={16} />
              Email
            </label>
            <div className="detail-value email-display">{safeEmail}</div>
          </div>
          
          <div className="detail-field">
            <label>
              <Phone size={16} />
              Phone
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="detail-input"
                placeholder="Enter phone number"
              />
            ) : (
              <div className="detail-value">{safePhone}</div>
            )}
          </div>
          
          <div className="detail-field full-width">
            <label>
              <MapPin size={16} />
              Address
            </label>
            {isEditing ? (
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="detail-input"
                placeholder="Enter your address"
              />
            ) : (
              <div className="detail-value">{safeAddress}</div>
            )}
          </div>
          
          <div className="detail-field">
            <label>City</label>
            {isEditing ? (
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="detail-input"
                placeholder="Enter city"
              />
            ) : (
              <div className="detail-value">{safeCity}</div>
            )}
          </div>
          
          <div className="detail-field">
            <label>Country</label>
            {isEditing ? (
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="detail-input"
                placeholder="Enter country"
              />
            ) : (
              <div className="detail-value">{safeCountry}</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        <h2>Quick Actions</h2>
        <div className="links-grid">
          <button onClick={() => navigate('/user/dashboard')} className="link-card">
            <ShoppingBag size={24} />
            <span>Dashboard</span>
          </button>
          <button onClick={() => navigate('/user/orders')} className="link-card">
            <Package size={24} />
            <span>My Orders</span>
          </button>
          <button onClick={() => navigate('/user/wishlist')} className="link-card">
            <Heart size={24} />
            <span>Wishlist</span>
          </button>
          <button onClick={() => navigate('/user/cart')} className="link-card">
            <ShoppingBag size={24} />
            <span>Shopping Cart</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .user-profile-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
          color: #ffffff;
          position: relative;
          font-family: 'Playfair Display', 'Times New Roman', serif;
        }

        /* Profile Header */
        .profile-header {
          padding: 100px 5% 40px;
          background: linear-gradient(135deg, rgba(28, 28, 28, 0.9), rgba(75, 28, 47, 0.7));
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
          display: flex;
          align-items: center;
          gap: 40px;
          flex-wrap: wrap;
        }

        .profile-avatar {
          flex-shrink: 0;
        }

        .avatar-circle {
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #D4AF37, #F7E7CE);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: bold;
          color: #1C1C1C;
          margin-bottom: 10px;
        }

        .profile-badges {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .badge.premium {
          background: linear-gradient(135deg, #D4AF37, #FFD700);
          color: #1C1C1C;
        }

        .badge.verified {
          background: rgba(1, 68, 33, 0.3);
          border: 1px solid #014421;
          color: #4CAF50;
        }

        .profile-info {
          flex: 1;
          min-width: 300px;
        }

        .profile-info h1 {
          font-size: 36px;
          margin: 0 0 10px 0;
          color: #F5F5F5;
        }

        .email, .joined {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 5px 0;
          color: rgba(245, 245, 245, 0.8);
          font-size: 16px;
        }

        .profile-actions {
          display: flex;
          gap: 15px;
        }

        .btn-action {
          padding: 12px 24px;
          border-radius: 25px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          font-family: 'Playfair Display', serif;
          min-width: 140px;
          justify-content: center;
        }

        .btn-action.edit {
          background: linear-gradient(135deg, #D4AF37, #F7E7CE);
          color: #1C1C1C;
        }

        .btn-action.save {
          background: linear-gradient(135deg, #014421, #1A7C47);
          color: white;
        }

        .btn-action.logout {
          background: linear-gradient(135deg, #7D2C4F, #4B1C2F);
          color: white;
        }

        .btn-action:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        .btn-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Stats Section */
        .stats-section {
          padding: 40px 5%;
          background: rgba(28, 28, 28, 0.6);
        }

        .stats-section h2 {
          font-size: 28px;
          color: #F5F5F5;
          margin-bottom: 30px;
          text-align: center;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(28, 28, 28, 0.8), rgba(45, 45, 45, 0.8));
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 20px;
          padding: 25px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: rgba(212, 175, 55, 0.4);
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
        }

        .stat-icon.orders {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
        }

        .stat-icon.spent {
          background: rgba(1, 68, 33, 0.1);
          border: 1px solid rgba(1, 68, 33, 0.3);
          color: #4CAF50;
        }

        .stat-icon.wishlist {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.3);
          color: #ff6b6b;
        }

        .stat-icon.cart {
          background: rgba(107, 114, 128, 0.1);
          border: 1px solid rgba(107, 114, 128, 0.3);
          color: #6b7280;
        }

        .currency {
          font-size: 28px;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #F5F5F5;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 14px;
          color: rgba(245, 245, 245, 0.7);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Profile Details */
        .profile-details {
          padding: 40px 5%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .profile-details h2 {
          font-size: 28px;
          color: #F5F5F5;
          margin-bottom: 30px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
        }

        .detail-field {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .detail-field.full-width {
          grid-column: 1 / -1;
        }

        .detail-field label {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #D4AF37;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .detail-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          padding: 15px;
          color: #F5F5F5;
          font-size: 16px;
          font-family: 'Playfair Display', serif;
          transition: all 0.3s ease;
        }

        .detail-input:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }

        .detail-value {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 12px;
          padding: 15px;
          color: #F5F5F5;
          font-size: 16px;
          min-height: 50px;
          display: flex;
          align-items: center;
        }

        .email-display {
          color: #D4AF37;
          font-weight: 500;
        }

        /* Quick Links */
        .quick-links {
          padding: 40px 5%;
          max-width: 1200px;
          margin: 0 auto;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
        }

        .quick-links h2 {
          font-size: 28px;
          color: #F5F5F5;
          margin-bottom: 30px;
          text-align: center;
        }

        .links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .link-card {
          background: rgba(28, 28, 28, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 20px;
          padding: 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          color: #F5F5F5;
          font-size: 16px;
          font-weight: 500;
        }

        .link-card:hover {
          background: rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.4);
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .link-card span {
          font-family: 'Playfair Display', serif;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
            gap: 30px;
          }

          .profile-actions {
            flex-direction: column;
            width: 100%;
          }

          .btn-action {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .links-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .avatar-circle {
            width: 100px;
            height: 100px;
            font-size: 28px;
          }

          .profile-info h1 {
            font-size: 28px;
          }

          .stat-value {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default UserProfile;