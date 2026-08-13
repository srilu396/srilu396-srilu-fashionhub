import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft, 
  SlidersHorizontal, 
  X, 
  Check, 
  ShieldCheck, 
  RotateCcw, 
  Lock, 
  Grid, 
  List, 
  Star, 
  ShoppingBag, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';
import CustomerShoppingHeader from '../../components/CustomerShoppingHeader';
import ProductCard from '../../components/ProductCard';
import ShoppingSelect from '../../components/common/ShoppingSelect';
import { categoryAPI, productAPI } from '../../utils/api';
import './DepartmentShoppingPage.css';

const DepartmentShoppingPage = () => {
  const { departmentSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Department & Catalog state from MongoDB
  const [departments, setDepartments] = useState([]);
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [deptLoading, setDeptLoading] = useState(true);

  // Products & Filtering State
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  // Price Bounds from API
  const [apiMinPrice, setApiMinPrice] = useState(0);
  const [apiMaxPrice, setApiMaxPrice] = useState(10000);

  // Layout View State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Category Nav Scroll Ref
  const categoryScrollRef = useRef(null);

  // Query Params Extraction
  const selectedCategorySlug = searchParams.get('category') || 'all';
  const selectedSubcategorySlug = searchParams.get('subcategory') || 'all';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const ratingParam = searchParams.get('rating') || '';
  const discountParam = searchParams.get('discount') || '';
  const inStockParam = searchParams.get('inStock') === 'true';
  const sortParam = searchParams.get('sort') || 'popularity';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Quick Price Ranges helper options
  const QUICK_PRICE_RANGES = [
    { label: 'Under ₹499', min: 0, max: 499 },
    { label: '₹499 – ₹999', min: 499, max: 999 },
    { label: '₹999 – ₹1,999', min: 999, max: 1999 },
    { label: '₹1,999 – ₹3,999', min: 1999, max: 3999 },
    { label: '₹3,999 and above', min: 3999, max: 99999 }
  ];

  // Helper to slugify string
  const slugify = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  // 1. Fetch All Departments from MongoDB
  useEffect(() => {
    const fetchCatalogHierarchy = async () => {
      try {
        setDeptLoading(true);
        const res = await categoryAPI.getAll(true);
        if (res && res.success) {
          const deptList = res.departments || res.categories || [];
          setDepartments(deptList);
          
          let targetDept = null;
          if (departmentSlug) {
            targetDept = deptList.find(d => 
              (d.slug && d.slug.toLowerCase() === departmentSlug.toLowerCase()) ||
              slugify(d.name) === departmentSlug.toLowerCase()
            );
          }
          
          // Fallback to first department if none matched or no slug provided
          if (!targetDept && deptList.length > 0) {
            targetDept = deptList[0];
          }
          
          setCurrentDepartment(targetDept || null);
        }
      } catch (err) {
        console.error('Error fetching catalog hierarchy:', err);
      } finally {
        setDeptLoading(false);
      }
    };
    fetchCatalogHierarchy();
  }, [departmentSlug]);

  // Derived Active Category & Subcategories
  const activeCategories = useMemo(() => {
    if (!currentDepartment || !Array.isArray(currentDepartment.categories)) return [];
    return currentDepartment.categories;
  }, [currentDepartment]);

  const activeCategoryObj = useMemo(() => {
    if (selectedCategorySlug === 'all') return null;
    return activeCategories.find(c => 
      slugify(c.name) === selectedCategorySlug.toLowerCase() ||
      c.name.toLowerCase() === selectedCategorySlug.toLowerCase()
    );
  }, [activeCategories, selectedCategorySlug]);

  const activeSubcategories = useMemo(() => {
    if (!activeCategoryObj || !Array.isArray(activeCategoryObj.subcategories)) return [];
    return activeCategoryObj.subcategories;
  }, [activeCategoryObj]);

  // 2. Fetch Products whenever filters / department change
  const fetchFilteredProducts = async () => {
    if (!currentDepartment) return;
    try {
      setProductsLoading(true);
      setProductsError(null);

      const params = {
        department: currentDepartment.name,
        category: activeCategoryObj ? activeCategoryObj.name : (selectedCategorySlug !== 'all' ? selectedCategorySlug : ''),
        subcategory: selectedSubcategorySlug !== 'all' ? selectedSubcategorySlug : '',
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
        if (res.minPrice !== undefined) setApiMinPrice(res.minPrice);
        if (res.maxPrice !== undefined) setApiMaxPrice(res.maxPrice);
      } else {
        setProducts([]);
        setTotalProducts(0);
      }
    } catch (err) {
      console.error('Error fetching filtered products:', err);
      setProductsError('Something went wrong while loading products.');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (currentDepartment) {
      fetchFilteredProducts();
    }
  }, [
    currentDepartment, 
    selectedCategorySlug, 
    selectedSubcategorySlug, 
    minPriceParam, 
    maxPriceParam, 
    ratingParam, 
    discountParam, 
    inStockParam, 
    sortParam, 
    pageParam
  ]);

  // Helper to update search params in URL
  const updateQueryParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === '' || value === null || value === 'all' || value === false) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    // Reset to page 1 on filter change
    if (key !== 'page') {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  const handleCategorySelect = (catName) => {
    const newParams = new URLSearchParams(searchParams);
    if (catName === 'all') {
      newParams.delete('category');
      newParams.delete('subcategory');
    } else {
      newParams.set('category', slugify(catName));
      newParams.delete('subcategory');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleSubcategorySelect = (subName) => {
    const newParams = new URLSearchParams(searchParams);
    if (subName === 'all') {
      newParams.delete('subcategory');
    } else {
      newParams.set('subcategory', slugify(subName));
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const scrollCategoryNav = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const isAnyFilterActive = useMemo(() => {
    return !!(
      selectedCategorySlug !== 'all' ||
      selectedSubcategorySlug !== 'all' ||
      minPriceParam ||
      maxPriceParam ||
      ratingParam ||
      discountParam ||
      inStockParam
    );
  }, [selectedCategorySlug, selectedSubcategorySlug, minPriceParam, maxPriceParam, ratingParam, discountParam, inStockParam]);

  if (deptLoading) {
    return (
      <div className="dept-shopping-container">
        <CustomerShoppingHeader />
        <div className="dept-page-skeleton">
          <div className="skeleton-hero-box" />
          <div className="skeleton-pills-bar" />
          <div className="skeleton-grid-wrap">
            <div className="skeleton-sidebar" />
            <div className="skeleton-grid" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentDepartment) {
    return (
      <div className="dept-shopping-container">
        <CustomerShoppingHeader />
        <div className="dept-page-empty">
          <AlertCircle size={48} className="empty-icon" />
          <h2>Department Not Found</h2>
          <p>The requested department does not exist in our catalog.</p>
          <Link to="/shop" className="btn-return-shop">Explore All Departments</Link>
        </div>
      </div>
    );
  }

  const SORT_OPTIONS = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Rating' }
  ];

  return (
    <div className="dept-shopping-container">
      <CustomerShoppingHeader />

      <main className="dept-shopping-main">
        {/* 1. Dynamic Breadcrumbs */}
        <div className="shop-breadcrumb-wrap">
          <div className="shop-breadcrumb">
            <Link to="/user/dashboard">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <Link to="/shop">Shop</Link>
            <span className="breadcrumb-sep">/</span>
            <span className={`breadcrumb-current ${!activeCategoryObj ? 'active-crumb' : ''}`}>
              {currentDepartment.name}
            </span>
            {activeCategoryObj && (
              <>
                <span className="breadcrumb-sep">/</span>
                <span className={`breadcrumb-current ${selectedSubcategorySlug === 'all' ? 'active-crumb' : ''}`}>
                  {activeCategoryObj.name}
                </span>
              </>
            )}
            {selectedSubcategorySlug !== 'all' && (
              <>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current active-crumb">
                  {selectedSubcategorySlug.replace(/-/g, ' ')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 2. Compact Department Hero Banner */}
        <section className="dept-hero-card">
          <div className="hero-left">
            <div className="dept-avatar-wrap">
              {currentDepartment.image ? (
                <img 
                  src={currentDepartment.image} 
                  alt={currentDepartment.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.classList.add('avatar-fallback');
                  }}
                />
              ) : (
                <div className="dept-avatar-fallback">
                  <Sparkles size={28} />
                </div>
              )}
            </div>
            <div className="dept-hero-details">
              <h1 className="dept-hero-title">{currentDepartment.name}</h1>
              <p className="dept-hero-subtitle">
                {currentDepartment.description || 'Explore our exclusive collection crafted with modern elegance and fine detailing.'}
              </p>
            </div>
          </div>

          <div className="hero-trust-badges">
            <div className="trust-badge-item">
              <ShieldCheck size={18} className="trust-icon" />
              <div>
                <strong>100% Quality</strong>
                <span>Products Guaranteed</span>
              </div>
            </div>
            <div className="trust-badge-item">
              <RotateCcw size={18} className="trust-icon" />
              <div>
                <strong>Easy Returns</strong>
                <span>Within 7 Days</span>
              </div>
            </div>
            <div className="trust-badge-item">
              <Lock size={18} className="trust-icon" />
              <div>
                <strong>Secure Payments</strong>
                <span>100% Protected</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Horizontal Category Navigation Bar */}
        {activeCategories.length > 0 && (
          <section className="category-nav-wrapper">
            <button className="nav-arrow left" onClick={() => scrollCategoryNav('left')} aria-label="Scroll left">
              <ChevronLeft size={18} />
            </button>
            
            <div className="category-nav-scroll" ref={categoryScrollRef}>
              <button
                className={`cat-pill ${selectedCategorySlug === 'all' ? 'active' : ''}`}
                onClick={() => handleCategorySelect('all')}
              >
                All
              </button>
              {activeCategories.map((cat) => {
                const catSlug = slugify(cat.name);
                const isSelected = selectedCategorySlug.toLowerCase() === catSlug || selectedCategorySlug.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat._id || cat.name}
                    className={`cat-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(cat.name)}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            <button className="nav-arrow right" onClick={() => scrollCategoryNav('right')} aria-label="Scroll right">
              <ChevronRight size={18} />
            </button>
          </section>
        )}

        {/* 4. Subcategory Pills Bar (if a Category is Selected) */}
        {activeCategoryObj && activeSubcategories.length > 0 && (
          <section className="subcategory-chips-bar">
            <span className="subcat-label">Subcategories:</span>
            <button
              className={`subcat-chip ${selectedSubcategorySlug === 'all' ? 'active' : ''}`}
              onClick={() => handleSubcategorySelect('all')}
            >
              All {activeCategoryObj.name}
            </button>
            {activeSubcategories.map((sub) => {
              const subSlug = slugify(sub.name);
              const isSelected = selectedSubcategorySlug.toLowerCase() === subSlug || selectedSubcategorySlug.toLowerCase() === sub.name.toLowerCase();
              return (
                <button
                  key={sub._id || sub.name}
                  className={`subcat-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSubcategorySelect(sub.name)}
                >
                  {sub.name}
                </button>
              );
            })}
          </section>
        )}

        {/* 5. Mobile Filter & Sort Bar */}
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

        {/* 6. Main Shopping Grid Layout (Sidebar + Products) */}
        <div className="shopping-layout">
          {/* Filter Sidebar (Desktop & Mobile Drawer) */}
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

            {/* Filter: Price Range */}
            <div className="filter-group">
              <h4 className="filter-title">PRICE RANGE</h4>
              <div className="price-slider-wrap">
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
              </div>

              {/* Quick Ranges */}
              <div className="quick-ranges-list">
                {QUICK_PRICE_RANGES.map((range, idx) => {
                  const isSelected = String(minPriceParam) === String(range.min) && String(maxPriceParam) === String(range.max);
                  return (
                    <label key={idx} className="quick-range-radio">
                      <input
                        type="radio"
                        name="quickPrice"
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

            {/* Filter: Discount */}
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

            {/* Filter: Rating */}
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

            {/* Filter: Availability */}
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

          {/* Product Listing Main Area */}
          <section className="product-listing-area">
            {/* Desktop Product Toolbar */}
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

            {/* Product Grid / Loading / Empty / Error */}
            {productsLoading ? (
              <div className={`products-grid ${viewMode}`}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="product-card-skeleton">
                    <div className="skeleton-img" />
                    <div className="skeleton-title" />
                    <div className="skeleton-price" />
                  </div>
                ))}
              </div>
            ) : productsError ? (
              <div className="products-error-card">
                <AlertCircle size={40} className="error-icon" />
                <h3>Unable to Load Products</h3>
                <p>{productsError}</p>
                <button className="btn-retry" onClick={fetchFilteredProducts}>
                  <RefreshCw size={16} /> Try Again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="products-empty-card">
                <ShoppingBag size={48} className="empty-icon" />
                <h3>No products found</h3>
                <p>We couldn't find any products matching your current selection.</p>
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

            {/* Pagination Controls */}
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

export default DepartmentShoppingPage;
