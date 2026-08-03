import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { addToCart } from '../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';
import { useToast } from './common/Toast/useToast';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const { items: wishlistItems } = useSelector((state) => state.wishlist || { items: [] });
  
  if (!product) return null;

  const id = product._id || product.id;
  const mainImage = (product.images && product.images.length > 0) 
    ? product.images[0] 
    : (product.image || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80');

  const isWishlisted = Array.isArray(wishlistItems) && wishlistItems.some(item => (item._id || item.id) === id);

  const price = Number(product.price || 0);
  const originalPrice = (price * 1.25).toFixed(0);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      toast.warning('Please log in to add items to cart', 'Authentication Required');
      navigate('/login');
      return;
    }

    const cartProduct = {
      id: id,
      _id: id,
      name: product.name,
      price: price,
      image: mainImage,
      category: product.category || "Women's",
      stock: product.stock || 10,
      rating: product.rating || 4.8
    };

    dispatch(addToCart({ product: cartProduct, quantity: 1 }))
      .then(() => toast.success(`"${product.name}" added to cart!`, 'Cart Updated'))
      .catch((err) => console.error('Cart add error:', err));
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      toast.warning('Please log in to manage your wishlist', 'Authentication Required');
      navigate('/login');
      return;
    }

    if (isWishlisted) {
      dispatch(removeFromWishlist(id));
      toast.info(`"${product.name}" removed from wishlist`);
    } else {
      const wishlistProduct = {
        _id: id,
        id: id,
        name: product.name,
        price: price,
        image: mainImage,
        category: product.category || "Women's",
        rating: product.rating || 4.8
      };
      dispatch(addToWishlist(wishlistProduct));
      toast.success(`"${product.name}" added to wishlist!`, 'Wishlist Saved');
    }
  };

  return (
    <div className="product-card">
      <Link to={`/product/${id}`} state={{ from: location.pathname }}>
        <div className="product-card-img-wrap">
          <img
            src={mainImage}
            alt={product.name || 'Product'}
            className="product-card-img"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80';
            }}
          />
          <span className="product-card-badge">-20%</span>
          <button
            className={`product-card-wishlist ${isWishlisted ? 'active' : ''}`}
            onClick={handleWishlist}
            aria-label="Toggle wishlist"
          >
            <Heart size={15} className={isWishlisted ? 'fill-pink text-pink' : ''} />
          </button>
        </div>
      </Link>

      <div className="product-card-body">
        <Link to={`/product/${id}`} className="product-card-name">
          {product.name}
        </Link>

        <div className="product-card-stars">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < Math.floor(product.rating || 4.5) ? 'star-filled' : 'star-empty'}
            />
          ))}
          <span className="product-card-rating-text">({product.rating || 4.8})</span>
        </div>

        <div className="product-card-footer">
          <div>
            <span className="product-card-price">₹{price.toLocaleString('en-IN')}</span>
            <span className="product-card-price-old">₹{Number(originalPrice).toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={handleAddToCart}
            className="product-card-add"
            aria-label="Add to cart"
            title="Add to Cart"
          >
            <ShoppingCart size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;