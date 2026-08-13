import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  SlidersHorizontal, 
  X, 
  Grid, 
  List, 
  Star, 
  ShoppingBag, 
  AlertCircle, 
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import CustomerShoppingHeader from '../../components/CustomerShoppingHeader';
import ProductCard from '../../components/ProductCard';
import ShoppingSelect from '../../components/common/ShoppingSelect';
import { productAPI } from '../../utils/api';
import './SearchResultsPage.css';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const ratingParam = searchParams.get('rating') || '';
  const discountParam = searchParams.get('discount') || '';
  const inStockParam = searchParams.get('inStock') === 'true';
  const sortParam = searchParams.get('sort') || 'popularity';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const QUICK_PRICE_RANGES = [
    { label: 'Under ₹499', min: 0, max: 499 },
    { label: '₹499 – ₹999', min: 499, max: 999 },
    { label: '₹999 – ₹1,999', min: 999, max: 1999 },
    { label: '₹1,999 – ₹3,999', min: 1999, max: 3999 },
    { label: '₹3,999 and above', min: 3999, max: 99999 }
  ];

  const fetchSearchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        search: queryParam,
        category: categoryParam,
        minPrice: minPriceParam,
        maxPrice: maxPriceParam,
        minRating: ratingParam,
        minDiscount: discountParam,
        inStock: inStockParam ? 'true' : '',
        sort: sortParam,
        page: pageParam,
        limit: 24
      };

      const res = await productAPI.getFiltered(params);
      if (res && res.success) {
        setProducts(res.products || []);
        setTotalProducts(res.total || res.count || 0);
      } else {
        setProducts([]);
        setTotalProducts(0);
      }
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError('Unable to load search results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, [queryParam, categoryParam, minPriceParam, maxPriceParam, ratingParam, discountParam, inStockParam, sortParam, pageParam]);

  const updateQueryParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === '' || value === null || value === 'all' || value === false) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    if (key !== 'page') {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    const newParams = new URLSearchParams();
    if (queryParam) newParams.set('q', queryParam);
    setSearchParams(newParams);
  };

  const isAnyFilterActive = useMemo(() => {
    return !!(categoryParam || minPriceParam || maxPriceParam || ratingParam || discountParam || inStockParam);
  }, [categoryParam, minPriceParam, maxPriceParam, ratingParam, discountParam, inStockParam]);

  const SORT_OPTIONS = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Rating' }
  ];

  return (
    <div className="search-results-page-container">
      <CustomerShoppingHeader />

      <main className="search-results-main">
        {/* Breadcrumb */}
        <div className="shop-breadcrumb-wrap">
          <div className="shop-breadcrumb">
            <Link to="/user/dashboard">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <Link to="/shop">Shop</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current active-crumb">
              Search Results
            </span>
          </div>
        </div>

        {/* Search Header Banner */}
        <section className="search-banner-card">
          <div className="search-banner-content">
            <span className="search-banner-tag">CATALOG SEARCH</span>
            <h1 className="search-banner-title">
              {queryParam ? `Search Results for "${queryParam}"` : 'All Catalog Products'}
            </h1>
            <p className="search-banner-sub">
              Found {totalProducts} matching item{totalProducts === 1 ? '' : 's'} in our luxury collection.
            </p>
          </div>
        </section>

        {/* Mobile Toolbar */}
        <div className="mobile-toolbar">
          <button className="btn-mobile-filter" onClick={() => setMobileFiltersOpen(true)}>
            <SlidersHorizontal size={16} /> Filters {isAnyFilterActive && <span className="filter-dot" />}
          </button>
          
          <ShoppingSelect
            label="Sort"
            options={SORT_OPTIONS}
            value={sortParam}
            onChange={(val) => updateQueryParam('sort', val)}
          />
        </div>

        {/* Layout: Sidebar + Product Grid */}
        <div className="shopping-layout">
          {/* Filter Sidebar */}
          <aside className={`filter-sidebar ${mobileFiltersOpen ? 'mobile-drawer-open' : ''}`}>
            <div className="filter-header">
              <h3>FILTERS</h3>
              {isAnyFilterActive && (
                <button className="btn-clear-all" onClick={handleClearFilters}>
                  Clear All
                </button>
              )}
              <button className="btn-close-drawer" onClick={() => setMobileFiltersOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <h4 className="filter-title">PRICE RANGE</h4>
              <div className="price-inputs">
                <div className="price-input-box">
                  <span>₹</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPriceParam}
                    onChange={(e) => updateQueryParam('minPrice', e.target.value)}
                  />
                </div>
                <span className="price-dash">—</span>
                <div className="price-input-box">
                  <span>₹</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPriceParam}
                    onChange={(e) => updateQueryParam('maxPrice', e.target.value)}
                  />
                </div>
              </div>

              <div className="quick-ranges-list">
                {QUICK_PRICE_RANGES.map((range, idx) => {
                  const isSelected = String(minPriceParam) === String(range.min) && String(maxPriceParam) === String(range.max);
                  return (
                    <label key={idx} className="quick-range-radio">
                      <input
                        type="radio"
                        name="quickPriceSearch"
                        checked={isSelected}
                        onChange={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set('minPrice', range.min);
                          if (range.max < 99999) newParams.set('maxPrice', range.max);
                          else newParams.delete('maxPrice');
                          newParams.delete('page');
                          setSearchParams(newParams);
                        }}
                      />
                      <span>{range.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Discount */}
            <div className="filter-group">
              <h4 className="filter-title">DISCOUNT</h4>
              {[10, 20, 30, 40].map((d) => {
                const isChecked = String(discountParam) === String(d);
                return (
                  <label key={d} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => updateQueryParam('discount', isChecked ? '' : d)}
                    />
                    <span>{d}% and above</span>
                  </label>
                );
              })}
            </div>

            {/* Rating */}
            <div className="filter-group">
              <h4 className="filter-title">RATING</h4>
              {[4, 3, 2].map((r) => {
                const isChecked = String(ratingParam) === String(r);
                return (
                  <label key={r} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => updateQueryParam('rating', isChecked ? '' : r)}
                    />
                    <div className="stars-row">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < r ? 'star-gold' : 'star-muted'} />
                      ))}
                      <span>& above</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Availability */}
            <div className="filter-group">
              <h4 className="filter-title">AVAILABILITY</h4>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={inStockParam}
                  onChange={(e) => updateQueryParam('inStock', e.target.checked ? 'true' : '')}
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </aside>

          {/* Product Listing Area */}
          <section className="product-listing-area">
            <div className="product-toolbar">
              <div className="product-count-text">
                Showing {products.length > 0 ? `1–${products.length}` : '0'} of {totalProducts} products
              </div>

              <div className="toolbar-controls">
                <ShoppingSelect
                  label="Sort By"
                  options={SORT_OPTIONS}
                  value={sortParam}
                  onChange={(val) => updateQueryParam('sort', val)}
                />

                <div className="view-mode-toggles">
                  <button
                    className={`btn-view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    className={`btn-view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="List View"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid / Skeletons / Empty State */}
            {loading ? (
              <div className={`products-grid ${viewMode}`}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="product-card-skeleton">
                    <div className="skeleton-img" />
                    <div className="skeleton-title" />
                    <div className="skeleton-price" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="products-error-card">
                <AlertCircle size={40} className="error-icon" />
                <h3>Unable to Load Search Results</h3>
                <p>{error}</p>
                <button className="btn-retry" onClick={fetchSearchResults}>
                  <RefreshCw size={16} /> Try Again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="products-empty-card">
                <ShoppingBag size={48} className="empty-icon" />
                <h3>No products found for "{queryParam}"</h3>
                <p>Try checking for spelling errors or searching with broader keywords.</p>
                {isAnyFilterActive && (
                  <button className="btn-clear-filters" onClick={handleClearFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className={`products-grid ${viewMode}`}>
                {products.map((product) => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            )}

            {/* Desktop Bottom-Right Aligned Pagination */}
            {totalProducts > 24 && (
              <div className="pagination-wrapper-right">
                <button
                  className="pagination-btn"
                  disabled={pageParam <= 1}
                  onClick={() => updateQueryParam('page', pageParam - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                
                {[...Array(Math.ceil(totalProducts / 24))].map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      className={`pagination-btn ${pageParam === pNum ? 'active' : ''}`}
                      onClick={() => updateQueryParam('page', pNum)}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  className="pagination-btn"
                  disabled={pageParam >= Math.ceil(totalProducts / 24)}
                  onClick={() => updateQueryParam('page', pageParam + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default SearchResultsPage;
