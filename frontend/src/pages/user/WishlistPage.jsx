import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomerShoppingHeader from '../../components/CustomerShoppingHeader';
import { 
  Heart, ChevronRight, ChevronLeft, ShoppingBag, 
  AlertTriangle, RefreshCw, Sparkles, Home
} from 'lucide-react';
import { 
  fetchWishlist, 
  removeFromWishlist 
} from '../../redux/slices/wishlistSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import { useToast } from '../../components/common/Toast/useToast';

const PAGE_SIZE = 6; // 3 rows × 3 cols

export default function WishlistPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [addingItemId, setAddingItemId] = useState(null);

  const wishlistState = useSelector((state) => state.wishlist || {});
  const { items: wishlistItems = [], loading = false, error = null } = wishlistState;

  // Sync current page with URL search params
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      dispatch(fetchWishlist());
    } else {
      navigate('/login');
    }
  }, [dispatch, navigate]);

  // Handle Remove Item
  const handleRemoveItem = async (e, productId, productName) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
      toast.info(`"${productName || 'Item'}" removed from wishlist`);
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast.error('Failed to remove item from wishlist');
    }
  };

  // Handle Add to Cart
  const handleAddToCart = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    const itemId = item._id || item.id;
    setAddingItemId(itemId);

    try {
      const mainImage = item.image || item.imageUrl || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80';
      const price = Number(item.price || 0);

      const cartProduct = {
        id: itemId,
        _id: itemId,
        name: item.name,
        price: price,
        originalPrice: item.originalPrice || price,
        image: mainImage,
        category: item.category || 'Fashion',
        brand: item.brand || 'Luxury',
        stock: item.stock !== undefined ? item.stock : 10,
      };

      await dispatch(addToCart({ product: cartProduct, quantity: 1 })).unwrap();
      toast.success(`"${item.name}" added to cart!`, 'Cart Updated');
    } catch (err) {
      console.error('Add to cart error:', err);
      toast.error('Failed to add item to cart');
    } finally {
      setAddingItemId(null);
    }
  };

  // Navigate to Product Details
  const handleViewProduct = (itemId) => {
    if (itemId) {
      navigate(`/product/${itemId}`);
    }
  };

  // Pagination calculation
  const totalItems = wishlistItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Reset page if current page exceeds total pages (e.g. after item deletion)
  useEffect(() => {
    if (totalItems > 0 && currentPage > totalPages) {
      const newPage = Math.max(1, totalPages);
      const newParams = new URLSearchParams(searchParams);
      if (newPage === 1) {
        newParams.delete('page');
      } else {
        newParams.set('page', newPage.toString());
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [totalItems, totalPages, currentPage, searchParams, setSearchParams]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return wishlistItems.slice(start, start + PAGE_SIZE);
  }, [wishlistItems, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    const newParams = new URLSearchParams(searchParams);
    if (newPage === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', newPage.toString());
    }
    setSearchParams(newParams);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  // Helper function to build compact pagination range with ellipsis
  const getPaginationRange = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div style={S.page}>
      <CustomerShoppingHeader />

      <div style={S.contentArea}>
        {/* Breadcrumb with colored icons */}
        <nav style={S.breadcrumb} aria-label="Breadcrumb">
          <span style={S.breadHomeLink} onClick={() => navigate('/user/dashboard')}>
            <span style={S.breadIconCircle}>
              <Home size={11} color="#FFF" />
            </span>
            Home
          </span>
          <ChevronRight size={13} color="#B0A8A0" />
          <span style={S.breadActiveLink}>
            <span style={{...S.breadIconCircle, background: '#E8967F'}}>
              <Heart size={11} color="#FFF" />
            </span>
            Wishlist
          </span>
        </nav>

        {/* Page Header */}
        <div style={S.headerBlock}>
          <h1 style={S.pageTitle}>
            Wishlist {totalItems > 0 && <span style={S.itemCount}>({totalItems})</span>}
          </h1>
          <p style={S.pageSubtitle}>Save your favorite pieces and keep them close.</p>
        </div>

        {/* Main Content — full width, no sidebar */}
        {/* Skeleton Loading State */}
        {loading && wishlistItems.length === 0 ? (
          <div className="wishlist-grid" style={S.gridContainer}>
            {Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} style={S.skeletonCard}>
                <div style={S.skeletonImage} />
                <div style={S.skeletonTextShort} />
                <div style={S.skeletonTextTitle} />
                <div style={S.skeletonTextPrice} />
                <div style={S.skeletonButton} />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div style={S.errorCard}>
            <div style={S.errorIconCircle}>
              <AlertTriangle size={36} color="#C0392B" />
            </div>
            <h2 style={S.errorTitle}>Unable to load your wishlist</h2>
            <p style={S.errorDesc}>We encountered an issue fetching your wishlist. Please try again.</p>
            <button 
              style={S.tryAgainBtn} 
              onClick={() => dispatch(fetchWishlist())}
            >
              <RefreshCw size={15} style={{ marginRight: 6 }} />
              Try Again
            </button>
          </div>
        ) : wishlistItems.length === 0 ? (
          /* Empty State */
          <div style={S.emptyCard}>
            <div style={S.emptyHeartCircle}>
              <Heart size={40} color="#DE7356" fill="#FDEEE9" />
            </div>
            <h2 style={S.emptyTitle}>Your wishlist is empty</h2>
            <p style={S.emptyDesc}>Save the pieces you love and they'll appear here.</p>
            <button 
              style={S.exploreBtn} 
              onClick={() => navigate('/shop')}
            >
              <Sparkles size={16} style={{ marginRight: 8 }} />
              Explore Collection
            </button>
          </div>
        ) : (
          /* Wishlist Product Grid & Pagination */
          <div style={S.wishlistContentWrapper}>
            <div className="wishlist-grid" style={S.gridContainer}>
              {currentItems.map((item) => {
                const itemId = item._id || item.id;
                const isAdding = addingItemId === itemId;
                const price = Number(item.price || 0);
                const originalPrice = item.originalPrice && Number(item.originalPrice) > price ? Number(item.originalPrice) : null;
                const discountPct = item.discount > 0 
                  ? Math.round(item.discount) 
                  : (originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
                const mainImage = (item.images && item.images.length > 0 && item.images[0])
                  ? item.images[0]
                  : (item.image || item.imageUrl || 'https://via.placeholder.com/400x500?text=Product+Image');

                return (
                  <div 
                    key={itemId} 
                    className="wishlist-product-card"
                    style={S.productCard}
                  >
                    {/* Image Box */}
                    <div 
                      style={S.imageWrapper}
                      onClick={() => handleViewProduct(itemId)}
                    >
                      <img 
                        src={mainImage}
                        alt={item.name || 'Product'}
                        style={S.productImg}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80';
                        }}
                      />

                      {/* Discount Badge */}
                      {discountPct > 0 && (
                        <span style={S.discountBadge}>-{discountPct}%</span>
                      )}

                      {/* Top-Right Heart Icon */}
                      <button 
                        style={S.heartBadge} 
                        onClick={(e) => handleRemoveItem(e, itemId, item.name)}
                        title="Remove from Wishlist"
                        aria-label="Remove from Wishlist"
                      >
                        <Heart size={14} fill="#DE7356" color="#DE7356" />
                      </button>
                    </div>

                    {/* Card Info Section */}
                    <div style={S.cardInfo}>
                      {(item.category || item.brand) && (
                        <span style={S.categoryMeta}>
                          {item.category || item.brand}
                        </span>
                      )}

                      <h3 
                        style={S.productTitle} 
                        title={item.name}
                        onClick={() => handleViewProduct(itemId)}
                      >
                        {item.name}
                      </h3>

                      <div style={S.priceRow}>
                        <span style={S.currentPrice}>₹{price.toLocaleString('en-IN')}</span>
                        {originalPrice && (
                          <span style={S.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>

                      <div style={S.actionBox}>
                        <button
                          style={S.addToCartBtn(isAdding)}
                          onClick={(e) => handleAddToCart(e, item)}
                          disabled={isAdding}
                        >
                          {isAdding ? (
                            'Adding...'
                          ) : (
                            <>
                              <span>Add to Cart</span>
                              <ShoppingBag size={13} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={S.paginationContainer}>
                {/* Previous Arrow */}
                <button
                  style={S.pageArrowBtn(currentPage === 1)}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Page Numbers */}
                <div style={S.pageNumbersGroup}>
                  {getPaginationRange().map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} style={S.ellipsisSpan}>
                          …
                        </span>
                      );
                    }

                    const isPageActive = page === currentPage;
                    return (
                      <button
                        key={`page-${page}`}
                        style={S.pageNumberBtn(isPageActive)}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                {/* Next Arrow */}
                <button
                  style={S.pageArrowBtn(currentPage === totalPages)}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Page Info */}
                <span style={S.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .wishlist-product-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .wishlist-product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06) !important;
        }
        .wishlist-product-card:hover img {
          transform: scale(1.04);
        }
        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @media (max-width: 990px) {
          .wishlist-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 580px) {
          .wishlist-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

/* ─── Styles matching SRILU FashionHub visual identity ─── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#FAF4F0',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  contentArea: {
    maxWidth: 1140,
    width: '100%',
    margin: '0 auto',
    padding: '24px 24px 60px',
    boxSizing: 'border-box',
  },
  /* Breadcrumb */
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
    fontSize: 13,
  },
  breadIconCircle: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: '#DE7356',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(222,115,86,0.25)',
  },
  breadHomeLink: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#2C221E',
    cursor: 'pointer',
    fontWeight: 500,
  },
  breadActiveLink: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#7A6F68',
    fontWeight: 500,
  },
  headerBlock: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#2C221E',
    margin: '0 0 6px',
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  itemCount: {
    fontSize: 18,
    fontWeight: 400,
    color: '#7A6F68',
    fontFamily: 'Inter, system-ui, sans-serif',
    marginLeft: 6,
  },
  pageSubtitle: {
    fontSize: 13.5,
    color: '#7A6F68',
    margin: 0,
  },
  wishlistContentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 18,
  },
  productCard: {
    background: '#FFFFFF',
    borderRadius: 14,
    border: '1px solid #EFE7DF',
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative',
    boxSizing: 'border-box',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3.5',
    borderRadius: 10,
    overflow: 'hidden',
    background: '#FAF4F0',
    cursor: 'pointer',
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.3s ease',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    background: '#DE7356',
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: 700,
    padding: '3px 7px',
    borderRadius: 6,
    zIndex: 2,
  },
  heartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 2,
    transition: 'transform 0.15s ease',
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 8,
    flex: 1,
  },
  categoryMeta: {
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#7A6F68',
    fontWeight: 600,
    marginBottom: 3,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#2C221E',
    margin: '0 0 5px',
    fontFamily: 'Inter, system-ui, sans-serif',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.35',
    cursor: 'pointer',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 7,
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 15,
    fontWeight: 700,
    color: '#2C221E',
  },
  originalPrice: {
    fontSize: 12,
    color: '#7A6F68',
    textDecoration: 'line-through',
  },
  actionBox: {
    marginTop: 'auto',
  },
  addToCartBtn: (disabled) => ({
    width: '100%',
    height: 36,
    background: disabled ? '#E89882' : '#DE7356',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'background 0.2s ease, transform 0.1s ease',
  }),
  /* Pagination */
  paginationContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    paddingTop: 22,
    borderTop: '1px solid #EFE7DF',
    flexWrap: 'wrap',
  },
  pageNumbersGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  pageArrowBtn: (disabled) => ({
    width: 38,
    height: 38,
    borderRadius: 10,
    border: '1px solid #EFE7DF',
    background: disabled ? '#F8F3EF' : '#FFFFFF',
    color: disabled ? '#B0A8A0' : '#2C221E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.6 : 1,
  }),
  pageNumberBtn: (active) => ({
    minWidth: 38,
    height: 38,
    padding: '0 10px',
    borderRadius: 10,
    border: active ? '1.5px solid #DE7356' : '1px solid #EFE7DF',
    background: active ? '#DE7356' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#2C221E',
    fontSize: 13.5,
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    fontFamily: 'Inter, system-ui, sans-serif',
    boxShadow: active ? '0 3px 10px rgba(222,115,86,0.25)' : 'none',
  }),
  ellipsisSpan: {
    padding: '0 4px',
    color: '#7A6F68',
    fontSize: 14,
    fontWeight: 600,
  },
  pageInfo: {
    marginLeft: 8,
    fontSize: 12.5,
    color: '#7A6F68',
    fontWeight: 500,
  },
  /* Empty state */
  emptyCard: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #EFE7DF',
    padding: '60px 24px',
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
  },
  emptyHeartCircle: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: '#FDEEE9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#2C221E',
    margin: '0 0 8px',
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  emptyDesc: {
    fontSize: 14,
    color: '#7A6F68',
    margin: '0 0 24px',
  },
  exploreBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 26px',
    background: '#DE7356',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    boxShadow: '0 4px 12px rgba(222, 115, 86, 0.2)',
  },
  /* Error state */
  errorCard: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #F5C6CB',
    padding: '48px 24px',
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: '#FDF2F2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  errorTitle: {
    fontSize: 19,
    fontWeight: 700,
    color: '#2C221E',
    margin: '0 0 8px',
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  errorDesc: {
    fontSize: 13.5,
    color: '#7A6F68',
    margin: '0 0 20px',
  },
  tryAgainBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 22px',
    background: '#2C221E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
  /* Skeleton */
  skeletonCard: {
    background: '#FFFFFF',
    borderRadius: 14,
    border: '1px solid #EFE7DF',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: '4 / 3.5',
    borderRadius: 10,
    background: 'linear-gradient(90deg, #FAF4F0 25%, #F0E8E2 50%, #FAF4F0 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.5s infinite',
  },
  skeletonTextShort: {
    width: '40%',
    height: 11,
    borderRadius: 4,
    background: '#FAF4F0',
  },
  skeletonTextTitle: {
    width: '85%',
    height: 14,
    borderRadius: 4,
    background: '#FAF4F0',
  },
  skeletonTextPrice: {
    width: '30%',
    height: 14,
    borderRadius: 4,
    background: '#FAF4F0',
  },
  skeletonButton: {
    width: '100%',
    height: 36,
    borderRadius: 8,
    background: '#FAF4F0',
    marginTop: 'auto',
  },
};