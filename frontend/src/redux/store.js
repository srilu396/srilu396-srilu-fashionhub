// frontend/src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import orderReducer from './slices/orderSlice'; 
import wishlistReducer from './slices/wishlistSlice';
import productReducer from './slices/productSlice';  

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    orders: orderReducer,
    wishlist: wishlistReducer,
    products: productReducer,  
  },
});