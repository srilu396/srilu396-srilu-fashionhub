import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header'; // Added Header import
import { 
  Heart, Trash2, ChevronLeft, ShoppingBag, Plus, 
  Tag, Package, Truck, AlertCircle, CheckCircle,
  X, Star, Eye, Clock, ArrowRight
} from 'lucide-react';
import { 
  fetchWishlist, 
  removeFromWishlist, 
  clearWishlist 
} from '../../redux/slices/wishlistSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import LoadingSpinner from '../../components/LoadingSpinner'; 

const WishlistPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [addingItemId, setAddingItemId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [showProductModal, setShowProductModal] = useState(false);

  const wishlistState = useSelector((state) => state.wishlist || {});
  const authState = useSelector((state) => state.auth || {});
  
  const { 
    items: wishlistItems = [], 
    loading = false,
    error = null 
  } = wishlistState;
  
  const { user = null } = authState;

  useEffect(() => {
    const localStorageUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (localStorageUser) {
      dispatch(fetchWishlist());
    }
  }, [dispatch]);

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleRemoveItem = (productId, productName) => {
    dispatch(removeFromWishlist(productId));
    showNotification(`${productName} removed from wishlist`, 'info');
  };

  const handleClearWishlist = () => {
    if (window.confirm('Clear all items from your wishlist?')) {
      dispatch(clearWishlist());
      showNotification('Wishlist cleared', 'info');
    }
  };

  const handleAddToCart = async (item) => {
    setAddingItemId(item._id || item.id);
    
    try {
      // Prepare cart item data
      const cartItem = {
        product: {
          _id: item._id || item.id,
          id: item._id || item.id,
          name: item.name,
          price: item.price || 0,
          originalPrice: item.originalPrice || item.price,
          image: item.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=300&fit=crop',
          category: item.category || 'Fashion',
          brand: item.brand || 'Premium',
          description: item.description || '',
          size: item.size || 'M',
          color: item.color || 'Black'
        },
        quantity: 1
      };
      
      // Dispatch add to cart action
      dispatch(addToCart(cartItem));
      
      // Show success notification
      showNotification(`${item.name} added to cart!`, 'success');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (error) {
      console.error('Add to cart error:', error);
      showNotification('Failed to add item to cart', 'error');
    } finally {
      setAddingItemId(null);
    }
  };

  const handleQuickView = (item) => {
  setSelectedProduct(item);
  setShowProductModal(true);
};

const handleCloseModal = () => {
  setShowProductModal(false);
  setSelectedProduct(null);
};

  const localStorageUser = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUser = user || localStorageUser;

  // Added loading state check
  if (loading) {
    return (
      <div className="wishlist-page">
        <Header /> {/* Added Header here too */}
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="wishlist-page">
        <Header /> {/* Added Header */}
        <div className="auth-required-section">
          <div className="auth-content">
            <Heart size={80} className="auth-icon" />
            <h2>Your Luxury Collection Awaits</h2>
            <p>Sign in to view and manage your curated wishlist of premium fashion items</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/user/login')}
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <Header /> {/* Added Header component */}
      
      {/* Header - Updated structure to match CartPage */}
      <div className="wishlist-header">
        <button className="back-btn" onClick={() => navigate('/user/dashboard')}>
          <ChevronLeft size={20} />
          Back to Collections
        </button>
        <div className="header-content">
          <div className="header-icon">
            <Heart size={32} />
          </div>
          <div className="header-text">
            <h1 className="page-title">Your Luxury Collection</h1>
            <p className="page-subtitle">
              {wishlistItems.length} curated items • Premium fashion selections
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="wishlist-container">
        {wishlistItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Heart size={80} />
            </div>
            <h2>Your Wishlist is Empty</h2>
            <p>Save your favorite luxury fashion items here for later. Start exploring our premium collection!</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/user/dashboard')}
            >
              Explore Collections
            </button>
          </div>
        ) : (
          <div className="wishlist-content">
            {/* Wishlist Actions */}
            <div className="wishlist-actions">
              <div className="actions-left">
                <div className="stats-card">
                  <div className="stat-item">
                    <Package size={20} />
                    <div>
                      <div className="stat-value">{wishlistItems.length}</div>
                      <div className="stat-label">Items Saved</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <Tag size={20} />
                    <div>
                      <div className="stat-value">
                        ₹{wishlistItems.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString()}
                      </div>
                      <div className="stat-label">Total Value</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="actions-right">
                <button 
                  className="btn btn-secondary"
                  onClick={handleClearWishlist}
                >
                  <Trash2 size={18} />
                  Clear Collection
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => navigate('/user/dashboard')}
                >
                  Continue Shopping
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="wishlist-grid">
              {wishlistItems.map((item, index) => (
                <div 
                  key={item._id || item.id} 
                  className="wishlist-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Product Image */}
                  <div className="item-image-container">
                    <div className="image-wrapper">
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h-300&fit=crop'}
                        alt={item.name}
                        className="item-image"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=300&fit=crop';
                        }}
                      />
                      <div className="image-overlay">
                        <button 
                          className="overlay-btn quick-view-btn"
                          onClick={() => handleQuickView(item)}
                        >
                          <Eye size={18} />
                          Quick View
                        </button>
                      </div>
                    </div>
                    
                    {/* Wishlist Badge */}
                    <div className="wishlist-badge">
                      <Heart size={16} fill="currentColor" />
                      Saved
                    </div>
                    
                    {/* Discount Badge */}
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="discount-badge">
                        Save {Math.round((1 - item.price/item.originalPrice) * 100)}%
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="item-info">
                    <div className="info-header">
                      <div className="category-tag">{item.category || 'Fashion'}</div>
                      <div className="rating">
                        <Star size={14} fill="#D4AF37" />
                        <span>4.8</span>
                      </div>
                    </div>
                    
                    <h3 className="item-name">{item.name}</h3>
                    
                    <div className="item-meta">
                      {item.brand && <span className="brand">{item.brand}</span>}
                      {item.color && <span className="color">• {item.color}</span>}
                      {item.size && <span className="size">• Size: {item.size}</span>}
                    </div>
                    
                    <div className="item-description">
                      {item.description || 'Premium quality fashion item with exquisite craftsmanship.'}
                    </div>
                    
                    <div className="price-section">
                      <div className="current-price">₹{item.price?.toLocaleString() || '0'}</div>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <div className="original-price">₹{item.originalPrice.toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="item-actions">
                    <button 
                      className={`btn btn-primary ${addingItemId === (item._id || item.id) ? 'loading' : ''}`}
                      onClick={() => handleAddToCart(item)}
                      disabled={addingItemId === (item._id || item.id)}
                    >
                      {addingItemId === (item._id || item.id) ? (
                        <>
                          <div className="spinner-small"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={18} />
                          Add to Cart
                        </>
                      )}
                    </button>
                    
                    <div className="secondary-actions">
                      <button 
                        className="action-btn"
                        onClick={() => handleRemoveItem(item._id || item.id, item.name)}
                        title="Remove from wishlist"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => handleQuickView(item)}
                        title="Quick view"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Info */}
            <div className="wishlist-footer">
              <div className="info-card">
                <div className="info-item">
                  <Truck size={24} />
                  <div>
                    <h4>Free Shipping</h4>
                    <p>On orders over ₹1999 • Express delivery available</p>
                  </div>
                </div>
                <div className="info-item">
                  <Package size={24} />
                  <div>
                    <h4>Luxury Packaging</h4>
                    <p>All items include premium gift packaging</p>
                  </div>
                </div>
                <div className="info-item">
                  <Clock size={24} />
                  <div>
                    <h4>24-Hour Processing</h4>
                    <p>Ready to ship within 24 hours of order</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`notification ${notification.type}`}
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          >
            <div className="notification-icon">
              {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="notification-content">
              <p>{notification.message}</p>
            </div>
            <button className="notification-close">
              <X size={16} />
            </button>
          </div>
        ))}


              {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <div className="product-modal-overlay" onClick={handleCloseModal}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>Product Details</h2>
                <p className="modal-subtitle">Exclusive Luxury Item</p>
              </div>
              <button 
                className="modal-close-btn"
                onClick={handleCloseModal}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="product-image-section">
                <div className="main-image-container">
                  <img 
                    src={selectedProduct.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=400&fit=crop'}
                    alt={selectedProduct.name}
                    className="main-product-image"
                  />
                  <div className="image-badges">
                    {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                      <div className="discount-badge-modal">
                        SAVE {Math.round((1 - selectedProduct.price/selectedProduct.originalPrice) * 100)}%
                      </div>
                    )}
                    <div className="wishlist-badge-modal">
                      <Heart size={14} fill="currentColor" />
                      In Your Wishlist
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="product-info-section">
                <div className="info-header">
                  <div className="category-tag-modal">
                    {selectedProduct.category || 'Fashion'}
                  </div>
                  <div className="rating-modal">
                    <Star size={16} fill="#D4AF37" />
                    <Star size={16} fill="#D4AF37" />
                    <Star size={16} fill="#D4AF37" />
                    <Star size={16} fill="#D4AF37" />
                    <Star size={16} fill="rgba(212, 175, 55, 0.3)" />
                    <span className="rating-text">4.8 (128 Reviews)</span>
                  </div>
                </div>
                
                <h1 className="product-title">{selectedProduct.name}</h1>
                
                <div className="product-brand">
                  <span className="brand-label">Brand:</span>
                  <span className="brand-value">{selectedProduct.brand || 'Premium Luxury'}</span>
                </div>
                
                <div className="price-section-modal">
                  <div className="current-price-modal">
                    ₹{selectedProduct.price?.toLocaleString() || '0'}
                  </div>
                  {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                    <div className="original-price-modal">
                      <span className="strike">₹{selectedProduct.originalPrice.toLocaleString()}</span>
                      <span className="savings">
                        Save ₹{(selectedProduct.originalPrice - selectedProduct.price).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="product-details-grid">
                  <div className="detail-item">
                    <div className="detail-label">
                      <Package size={18} />
                      <span>Category</span>
                    </div>
                    <div className="detail-value">{selectedProduct.category || 'Fashion'}</div>
                  </div>
                  
                  <div className="detail-item">
                    <div className="detail-label">
                      <Tag size={18} />
                      <span>Brand</span>
                    </div>
                    <div className="detail-value">{selectedProduct.brand || 'Premium'}</div>
                  </div>
                  
                  {selectedProduct.color && (
                    <div className="detail-item">
                      <div className="detail-label">
                        <div className="color-dot" style={{ backgroundColor: selectedProduct.color.toLowerCase() }} />
                        <span>Color</span>
                      </div>
                      <div className="detail-value">{selectedProduct.color}</div>
                    </div>
                  )}
                  
                  {selectedProduct.size && (
                    <div className="detail-item">
                      <div className="detail-label">
                        <span>📏</span>
                        <span>Size</span>
                      </div>
                      <div className="detail-value">{selectedProduct.size}</div>
                    </div>
                  )}
                </div>
                
                <div className="product-description">
                  <h3 className="description-title">Description</h3>
                  <p className="description-text">
                    {selectedProduct.description || 
                      'This premium luxury item features exquisite craftsmanship and attention to detail. Made with high-quality materials and designed for sophistication.'}
                  </p>
                </div>
                
                <div className="shipping-info">
                  <div className="shipping-item">
                    <Truck size={20} />
                    <div>
                      <div className="shipping-title">Free Express Shipping</div>
                      <div className="shipping-desc">Delivered in 2-3 business days</div>
                    </div>
                  </div>
                  <div className="shipping-item">
                    <Package size={20} />
                    <div>
                      <div className="shipping-title">Luxury Gift Packaging</div>
                      <div className="shipping-desc">Premium presentation included</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="footer-actions">
                <button 
                  className="btn btn-secondary-modal"
                  onClick={handleCloseModal}
                >
                  Close Details
                </button>
                <button 
                  className={`btn btn-primary-modal ${addingItemId === (selectedProduct._id || selectedProduct.id) ? 'loading' : ''}`}
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    handleCloseModal();
                  }}
                  disabled={addingItemId === (selectedProduct._id || selectedProduct.id)}
                >
                  {addingItemId === (selectedProduct._id || selectedProduct.id) ? (
                    <>
                      <div className="spinner-small"></div>
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      Add to Cart - ₹{selectedProduct.price?.toLocaleString() || '0'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      </div>

      <style jsx>{`

              /* Product Details Modal Styles */
        .product-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 2rem;
          animation: fadeIn 0.3s ease-out;
        }

        .product-modal {
          background: linear-gradient(135deg, 
            rgba(28, 28, 28, 0.98) 0%,
            rgba(45, 45, 45, 0.98) 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 28px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(212, 175, 55, 0.2);
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
          background: linear-gradient(135deg, 
            rgba(75, 28, 47, 0.3) 0%,
            rgba(75, 28, 47, 0.1) 100%
          );
        }

        .modal-title h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem;
          color: #F5F5F5;
          margin: 0 0 0.25rem 0;
          background: linear-gradient(45deg, #F5F5F5, #D4AF37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .modal-subtitle {
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.9rem;
          margin: 0;
        }

        .modal-close-btn {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .modal-close-btn:hover {
          background: rgba(212, 175, 55, 0.2);
          transform: rotate(90deg);
        }

        .modal-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          padding: 2rem;
          overflow-y: auto;
          max-height: calc(90vh - 180px);
        }

        .product-image-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .main-image-container {
          position: relative;
          width: 100%;
          height: 400px;
          border-radius: 20px;
          overflow: hidden;
          background: linear-gradient(135deg, #1C1C1C 0%, #2A2A2A 100%);
        }

        .main-product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .main-image-container:hover .main-product-image {
          transform: scale(1.05);
        }

        .image-badges {
          position: absolute;
          top: 15px;
          left: 15px;
          right: 15px;
          display: flex;
          gap: 10px;
        }

        .discount-badge-modal {
          background: linear-gradient(45deg, #014421, #026B35);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .wishlist-badge-modal {
          background: rgba(75, 28, 47, 0.9);
          color: #F7E7CE;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .product-info-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .category-tag-modal {
          background: rgba(212, 175, 55, 0.15);
          color: #D4AF37;
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .rating-modal {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rating-text {
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.9rem;
          margin-left: 0.5rem;
        }

        .product-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem;
          color: #F5F5F5;
          margin: 0;
          line-height: 1.2;
        }

        .product-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(212, 175, 55, 0.1);
        }

        .brand-label {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.9rem;
        }

        .brand-value {
          color: #D4AF37;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .price-section-modal {
          padding: 1.5rem;
          background: rgba(75, 28, 47, 0.2);
          border-radius: 16px;
          border: 1px solid rgba(212, 175, 55, 0.1);
        }

        .current-price-modal {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #F5F5F5;
          text-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
        }

        .original-price-modal {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .strike {
          color: rgba(245, 245, 245, 0.4);
          text-decoration: line-through;
          font-size: 1.2rem;
        }

        .savings {
          background: rgba(1, 68, 33, 0.3);
          color: #4CAF50;
          padding: 0.3rem 0.8rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        .product-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .detail-item {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(212, 175, 55, 0.05);
        }

        .detail-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .detail-label svg {
          color: #D4AF37;
        }

        .color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .detail-value {
          color: #F5F5F5;
          font-weight: 600;
          font-size: 1rem;
        }

        .product-description {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          border: 1px solid rgba(212, 175, 55, 0.1);
        }

        .description-title {
          color: #F5F5F5;
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem;
          margin: 0 0 1rem 0;
        }

        .description-text {
          color: rgba(245, 245, 245, 0.7);
          line-height: 1.6;
          margin: 0;
        }

        .shipping-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .shipping-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(212, 175, 55, 0.1);
        }

        .shipping-item svg {
          color: #D4AF37;
          flex-shrink: 0;
        }

        .shipping-title {
          color: #F5F5F5;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .shipping-desc {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.85rem;
        }

        .modal-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid rgba(212, 175, 55, 0.2);
          background: rgba(28, 28, 28, 0.9);
        }

        .footer-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-secondary-modal {
          flex: 1;
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary-modal:hover {
          background: rgba(212, 175, 55, 0.1);
          transform: translateY(-2px);
        }

        .btn-primary-modal {
          flex: 2;
          background: linear-gradient(45deg, #4B1C2F 0%, #014421 100%);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #F7E7CE;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-primary-modal:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4);
        }

        .btn-primary-modal.loading {
          opacity: 0.8;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .modal-content {
            grid-template-columns: 1fr;
            max-height: calc(90vh - 150px);
          }
          
          .main-image-container {
            height: 300px;
          }
          
          .product-details-grid {
            grid-template-columns: 1fr;
          }
          
          .footer-actions {
            flex-direction: column;
          }
          
          .product-title {
            font-size: 1.8rem;
          }
          
          .current-price-modal {
            font-size: 2rem;
          }
        }

        @media (max-width: 480px) {
          .product-modal {
            border-radius: 20px;
          }
          
          .modal-header,
          .modal-content,
          .modal-footer {
            padding: 1.5rem;
          }
          
          .main-image-container {
            height: 250px;
          }
        }
        /* Base Styles */
        .wishlist-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #F5F5F5;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .wishlist-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 2rem;
        }

        /* Header */
        .wishlist-header {
          margin-bottom: 3rem;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.2);
          color: #D4AF37;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 1.5rem;
        }

        .back-btn:hover {
          background: rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.4);
          transform: translateX(-5px);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .header-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #D4AF37 0%, #F7E7CE 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1C1C1C;
        }

        .header-text {
          flex: 1;
        }

        .page-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(45deg, #F5F5F5, #D4AF37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
        }

        .page-subtitle {
          color: rgba(245, 245, 245, 0.7);
          font-size: 1rem;
          font-weight: 400;
          margin: 0;
        }

        /* Auth Required */
        .auth-required-section {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          padding: 2rem;
        }

        .auth-content {
          text-align: center;
          background: rgba(28, 28, 28, 0.7);
          border-radius: 24px;
          padding: 4rem;
          border: 1px solid rgba(212, 175, 55, 0.2);
          max-width: 500px;
          width: 100%;
          backdrop-filter: blur(10px);
        }

        .auth-icon {
          color: #D4AF37;
          margin-bottom: 1.5rem;
        }

        .auth-content h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          color: #F5F5F5;
          margin-bottom: 1rem;
        }

        .auth-content p {
          color: rgba(245, 245, 245, 0.7);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        /* Loading State */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 1.5rem;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(212, 175, 55, 0.2);
          border-top: 3px solid #D4AF37;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 6rem 2rem;
          background: rgba(28, 28, 28, 0.6);
          border-radius: 24px;
          border: 2px dashed rgba(212, 175, 55, 0.2);
          backdrop-filter: blur(10px);
        }

        .empty-icon {
          width: 120px;
          height: 120px;
          margin: 0 auto 2rem;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(75, 28, 47, 0.1));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D4AF37;
        }

        .empty-state h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          color: #F5F5F5;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: rgba(245, 245, 245, 0.7);
          margin-bottom: 2.5rem;
          font-size: 1.1rem;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Wishlist Actions */
        .wishlist-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
          padding: 1.5rem;
          background: rgba(28, 28, 28, 0.7);
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.1);
          backdrop-filter: blur(10px);
        }

        .stats-card {
          display: flex;
          gap: 2rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(212, 175, 55, 0.05);
        }

        .stat-item svg {
          color: #D4AF37;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #F5F5F5;
          line-height: 1;
        }

        .stat-label {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .actions-right {
          display: flex;
          gap: 1rem;
        }

        /* Buttons */
        .btn {
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: linear-gradient(45deg, #4B1C2F 0%, #014421 100%);
          color: #F7E7CE;
          font-weight: 700;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4);
        }

        .btn-primary.loading {
          opacity: 0.8;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(75, 28, 47, 0.3);
          border: 1px solid rgba(75, 28, 47, 0.4);
          color: #F5F5F5;
        }

        .btn-secondary:hover {
          background: rgba(75, 28, 47, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(75, 28, 47, 0.3);
        }

        .btn-outline {
          background: transparent;
          color: #D4AF37;
          border: 1px solid #D4AF37;
        }

        .btn-outline:hover {
          background: rgba(212, 175, 55, 0.1);
          transform: translateY(-2px);
        }

        /* Wishlist Grid */
        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        /* Wishlist Item */
        .wishlist-item {
          background: rgba(28, 28, 28, 0.7);
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.1);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideUp 0.4s ease-out forwards;
          opacity: 0;
          transform: translateY(20px);
          backdrop-filter: blur(10px);
        }

        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .wishlist-item:hover {
          border-color: rgba(212, 175, 55, 0.2);
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        /* Image Container */
        .item-image-container {
          position: relative;
          height: 250px;
          overflow: hidden;
          background: linear-gradient(135deg, #1C1C1C 0%, #2A2A2A 100%);
        }

        .image-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .wishlist-item:hover .item-image {
          transform: scale(1.05);
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, transparent 60%, rgba(0, 0, 0, 0.8) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 1.5rem;
        }

        .wishlist-item:hover .image-overlay {
          opacity: 1;
        }

        .overlay-btn {
          background: rgba(28, 28, 28, 0.9);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .overlay-btn:hover {
          background: rgba(212, 175, 55, 0.2);
          transform: translateY(-2px);
        }

        /* Badges */
        .wishlist-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          background: rgba(75, 28, 47, 0.9);
          color: #F7E7CE;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          backdrop-filter: blur(5px);
        }

        .discount-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          background: linear-gradient(45deg, #014421, #026B35);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          backdrop-filter: blur(5px);
        }

        /* Item Info */
        .item-info {
          padding: 1.5rem;
        }

        .info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .category-tag {
          background: rgba(212, 175, 55, 0.1);
          color: #D4AF37;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #D4AF37;
          font-weight: 600;
        }

        .item-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          color: #F5F5F5;
          margin: 0 0 0.75rem 0;
          line-height: 1.3;
        }

        .item-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .brand {
          color: #D4AF37;
          font-weight: 500;
        }

        .item-description {
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .price-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .current-price {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: #F5F5F5;
          text-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
        }

        .original-price {
          color: rgba(245, 245, 245, 0.4);
          text-decoration: line-through;
          font-size: 1.1rem;
        }

        /* Action Buttons */
        .item-actions {
          padding: 0 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .secondary-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          flex: 1;
          padding: 0.75rem;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.1);
          color: rgba(245, 245, 245, 0.6);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.3);
          color: #D4AF37;
        }

        /* Footer Info */
        .wishlist-footer {
          margin-top: 2rem;
        }

        .info-card {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          background: rgba(28, 28, 28, 0.7);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(212, 175, 55, 0.1);
          backdrop-filter: blur(10px);
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
        }

        .info-item svg {
          color: #D4AF37;
          flex-shrink: 0;
        }

        .info-item h4 {
          color: #F5F5F5;
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
        }

        .info-item p {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.9rem;
          margin: 0;
          line-height: 1.4;
        }

        /* Notifications */
        .notifications-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .notification {
          background: rgba(28, 28, 28, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 12px;
          padding: 1rem 1.5rem;
          min-width: 300px;
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          animation: slideInRight 0.3s ease-out;
          border-left: 4px solid;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(212, 175, 55, 0.1);
        }

        .notification.success {
          border-left-color: #4CAF50;
        }

        .notification.error {
          border-left-color: #ff6b6b;
        }

        .notification.info {
          border-left-color: #2196F3;
        }

        .notification-icon {
          flex-shrink: 0;
        }

        .notification.success .notification-icon {
          color: #4CAF50;
        }

        .notification.error .notification-icon {
          color: #ff6b6b;
        }

        .notification.info .notification-icon {
          color: #2196F3;
        }

        .notification-content {
          flex: 1;
        }

        .notification-content p {
          margin: 0;
          color: #F5F5F5;
          font-size: 0.95rem;
        }

        .notification-close {
          background: transparent;
          border: none;
          color: rgba(245, 245, 245, 0.6);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-close:hover {
          color: #F5F5F5;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(28, 28, 28, 0.2);
          border-top: 2px solid #1C1C1C;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .wishlist-container {
            padding: 1.5rem;
          }
        }

        @media (max-width: 1024px) {
          .wishlist-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .wishlist-container {
            padding: 1rem;
          }
          
          .page-title {
            font-size: 2rem;
          }
          
          .wishlist-actions {
            flex-direction: column;
            gap: 1.5rem;
            align-items: stretch;
          }
          
          .stats-card {
            justify-content: space-between;
          }
          
          .actions-right {
            flex-direction: column;
          }
          
          .wishlist-grid {
            grid-template-columns: 1fr;
          }
          
          .info-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 576px) {
          .stats-card {
            flex-direction: column;
            gap: 1rem;
          }
          
          .item-image-container {
            height: 200px;
          }
          
          .notifications-container {
            left: 20px;
            right: 20px;
          }
          
          .notification {
            min-width: auto;
            width: 100%;
          }
          
          .header-content {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default WishlistPage;