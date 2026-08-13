const API_BASE = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api`;

// ===== OPTIMIZED FETCH LAYER (Deduplication + GET Caching + Abort Signals) =====
const inFlightRequests = new Map();
const responseCache = new Map();
const CACHE_TTL_MS = 4000;

export const clearApiCache = () => {
  responseCache.clear();
};

export const fetchOptimized = async (url, options = {}) => {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const cacheKey = `${url}_${options.headers?.Authorization || ''}`;

  if (isGet) {
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return JSON.parse(JSON.stringify(cached.data));
    }

    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey);
    }
  } else {
    // Invalidate cache on mutations
    responseCache.clear();
  }

  const promise = (async () => {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (isGet && response.ok) {
        responseCache.set(cacheKey, { timestamp: Date.now(), data });
      }
      return data;
    } catch (err) {
      throw err;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  if (isGet) {
    inFlightRequests.set(cacheKey, promise);
  }

  return promise;
};

// ===== PRODUCT API ===== (MUST BE FIRST!)
export const productAPI = {
  getAll: async () => {
    try {
      return await fetchOptimized(`${API_BASE}/products`);
    } catch (error) {
      console.error('❌ GET Products Error:', error);
      throw error;
    }
  },

  getFiltered: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      const url = `${API_BASE}/products${queryString ? `?${queryString}` : ''}`;
      return await fetchOptimized(url);
    } catch (error) {
      console.error('❌ GET Filtered Products Error:', error);
      throw error;
    }
  },

  create: async (productData) => {
    try {
      console.log('🛠️ Creating Product - Data being sent:', productData);
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      console.log('📥 Create Response Status:', response.status);
      const text = await response.text();
      console.log('📥 Create Response Text:', text);
      
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }
      
      if (!response.ok) {
        console.log('❌ Backend Error:', data.message || 'Error creating product');
        throw new Error(data.message || 'Error creating product');
      }
      
      console.log('✅ Create Product Success:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating product:', error);
      throw error;
    }
  },

  update: async (id, productData) => {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      return response.json();
    } catch (error) {
      console.error('❌ Update Error:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    } catch (error) {
      console.error('❌ Delete Error:', error);
      throw error;
    }
  },

  bulkDelete: async (productIds) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/products/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productIds })
      });
      return response.json();
    } catch (error) {
      console.error('❌ Bulk Delete Error:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`);
      return response.json();
    } catch (error) {
      console.error('❌ Get By ID Error:', error);
      throw error;
    }
  },

  globalSearch: async (query) => {
    try {
      if (!query || !query.trim()) {
        return { success: true, results: { departments: [], categories: [], subcategories: [], products: [] } };
      }
      return await fetchOptimized(`${API_BASE}/products/search-global?q=${encodeURIComponent(query.trim())}`);
    } catch (error) {
      console.error('❌ Global Search Error:', error);
      throw error;
    }
  },

  getRelated: async (id) => {
    try {
      if (!id) return { success: true, products: [] };
      return await fetchOptimized(`${API_BASE}/products/${id}/related`);
    } catch (error) {
      console.error('❌ Get Related Products Error:', error);
      throw error;
    }
  }
};

