import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';

const ProductCard = ({ product, featured = false, viewMode = 'grid' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get wishlist and cart state from Redux
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { items: cartItems } = useSelector((state) => state.cart);
  
  // Check if product is in wishlist
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Check if product is in cart
  const [isInCart, setIsInCart] = useState(false);

  useEffect(() => {
    // Update wishlist status when wishlistItems changes
    const wishlisted = wishlistItems.some(item => 
      (item._id || item.id) === (product?.id || product?._id)
    );
    setIsWishlisted(wishlisted);
    
    // Update cart status when cartItems changes
    const inCart = cartItems.some(item => 
      (item.product?._id || item.product?.id) === (product?.id || product?._id)
    );
    setIsInCart(inCart);
  }, [wishlistItems, cartItems, product]);

  // Don't render if product is invalid
  if (!product) {
    return null;
  }

  // Handle both backend and frontend data formats - SAFELY
  const productId = product.id || product._id;
  const productName = product?.name || product?.title || 'Product';
  const productImage = product?.image || product?.images?.[0] || product?.imageUrl || 'https://via.placeholder.com/300x400';
  const productPrice = product?.price || 0;
  const originalPrice = product?.originalPrice || product?.price || 0;
  const productRating = product?.rating || 4.5;
  const productDescription = product?.description || 'Luxury fashion item';
  const isNew = product?.isNew !== undefined ? product.isNew : true;
  const discount = product?.discount || 
    (originalPrice > productPrice 
      ? Math.round((1 - productPrice / originalPrice) * 100) 
      : 0);
  const productBrand = product?.brand || 'Luxury Brand';

  const handleAddToCart = (e) => {
    e.stopPropagation();
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      alert('Please login to add items to cart');
      navigate('/user/login');
      return;
    }
    
    if (!productId) {
      alert('Product ID is missing');
      return;
    }
    
    if (isInCart) {
      navigate('/user/cart');
    } else {
      // Ensure product has required properties
      const productToAdd = {
        id: productId,
        _id: productId,
        name: productName,
        price: productPrice,
        image: productImage,
        brand: productBrand,
        category: product?.category || 'general'
      };
      
      dispatch(addToCart({ product: productToAdd, quantity: 1 }))
        .then(() => {
          alert('Added to cart!');
        })
        .catch((error) => {
          console.error('Error adding to cart:', error);
          alert('Failed to add to cart. Please try again.');
        });
    }
  };

  const toggleWishlist = (e) => {
    e.stopPropagation();
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      alert('Please login to add items to wishlist');
      navigate('/user/login');
      return;
    }
    
    if (!productId) {
      alert('Product ID is missing');
      return;
    }
    
    if (isWishlisted) {
      dispatch(removeFromWishlist(productId))
        .then(() => {
          setIsWishlisted(false);
          alert('Removed from wishlist!');
        })
        .catch((error) => {
          console.error('Error removing from wishlist:', error);
          alert('Failed to remove from wishlist. Please try again.');
        });
    } else {
      // Ensure product has required properties
      const productToWishlist = {
        id: productId,
        _id: productId,
        name: productName,
        price: productPrice,
        image: productImage,
        brand: productBrand,
        rating: productRating,
        category: product?.category || 'general'
      };
      
      dispatch(addToWishlist(productToWishlist))
        .then(() => {
          setIsWishlisted(true);
          alert('Added to wishlist!');
        })
        .catch((error) => {
          console.error('Error adding to wishlist:', error);
          alert('Failed to add to wishlist. Please try again.');
        });
    }
  };

  return (
    <div 
      className={`product-card ${featured ? 'featured' : ''} ${viewMode}`}
      onClick={() => navigate(`/product/${productId}`)}
    >
      <div className="product-image">
        <img 
          src={productImage} 
          alt={productName}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x400?text=No+Image';
          }}
        />
        
        <div className="product-badges">
          {isNew && <span className="badge new">NEW</span>}
          {discount > 0 && (
            <span className="badge sale">-{discount}%</span>
          )}
        </div>

        <div className="product-actions">
          <button 
            className={`action-btn wishlist-btn ${isWishlisted ? 'active' : ''}`}
            onClick={toggleWishlist}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>

        <button 
          className={`add-to-cart-btn ${isInCart ? 'in-cart' : ''}`} 
          onClick={handleAddToCart}
        >
          <span className="btn-text">{isInCart ? 'In Cart' : 'Add to Cart'}</span>
          <span className="btn-icon">🛒</span>
        </button>
      </div>

      <div className="product-info">
        <h3 className="product-name">{productName}</h3>
        
        <div className="product-meta">
          <span className="product-brand">{productBrand}</span>
          <div className="product-rating">
            {'★'.repeat(Math.floor(productRating))}
            {'☆'.repeat(5 - Math.floor(productRating))}
            <span className="rating-value">({productRating.toFixed(1)})</span>
          </div>
        </div>

        <div className="product-price">
          <span className="current-price">${productPrice.toFixed(2)}</span>
          {originalPrice > productPrice && (
            <span className="original-price">${originalPrice.toFixed(2)}</span>
          )}
        </div>
        
        {viewMode === 'list' && (
          <p className="product-description">{productDescription.substring(0, 100)}...</p>
        )}
      </div>

      <style jsx>{`
        .product-card {
          background: rgba(40, 40, 40, 0.8);
          border-radius: 15px;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid rgba(212, 175, 55, 0.2);
          position: relative;
          cursor: pointer;
          height: 100%;
        }

        .product-card:hover {
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

        .product-card:hover .product-image img {
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

        .product-card:hover .product-actions {
          opacity: 1;
          transform: translateX(0);
        }

        .action-btn {
          background: rgba(28, 28, 28, 0.8);
          border: none;
          border-radius: 50%;
          width: 35px;
          height: 35px;
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
          background: #D4AF37;
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

        .product-card:hover .add-to-cart-btn {
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

        /* List view styles */
        .product-card.list {
          display: flex;
          aspect-ratio: unset;
          min-height: 200px;
        }

        .product-card.list .product-image {
          width: 200px;
          aspect-ratio: 3/4;
          flex-shrink: 0;
        }

        .product-card.list .product-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .product-description {
          color: #E5DCC3;
          font-size: 0.9rem;
          margin-top: 0.5rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .product-card.list {
            flex-direction: column;
          }
          
          .product-card.list .product-image {
            width: 100%;
            aspect-ratio: 3/4;
          }
          
          .product-actions {
            opacity: 1;
            transform: translateX(0);
          }
          
          .add-to-cart-btn {
            opacity: 1;
            bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductCard;