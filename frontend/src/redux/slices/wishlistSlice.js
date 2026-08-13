import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wishlistAPI } from '../../utils/api';

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
    const API_BASE = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api`;
    const response = await fetch(`${API_BASE}/products/${productId}`);
    
    if (response.ok) {
      const data = await response.json();
      const product = data.product || data;
      console.log('✅ Fetched product from API for wishlist:', product.name);
      return product;
    } else {
      // Fallback to mock products
      const mockProducts = [
        {
          _id: '1',
          name: 'Designer Evening Gown',
          description: 'Elegant evening gown with intricate embroidery',
          price: 2999,
          image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          category: 'Gowns',
        },
        {
          _id: '2',
          name: 'Casual Summer Dress',
          description: 'Lightweight and comfortable summer dress',
          price: 1299,
          image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          category: 'Casual',
        },
        {
          _id: '3',
          name: 'Traditional Silk Saree',
          description: 'Authentic silk saree with golden border',
          price: 4599,
          image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          category: 'Traditional',
        }
      ];
      
      const product = mockProducts.find(p => p._id === productId) || {
        _id: productId,
        name: 'Product Name',
        description: 'Product description',
        price: 999,
        image: 'https://via.placeholder.com/300x400?text=Product+Image',
        category: 'General',
      };
      
      return product;
    }
  } catch (error) {
    console.log('⚠️ Error fetching product, using default:', error);
    return {
      _id: productId,
      name: 'Product Name',
      description: 'Product description',
      price: 999,
      image: 'https://via.placeholder.com/300x400?text=Product+Image',
      category: 'General',
    };
  }
};

// Mock API for fallback
const mockWishlistAPI = {
  getWishlist: async () => {
    try {
      const userId = getUserId();
      const wishlistKey = `userWishlist_${userId}`;
      const wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
      
      console.log('📦 Fetched wishlist from localStorage:', wishlist.length, 'items');
      
      // Ensure all items have required properties with proper images
      const validWishlist = wishlist.map(item => ({
        ...item,
        _id: item._id || item.id || 'unknown',
        id: item.id || item._id,
        name: item.name || 'Product Name',
        price: item.price || 0,
        image: item.image || item.imageUrl || 'https://via.placeholder.com/300x400?text=No+Image',
        description: item.description || 'No description available',
        category: item.category || 'General',
        addedAt: item.addedAt || new Date().toISOString()
      }));
      
      return { wishlist: validWishlist };
    } catch (error) {
      console.error('❌ Error fetching wishlist:', error);
      return { wishlist: [] };
    }
  },
  
  addToWishlist: async (product) => {
    try {
      const userId = getUserId();
      if (!userId || userId === 'guest') {
        throw new Error('User not logged in');
      }
      
      const wishlistKey = `userWishlist_${userId}`;
      let wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
      
      // Check if product already exists
      const exists = wishlist.some(item => 
        (item._id === product._id) || (item.id === product.id)
      );
      
      if (!exists) {
        // Store FULL product data, not just ID
        const productToAdd = {
          _id: product._id || product.id,
          id: product.id || product._id,
          name: product.name || 'Product Name',
          description: product.description || 'Product description',
          price: product.price || 0,
          originalPrice: product.originalPrice || product.price || 0,
          image: product.image || product.imageUrl || 'https://via.placeholder.com/300x400?text=Product+Image',
          category: product.category || 'General',
          brand: product.brand || 'Brand',
          size: product.size || ['S', 'M', 'L'],
          colors: product.colors || ['Black', 'White'],
          inStock: product.inStock !== undefined ? product.inStock : true,
          addedAt: new Date().toISOString()
        };
        
        wishlist.push(productToAdd);
        localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
        console.log('✅ Added to wishlist in localStorage:', productToAdd.name, 'Image:', productToAdd.image);
      }
      
      return { wishlist };
    } catch (error) {
      console.error('❌ Error adding to wishlist:', error);
      throw error;
    }
  },
  
  removeFromWishlist: async (productId) => {
    try {
      const userId = getUserId();
      const wishlistKey = `userWishlist_${userId}`;
      let wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
      
      wishlist = wishlist.filter(item => 
        (item._id !== productId) && (item.id !== productId)
      );
      
      localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
      console.log('❌ Removed from wishlist in localStorage:', productId);
      
      return { wishlist };
    } catch (error) {
      console.error('❌ Error removing from wishlist:', error);
      throw error;
    }
  },
  
  clearWishlist: async () => {
    try {
      const userId = getUserId();
      const wishlistKey = `userWishlist_${userId}`;
      localStorage.setItem(wishlistKey, JSON.stringify([]));
      console.log('🗑️ Cleared wishlist in localStorage');
      
      return { wishlist: [] };
    } catch (error) {
      console.error('❌ Error clearing wishlist:', error);
      throw error;
    }
  }
};

// Async thunks that save to database
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.getWishlist();
      
      // If backend returns just IDs, fetch full product data
      if (response.wishlist && response.wishlist[0] && typeof response.wishlist[0] === 'string') {
        console.log('🔍 Backend returned IDs only, fetching full product data...');
        const fullProducts = await Promise.all(
          response.wishlist.map(async (productId) => {
            try {
              const product = await getProductById(productId);
              return product;
            } catch (error) {
              console.error(`Error fetching product ${productId}:`, error);
              return null;
            }
          })
        );
        
        return { wishlist: fullProducts.filter(Boolean) };
      }
      
      // If backend returns product objects
      if (response.wishlist && Array.isArray(response.wishlist)) {
        const wishlistWithImages = response.wishlist.map(item => ({
          ...item,
          _id: item._id || item.id,
          id: item.id || item._id,
          image: item.image || item.imageUrl || item.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80'
        }));
        
        return { wishlist: wishlistWithImages };
      }
      
      return response;
    } catch (error) {
      console.error('Fetch wishlist error:', error);
      return rejectWithValue(error.message || 'Unable to load your wishlist');
    }
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (product, { rejectWithValue }) => {
    try {
      const productId = product._id || product.id;
      if (!productId) {
        throw new Error('Product ID is required');
      }
      
      const response = await wishlistAPI.addToWishlist(productId);
      
      if (response.success && Array.isArray(response.wishlist)) {
        let wishlist = response.wishlist;
        if (wishlist.length > 0 && typeof wishlist[0] === 'string') {
          const fullProducts = await Promise.all(
            wishlist.map(async (id) => {
              if (id === productId) return product;
              return await getProductById(id);
            })
          );
          wishlist = fullProducts.filter(Boolean);
        }
        const userId = getUserId();
        if (userId && userId !== 'guest') {
          localStorage.setItem(`userWishlist_${userId}`, JSON.stringify(wishlist));
        }
        return { wishlist };
      }
      
      const fallback = await mockWishlistAPI.addToWishlist(product);
      return fallback;
    } catch (error) {
      console.error('Add to wishlist error, using fallback:', error);
      try {
        const fallback = await mockWishlistAPI.addToWishlist(product);
        return fallback;
      } catch (fallbackError) {
        return rejectWithValue(fallbackError.message);
      }
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.removeFromWishlist(productId);
      
      if (response.success && Array.isArray(response.wishlist)) {
        let wishlist = response.wishlist;
        if (wishlist.length > 0 && typeof wishlist[0] === 'string') {
          const fullProducts = await Promise.all(
            wishlist.map(async (id) => await getProductById(id))
          );
          wishlist = fullProducts.filter(Boolean);
        }
        const userId = getUserId();
        if (userId && userId !== 'guest') {
          localStorage.setItem(`userWishlist_${userId}`, JSON.stringify(wishlist));
        }
        return { wishlist, productId };
      }
      
      const fallback = await mockWishlistAPI.removeFromWishlist(productId);
      return { ...fallback, productId };
    } catch (error) {
      console.error('Remove from wishlist error, using fallback:', error);
      try {
        const fallback = await mockWishlistAPI.removeFromWishlist(productId);
        return { ...fallback, productId };
      } catch (fallbackError) {
        return rejectWithValue(fallbackError.message);
      }
    }
  }
);

export const clearWishlist = createAsyncThunk(
  'wishlist/clearWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.clearWishlist();
      return response;
    } catch (error) {
      console.error('Clear wishlist error, using fallback:', error);
      try {
        const fallback = await mockWishlistAPI.clearWishlist();
        return fallback;
      } catch (fallbackError) {
        return rejectWithValue(fallbackError.message);
      }
    }
  }
);

const getInitialWishlistItems = () => {
  try {
    const userId = getUserId();
    const wishlistKey = `userWishlist_${userId}`;
    return JSON.parse(localStorage.getItem(wishlistKey) || '[]') || [];
  } catch (_) {
    return [];
  }
};

const initialState = {
  items: getInitialWishlistItems(),
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlist: (state, action) => {
      state.items = action.payload.map(item => ({
        ...item,
        image: item.image || item.imageUrl || item.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'
      }));
    },
    clearWishlistState: (state) => {
      state.items = [];
      state.error = null;
    },
    syncWithLocalStorage: (state) => {
      const userId = getUserId();
      try {
        const wishlistKey = `userWishlist_${userId}`;
        const wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
        state.items = wishlist.map(item => ({
          ...item,
          image: item.image || item.imageUrl || 'https://via.placeholder.com/300x400?text=No+Image'
        }));
      } catch (error) {
        console.error('Error syncing wishlist from localStorage:', error);
        state.items = [];
      }
    },
    updateWishlistItemImage: (state, action) => {
      const { productId, image } = action.payload;
      const itemIndex = state.items.findIndex(item => 
        (item._id || item.id) === productId
      );
      
      if (itemIndex > -1) {
        state.items[itemIndex].image = image;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = (action.payload.wishlist || []).map(item => ({
          ...item,
          _id: item._id || item.id,
          id: item.id || item._id,
          image: item.image || item.imageUrl || item.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'
        }));
        console.log('📦 Wishlist updated from backend:', state.items.length, 'items');
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToWishlist.pending, (state) => {
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && Array.isArray(action.payload.wishlist)) {
          state.items = action.payload.wishlist.map(item => ({
            ...item,
            _id: item._id || item.id,
            id: item.id || item._id,
            image: item.image || item.imageUrl || item.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'
          }));
        }
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeFromWishlist.pending, (state, action) => {
        const productId = action.meta.arg;
        state.items = state.items.filter(item => {
          const id = typeof item === 'object' ? (item._id || item.id) : item;
          return id !== productId;
        });
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && Array.isArray(action.payload.wishlist)) {
          state.items = action.payload.wishlist.map(item => ({
            ...item,
            _id: item._id || item.id,
            id: item.id || item._id,
            image: item.image || item.imageUrl || item.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'
          }));
        }
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        const userId = getUserId();
        try {
          const wishlist = JSON.parse(localStorage.getItem(`userWishlist_${userId}`) || '[]');
          state.items = wishlist;
        } catch (_) {}
      })
      .addCase(clearWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearWishlist.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  setWishlist, 
  clearWishlistState, 
  syncWithLocalStorage,
  updateWishlistItemImage 
} = wishlistSlice.actions;
export default wishlistSlice.reducer;