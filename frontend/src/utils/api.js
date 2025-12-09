const API_BASE = 'http://localhost:5000/api';

// ===== PRODUCT API ===== (MUST BE FIRST!)
export const productAPI = {
  getAll: async () => {
    try {
      console.log('📡 GET Products:', `${API_BASE}/products`);
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      console.log('✅ GET Products Success:', data);
      return data;
    } catch (error) {
      console.error('❌ GET Products Error:', error);
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

  importFromAPI: async () => {
    try {
      console.log('🚀 Importing from external API...');
      
      // Get the admin token
      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      
      const response = await fetch(`${API_BASE}/products/import-from-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });
      
      console.log('📦 Import Response Status:', response.status);
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `HTTP error ${response.status}`;
        } catch {
          errorMessage = `HTTP error ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('📦 Import Response Data:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Import Error:', error);
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

  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`);
      return response.json();
    } catch (error) {
      console.error('❌ Get By ID Error:', error);
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

// Helper to get user ID
const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?._id || user?.id || 'guest';
  } catch (error) {
    return 'guest';
  }
};