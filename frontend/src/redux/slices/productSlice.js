import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api`;

// Async thunk for fetching products from MongoDB
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch products');
      }

      const productsList = Array.isArray(data) ? data : (data.products || []);
      console.log('✅ Fetched products from MongoDB:', productsList.length);
      return { products: productsList };
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/products/${productId}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch product');
      }

      const productData = data.product || data;
      return { product: productData };
    } catch (error) {
      console.error('❌ Error fetching product by ID:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  products: [],
  featuredProducts: [],
  loading: false,
  error: null,
  currentProduct: null
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    setFeaturedProducts: (state, action) => {
      state.featuredProducts = action.payload;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.featuredProducts = action.payload.products.filter(p => p.featured) || action.payload.products.slice(0, 3);
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.products = [];
        state.featuredProducts = [];
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.currentProduct = action.payload.product;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.error = action.payload;
        state.currentProduct = null;
      });
  },
});

export const { setProducts, setFeaturedProducts, setCurrentProduct, clearError } = productSlice.actions;
export default productSlice.reducer;