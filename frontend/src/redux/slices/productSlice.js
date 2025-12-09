import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock product data for testing
const mockProducts = [
  {
    _id: '1',
    name: 'Designer Evening Gown',
    description: 'Elegant evening gown with intricate embroidery',
    price: 2999,
    originalPrice: 3999,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'Gowns',
    brand: 'Luxury Fashion',
    inStock: true,
    size: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Red', 'Navy']
  },
  {
    _id: '2',
    name: 'Casual Summer Dress',
    description: 'Lightweight and comfortable summer dress',
    price: 1299,
    originalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'Casual',
    brand: 'Summer Style',
    inStock: true,
    size: ['S', 'M', 'L'],
    colors: ['White', 'Pink', 'Yellow']
  },
  {
    _id: '3',
    name: 'Traditional Silk Saree',
    description: 'Authentic silk saree with golden border',
    price: 4599,
    originalPrice: 5999,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'Traditional',
    brand: 'Heritage Silk',
    inStock: true,
    size: ['Free Size'],
    colors: ['Blue', 'Green', 'Maroon']
  }
];

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      // First try to fetch from API
      const response = await fetch('http://localhost:5000/api/products');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched products from API:', data.length);
        return { products: data };
      } else {
        // If API fails, use mock data
        console.log('⚠️ API failed, using mock products');
        return { products: mockProducts };
      }
    } catch (error) {
      console.log('⚠️ Network error, using mock products');
      return { products: mockProducts };
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`);
      
      if (response.ok) {
        const data = await response.json();
        return { product: data };
      } else {
        // Fallback to mock data
        const product = mockProducts.find(p => p._id === productId) || mockProducts[0];
        return { product };
      }
    } catch (error) {
      const product = mockProducts.find(p => p._id === productId) || mockProducts[0];
      return { product };
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
        // Set first 3 as featured
        state.featuredProducts = action.payload.products.slice(0, 3);
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Use mock data as fallback
        state.products = mockProducts;
        state.featuredProducts = mockProducts.slice(0, 3);
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.currentProduct = action.payload.product;
      });
  },
});

export const { setProducts, setFeaturedProducts, setCurrentProduct, clearError } = productSlice.actions;
export default productSlice.reducer;