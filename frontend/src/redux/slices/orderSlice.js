import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api`;

// Fetch ALL orders from MongoDB backend (Admin only)
export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAllOrders',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching ALL orders from backend...');
      
      const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      if (!adminToken) {
        throw new Error('Admin authorization required');
      }
      
      const response = await fetch(`${API_BASE_URL}/orders/admin/all`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Fallback to /orders if admin/all is not accessible
        const altResponse = await fetch(`${API_BASE_URL}/orders`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (!altResponse.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        const altData = await altResponse.json();
        return {
          orders: altData.orders || [],
          count: altData.count || 0,
          customerCount: new Set((altData.orders || []).map(o => o.user?._id || o.user)).size
        };
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch orders');
      }
      
      console.log(`✅ Successfully fetched ${data.orders?.length || 0} orders from MongoDB`);
      
      return {
        orders: data.orders || [],
        count: data.count || 0,
        customerCount: data.customerCount || 0
      };
      
    } catch (error) {
      console.error('❌ Error fetching all orders:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Update order status
export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      console.log(`🔄 Updating order ${orderId} to ${status}`);
      
      const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      if (!adminToken) {
        throw new Error('Admin authorization required');
      }
      
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update order status');
      }
      
      console.log(`✅ Order ${orderId} status updated to ${status}`);
      return { order: data.order };
      
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Cancel order
export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      console.log(`❌ Cancelling order ${orderId}`);
      
      const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      if (!adminToken) {
        throw new Error('Admin authorization required');
      }
      
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to cancel order');
      }
      
      console.log(`✅ Order ${orderId} cancelled`);
      return { order: data.order };
      
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Create order (for users)
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (!user) throw new Error('User not logged in');
      
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      if (!token) throw new Error('Authorization token missing');
      
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create order');
      }
      
      console.log('✅ Order created in MongoDB:', data.order?.orderId);
      return { order: data.order };
      
    } catch (error) {
      console.error('❌ Error creating order:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  allOrders: [],
  loading: false,
  error: null,
  currentOrder: null,
  lastUpdated: null,
  stats: {
    total: 0,
    totalRevenue: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    customerCount: 0
  }
};

// Helper to calculate statistics
const calculateStats = (orders) => {
  const stats = {
    total: orders.length,
    totalRevenue: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    pending: 0,
    customerCount: new Set(orders.map(o => o.userId || o.user?._id || o.user)).size
  };
  
  orders.forEach(order => {
    const amount = order.totalAmount || order.total || order.finalAmount || 0;
    stats.totalRevenue += amount;
    
    switch (order.status?.toLowerCase()) {
      case 'processing':
      case 'pending':
        stats.processing++;
        break;
      case 'shipped':
      case 'shipping':
        stats.shipped++;
        break;
      case 'delivered':
      case 'completed':
        stats.delivered++;
        break;
      case 'cancelled':
      case 'canceled':
        stats.cancelled++;
        break;
      default:
        stats.processing++;
    }
  });
  
  return stats;
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setAllOrders: (state, action) => {
      state.allOrders = Array.isArray(action.payload) ? action.payload : [];
      state.stats = calculateStats(state.allOrders);
      state.lastUpdated = new Date().toISOString();
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    clearOrders: (state) => {
      state.allOrders = [];
      state.currentOrder = null;
      state.error = null;
      state.loading = false;
      state.lastUpdated = null;
      state.stats = initialState.stats;
    },
    addOrder: (state, action) => {
      if (action.payload) {
        state.allOrders.unshift(action.payload);
        state.stats = calculateStats(state.allOrders);
        state.lastUpdated = new Date().toISOString();
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Orders
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.allOrders = Array.isArray(action.payload?.orders) ? action.payload.orders : [];
        state.stats = calculateStats(state.allOrders);
        state.lastUpdated = new Date().toISOString();
        console.log('✅ Orders state updated:', state.allOrders.length, 'orders');
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch orders';
        state.allOrders = [];
      })
      
      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOrder = action.payload?.order;
        if (updatedOrder) {
          const index = state.allOrders.findIndex(order => 
            order.orderId === updatedOrder.orderId || order._id === updatedOrder._id
          );
          if (index !== -1) {
            state.allOrders[index] = updatedOrder;
            state.stats = calculateStats(state.allOrders);
            state.lastUpdated = new Date().toISOString();
          }
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update order status';
      })
      
      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOrder = action.payload?.order;
        if (updatedOrder) {
          const index = state.allOrders.findIndex(order => 
            order.orderId === updatedOrder.orderId || order._id === updatedOrder._id
          );
          if (index !== -1) {
            state.allOrders[index] = updatedOrder;
            state.stats = calculateStats(state.allOrders);
            state.lastUpdated = new Date().toISOString();
          }
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to cancel order';
      })
      
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.order) {
          state.allOrders.unshift(action.payload.order);
          state.stats = calculateStats(state.allOrders);
          state.currentOrder = action.payload.order;
          state.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create order';
      });
  },
});

export const { 
  setAllOrders, 
  setCurrentOrder, 
  clearOrders,
  addOrder
} = orderSlice.actions;

export default orderSlice.reducer;