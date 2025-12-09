import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; 
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import AnimatedBackground from '../../components/AnimatedBackground';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Search, Shield, ExternalLink, Eye, Grid, List, Filter, Heart, ShoppingCart } from 'lucide-react';
import { productAPI } from '../../utils/api';
import { CATEGORIES, COLORS, BACKGROUND_IMAGES, QUICK_ACTIONS } from '../../utils/constants';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../../redux/slices/wishlistSlice'; 
import { addToCart } from '../../redux/slices/cartSlice'; 
const UserDashboard = () => {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [isAdminView, setIsAdminView] = useState(false);
  const [viewedCustomer, setViewedCustomer] = useState(null);
  const [userName, setUserName] = useState('');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    avgRating: 0,
    newProducts: 0
  });
  
  // Add Redux hooks
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  
  // Get wishlist and cart state from Redux
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { items: cartItems } = useSelector((state) => state.cart);

  // Check for admin viewing mode
  useEffect(() => {
    const adminViewing = localStorage.getItem('adminViewingCustomer');
    const customerData = localStorage.getItem('viewedCustomer');
    
    if (adminViewing === 'true' && customerData) {
      try {
        const customer = JSON.parse(customerData);
        setIsAdminView(true);
        setViewedCustomer(customer);
        setUserName(`${customer.firstName} ${customer.lastName}`);
      } catch (error) {
        console.error('Error parsing customer data:', error);
      }
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUserName(`${user.firstName} ${user.lastName}`);
        } catch (error) {
          setUserName('Valued Customer');
        }
      } else {
        setUserName('Valued Customer');
      }
    }
  }, []);

  // Fetch wishlist when component mounts
  useEffect(() => {
    const fetchData = async () => {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user) {
        await dispatch(fetchWishlist());
      }
    };
    fetchData();
  }, [dispatch]);

  // Background image slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => 
        prevIndex === BACKGROUND_IMAGES.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Fetch products from backend
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Call your API to get products
      const response = await productAPI.getAll();
      
      // Handle different response formats
      let productsData = [];
      if (response.success && response.products) {
        productsData = response.products;
      } else if (Array.isArray(response)) {
        productsData = response;
      }
      
      // Transform data to match frontend format
      const formattedProducts = productsData.map(product => ({
        id: product._id || product.id,
        name: product.name || product.title || 'Product',
        price: product.price || 0,
        originalPrice: product.originalPrice || product.price || 0,
        image: product.images?.[0] || product.image || 'https://via.placeholder.com/300x400',
        category: product.category || 'general',
        rating: product.rating || 4.5,
        isNew: product.isNew !== undefined ? product.isNew : true,
        description: product.description || 'Luxury fashion item',
        discount: product.discount || 0,
        brand: product.brand || 'Luxury Brand'
      }));
      
      setProducts(formattedProducts);
      
      // Calculate statistics
      calculateStats(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to mock data
      const mockProducts = getMockProducts();
      setProducts(mockProducts);
      calculateStats(mockProducts);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate statistics
  const calculateStats = (productsList) => {
    const totalProducts = productsList.length;
    const totalValue = productsList.reduce((sum, product) => sum + (product.price || 0), 0);
    const avgRating = productsList.length > 0 
      ? (productsList.reduce((sum, product) => sum + (product.rating || 0), 0) / productsList.length).toFixed(1)
      : 0;
    const newProducts = productsList.filter(product => product.isNew).length;
    
    setStats({
      totalProducts,
      totalValue,
      avgRating,
      newProducts
    });
  };

  // Get mock products for fallback
  const getMockProducts = () => [
    {
      id: 1,
      name: 'Designer Evening Gown',
      price: 299.99,
      originalPrice: 399.99,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
      category: 'dresses',
      rating: 4.8,
      isNew: true,
      description: 'Elegant evening gown with premium silk fabric',
      discount: 25,
      brand: 'Luxury Couture'
    },
    {
      id: 2,
      name: 'Luxury Silk Blouse',
      price: 149.99,
      originalPrice: 199.99,
      image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400',
      category: 'tops',
      rating: 4.5,
      isNew: false,
      description: 'Premium silk blouse for sophisticated looks',
      discount: 25,
      brand: 'Silk Elegance'
    },
    {
      id: 3,
      name: 'Premium Leather Handbag',
      price: 459.99,
      originalPrice: 599.99,
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
      category: 'accessories',
      rating: 4.9,
      isNew: true,
      description: 'Handcrafted genuine leather handbag',
      discount: 23,
      brand: 'Artisan Leather'
    },
    {
      id: 4,
      name: 'Designer High Heels',
      price: 329.99,
      originalPrice: 429.99,
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
      category: 'shoes',
      rating: 4.7,
      isNew: true,
      description: 'Premium designer heels for special occasions',
      discount: 23,
      brand: 'Heavenly Steps'
    },
    {
      id: 5,
      name: 'Cashmere Winter Coat',
      price: 589.99,
      originalPrice: 699.99,
      image: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400',
      category: 'coats',
      rating: 4.9,
      isNew: false,
      description: '100% pure cashmere winter coat',
      discount: 16,
      brand: 'Winter Luxe'
    },
    {
      id: 6,
      name: 'Diamond Necklace',
      price: 1299.99,
      originalPrice: 1599.99,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
      category: 'jewelry',
      rating: 5.0,
      isNew: true,
      description: 'Elegant diamond necklace with 18K gold',
      discount: 19,
      brand: 'Royal Jewelers'
    }
  ];

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products based on criteria
  const filteredProducts = useCallback(() => {
    let filtered = products;
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term)
      );
    }
    
    // Filter by price range
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // Sort products
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b.isNew - a.isNew;
        default:
          return 0;
      }
    });
  }, [products, activeCategory, searchTerm, priceRange, sortBy]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    searchInputRef.current?.blur();
    console.log('Search triggered for:', searchTerm);
  };

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (product) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      alert('Please login to add items to wishlist');
      navigate('/user/login');
      return;
    }

    const isInWishlist = wishlistItems.some(item => 
      (item._id || item.id) === (product.id || product._id)
    );

    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id || product._id));
    } else {
      dispatch(addToWishlist(product));
    }
  };

  // Handle add to cart
  const handleAddToCart = (product) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      alert('Please login to add items to cart');
      navigate('/user/login');
      return;
    }

    dispatch(addToCart({ product, quantity: 1 }));
    alert('Added to cart!');
  };

  // Check if product is in wishlist
  const isProductInWishlist = (productId) => {
    return wishlistItems.some(item => 
      (item._id || item.id) === productId
    );
  };

  // Check if product is in cart
  const isProductInCart = (productId) => {
    return cartItems.some(item => 
      (item.product?._id || item.product?.id) === productId
    );
  };

  // Logout function
  const handleLogout = () => {
    if (isAdminView) {
      localStorage.removeItem('adminViewingCustomer');
      localStorage.removeItem('viewedCustomer');
      localStorage.removeItem('viewedCustomerId');
      navigate('/admin/customers');
    } else {
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userCart');
      localStorage.removeItem('userWishlist');
      localStorage.removeItem('userOrders');
      navigate('/user/login');
    }
  };

  // Exit admin view
  const handleExitAdminView = () => {
    localStorage.removeItem('adminViewingCustomer');
    localStorage.removeItem('viewedCustomer');
    localStorage.removeItem('viewedCustomerId');
    navigate('/admin/customers');
  };

  // Quick actions
  const quickActions = [
    { icon: '📦', label: 'Orders', action: () => navigate('/user/orders') },
    { icon: '❤️', label: 'Wishlist', action: () => navigate('/user/wishlist') },
    { icon: '🛒', label: 'Cart', action: () => navigate('/user/cart') },
    { icon: '🎫', label: 'Coupons', action: () => navigate('/user/coupons') },
    { icon: '👤', label: 'Profile', action: () => navigate('/user/profile') },
  ];

  // Admin View Banner Component
  const AdminViewBanner = () => (
    <div className="admin-view-banner">
      <div className="admin-view-content">
        <div className="admin-view-info">
          <Shield size={20} />
          <span>
            👑 <strong>Admin View:</strong> Viewing {viewedCustomer?.firstName}'s Dashboard
          </span>
        </div>
        <div className="admin-view-actions">
          <button 
            className="btn btn-dark admin-action-btn"
            onClick={() => navigate('/admin/customers')}
          >
            <Eye size={16} />
            Back to Customer Details
          </button>
          <button 
            className="btn btn-user admin-exit-btn"
            onClick={handleExitAdminView}
          >
            <ExternalLink size={16} />
            Exit Admin View
          </button>
        </div>
      </div>
    </div>
  );

  // User Stats Component
  const UserStats = () => (
    <div className="user-stats-section">
      <div className="user-stats-grid">
        <div className="user-stat-card">
          <div className="user-stat-icon">📦</div>
          <div className="user-stat-content">
            <div className="user-stat-value">{stats.totalProducts}</div>
            <div className="user-stat-label">Total Products</div>
          </div>
        </div>
        <div className="user-stat-card">
          <div className="user-stat-icon">💰</div>
          <div className="user-stat-content">
            <div className="user-stat-value">${stats.totalValue.toFixed(2)}</div>
            <div className="user-stat-label">Total Value</div>
          </div>
        </div>
        <div className="user-stat-card">
          <div className="user-stat-icon">⭐</div>
          <div className="user-stat-content">
            <div className="user-stat-value">{stats.avgRating}</div>
            <div className="user-stat-label">Avg Rating</div>
          </div>
        </div>
        <div className="user-stat-card">
          <div className="user-stat-icon">🆕</div>
          <div className="user-stat-content">
            <div className="user-stat-value">{stats.newProducts}</div>
            <div className="user-stat-label">New Arrivals</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Filter Sidebar Component
  const FilterSidebar = () => (
    <div className="filter-sidebar">
      <div className="filter-section">
        <h3 className="filter-title">
          <Filter size={16} />
          Sort By
        </h3>
        <div className="sort-options">
          {[
            { value: 'newest', label: 'Newest First' },
            { value: 'price_asc', label: 'Price: Low to High' },
            { value: 'price_desc', label: 'Price: High to Low' },
            { value: 'rating', label: 'Highest Rated' }
          ].map((option) => (
            <button
              key={option.value}
              className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
              onClick={() => setSortBy(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Price Range</h3>
        <div className="price-range">
          <div className="price-labels">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
          <div className="range-slider">
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
              className="range-input"
            />
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="range-input"
            />
            <div className="range-track">
              <div 
                className="range-selected"
                style={{
                  left: `${(priceRange[0] / 5000) * 100}%`,
                  right: `${100 - (priceRange[1] / 5000) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Reset Filters</h3>
        <button
          className="btn btn-user reset-filters-btn"
          onClick={() => {
            setSearchTerm('');
            setActiveCategory('all');
            setPriceRange([0, 5000]);
            setSortBy('newest');
          }}
        >
          Reset All Filters
        </button>
      </div>
    </div>
  );

  // Mobile Filter Button
  const MobileFilterButton = () => (
    <div className="mobile-filter-btn-container">
      <button 
        className="btn btn-dark mobile-filter-btn"
        onClick={() => setShowFilters(true)}
      >
        <Filter size={18} />
        <span>Filters & Sort</span>
      </button>
    </div>
  );

  // Mobile Filter Modal
  const MobileFilterModal = () => (
    <div className={`filter-modal ${showFilters ? 'active' : ''}`}>
      <div className="filter-modal-content">
        <div className="filter-modal-header">
          <h3>Filter Products</h3>
          <button 
            className="close-filter-btn"
            onClick={() => setShowFilters(false)}
          >
            ✕
          </button>
        </div>
        <div className="filter-options">
          <FilterSidebar />
        </div>
      </div>
      <div className="filter-modal-overlay" onClick={() => setShowFilters(false)} />
    </div>
  );


  // Custom Product Card with Redux Actions
  const CustomProductCard = ({ product }) => {
    const isWishlisted = isProductInWishlist(product.id);
    const isInCart = isProductInCart(product.id);

    return (
      <div className="product-card-custom" onClick={() => navigate(`/product/${product.id}`)}>
        <div className="product-image">
          <img src={product.image} alt={product.name} />
          
          <div className="product-badges">
            {product.isNew && <span className="badge new">NEW</span>}
            {product.discount > 0 && (
              <span className="badge sale">-{product.discount}%</span>
            )}
          </div>

          <div className="product-actions">
            <button 
              className={`action-btn wishlist-btn ${isWishlisted ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleWishlistToggle(product);
              }}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isWishlisted ? <Heart size={20} fill="#ff6b6b" color="#ff6b6b" /> : <Heart size={20} />}
            </button>
          </div>

          <button 
            className={`add-to-cart-btn ${isInCart ? 'in-cart' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(product);
            }}
          >
            <span className="btn-text">{isInCart ? 'In Cart' : 'Add to Cart'}</span>
            <span className="btn-icon"><ShoppingCart size={16} /></span>
          </button>
        </div>

        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          
          <div className="product-meta">
            <span className="product-brand">{product.brand}</span>
            <div className="product-rating">
              {'★'.repeat(Math.floor(product.rating))}
              {'☆'.repeat(5 - Math.floor(product.rating))}
              <span className="rating-value">({product.rating.toFixed(1)})</span>
            </div>
          </div>

          <div className="product-price">
            <span className="current-price">${product.price.toFixed(2)}</span>
            {product.originalPrice > product.price && (
              <span className="original-price">${product.originalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>

        <style jsx>{`
          .product-card-custom {
            background: rgba(40, 40, 40, 0.8);
            border-radius: 15px;
            overflow: hidden;
            transition: all 0.3s ease;
            border: 1px solid rgba(212, 175, 55, 0.2);
            position: relative;
            cursor: pointer;
            height: 100%;
          }

          .product-card-custom:hover {
            transform: translateY(-5px);
            border-color: #D4AF37;
            box-shadow: 0 15px 30px rgba(212, 175, 55, 0.2);
          }

          .product-image {
            position: relative;
            overflow: hidden;
            aspect-ratio: 3/4;
          }

          .product-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }

          .product-card-custom:hover .product-image img {
            transform: scale(1.05);
          }

          .product-badges {
            position: absolute;
            top: 10px;
            left: 10px;
            display: flex;
            gap: 5px;
            z-index: 2;
          }

          .badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: bold;
            text-transform: uppercase;
          }

          .badge.new {
            background: #014421;
            color: white;
          }

          .badge.sale {
            background: #4B1C2F;
            color: #D4AF37;
          }

          .product-actions {
            position: absolute;
            top: 10px;
            right: 10px;
            opacity: 0;
            transform: translateX(10px);
            transition: all 0.3s ease;
            z-index: 2;
          }

          .product-card-custom:hover .product-actions {
            opacity: 1;
            transform: translateX(0);
          }

          .action-btn {
            background: rgba(28, 28, 28, 0.8);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
          }

          .action-btn:hover {
            background: #D4AF37;
            transform: scale(1.1);
          }

          .wishlist-btn.active {
            background: rgba(255, 107, 107, 0.2);
            border: 1px solid #ff6b6b;
          }

          .wishlist-btn.active:hover {
            background: rgba(255, 107, 107, 0.3);
          }

          .add-to-cart-btn {
            position: absolute;
            bottom: -50px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(45deg, #D4AF37, #F7E7CE);
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            color: #1C1C1C;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            opacity: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
            z-index: 2;
          }

          .add-to-cart-btn.in-cart {
            background: linear-gradient(45deg, #4B1C2F, #7D2C4F);
            color: white;
          }

          .product-card-custom:hover .add-to-cart-btn {
            bottom: 20px;
            opacity: 1;
          }

          .add-to-cart-btn:hover {
            transform: translateX(-50%) scale(1.05);
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.5);
            background: linear-gradient(45deg, #F7E7CE, #D4AF37);
          }

          .add-to-cart-btn.in-cart:hover {
            background: linear-gradient(45deg, #7D2C4F, #9A3C6E);
          }

          .product-info {
            padding: 1rem;
          }

          .product-name {
            font-size: 1rem;
            font-weight: 600;
            color: #F5F5F5;
            margin-bottom: 0.5rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .product-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
          }

          .product-brand {
            font-size: 0.8rem;
            color: #D4AF37;
            font-weight: 500;
          }

          .product-rating {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            color: #D4AF37;
            font-size: 0.8rem;
          }

          .product-price {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .current-price {
            font-size: 1.2rem;
            font-weight: bold;
            color: #D4AF37;
          }

          .original-price {
            font-size: 0.9rem;
            color: #888;
            text-decoration: line-through;
          }
        `}</style>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="user-dashboard">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Admin View Banner */}
      {isAdminView && <AdminViewBanner />}
      
      <Header />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="background-slideshow">
          {BACKGROUND_IMAGES.map((image, index) => (
            <div
              key={index}
              className={`background-image ${index === currentBgIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
          <div className="background-overlay"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="title-line">Welcome, {userName}</span>
              <span className="title-line luxury-text">Luxury Collection</span>
            </h1>
            <p className="hero-subtitle">
              Discover {stats.totalProducts} exclusive fashion items curated just for you
            </p>
            
            <form onSubmit={handleSearch} className="hero-search">
              <div className="search-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search luxury fashion, brands, and more..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    type="button"
                    className="clear-search"
                    onClick={() => setSearchTerm('')}
                  >
                    ✕
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-user search-btn">
                Search
              </button>
            </form>

            <div className="slideshow-indicators">
              {BACKGROUND_IMAGES.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentBgIndex ? 'active' : ''}`}
                  onClick={() => setCurrentBgIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Filter Button */}
      <MobileFilterButton />

      {/* Quick Actions Bar */}
      <section className="quick-actions-bar">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="btn btn-dark quick-action-btn"
            onClick={action.action}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
          </button>
        ))}
        
        <button className="btn btn-dark quick-action-btn logout-btn" onClick={handleLogout}>
          <span className="action-icon">{isAdminView ? '🏠' : '🚪'}</span>
          <span className="action-label">
            {isAdminView ? 'Back to Admin' : 'Logout'}
          </span>
        </button>
      </section>

      

      {/* User Stats Section */}
      <UserStats />

      {/* Main Dashboard Content */}
      <div className="dashboard-container">
        {/* Desktop Sidebar */}
        <aside className="dashboard-sidebar">
          {/* Categories */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">
              <span className="title-icon">📁</span>
              Categories
            </h3>
            <div className="category-list">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  className={`category-item ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">
                    {products.filter(p => 
                      category.id === 'all' ? true : 
                      p.category.toLowerCase().includes(category.id.toLowerCase())
                    ).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <FilterSidebar />
        </aside>

        {/* Main Content Area */}
        <main className="dashboard-main">
          <div className="main-header">
            <div className="header-left">
              <h2 className="section-title">
                {activeCategory === 'all' 
                  ? 'All Products' 
                  : CATEGORIES.find(cat => cat.id === activeCategory)?.name}
                <span className="product-count">({filteredProducts().length} items)</span>
              </h2>
              {isAdminView && (
                <p className="admin-view-note">
                  Viewing products available to {viewedCustomer?.firstName}
                </p>
              )}
            </div>
            
            <div className="header-right">
              <div className="sort-select-container">
                <select 
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
              
              <div className="view-controls">
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid size={18} />
                </button>
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

{/* Products Grid */}
<section className="products-section">
  {filteredProducts().length > 0 ? (
    <div className={`products-container ${viewMode}`}>
      {filteredProducts().map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          viewMode={viewMode}
        />
      ))}
    </div>
  ) : (
    <div className="no-products">
      <div className="no-products-icon">🔍</div>
      <h3>No products found</h3>
      <p>Try adjusting your search or filters</p>
      <button 
        className="btn btn-user reset-filters-btn"
        onClick={() => {
          setSearchTerm('');
          setActiveCategory('all');
          setPriceRange([0, 5000]);
          setSortBy('newest');
        }}
      >
        Reset All Filters
      </button>
    </div>
  )}
</section>
        </main>
      </div>

      {/* Mobile Filter Modal */}
      <MobileFilterModal />

      <style jsx>{`
        /* Add list view styles */
        .product-list-item {
          background: rgba(28, 28, 28, 0.7);
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.1);
          padding: 1.5rem;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }

        .product-list-item:hover {
          border-color: rgba(212, 175, 55, 0.3);
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }

        .list-item-content {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .list-item-image {
          width: 120px;
          height: 160px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .list-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .list-item-info {
          flex: 1;
        }

        .list-item-info h3 {
          color: #F5F5F5;
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
        }

        .list-item-category {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.9rem;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .list-item-description {
          color: rgba(245, 245, 245, 0.8);
          font-size: 0.95rem;
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .list-item-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .list-item-brand {
          color: #D4AF37;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .list-item-rating {
          color: #D4AF37;
          font-weight: 600;
        }

        .list-item-price {
          color: #F5F5F5;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .list-item-actions {
          display: flex;
          gap: 1rem;
        }

        .wishlist-btn-list, .cart-btn-list {
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: none;
        }

        .wishlist-btn-list {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
        }

        .wishlist-btn-list.active {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.3);
          color: #ff6b6b;
        }

        .wishlist-btn-list:hover {
          transform: translateY(-2px);
        }

        .cart-btn-list {
          background: linear-gradient(45deg, #D4AF37, #F7E7CE);
          color: #1C1C1C;
        }

        .cart-btn-list.in-cart {
          background: rgba(107, 114, 128, 0.2);
          color: rgba(245, 245, 245, 0.7);
          cursor: not-allowed;
        }

        .cart-btn-list:hover:not(.in-cart) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3);
        }

        /* Rest of your existing styles... */
        .user-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
          color: #ffffff;
          position: relative;
          overflow-x: hidden;
          font-family: 'Playfair Display', 'Times New Roman', serif;
        }

        .admin-view-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, ${COLORS.secondary} 0%, #7D2C4F 100%);
          color: #ffffff;
          padding: 0.8rem 2rem;
          z-index: 10000;
          border-bottom: 2px solid ${COLORS.accent};
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .admin-view-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
        }

        .admin-view-info {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 1rem;
          font-weight: 600;
        }

        .admin-view-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .admin-action-btn, .admin-exit-btn {
          padding: 0.6rem 1.2rem;
          min-width: auto;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .hero-section {
          position: relative;
          min-height: ${isAdminView ? '85vh' : '100vh'};
          display: flex;
          align-items: center;
          justify-content: center;
          padding: ${isAdminView ? '6rem 5% 3rem' : '0 5%'};
          overflow: hidden;
        }

        .background-slideshow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .background-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 1.5s ease-in-out;
        }

        .background-image.active {
          opacity: 1;
        }

        .background-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(28, 28, 28, 0.85), rgba(75, 28, 47, 0.7));
          z-index: 2;
        }

        .hero-content {
          position: relative;
          z-index: 3;
          text-align: center;
          max-width: 800px;
          width: 100%;
        }

        .hero-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .hero-title {
          font-size: 4.5rem;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .title-line {
          display: block;
          margin-bottom: 0.2rem;
        }

        .luxury-text {
          background: linear-gradient(45deg, ${COLORS.accent}, ${COLORS.lightAccent}, ${COLORS.accent});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% auto;
          animation: shine 3s linear infinite;
          font-size: 4.8rem;
        }

        @keyframes shine {
          to {
            background-position: 200% center;
          }
        }

        .hero-subtitle {
          font-size: 1.4rem;
          color: ${COLORS.warmNeutral};
          margin-bottom: 3rem;
          line-height: 1.6;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-search {
          display: flex;
          max-width: 600px;
          width: 100%;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50px;
          border: 1px solid rgba(212, 175, 55, 0.4);
          overflow: hidden;
          margin-bottom: 2rem;
          margin-left: auto;
          margin-right: auto;
        }

        .search-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          position: relative;
        }

        .search-icon {
          color: rgba(255, 255, 255, 0.7);
          margin-right: 0.8rem;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 1.3rem 0.5rem;
          color: #ffffff;
          font-size: 1.1rem;
          font-family: 'Playfair Display', serif;
          min-width: 0;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
        }

        .clear-search {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          padding: 0.2rem;
          font-size: 1rem;
        }

        .search-btn {
          min-width: auto;
          padding: 1.3rem 3rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 0 50px 50px 0;
        }

        .slideshow-indicators {
          display: flex;
          gap: 0.8rem;
          justify-content: center;
          margin-top: 2.5rem;
        }

        .indicator {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid rgba(212, 175, 55, 0.6);
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .indicator.active {
          background: ${COLORS.accent};
          transform: scale(1.3);
          border-color: ${COLORS.accent};
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
        }

        .indicator:hover {
          background: rgba(212, 175, 55, 0.3);
          transform: scale(1.2);
        }

        .mobile-filter-btn-container {
          display: none;
          padding: 1rem 5%;
          background: rgba(28, 28, 28, 0.9);
        }

        .mobile-filter-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          padding: 1rem;
          min-width: auto;
        }

        .quick-actions-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          padding: 2rem 5%;
          background: rgba(28, 28, 28, 0.9);
          border-top: 1px solid rgba(212, 175, 55, 0.1);
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
        }

        .quick-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem 1rem;
          min-width: auto;
        }

        .action-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .action-label {
          font-weight: 600;
          color: ${COLORS.warmNeutral};
        }

        .logout-btn {
          background: linear-gradient(135deg, #7D2C4F 0%, ${COLORS.secondary} 100%);
        }

        .user-stats-section {
          padding: 2rem 5%;
          background: linear-gradient(135deg, 
            rgba(28, 28, 28, 0.6) 0%,
            rgba(28, 28, 28, 0.9) 100%
          );
        }

        .user-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .user-stat-card {
          background: linear-gradient(135deg, 
            rgba(28, 28, 28, 0.8) 0%,
            rgba(45, 45, 45, 0.8) 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.2rem;
          transition: all 0.3s ease;
        }

        .user-stat-card:hover {
          border-color: rgba(212, 175, 55, 0.4);
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }

        .user-stat-icon {
          width: 60px;
          height: 60px;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
        }

        .user-stat-content {
          flex: 1;
        }

        .user-stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: ${COLORS.neutral};
          margin-bottom: 0.3rem;
        }

        .user-stat-label {
          font-size: 0.9rem;
          color: rgba(245, 245, 245, 0.7);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .dashboard-container {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 2rem;
          padding: 2rem 5%;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-sidebar {
          display: block;
        }

        .sidebar-section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .sidebar-title {
          color: ${COLORS.accent};
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0 0 1.2rem 0;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .title-icon {
          font-size: 1.3rem;
        }

        .category-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .category-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: transparent;
          border: none;
          color: #ffffff;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s ease;
          width: 100%;
          text-align: left;
          font-family: 'Cormorant Garamond', serif;
        }

        .category-item:hover {
          background: rgba(212, 175, 55, 0.1);
          transform: translateX(5px);
        }

        .category-item.active {
          background: linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.accent});
          transform: translateX(5px);
        }

        .category-icon {
          font-size: 1.2rem;
        }

        .category-name {
          flex: 1;
          font-weight: 500;
          font-size: 1rem;
        }

        .category-count {
          background: rgba(212, 175, 55, 0.2);
          padding: 0.3rem 0.8rem;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .filter-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .filter-title {
          color: ${COLORS.accent};
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .sort-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sort-option {
          padding: 0.8rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 8px;
          color: ${COLORS.warmNeutral};
          text-align: left;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .sort-option:hover {
          background: rgba(212, 175, 55, 0.1);
          border-color: ${COLORS.accent};
        }

        .sort-option.active {
          background: ${COLORS.accent};
          color: ${COLORS.primary};
          border-color: ${COLORS.accent};
        }

        .price-range {
          padding: 0.5rem 0;
        }

        .price-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: ${COLORS.warmNeutral};
        }

        .range-slider {
          position: relative;
          height: 30px;
          display: flex;
          align-items: center;
        }

        .range-input {
          position: absolute;
          width: 100%;
          height: 5px;
          background: transparent;
          -webkit-appearance: none;
          pointer-events: none;
          z-index: 3;
        }

        .range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          background: ${COLORS.accent};
          border-radius: 50%;
          cursor: pointer;
          pointer-events: auto;
          border: 2px solid ${COLORS.primary};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .range-track {
          position: absolute;
          width: 100%;
          height: 5px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .range-selected {
          position: absolute;
          height: 100%;
          background: ${COLORS.accent};
          border-radius: 3px;
        }

        .reset-filters-btn {
          width: 100%;
          padding: 0.8rem;
          font-size: 0.9rem;
          min-width: auto;
        }

        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
        }

        .section-title {
          color: ${COLORS.neutral};
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .product-count {
          color: ${COLORS.accent};
          font-size: 1rem;
          font-weight: 500;
        }

        .sort-select-container {
          margin-right: 1rem;
        }

        .sort-select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 8px;
          color: ${COLORS.neutral};
          padding: 0.8rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          min-width: 180px;
        }

        .view-controls {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 0.3rem;
          border: 1px solid rgba(212, 175, 55, 0.2);
        }

        .view-btn {
          background: transparent;
          border: none;
          padding: 0.8rem 1rem;
          border-radius: 8px;
          color: ${COLORS.warmNeutral};
          min-width: auto;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .view-btn.active {
          background: ${COLORS.accent};
          color: ${COLORS.primary};
        }

        .view-btn:hover {
          color: ${COLORS.accent};
        }

        .view-btn.active:hover {
          color: ${COLORS.primary};
        }

        .products-section {
          min-height: 500px;
        }

        .products-container.grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .products-container.list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .no-products {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 20px;
        }

        .no-products-icon {
          font-size: 4rem;
          opacity: 0.3;
          margin-bottom: 1.5rem;
        }

        .no-products h3 {
          color: ${COLORS.neutral};
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
        }

        .no-products p {
          color: rgba(245, 245, 245, 0.6);
          margin-bottom: 1.5rem;
        }

        .filter-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
        }

        .filter-modal.active {
          display: block;
        }

        .filter-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
        }

        .filter-modal-content {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 300px;
          background: ${COLORS.primary};
          padding: 2rem;
          overflow-y: auto;
          transform: translateX(100%);
          animation: slideIn 0.3s ease forwards;
        }

        @keyframes slideIn {
          to {
            transform: translateX(0);
          }
        }

        .filter-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .filter-modal-header h3 {
          color: ${COLORS.neutral};
          margin: 0;
        }

        .close-filter-btn {
          background: transparent;
          border: none;
          color: ${COLORS.neutral};
          cursor: pointer;
          padding: 0.5rem;
          font-size: 1.5rem;
        }

        .btn {
          position: relative;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.4s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
          min-width: 180px;
          font-family: 'Playfair Display', serif;
        }

        .btn-dark {
          background: linear-gradient(135deg, ${COLORS.secondary} 0%, #7D2C4F 100%);
          color: ${COLORS.neutral};
          border: 2px solid ${COLORS.accent};
        }

        .btn-dark:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(75, 28, 47, 0.8);
        }

        .btn-user {
          background: linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.lightAccent} 100%);
          color: ${COLORS.primary};
          border: 2px solid ${COLORS.secondary};
        }

        .btn-user:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.8);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .hero-title {
            font-size: 3.5rem;
          }
          
          .luxury-text {
            font-size: 3.8rem;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            grid-template-columns: 1fr;
          }
          
          .dashboard-sidebar {
            display: none;
          }
          
          .mobile-filter-btn-container {
            display: block;
          }
          
          .hero-title {
            font-size: 2.8rem;
          }

          .luxury-text {
            font-size: 3rem;
          }

          .hero-section {
            min-height: auto;
            padding: ${isAdminView ? '5rem 1rem 2rem' : '2rem 1rem'};
          }

          .hero-subtitle {
            font-size: 1.2rem;
            padding: 0 1rem;
          }

          .hero-search {
            flex-direction: column;
            border-radius: 25px;
          }

          .search-wrapper {
            padding: 0.8rem 1.5rem;
          }

          .search-btn {
            border-radius: 0 0 25px 25px;
            width: 100%;
          }

          .main-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .header-right {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .sort-select {
            min-width: 150px;
          }

          .quick-actions-bar {
            grid-template-columns: repeat(2, 1fr);
          }

          .user-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .admin-view-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .admin-view-actions {
            flex-direction: column;
            width: 100%;
          }

          .admin-action-btn, .admin-exit-btn {
            width: 100%;
            justify-content: center;
          }

          .list-item-content {
            flex-direction: column;
            text-align: center;
          }

          .list-item-image {
            width: 100%;
            height: 200px;
          }

          .list-item-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .quick-actions-bar {
            grid-template-columns: 1fr;
          }

          .user-stats-grid {
            grid-template-columns: 1fr;
          }

          .hero-title {
            font-size: 2.2rem;
          }

          .luxury-text {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1.1rem;
          }

          .products-container.grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default UserDashboard;