import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import SelectDropdown from '../../components/admin/SelectDropdown';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import { productAPI, categoryAPI } from '../../utils/api';
import { 
  ArrowLeft, Edit2, Trash2, ShieldCheck, Tag, 
  Package, Clock, Layers, Star, Maximize2, X, AlertCircle
} from 'lucide-react';

const DEFAULT_IMAGE_SET = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'
];

const AdminProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  // Image Gallery & Lightbox
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: 0,
    category: '',
    subCategory: '',
    description: '',
    rating: 4.8,
    stock: 10,
    images: [...DEFAULT_IMAGE_SET]
  });

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProduct = async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      try {
        data = await productAPI.getById(productId);
      } catch (err) {
        console.warn('Direct fetch failed, falling back to catalog search:', err);
      }

      if (data && (data._id || data.id || data.success)) {
        const prodData = data.product || data;
        setProduct(prodData);
      } else {
        // Fallback: search in getAll
        const allData = await productAPI.getAll();
        const list = Array.isArray(allData) ? allData : (allData.products || []);
        const found = list.find(p => String(p._id || p.id) === String(productId));
        if (found) {
          setProduct(found);
        } else {
          setError('Product not found or has been deleted.');
        }
      }
    } catch (err) {
      console.error('Error loading product details:', err);
      setError('Failed to load product specifications.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [productId]);

  // Gallery calculation
  const gallery = product ? (
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image || DEFAULT_IMAGE_SET[0]]
  ) : [];

  const mainImage = gallery[activeImageIndex] || gallery[0] || DEFAULT_IMAGE_SET[0];

  const currentStock = product
    ? (product.stock !== undefined ? product.stock : (product.inventory !== undefined ? product.inventory : 10))
    : 0;

  const sellPrice = product?.price || 0;
  const origPrice = product?.originalPrice || product?.price || 0;
  const savings = origPrice > sellPrice ? origPrice - sellPrice : 0;
  const discountPct = origPrice > sellPrice ? Math.round(((origPrice - sellPrice) / origPrice) * 100) : 0;

  // Category options for edit modal
  const editCategoryOptions = React.useMemo(() => {
    const activeCats = categories
      .filter(c => c.isEnabled !== false)
      .map(c => c.name);

    if (product && product.category && !activeCats.includes(product.category)) {
      activeCats.push(product.category);
    }

    return Array.from(new Set(activeCats))
      .sort((a, b) => a.localeCompare(b))
      .map(cat => ({ label: cat, value: cat }));
  }, [categories, product]);

  const openEditModal = () => {
    if (!product) return;
    let prodImages = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      prodImages = [...product.images];
    } else if (product.image) {
      prodImages = [product.image];
    }
    while (prodImages.length < 3) {
      prodImages.push(DEFAULT_IMAGE_SET[prodImages.length % 3]);
    }

    setEditFormData({
      name: product.name || '',
      price: product.price || 0,
      category: product.category || "Women's Couture",
      subCategory: product.subCategory || 'General',
      description: product.description || '',
      rating: product.rating || 4.5,
      stock: currentStock,
      images: prodImages
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;
    setEditLoading(true);

    try {
      const validImages = editFormData.images.filter(img => img && img.trim() !== '');
      if (validImages.length < 3) {
        alert('Please ensure at least 3 valid image URLs are provided.');
        setEditLoading(false);
        return;
      }

      const updatePayload = {
        name: editFormData.name,
        price: parseFloat(editFormData.price) || 0,
        category: editFormData.category,
        subCategory: editFormData.subCategory,
        description: editFormData.description,
        rating: parseFloat(editFormData.rating) || 4.5,
        stock: parseInt(editFormData.stock, 10) || 0,
        inventory: parseInt(editFormData.stock, 10) || 0,
        images: validImages,
        image: validImages[0]
      };

      const res = await productAPI.update(product._id || product.id, updatePayload);
      if (res.success || res.product || res._id) {
        setEditModalOpen(false);
        fetchProduct();
      } else {
        alert(res.message || 'Failed to update product');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Error updating product. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!product) return;
    setDeleteLoading(true);
    try {
      const res = await productAPI.delete(product._id || product.id);
      if (res.success || res.message) {
        navigate('/admin/products', { replace: true });
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Error deleting product.');
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  };

  // Back Navigation preserving state context
  const handleBackToCatalog = () => {
    navigate(-1);
  };

  return (
    <AdminLayout title="Product Details">
      {/* Top Header & Breadcrumbs */}
      <PageHeader
        title={product ? product.name : 'Product Details'}
        subtitle="Complete specification, media gallery, inventory controls, and metadata"
        breadcrumbs={[
          { label: 'Products', path: '/admin/products' },
          { label: product ? product.name : 'Product Specifications' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={handleBackToCatalog}
              style={styles.secondaryBtn}
              title="Return to products catalog preserving filter state"
            >
              <ArrowLeft size={14} /> Back to Catalog
            </button>
            {product && (
              <>
                <button
                  type="button"
                  onClick={openEditModal}
                  style={styles.goldOutlineBtn}
                >
                  <Edit2 size={14} /> Edit Product
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  style={styles.dangerBtn}
                >
                  <Trash2 size={14} /> Delete Product
                </button>
              </>
            )}
          </div>
        }
      />

      {loading ? (
        <div style={styles.loadingContainer}>
          <div className="spin-animation" style={styles.spinner} />
          <span style={{ fontSize: '14px', color: '#A0A0AB' }}>Loading luxury product details...</span>
        </div>
      ) : error ? (
        <div style={styles.errorBanner}>
          <AlertCircle size={24} color="#EF4444" />
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#F9F6F0', fontSize: '16px' }}>Product Not Found</h4>
            <p style={{ margin: 0, color: '#A0A0AB', fontSize: '13px' }}>{error}</p>
          </div>
          <button onClick={() => navigate('/admin/products')} style={styles.primaryBtn}>
            Return to Products Catalog
          </button>
        </div>
      ) : product ? (
        <div style={styles.mainGrid}>
          {/* Left Column: Media Gallery */}
          <div style={styles.galleryCard}>
            <div style={styles.heroWrapper}>
              <img
                src={mainImage}
                alt={product.name}
                style={styles.heroImage}
              />
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                style={styles.lightboxTriggerBtn}
                title="Click for full-screen zoom preview"
              >
                <Maximize2 size={15} color="#D4AF37" /> Zoom
              </button>
              <div style={styles.imageCounterBadge}>
                Image {activeImageIndex + 1} of {gallery.length}
              </div>
            </div>

            {/* Thumbnail Carousel / Grid */}
            <div style={styles.thumbStrip}>
              {gallery.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    ...styles.thumbBox,
                    borderColor: idx === activeImageIndex ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                    boxShadow: idx === activeImageIndex ? '0 0 12px rgba(212,175,55,0.4)' : 'none'
                  }}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} style={styles.thumbImage} />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Information Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Badge Card */}
            <div style={styles.detailCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={styles.categoryBadge}>{product.category || "Women's Couture"}</span>
                  {product.subCategory && (
                    <span style={styles.subCategoryBadge}>{product.subCategory}</span>
                  )}
                </div>
                <StatusBadge status={currentStock === 0 ? 'out_of_stock' : currentStock <= 5 ? 'low_stock' : 'in_stock'} />
              </div>

              <h2 style={styles.productTitle}>{product.name}</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <span style={styles.ratingBadge}>
                  <Star size={13} fill="#D4AF37" color="#D4AF37" /> {product.rating || 4.8} / 5.0
                </span>
                <span style={{ fontSize: '12px', color: '#A0A0AB' }}>• SKU: {product.sku || (product._id || product.id || '').slice(-6).toUpperCase()}</span>
              </div>
            </div>

            {/* Financial & Pricing Card */}
            <div style={styles.detailCard}>
              <span style={styles.cardHeaderTitle}>Pricing & Financial Breakdown</span>
              <div style={styles.pricingGrid}>
                <div>
                  <span style={styles.metaLabel}>Selling Price</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                    <span style={styles.priceGold}>₹{Math.round(sellPrice).toLocaleString('en-IN')}</span>
                    {origPrice > sellPrice && (
                      <span style={styles.origPriceStrikethrough}>
                        ₹{Math.round(origPrice).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span style={styles.metaLabel}>Savings & Discount</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    {discountPct > 0 ? (
                      <span style={styles.discountPill}>{discountPct}% OFF</span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#A0A0AB' }}>Regular Price</span>
                    )}
                    {savings > 0 && (
                      <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '600' }}>
                        Save ₹{Math.round(savings).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={styles.taxNoticeRow}>
                <ShieldCheck size={14} color="#D4AF37" />
                <span>Price inclusive of all applicable GST taxes & luxury care handling</span>
              </div>
            </div>

            {/* Inventory Specifications Card */}
            <div style={styles.detailCard}>
              <span style={styles.cardHeaderTitle}>Inventory & Stock Management</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '12px' }}>
                <div style={styles.specTile}>
                  <span style={styles.metaLabel}>Stock Level</span>
                  <span style={styles.specValue}>{currentStock} Units</span>
                </div>

                <div style={styles.specTile}>
                  <span style={styles.metaLabel}>Availability Status</span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: currentStock > 0 ? '#10B981' : '#EF4444'
                  }}>
                    {currentStock > 0 ? 'Available for Purchase' : 'Out of Stock'}
                  </span>
                </div>

                <div style={styles.specTile}>
                  <span style={styles.metaLabel}>Stock Threshold</span>
                  <span style={styles.specValue}>
                    {currentStock <= 5 ? 'Low Stock Warning' : 'Optimal Reserve'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description & Attributes */}
            <div style={styles.detailCard}>
              <span style={styles.cardHeaderTitle}>Product Description & Attributes</span>
              <p style={styles.descriptionText}>
                {product.description || 'No detailed description provided for this luxury product item.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={styles.metaLabel}>Brand:</span>
                  <span style={{ fontSize: '13px', color: '#F9F6F0', fontWeight: '600' }}>
                    {product.brand || 'Srilu Couture'}
                  </span>
                </div>

                {/* Tags */}
                {Array.isArray(product.tags) && product.tags.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={styles.metaLabel}>Tags:</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {product.tags.map((tag, idx) => (
                        <span key={idx} style={styles.tagPill}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* System Metadata Card */}
            <div style={styles.detailCard}>
              <span style={styles.cardHeaderTitle}>System Metadata & Tracking</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={14} color="#D4AF37" />
                  <div>
                    <span style={styles.metaLabel}>Product ID</span>
                    <span style={{ fontSize: '12px', color: '#F9F6F0', fontFamily: 'monospace', display: 'block' }}>
                      {product._id || product.id}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} color="#D4AF37" />
                  <div>
                    <span style={styles.metaLabel}>Created Date</span>
                    <span style={{ fontSize: '12px', color: '#F9F6F0', display: 'block' }}>
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={14} color="#D4AF37" />
                  <div>
                    <span style={styles.metaLabel}>Last Updated</span>
                    <span style={{ fontSize: '12px', color: '#F9F6F0', display: 'block' }}>
                      {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Lightbox Zoom Modal */}
      {isLightboxOpen && (
        <div style={styles.lightboxOverlay} onClick={() => setIsLightboxOpen(false)}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsLightboxOpen(false)} style={styles.lightboxCloseBtn}>
              <X size={20} color="#FFFFFF" />
            </button>
            <img src={mainImage} alt={product?.name} style={styles.lightboxImage} />
            <div style={styles.lightboxCaption}>{product?.name} - Image {activeImageIndex + 1}</div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${product?.name}"? This action cannot be undone.`}
        confirmText="Delete Product"
        danger={true}
        loading={deleteLoading}
      />

      {/* Edit Product Modal */}
      {editModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setEditModalOpen(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Product Details</h3>
              <button onClick={() => setEditModalOpen(false)} style={styles.modalClose}>×</button>
            </div>

            <form onSubmit={handleEditSubmit} style={styles.editForm}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Product Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={styles.inputGroup}>
                  <SelectDropdown
                    label="Category"
                    placeholder="Select Category"
                    options={editCategoryOptions}
                    value={editFormData.category}
                    onChange={(val) => setEditFormData({ ...editFormData, category: val })}
                    required={true}
                    searchable={true}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Sub Category</label>
                  <input
                    type="text"
                    value={editFormData.subCategory}
                    onChange={(e) => setEditFormData({ ...editFormData, subCategory: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Price (₹ INR) *</label>
                  <input
                    type="number"
                    step="1"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Stock Quantity *</label>
                  <input
                    type="number"
                    value={editFormData.stock}
                    onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}
                    required
                    min="0"
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editFormData.rating}
                    onChange={(e) => setEditFormData({ ...editFormData, rating: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  rows="3"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  style={styles.textarea}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <label style={styles.label}>Product Gallery Images (3 Minimum)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '6px' }}>
                  {editFormData.images.map((imgUrl, idx) => (
                    <div key={idx} style={styles.editImgCard}>
                      <span style={{ fontSize: '10px', color: '#D4AF37', fontWeight: '700' }}>
                        Image {idx + 1}
                      </span>
                      <input
                        type="url"
                        value={imgUrl}
                        onChange={(e) => {
                          const updated = [...editFormData.images];
                          updated[idx] = e.target.value;
                          setEditFormData({ ...editFormData, images: updated });
                        }}
                        placeholder={`https://images.unsplash.com/...`}
                        required={idx < 3}
                        style={{ ...styles.input, fontSize: '11px', padding: '8px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  style={styles.secondaryBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={styles.primaryBtn}
                >
                  {editLoading ? 'Saving...' : 'Save Product Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const styles = {
  primaryBtn: {
    padding: '9px 18px',
    backgroundColor: '#D4AF37',
    color: '#0D0D10',
    border: 'none',
    borderRadius: '24px',
    fontSize: '12px',
    fontWeight: '700',
    textDecoration: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.25)'
  },
  secondaryBtn: {
    padding: '9px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#F9F6F0',
    borderRadius: '24px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: 'none'
  },
  goldOutlineBtn: {
    padding: '9px 16px',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    border: '1px solid rgba(212, 175, 55, 0.4)',
    color: '#D4AF37',
    borderRadius: '24px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  dangerBtn: {
    padding: '9px 16px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#EF4444',
    borderRadius: '24px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  loadingContainer: {
    padding: '80px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px'
  },
  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid rgba(212, 175, 55, 0.2)',
    borderTopColor: '#D4AF37'
  },
  errorBanner: {
    backgroundColor: '#141418',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '16px',
    padding: '32px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '420px 1fr',
    gap: '24px',
    alignItems: 'start'
  },
  galleryCard: {
    backgroundColor: '#141418',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  heroWrapper: {
    position: 'relative',
    width: '100%',
    height: '480px',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#0D0D10',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  lightboxTriggerBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    padding: '6px 12px',
    backgroundColor: 'rgba(13, 13, 16, 0.85)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '20px',
    color: '#F9F6F0',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backdropFilter: 'blur(6px)'
  },
  imageCounterBadge: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    padding: '4px 10px',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#D4AF37',
    fontWeight: '600'
  },
  thumbStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px'
  },
  thumbBox: {
    height: '84px',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s ease',
    backgroundColor: '#0D0D10'
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  detailCard: {
    backgroundColor: '#141418',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '16px',
    padding: '22px 24px',
    display: 'flex',
    flexDirection: 'column'
  },
  categoryBadge: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid rgba(212, 175, 55, 0.3)'
  },
  subCategoryBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#A0A0AB',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  productTitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '1.65rem',
    fontWeight: '700',
    color: '#F9F6F0',
    margin: 0,
    letterSpacing: '-0.3px'
  },
  ratingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: '2px 8px',
    borderRadius: '8px'
  },
  cardHeaderTitle: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#A0A0AB',
    marginBottom: '8px'
  },
  pricingGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '6px'
  },
  metaLabel: {
    fontSize: '11px',
    color: '#A0A0AB',
    fontWeight: '500'
  },
  priceGold: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#D4AF37'
  },
  origPriceStrikethrough: {
    fontSize: '1.05rem',
    color: '#71717A',
    textDecoration: 'line-through'
  },
  discountPill: {
    padding: '3px 8px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#EF4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700'
  },
  taxNoticeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: '#A0A0AB',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
  },
  specTile: {
    backgroundColor: '#0D0D10',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  specValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#F9F6F0'
  },
  descriptionText: {
    fontSize: '13px',
    color: '#D4D4D8',
    lineHeight: '1.6',
    margin: '4px 0 0 0'
  },
  tagPill: {
    padding: '3px 8px',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    border: '1px solid rgba(212, 175, 55, 0.25)',
    borderRadius: '12px',
    color: '#D4AF37',
    fontSize: '11px',
    fontWeight: '600'
  },
  lightboxOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '40px'
  },
  lightboxContent: {
    position: 'relative',
    maxWidth: '90vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  lightboxImage: {
    maxWidth: '100%',
    maxHeight: '80vh',
    objectFit: 'contain',
    borderRadius: '12px',
    border: '1px solid rgba(212, 175, 55, 0.3)'
  },
  lightboxCaption: {
    marginTop: '12px',
    color: '#F9F6F0',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "'Playfair Display', serif"
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: '-36px',
    right: '0',
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 8, 0.8)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#141418',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    borderRadius: '20px',
    width: '100%',
    padding: '28px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  modalTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.25rem',
    color: '#F9F6F0',
    margin: 0
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#A0A0AB',
    fontSize: '24px',
    cursor: 'pointer'
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#A0A0AB'
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#F9F6F0',
    fontSize: '13px',
    outline: 'none'
  },
  textarea: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#F9F6F0',
    fontSize: '13px',
    outline: 'none',
    resize: 'vertical'
  },
  editImgCard: {
    backgroundColor: '#0D0D10',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
  }
};

export default AdminProductDetails;
