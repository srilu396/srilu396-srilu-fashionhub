import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Layers, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';
import CustomerShoppingHeader from '../../components/CustomerShoppingHeader';
import { categoryAPI } from '../../utils/api';
import './ShopDiscoveryPage.css';

const ShopDiscoveryPage = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await categoryAPI.getAll(true);
      if (res && res.success) {
        const list = res.departments || res.categories || [];
        setDepartments(list);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error('Error fetching departments for shop discovery:', err);
      setError('Unable to load fashion departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const getSlug = (dept) => {
    if (dept.slug) return dept.slug;
    if (dept.name) return dept.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    return '';
  };

  return (
    <div className="shop-discovery-container">
      <CustomerShoppingHeader />

      <main className="shop-discovery-main">
        {/* Breadcrumb */}
        <div className="shop-breadcrumb-wrap">
          <div className="shop-breadcrumb">
            <Link to="/user/dashboard">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Shop</span>
          </div>
        </div>

        {/* Hero Header */}
        <section className="shop-discovery-hero">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>SRILU FASHION CATALOG</span>
          </div>
          <h1 className="hero-title">Explore Our Departments & Ateliers</h1>
          <p className="hero-subtitle">
            Curated haute couture, modern Indian heritage, fine jewelry, and artisanal accessories.
          </p>
        </section>

        {/* Content Section */}
        <section className="shop-discovery-content">
          {loading ? (
            <div className="departments-grid">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="dept-card-skeleton">
                  <div className="dept-skeleton-img" />
                  <div className="dept-skeleton-text" />
                  <div className="dept-skeleton-sub" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="shop-error-state">
              <AlertCircle size={40} className="error-icon" />
              <h3>Unable to Load Catalog</h3>
              <p>{error}</p>
              <button className="btn-retry" onClick={fetchDepartments}>
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          ) : departments.length === 0 ? (
            <div className="shop-empty-state">
              <ShoppingBag size={48} className="empty-icon" />
              <h3>No Departments Available</h3>
              <p>Check back soon as our atelier adds new fashion collections to the catalog.</p>
              <Link to="/" className="btn-home">Return to Home</Link>
            </div>
          ) : (
            <div className="departments-grid">
              {departments.map((dept) => {
                const slug = getSlug(dept);
                const categoryCount = dept.categories ? dept.categories.length : 0;
                return (
                  <div key={dept._id || dept.id || slug} className="dept-card">
                    <div className="dept-card-media">
                      {dept.image ? (
                        <img 
                          src={dept.image} 
                          alt={dept.name} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentElement.classList.add('fallback-bg');
                          }}
                        />
                      ) : (
                        <div className="dept-card-fallback">
                          <Layers size={40} />
                          <span>{dept.name}</span>
                        </div>
                      )}
                      <div className="dept-card-overlay" />
                    </div>
                    <div className="dept-card-info">
                      <div className="dept-card-header">
                        <h2 className="dept-name">{dept.name}</h2>
                        {categoryCount > 0 && (
                          <span className="dept-cat-count">
                            {categoryCount} {categoryCount === 1 ? 'Category' : 'Categories'}
                          </span>
                        )}
                      </div>
                      {dept.description && (
                        <p className="dept-desc">{dept.description}</p>
                      )}
                      <button 
                        className="btn-explore-dept" 
                        onClick={() => navigate(`/shop/${slug}`)}
                      >
                        Explore Collection <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ShopDiscoveryPage;
