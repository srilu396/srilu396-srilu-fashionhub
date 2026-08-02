import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import Button from '../../components/admin/Button';
import { categoryAPI, productAPI } from '../../utils/api';
import { Plus, Tag, Pencil, Eye, EyeOff, Trash2, AlertTriangle, X } from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    isEnabled: true
  });
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [validationError, setValidationError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catData, prodData] = await Promise.all([
        categoryAPI.getAll(),
        productAPI.getAll().catch(() => ({ products: [] }))
      ]);

      if (catData && catData.success && Array.isArray(catData.categories)) {
        setCategories(catData.categories);
      }
      if (prodData && Array.isArray(prodData.products)) {
        setProducts(prodData.products);
      } else if (Array.isArray(prodData)) {
        setProducts(prodData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setValidationError('');
    setEditCategory(null);
    setFormData({ name: '', description: '', image: '', isEnabled: true });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setValidationError('');
    setEditCategory(cat);
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      isEnabled: cat.isEnabled !== undefined ? cat.isEnabled : true
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setValidationError('');
    try {
      if (editCategory) {
        await categoryAPI.update(editCategory._id || editCategory.id, formData);
      } else {
        await categoryAPI.create(formData);
      }
      fetchData();
      setModalOpen(false);
    } catch (err) {
      setValidationError(err.message || 'Error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    const targetId = String(cat._id || cat.id || '');
    if (!targetId) return;

    setValidationError('');
    try {
      await categoryAPI.toggleStatus(targetId, !cat.isEnabled);
      setCategories(prev => prev.map(c => {
        const currentId = String(c._id || c.id || '');
        return currentId === targetId ? { ...c, isEnabled: !c.isEnabled } : c;
      }));
    } catch (err) {
      console.error('Error toggling category status:', err);
      setValidationError(err.message || 'Error updating category status');
    }
  };

  const handleDeleteClick = (cat) => {
    setValidationError('');

    // Condition 2 Check: Must be Disabled first
    if (cat.isEnabled) {
      setValidationError('Disable this category before deleting it.');
      return;
    }

    // Condition 1 Check: Category contains 0 associated products
    const associatedProducts = products.filter(p => {
      const pCat = String(p.category || '').toLowerCase().trim();
      const catName = String(cat.name || '').toLowerCase().trim();
      const catId = String(cat._id || cat.id || '').toLowerCase().trim();
      return pCat === catName || pCat === catId;
    });

    if (associatedProducts.length > 0) {
      setValidationError('This category cannot be deleted because it still contains products.');
      return;
    }

    setSelectedCategory(cat);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    setDeleteLoading(true);
    setValidationError('');
    try {
      const res = await categoryAPI.delete(selectedCategory._id || selectedCategory.id);
      if (res && res.success === false) {
        setValidationError(res.message || 'Failed to delete category.');
      } else {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setValidationError(err.message || 'Error deleting category. Please try again.');
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setSelectedCategory(null);
    }
  };

  const columns = [
    {
      header: 'Category Name',
      accessor: 'name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {row.image ? (
            <img 
              src={row.image} 
              alt={row.name} 
              style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(212,175,55,0.3)' }} 
            />
          ) : (
            <div style={styles.iconBox}>
              <Tag size={18} color="var(--admin-gold, #D4AF37)" />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', color: 'var(--admin-text-primary, #F9F6F0)' }}>{row.name}</span>
            <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary, #A0A0AB)' }}>/{row.slug || 'category'}</span>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => <span style={{ color: 'var(--admin-text-secondary, #A0A0AB)', fontSize: '12px' }}>{row.description || 'No description'}</span>
    },
    {
      header: 'Status',
      accessor: (row) => row.isEnabled ? 'active' : 'inactive',
      align: 'center',
      render: (row) => (
        <StatusBadge 
          status={row.isEnabled ? 'active' : 'inactive'} 
          customLabel={row.isEnabled ? 'Enabled' : 'Disabled'} 
        />
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <ActionMenu
          items={[
            { 
              label: 'Edit Category', 
              icon: <Pencil size={14} color="var(--admin-gold, #D4AF37)" />,
              onClick: () => handleOpenEdit(row) 
            },
            { 
              label: row.isEnabled ? 'Disable Category' : 'Enable Category', 
              icon: row.isEnabled 
                ? <EyeOff size={14} color="var(--admin-text-secondary, #A0A0AB)" /> 
                : <Eye size={14} color="var(--admin-gold, #D4AF37)" />,
              onClick: () => handleToggleStatus(row) 
            },
            { 
              label: 'Delete Category', 
              icon: <Trash2 size={14} color="var(--admin-danger, #EF4444)" />,
              danger: true, 
              onClick: () => handleDeleteClick(row) 
            }
          ]}
        />
      )
    }
  ];

  return (
    <AdminLayout title="Category Management">
      <PageHeader
        title="Product Categories"
        subtitle="Manage haute couture collections, enable/disable categories, and edit collection imagery"
        breadcrumbs={[{ label: 'Categories' }]}
        actions={
          <Button onClick={handleOpenCreate} variant="primary" icon={<Plus size={15} />}>
            Create Category
          </Button>
        }
      />

      {validationError && (
        <div style={styles.alertNotice}>
          <AlertTriangle size={16} color="var(--admin-danger, #EF4444)" />
          <span style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: 'var(--admin-text-primary, #F9F6F0)' }}>
            {validationError}
          </span>
          <button onClick={() => setValidationError('')} style={styles.alertClose}>
            <X size={14} />
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        searchPlaceholder="Search categories..."
        filterKey="isEnabled"
        filterLabel="All Status"
        filterOptions={[
          { label: 'All Status', value: 'ALL' },
          { label: 'Enabled', value: 'true' },
          { label: 'Disabled', value: 'false' }
        ]}
        emptyTitle="No Categories Found"
        emptyDescription="Create your first couture collection category."
      />

      {/* Create / Edit Category Modal */}
      {modalOpen && (
        <div style={styles.modalBackdrop} onClick={() => setModalOpen(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={styles.modalClose}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={styles.formStack}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Royal Sherwanis"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Category Image Banner (URL)</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of this couture category..."
                  rows="3"
                  style={styles.textarea}
                />
              </div>

              <div style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  style={{ accentColor: '#D4AF37' }}
                />
                <label htmlFor="isEnabled" style={{ color: '#F9F6F0', fontSize: '13px', cursor: 'pointer' }}>
                  Enable Category (Visible in Product Creation)
                </label>
              </div>

              <div style={styles.modalActions}>
                <Button type="button" onClick={() => setModalOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} variant="primary">
                  {submitting ? 'Saving...' : (editCategory ? 'Update Category' : 'Create Category')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete category "${selectedCategory?.name}"?`}
        confirmText="Delete Category"
        danger={true}
        loading={deleteLoading}
      />
    </AdminLayout>
  );
};

const styles = {
  alertNotice: {
    padding: '12px 18px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 'var(--radius-sm, 8px)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },
  alertClose: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-secondary, #A0A0AB)',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center'
  },
  iconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    backgroundColor: 'rgba(212,175,55,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCard: {
    width: '460px',
    backgroundColor: '#141419',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '10px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0E0E12'
  },
  modalTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '18px',
    fontWeight: '600',
    color: '#F9F6F0',
    margin: 0
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#A0A0AB',
    fontSize: '20px',
    cursor: 'pointer'
  },
  formStack: {
    padding: '24px',
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
    fontSize: '11px',
    color: '#D4AF37',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
  },
  input: {
    padding: '10px 14px',
    backgroundColor: '#0D0D11',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    color: '#F9F6F0',
    fontSize: '13px',
    outline: 'none'
  },
  textarea: {
    padding: '10px 14px',
    backgroundColor: '#0D0D11',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    color: '#F9F6F0',
    fontSize: '13px',
    outline: 'none',
    resize: 'vertical'
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px'
  }
};

export default CategoryManagement;