// ===== CART API =====
export const cartAPI = {
  getCart: async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      const adminViewing = localStorage.getItem('adminViewingCustomer');
      const viewedCustomerId = localStorage.getItem('viewedCustomerId');
      
      if (adminViewing === 'true' && viewedCustomerId) {
        const response = await fetch(`${API_BASE}/admin/customers/${viewedCustomerId}/cart`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      }
      
      const response = await fetch(`${API_BASE}/users/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching cart:', error);
      const userId = getUserId();
      const cart = JSON.parse(localStorage.getItem(`userCart_${userId}`) || '[]');
      return { cart };
    }
  },

  addToCart: async (productId, quantity = 1) => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      const adminViewing = localStorage.getItem('adminViewingCustomer');
      const viewedCustomerId = localStorage.getItem('viewedCustomerId');
      
      let url = `${API_BASE}/users/cart/add`;
      
      if (adminViewing === 'true' && viewedCustomerId) {
        url = `${API_BASE}/admin/customers/${viewedCustomerId}/cart/add`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  removeFromCart: async (productId) => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      const adminViewing = localStorage.getItem('adminViewingCustomer');
      const viewedCustomerId = localStorage.getItem('viewedCustomerId');
      
      let url = `${API_BASE}/users/cart/remove/${productId}`;
      
      if (adminViewing === 'true' && viewedCustomerId) {
        url = `${API_BASE}/admin/customers/${viewedCustomerId}/cart/remove/${productId}`;
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from cart');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  updateCartQuantity: async (productId, quantity) => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      const adminViewing = localStorage.getItem('adminViewingCustomer');
      const viewedCustomerId = localStorage.getItem('viewedCustomerId');
      
      let url = `${API_BASE}/users/cart/update`;
      
      if (adminViewing === 'true' && viewedCustomerId) {
        url = `${API_BASE}/admin/customers/${viewedCustomerId}/cart/update`;
      }
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update cart');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  },

  clearCart: async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      const adminViewing = localStorage.getItem('adminViewingCustomer');
      const viewedCustomerId = localStorage.getItem('viewedCustomerId');
      
      let url = `${API_BASE}/users/cart/clear`;
      
      if (adminViewing === 'true' && viewedCustomerId) {
        url = `${API_BASE}/admin/customers/${viewedCustomerId}/cart/clear`;
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
};

// ===== WISHLIST API =====
export const wishlistAPI = {
  getWishlist: async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      const adminViewing = localStorage.getItem('adminViewingCustomer');
      const viewedCustomerId = localStorage.getItem('viewedCustomerId');
      
      if (adminViewing === 'true' && viewedCustomerId) {
        const response = await fetch(`${API_BASE}/admin/customers/${viewedCustomerId}/wishlist`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      }
      
      const response = await fetch(`${API_BASE}/users/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      const userId = getUserId();
      const wishlist = JSON.parse(localStorage.getItem(`userWishlist_${userId}`) || '[]');
      return { wishlist };
    }
  },

  addToWishlist: async (productId) => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      const adminViewing = localStorage.getItem('adminViewingCustomer');
      const viewedCustomerId = localStorage.getItem('viewedCustomerId');
      
      let url = `${API_BASE}/users/wishlist/add`;
      
      if (adminViewing === 'true' && viewedCustomerId) {
        url = `${API_BASE}/admin/customers/${viewedCustomerId}/wishlist/add`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to wishlist');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  },

  removeFromWishlist: async (productId) => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      const adminViewing = localStorage.getItem('adminViewingCustomer');
      const viewedCustomerId = localStorage.getItem('viewedCustomerId');
      
      let url = `${API_BASE}/users/wishlist/remove/${productId}`;
      
      if (adminViewing === 'true' && viewedCustomerId) {
        url = `${API_BASE}/admin/customers/${viewedCustomerId}/wishlist/remove/${productId}`;
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  },

  clearWishlist: async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      const adminViewing = localStorage.getItem('adminViewingCustomer');
      const viewedCustomerId = localStorage.getItem('viewedCustomerId');
      
      let url = `${API_BASE}/users/wishlist/clear`;
      
      if (adminViewing === 'true' && viewedCustomerId) {
        url = `${API_BASE}/admin/customers/${viewedCustomerId}/wishlist/clear`;
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear wishlist');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      throw error;
    }
  }
};

// ===== ORDER API =====
export const orderAPI = {
  getOrders: async () => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE}/users/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  createOrder: async (orderData) => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE}/users/orders/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    return response.json();
  },

  cancelOrder: async (orderId) => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE}/users/orders/cancel/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

// ===== COUPON API =====
export const couponAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE}/coupons`);
      const data = await response.json();
      if (data && Array.isArray(data.coupons)) {
        return data;
      } else if (Array.isArray(data)) {
        return { success: true, coupons: data };
      } else if (data && data.data && Array.isArray(data.data)) {
        return { success: true, coupons: data.data };
      }
      return { success: true, coupons: [] };
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return { success: false, coupons: [], message: error.message };
    }
  },

  getCoupons: async () => {
    try {
      const response = await fetch(`${API_BASE}/coupons`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.coupons)) {
        return data.coupons;
      } else if (data && data.data && Array.isArray(data.data)) {
        return data.data;
      } else {
        console.warn('Unexpected API response format for coupons:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return [];
    }
  },

  createCoupon: async (couponData) => {
    const response = await fetch(`${API_BASE}/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(couponData),
    });
    return response.json();
  },

  updateCoupon: async (id, couponData) => {
    const response = await fetch(`${API_BASE}/coupons/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(couponData),
    });
    return response.json();
  },

  deleteCoupon: async (id) => {
    const response = await fetch(`${API_BASE}/coupons/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  getCategories: async () => {
    try {
      const response = await fetch('https://api.escuelajs.co/api/v1/categories');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  getProducts: async () => {
    try {
      const response = await fetch('https://api.escuelajs.co/api/v1/products');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
};

// ===== MESSAGE API =====
export const messageAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/messages`);
    return response.json();
  },

  create: async (messageData) => {
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE}/messages/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  }
};

// ===== ADMIN SYNC API =====
export const adminSyncAPI = {
  syncCart: async (customerId, cart) => {
    const token = localStorage.getItem('adminToken');
    return fetch(`${API_BASE}/customers/sync/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ customerId, cart })
    }).then(res => res.json());
  },

  syncWishlist: async (customerId, wishlist) => {
    const token = localStorage.getItem('adminToken');
    return fetch(`${API_BASE}/customers/sync/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ customerId, wishlist })
    }).then(res => res.json());
  },

  syncOrder: async (customerId, order) => {
    const token = localStorage.getItem('adminToken');
    return fetch(`${API_BASE}/customers/sync/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ customerId, order })
    }).then(res => res.json());
  }
};

