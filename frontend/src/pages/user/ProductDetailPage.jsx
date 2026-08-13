import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, ShoppingCart, ArrowLeft, Check, Heart, Loader2 } from 'lucide-react';
import CustomerShoppingHeader from '../../components/CustomerShoppingHeader';
import ProductReviews from '../../components/user/ProductReviews';
import RelatedProducts from '../../components/user/RelatedProducts';
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
    // Smooth scroll to top when product ID changes
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
      <div style={{ background: '#FAF7F2', minHeight: '100vh' }}>
        <CustomerShoppingHeader />
        <div className="wishlist-loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
          <Loader2 className="animate-spin text-peach" size={36} />
          <p style={{ color: '#7A6961', fontWeight: '500' }}>Revealing couture design...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ background: '#FAF7F2', minHeight: '100vh' }}>
        <CustomerShoppingHeader />
        <div className="text-center py-20" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '2rem' }}>Outfit not found</h2>
          <button className="btn-primary mt-4" style={{ marginTop: '16px' }} onClick={() => navigate('/shop')}>Return to Collection</button>
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

  const deptSlug = product.departmentSlug || (product.department ? product.department.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '');

  return (
    <div style={{ background: '#FAF7F2', minHeight: '100vh', paddingBottom: '60px' }}>
      <CustomerShoppingHeader />

      <main className="product-detail-main" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="back-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#7A6961', fontWeight: '600', marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={18} /> {backLabel}
        </button>

        {/* Product Details Hero Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'start' }}>
          {/* Left Side - Image Gallery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', background: '#FFFFFF', position: 'relative', border: '1px solid #EAE3D9' }}>
              <img
                src={mainImageToShow}
                alt={product.name}
                style={{ width: '100%', height: '520px', objectFit: 'cover', display: 'block' }}
              />
              <button
                onClick={handleWishlist}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                <Heart size={22} className={isWishlisted ? 'fill-pink text-pink' : ''} style={{ color: isWishlisted ? '#DA7756' : '#1F1A1C', fill: isWishlisted ? '#DA7756' : 'none' }} />
              </button>
            </div>

            {imagesList.length > 1 && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      width: '85px',
                      height: '85px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: selectedImageIndex === idx ? '2px solid #DA7756' : '1px solid #EAE3D9',
                      cursor: 'pointer',
                      background: '#FFFFFF',
                      padding: 0
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
            <span className="section-eyebrow" style={{ alignSelf: 'flex-start', background: '#FDF9F3', color: '#DA7756', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '16px', letterSpacing: '1px', border: '1px solid rgba(218,119,86,0.2)' }}>
              {product.category || product.department || "Women's Fashion"}
            </span>

            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.4rem', fontWeight: '800', color: '#1F1A1C', margin: '0.8rem 0 1rem', lineHeight: '1.2' }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '3px', background: '#FDF9F3', padding: '6px 12px', borderRadius: '20px', border: '1px solid #EAE3D9' }}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    style={{ color: i < Math.floor(product.rating || 4.5) ? '#D4AF37' : '#DDD6CE', fill: i < Math.floor(product.rating || 4.5) ? '#D4AF37' : 'none' }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.88rem', color: '#7A6961', fontWeight: '600' }}>
                ({product.rating || 4.8} Customer Rating)
              </span>
            </div>

            {/* Price & Discount */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '1.5rem' }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.4rem', fontWeight: '800', color: '#1F1A1C' }}>
                ₹{Number(product.price || 0).toLocaleString('en-IN')}
              </span>
              {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                <>
                  <span style={{ fontSize: '1.4rem', color: '#8C827A', textDecoration: 'line-through' }}>
                    ₹{Number(product.originalPrice).toLocaleString('en-IN')}
                  </span>
                  <span style={{ background: '#DA7756', color: '#FFF', fontSize: '12px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px' }}>
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p style={{ color: '#4A423D', fontSize: '1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
              {product.description || 'Elevate your wardrobe with this signature garment crafted from luxury fabrics with impeccable attention to detail.'}
            </p>

            {/* Quantity and Add to Cart */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', borderRadius: '30px', padding: '4px', border: '1px solid #EAE3D9' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ width: '40px', height: '40px', border: 'none', background: 'none', fontSize: '1.2rem', fontWeight: '800', cursor: 'pointer', color: '#1F1A1C' }}
                >
                  -
                </button>
                <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: '800', fontSize: '1.1rem', color: '#1F1A1C' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                  style={{ width: '40px', height: '40px', border: 'none', background: 'none', fontSize: '1.2rem', fontWeight: '800', cursor: 'pointer', color: '#1F1A1C' }}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                style={{ flex: 1, padding: '1rem 2rem', fontSize: '1rem', borderRadius: '30px', background: '#DA7756', color: '#FFFFFF', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(218,119,86,0.25)', transition: 'background 0.2s ease' }}
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

            <div style={{ borderTop: '1px solid #EAE3D9', paddingTop: '1.5rem', display: 'flex', gap: '2rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#7A6961', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500' }}>
                ✓ Authentic Guaranteed
              </span>
              <span style={{ fontSize: '0.85rem', color: '#7A6961', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500' }}>
                ✓ Express Global Delivery
              </span>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <ProductReviews 
          productId={pId}
          reviews={product.reviews || product.comments || []} 
          rating={product.rating || 4.5} 
          onReviewAdded={(updatedProd) => setProduct(updatedProd)}
        />

        {/* Related Products / You May Also Like */}
        <RelatedProducts productId={pId} currentProduct={product} />
      </main>
    </div>
  );
};

export default ProductDetailPage;
