import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, ShoppingCart, ArrowLeft, Check, Heart, Loader2 } from 'lucide-react';
import Header from '../../components/Header';
import { addToCart } from '../../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../redux/slices/wishlistSlice';
import { productsData } from '../../data/products';
import { useToast } from '../../components/common/Toast/useToast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { items: wishlistItems } = useSelector((state) => state.wishlist || { items: [] });

  const fromPath = location.state?.from || null;
  const backLabel = fromPath === '/' ? 'Back to Home' : 'Back to Shop';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        
        if (id && id.length >= 24) {
          const res = await fetch(`${API_BASE}/api/products/${id}`);
          const data = await res.json();
          if (data.success && data.product) {
            setProduct(data.product);
            return;
          } else if (data._id || data.name) {
            setProduct(data);
            return;
          }
        }
        
        const localProd = productsData.find(p => p.id === id || p._id === id || p.id === String(id));
        setProduct(localProd || productsData[0]);
      } catch (error) {
        console.error('Error fetching product detail:', error);
        const localProd = productsData.find(p => p.id === id || p._id === id || p.id === String(id));
        setProduct(localProd || productsData[0]);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
        <Header />
        <div className="wishlist-loading-container">
          <Loader2 className="animate-spin text-peach" size={36} />
          <p>Revealing couture design...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
        <Header />
        <div className="text-center py-20">
          <h2>Outfit not found</h2>
          <button className="btn-primary mt-4" onClick={() => navigate('/')}>Return to Collection</button>
        </div>
      </div>
    );
  }

  const pId = product._id || product.id;
  const isWishlisted = Array.isArray(wishlistItems) && wishlistItems.some(item => (item._id || item.id) === pId);

  const imagesList = product.images && product.images.length > 0 
    ? product.images 
    : [product.image || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80'];
  const mainImageToShow = imagesList[selectedImageIndex] || imagesList[0];

  const handleAddToCart = () => {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      toast.warning('Please log in to add items to cart', 'Authentication Required');
      navigate('/login');
      return;
    }

    const cartProduct = {
      id: pId,
      _id: pId,
      name: product.name,
      price: product.price,
      image: mainImageToShow,
      category: product.category,
      stock: product.stock || 10,
      rating: product.rating || 4.8
    };

    dispatch(addToCart({ product: cartProduct, quantity }));
    toast.success(`"${product.name}" added to cart!`, 'Cart Updated');
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleWishlist = () => {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      toast.warning('Please log in to manage your wishlist', 'Authentication Required');
      navigate('/login');
      return;
    }

    if (isWishlisted) {
      dispatch(removeFromWishlist(pId));
      toast.info(`"${product.name}" removed from wishlist`);
    } else {
      const wishlistProduct = {
        _id: pId,
        id: pId,
        name: product.name,
        price: product.price,
        image: mainImageToShow,
        category: product.category,
        rating: product.rating || 4.8
      };
      dispatch(addToWishlist(wishlistProduct));
    }
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Header />

      <div className="wishlist-page-container" style={{ paddingTop: '2rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="back-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-mid)', fontWeight: '600', marginBottom: '2rem' }}
        >
          <ArrowLeft size={18} /> {backLabel}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', alignItems: 'start' }}>
          {/* Left Side - Image Gallery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', background: 'var(--white)', position: 'relative' }}>
              <img
                src={mainImageToShow}
                alt={product.name}
                style={{ width: '100%', height: '520px', objectFit: 'cover', display: 'block' }}
              />
              <button
                onClick={handleWishlist}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-soft)' }}
              >
                <Heart size={22} className={isWishlisted ? 'fill-pink text-pink' : ''} />
              </button>
            </div>

            {imagesList.length > 1 && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: 'var(--r-md)',
                      overflow: 'hidden',
                      border: selectedImageIndex === idx ? '2px solid var(--peach)' : '2px solid transparent',
                      cursor: 'pointer',
                      background: 'var(--peach-pale)'
                    }}
                  >
                    <img src={img} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Product Info */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="section-eyebrow" style={{ alignSelf: 'flex-start' }}>
              {product.category || "Women's Fashion"}
            </span>

            <h1 style={{ fontFamily: 'Playfair Display', fontSize: '2.6rem', fontWeight: '800', color: 'var(--dark)', margin: '0.8rem 0 1rem', lineHeight: '1.1' }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '3px', background: 'var(--peach-pale)', padding: '6px 12px', borderRadius: 'var(--r-pill)' }}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.floor(product.rating || 4.5) ? 'star-filled' : 'star-empty'}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-mid)', fontWeight: '600' }}>
                ({product.rating || 4.8} Customer Rating)
              </span>
            </div>

            <div style={{ fontFamily: 'Playfair Display', fontSize: '2.4rem', fontWeight: '800', color: 'var(--dark)', marginBottom: '1.5rem' }}>
              ₹{Number(product.price || 0).toLocaleString('en-IN')}
            </div>

            <p style={{ color: 'var(--text-mid)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
              {product.description || 'Elevate your wardrobe with this signature garment crafted from luxury fabrics with impeccable attention to detail.'}
            </p>

            {/* Quantity and Add to Cart */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--peach-pale)', borderRadius: 'var(--r-pill)', padding: '4px' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ width: '40px', height: '40px', border: 'none', background: 'none', fontSize: '1.2rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  -
                </button>
                <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: '800', fontSize: '1.1rem' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                  style={{ width: '40px', height: '40px', border: 'none', background: 'none', fontSize: '1.2rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="btn-primary"
                style={{ flex: 1, padding: '1rem 2rem', fontSize: '1rem', justifyContent: 'center' }}
              >
                {addedToCart ? (
                  <>
                    <Check size={18} /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} /> Add to Cart
                  </>
                )}
              </button>
            </div>

            <div style={{ borderTop: '1px solid rgba(232,149,109,0.2)', paddingTop: '1.5rem', display: 'flex', gap: '2rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ✓ Authentic Guaranteed
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ✓ Express Global Delivery
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