// ===== CATEGORY API =====
export const categoryAPI = {
  getAll: async (enabledOnly = false) => {
    const res = await fetch(`${API_BASE}/categories${enabledOnly ? '?enabledOnly=true' : ''}`);
    return res.json();
  },
  create: async (data) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  update: async (id, data) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  toggleStatus: async (id, isEnabled) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/categories/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isEnabled })
    });
    return res.json();
  },
  delete: async (id) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return res.json();
  },
  bulkImport: async (items) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/categories/bulk-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items })
    });
    return res.json();
  }
};

// ===== LIVE CHAT API =====
export const chatAPI = {
  getMessages: async (customerId, viewer = 'admin') => {
    const res = await fetch(`${API_BASE}/chat/messages/${customerId}?viewer=${viewer}`);
    return res.json();
  },
  sendMessage: async (data) => {
    const res = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  clearChat: async (customerId, requester = 'admin') => {
    const res = await fetch(`${API_BASE}/chat/clear/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester })
    });
    return res.json();
  },
  getConversations: async () => {
    const res = await fetch(`${API_BASE}/chat/conversations`);
    return res.json();
  },
  markRead: async (customerId, reader = 'admin') => {
    const res = await fetch(`${API_BASE}/chat/read/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reader })
    });
    return res.json();
  }
};

// ===== INTERNAL ADMIN CHAT API =====
export const internalChatAPI = {
  // Fetch bi-directional messages between two admins
  getMessages: async (senderId, recipientId) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/chat/internal/${senderId}/${recipientId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.json();
  },

  // Send internal message from one admin to another
  sendMessage: async ({ senderId, recipientId, senderName, message }) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/chat/internal/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ senderId, recipientId, senderName, message })
    });
    return res.json();
  },

  // Mark messages from senderId to recipientId as read
  markRead: async (senderId, recipientId) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/chat/internal/read/${senderId}/${recipientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return res.json();
  },

  // Get count of unread internal messages for a recipient admin
  getUnread: async (recipientId) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/chat/internal/unread/${recipientId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.json();
  }
};

// ===== NOTIFICATIONS API =====
export const notificationAPI = {
  getAll: async () => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  markAllRead: async () => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  markRead: async (id) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  delete: async (id) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};

// ===== USER PROFILE & SECURITY API =====
export const userAPI = {
  getProfile: async () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
    const res = await fetch(`${API_BASE}/users/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  updateProfile: async (profileData) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    return res.json();
  },
  changePassword: async (currentPassword, newPassword) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
    const res = await fetch(`${API_BASE}/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return res.json();
  }
};

// Helper to get user ID
const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?._id || user?.id || 'guest';
  } catch (error) {
    return 'guest';
  }
};

// Standardized profile image URL resolver across the app
export const resolveProfileImage = (userObj) => {
  let target = userObj?.avatarUrl || userObj?.profileImage || userObj?.avatar || userObj?.image;

  if (!target && typeof window !== 'undefined') {
    if (userObj?.role === 'admin' || !userObj) {
      target = localStorage.getItem('adminProfileAvatar');
    }
    if (!target) {
      target = localStorage.getItem('userProfileAvatar');
    }
  }

  if (!target || typeof target !== 'string') return null;

  const trimmed = target.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:image/')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

  const serverBase = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${serverBase}${cleanPath}`;
};