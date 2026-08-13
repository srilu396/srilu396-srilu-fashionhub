import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import ProductCard from '../ProductCard';
import { productAPI } from '../../utils/api';
import { productsData } from '../../data/products';
import './RelatedProducts.css';

const RelatedProducts = ({ productId, currentProduct }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        const res = await productAPI.getRelated(productId);
        if (res && res.success && Array.isArray(res.products) && res.products.length > 0) {
          const filtered = res.products.filter(p => (p._id || p.id) !== productId);
          setRelatedProducts(filtered);
          return;
        }

        // Fallback: Filter local productsData strictly by subCategory -> category
        const cSub = currentProduct?.subCategory || currentProduct?.subcategory;
        const cCat = currentProduct?.category;

        let localMatches = [];
        if (cSub) {
          localMatches = productsData.filter(p => 
            (p.id || p._id) !== productId && 
            p.subCategory && p.subCategory.toLowerCase() === cSub.toLowerCase()
          );
        }

        if (localMatches.length < 10 && cCat) {
          const existingIds = new Set([productId, ...localMatches.map(m => m.id || m._id)]);
          const catMatches = productsData.filter(p => 
            !existingIds.has(p.id || p._id) && 
            p.category && p.category.toLowerCase() === cCat.toLowerCase()
          );
          localMatches = [...localMatches, ...catMatches];
        }

        if (localMatches.length < 10) {
          const existingIds = new Set([productId, ...localMatches.map(m => m.id || m._id)]);
          const extraMatches = productsData.filter(p => !existingIds.has(p.id || p._id));
          localMatches = [...localMatches, ...extraMatches];
        }

        setRelatedProducts(localMatches.slice(0, 10));
      } catch (err) {
        console.error('Error loading related products:', err);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [productId, currentProduct]);

  if (!loading && relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="related-products-section">
      <div className="related-container">
        <div className="related-header">
          <span className="related-eyebrow">
            <Sparkles size={13} /> CURATED RECOMMENDATIONS
          </span>
          <h2 className="related-title">YOU MAY ALSO LIKE</h2>
        </div>

        {loading ? (
          <div className="related-products-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="related-card-skeleton">
                <div className="skeleton-img-box" />
                <div className="skeleton-line-title" />
                <div className="skeleton-line-price" />
              </div>
            ))}
          </div>
        ) : (
          <div className="related-products-grid">
            {relatedProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RelatedProducts;
