import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import SelectDropdown from '../../components/admin/SelectDropdown';
import { productAPI, categoryAPI } from '../../utils/api';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'
];

const NewProduct = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    discount: 0,
    category: '',
    subCategory: 'Couture',
    description: '',
    images: [...DEFAULT_IMAGES],
    rating: 4.8,
    stock: 15
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryAPI.getAll();
        if (data.success && Array.isArray(data.categories)) {
          // Rule 8 & User Refinement: Frontend filter active categories only
          const activeCats = data.categories
            .filter(c => c.isEnabled !== false)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

          const options = activeCats.map(c => ({ label: c.name, value: c.name }));
          setCategories(options);

          if (options.length > 0) {
            setFormData(prev => ({ ...prev, category: options[0].value }));
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (index, value) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = value;
    setFormData((prev) => ({
      ...prev,
      images: updatedImages
    }));
  };

  const handleAddImageField = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const handleRemoveImageField = (index) => {
    if (formData.images.length <= 3) {
      alert('Products require a minimum of 3 images.');
      return;
    }
    const updatedImages = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      images: updatedImages
    }));
  };

  // Price calculation
  const rawPrice = parseFloat(formData.price) || 0;
  const discountPercent = parseFloat(formData.discount) || 0;
  const finalPrice = Math.max(0, Math.round(rawPrice * (1 - discountPercent / 100)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (!formData.category || formData.category.trim() === '') {
      setMessage({ text: 'Please select a valid category for the product.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const validImages = formData.images.filter(img => img && img.trim() !== '');
      if (validImages.length < 3) {
        setMessage({ text: 'Please provide at least 3 valid image URLs.', type: 'error' });
        setLoading(false);
        return;
      }

      const payload = {
        name: formData.name,
        price: finalPrice,
        originalPrice: rawPrice,
        discount: discountPercent,
        category: formData.category,
        subCategory: formData.subCategory,
        description: formData.description,
        images: validImages,
        image: validImages[0],
        rating: parseFloat(formData.rating) || 4.8,
        stock: parseInt(formData.stock, 10) || 10,
        inventory: parseInt(formData.stock, 10) || 10
      };

      const res = await productAPI.create(payload);

      if (res.success || res._id || res.id || res.product) {
        setMessage({ text: 'Luxury product created successfully!', type: 'success' });
        setTimeout(() => navigate('/admin/products'), 1200);
      } else {
        setMessage({ text: res.message || 'Failed to create product.', type: 'error' });
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setMessage({ text: 'Error connecting to server. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Product Creation">
      <PageHeader
        title="Create New Luxury Product"
        subtitle="Publish a new luxury fashion item to the SriluFashionHub storefront catalog"
        breadcrumbs={[
          { label: 'Products', path: '/admin/products' },
          { label: 'New Product' }
        ]}
        actions={
          <Link to="/admin/products" style={styles.secondaryBtn}>
            ← Back to Products
          </Link>
        }
      />

      {message.text && (
        <div style={{
          ...styles.messageBox,
          backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          borderColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          color: message.type === 'success' ? '#10B981' : '#EF4444'
        }}>
          {message.text}
        </div>
      )}

      {/* Clean Professional Inventory Form */}
      <form onSubmit={handleSubmit} style={styles.formContainer}>
        {/* Section 1: Basic Information */}
        <div style={styles.formSection}>
          <h3 style={styles.sectionHeading}>1. Basic Information</h3>
          
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="name">Product Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Royal Zardozi Velvet Sherwani"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.grid2}>
            <div style={styles.inputGroup}>
              <SelectDropdown
                label="Category"
                placeholder="Select Category"
                options={categories.length > 0 ? categories : [
                  { label: "Women's Couture", value: "Women's Couture" },
                  { label: "Men's Atelier", value: "Men's Atelier" },
                  { label: "Indian Heritage", value: "Indian Heritage" },
                  { label: "Artisanal Accessories", value: "Artisanal Accessories" }
                ]}
                value={formData.category}
                onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                required={true}
                searchable={true}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="subCategory">Sub Category *</label>
              <input
                id="subCategory"
                type="text"
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                placeholder="e.g. Lehengas / Tuxedos / Bags"
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Provide a detailed description of the design, handcrafted fabric, embellishments, and fit..."
              required
              style={styles.textarea}
            />
          </div>
        </div>

        {/* Section 2: Pricing & Discounts */}
        <div style={styles.formSection}>
          <h3 style={styles.sectionHeading}>2. Pricing & Financials</h3>
          
          <div style={styles.grid3}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="price">Base Price (₹) *</label>
              <input
                id="price"
                type="number"
                step="1"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 125000"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="discount">Discount (% Off)</label>
              <input
                id="discount"
                type="number"
                step="1"
                min="0"
                max="90"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                placeholder="0"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Final Price (Calculated)</label>
              <div style={styles.readOnlyDisplay}>
                ₹{finalPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Inventory & Rating */}
        <div style={styles.formSection}>
          <h3 style={styles.sectionHeading}>3. Inventory & Rating</h3>
          
          <div style={styles.grid2}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="stock">Stock Quantity *</label>
              <input
                id="stock"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="15"
                required
                min="0"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="rating">Product Rating (0 - 5)</label>
              <input
                id="rating"
                type="number"
                step="0.1"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                placeholder="4.8"
                min="0"
                max="5"
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Product Images (Minimum 3 Images Required) */}
        <div style={styles.formSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={styles.sectionHeading}>4. Product Gallery (Minimum 3 Images Required)</h3>
              <p style={{ fontSize: '12px', color: '#A0A0AB', margin: '2px 0 0' }}>
                Image 1 is used for product card thumbnails. Image 2 & 3 populate the detailed view gallery.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddImageField}
              style={styles.addImageBtn}
            >
              + Add Image
            </button>
          </div>

          {/* Small Previews inside Form */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' }}>
            {formData.images.map((imgUrl, index) => (
              <div key={index} style={styles.imageCardBox}>
                <div style={styles.imagePreviewHeader}>
                  <span style={styles.imageIndexBadge}>
                    {index === 0 ? 'Main Image 1' : `Gallery Image ${index + 1}`}
                  </span>
                  {formData.images.length > 3 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImageField(index)}
                      style={styles.removeImgBtn}
                      title="Remove image"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div style={styles.thumbWrapper}>
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={`Preview ${index + 1}`}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Invalid+Image+URL'; }}
                      style={styles.thumbnailImg}
                    />
                  ) : (
                    <div style={styles.emptyThumbPlaceholder}>
                      <span>No Image URL</span>
                    </div>
                  )}
                </div>

                <input
                  type="url"
                  value={imgUrl}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  placeholder={`https://images.unsplash.com/...`}
                  required={index < 3}
                  style={{ ...styles.input, fontSize: '11px', marginTop: '8px' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <div style={styles.buttonRow}>
          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? 'Publishing Luxury Product...' : 'Publish Product to Store'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

const styles = {
  secondaryBtn: {
    padding: '9px 16px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#F9F6F0',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textDecoration: 'none'
  },
  primaryBtn: {
    padding: '13px 32px',
    backgroundColor: '#D4AF37',
    color: '#0D0D0E',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.5px'
  },
  addImageBtn: {
    padding: '6px 14px',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    color: '#D4AF37',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  messageBox: {
    padding: '12px 16px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '13px',
    marginBottom: '24px'
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1100px',
    margin: '0 auto'
  },
  formSection: {
    backgroundColor: '#141419',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  sectionHeading: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '17px',
    fontWeight: '600',
    color: '#F9F6F0',
    margin: '0 0 4px 0'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: '#D4AF37'
  },
  input: {
    padding: '12px 14px',
    backgroundColor: '#0B0B0E',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    color: '#F9F6F0',
    fontSize: '14px',
    outline: 'none'
  },
  readOnlyDisplay: {
    padding: '12px 14px',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '6px',
    color: '#D4AF37',
    fontSize: '16px',
    fontWeight: '700',
    fontFamily: "'Playfair Display', serif"
  },
  textarea: {
    padding: '12px 14px',
    backgroundColor: '#0B0B0E',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    color: '#F9F6F0',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  imageCardBox: {
    backgroundColor: '#0B0B0E',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  imagePreviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  imageIndexBadge: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  removeImgBtn: {
    background: 'none',
    border: 'none',
    color: '#EF4444',
    fontSize: '16px',
    cursor: 'pointer',
    lineHeight: '1'
  },
  thumbWrapper: {
    width: '100%',
    height: '140px',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#141419',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  emptyThumbPlaceholder: {
    fontSize: '11px',
    color: '#A0A0AB'
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '12px'
  }
};

export default NewProduct;