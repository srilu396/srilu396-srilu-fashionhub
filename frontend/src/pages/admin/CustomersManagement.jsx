import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Users, UserCheck, UserX, Download, Mail, Calendar, Eye, 
  X, User, MapPin, Edit, Search, ChevronUp, ChevronDown, 
  Phone, ShoppingBag, CreditCard, Activity, ExternalLink,
  Filter, MoreVertical, Star, Crown, Shield, Heart, ShoppingCart,
  Package, Clock, TrendingUp, Award, Bell, Info
} from 'lucide-react';

// Import Redux actions - FIXED IMPORTS
import { fetchCart } from '../../redux/slices/cartSlice';
import { fetchWishlist } from '../../redux/slices/wishlistSlice';

// Enhanced Stats Card Component
const EnhancedStatsCard = ({ title, value, icon, color, gradient, change }) => {
  const displayValue = value !== undefined && value !== null ? value : 0;
  
  return (
    <div className="enhanced-stat-card" style={{ 
      background: gradient,
      borderLeft: `4px solid ${color}`
    }}>
      <div className="card-shine"></div>
      <div className="stat-icon-wrapper" style={{ background: `${color}20` }}>
        {icon}
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        <div className="stat-value">{displayValue.toLocaleString()}</div>
        {change !== undefined && (
          <div className="stat-change" style={{ color: change > 0 ? '#4CAF50' : '#ff6b6b' }}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}% this month
          </div>
        )}
      </div>
    </div>
  );
};

// Info Button Component
const InfoButton = ({ onClick, title = "View Complete Details" }) => (
  <button
    onClick={onClick}
    className="action-button info-button"
    title={title}
  >
    <Info size={18} />
    <span className="tooltip">{title}</span>
  </button>
);

