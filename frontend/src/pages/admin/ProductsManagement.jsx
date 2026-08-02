import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import SelectDropdown from '../../components/admin/SelectDropdown';
import BulkUploadModal from '../../components/admin/BulkUploadModal';
import Button from '../../components/admin/Button';
import { productAPI, categoryAPI } from '../../utils/api';
import { Edit2, Trash2, Upload, Plus } from 'lucide-react';

const DEFAULT_IMAGE_SET = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'
];

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit Product Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    price: 0,
    category: '',
    subCategory: '',
    description: '',
    rating: 4.8,
    stock: 10,
    images: [...DEFAULT_IMAGE_SET]
  });
  const [editLoading, setEditLoading] = useState(false);

  // Bulk Upload Modal state
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const navigate = useNavigate();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productAPI.getAll();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      } else if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Filter 8 & User Refinement 1: Product Filter includes ALL categories (Active + Disabled)
  const catalogFilterOptions = useMemo(() => {
    const opts = [{ label: 'All Categories', value: 'ALL' }];
    const uniqueCatNames = new Set(categories.map(c => c.name));
    products.forEach(p => {
      if (p.category) uniqueCatNames.add(p.category);
    });
    Array.from(uniqueCatNames).sort().forEach(catName => {
      opts.push({ label: catName, value: catName });
    });
    return opts;
  }, [categories, products]);

  // Filter 8 & User Refinement 2: Edit Product options include active categories + preserve current product category if disabled
  const editCategoryOptions = useMemo(() => {
    const activeCats = categories
      .filter(c => c.isEnabled !== false)
      .map(c => c.name);

    if (selectedProduct && selectedProduct.category && !activeCats.includes(selectedProduct.category)) {
      activeCats.push(selectedProduct.category);
    }

    return Array.from(new Set(activeCats))
      .sort((a, b) => a.localeCompare(b))
      .map(cat => ({ label: cat, value: cat }));
  }, [categories, selectedProduct]);

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    setDeleteLoading(true);
    try {
      const res = await productAPI.delete(selectedProduct._id || selectedProduct.id);
      if (res.success || res.message) {
        setMessage('Product removed successfully.');
        setProducts(prev => prev.filter(p => (p._id || p.id) !== (selectedProduct._id || selectedProduct.id)));
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    
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
      id: product._id || product.id,
      name: product.name || '',
      price: product.price || 0,
      category: product.category || "Women's Couture",
      subCategory: product.subCategory || 'General',
      description: product.description || '',
      rating: product.rating || 4.5,
      stock: product.stock !== undefined ? product.stock : (product.inventory !== undefined ? product.inventory : 10),
      images: prodImages
    });
    setEditModalOpen(true);
  };

  const handleEditImageChange = (index, value) => {
    const updated = [...editFormData.images];
    updated[index] = value;
    setEditFormData(prev => ({ ...prev, images: updated }));
  };

  const handleAddEditImageField = () => {
    setEditFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const handleRemoveEditImageField = (index) => {
    if (editFormData.images.length <= 3) {
      alert('Every product must support at least 3 images minimum.');
      return;
    }
    const updated = editFormData.images.filter((_, i) => i !== index);
    setEditFormData(prev => ({ ...prev, images: updated }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
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

      const res = await productAPI.update(selectedProduct._id || selectedProduct.id, updatePayload);
      if (res.success || res.product || res._id) {
        setMessage('Product details updated successfully.');
        loadProducts();
        setEditModalOpen(false);
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

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const columns = [
    {
      header: 'Product',
      accessor: 'name',
      render: (row) => {
        const mainImg = row.images?.[0] || row.image || DEFAULT_IMAGE_SET[0];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={mainImg}
              alt={row.name}
              style={{
                width: '44px',
                height: '54px',
                objectFit: 'cover',
                borderRadius: '6px',
                backgroundColor: '#0B0B0E',
                border: '1px solid rgba(212, 175, 55, 0.2)'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '600', color: '#F9F6F0' }}>{row.name}</span>
              <span style={{ fontSize: '11px', color: '#A0A0AB' }}>
                SKU: {row.sku || (row._id || row.id || '').slice(-6).toUpperCase()}
              </span>
            </div>
          </div>
        );
      },
      sortable: true
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: '500', color: '#F9F6F0' }}>{row.category || "Women's"}</span>
          <span style={{ fontSize: '11px', color: '#A0A0AB' }}>{row.subCategory || 'Couture'}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Price (₹)',
      accessor: 'price',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '600', fontFamily: "'Playfair Display', serif", color: '#D4AF37' }}>
          ₹{Math.round(row.price || 0).toLocaleString('en-IN')}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Stock Status',
      accessor: 'stock',
      align: 'center',
      render: (row) => {
        const stock = row.stock !== undefined ? row.stock : (row.inventory !== undefined ? row.inventory : 10);
        if (stock === 0) return <StatusBadge status="out_of_stock" />;
        if (stock <= 5) return <StatusBadge status="low_stock" customLabel={`${stock} left`} />;
        return <StatusBadge status="in_stock" customLabel={`${stock} in stock`} />;
      },
      sortable: true
    },
    {
      header: 'Actions',
      align: 'right',
      width: '110px',
      render: (row) => (
        <div style={{ paddingRight: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <ActionMenu
            items={[
              {
                label: 'Edit Product',
                icon: <Edit2 size={14} color="#D4AF37" />,
                onClick: () => openEditModal(row)
              },
              {
                label: 'Delete Product',
                icon: <Trash2 size={14} color="#EF4444" />,
                danger: true,
                onClick: () => openDeleteModal(row)
              }
            ]}
          />
        </div>
      )
    }
  ];

  return (
    <AdminLayout title="Products Catalog">
      <PageHeader
        title="Products Management"
        subtitle="View, edit, and organize luxury inventory items with 3-image support"
        breadcrumbs={[{ label: 'Products' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              onClick={() => setBulkUploadOpen(true)}
              variant="secondary"
              icon={<Upload size={14} />}
              title="Bulk import products from Excel"
            >
              Bulk Upload
            </Button>
            <Button
              to="/admin/new-product"
              variant="primary"
              icon={<Plus size={15} />}
            >
              Add New Product
            </Button>
          </div>
        }
      />

      {message && (
        <div style={styles.alertNotice}>
          <span>{message}</span>
          <button onClick={() => setMessage('')} style={styles.alertClose}>×</button>
        </div>
      )}

      {/* Main Products Table */}
      <DataTable
        columns={columns}
        data={products.map(p => ({
          ...p,
          stockStatus: (p.stock || 0) === 0 ? 'out_of_stock' : (p.stock || 0) < 5 ? 'low_stock' : 'in_stock'
        }))}
        loading={loading}
        onRowClick={(row) => navigate(`/admin/products/${row._id || row.id}`)}
        searchPlaceholder="Search products by name, SKU, or category..."
        filterKey="category"
        filterLabel="All Categories"
        filterOptions={catalogFilterOptions}
        secondaryFilterKey="stockStatus"
        secondaryFilterLabel="All Status"
        secondaryFilterOptions={[
          { label: 'All Status', value: 'ALL' },
          { label: 'In Stock', value: 'in_stock' },
          { label: 'Low Stock', value: 'low_stock' },
          { label: 'Out of Stock', value: 'out_of_stock' }
        ]}
        emptyTitle="No Products Found"
        emptyDescription="Start adding luxury fashion products to populate your store catalog."
        onEmptyAction={() => navigate('/admin/new-product')}
        emptyActionLabel="+ Add First Product"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete Product"
        danger={true}
        loading={deleteLoading}
      />

      {/* Bulk Product Upload Modal */}
      <BulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSuccess={() => {
          loadProducts();
          setMessage('Bulk product import completed successfully.');
        }}
        existingProducts={products}
      />

      {/* Full 3-Image Product Edit Form Modal */}
      {editModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setEditModalOpen(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Product & Image Gallery</h3>
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
                  {/* Category Dropdown with Active Categories + Preserved Disabled Category */}
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

              {/* 3 Images Minimum Gallery Controls */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={styles.label}>Product Gallery (3 Images Minimum)</label>
                  <button
                    type="button"
                    onClick={handleAddEditImageField}
                    style={styles.smallAddBtn}
                  >
                    + Add Image URL
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {editFormData.images.map((imgUrl, idx) => (
                    <div key={idx} style={styles.editImgCard}>
                      <div style={styles.editImgHeader}>
                        <span style={{ fontSize: '10px', color: '#D4AF37', fontWeight: '700' }}>
                          {idx === 0 ? 'Image 1 (Main Card)' : `Image ${idx + 1} (Gallery)`}
                        </span>
                        {editFormData.images.length > 3 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditImageField(idx)}
                            style={styles.removeImgBtn}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <img
                        src={imgUrl || DEFAULT_IMAGE_SET[idx % 3]}
                        alt={`Thumb ${idx + 1}`}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Invalid+Image'; }}
                        style={styles.editThumb}
                      />
                      <input
                        type="url"
                        value={imgUrl}
                        onChange={(e) => handleEditImageChange(idx, e.target.value)}
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
                  {editLoading ? 'Saving Changes...' : 'Save Product Changes'}
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
    fontWeight: '500',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  goldOutlineBtn: {
    padding: '9px 16px',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    color: '#D4AF37',
    borderRadius: '24px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  smallAddBtn: {
    padding: '4px 10px',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    color: '#D4AF37',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  alertNotice: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#10B981',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  alertClose: {
    background: 'none',
    border: 'none',
    color: '#10B981',
    fontSize: '18px',
    cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#141418',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '12px'
  },
  modalTitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '18px',
    fontWeight: '600',
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
    gap: '14px'
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
    padding: '10px 12px',
    backgroundColor: '#0B0B0E',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    color: '#F9F6F0',
    fontSize: '13px',
    outline: 'none'
  },
  textarea: {
    padding: '10px 12px',
    backgroundColor: '#0B0B0E',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    color: '#F9F6F0',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  editImgCard: {
    backgroundColor: '#0B0B0E',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  editImgHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  removeImgBtn: {
    background: 'none',
    border: 'none',
    color: '#EF4444',
    fontSize: '16px',
    cursor: 'pointer'
  },
  editThumb: {
    width: '100%',
    height: '90px',
    objectFit: 'cover',
    borderRadius: '4px'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
  },
  // View Product Drawer Styles
  viewMediaContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  viewHeroWrapper: {
    position: 'relative',
    width: '100%',
    height: '240px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(212, 175, 55, 0.25)',
    backgroundColor: '#0D0D11'
  },
  viewHeroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  heroOverlayBadge: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(5, 5, 8, 0.75)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '20px',
    padding: '4px 10px',
    fontSize: '11px',
    color: '#D4AF37',
    fontWeight: '600'
  },
  viewThumbGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px'
  },
  viewThumbWrapper: {
    height: '70px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: '#0D0D11'
  },
  viewThumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  viewCardBox: {
    backgroundColor: '#0D0D11',
    padding: '18px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column'
  },
  categoryBadge: {
    fontSize: '11px',
    color: '#D4AF37',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    padding: '4px 10px',
    borderRadius: '14px',
    border: '1px solid rgba(212, 175, 55, 0.25)'
  },
  subCategoryBadge: {
    fontSize: '11px',
    color: '#A0A0AB',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '4px 10px',
    borderRadius: '14px'
  },
  viewTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '22px',
    fontWeight: '700',
    color: '#F9F6F0',
    margin: '0 0 10px 0'
  },
  viewDescription: {
    fontSize: '13px',
    color: '#A0A0AB',
    lineHeight: '1.6',
    margin: 0
  },
  cardHeaderTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: '6px'
  },
  metaLabel: {
    fontSize: '11px',
    color: '#A0A0AB',
    display: 'block'
  },
  priceGold: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '24px',
    color: '#D4AF37',
    fontWeight: '700'
  },
  origPriceStrikethrough: {
    fontSize: '14px',
    color: '#A0A0AB',
    textDecoration: 'line-through'
  },
  discountPill: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: '3px 8px',
    borderRadius: '10px',
    border: '1px solid rgba(16, 185, 129, 0.3)'
  },
  taxBadge: {
    fontSize: '11px',
    color: '#A0A0AB',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  specValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#F9F6F0',
    display: 'block',
    marginTop: '4px'
  },
  viewMetadataBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
};

export default ProductsManagement;