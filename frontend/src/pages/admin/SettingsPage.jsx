import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [emailTestResult, setEmailTestResult] = useState(null);
  
  // Luxury floating elements
  const floatingElements = [
    { id: 1, x: 10, y: 20, size: 120, delay: 0 },
    { id: 2, x: 85, y: 40, size: 180, delay: 2 },
    { id: 3, x: 15, y: 70, size: 100, delay: 4 },
    { id: 4, x: 90, y: 80, size: 140, delay: 6 },
  ];

  // Settings state
  const [settings, setSettings] = useState({
    general: {
      siteName: 'SriluFashionHub',
      siteTagline: 'Where Luxury Meets Elegance',
      adminEmail: 'admin@srilufashionhub.com',
      currency: 'USD',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
    },
    store: {
      taxRate: 18,
      shippingFee: 5.99,
      freeShippingThreshold: 100,
      storeCurrency: 'USD',
      weightUnit: 'kg',
      dimensionsUnit: 'cm',
    },
    payments: {
      stripeEnabled: true,
      paypalEnabled: true,
      razorpayEnabled: true,
      cashOnDelivery: true,
      paymentGateway: 'stripe',
      stripeKey: '',
      paypalClientId: '',
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpUser: '',
      smtpPass: '',
      emailSender: 'noreply@srilufashionhub.com',
      emailEncryption: 'tls',
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      ipRestriction: false,
      allowedIPs: [],
      loginAttempts: 5,
    },
    notifications: {
      notifyNewOrders: true,
      notifyLowStock: true,
      notifyNewUsers: true,
      notifyReviews: true,
    },
    maintenance: {
      maintenanceMode: false,
      maintenanceMessage: 'We are upgrading our system for better service. Please check back soon.',
      allowAdminAccess: true,
    },
  });

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

