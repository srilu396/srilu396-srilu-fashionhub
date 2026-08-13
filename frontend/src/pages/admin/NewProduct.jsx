import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import SelectDropdown from '../../components/admin/SelectDropdown';
import { productAPI, categoryAPI } from '../../utils/api';
import { useToast } from '../../components/common/Toast/useToast';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'
];

const NewProduct = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  // Classification State
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    images: [...DEFAULT_IMAGES],
    rating: 4.8,
    stock: 10
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCatalogHierarchy = async () => {
      setLoadingDepts(true);
      try {
        const data = await categoryAPI.getAll();
        let depts = [];
        if (data.success && Array.isArray(data.departments)) {
          depts = data.departments;
        } else if (data.success && Array.isArray(data.categories)) {
          depts = data.categories;
        }

        const activeDepts = depts.filter(d => d.isEnabled !== false);
        setDepartments(activeDepts);

        if (activeDepts.length > 0) {
          const firstDept = activeDepts[0];
          const firstDeptId = String(firstDept._id || firstDept.id);
          setSelectedDeptId(firstDeptId);

          if (firstDept.categories && firstDept.categories.length > 0) {
            const firstCat = firstDept.categories[0];
            const firstCatId = String(firstCat._id || firstCat.id || firstCat.name);
            setSelectedCatId(firstCatId);

            if (firstCat.subcategories && firstCat.subcategories.length > 0) {
              const firstSub = firstCat.subcategories[0];
              const firstSubId = String(firstSub._id || firstSub.id || firstSub.name);
              setSelectedSubId(firstSubId);
            }
          }
        }
      } catch (err) {
        console.error('Error loading catalog hierarchy:', err);
        toast.error('Failed to load catalog departments');
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchCatalogHierarchy();
  }, []);

  // Department Dropdown Options
  const departmentOptions = useMemo(() => {
    return departments.map(d => ({
      label: d.name,
      value: String(d._id || d.id)
    }));
  }, [departments]);

  // Selected Department Object
  const currentDepartment = useMemo(() => {
    return departments.find(d => String(d._id || d.id) === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  // Category Dropdown Options (Filtered by selected Department)
  const categoryOptions = useMemo(() => {
    if (!currentDepartment || !Array.isArray(currentDepartment.categories)) return [];
    return currentDepartment.categories.map(c => ({
      label: c.name,
      value: String(c._id || c.id || c.name)
    }));
  }, [currentDepartment]);

  // Selected Category Object
  const currentCategory = useMemo(() => {
    if (!currentDepartment || !Array.isArray(currentDepartment.categories)) return null;
    return currentDepartment.categories.find(c => String(c._id || c.id || c.name) === selectedCatId) || null;
  }, [currentDepartment, selectedCatId]);

  // Subcategory Dropdown Options (Filtered by selected Category)
  const subcategoryOptions = useMemo(() => {
    if (!currentCategory || !Array.isArray(currentCategory.subcategories)) return [];
    return currentCategory.subcategories.map(s => ({
      label: s.name,
      value: String(s._id || s.id || s.name)
    }));
  }, [currentCategory]);

  // Handle Department Change (Reset Category & Subcategory)
  const handleDepartmentChange = (newDeptId) => {
    setSelectedDeptId(newDeptId);
    
    const nextDept = departments.find(d => String(d._id || d.id) === newDeptId);
    if (nextDept && nextDept.categories && nextDept.categories.length > 0) {
      const nextCat = nextDept.categories[0];
      const nextCatId = String(nextCat._id || nextCat.id || nextCat.name);
      setSelectedCatId(nextCatId);

      if (nextCat.subcategories && nextCat.subcategories.length > 0) {
        const nextSub = nextCat.subcategories[0];
        setSelectedSubId(String(nextSub._id || nextSub.id || nextSub.name));
      } else {
        setSelectedSubId('');
      }
    } else {
      setSelectedCatId('');
      setSelectedSubId('');
    }
  };

  // Handle Category Change (Reset Subcategory)
  const handleCategoryChange = (newCatId) => {
    setSelectedCatId(newCatId);

    if (currentDepartment && currentDepartment.categories) {
      const nextCat = currentDepartment.categories.find(c => String(c._id || c.id || c.name) === newCatId);
      if (nextCat && nextCat.subcategories && nextCat.subcategories.length > 0) {
        const nextSub = nextCat.subcategories[0];
        setSelectedSubId(String(nextSub._id || nextSub.id || nextSub.name));
      } else {
        setSelectedSubId('');
      }
    } else {
      setSelectedSubId('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (index, value) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = value;
    setFormData((prev) => ({ ...prev, images: updatedImages }));
  };

  const handleAddImageField = () => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, ''] }));
  };

  const handleRemoveImageField = (index) => {
    if (formData.images.length <= 3) {
      toast.warning('Products require a minimum of 3 images.', 'Validation Requirement');
      return;
    }
    const updatedImages = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, images: updatedImages }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedDeptId || !currentDepartment) {
      toast.warning('Please select a valid department.', 'Validation Warning');
      setLoading(false);
      return;
    }

    if (!selectedCatId || !currentCategory) {
      toast.warning('Please select a valid category.', 'Validation Warning');
      setLoading(false);
      return;
    }

    const currentSubName = subcategoryOptions.find(s => s.value === selectedSubId)?.label || currentCategory.subcategories?.[0]?.name || 'General';

    try {
      const validImages = formData.images.filter(img => img && img.trim() !== '');
      if (validImages.length < 3) {
        toast.warning('Please provide at least 3 valid image URLs.', 'Images Required');
        setLoading(false);
        return;
      }

      const rawPrice = parseFloat(formData.price) || 0;

      const payload = {
        name: formData.name,
        price: rawPrice,
        originalPrice: rawPrice,
        discount: 0,
        department: currentDepartment.name,
        departmentId: currentDepartment._id || currentDepartment.id,
        category: currentCategory.name,
        categoryId: currentCategory._id || currentCategory.id,
        subCategory: currentSubName,
        subcategoryId: currentCategory.subcategories?.find(s => String(s._id || s.id || s.name) === selectedSubId)?._id || null,
        description: formData.description,
        images: validImages,
        image: validImages[0],
        rating: parseFloat(formData.rating) || 4.8,
        stock: parseInt(formData.stock, 10) || 10,
        inventory: parseInt(formData.stock, 10) || 10
      };

      const res = await productAPI.create(payload);

      if (res.success || res._id || res.id || res.product) {
        toast.success('Your luxury product has been published successfully.', 'Product Published');
        setTimeout(() => navigate('/admin/products'), 1200);
      } else {
        toast.error(res.message || 'Failed to create product.', 'Error');
      }
    } catch (err) {
      console.error('Error creating product:', err);
      toast.error('Error connecting to server. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Product Creation">
      <PageHeader
        title="Create New Luxury Product"
        subtitle="Specify classification (Department → Category → Subcategory) and product details"
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

      <form onSubmit={handleSubmit} style={styles.formContainer}>
        {/* Section 1: Catalog Classification (Department -> Category -> Subcategory) */}
        <div style={styles.formSection}>
          <h3 style={styles.sectionHeading}>1. Catalog Classification (Department → Category → Subcategory)</h3>
          
          <div style={styles.grid3}>
            {/* Step 1: Department */}
            <div style={styles.inputGroup}>
              {loadingDepts ? (
                <div style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>Loading departments...</div>
              ) : departmentOptions.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--admin-danger)' }}>
                  No departments available. Create a department in Department Management.
                </div>
              ) : (
                <SelectDropdown
                  label="Department *"
                  placeholder="Select Department"
                  options={departmentOptions}
                  value={selectedDeptId}
                  onChange={handleDepartmentChange}
                  required={true}
                />
              )}
            </div>

            {/* Step 2: Category (Cascading Dependent Dropdown) */}
            <div style={styles.inputGroup}>
              {categoryOptions.length === 0 ? (
                <div>
                  <label style={styles.label}>Category *</label>
                  <div style={styles.emptyNoticeBox}>
                    No categories available for this department.
                  </div>
                </div>
              ) : (
                <SelectDropdown
                  label="Category *"
                  placeholder="Select Category"
                  options={categoryOptions}
                  value={selectedCatId}
                  onChange={handleCategoryChange}
                  required={true}
                />
              )}
            </div>

            {/* Step 3: Subcategory (Cascading Dependent Dropdown) */}
            <div style={styles.inputGroup}>
              {subcategoryOptions.length === 0 ? (
                <div>
                  <label style={styles.label}>Subcategory *</label>
                  <div style={styles.emptyNoticeBox}>
                    No subcategories available.
                  </div>
                </div>
              ) : (
                <SelectDropdown
                  label="Subcategory *"
                  placeholder="Select Subcategory"
                  options={subcategoryOptions}
                  value={selectedSubId}
                  onChange={(val) => setSelectedSubId(val)}
                  required={true}
                />
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Basic Product Details */}
        <div style={styles.formSection}>
          <h3 style={styles.sectionHeading}>2. Basic Product Details</h3>
          
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="name">Product Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Kanchipuram Silk Saree / Premium Oxford Shirt"
              maxLength={100}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="description">Product Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Provide a detailed description of the design, fabric, embellishments, and fit..."
              required
              style={styles.textarea}
            />
          </div>
        </div>

        {/* Section 3: Pricing, Rating & Stock */}
        <div style={styles.formSection}>
          <h3 style={styles.sectionHeading}>3. Pricing, Rating & Stock</h3>
          
          <div style={styles.grid3}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="price">Price (₹) *</label>
              <input
                id="price"
                type="number"
                step="1"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 2499"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="rating">Product Rating (0 - 5.0)</label>
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

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="stock">Stock Quantity *</label>
              <input
                id="stock"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="10"
                required
                min="0"
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Product Media Gallery */}
        <div style={styles.formSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={styles.sectionHeading}>4. Product Gallery (Minimum 3 Images Required)</h3>
              <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', margin: '2px 0 0' }}>
                Image 1 is used for product card thumbnails. Image 2 & 3 populate the detailed gallery view.
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
            {loading ? 'Publishing Product...' : 'Publish Product to Catalog'}
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
    padding: '14px 28px',
    backgroundColor: 'var(--admin-gold)',
    color: 'var(--active-pill-text, #0D0D10)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 14px rgba(212, 175, 55, 0.25)',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  addImageBtn: {
    padding: '6px 14px',
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    color: 'var(--admin-gold)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1100px',
    margin: '0 auto'
  },
  formSection: {
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    boxShadow: 'var(--admin-shadow-sm)'
  },
  sectionHeading: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--admin-text-primary)',
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
    color: 'var(--admin-gold)'
  },
  emptyNoticeBox: {
    padding: '10px 12px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '6px',
    color: 'var(--admin-text-secondary)',
    fontSize: '12px',
    fontStyle: 'italic'
  },
  input: {
    padding: '12px 14px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '6px',
    color: 'var(--admin-text-primary)',
    fontSize: '13px',
    outline: 'none'
  },
  readOnlyDisplay: {
    padding: '12px 14px',
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '6px',
    color: 'var(--admin-gold)',
    fontSize: '16px',
    fontWeight: '700',
    fontFamily: "var(--font-serif, 'Playfair Display', serif)"
  },
  textarea: {
    padding: '12px 14px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '6px',
    color: 'var(--admin-text-primary)',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  imageCardBox: {
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-border-subtle)',
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
    color: 'var(--admin-gold)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  removeImgBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-danger)',
    fontSize: '16px',
    cursor: 'pointer',
    lineHeight: '1'
  },
  thumbWrapper: {
    width: '100%',
    height: '140px',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: 'var(--admin-surface-2)',
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
    color: 'var(--admin-text-muted)'
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '12px'
  }
};

export default NewProduct;