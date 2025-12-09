import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { clearOrders } from './orderSlice'; // Import from orderSlice

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Login failed');
      }
      
      // Store in localStorage
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Clear any previous user's orders from Redux
      dispatch(clearOrders());
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for register
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue, dispatch }) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Registration failed');
      }
      
      // Store in localStorage
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Clear any previous user's orders from Redux
      dispatch(clearOrders());
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // Clear user orders from localStorage
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user) {
        const userId = user._id || user.id;
        if (userId) {
          localStorage.removeItem(`userOrders_${userId}`);
        }
      }
      
      // Clear all auth-related localStorage
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminViewingCustomer');
      localStorage.removeItem('viewedCustomer');
      
      // Clear orders from Redux
      dispatch(clearOrders());
      
      return {};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('userToken') || null,
  isAuthenticated: !!localStorage.getItem('userToken'),
  loading: false,
  error: null,
  isAdmin: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      
      // Store in localStorage
      localStorage.setItem('userToken', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    clearUser: (state, action) => {
      // Get user before clearing
      const user = state.user;
      
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isAdmin = false;
      
      // Clear user-specific orders from localStorage
      if (user) {
        const userId = user._id || user.id;
        if (userId) {
          localStorage.removeItem(`userOrders_${userId}`);
        }
      }
      
      // Clear all auth-related localStorage
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminViewingCustomer');
      localStorage.removeItem('viewedCustomer');
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setAdminStatus: (state, action) => {
      state.isAdmin = action.payload;
    },
    // Sync with localStorage
    syncWithLocalStorage: (state) => {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const token = localStorage.getItem('userToken');
      
      state.user = user;
      state.token = token;
      state.isAuthenticated = !!token;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isAdmin = false;
      });
  },
});

export const { 
  setUser, 
  clearUser, 
  setError, 
  clearError, 
  setAdminStatus,
  syncWithLocalStorage 
} = authSlice.actions;
export default authSlice.reducer;