const fetchSettings = async () => {
  setLoading(true);
  try {
    // ALWAYS use userToken (since it's a proper JWT)
    const token = localStorage.getItem('userToken');
    
    console.log('Using token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'No token');
    
    if (!token) {
      console.error('No authentication token found');
      setLoading(false);
      return;
    }
    
    const response = await fetch('http://localhost:5000/api/admin/settings', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success && data.settings) {
      setSettings(data.settings);
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
  } finally {
    setLoading(false);
  }
};

  // Handle input changes
  const handleChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccessMessage('');
    setEmailTestResult(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('⚡ Settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        throw new Error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSuccessMessage(`❌ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

const handleSendTestEmail = async () => {
  if (!settings.email.smtpHost || !settings.email.smtpPort || !settings.email.smtpUser) {
    setEmailTestResult({
      success: false,
      message: '⚠️ Please fill in all required email settings first.'
    });
    return;
  }

  setSendingEmail(true);
  setEmailTestResult(null);
  
try {
    const token = localStorage.getItem('userToken');
    
    if (!token) {
      setEmailTestResult({
        success: false,
        message: '❌ No authentication token found. Please login as a user first.'
      });
      return;
    }

    const smtpConfig = {
      host: settings.email.smtpHost,
      port: settings.email.smtpPort,
      user: settings.email.smtpUser,
      pass: settings.email.smtpPass,
      sender: settings.email.emailSender,
      encryption: settings.email.emailEncryption,
      saveToSettings: true
    };

    const response = await fetch('http://localhost:5000/api/admin/settings/test-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        smtpConfig,
        testEmail: settings.general.adminEmail
      })
    });

    const data = await response.json();
    
    if (data.success) {
      setEmailTestResult({
        success: true,
        message: '✅ Test email sent successfully! Check your inbox.'
      });
      setSuccessMessage('📧 Test email configuration verified successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setEmailTestResult({
        success: false,
        message: `❌ ${data.message}`
      });
    }
    
  } catch (error) {
    setEmailTestResult({
      success: false,
      message: `❌ Network error: ${error.message || 'Check your backend server'}`
    });
  } finally {
    setSendingEmail(false);
  }
};

  // Handle danger action
  const handleDangerAction = async (action) => {
    const token = localStorage.getItem('adminToken');
    
    switch(action) {
      case 'exportData':
        if (window.confirm('📤 Are you sure you want to export all data? This may take several minutes.')) {
          try {
            const response = await fetch('http://localhost:5000/api/admin/settings/export-data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                dataTypes: ['users', 'products', 'settings'],
                sendEmail: true
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              setEmailTestResult({
                success: true,
                message: '📊 Data export started. You will receive an email with the download link.'
              });
            }
          } catch (error) {
            setEmailTestResult({
              success: false,
              message: `❌ Export failed: ${error.message}`
            });
          }
        }
        break;
        
      case 'resetStatistics':
        if (window.confirm('🔄 This will reset all statistics to zero. This action cannot be undone. Are you sure?')) {
          try {
            const response = await fetch('http://localhost:5000/api/admin/settings/reset-statistics', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                statistics: ['sales', 'orders', 'customers']
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              setEmailTestResult({
                success: true,
                message: '📈 Statistics have been reset successfully.'
              });
            }
          } catch (error) {
            setEmailTestResult({
              success: false,
              message: `❌ Reset failed: ${error.message}`
            });
          }
        }
        break;
        
      case 'clearCache':
        if (window.confirm('🧹 Clear all cached data? This will improve performance but may temporarily increase server load.')) {
          try {
            const response = await fetch('http://localhost:5000/api/admin/settings/clear-cache', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                cacheTypes: ['all']
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              setEmailTestResult({
                success: true,
                message: '⚡ Cache cleared successfully. Performance should improve.'
              });
            }
          } catch (error) {
            setEmailTestResult({
              success: false,
              message: `❌ Cache clear failed: ${error.message}`
            });
          }
        }
        break;
        
      case 'factoryReset':
        if (window.confirm('🔥 WARNING: This will reset ALL settings to default. This cannot be undone. Are you absolutely sure?')) {
          try {
            const response = await fetch('http://localhost:5000/api/admin/settings/factory-reset', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                confirm: true
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              alert('Factory reset completed. The page will reload.');
              window.location.reload();
            }
          } catch (error) {
            setEmailTestResult({
              success: false,
              message: `❌ Factory reset failed: ${error.message}`
            });
          }
        }
        break;
        
      default:
        break;
    }
  };

  // Available timezones
  const timezones = [
    'Asia/Kolkata',
    'America/New_York',
    'Europe/London',
    'Asia/Singapore',
    'Australia/Sydney',
    'Asia/Dubai',
    'Asia/Tokyo'
  ];

  // Available currencies
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ];

  // Tabs configuration with luxury icons
  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️', color: '#D4AF37' },
    { id: 'store', label: 'Store', icon: '🏪', color: '#4B1C2F' },
    { id: 'payments', label: 'Payments', icon: '💳', color: '#014421' },
    { id: 'email', label: 'Email', icon: '📧', color: '#001F3F' },
    { id: 'security', label: 'Security', icon: '🔒', color: '#D4AF37' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', color: '#4B1C2F' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧', color: '#014421' },
    { id: 'danger', label: 'Danger Zone', icon: '⚠️', color: '#dc3545' },
  ];

  // Render settings content based on active tab
  const renderSettingsContent = () => {
    if (loading) {
      return (
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      );
    }

    switch(activeTab) {
      case 'general':
        return (
          <div className="settings-section">
            <h3 className="section-title">⚙️ General Settings</h3>
            <p className="section-description">Configure your store's basic information and preferences</p>
            
            <div className="settings-grid">
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">🏷️</span>
                  <h4>Site Name</h4>
                </div>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) => handleChange('general', 'siteName', e.target.value)}
                  className="form-input"
                  placeholder="Enter site name"
                />
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">📝</span>
                  <h4>Site Tagline</h4>
                </div>
                <input
                  type="text"
                  value={settings.general.siteTagline}
                  onChange={(e) => handleChange('general', 'siteTagline', e.target.value)}
                  className="form-input"
                  placeholder="Enter site tagline"
                />
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">👑</span>
                  <h4>Admin Email</h4>
                </div>
                <input
                  type="email"
                  value={settings.general.adminEmail}
                  onChange={(e) => handleChange('general', 'adminEmail', e.target.value)}
                  className="form-input"
                  placeholder="admin@example.com"
                />
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">💎</span>
                  <h4>Currency</h4>
                </div>
                <select
                  value={settings.general.currency}
                  onChange={(e) => handleChange('general', 'currency', e.target.value)}
                  className="form-select"
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">🌍</span>
                  <h4>Timezone</h4>
                </div>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => handleChange('general', 'timezone', e.target.value)}
                  className="form-select"
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">📅</span>
                  <h4>Date Format</h4>
                </div>
                <select
                  value={settings.general.dateFormat}
                  onChange={(e) => handleChange('general', 'dateFormat', e.target.value)}
                  className="form-select"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'store':
        return (
          <div className="settings-section">
            <h3 className="section-title">🏪 Store Settings</h3>
            <p className="section-description">Configure your store's business rules and preferences</p>
            
            <div className="settings-grid">
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">📊</span>
                  <h4>Tax Rate (%)</h4>
                </div>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.store.taxRate}
                    onChange={(e) => handleChange('store', 'taxRate', parseFloat(e.target.value))}
                    className="form-input"
                  />
                  <span className="unit">%</span>
                </div>
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">🚚</span>
                  <h4>Shipping Fee</h4>
                </div>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.store.shippingFee}
                    onChange={(e) => handleChange('store', 'shippingFee', parseFloat(e.target.value))}
                    className="form-input"
                  />
                  <span className="unit">$</span>
                </div>
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">🎁</span>
                  <h4>Free Shipping Threshold</h4>
                </div>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.store.freeShippingThreshold}
                    onChange={(e) => handleChange('store', 'freeShippingThreshold', parseFloat(e.target.value))}
                    className="form-input"
                  />
                  <span className="unit">$</span>
                </div>
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">💰</span>
                  <h4>Store Currency</h4>
                </div>
                <select
                  value={settings.store.storeCurrency}
                  onChange={(e) => handleChange('store', 'storeCurrency', e.target.value)}
                  className="form-select"
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">⚖️</span>
                  <h4>Weight Unit</h4>
                </div>
                <select
                  value={settings.store.weightUnit}
                  onChange={(e) => handleChange('store', 'weightUnit', e.target.value)}
                  className="form-select"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="lb">Pounds (lb)</option>
                  <option value="oz">Ounces (oz)</option>
                </select>
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">📐</span>
                  <h4>Dimensions Unit</h4>
                </div>
                <select
                  value={settings.store.dimensionsUnit}
                  onChange={(e) => handleChange('store', 'dimensionsUnit', e.target.value)}
                  className="form-select"
                >
                  <option value="cm">Centimeters (cm)</option>
                  <option value="m">Meters (m)</option>
                  <option value="in">Inches (in)</option>
                  <option value="ft">Feet (ft)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="settings-section">
            <h3 className="section-title">💳 Payment Settings</h3>
            <p className="section-description">Configure payment gateways and methods</p>
            
            <div className="settings-grid">
              <div className="toggle-card">
                <div className="toggle-header">
                  <span className="toggle-icon">💳</span>
                  <div>
                    <h4>Stripe Payments</h4>
                    <p>Accept credit/debit cards securely</p>
                  </div>
                </div>
                <label className="toggle-switch luxury">
                  <input
                    type="checkbox"
                    checked={settings.payments.stripeEnabled}
                    onChange={(e) => handleChange('payments', 'stripeEnabled', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="toggle-card">
                <div className="toggle-header">
                  <span className="toggle-icon">👛</span>
                  <div>
                    <h4>PayPal</h4>
                    <p>Accept PayPal payments</p>
                  </div>
                </div>
                <label className="toggle-switch luxury">
                  <input
                    type="checkbox"
                    checked={settings.payments.paypalEnabled}
                    onChange={(e) => handleChange('payments', 'paypalEnabled', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="toggle-card">
                <div className="toggle-header">
                  <span className="toggle-icon">💎</span>
                  <div>
                    <h4>Razorpay</h4>
                    <p>Accept payments via Razorpay</p>
                  </div>
                </div>
                <label className="toggle-switch luxury">
                  <input
                    type="checkbox"
                    checked={settings.payments.razorpayEnabled}
                    onChange={(e) => handleChange('payments', 'razorpayEnabled', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="toggle-card">
                <div className="toggle-header">
                  <span className="toggle-icon">📦</span>
                  <div>
                    <h4>Cash on Delivery</h4>
                    <p>Allow cash payment on delivery</p>
                  </div>
                </div>
                <label className="toggle-switch luxury">
                  <input
                    type="checkbox"
                    checked={settings.payments.cashOnDelivery}
                    onChange={(e) => handleChange('payments', 'cashOnDelivery', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="form-card full-width">
                <div className="form-header">
                  <span className="form-icon">🎯</span>
                  <h4>Default Payment Gateway</h4>
                </div>
                <select
                  value={settings.payments.paymentGateway}
                  onChange={(e) => handleChange('payments', 'paymentGateway', e.target.value)}
                  className="form-select"
                >
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="cod">Cash on Delivery</option>
                </select>
              </div>
              
              {settings.payments.stripeEnabled && (
                <div className="form-card full-width">
                  <div className="form-header">
                    <span className="form-icon">🔑</span>
                    <h4>Stripe Secret Key</h4>
                  </div>
                  <input
                    type="password"
                    value={settings.payments.stripeKey}
                    onChange={(e) => handleChange('payments', 'stripeKey', e.target.value)}
                    className="form-input"
                    placeholder="sk_live_..."
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="settings-section">
            <h3 className="section-title">📧 Email Settings</h3>
            <p className="section-description">Configure email server and notification settings</p>
            
            <div className="settings-grid">
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">📧</span>
                  <h4>SMTP Host</h4>
                </div>
                <input
                  type="text"
                  value={settings.email.smtpHost}
                  onChange={(e) => handleChange('email', 'smtpHost', e.target.value)}
                  className="form-input"
                  placeholder="smtp.gmail.com"
                />
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">🔢</span>
                  <h4>SMTP Port</h4>
                </div>
                <input
                  type="text"
                  value={settings.email.smtpPort}
                  onChange={(e) => handleChange('email', 'smtpPort', e.target.value)}
                  className="form-input"
                  placeholder="587"
                />
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">👤</span>
                  <h4>SMTP Username</h4>
                </div>
                <input
                  type="text"
                  value={settings.email.smtpUser}
                  onChange={(e) => handleChange('email', 'smtpUser', e.target.value)}
                  className="form-input"
                  placeholder="your-email@gmail.com"
                />
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">🔑</span>
                  <h4>SMTP Password</h4>
                </div>
                <input
                  type="password"
                  value={settings.email.smtpPass}
                  onChange={(e) => handleChange('email', 'smtpPass', e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">📨</span>
                  <h4>Sender Email</h4>
                </div>
                <input
                  type="email"
                  value={settings.email.emailSender}
                  onChange={(e) => handleChange('email', 'emailSender', e.target.value)}
                  className="form-input"
                  placeholder="noreply@example.com"
                />
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">🔐</span>
                  <h4>Encryption</h4>
                </div>
                <select
                  value={settings.email.emailEncryption}
                  onChange={(e) => handleChange('email', 'emailEncryption', e.target.value)}
                  className="form-select"
                >
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                  <option value="none">None</option>
                </select>
              </div>
              
              <div className="test-email-card full-width">
                <div className="test-email-content">
                  <div className="test-header">
                    <span className="test-icon">🚀</span>
                    <div>
                      <h4>Test Email Configuration</h4>
                      <p>Send a test email to verify your settings</p>
                    </div>
                  </div>
                  
                  {emailTestResult && (
                    <div className={`email-result ${emailTestResult.success ? 'success' : 'error'}`}>
                      {emailTestResult.message}
                    </div>
                  )}
                  
                  <button 
                    className="test-email-btn luxury-btn"
                    onClick={handleSendTestEmail}
                    disabled={sendingEmail}
                  >
                    {sendingEmail ? (
                      <>
                        <div className="spinner"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">📧</span>
                        Send Test Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="settings-section">
            <h3 className="section-title">🔒 Security Settings</h3>
            <p className="section-description">Configure security features and access controls</p>
            
            <div className="settings-grid">
              <div className="toggle-card">
                <div className="toggle-header">
                  <span className="toggle-icon">🔐</span>
                  <div>
                    <h4>Two-Factor Authentication</h4>
                    <p>Require 2FA for admin access</p>
                  </div>
                </div>
                <label className="toggle-switch luxury">
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactorAuth}
                    onChange={(e) => handleChange('security', 'twoFactorAuth', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">⏱️</span>
                  <h4>Session Timeout</h4>
                </div>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="5"
                    max="240"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="form-input"
                  />
                  <span className="unit">min</span>
                </div>
              </div>
              
              <div className="toggle-card">
                <div className="toggle-header">
                  <span className="toggle-icon">🛡️</span>
                  <div>
                    <h4>IP Restriction</h4>
                    <p>Restrict admin access to specific IPs</p>
                  </div>
                </div>
                <label className="toggle-switch luxury">
                  <input
                    type="checkbox"
                    checked={settings.security.ipRestriction}
                    onChange={(e) => handleChange('security', 'ipRestriction', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="form-card full-width">
                <div className="form-header">
                  <span className="form-icon">🌐</span>
                  <h4>Allowed IP Addresses</h4>
                </div>
                <textarea
                  value={settings.security.allowedIPs.join(', ')}
                  onChange={(e) => handleChange('security', 'allowedIPs', e.target.value.split(',').map(ip => ip.trim()))}
                  className="form-textarea"
                  placeholder="192.168.1.1, 192.168.1.2"
                  rows="3"
                />
              </div>
              
              <div className="form-card">
                <div className="form-header">
                  <span className="form-icon">🔢</span>
                  <h4>Max Login Attempts</h4>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.security.loginAttempts}
                  onChange={(e) => handleChange('security', 'loginAttempts', parseInt(e.target.value))}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-section">
            <h3 className="section-title">🔔 Notification Settings</h3>
            <p className="section-description">Configure which notifications to receive</p>
            
            <div className="settings-grid">
              <div className="toggle-card">
                <div className="toggle-header">
                  <span className="toggle-icon">🛒</span>
                  <div>
                    <h4>New Orders</h4>
                    <p>Get notified for new customer orders</p>
                  </div>
                </div>
                <label className="toggle-switch luxury">
                  <input
                    type="checkbox"
                    checked={settings.notifications.notifyNewOrders}
                    onChange={(e) => handleChange('notifications', 'notifyNewOrders', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="toggle-card">
                <div className="toggle-header">
                  <span className="toggle-icon">📦</span>
                  <div>
                    <h4>Low Stock Alerts</h4>
                    <p>Get notified when products are low in stock</p>
                  </div>
                </div>
                <label className="toggle-switch luxury">
                  <input
                    type="checkbox"
                    checked={settings.notifications.notifyLowStock}
                    onChange={(e) => handleChange('notifications', 'notifyLowStock', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="toggle-card">
                <div className="toggle-header">
                  <span className="toggle-icon">👥</span>
                  <div>
                    <h4>New Users</h4>
                    <p>Get notified for new user registrations</p>
                  </div>
                </div>
                <label className="toggle-switch luxury">
                  <input
                    type="checkbox"
                    checked={settings.notifications.notifyNewUsers}
                    onChange={(e) => handleChange('notifications', 'notifyNewUsers', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="toggle-card">
                <div className="toggle-header">
                  <span className="toggle-icon">⭐</span>
                  <div>
                    <h4>Product Reviews</h4>
                    <p>Get notified for new product reviews</p>
                  </div>
                </div>
                <label className="toggle-switch luxury">
                  <input
                    type="checkbox"
                    checked={settings.notifications.notifyReviews}
                    onChange={(e) => handleChange('notifications', 'notifyReviews', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div className="settings-section">
            <h3 className="section-title">🔧 Maintenance Settings</h3>
            <p className="section-description">Configure maintenance mode and system settings</p>
            
            <div className="settings-grid">
              <div className="toggle-card">
                <div className="toggle-header">
                  <span className="toggle-icon">🚧</span>
                  <div>
                    <h4>Maintenance Mode</h4>
                    <p>Put the store in maintenance mode</p>
                  </div>
                </div>
                <label className="toggle-switch luxury">
                  <input
                    type="checkbox"
                    checked={settings.maintenance.maintenanceMode}
                    onChange={(e) => handleChange('maintenance', 'maintenanceMode', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="form-card full-width">
                <div className="form-header">
                  <span className="form-icon">📢</span>
                  <h4>Maintenance Message</h4>
                </div>
                <textarea
                  value={settings.maintenance.maintenanceMessage}
                  onChange={(e) => handleChange('maintenance', 'maintenanceMessage', e.target.value)}
                  className="form-textarea"
                  placeholder="We're performing scheduled maintenance..."
                  rows="4"
                />
              </div>
              
              <div className="toggle-card">
                <div className="toggle-header">
                  <span className="toggle-icon">👑</span>
                  <div>
                    <h4>Allow Admin Access</h4>
                    <p>Allow admin access during maintenance</p>
                  </div>
                </div>
                <label className="toggle-switch luxury">
                  <input
                    type="checkbox"
                    checked={settings.maintenance.allowAdminAccess}
                    onChange={(e) => handleChange('maintenance', 'allowAdminAccess', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'danger':
        return (
          <div className="settings-section">
            <h3 className="section-title danger-title">⚠️ Danger Zone</h3>
            <p className="section-description">Irreversible actions. Proceed with caution.</p>
            
            <div className="danger-actions">
              <div className="danger-action-card">
                <div className="danger-info">
                  <span className="danger-icon">📤</span>
                  <div>
                    <h4>Export All Data</h4>
                    <p>Export all store data including products, orders, customers, and settings as a backup file.</p>
                  </div>
                </div>
                <button 
                  className="danger-btn luxury-btn export"
                  onClick={() => handleDangerAction('exportData')}
                >
                  <span className="btn-icon">📤</span>
                  Export Data
                </button>
              </div>
              
              <div className="danger-action-card">
                <div className="danger-info">
                  <span className="danger-icon">📊</span>
                  <div>
                    <h4>Reset Statistics</h4>
                    <p>Reset all sales, order, and customer statistics to zero. This cannot be undone.</p>
                  </div>
                </div>
                <button 
                  className="danger-btn luxury-btn reset"
                  onClick={() => handleDangerAction('resetStatistics')}
                >
                  <span className="btn-icon">🔄</span>
                  Reset Statistics
                </button>
              </div>
              
              <div className="danger-action-card">
                <div className="danger-info">
                  <span className="danger-icon">🧹</span>
                  <div>
                    <h4>Clear System Cache</h4>
                    <p>Clear all cached data including images, product listings, and API responses.</p>
                  </div>
                </div>
                <button 
                  className="danger-btn luxury-btn cache"
                  onClick={() => handleDangerAction('clearCache')}
                >
                  <span className="btn-icon">⚡</span>
                  Clear Cache
                </button>
              </div>
              
              <div className="danger-action-card">
                <div className="danger-info">
                  <span className="danger-icon">🔥</span>
                  <div>
                    <h4>Factory Reset</h4>
                    <p>Reset all settings to default values. All custom configurations will be lost.</p>
                  </div>
                </div>
                <button 
                  className="danger-btn luxury-btn factory"
                  onClick={() => handleDangerAction('factoryReset')}
                >
                  <span className="btn-icon">🔥</span>
                  Factory Reset
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style jsx>{`
        /* ALL YOUR PREVIOUS CSS STYLES GO HERE */
        /* I'm including the key styles to fix common issues */
        
        .settings-page {
          min-height: 100vh;
          background: #1C1C1C;
          font-family: 'Playfair Display', 'Cormorant Garamond', serif;
          padding: 2rem;
          color: #F5F5F5;
          position: relative;
          overflow: hidden;
        }

        .luxury-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .floating-element {
          position: absolute;
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 50%;
          animation: float 8s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-25px) rotate(180deg);
            opacity: 0.8;
          }
        }

        .loading-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          gap: 1.5rem;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(212, 175, 55, 0.3);
          border-radius: 50%;
          border-top-color: #D4AF37;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Add all your other CSS styles from the previous version */
        .settings-content {
          position: relative;
          z-index: 2;
        }

        .settings-header {
          margin-bottom: 4rem;
          text-align: center;
          position: relative;
        }

        .settings-header::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 4px;
          background: linear-gradient(90deg, transparent, #D4AF37, #4B1C2F, #014421, transparent);
          border-radius: 2px;
        }

        .settings-title {
          color: #D4AF37;
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          font-family: 'Cormorant Garamond', serif;
          text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
          background: linear-gradient(135deg, #D4AF37, #F7E7CE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 1px;
        }

        .settings-subtitle {
          color: rgba(245, 245, 245, 0.9);
          font-size: 1.3rem;
          font-style: italic;
          margin: 0;
          font-weight: 300;
          letter-spacing: 0.5px;
        }

        /* Main Container */
        .settings-container {
          display: flex;
          gap: 2.5rem;
          max-width: 1600px;
          margin: 0 auto;
          position: relative;
        }

        /* Luxury Sidebar */
        .settings-sidebar {
          width: 320px;
          background: rgba(28, 28, 28, 0.85);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 20px;
          padding: 2.5rem;
          height: fit-content;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(212, 175, 55, 0.1);
          position: sticky;
          top: 2rem;
          transition: all 0.4s ease;
        }

        .settings-sidebar:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(212, 175, 55, 0.2);
        }

        .settings-sidebar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #D4AF37, #4B1C2F, #014421, #001F3F);
          border-radius: 20px 20px 0 0;
        }

        .tab-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .tab-item {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 1.4rem 1.8rem;
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          color: #F5F5F5;
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          text-align: left;
        }

        .tab-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
          transition: left 0.6s ease;
        }

        .tab-item:hover::before {
          left: 100%;
        }

        .tab-item:hover {
          background: rgba(212, 175, 55, 0.08);
          border-color: rgba(212, 175, 55, 0.4);
          transform: translateX(10px);
          box-shadow: 0 10px 20px rgba(212, 175, 55, 0.15);
        }

        .tab-item.active {
          background: rgba(212, 175, 55, 0.15);
          border-color: #D4AF37;
          color: #D4AF37;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(212, 175, 55, 0.2);
        }

        .tab-icon {
          font-size: 1.4rem;
          width: 28px;
          transition: transform 0.3s ease;
        }

        .tab-item:hover .tab-icon {
          transform: scale(1.2) rotate(10deg);
        }

        /* Luxury Main Content */
        .settings-main {
          flex: 1;
          background: rgba(28, 28, 28, 0.85);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 20px;
          padding: 3.5rem;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(212, 175, 55, 0.1);
          transition: all 0.4s ease;
        }

        .settings-main:hover {
          transform: translateY(-3px);
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(212, 175, 55, 0.2);
        }

        .settings-main::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #001F3F, #014421, #4B1C2F, #D4AF37);
          border-radius: 20px 20px 0 0;
        }

        /* Settings Section */
        .settings-section {
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .section-title {
          color: #D4AF37;
          font-size: 2.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          font-family: 'Cormorant Garamond', serif;
          position: relative;
          display: inline-block;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 100px;
          height: 3px;
          background: linear-gradient(90deg, #D4AF37, transparent);
          border-radius: 2px;
        }

        .danger-title {
          color: #ff6b6b;
        }

        .danger-title::after {
          background: linear-gradient(90deg, #ff6b6b, transparent);
        }

        .section-description {
          color: rgba(245, 245, 245, 0.8);
          font-size: 1.2rem;
          margin-bottom: 3rem;
          font-style: italic;
          line-height: 1.6;
        }

        /* Settings Grid */
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        /* Luxury Card Designs */
        .form-card {
          background: rgba(28, 28, 28, 0.7);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 15px;
          padding: 2rem;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }

        .form-card:hover {
          transform: translateY(-8px);
          border-color: #D4AF37;
          box-shadow: 0 20px 40px rgba(212, 175, 55, 0.15);
        }

        .form-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(to bottom, #D4AF37, #4B1C2F);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .form-card:hover::before {
          opacity: 1;
        }

        .form-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-icon {
          font-size: 1.8rem;
          color: #D4AF37;
          background: rgba(212, 175, 55, 0.1);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .form-header h4 {
          color: #F5F5F5;
          margin: 0;
          font-size: 1.3rem;
          font-weight: 600;
          font-family: 'Cormorant Garamond', serif;
        }

        /* Form Elements */
        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 1.3rem 1.5rem;
          background: rgba(245, 245, 245, 0.07);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 10px;
          color: #F5F5F5;
          font-size: 1.05rem;
          font-family: 'Playfair Display', serif;
          transition: all 0.3s ease;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #D4AF37;
          background: rgba(245, 245, 245, 0.1);
          box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.15);
          transform: translateY(-3px);
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
        }

        .input-with-unit {
          position: relative;
        }

        .unit {
          position: absolute;
          right: 1.5rem;
          top: 50%;
          transform: translateY(-50%);
          color: #D4AF37;
          font-weight: 600;
        }

        /* Toggle Cards */
        .toggle-card {
          background: rgba(28, 28, 28, 0.7);
          border: 1px solid rgba(75, 28, 47, 0.3);
          border-radius: 15px;
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.4s ease;
          grid-column: 1 / -1;
        }

        .toggle-card:hover {
          transform: translateY(-5px);
          border-color: #4B1C2F;
          box-shadow: 0 15px 30px rgba(75, 28, 47, 0.2);
        }

        .toggle-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .toggle-icon {
          font-size: 2rem;
          color: #D4AF37;
          background: rgba(212, 175, 55, 0.1);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .toggle-header h4 {
          color: #F5F5F5;
          margin: 0 0 0.5rem 0;
          font-size: 1.3rem;
        }

        .toggle-header p {
          color: rgba(245, 245, 245, 0.7);
          margin: 0;
          font-size: 0.95rem;
        }

        /* Luxury Toggle Switch */
        .toggle-switch.luxury {
          position: relative;
          display: inline-block;
          width: 70px;
          height: 34px;
        }

        .toggle-switch.luxury input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-switch.luxury .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(245, 245, 245, 0.1), rgba(245, 245, 245, 0.05));
          transition: .4s;
          border-radius: 34px;
          border: 2px solid rgba(212, 175, 55, 0.4);
        }

        .toggle-switch.luxury .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 2px;
          background: linear-gradient(135deg, #F7E7CE, #D4AF37);
          transition: .4s;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
        }

        .toggle-switch.luxury input:checked + .slider {
          background: linear-gradient(135deg, #014421, #001F3F);
          border-color: #014421;
        }

        .toggle-switch.luxury input:checked + .slider:before {
          transform: translateX(34px);
          background: linear-gradient(135deg, #F7E7CE, #4CAF50);
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }

        /* Email Test Card */
        .test-email-card {
          background: linear-gradient(135deg, rgba(1, 68, 33, 0.2), rgba(0, 31, 63, 0.2));
          border: 1px solid rgba(1, 68, 33, 0.4);
          border-radius: 15px;
          padding: 2.5rem;
          transition: all 0.4s ease;
        }

        .test-email-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(1, 68, 33, 0.3);
        }

        .test-email-content {
          text-align: center;
        }

        .test-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .test-icon {
          font-size: 2.5rem;
          color: #D4AF37;
        }

        .test-header h4 {
          color: #F5F5F5;
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .test-header p {
          color: rgba(245, 245, 245, 0.8);
          margin: 0;
          font-size: 1rem;
        }

        .email-result {
          padding: 1.2rem;
          border-radius: 10px;
          margin-bottom: 2rem;
          font-weight: 500;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .email-result.success {
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid #4CAF50;
          color: #4CAF50;
        }

        .email-result.error {
          background: rgba(255, 107, 107, 0.2);
          border: 1px solid #ff6b6b;
          color: #ff6b6b;
        }

        /* Luxury Buttons */
        .luxury-btn {
          padding: 1.2rem 2.5rem;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          font-family: 'Playfair Display', serif;
          position: relative;
          overflow: hidden;
          min-width: 200px;
          margin: 0 auto;
        }

        .luxury-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s ease;
        }

        .luxury-btn:hover::before {
          left: 100%;
        }

        .test-email-btn {
          background: linear-gradient(135deg, #D4AF37, #F7E7CE);
          color: #1C1C1C;
        }

        .test-email-btn:hover:not(:disabled) {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 20px 40px rgba(212, 175, 55, 0.5);
        }

        .test-email-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-icon {
          font-size: 1.3rem;
        }

        /* Danger Zone */
        .danger-actions {
          display: flex;
          flex-direction: column;
          gap: 1.8rem;
        }

        .danger-action-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2.5rem;
          background: rgba(75, 28, 47, 0.15);
          border: 1px solid rgba(75, 28, 47, 0.4);
          border-radius: 15px;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }

        .danger-action-card:hover {
          transform: translateX(10px);
          background: rgba(75, 28, 47, 0.25);
          border-color: #4B1C2F;
          box-shadow: 0 15px 30px rgba(75, 28, 47, 0.3);
        }

        .danger-info {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .danger-info h4 {
          color: #ff6b6b;
          margin: 0 0 0.8rem 0;
          font-size: 1.4rem;
        }

        .danger-info p {
          color: rgba(245, 245, 245, 0.8);
          margin: 0;
          font-size: 1rem;
          max-width: 700px;
          line-height: 1.6;
        }

        .danger-icon {
          font-size: 2.5rem;
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 107, 107, 0.3);
        }

        .danger-btn.luxury-btn {
          min-width: 180px;
          border: 2px solid;
        }

        .danger-btn.luxury-btn.export {
          background: transparent;
          color: #D4AF37;
          border-color: #D4AF37;
        }

        .danger-btn.luxury-btn.export:hover {
          background: rgba(212, 175, 55, 0.1);
          transform: translateY(-3px) scale(1.05);
        }

        .danger-btn.luxury-btn.reset {
          background: transparent;
          color: #ff6b6b;
          border-color: #ff6b6b;
        }

        .danger-btn.luxury-btn.reset:hover {
          background: rgba(255, 107, 107, 0.1);
          transform: translateY(-3px) scale(1.05);
        }

        .danger-btn.luxury-btn.cache {
          background: transparent;
          color: #4B1C2F;
          border-color: #4B1C2F;
        }

        .danger-btn.luxury-btn.cache:hover {
          background: rgba(75, 28, 47, 0.1);
          transform: translateY(-3px) scale(1.05);
        }

        .danger-btn.luxury-btn.factory {
          background: transparent;
          color: #dc3545;
          border-color: #dc3545;
        }

        .danger-btn.luxury-btn.factory:hover {
          background: rgba(220, 53, 69, 0.1);
          transform: translateY(-3px) scale(1.05);
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4rem;
          padding-top: 2.5rem;
          border-top: 1px solid rgba(212, 175, 55, 0.3);
        }

        .back-btn {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.4);
          color: #D4AF37;
          padding: 1.2rem 2.5rem;
          border-radius: 12px;
          font-size: 1.2rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s ease;
          display: flex;
          align-items: center;
          gap: 1rem;
          font-family: 'Playfair Display', serif;
        }

        .back-btn:hover {
          background: rgba(212, 175, 55, 0.2);
          transform: translateX(-10px);
          box-shadow: 0 15px 30px rgba(212, 175, 55, 0.2);
        }

        .save-btn {
          background: linear-gradient(135deg, #D4AF37, #F7E7CE);
          color: #1C1C1C;
          border: none;
          padding: 1.4rem 4rem;
          border-radius: 12px;
          font-size: 1.3rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 1.2rem;
          font-family: 'Playfair Display', serif;
          letter-spacing: 0.5px;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 25px 50px rgba(212, 175, 55, 0.5);
        }

        .save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid transparent;
          border-top: 3px solid #1C1C1C;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Success Message */
        .success-message {
          background: linear-gradient(135deg, rgba(1, 68, 33, 0.3), rgba(0, 31, 63, 0.2));
          border: 1px solid #014421;
          color: #4CAF50;
          padding: 1.5rem 2rem;
          border-radius: 12px;
          margin-top: 2.5rem;
          text-align: center;
          font-size: 1.2rem;
          font-weight: 500;
          animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 20px rgba(1, 68, 33, 0.2);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Responsive Design */
        @media (max-width: 1400px) {
          .settings-container {
            flex-direction: column;
          }
          
          .settings-sidebar {
            width: 100%;
            position: static;
          }
          
          .tab-list {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .tab-item {
            flex: 1;
            min-width: 220px;
            justify-content: center;
          }
          
          .settings-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 1024px) {
          .settings-page {
            padding: 1.5rem;
          }
          
          .settings-title {
            font-size: 3rem;
          }
          
          .settings-main {
            padding: 3rem;
          }
          
          .settings-grid {
            grid-template-columns: 1fr;
          }
          
          .danger-action-card {
            flex-direction: column;
            gap: 2rem;
            align-items: flex-start;
          }
          
          .danger-btn.luxury-btn {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .settings-title {
            font-size: 2.5rem;
          }
          
          .section-title {
            font-size: 2.2rem;
          }
          
          .settings-main {
            padding: 2rem;
          }
          
          .tab-item {
            min-width: 180px;
            padding: 1.2rem;
          }
          
          .action-buttons {
            flex-direction: column;
            gap: 1.5rem;
          }
          
          .back-btn,
          .save-btn {
            width: 100%;
            justify-content: center;
          }
          
          .luxury-btn {
            min-width: 100%;
          }
        }

        @media (max-width: 480px) {
          .settings-title {
            font-size: 2.2rem;
          }
          
          .section-title {
            font-size: 1.8rem;
          }
          
          .settings-main {
            padding: 1.5rem;
          }
          
          .form-card,
          .toggle-card,
          .danger-action-card {
            padding: 1.5rem;
          }
          
          .tab-item {
            min-width: 140px;
          }
          
          .danger-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .danger-icon {
            width: 50px;
            height: 50px;
            font-size: 1.8rem;
          }
        }
      `}</style>

<div className="settings-page">
        {/* Luxury Background Elements */}
        <div className="luxury-background">
          {floatingElements.map(element => (
            <div
              key={element.id}
              className="floating-element"
              style={{
                width: `${element.size}px`,
                height: `${element.size}px`,
                top: `${element.y}%`,
                left: `${element.x}%`,
                animationDelay: `${element.delay}s`,
                borderColor: `rgba(${element.id === 1 ? '212, 175, 55' : element.id === 2 ? '75, 28, 47' : element.id === 3 ? '1, 68, 33' : '0, 31, 63'}, 0.4)`
              }}
            />
          ))}
        </div>

        <div className="settings-content">
          {/* Header */}
          <div className="settings-header">
            <h1 className="settings-title">⚙️ Admin Settings</h1>
            <p className="settings-subtitle">Configure your luxury fashion empire with precision</p>
          </div>

          <div className="settings-container">
            {/* Luxury Sidebar */}
            <div className="settings-sidebar">
              <div className="tab-list">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setEmailTestResult(null);
                      setSuccessMessage('');
                    }}
                    style={{
                      borderLeftColor: activeTab === tab.id ? tab.color : 'transparent'
                    }}
                  >
                    <span className="tab-icon">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Luxury Main Content */}
            <div className="settings-main">
              {renderSettingsContent()}
              
              {/* Success Message */}
              {successMessage && (
                <div className="success-message">
                  ✨ {successMessage}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="action-buttons">
                <button 
                  className="back-btn"
                  onClick={() => navigate('/admin/dashboard')}
                >
                  <span className="btn-icon">←</span>
                  Back to Dashboard
                </button>
                
                <button 
                  className="save-btn"
                  onClick={handleSaveSettings}
                  disabled={saving || loading}
                >
                  {saving ? (
                    <>
                      <div className="spinner"></div>
                      Saving Changes...
                    </>
                  ) : (
                    '💎 Save All Settings'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;