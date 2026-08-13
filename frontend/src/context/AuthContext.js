import React, { createContext, useState, useContext, useEffect } from 'react';
import { userAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    const userData = localStorage.getItem('user');
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminUser');

    if (userToken && userData && userData !== 'undefined') {
      try {
        setUser(JSON.parse(userData));
      } catch (_) {
        localStorage.removeItem('user');
        localStorage.removeItem('userToken');
      }
    }

    if (adminToken && adminData && adminData !== 'undefined') {
      try {
        setAdminUser(JSON.parse(adminData));
      } catch (_) {
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminToken');
      }
    }

    // Refresh profile state from backend database to ensure persistence
    if (adminToken || userToken) {
      userAPI.getProfile().then(res => {
        if (res && res.user) {
          if (res.user.role === 'admin' && adminToken) {
            setAdminUser(prev => {
              const updated = { ...(prev || {}), ...res.user };
              localStorage.setItem('adminUser', JSON.stringify(updated));
              if (res.user.avatarUrl) {
                localStorage.setItem('adminProfileAvatar', res.user.avatarUrl);
              }
              return updated;
            });
          } else if (userToken) {
            setUser(prev => {
              const updated = { ...(prev || {}), ...res.user };
              localStorage.setItem('user', JSON.stringify(updated));
              if (res.user.avatarUrl) {
                localStorage.setItem('userProfileAvatar', res.user.avatarUrl);
              }
              return updated;
            });
          }
        }
      }).catch(err => {
        console.warn('AuthContext profile sync notice:', err.message);
      });
    }

    setLoading(false);
  }, []);


  const loginUser = (userData, token) => {
    localStorage.setItem('userToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginAdmin = (adminData, token) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(adminData));
    setAdminUser(adminData);
  };

  const updateUser = (updatedData) => {
    setUser(prev => {
      const next = { ...(prev || {}), ...updatedData };
      localStorage.setItem('user', JSON.stringify(next));
      window.dispatchEvent(new StorageEvent('storage', { key: 'user', newValue: JSON.stringify(next) }));
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: next }));
      return next;
    });
  };

  const updateAdminUser = (updatedData) => {
    setAdminUser(prev => {
      const next = { ...(prev || {}), ...updatedData };
      localStorage.setItem('adminUser', JSON.stringify(next));
      window.dispatchEvent(new StorageEvent('storage', { key: 'adminUser', newValue: JSON.stringify(next) }));
      window.dispatchEvent(new CustomEvent('adminUserUpdated', { detail: next }));
      return next;
    });
  };

  const logoutUser = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminUser(null);
  };

  const value = {
    user,
    adminUser,
    loginUser,
    loginAdmin,
    updateUser,
    updateAdminUser,
    logoutUser,
    logoutAdmin,
    logout: logoutAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};