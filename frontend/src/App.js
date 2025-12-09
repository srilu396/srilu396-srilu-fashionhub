import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext'; 

// Import all user pages
import LandingPage from './pages/LandingPage';
import UserLogin from './pages/user/UserLogin';
import UserDashboard from './pages/user/UserDashboard';
import UserProfile from './pages/user/UserProfile';
import CartPage from './pages/user/CartPage';
import WishlistPage from './pages/user/WishlistPage';
import OrdersPage from './pages/user/OrdersPage';
import UserCoupons from './pages/user/UserCoupons';

// Import all admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import NewProduct from './pages/admin/NewProduct';
import ProductsManagement from './pages/admin/ProductsManagement';
import NewCoupon from './pages/admin/NewCoupon';
import CouponsManagement from './pages/admin/CouponsManagement';
import CustomersManagement from './pages/admin/CustomersManagement';
import OrdersManagement from './pages/admin/OrdersManagement';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import SettingsPage from './pages/admin/SettingsPage';


import './App.css';

// Simple Protected Route Component for Admin
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('adminUser') || 'null');
  
  if (token && user && user.role === 'admin') {
    return children;
  }
  
  return <Navigate to="/admin/login" />;
};

// Simple Protected Route Component for User
const ProtectedRouteUser = ({ children }) => {
  const token = localStorage.getItem('userToken');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (token && user) {
    return children;
  }
  
  return <Navigate to="/user/login" />;
};

// Public Route Component for Admin
const PublicRouteAdmin = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('adminUser') || 'null');
  
  if (token && user && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" />;
  }
  
  return children;
};

// Public Route Component for User
const PublicRouteUser = ({ children }) => {
  const token = localStorage.getItem('userToken');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (token && user) {
    return <Navigate to="/user/dashboard" />;
  }
  
  return children;
};

// Main App Content
const AppContent = () => {
  return (
    <AuthProvider>
      <ProductProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Admin Login */}
              <Route 
                path="/admin/login" 
                element={
                  <PublicRouteAdmin>
                    <AdminLogin />
                  </PublicRouteAdmin>
                } 
              />
              
              {/* User Login */}
              <Route 
                path="/user/login" 
                element={
                  <PublicRouteUser>
                    <UserLogin />
                  </PublicRouteUser>
                } 
              />
              
              {/* Protected Admin Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/new-product" 
                element={
                  <ProtectedRoute>
                    <NewProduct />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/products" 
                element={
                  <ProtectedRoute>
                    <ProductsManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/new-coupon" 
                element={
                  <ProtectedRoute>
                    <NewCoupon />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/coupons" 
                element={
                  <ProtectedRoute>
                    <CouponsManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/customers" 
                element={
                  <ProtectedRoute>
                    <CustomersManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/orders" 
                element={
                  <ProtectedRoute>
                    <OrdersManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/analytics" 
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/settings" 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected User Routes */}
              <Route 
                path="/user/dashboard" 
                element={
                  <ProtectedRouteUser>
                    <UserDashboard />
                  </ProtectedRouteUser>
                } 
              />
              <Route 
                path="/user/cart" 
                element={
                  <ProtectedRouteUser>
                    <CartPage />
                  </ProtectedRouteUser>
                } 
              />
              <Route 
                path="/user/coupons" 
                element={
                  <ProtectedRouteUser>
                    <UserCoupons />
                  </ProtectedRouteUser>
                } 
              />
              <Route 
                path="/user/wishlist" 
                element={
                  <ProtectedRouteUser>
                    <WishlistPage />
                  </ProtectedRouteUser>
                } 
              />
              <Route 
                path="/user/orders" 
                element={
                  <ProtectedRouteUser>
                    <OrdersPage />
                  </ProtectedRouteUser>
                } 
              />
              
              {/* User Profile Route - ADD THIS LINE INSIDE Routes */}
              <Route 
                path="/user/profile" 
                element={
                  <ProtectedRouteUser>
                    <UserProfile />
                  </ProtectedRouteUser>
                } 
              />
              
              {/* Redirect to landing page for unknown routes */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </ProductProvider>
    </AuthProvider>
  );
};

// Main App Component with Redux Provider
function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;