// Enhanced Customer Details Modal with Real-time Redux Data
const EnhancedCustomerDetailsModal = ({ customer, onClose, onViewDashboard, onRefreshData }) => {
  const [customerActivity, setCustomerActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [customerCart, setCustomerCart] = useState([]);
  const [customerWishlist, setCustomerWishlist] = useState([]);
  const [realTimeLoading, setRealTimeLoading] = useState(false);

  // New states for product details
  const [cartProducts, setCartProducts] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

// Update the getProductDetails function in EnhancedCustomerDetailsModal
const getProductDetails = async (productId) => {
  console.log('🔄 Fetching product details for ID:', productId);
  
  if (!productId) {
    console.warn('❌ No product ID provided');
    return {
      name: 'Unknown Product',
      price: 0,
      image: 'https://via.placeholder.com/300x400?text=No+Product+ID'
    };
  }

  try {
    const token = localStorage.getItem('adminToken');
    console.log('🔑 Token exists:', !!token);
    
    // Try multiple API endpoints
    let endpoints = [
      `http://localhost:5000/api/products/${productId}`,
      `http://localhost:5000/api/admin/products/${productId}`,
      `http://localhost:5000/api/user/products/${productId}`
    ];
    
    let productData = null;
    
    for (let endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success from ${endpoint}:`, data);
          
          // Check if data is in different structures
          if (data.product) {
            productData = data.product;
          } else if (data.data) {
            productData = data.data;
          } else {
            productData = data;
          }
          break;
        } else {
          console.warn(`❌ Failed from ${endpoint}: ${response.status}`);
        }
      } catch (error) {
        console.warn(`❌ Error from ${endpoint}:`, error);
      }
    }
    
    // If we couldn't fetch from API, create mock data based on product ID
    if (!productData) {
      console.log('📝 Creating mock product data');
      // Create consistent mock data based on product ID
      const productNumber = parseInt(productId.slice(-3)) || Math.floor(Math.random() * 1000);
      const categories = ['T-Shirt', 'Jeans', 'Dress', 'Shoes', 'Jacket', 'Accessory'];
      const category = categories[productNumber % categories.length];
      
      productData = {
        name: `Premium ${category} ${productNumber}`,
        price: (19.99 + (productNumber % 50)).toFixed(2),
        image: `https://via.placeholder.com/300x400/4B1C2F/FFFFFF?text=${category}+${productNumber}`
      };
    }
    
    // Ensure we have the required fields
    return {
      name: productData.name || `Product ${productId.slice(0, 6)}`,
      price: parseFloat(productData.price || productData.salePrice || productData.originalPrice || 0),
      image: productData.image || productData.imageUrl || productData.images?.[0] || 
             `https://via.placeholder.com/300x400?text=Product+${productId.slice(0, 6)}`
    };
    
  } catch (error) {
    console.error('❌ Error in getProductDetails:', error);
    return {
      name: `Product ${productId.slice(0, 6)}`,
      price: 0,
      image: 'https://via.placeholder.com/300x400?text=Error+Loading'
    };
  }
};

// Update the getProductData function to handle all cases
const getProductData = async (item) => {
  // Log the item structure for debugging
  console.log('Processing item:', item);
  
  let productId = null;
  let productObject = null;
  
  // Case 1: item is a string (product ID)
  if (typeof item === 'string') {
    productId = item;
  }
  // Case 2: item has a product property that's a string ID
  else if (item && item.product && typeof item.product === 'string') {
    productId = item.product;
  }
  // Case 3: item has a product property that's an object
  else if (item && item.product && typeof item.product === 'object') {
    productObject = item.product;
    productId = productObject._id || productObject.id;
  }
  // Case 4: item is the product object itself
  else if (item && (item._id || item.id)) {
    productObject = item;
    productId = item._id || item.id;
  }
  // Case 5: item has _id directly
  else if (item && item._id) {
    productId = item._id;
  }
  
  // Try to fetch product details if we don't have the full object
  if (!productObject && productId) {
    try {
      const productDetails = await getProductDetails(productId);
      productObject = productDetails;
    } catch (error) {
      console.warn('Failed to fetch product details:', error);
      productObject = {
        name: `Product ${productId.slice(0, 6)}`,
        price: 0,
        image: 'https://via.placeholder.com/300x400?text=Product+Not+Found'
      };
    }
  }
  
  // If we still don't have a product object, create a default
  if (!productObject) {
    productObject = {
      name: 'Unknown Product',
      price: 0,
      image: 'https://via.placeholder.com/300x400?text=No+Image'
    };
  }
  
  // Ensure image URL is properly set
  let imageUrl = productObject.image || productObject.imageUrl || productObject.images?.[0];
  
  // Handle different image URL formats
  if (!imageUrl || imageUrl === '') {
    imageUrl = 'https://via.placeholder.com/300x400?text=No+Image';
  } else if (!imageUrl.startsWith('http')) {
    // Handle relative paths - prepend base URL if needed
    imageUrl = `http://localhost:5000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }
  
  return {
    id: productId || 'unknown',
    _id: productId || 'unknown',
    name: productObject.name || 'Product',
    price: productObject.price || 0,
    image: imageUrl,
    quantity: item.quantity || 1
  };
};

// Update the loadProductDetails function
const loadProductDetails = async () => {
  console.log('🔄 Starting loadProductDetails');
  console.log('📦 Cart items to load:', customerCart.length);
  console.log('❤️ Wishlist items to load:', customerWishlist.length);
  
  if (customerCart.length === 0 && customerWishlist.length === 0) {
    console.log('ℹ️ No items to load');
    return;
  }
  
  setProductsLoading(true);
  
  try {
    // Create a map to track unique products
    const productMap = new Map();
    
    // Process cart items
    const cartProductPromises = customerCart.map(async (item, index) => {
      console.log(`🛒 Processing cart item ${index + 1}:`, item);
      
      let productData = null;
      let productId = null;
      
      // Try to extract product ID from different structures
      if (typeof item === 'string') {
        productId = item;
      } else if (item.productId) {
        productId = item.productId;
      } else if (item.product && typeof item.product === 'string') {
        productId = item.product;
      } else if (item.product && item.product._id) {
        productId = item.product._id;
      } else if (item._id) {
        productId = item._id;
      } else if (item.productId) {
        productId = item.productId;
      }
      
      console.log(`📋 Extracted product ID: ${productId}`);
      
      if (productId) {
        // Check if we already fetched this product
        if (productMap.has(productId)) {
          productData = productMap.get(productId);
        } else {
          productData = await getProductDetails(productId);
          productMap.set(productId, productData);
        }
      } else {
        // If no product ID, create fallback data
        productData = {
          name: `Product ${index + 1}`,
          price: 19.99 + (index * 10),
          image: `https://via.placeholder.com/300x400?text=Product+${index + 1}`
        };
      }
      
      return {
        ...item,
        product: productData,
        quantity: item.quantity || 1
      };
    });
    
    const cartWithProducts = await Promise.all(cartProductPromises);
    console.log('✅ Cart products loaded:', cartWithProducts);
    setCartProducts(cartWithProducts);
    
    // Process wishlist items
    const wishlistProductPromises = customerWishlist.map(async (item, index) => {
      console.log(`❤️ Processing wishlist item ${index + 1}:`, item);
      
      let productData = null;
      let productId = null;
      
      // Try to extract product ID from different structures
      if (typeof item === 'string') {
        productId = item;
      } else if (item._id) {
        productId = item._id;
      } else if (item.productId) {
        productId = item.productId;
      } else if (item.product && typeof item.product === 'string') {
        productId = item.product;
      }
      
      console.log(`📋 Extracted product ID: ${productId}`);
      
      if (productId) {
        // Check if we already fetched this product
        if (productMap.has(productId)) {
          productData = productMap.get(productId);
        } else {
          productData = await getProductDetails(productId);
          productMap.set(productId, productData);
        }
      } else {
        // If no product ID, create fallback data
        productData = {
          name: `Wishlist Item ${index + 1}`,
          price: 29.99 + (index * 15),
          image: `https://via.placeholder.com/300x400?text=Wishlist+${index + 1}`
        };
      }
      
      return productData;
    });
    
    const wishlistWithProducts = await Promise.all(wishlistProductPromises);
    console.log('✅ Wishlist products loaded:', wishlistWithProducts);
    setWishlistProducts(wishlistWithProducts);
    
    // Log totals for verification
    const totalCartValue = cartWithProducts.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
    
    const totalWishlistValue = wishlistWithProducts.reduce((sum, product) => {
      return sum + product.price;
    }, 0);
    
    console.log('💰 Calculated totals:', {
      cartValue: totalCartValue,
      wishlistValue: totalWishlistValue
    });
    
  } catch (error) {
    console.error('❌ Error in loadProductDetails:', error);
    
    // Create fallback data on error
    const fallbackCart = customerCart.map((item, index) => ({
      ...item,
      product: {
        name: `Cart Product ${index + 1}`,
        price: 24.99 + (index * 5),
        image: `https://via.placeholder.com/300x400/4B1C2F/FFFFFF?text=Cart+${index + 1}`
      },
      quantity: item.quantity || 1
    }));
    
    const fallbackWishlist = customerWishlist.map((item, index) => ({
      name: `Wishlist Product ${index + 1}`,
      price: 34.99 + (index * 8),
      image: `https://via.placeholder.com/300x400/D4AF37/000000?text=Wishlist+${index + 1}`
    }));
    
    setCartProducts(fallbackCart);
    setWishlistProducts(fallbackWishlist);
  } finally {
    setProductsLoading(false);
  }
};

  // Call loadProductDetails when cart or wishlist changes
  useEffect(() => {
    if (customerCart.length > 0 || customerWishlist.length > 0) {
      loadProductDetails();
    }
  }, [customerCart, customerWishlist]);
  
  // Fetch customer's actual cart and wishlist from backend - UPDATED ENDPOINTS
  const fetchCustomerRealTimeData = async () => {
    try {
      setRealTimeLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!customer?._id) {
        console.error('No customer ID available');
        return;
      }
      
      console.log('🔄 Fetching real-time data for customer:', customer._id);
      
      // TRY DIFFERENT ENDPOINT PATHS - Updated to use correct API structure
      let cartData = [];
      let wishlistData = [];
      
      // Option 1: Try admin-specific endpoints first
      try {
        const cartResponse = await fetch(`http://localhost:5000/api/admin/customers/${customer._id}/cart`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (cartResponse.ok) {
          const data = await cartResponse.json();
          cartData = data.cart || data.cartItems || [];
          console.log('🛒 Cart data from admin endpoint:', cartData.length);
        } else {
          console.warn('Admin cart endpoint failed, trying user endpoint');
        }
      } catch (adminError) {
        console.warn('Admin endpoint error, trying alternative:', adminError);
      }
      
      // Option 2: Try user endpoint with admin token
      if (cartData.length === 0) {
        try {
          const cartResponse2 = await fetch(`http://localhost:5000/api/users/${customer._id}/cart`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (cartResponse2.ok) {
            const data = await cartResponse2.json();
            cartData = data.cart || data.cartItems || [];
            console.log('🛒 Cart data from user endpoint:', cartData.length);
          }
        } catch (userError) {
          console.warn('User endpoint also failed:', userError);
        }
      }
      
      // Option 3: Try the customer complete endpoint which might include cart/wishlist
      if (cartData.length === 0 || wishlistData.length === 0) {
        try {
          const completeResponse = await fetch(`http://localhost:5000/api/customers/${customer._id}/complete`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (completeResponse.ok) {
            const data = await completeResponse.json();
            cartData = data.customer?.cart || data.cart || [];
            wishlistData = data.customer?.wishlist || data.wishlist || [];
            console.log('📊 Complete data:', {
              cart: cartData.length,
              wishlist: wishlistData.length
            });
          }
        } catch (completeError) {
          console.warn('Complete endpoint failed:', completeError);
        }
      }
      
      // Set the data
      setCustomerCart(cartData);
      setCustomerWishlist(wishlistData);
      
      // If still no data, show what we have from the customer object
      if (cartData.length === 0 && customer.cart) {
        console.log('⚠️ Using customer.cart from props');
        setCustomerCart(customer.cart);
      }
      
      if (wishlistData.length === 0 && customer.wishlist) {
        console.log('⚠️ Using customer.wishlist from props');
        setCustomerWishlist(customer.wishlist);
      }
      
    } catch (error) {
      console.error('❌ Error fetching customer real-time data:', error);
      // Fallback to embedded data
      setCustomerCart(customer.cart || []);
      setCustomerWishlist(customer.wishlist || []);
    } finally {
      setRealTimeLoading(false);
    }
  };

  // Fetch customer complete data including activity - FIXED
  const fetchCustomerCompleteData = async () => {
    try {
      setActivityLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!customer?._id) {
        console.error('No customer ID provided');
        setActivityLoading(false);
        return;
      }
      
      console.log('📡 Fetching complete data for customer:', customer._id);
      
      // Try multiple endpoints to get complete data
      let completeData = null;
      
      // First try the customer complete endpoint
      try {
        const response = await fetch(`http://localhost:5000/api/customers/${customer._id}/complete`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          completeData = await response.json();
          console.log('✅ Complete data received:', completeData);
        }
      } catch (endpoint1Error) {
        console.warn('Complete endpoint failed, trying alternative:', endpoint1Error);
      }
      
      // If complete endpoint failed, try activity endpoint
      if (!completeData) {
        try {
          const activityResponse = await fetch(`http://localhost:5000/api/users/${customer._id}/activity`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (activityResponse.ok) {
            const activityData = await activityResponse.json();
            completeData = { customer: activityData.activity || {} };
          }
        } catch (endpoint2Error) {
          console.warn('Activity endpoint failed:', endpoint2Error);
        }
      }
      
      // Set activity data
      if (completeData?.customer) {
        setCustomerActivity({
          totalOrders: completeData.customer.totalOrders || customer.totalOrders || 0,
          totalSpent: completeData.customer.totalSpent || customer.totalSpent || 0,
          averageOrderValue: completeData.customer.averageOrderValue || 0,
          cartCount: completeData.customer.cartCount || customer.cartCount || 0,
          wishlistCount: completeData.customer.wishlistCount || customer.wishlistCount || 0,
          completedOrders: completeData.customer.completedOrders || 0,
          pendingOrders: completeData.customer.pendingOrders || 0,
          lastOrderDate: completeData.customer.lastOrderDate || null,
          orderFrequency: completeData.customer.orderFrequency || 'N/A'
        });
      } else {
        // Use customer's embedded data
        setCustomerActivity({
          totalOrders: customer.totalOrders || 0,
          totalSpent: customer.totalSpent || 0,
          wishlistCount: customer.wishlistCount || 0,
          cartCount: customer.cartCount || 0,
          averageOrderValue: 0,
          lastOrderDate: null,
          completedOrders: 0,
          pendingOrders: 0,
          orderFrequency: 'N/A'
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching customer complete data:', error);
      // Create default activity object on error
      setCustomerActivity({
        totalOrders: customer?.totalOrders || 0,
        totalSpent: customer?.totalSpent || 0,
        wishlistCount: customer?.wishlistCount || 0,
        cartCount: customer?.cartCount || 0,
        averageOrderValue: 0,
        lastOrderDate: null,
        completedOrders: 0,
        pendingOrders: 0,
        orderFrequency: 'N/A'
      });
    } finally {
      setActivityLoading(false);
    }
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (customer) {
      console.log('🚀 Modal opened for customer:', customer._id);
      console.log('📊 Initial customer data:', {
        cart: customer.cart?.length || 0,
        wishlist: customer.wishlist?.length || 0,
        cartCount: customer.cartCount,
        wishlistCount: customer.wishlistCount
      });
      
      // Fetch both complete data and real-time data
      fetchCustomerCompleteData();
      fetchCustomerRealTimeData();
    }

    // Cleanup
    return () => {
      setCustomerCart([]);
      setCustomerWishlist([]);
    };
  }, [customer]);

  // Helper function to calculate order frequency
  const calculateOrderFrequency = (activity) => {
    if (!activity || !activity.totalOrders || activity.totalOrders < 2) 
      return 'N/A';
    
    return 'Regular';
  };

  // Format date safely
  const formatDate = (date) => {
    if (!date) return 'Not available';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Calculate customer level based on activity
  const getCustomerLevel = () => {
    if (!customerActivity) return { level: 'New', icon: <User size={24} />, color: '#6B7280' };
    
    const activityScore = 
      (customerActivity.totalOrders || 0) * 10 + 
      (customerActivity.totalSpent || 0) / 100 + 
      (customerActivity.wishlistCount || 0) * 2 + 
      (customerActivity.cartCount || 0);
    
    if (activityScore > 200) return { level: 'VIP', icon: <Crown size={24} />, color: '#D4AF37' };
    if (activityScore > 100) return { level: 'Premium', icon: <Star size={24} />, color: '#4CAF50' };
    if (activityScore > 50) return { level: 'Regular', icon: <User size={24} />, color: '#6B7280' };
    return { level: 'New', icon: <User size={24} />, color: '#6B7280' };
  };

  const level = getCustomerLevel();

const renderRealTimeData = () => {
  // Always calculate totals from current state
  const totalCartItems = cartProducts.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalCartValue = cartProducts.reduce((sum, item) => {
    const price = item.product?.price || 0;
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);
  
  const totalWishlistValue = wishlistProducts.reduce((sum, product) => sum + (product.price || 0), 0);
  
  // Helper function for image errors
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://via.placeholder.com/300x400?text=Image+Error';
  };

  return (
    <div className="real-time-section">
      <h3 className="section-title">
        <Clock size={20} />
        Live Shopping Data
      </h3>
      
<div className="real-time-controls">
  <button 
    className="refresh-button"
    onClick={() => {
      console.log('🔄 Manual refresh triggered');
      fetchCustomerRealTimeData();
    }}
    disabled={realTimeLoading || productsLoading}
  >
    {realTimeLoading || productsLoading ? (
      <>
        <div className="loading-spinner-small"></div>
        Loading...
      </>
    ) : (
      <>
        🔄 Refresh Live Data
      </>
    )}
  </button>
  
  {/* Add debug button */}
  <button 
    className="refresh-button"
    style={{ background: '#4B1C2F' }}
    onClick={() => {
      console.log('🔍 Debugging product data:');
      console.log('Cart products:', cartProducts);
      console.log('Wishlist products:', wishlistProducts);
      console.log('Customer data:', customer);
      console.log('Customer cart raw:', customerCart);
      console.log('Customer wishlist raw:', customerWishlist);
    }}
  >
    🐛 Debug Data
  </button>
</div>
      
      <div className="real-time-grid">
        {/* Cart Section */}
        <div className="real-time-card">
          <div className="real-time-header">
            <ShoppingCart size={20} />
            <span>Current Cart</span>
            <span className="badge">{cartProducts.length} items</span>
          </div>
          <div className="real-time-content">
            {productsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="loading-spinner-small" style={{ margin: '0 auto' }}></div>
                <p>Loading product details...</p>
              </div>
            ) : cartProducts.length > 0 ? (
              <>
                <div className="cart-summary">
                  <div className="summary-item">
                    <span>Total Items:</span>
                    <span>{totalCartItems}</span>
                  </div>
                  <div className="summary-item">
                    <span>Total Value:</span>
                    <span>${totalCartValue.toFixed(2)}</span>
                  </div>
                </div>
                <ul className="item-list">
                  {cartProducts.slice(0, 5).map((item, index) => {
                    const product = item.product || {};
                    const quantity = item.quantity || 1;
                    
                    // Log for debugging
                    if (index === 0) {
                      console.log('📱 Rendering cart product:', {
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        quantity: quantity
                      });
                    }
                    
                    return (
                      <li key={`cart-${index}-${product.id || index}`} className="item">
                        <div className="item-image" style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          backgroundColor: '#f5f5f5'
                        }}>
                          <img 
                            src={product.image || 'https://via.placeholder.com/300x400?text=No+Image'} 
                            alt={product.name || 'Product'}
                            onError={handleImageError}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                        </div>
                        <div className="item-details" style={{ flex: 1 }}>
                          <span className="item-name" style={{
                            display: 'block',
                            fontWeight: '600',
                            color: '#FFFFFF',
                            fontSize: '14px',
                            marginBottom: '4px'
                          }}>
                            {product.name || 'Unnamed Product'}
                          </span>
                          <div className="item-info" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span className="item-quantity" style={{
                              fontSize: '12px',
                              color: '#666',
                              background: 'rgba(212, 175, 55, 0.1)',
                              padding: '2px 8px',
                              borderRadius: '10px'
                            }}>
                              Qty: {quantity}
                            </span>
                            <span className="item-price" style={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#4CAF50'
                            }}>
                              ${(product.price || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {cartProducts.length > 5 && (
                    <li className="more-items" style={{
                      textAlign: 'center',
                      color: '#D4AF37',
                      fontStyle: 'italic',
                      paddingTop: '10px'
                    }}>
                      + {cartProducts.length - 5} more items
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <p className="empty-state" style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#666',
                fontStyle: 'italic'
              }}>
                Cart is empty
              </p>
            )}
          </div>
        </div>

        {/* Wishlist Section */}
        <div className="real-time-card">
          <div className="real-time-header">
            <Heart size={20} />
            <span>Wishlist</span>
            <span className="badge">{wishlistProducts.length} items</span>
          </div>
          <div className="real-time-content">
            {productsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="loading-spinner-small" style={{ margin: '0 auto' }}></div>
                <p>Loading product details...</p>
              </div>
            ) : wishlistProducts.length > 0 ? (
              <>
                <div className="wishlist-summary">
                  <div className="summary-item">
                    <span>Total Items:</span>
                    <span>{wishlistProducts.length}</span>
                  </div>
                  <div className="summary-item">
                    <span>Total Value:</span>
                    <span>${totalWishlistValue.toFixed(2)}</span>
                  </div>
                </div>
                <ul className="item-list">
                  {wishlistProducts.slice(0, 5).map((product, index) => {
                    // Log for debugging
                    if (index === 0) {
                      console.log('📱 Rendering wishlist product:', {
                        name: product.name,
                        price: product.price,
                        image: product.image
                      });
                    }
                    
                    return (
                      <li key={`wishlist-${index}-${product.id || index}`} className="item">
                        <div className="item-image" style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid rgba(255, 107, 107, 0.3)',
                          backgroundColor: '#f5f5f5'
                        }}>
                          <img 
                            src={product.image || 'https://via.placeholder.com/300x400?text=No+Image'} 
                            alt={product.name || 'Product'}
                            onError={handleImageError}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                        </div>
                        <div className="item-details" style={{ flex: 1 }}>
                          <span className="item-name" style={{
                            display: 'block',
                            fontWeight: '600',
                            color: '#FFFFFF',
                            fontSize: '14px',
                            marginBottom: '4px'
                          }}>
                            {product.name || 'Unnamed Product'}
                          </span>
                          <div className="item-info" style={{
                            display: 'flex',
                            justifyContent: 'flex-end'
                          }}>
                            <span className="item-price" style={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#4CAF50'
                            }}>
                              ${(product.price || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {wishlistProducts.length > 5 && (
                    <li className="more-items" style={{
                      textAlign: 'center',
                      color: '#D4AF37',
                      fontStyle: 'italic',
                      paddingTop: '10px'
                    }}>
                      + {wishlistProducts.length - 5} more items
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <p className="empty-state" style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#666',
                fontStyle: 'italic'
              }}>
                Wishlist is empty
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
        
  // Extracted customer properties with defaults
  const customerFirstName = customer?.firstName || 'Unknown';
  const customerLastName = customer?.lastName || 'User';
  const customerUsername = customer?.username || 'unknown';
  const customerEmail = customer?.email || 'No email';
  const customerPhone = customer?.phone;
  const customerRole = customer?.role;
  const customerAddress = customer?.address;
  const customerStatus = customer?.status || 'active';
  const customerCreatedAt = customer?.createdAt;
  const customerLastLogin = customer?.lastLogin;

  return (
    <div className="customer-modal-overlay">
      <div className="customer-modal">
        <div className="modal-header">
          <div className="header-content">
            <div className="customer-avatar-large" style={{
              background: `linear-gradient(135deg, ${level.color}, ${level.color}80)`,
              border: `3px solid ${level.color}`
            }}>
              {customerFirstName[0]}{customerLastName[0]}
              <div className="level-badge">
                {level.icon}
              </div>
            </div>
            <div className="customer-header-info">
              <h2 className="customer-name">
                {customerFirstName} {customerLastName}
                <span className="customer-id">#{customer?._id?.slice(-8) || 'unknown'}</span>
              </h2>
              <div className="customer-meta">
                <span className="customer-username">@{customerUsername}</span>
                <span className="customer-tier" style={{ color: level.color }}>
                  {level.icon}
                  {level.level} Member
                </span>
              </div>
              <div className="customer-status-row">
                <div className={`status-badge-large ${customerStatus === 'active' ? 'status-active' : 'status-inactive'}`}>
                  {customerStatus === 'active' ? '✓ Active Account' : '✗ Inactive Account'}
                </div>
                <div className="member-since">
                  <Calendar size={16} />
                  Member since {formatDate(customerCreatedAt)}
                </div>
              </div>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Real-time Data Section - Always show */}
          {renderRealTimeData()}

          {/* Quick Stats */}
          {activityLoading ? (
            <div className="loading-stats">
              <div className="loading-spinner-small"></div>
              <span>Loading activity data...</span>
            </div>
          ) : (
            <div className="quick-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <ShoppingBag size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{customerActivity?.totalOrders || 0}</div>
                  <div className="stat-label">Total Orders</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <CreditCard size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">${(customerActivity?.totalSpent || 0).toLocaleString()}</div>
                  <div className="stat-label">Total Spent</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    ${customerActivity?.averageOrderValue ? 
                      customerActivity.averageOrderValue.toFixed(2) : 
                      (customerActivity?.totalOrders > 0 ? 
                        ((customerActivity?.totalSpent || 0) / customerActivity.totalOrders).toFixed(2) : 
                        '0.00'
                      )}
                  </div>
                  <div className="stat-label">Avg. Order</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Activity size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    {customerActivity?.orderFrequency || 
                      (customerActivity?.totalOrders > 1 ? 
                        calculateOrderFrequency(customerActivity) : 
                        'N/A'
                      )}
                  </div>
                  <div className="stat-label">Order Frequency</div>
                </div>
              </div>
            </div>
          )}

          <div className="info-grid">
            {/* Personal Information Section */}
            <div className="info-section">
              <h3 className="section-title">
                <User size={20} />
                Personal Information
              </h3>
              <div className="info-item">
                <Mail size={18} className="info-icon" />
                <div className="info-content">
                  <div className="info-label">Email Address</div>
                  <div className="info-value">{customerEmail}</div>
                </div>
              </div>
              {customerPhone && (
                <div className="info-item">
                  <Phone size={18} className="info-icon" />
                  <div className="info-content">
                    <div className="info-label">Phone Number</div>
                    <div className="info-value">{customerPhone}</div>
                  </div>
                </div>
              )}
              <div className="info-item">
                <MapPin size={18} className="info-icon" />
                <div className="info-content">
                  <div className="info-label">Account Type</div>
                  <div className="info-value" style={{ color: '#D4AF37' }}>
                    {customerRole === 'admin' ? (
                      <>
                        <Shield size={16} /> Administrator
                      </>
                    ) : (
                      'Premium Customer'
                    )}
                  </div>
                </div>
              </div>
              {customerAddress && (
                <div className="info-item">
                  <div className="info-content">
                    <div className="info-label">Address</div>
                    <div className="info-value">{customerAddress}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Section - UPDATED to show real counts */}
            <div className="info-section">
              <h3 className="section-title">
                <Activity size={20} />
                Shopping Activity (Real-time)
              </h3>
              <div className="info-item">
                <Calendar size={18} className="info-icon" />
                <div className="info-content">
                  <div className="info-label">Last Login</div>
                  <div className="info-value">
                    {customerLastLogin ? formatDate(customerLastLogin) : 'Never logged in'}
                  </div>
                </div>
              </div>
              {customerActivity?.lastOrderDate && (
                <div className="info-item">
                  <ShoppingBag size={18} className="info-icon" />
                  <div className="info-content">
                    <div className="info-label">Last Order</div>
                    <div className="info-value">{formatDate(customerActivity.lastOrderDate)}</div>
                  </div>
                </div>
              )}
              <div className="info-item">
                <div className="info-content">
                  <div className="info-label">Current Shopping Status</div>
                  <div className="metrics-grid">
                    <div className="metric">
                      <div className="metric-label">Cart Items</div>
                      <div className="metric-value" style={{ color: customerCart.length > 0 ? '#4CAF50' : '#ff6b6b' }}>
                        {customerCart.length}
                      </div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Wishlist Items</div>
                      <div className="metric-value" style={{ color: customerWishlist.length > 0 ? '#4CAF50' : '#ff6b6b' }}>
                        {customerWishlist.length}
                      </div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Completed Orders</div>
                      <div className="metric-value">{customerActivity?.completedOrders || 0}</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Pending Orders</div>
                      <div className="metric-value">{customerActivity?.pendingOrders || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Activity Timeline - UPDATED */}
          <div className="activity-section">
            <h3 className="section-title">
              <Clock size={20} />
              Recent Activity Timeline
            </h3>
            <div className="activity-timeline">
              <div className="timeline-item">
                <div className="timeline-icon">🎯</div>
                <div className="timeline-content">
                  <div className="timeline-text">
                    <strong>Account Created</strong>
                    <div>Joined SriluFashionHub luxury community</div>
                  </div>
                  <div className="timeline-time">{formatDate(customerCreatedAt)}</div>
                </div>
              </div>
              
              {customerLastLogin && (
                <div className="timeline-item">
                  <div className="timeline-icon">🔐</div>
                  <div className="timeline-content">
                    <div className="timeline-text">
                      <strong>Last Login</strong>
                      <div>Successfully accessed the platform</div>
                    </div>
                    <div className="timeline-time">{formatDate(customerLastLogin)}</div>
                  </div>
                </div>
              )}

              {customerActivity?.totalOrders > 0 && (
                <div className="timeline-item">
                  <div className="timeline-icon">🛒</div>
                  <div className="timeline-content">
                    <div className="timeline-text">
                      <strong>Shopping Activity</strong>
                      <div>
                        Made {customerActivity.totalOrders} orders totaling 
                        ${(customerActivity.totalSpent || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="timeline-time">
                      {customerActivity.totalOrders === 1 ? '1 order' : `${customerActivity.totalOrders} orders`}
                    </div>
                  </div>
                </div>
              )}

              {customerCart.length > 0 && (
                <div className="timeline-item">
                  <div className="timeline-icon">🛍️</div>
                  <div className="timeline-content">
                    <div className="timeline-text">
                      <strong>Current Shopping</strong>
                      <div>
                        {customerCart.reduce((sum, item) => sum + (item.quantity || 1), 0)} items in cart
                      </div>
                    </div>
                    <div className="timeline-time">Updated just now</div>
                  </div>
                </div>
              )}

              {customerWishlist.length > 0 && (
                <div className="timeline-item">
                  <div className="timeline-icon">❤️</div>
                  <div className="timeline-content">
                    <div className="timeline-text">
                      <strong>Wishlist Activity</strong>
                      <div>
                        {customerWishlist.length} items in wishlist
                      </div>
                    </div>
                    <div className="timeline-time">Updated just now</div>
                  </div>
                </div>
              )}

              <div className="timeline-item">
                <div className="timeline-icon">⭐</div>
                <div className="timeline-content">
                  <div className="timeline-text">
                    <strong>Account Status</strong>
                    <div>
                      Account is currently <strong>{customerStatus}</strong> | {level.level} Tier
                    </div>
                  </div>
                  <div className="timeline-time">Updated just now</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="action-button edit-button" 
            onClick={() => {
              alert('Edit customer functionality to be implemented');
            }}
          >
            <Edit size={18} />
            Edit Profile
          </button>
          <button 
            className="action-button message-button"
            onClick={() => alert('Message functionality to be implemented')}
          >
            <Mail size={18} />
            Send Message
          </button>
          <button 
            className="action-button dashboard-button" 
            onClick={() => onViewDashboard(customer)}
          >
            <ExternalLink size={18} />
            View Customer Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate order frequency - FIXED with null checks
const calculateOrderFrequency = (activity) => {
  if (!activity || !activity.lastOrderDate || !activity.totalOrders || activity.totalOrders < 2) 
    return 'N/A';
  
  const joinDate = new Date(activity.firstOrderDate || new Date());
  const daysActive = Math.max(1, Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24)));
  const ordersPerMonth = (activity.totalOrders / (daysActive / 30)).toFixed(1);
  
  if (ordersPerMonth > 4) return 'Frequent';
  if (ordersPerMonth > 2) return 'Regular';
  if (ordersPerMonth > 0.5) return 'Occasional';
  return 'Rare';
};

// Customers Table Component with Info Button
const CustomersTable = ({ customers, onViewCustomer, onStatusToggle, onViewDetails }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  const sortedCustomers = [...customers].sort((a, b) => {
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
    
    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const filteredCustomers = sortedCustomers.filter(customer => {
    const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase();
    const email = customer.email?.toLowerCase() || '';
    const username = customer.username?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search) || username.includes(search);
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getCustomerTier = (customer) => {
    const totalActivity = 
      (customer.totalOrders || 0) * 3 + 
      (customer.totalSpent || 0) / 100 + 
      (customer.wishlistCount || 0) * 0.5;
    
    if (totalActivity > 100) return { icon: <Crown size={14} />, label: 'VIP', color: '#D4AF37' };
    if (totalActivity > 50) return { icon: <Star size={14} />, label: 'Premium', color: '#4CAF50' };
    return { icon: <User size={14} />, label: 'Regular', color: '#6B7280' };
  };

  return (
    <div className="customers-table-container">
      <div className="table-header">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search customers by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="table-actions">
          <button className="filter-btn">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        {filteredCustomers.length > 0 ? (
          <table className="customers-table">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-cell">
                  <div className="cell-content">Customer</div>
                </th>
                <th className="table-header-cell">
                  <div className="cell-content">Contact</div>
                </th>
                <th className="table-header-cell">
                  <div className="cell-content">Activity</div>
                </th>
                <th className="table-header-cell">
                  <div className="cell-content">Status</div>
                </th>
                <th className="table-header-cell">
                  <div className="cell-content">Joined</div>
                </th>
                <th className="table-header-cell">
                  <div className="cell-content">Actions</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const tier = getCustomerTier(customer);
                return (
                  <tr key={customer._id || customer.id} className="table-row">
                    <td className="table-cell">
                      <div className="customer-name">
                        <div className="avatar-wrapper">
                          <div 
                            className="avatar"
                            style={{
                              background: `linear-gradient(135deg, ${tier.color}40, ${tier.color}20)`,
                              border: `2px solid ${tier.color}`
                            }}
                          >
                            {customer.firstName?.[0] || 'C'}{customer.lastName?.[0] || 'U'}
                          </div>
                          {tier.icon}
                        </div>
                        <div className="name-info">
                          <span className="full-name">
                            {customer.firstName || 'Unknown'} {customer.lastName || 'User'}
                          </span>
                          <span className="username">@{customer.username || 'unknown'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="email-cell">
                        <Mail size={16} className="email-icon" />
                        <div className="contact-details">
                          <div className="email">{customer.email || 'No email'}</div>
                          {customer.phone && (
                            <div className="phone">
                              <Phone size={12} />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="activity-badges">
                        {(customer.totalOrders || 0) > 0 && (
                          <span className="activity-badge" title={`${customer.totalOrders || 0} orders`}>
                            <ShoppingBag size={12} />
                            {customer.totalOrders || 0}
                          </span>
                        )}
                        {(customer.wishlistCount || 0) > 0 && (
                          <span className="activity-badge wishlist" title={`${customer.wishlistCount || 0} wishlist items`}>
                            <Heart size={12} />
                            {customer.wishlistCount || 0}
                          </span>
                        )}
                        {(customer.cartCount || 0) > 0 && (
                          <span className="activity-badge cart" title={`${customer.cartCount || 0} items in cart`}>
                            <ShoppingCart size={12} />
                            {customer.cartCount || 0}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="status-container">
                        <span className={`status-badge ${(customer.status || 'active') === 'active' ? 'status-active' : 'status-inactive'}`}>
                          {(customer.status || 'active') === 'active' ? (
                            <>
                              <div className="status-dot active"></div>
                              Active
                            </>
                          ) : (
                            <>
                              <div className="status-dot inactive"></div>
                              Inactive
                            </>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="date-cell">
                        <Calendar size={16} className="date-icon" />
                        <div className="date-details">
                          <div className="date">{formatDate(customer.createdAt)}</div>
                          <div className="time-ago">
                            {customer.createdAt ? Math.floor((new Date() - new Date(customer.createdAt)) / (1000 * 60 * 60 * 24)) : 0} days ago
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="actions-cell">
                        {/* Info Button - NEW FEATURE */}
                        <InfoButton 
                          onClick={() => onViewDetails(customer)}
                        />
                        <button
                          onClick={() => onViewCustomer(customer)}
                          className="action-button view-button"
                          title="View Summary"
                        >
                          <Eye size={18} />
                          <span className="tooltip">View Summary</span>
                        </button>
                        <button
                          onClick={() => onStatusToggle(customer)}
                          className={`action-button status-button ${(customer.status || 'active') === 'active' ? 'deactivate' : 'activate'}`}
                          title={(customer.status || 'active') === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {(customer.status || 'active') === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                          <span className="tooltip">{(customer.status || 'active') === 'active' ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <div className="no-data-icon">👥</div>
            <h3>No customers found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main CustomersManagement Component
const CustomersManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    total: 0, 
    active: 0, 
    inactive: 0,
    newThisMonth: 0,
    vipCustomers: 0
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const navigate = useNavigate();

  // Fetch customers with activity data
const fetchCustomers = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    
    // Add 'complete' parameter to get full customer data
    const response = await fetch('http://localhost:5000/api/customers?complete=true', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
      
      const data = await response.json();
      
      if (data.success) {
        // Enhance customers with activity data
        const enhancedCustomers = data.customers?.map(customer => ({
          ...customer,
          totalOrders: customer.orders?.length || 0,
          wishlistCount: customer.wishlist?.length || 0,
          cartCount: customer.cart?.length || 0,
          totalSpent: calculateTotalSpent(customer.orders || []),
          averageOrder: calculateAverageOrder(customer.orders || [])
        })) || [];
        
        setCustomers(enhancedCustomers);
        calculateStats(enhancedCustomers);
      } else {
        console.error('Failed to fetch customers:', data.message);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalSpent = (orders) => {
    if (!orders || !Array.isArray(orders)) return 0;
    return orders.reduce((total, order) => total + (order.totalAmount || 0), 0);
  };

  const calculateAverageOrder = (orders) => {
    if (!orders || !Array.isArray(orders) || orders.length === 0) return 0;
    const total = calculateTotalSpent(orders);
    return total / orders.length;
  };

  const calculateStats = (customers) => {
    const total = customers.length || 0;
    const active = customers.filter(c => (c.status || 'active') === 'active').length || 0;
    const inactive = total - active;
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newThisMonth = customers.filter(c => {
      try {
        return new Date(c.createdAt) >= startOfMonth;
      } catch {
        return false;
      }
    }).length || 0;
    
    const vipCustomers = customers.filter(customer => {
      const activityScore = 
        (customer.totalOrders || 0) * 10 + 
        (customer.totalSpent || 0) / 100 + 
        (customer.wishlistCount || 0) * 2;
      return activityScore > 100;
    }).length || 0;
    
    setStats({ 
      total: total || 0, 
      active: active || 0, 
      inactive: inactive || 0,
      newThisMonth: newThisMonth || 0,
      vipCustomers: vipCustomers || 0
    });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  // NEW: Handle viewing complete details
  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleStatusToggle = async (customer) => {
    try {
      const newStatus = (customer.status || 'active') === 'active' ? 'inactive' : 'active';
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`http://localhost:5000/api/customers/${customer._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        setCustomers(customers.map(c => 
          c._id === customer._id ? { ...c, status: newStatus } : c
        ));
        fetchCustomers(); // Refresh stats
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update customer status');
    }
  };

  const handleViewDashboard = (customer) => {
    localStorage.setItem('viewedCustomer', JSON.stringify(customer));
    
    const confirmView = window.confirm(
      `Open ${customer.firstName || 'Customer'}'s dashboard as admin? You will have full access to view their activities.`
    );
    
    if (confirmView) {
      localStorage.setItem('adminViewingCustomer', 'true');
      localStorage.setItem('viewedCustomerId', customer._id);
      navigate('/user/dashboard');
    }
  };

  return (
    <div className="customers-management">
      {/* CSS Styles */}
      <style>{`
        /* ========== BASE STYLES ========== */
        .customers-management {
          min-height: 100vh;
          background: linear-gradient(135deg, 
            rgba(10, 10, 10, 0.95) 0%,
            rgba(28, 28, 28, 0.95) 50%,
            rgba(10, 10, 10, 0.95) 100%
          );
          padding: 2rem;
          position: relative;
          overflow-x: hidden;
          font-family: 'Playfair Display', 'Cormorant Garamond', serif;
          color: #F5F5F5;
        }

        /* Luxury Background Pattern */
        .luxury-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(75, 28, 47, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(1, 68, 33, 0.05) 0%, transparent 50%);
          z-index: 0;
        }

        /* Floating Luxury Elements */
        .luxury-floating {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .floating-element {
          position: absolute;
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 50%;
          animation: floatElement 15s ease-in-out infinite;
        }

        @keyframes floatElement {
          0%, 100% { 
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: translateY(-30px) rotate(180deg) scale(1.1);
            opacity: 0.6;
          }
        }

        /* Content Wrapper */
        .content-wrapper {
          position: relative;
          z-index: 2;
          max-width: 1600px;
          margin: 0 auto;
        }

        /* ========== HEADER STYLES ========== */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          padding: 2rem;
          background: linear-gradient(135deg, 
            rgba(28, 28, 28, 0.8) 0%,
            rgba(75, 28, 47, 0.3) 100%
          );
          backdrop-filter: blur(20px);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 25px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(212, 175, 55, 0.1);
        }

        .header-content {
          flex: 1;
        }

        .page-title {
          color: #D4AF37;
          font-size: 3.2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          font-family: 'Cormorant Garamond', serif;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          background: linear-gradient(45deg, #D4AF37, #F7E7CE, #D4AF37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% auto;
          animation: shine 3s linear infinite;
        }

        @keyframes shine {
          to {
            background-position: 200% center;
          }
        }

        .page-subtitle {
          color: rgba(245, 245, 245, 0.8);
          font-size: 1.2rem;
          margin: 0;
          font-style: italic;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .action-button {
          padding: 1rem 1.8rem;
          background: linear-gradient(135deg, 
            rgba(212, 175, 55, 0.15) 0%,
            rgba(212, 175, 55, 0.05) 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 15px;
          color: #D4AF37;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s ease;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-family: 'Playfair Display', serif;
          position: relative;
          overflow: hidden;
        }

        .action-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
          transition: left 0.6s ease;
        }

        .action-button:hover::before {
          left: 100%;
        }

        .action-button:hover {
          background: linear-gradient(135deg, 
            rgba(212, 175, 55, 0.25) 0%,
            rgba(212, 175, 55, 0.15) 100%
          );
          transform: translateY(-3px);
          box-shadow: 
            0 15px 30px rgba(212, 175, 55, 0.3),
            0 0 0 1px rgba(212, 175, 55, 0.2);
        }

        /* ========== STATS CARDS ========== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .enhanced-stat-card {
          position: relative;
          background: rgba(28, 28, 28, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 20px;
          padding: 2rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transition: all 0.4s ease;
          overflow: hidden;
        }

        .enhanced-stat-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .enhanced-stat-card:hover::before {
          opacity: 1;
        }

        .enhanced-stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.3);
        }

        .card-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.6s ease;
        }

        .enhanced-stat-card:hover .card-shine {
          left: 100%;
        }

        .stat-icon-wrapper {
          width: 70px;
          height: 70px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .enhanced-stat-card:hover .stat-icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }

        .stat-content {
          flex: 1;
        }

        .stat-content h3 {
          margin: 0 0 0.5rem 0;
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.95rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #F5F5F5;
          margin-bottom: 0.5rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .stat-change {
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        /* ========== TABLE SECTION ========== */
        .table-section {
          margin-top: 3rem;
        }

        .section-title {
          color: #F5F5F5;
          font-size: 1.8rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        }

        .product-count {
          font-size: 1rem;
          color: #D4AF37;
          margin-left: auto;
        }

        /* ========== CUSTOMERS TABLE ========== */
        .customers-table-container {
          background: linear-gradient(135deg, 
            rgba(28, 28, 28, 0.7) 0%,
            rgba(28, 28, 28, 0.9) 100%
          );
          backdrop-filter: blur(30px);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 25px;
          overflow: hidden;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(212, 175, 55, 0.1);
        }

        .table-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
          background: linear-gradient(135deg, 
            rgba(75, 28, 47, 0.2) 0%,
            rgba(75, 28, 47, 0.1) 100%
          );
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .search-container {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3.5rem;
          background: rgba(245, 245, 245, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.25);
          border-radius: 15px;
          color: #F5F5F5;
          font-size: 1rem;
          transition: all 0.3s ease;
          font-family: 'Playfair Display', serif;
        }

        .search-input:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 
            0 0 0 3px rgba(212, 175, 55, 0.1),
            0 0 20px rgba(212, 175, 55, 0.2);
          background: rgba(245, 245, 245, 0.12);
        }

        .search-icon {
          position: absolute;
          left: 1.2rem;
          top: 50%;
          transform: translateY(-50%);
          color: #D4AF37;
        }

        .table-actions {
          display: flex;
          gap: 1rem;
        }

        .filter-btn {
          padding: 0.8rem 1.5rem;
          background: rgba(1, 68, 33, 0.2);
          border: 1px solid rgba(1, 68, 33, 0.3);
          border-radius: 12px;
          color: #4CAF50;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .filter-btn:hover {
          background: rgba(1, 68, 33, 0.3);
          transform: translateY(-2px);
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .customers-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 1000px;
        }

        .table-header-row {
          background: linear-gradient(135deg, 
            rgba(75, 28, 47, 0.3) 0%,
            rgba(75, 28, 47, 0.1) 100%
          );
        }

        .table-header-cell {
          padding: 1.2rem 1.5rem;
          text-align: left;
          color: #D4AF37;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          border-bottom: 2px solid rgba(212, 175, 55, 0.2);
        }

        .table-row {
          background: rgba(28, 28, 28, 0.5);
          border-bottom: 1px solid rgba(212, 175, 55, 0.05);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .table-row::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background: linear-gradient(to bottom, transparent, #D4AF37, transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .table-row:hover::before {
          opacity: 1;
        }

        .table-row:hover {
          background: rgba(212, 175, 55, 0.03);
          transform: translateX(8px);
        }

        .table-cell {
          padding: 1.5rem 1.5rem;
          color: #F5F5F5;
          font-size: 1rem;
          vertical-align: middle;
        }

        /* Customer Name Cell */
        .customer-name {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          position: relative;
        }

        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1C1C1C;
          font-weight: bold;
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }

        .table-row:hover .avatar {
          transform: scale(1.1);
        }

        .name-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .full-name {
          font-weight: 600;
          color: #F5F5F5;
          font-size: 1.1rem;
        }

        .username {
          font-size: 0.9rem;
          color: rgba(245, 245, 245, 0.6);
          font-family: monospace;
        }

        /* Contact Details */
        .email-cell {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .contact-details {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .email {
          font-weight: 500;
        }

        .phone {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.85rem;
          color: rgba(245, 245, 245, 0.6);
        }

        /* Activity Badges */
        .activity-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .activity-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.6rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.2);
          color: #D4AF37;
        }

        .activity-badge.wishlist {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
        }

        .activity-badge.cart {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }

        /* Status Badge */
        .status-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          backdrop-filter: blur(10px);
        }

        .status-active {
          background: rgba(76, 175, 80, 0.15);
          color: #4CAF50;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        .status-inactive {
          background: rgba(255, 107, 107, 0.15);
          color: #ff6b6b;
          border: 1px solid rgba(255, 107, 107, 0.3);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.active {
          background: #4CAF50;
          box-shadow: 0 0 10px #4CAF50;
        }

        .status-dot.inactive {
          background: #ff6b6b;
          box-shadow: 0 0 10px #ff6b6b;
        }

        /* Date Cell */
        .date-cell {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .date-details {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .date {
          font-weight: 500;
        }

        .time-ago {
          font-size: 0.85rem;
          color: rgba(245, 245, 245, 0.5);
        }

        /* Actions Cell */
        .actions-cell {
          display: flex;
          gap: 0.5rem;
          position: relative;
        }

        .actions-cell .action-button {
          position: relative;
          padding: 0.8rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(245, 245, 245, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.1);
        }

        .actions-cell .action-button:hover {
          transform: translateY(-3px);
        }

        .actions-cell .action-button .tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(28, 28, 28, 0.95);
          color: #F5F5F5;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          border: 1px solid rgba(212, 175, 55, 0.2);
          z-index: 100;
        }

        .actions-cell .action-button:hover .tooltip {
          opacity: 1;
        }

        .view-button {
          color: #4CAF50;
        }

        .view-button:hover {
          background: rgba(76, 175, 80, 0.1);
          border-color: rgba(76, 175, 80, 0.3);
        }

        .info-button {
          color: #9C27B0;
          background: rgba(156, 39, 176, 0.1);
          border: 1px solid rgba(156, 39, 176, 0.3);
        }

        .info-button:hover {
          background: rgba(156, 39, 176, 0.2);
          border-color: rgba(156, 39, 176, 0.4);
          transform: scale(1.1) rotate(5deg);
          animation: pulsePurple 2s ease-in-out infinite;
        }

        @keyframes pulsePurple {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(156, 39, 176, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(156, 39, 176, 0);
          }
        }

        .status-button {
          color: #D4AF37;
        }

        .status-button.deactivate:hover {
          background: rgba(255, 107, 107, 0.1);
          border-color: rgba(255, 107, 107, 0.3);
        }

        .status-button.activate:hover {
          background: rgba(76, 175, 80, 0.1);
          border-color: rgba(76, 175, 80, 0.3);
        }

        /* No Data State */
        .no-data {
          padding: 4rem 2rem;
          text-align: center;
        }

        .no-data-icon {
          font-size: 4rem;
          opacity: 0.3;
          margin-bottom: 1.5rem;
        }

        .no-data h3 {
          color: #F5F5F5;
          margin-bottom: 0.5rem;
        }

        .no-data p {
          color: rgba(245, 245, 245, 0.6);
          margin: 0;
        }

        /* ========== LOADING STATE ========== */
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          flex-direction: column;
          gap: 2rem;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(212, 175, 55, 0.2);
          border-top: 4px solid #D4AF37;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          color: #D4AF37;
          font-size: 1.2rem;
          letter-spacing: 2px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ========== CUSTOMER MODAL ========== */
        .customer-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .customer-modal {
          background: linear-gradient(135deg, 
            rgba(28, 28, 28, 0.95) 0%,
            rgba(45, 45, 45, 0.95) 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 30px;
          width: 95%;
          max-width: 1000px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 
            0 40px 80px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(212, 175, 55, 0.2);
          animation: modalSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(60px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          padding: 2.5rem;
          background: linear-gradient(135deg, 
            rgba(75, 28, 47, 0.4) 0%,
            rgba(1, 68, 33, 0.3) 100%
          );
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .modal-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #D4AF37, #4B1C2F, #014421, #D4AF37);
          background-size: 300% 100%;
          animation: gradientMove 3s linear infinite;
        }

        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .customer-avatar-large {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1C1C1C;
          font-size: 2.5rem;
          font-weight: bold;
          position: relative;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }

        .level-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          background: #1C1C1C;
          border: 2px solid currentColor;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .customer-header-info {
          flex: 1;
        }

        .customer-name {
          color: #F5F5F5;
          font-size: 2.2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .customer-id {
          font-size: 1rem;
          color: rgba(245, 245, 245, 0.5);
          background: rgba(0, 0, 0, 0.3);
          padding: 0.2rem 0.8rem;
          border-radius: 12px;
          font-family: monospace;
        }

        .customer-meta {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }

        .customer-username {
          color: #D4AF37;
          font-size: 1.2rem;
          opacity: 0.9;
        }

        .customer-tier {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          padding: 0.3rem 1rem;
          border-radius: 20px;
          background: rgba(0, 0, 0, 0.2);
        }

        .customer-status-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .status-badge-large {
          padding: 0.6rem 1.2rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-badge-large.status-active {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        .status-badge-large.status-inactive {
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
          border: 1px solid rgba(255, 107, 107, 0.3);
        }

        .member-since {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.9rem;
        }

        .close-button {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D4AF37;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .close-button:hover {
          background: rgba(212, 175, 55, 0.2);
          transform: rotate(90deg);
        }

        /* ========== MODAL BODY ========== */
        .modal-body {
          padding: 2.5rem;
          overflow-y: auto;
          max-height: calc(90vh - 200px);
        }

        /* Real-time Controls */
        .real-time-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: rgba(212, 175, 55, 0.05);
          border-radius: 15px;
          border: 1px solid rgba(212, 175, 55, 0.1);
        }

        .refresh-button {
          padding: 0.8rem 1.5rem;
          background: linear-gradient(135deg, 
            rgba(212, 175, 55, 0.15) 0%,
            rgba(212, 175, 55, 0.05) 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          color: #D4AF37;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Playfair Display', serif;
        }

        .refresh-button:hover {
          background: linear-gradient(135deg, 
            rgba(212, 175, 55, 0.25) 0%,
            rgba(212, 175, 55, 0.15) 100%
          );
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(212, 175, 55, 0.2);
        }

        /* Real-time Data Section */
        .real-time-section {
          margin-bottom: 2rem;
        }

        .real-time-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .real-time-card {
          background: rgba(28, 28, 28, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 15px;
          overflow: hidden;
        }

        .real-time-header {
          padding: 1rem 1.5rem;
          background: rgba(212, 175, 55, 0.1);
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
          display: flex;
          align-items: center;
          gap: 0.8rem;
          color: #D4AF37;
          font-weight: 600;
        }

        .real-time-header .badge {
          margin-left: auto;
          background: rgba(212, 175, 55, 0.2);
          padding: 0.2rem 0.8rem;
          border-radius: 12px;
          font-size: 0.85rem;
        }

        .real-time-content {
          padding: 1.5rem;
        }

/* Add these styles to your CSS section */
.item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.item:last-child {
  border-bottom: none;
}

.item-image {
  width: 60px;
  height: 60px;
  min-width: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(212, 175, 55, 0.2);
  background-color: rgba(0, 0, 0, 0.1);
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.item-details {
  flex: 1;
  min-width: 0; /* Prevents text overflow issues */
}

.item-name {
  display: block;
  font-weight: 600;
  color: #F5F5F5;
  font-size: 0.95rem;
  margin-bottom: 0.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-quantity {
  font-size: 0.85rem;
  color: rgba(245, 245, 245, 0.7);
  background: rgba(212, 175, 55, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.item-price {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4CAF50;
}

.more-items {
  text-align: center;
  color: rgba(212, 175, 55, 0.8);
  font-style: italic;
  font-size: 0.9rem;
  padding-top: 0.5rem;
}

.empty-state {
  text-align: center;
  color: rgba(245, 245, 245, 0.5);
  padding: 2rem;
  font-style: italic;
}

/* Add loading styles */
.item-image .loading-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

        .more-items {
          color: rgba(212, 175, 55, 0.8);
          font-style: italic;
          font-size: 0.9rem;
          text-align: center;
          padding-top: 0.5rem;
        }

        .empty-state {
          color: rgba(245, 245, 245, 0.5);
          text-align: center;
          padding: 2rem;
          font-style: italic;
        }

        /* Loading Stats */
        .loading-stats {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 2rem;
          justify-content: center;
          background: rgba(28, 28, 28, 0.5);
          border-radius: 15px;
          margin-bottom: 2rem;
          border: 1px solid rgba(212, 175, 55, 0.1);
          color: rgba(245, 245, 245, 0.7);
        }

        .loading-spinner-small {
          width: 30px;
          height: 30px;
          border: 2px solid rgba(212, 175, 55, 0.2);
          border-top: 2px solid #D4AF37;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Quick Stats */
        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .quick-stats .stat-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 15px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
        }

        .quick-stats .stat-card:hover {
          border-color: rgba(212, 175, 55, 0.3);
          background: rgba(212, 175, 55, 0.03);
          transform: translateY(-3px);
        }

        .quick-stats .stat-icon {
          padding: 1rem;
          border-radius: 12px;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.2);
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 2.5rem;
        }

        .info-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 20px;
          padding: 1.8rem;
        }

        .info-section .section-title {
          color: #D4AF37;
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding-bottom: 0.8rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          margin-bottom: 1.2rem;
          padding: 0.8rem;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .info-item:hover {
          background: rgba(212, 175, 55, 0.05);
        }

        .info-icon {
          color: #D4AF37;
          opacity: 0.8;
          min-width: 24px;
        }

        .info-content {
          flex: 1;
        }

        .info-label {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 0.3rem;
        }

        .info-value {
          color: #F5F5F5;
          font-size: 1.1rem;
          font-weight: 500;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .metric {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 10px;
          padding: 0.8rem;
          text-align: center;
        }

        .metric-label {
          font-size: 0.75rem;
          color: rgba(245, 245, 245, 0.6);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 0.3rem;
        }

        .metric-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #F5F5F5;
        }

        /* Activity Timeline */
        .activity-timeline {
          position: relative;
          padding-left: 2rem;
        }

        .activity-timeline::before {
          content: '';
          position: absolute;
          left: 0.5rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, transparent, #D4AF37, transparent);
        }

        .timeline-item {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          position: relative;
        }

        .timeline-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.1);
          border: 2px solid #D4AF37;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          position: relative;
          z-index: 2;
        }

        .timeline-content {
          flex: 1;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .timeline-text {
          flex: 1;
        }

        .timeline-text strong {
          color: #F5F5F5;
          display: block;
          margin-bottom: 0.3rem;
        }

        .timeline-time {
          color: rgba(245, 245, 245, 0.5);
          font-size: 0.85rem;
          min-width: 180px;
          text-align: right;
        }

        /* ========== MODAL FOOTER ========== */
        .modal-footer {
          padding: 1.8rem 2.5rem;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
          display: flex;
          justify-content: flex-end;
          gap: 1.2rem;
          background: rgba(28, 28, 28, 0.9);
        }

        .modal-footer .action-button {
          padding: 1rem 1.8rem;
          border-radius: 15px;
          border: 1px solid;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 1rem;
        }

        .edit-button {
          background: rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.3);
          color: #D4AF37;
        }

        .edit-button:hover {
          background: rgba(212, 175, 55, 0.2);
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(212, 175, 55, 0.2);
        }

        .message-button {
          background: rgba(1, 68, 33, 0.1);
          border-color: rgba(1, 68, 33, 0.3);
          color: #4CAF50;
        }

        .message-button:hover {
          background: rgba(1, 68, 33, 0.2);
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(1, 68, 33, 0.2);
        }

        .dashboard-button {
          background: linear-gradient(135deg, 
            rgba(212, 175, 55, 0.2) 0%,
            rgba(212, 175, 55, 0.1) 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.4);
          color: #D4AF37;
          position: relative;
          overflow: hidden;
        }

        .dashboard-button::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent,
            rgba(212, 175, 55, 0.2),
            transparent
          );
          animation: buttonShine 3s linear infinite;
        }

        @keyframes buttonShine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        .dashboard-button:hover {
          background: linear-gradient(135deg, 
            rgba(212, 175, 55, 0.3) 0%,
            rgba(212, 175, 55, 0.2) 100%
          );
          transform: translateY(-3px);
          box-shadow: 
            0 15px 30px rgba(212, 175, 55, 0.3),
            0 0 0 1px rgba(212, 175, 55, 0.2);
        }

        /* ========== SIMPLE MODAL ========== */
        .simple-modal {
          max-width: 500px;
        }

        .simple-modal .modal-header {
          padding: 1.5rem;
        }

        .simple-modal .modal-body {
          padding: 2rem;
        }

        .summary-content {
          text-align: center;
        }

        .summary-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D4AF37, #F7E7CE);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: bold;
          color: #1C1C1C;
          margin: 0 auto 1.5rem;
        }

        .summary-content h3 {
          color: #F5F5F5;
          margin-bottom: 0.5rem;
        }

        .summary-content p {
          color: rgba(245, 245, 245, 0.7);
          margin-bottom: 1.5rem;
        }

        .summary-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .summary-stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #D4AF37;
        }

        .view-details-btn {
          padding: 0.8rem 1.5rem;
          background: rgba(156, 39, 176, 0.1);
          border: 1px solid rgba(156, 39, 176, 0.3);
          border-radius: 12px;
          color: #9C27B0;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto;
        }

        .view-details-btn:hover {
          background: rgba(156, 39, 176, 0.2);
          transform: translateY(-2px);
        }

        /* ========== RESPONSIVE DESIGN ========== */
        @media (max-width: 1200px) {
          .page-title {
            font-size: 2.5rem;
          }
          
          .enhanced-stat-card {
            padding: 1.5rem;
          }
          
          .stat-value {
            font-size: 2rem;
          }
        }

        @media (max-width: 768px) {
          .customers-management {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
            padding: 1.5rem;
          }

          .header-actions {
            width: 100%;
            justify-content: center;
            flex-wrap: wrap;
          }

          .page-title {
            font-size: 2rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .table-header {
            flex-direction: column;
            gap: 1rem;
          }

          .search-container {
            max-width: 100%;
          }

          .modal-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .modal-footer {
            flex-direction: column;
          }

          .modal-footer .action-button {
            width: 100%;
            justify-content: center;
          }

          .customer-name {
            font-size: 1.8rem;
          }

          .quick-stats {
            grid-template-columns: 1fr;
          }

          .real-time-controls {
            flex-direction: column;
          }

          .refresh-button {
            width: 100%;
            justify-content: center;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .actions-cell {
            flex-direction: column;
            gap: 0.5rem;
          }

          .timeline-content {
            flex-direction: column;
            gap: 0.5rem;
            text-align: left;
          }

          .timeline-time {
            text-align: left;
            min-width: auto;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 1.8rem;
          }

          .action-button {
            padding: 0.8rem 1.2rem;
            font-size: 0.9rem;
          }

          .customer-modal {
            padding: 1rem;
          }
        }

        /* Real-time Data Controls */
.real-time-controls .refresh-button.secondary {
  background: linear-gradient(135deg, 
    rgba(1, 68, 33, 0.15) 0%,
    rgba(1, 68, 33, 0.05) 100%
  );
  border: 1px solid rgba(1, 68, 33, 0.3);
  color: #4CAF50;
}

.real-time-controls .refresh-button.secondary:hover {
  background: linear-gradient(135deg, 
    rgba(1, 68, 33, 0.25) 0%,
    rgba(1, 68, 33, 0.15) 100%
  );
}

/* Cart and Wishlist Summary */
.cart-summary, .wishlist-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid rgba(212, 175, 55, 0.1);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.summary-item span:first-child {
  color: rgba(245, 245, 245, 0.7);
}

.summary-item span:last-child {
  color: #D4AF37;
  font-weight: 600;
}

/* Item with Image */
.item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.item-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(212, 175, 55, 0.1);
  font-size: 1.2rem;
}

.item-name {
  flex: 1;
  color: #F5F5F5;
  font-size: 0.9rem;
}

.item-quantity {
  color: rgba(245, 245, 245, 0.7);
  font-size: 0.85rem;
  min-width: 40px;
  text-align: center;
}

.item-price {
  color: #4CAF50;
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 60px;
  text-align: right;
}

.more-items {
  color: rgba(212, 175, 55, 0.8);
  font-style: italic;
  font-size: 0.9rem;
  text-align: center;
  padding-top: 0.5rem;
}

/* Add to your existing CSS */
.item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(212, 175, 55, 0.2);
  background: rgba(0, 0, 0, 0.2);
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.item-name {
  font-weight: 600;
  color: #F5F5F5;
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.item-quantity {
  color: rgba(245, 245, 245, 0.7);
  background: rgba(212, 175, 55, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.item-price {
  color: #4CAF50;
  font-weight: 600;
  background: rgba(76, 175, 80, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}


      `}</style>

      {/* Luxury Background Pattern */}
      <div className="luxury-background"></div>
      
      {/* Floating Elements */}
      <div className="luxury-floating">
        <div className="floating-element" style={{
          width: '150px',
          height: '150px',
          top: '10%',
          left: '5%',
          animationDelay: '0s',
          borderColor: 'rgba(212, 175, 55, 0.2)'
        }}></div>
        <div className="floating-element" style={{
          width: '100px',
          height: '100px',
          top: '70%',
          right: '5%',
          animationDelay: '3s',
          borderColor: 'rgba(75, 28, 47, 0.2)'
        }}></div>
        <div className="floating-element" style={{
          width: '80px',
          height: '80px',
          bottom: '15%',
          left: '15%',
          animationDelay: '6s',
          borderColor: 'rgba(1, 68, 33, 0.2)'
        }}></div>
        <div className="floating-element" style={{
          width: '120px',
          height: '120px',
          top: '30%',
          right: '20%',
          animationDelay: '9s',
          borderColor: 'rgba(0, 31, 63, 0.2)'
        }}></div>
      </div>

      <div className="content-wrapper">
        {/* Enhanced Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">👑 Customer Management</h1>
            <p className="page-subtitle">
              Manage your exclusive clientele with luxury precision and care
            </p>
          </div>
          <div className="header-actions">
            <button className="action-button" onClick={() => {
              fetchCustomers();
            }}>
              <span style={{ fontSize: '1.2rem' }}>🔄</span>
              Refresh All
            </button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="stats-grid">
          <EnhancedStatsCard
            title="Total Customers"
            value={stats.total || 0}
            icon={<Users size={28} />}
            color="#D4AF37"
            gradient="linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(247, 231, 206, 0.05))"
            change={12.5}
          />
          <EnhancedStatsCard
            title="Active Customers"
            value={stats.active || 0}
            icon={<UserCheck size={28} />}
            color="#4CAF50"
            gradient="linear-gradient(135deg, rgba(1, 68, 33, 0.1), rgba(76, 175, 80, 0.05))"
            change={8.2}
          />
          <EnhancedStatsCard
            title="VIP Members"
            value={stats.vipCustomers || 0}
            icon={<Crown size={28} />}
            color="#D4AF37"
            gradient="linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05))"
            change={15.8}
          />
          <EnhancedStatsCard
            title="New This Month"
            value={stats.newThisMonth || 0}
            icon={<User size={28} />}
            color="#6B7280"
            gradient="linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(107, 114, 128, 0.05))"
            change={-2.3}
          />
        </div>

        {/* Customers Table Section */}
        <div className="table-section">
          <h2 className="section-title">
            <Users size={28} />
            Customer Directory
            <span className="product-count">
              {customers.length} customers
            </span>
          </h2>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-text">Loading Luxury Data...</div>
            </div>
          ) : (
            <CustomersTable
              customers={customers}
              onViewCustomer={handleViewCustomer}
              onStatusToggle={handleStatusToggle}
              onViewDetails={handleViewDetails}
            />
          )}
        </div>
      </div>

      {/* Enhanced Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <EnhancedCustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCustomer(null);
          }}
          onViewDashboard={handleViewDashboard}
          onRefreshData={fetchCustomers}
        />
      )}

      {/* Simple Summary Modal */}
      {showModal && selectedCustomer && (
        <div className="customer-modal-overlay">
          <div className="customer-modal simple-modal">
            <div className="modal-header">
              <h2>Customer Summary</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="summary-content">
                <div className="summary-avatar">
                  {selectedCustomer.firstName?.[0] || 'C'}{selectedCustomer.lastName?.[0] || 'U'}
                </div>
                <h3>{selectedCustomer.firstName} {selectedCustomer.lastName}</h3>
                <p>{selectedCustomer.email}</p>
                <div className="summary-stats">
                  <div className="summary-stat">
                    <ShoppingBag size={20} />
                    <span>{selectedCustomer.totalOrders || 0} orders</span>
                  </div>
                  <div className="summary-stat">
                    <CreditCard size={20} />
                    <span>${(selectedCustomer.totalSpent || 0).toFixed(2)} spent</span>
                  </div>
                </div>
                <button 
                  className="view-details-btn"
                  onClick={() => {
                    setShowModal(false);
                    handleViewDetails(selectedCustomer);
                  }}
                >
                  <Info size={16} />
                  View Complete Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersManagement;