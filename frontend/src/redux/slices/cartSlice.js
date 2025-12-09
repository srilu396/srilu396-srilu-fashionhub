import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../utils/api';

// Get user ID from localStorage
const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?._id || user?.id || 'guest';
  } catch (error) {
    return 'guest';
  }
};

// Function to get full product data by ID
const getProductById = async (productId) => {
  try {
    // Try to fetch from API first
    const response = await fetch(`http://localhost:5000/api/products/${productId}`);
    
    if (response.ok) {
      const product = await response.json();
      console.log('✅ Fetched product from API for cart:', product.name);
      return product;
    } else {
      // Fallback
      return {
        _id: productId,
        name: 'Product Name',
        price: 0,
        image: 'https://via.placeholder.com/300x400?text=Product+Image',
        category: 'General',
      };
    }
  } catch (error) {
    console.log('⚠️ Error fetching product for cart:', error);
    return {
      _id: productId,
      name: 'Product Name',
      price: 0,
      image: 'https://via.placeholder.com/300x400?text=Product+Image',
      category: 'General',
    };
  }
};

// Mock API calls for fallback
const mockCartAPI = {
  getCart: async () => {
    try {
      const userId = getUserId();
      const cartStr = localStorage.getItem(`userCart_${userId}`) || '[]';
      const cart = JSON.parse(cartStr);
      
      // Ensure all items have required properties with proper images
      const validCart = cart.map(item => {
        const product = item.product || {};
        return {
          ...item,
          product: {
            ...product,
            _id: product._id || product.id,
            id: product.id || product._id,
            name: product.name || 'Product Name',
            price: product.price || 0,
            image: product.image || product.imageUrl || 'https://via.placeholder.com/300x400',
            brand: product.brand || 'Brand',
            category: product.category || 'general'
          }
        };
      }).filter(item => item && item.product && item.product.id);
      
      return { cart: validCart };
    } catch (error) {
      console.error('Error fetching cart:', error);
      return { cart: [] };
    }
  },
  
  addToCart: async (product, quantity = 1) => {
    try {
      const userId = getUserId();
      if (!userId || userId === 'guest') {
        throw new Error('User not logged in');
      }
      
      let cart = JSON.parse(localStorage.getItem(`userCart_${userId}`) || '[]');
      
      // Ensure product has required properties with proper image
      const productToAdd = {
        id: product.id || product._id,
        _id: product._id || product.id,
        name: product.name || 'Product',
        price: product.price || 0,
        image: product.image || product.imageUrl || 'https://via.placeholder.com/300x400',
        brand: product.brand || 'Brand',
        category: product.category || 'general'
      };
      
      const productId = productToAdd.id;
      
      // Check if product already in cart
      const existingIndex = cart.findIndex(item => 
        (item.product?.id || item.product?._id) === productId
      );
      
      if (existingIndex > -1) {
        // Update quantity
        cart[existingIndex].quantity += quantity;
      } else {
        // Add new item
        cart.push({
          product: productToAdd,
          quantity,
          addedAt: new Date().toISOString()
        });
      }
      
      localStorage.setItem(`userCart_${userId}`, JSON.stringify(cart));
      return { cart };
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },
  
  removeFromCart: async (productId) => {
    try {
      const userId = getUserId();
      let cart = JSON.parse(localStorage.getItem(`userCart_${userId}`) || '[]');
      
      cart = cart.filter(item => 
        (item.product?.id || item.product?._id) !== productId
      );
      
      localStorage.setItem(`userCart_${userId}`, JSON.stringify(cart));
      return { cart };
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },
  
  updateCartQuantity: async (productId, quantity) => {
    try {
      const userId = getUserId();
      let cart = JSON.parse(localStorage.getItem(`userCart_${userId}`) || '[]');
      
      const itemIndex = cart.findIndex(item => 
        (item.product?.id || item.product?._id) === productId
      );
      
      if (itemIndex > -1) {
        if (quantity < 1) {
          cart.splice(itemIndex, 1);
        } else {
          cart[itemIndex].quantity = quantity;
        }
      }
      
      localStorage.setItem(`userCart_${userId}`, JSON.stringify(cart));
      return { cart };
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  },
  
  clearCart: async () => {
    try {
      const userId = getUserId();
      localStorage.setItem(`userCart_${userId}`, JSON.stringify([]));
      return { cart: [] };
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
};

// Async thunks that save to database with fallback
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.getCart();
      
      // If backend returns cart items with product IDs only, fetch full product data
      if (response.cart && response.cart.length > 0 && 
          response.cart[0].product && typeof response.cart[0].product === 'string') {
        console.log('🔍 Backend returned product IDs only, fetching full product data...');
        const cartWithFullProducts = await Promise.all(
          response.cart.map(async (cartItem) => {
            try {
              const product = await getProductById(cartItem.product);
              return {
                ...cartItem,
                product: {
                  ...product,
                  image: product.image || product.imageUrl || product.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'
                }
              };
            } catch (error) {
              console.error(`Error fetching product ${cartItem.product}:`, error);
              return {
                ...cartItem,
                product: {
                  _id: cartItem.product,
                  name: 'Unknown Product',
                  price: 0,
                  image: 'https://via.placeholder.com/300x400?text=No+Image',
                  category: 'General'
                }
              };
            }
          })
        );
        
        return { cart: cartWithFullProducts };
      }
      
      // If backend already returns full product data, ensure images are proper
      if (response.cart && response.cart.length > 0 && response.cart[0].product) {
        const cartWithImages = response.cart.map(item => ({
          ...item,
          product: {
            ...item.product,
            image: item.product.image || item.product.imageUrl || item.product.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'
          }
        }));
        
        return { cart: cartWithImages };
      }
      
      return response;
    } catch (error) {
      console.error('Fetch cart error, using fallback:', error);
      // Fallback to localStorage
      try {
        const fallback = await mockCartAPI.getCart();
        return fallback;
      } catch (fallbackError) {
        return rejectWithValue(fallbackError.message);
      }
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ product, quantity = 1 }, { rejectWithValue }) => {
    try {
      const productId = product._id || product.id;
      if (!productId) {
        throw new Error('Product ID is required');
      }
      
      const response = await cartAPI.addToCart(productId, quantity);
      
      // If backend returns success, fetch updated cart with full product data
      if (response.success) {
        const updatedCart = await fetchCart();
        return updatedCart;
      }
      
      return response;
    } catch (error) {
      console.error('Add to cart error, using fallback:', error);
      // Fallback to localStorage
      try {
        const fallback = await mockCartAPI.addToCart(product, quantity);
        return fallback;
      } catch (fallbackError) {
        return rejectWithValue(fallbackError.message);
      }
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await cartAPI.removeFromCart(productId);
      
      // If backend returns success, fetch updated cart
      if (response.success) {
        const updatedCart = await fetchCart();
        return updatedCart;
      }
      
      return response;
    } catch (error) {
      console.error('Remove from cart error, using fallback:', error);
      // Fallback to localStorage
      try {
        const fallback = await mockCartAPI.removeFromCart(productId);
        return fallback;
      } catch (fallbackError) {
        return rejectWithValue(fallbackError.message);
      }
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  'cart/updateCartQuantity',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.updateCartQuantity(productId, quantity);
      
      // If backend returns success, fetch updated cart
      if (response.success) {
        const updatedCart = await fetchCart();
        return updatedCart;
      }
      
      return response;
    } catch (error) {
      console.error('Update cart quantity error, using fallback:', error);
      // Fallback to localStorage
      try {
        const fallback = await mockCartAPI.updateCartQuantity(productId, quantity);
        return fallback;
      } catch (fallbackError) {
        return rejectWithValue(fallbackError.message);
      }
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.clearCart();
      return response;
    } catch (error) {
      console.error('Clear cart error, using fallback:', error);
      // Fallback to localStorage
      try {
        const fallback = await mockCartAPI.clearCart();
        return fallback;
      } catch (fallbackError) {
        return rejectWithValue(fallbackError.message);
      }
    }
  }
);

const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  loading: false,
  error: null,
};

const calculateTotals = (items) => {
  const validItems = items.filter(item => item && item.product && item.quantity);
  
  const totalItems = validItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAmount = validItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + (price * (item.quantity || 1));
  }, 0);
  
  return { totalItems, totalAmount };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action) => {
      // Ensure all items have proper images
      const items = Array.isArray(action.payload) ? action.payload : [];
      state.items = items.map(item => ({
        ...item,
        product: {
          ...item.product,
          image: item.product?.image || item.product?.imageUrl || item.product?.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'
        }
      }));
      const { totalItems, totalAmount } = calculateTotals(state.items);
      state.totalItems = totalItems;
      state.totalAmount = totalAmount;
    },
    clearCartState: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
      state.error = null;
    },
    syncWithLocalStorage: (state) => {
      const userId = getUserId();
      try {
        const cart = JSON.parse(localStorage.getItem(`userCart_${userId}`) || '[]');
        // Ensure images are properly formatted
        state.items = cart.map(item => ({
          ...item,
          product: {
            ...item.product,
            image: item.product?.image || item.product?.imageUrl || 'https://via.placeholder.com/300x400?text=No+Image'
          }
        }));
        const { totalItems, totalAmount } = calculateTotals(state.items);
        state.totalItems = totalItems;
        state.totalAmount = totalAmount;
      } catch (error) {
        console.error('Error syncing cart from localStorage:', error);
      }
    },
    updateCartItemImage: (state, action) => {
      const { productId, image } = action.payload;
      const itemIndex = state.items.findIndex(item => 
        (item.product?._id || item.product?.id) === productId
      );
      
      if (itemIndex > -1 && state.items[itemIndex].product) {
        state.items[itemIndex].product.image = image;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure all items have proper images
        state.items = (action.payload.cart || []).map(item => ({
          ...item,
          product: {
            ...item.product,
            image: item.product?.image || item.product?.imageUrl || item.product?.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'
          }
        }));
        const { totalItems, totalAmount } = calculateTotals(state.items);
        state.totalItems = totalItems;
        state.totalAmount = totalAmount;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure all items have proper images
        state.items = (action.payload.cart || []).map(item => ({
          ...item,
          product: {
            ...item.product,
            image: item.product?.image || item.product?.imageUrl || item.product?.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'
          }
        }));
        const { totalItems, totalAmount } = calculateTotals(state.items);
        state.totalItems = totalItems;
        state.totalAmount = totalAmount;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.cart || [];
        const { totalItems, totalAmount } = calculateTotals(state.items);
        state.totalItems = totalItems;
        state.totalAmount = totalAmount;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCartQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.cart || [];
        const { totalItems, totalAmount } = calculateTotals(state.items);
        state.totalItems = totalItems;
        state.totalAmount = totalAmount;
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.totalItems = 0;
        state.totalAmount = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  setCart, 
  clearCartState, 
  syncWithLocalStorage,
  updateCartItemImage 
} = cartSlice.actions;
export default cartSlice.reducer;