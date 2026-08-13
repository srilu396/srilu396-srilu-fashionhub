import React, { useState, useEffect, useMemo, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import Button from '../../components/admin/Button';
import { categoryAPI, productAPI } from '../../utils/api';
import { Plus, Tag, Pencil, Eye, EyeOff, Trash2, AlertTriangle, X, ChevronDown, ChevronRight, Layers, Upload, Download, FileText, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../components/common/Toast/useToast';

const CategoryManagement = () => {
  const toast = useToast();
  const deptFileInputRef = useRef(null);
  const [departments, setDepartments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDeptFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPEG, PNG, WEBP).', 'Invalid File');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Department image must be under 3 MB.', 'File Size Limit');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result }));
      toast.success('Department image loaded from device.', 'Image Ready');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Department Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    isEnabled: true,
    categories: []
  });
  const [submitting, setSubmitting] = useState(false);

  // Bulk Import Modal State
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Expanded department cards in main table/view
  const [expandedDeptIds, setExpandedDeptIds] = useState(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptData, prodData] = await Promise.all([
        categoryAPI.getAll(),
        productAPI.getAll().catch(() => ({ products: [] }))
      ]);

      if (deptData && deptData.success && Array.isArray(deptData.departments)) {
        setDepartments(deptData.departments);
      } else if (deptData && deptData.success && Array.isArray(deptData.categories)) {
        setDepartments(deptData.categories);
      }

      if (prodData && Array.isArray(prodData.products)) {
        setProducts(prodData.products);
      } else if (Array.isArray(prodData)) {
        setProducts(prodData);
      }
    } catch (err) {
      console.error('Error loading department data:', err);
      toast.error('Error loading department catalog information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setValidationError('');
    setEditDept(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      isEnabled: true,
      categories: [
        { name: 'Western Wear', subcategories: [{ name: 'Tops' }, { name: 'Dresses' }] }
      ]
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setValidationError('');
    setEditDept(dept);
    
    const categoriesCopy = (dept.categories || []).map(cat => ({
      _id: cat._id,
      name: cat.name || '',
      subcategories: (cat.subcategories || []).map(sub => ({
        _id: sub._id,
        name: sub.name || ''
      }))
    }));

    setFormData({
      name: dept.name || '',
      description: dept.description || '',
      image: dept.image || '',
      isEnabled: dept.isEnabled !== undefined ? dept.isEnabled : true,
      categories: categoriesCopy
    });
    setModalOpen(true);
  };

  const handleAddCategoryField = () => {
    setFormData(prev => ({
      ...prev,
      categories: [
        ...prev.categories,
        { name: '', subcategories: [] }
      ]
    }));
  };

  const handleRemoveCategoryField = (catIndex) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, idx) => idx !== catIndex)
    }));
  };

  const handleCategoryNameChange = (catIndex, newName) => {
    setFormData(prev => {
      const updated = [...prev.categories];
      updated[catIndex] = { ...updated[catIndex], name: newName };
      return { ...prev, categories: updated };
    });
  };

  const handleAddSubcategoryField = (catIndex, subName) => {
    if (!subName || !subName.trim()) return;
    setFormData(prev => {
      const updated = [...prev.categories];
      const currentSubs = updated[catIndex].subcategories || [];
      updated[catIndex] = {
        ...updated[catIndex],
        subcategories: [...currentSubs, { name: subName.trim() }]
      };
      return { ...prev, categories: updated };
    });
  };

  const handleRemoveSubcategoryField = (catIndex, subIndex) => {
    setFormData(prev => {
      const updated = [...prev.categories];
      const currentSubs = updated[catIndex].subcategories.filter((_, idx) => idx !== subIndex);
      updated[catIndex] = { ...updated[catIndex], subcategories: currentSubs };
      return { ...prev, categories: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setValidationError('');

    if (!formData.name.trim()) {
      setValidationError('Department name is required');
      setSubmitting(false);
      return;
    }

    try {
      if (editDept) {
        await categoryAPI.update(editDept._id || editDept.id, formData);
        toast.success(`Department "${formData.name}" updated successfully.`, 'Department Updated');
      } else {
        await categoryAPI.create(formData);
        toast.success(`Department "${formData.name}" created successfully.`, 'Department Created');
      }
      fetchData();
      setModalOpen(false);
    } catch (err) {
      const msg = err.message || 'Error saving department';
      setValidationError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    const targetId = String(dept._id || dept.id || '');
    if (!targetId) return;

    setValidationError('');
    try {
      await categoryAPI.toggleStatus(targetId, !dept.isEnabled);
      setDepartments(prev => prev.map(d => {
        const currentId = String(d._id || d.id || '');
        return currentId === targetId ? { ...d, isEnabled: !d.isEnabled } : d;
      }));
      toast.info(`Department "${dept.name}" ${!dept.isEnabled ? 'enabled' : 'disabled'}.`, 'Status Updated');
    } catch (err) {
      console.error('Error toggling department status:', err);
      const msg = err.message || 'Error updating department status';
      setValidationError(msg);
      toast.error(msg);
    }
  };

  const handleDeleteClick = async (dept) => {
    setValidationError('');

    // Fetch latest products to ensure up-to-date association check
    let currentProducts = products;
    try {
      const prodRes = await productAPI.getAll();
      if (prodRes && Array.isArray(prodRes.products)) {
        currentProducts = prodRes.products;
        setProducts(currentProducts);
      } else if (Array.isArray(prodRes)) {
        currentProducts = prodRes;
        setProducts(currentProducts);
      }
    } catch (err) {
      console.warn('Unable to refresh products list prior to delete check:', err);
    }

    const deptName = String(dept.name || '').toLowerCase().trim();
    const deptId = String(dept._id || dept.id || '').toLowerCase().trim();
    const catNames = (dept.categories || []).map(c => String(c.name || '').toLowerCase().trim());
    const catIds = (dept.categories || []).map(c => String(c._id || '').toLowerCase().trim());

    const associatedProducts = currentProducts.filter(p => {
      const pDept = String(p.department || '').toLowerCase().trim();
      const pDeptId = String(p.departmentId || '').toLowerCase().trim();
      const pCat = String(p.category || '').toLowerCase().trim();
      const pCatId = String(p.categoryId || '').toLowerCase().trim();
      
      return pDept === deptName || pDeptId === deptId || pCat === deptName || catNames.includes(pCat) || catIds.includes(pCatId);
    });

    if (associatedProducts.length > 0) {
      const msg = `Department "${dept.name}" cannot be deleted because ${associatedProducts.length} product(s) are currently associated with it. Please delete or reassign those products first.`;
      setValidationError(msg);
      toast.warning(msg);
      return;
    }

    setSelectedDept(dept);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDept) return;
    setDeleteLoading(true);
    setValidationError('');
    try {
      const res = await categoryAPI.delete(selectedDept._id || selectedDept.id);
      if (res && res.success === false) {
        const msg = res.message || 'Failed to delete department.';
        setValidationError(msg);
        toast.error(msg);
      } else {
        toast.success(`Department "${selectedDept.name}" deleted successfully.`, 'Deleted Successfully');
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting department:', err);
      const msg = err.message || 'Error deleting department. Please try again.';
      setValidationError(msg);
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setSelectedDept(null);
    }
  };

  const toggleExpandDept = (id) => {
    setExpandedDeptIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns = [
    {
      header: 'Department',
      accessor: 'name',
      render: (row) => {
        const rowId = String(row._id || row.id);
        const isExpanded = expandedDeptIds.has(rowId);
        const catCount = (row.categories || []).length;
        const subCount = (row.categories || []).reduce((acc, c) => acc + (c.subcategories || []).length, 0);

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpandDept(rowId); }}
              style={styles.expandToggleBtn}
              title="Expand categories & subcategories"
            >
              {isExpanded ? <ChevronDown size={16} color="var(--admin-gold)" /> : <ChevronRight size={16} color="var(--admin-text-secondary)" />}
            </button>
            {row.image ? (
              <img 
                src={row.image} 
                alt={row.name} 
                style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--admin-border-subtle)' }} 
              />
            ) : (
              <div style={styles.iconBox}>
                <Tag size={18} color="var(--admin-gold)" />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '600', color: 'var(--admin-text-primary)', fontSize: '14px' }}>{row.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--admin-gold)', fontWeight: '500' }}>
                {catCount} Categories • {subCount} Subcategories
              </span>
            </div>
          </div>
        );
      },
      sortable: true
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => <span style={{ color: 'var(--admin-text-secondary)', fontSize: '12px' }}>{row.description || 'No description provided'}</span>
    },
    {
      header: 'Status',
      accessor: (row) => row.isEnabled ? 'active' : 'inactive',
      align: 'center',
      render: (row) => (
        <StatusBadge 
          status={row.isEnabled ? 'active' : 'inactive'} 
          customLabel={row.isEnabled ? 'Active' : 'Disabled'} 
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
              label: 'Manage / Edit Department', 
              icon: <Pencil size={14} color="var(--admin-gold)" />,
              onClick: () => handleOpenEdit(row) 
            },
            { 
              label: row.isEnabled ? 'Disable Department' : 'Enable Department', 
              icon: row.isEnabled 
                ? <EyeOff size={14} color="var(--admin-text-secondary)" /> 
                : <Eye size={14} color="var(--admin-gold)" />,
              onClick: () => handleToggleStatus(row) 
            },
            { 
              label: 'Delete Department', 
              icon: <Trash2 size={14} color="var(--admin-danger)" />,
              danger: true, 
              onClick: () => handleDeleteClick(row) 
            }
          ]}
        />
      )
    }
  ];

  return (
    <AdminLayout title="Department Management">
      {/* Top-Right Header Action Placement (Consistently aligned across pages) */}
      <PageHeader
        title="Department & Catalog Management"
        subtitle="Organize multi-tier hierarchy (Department → Category → Subcategory) for SriluFashionHub"
        breadcrumbs={[{ label: 'Department Management' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              onClick={() => setBulkImportOpen(true)}
              variant="secondary"
              icon={<Upload size={14} />}
              title="Bulk import department, category & subcategory catalog hierarchy"
            >
              Bulk Import
            </Button>
            <Button onClick={handleOpenCreate} variant="primary" icon={<Plus size={15} />}>
              Create Department
            </Button>
          </div>
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

      {/* Main Department List with Expandable Hierarchy Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <DataTable
          columns={columns}
          data={departments}
          loading={loading}
          searchPlaceholder="Search departments by name or description..."
          filterKey="isEnabled"
          filterLabel="All Status"
          filterOptions={[
            { label: 'All Status', value: 'ALL' },
            { label: 'Active', value: 'true' },
            { label: 'Disabled', value: 'false' }
          ]}
          emptyTitle="No Departments Found"
          emptyDescription="Create your first department to start structuring your fashion catalog."
          onRowClick={(row) => toggleExpandDept(String(row._id || row.id))}
        />

        {/* Expanded Department Subtree Cards */}
        {departments.filter(d => expandedDeptIds.has(String(d._id || d.id))).map((dept) => (
          <div key={dept._id || dept.id} style={styles.expandedSubtreeCard}>
            <div style={styles.subtreeHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} color="var(--admin-gold)" />
                <h4 style={styles.subtreeTitle}>{dept.name} — Catalog Structure</h4>
              </div>
              <button onClick={() => handleOpenEdit(dept)} style={styles.smallGoldBtn}>
                <Pencil size={12} /> Edit Categories
              </button>
            </div>

            <div style={styles.categoryGrid}>
              {(dept.categories && dept.categories.length > 0) ? (
                dept.categories.map((cat, cIdx) => (
                  <div key={cat._id || cIdx} style={styles.categoryBox}>
                    <div style={styles.categoryBoxTitle}>
                      <span style={{ fontWeight: '600', color: 'var(--admin-gold)' }}>Category:</span> {cat.name}
                    </div>
                    <div style={styles.subcategoryTagWrapper}>
                      {(cat.subcategories && cat.subcategories.length > 0) ? (
                        cat.subcategories.map((sub, sIdx) => (
                          <span key={sub._id || sIdx} style={styles.subcategoryPill}>
                            {sub.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)', italic: 'true' }}>No subcategories added</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', padding: '12px' }}>
                  No categories added to this department yet. Click "Edit Categories" to populate.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Department Modal */}
      {modalOpen && (
        <div style={styles.modalBackdrop} onClick={() => setModalOpen(false)}>
          <div style={{ ...styles.modalCard, width: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editDept ? 'Edit Department & Categories' : 'Create New Department'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={styles.modalClose}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={styles.formStack}>
              <input
                type="file"
                ref={deptFileInputRef}
                onChange={handleDeptFileChange}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                style={{ display: 'none' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Department Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Women's Fashion"
                    required
                    style={styles.input}
                  />
                </div>

                {/* Department Image — Dual Method Input (Upload from System OR Image URL) */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Department Image</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: formData.image ? '120px 1fr' : '1fr',
                    gap: '16px',
                    alignItems: 'center',
                    padding: '14px',
                    backgroundColor: 'var(--admin-surface-2)',
                    border: '1px solid var(--admin-border-subtle)',
                    borderRadius: '10px'
                  }}>
                    {/* Live Image Preview Box */}
                    {formData.image && (
                      <div style={{ position: 'relative', width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border-subtle)', flexShrink: 0 }}>
                        <img
                          src={formData.image}
                          alt="Department Preview"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/200x120?text=Invalid+Image';
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Method 1: Upload from System */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => deptFileInputRef.current?.click()}
                          style={styles.smallGoldBtn}
                        >
                          <Upload size={13} />
                          Option A — Upload Image from System
                        </button>
                        {formData.image && formData.image.startsWith('data:') && (
                          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>✓ Local file selected</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--admin-border-subtle)' }} />
                        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--admin-gold)', letterSpacing: '1px' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--admin-border-subtle)' }} />
                      </div>

                      {/* Method 2: Image URL */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--admin-text-secondary)' }}>Option B — Image URL</span>
                        <input
                          type="url"
                          value={formData.image.startsWith('data:') ? '' : formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          placeholder="https://images.unsplash.com/... or online image URL"
                          style={styles.input}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of products inside this department..."
                  rows="2"
                  style={styles.textarea}
                />
              </div>

              <div style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  id="isEnabledDept"
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  style={{ accentColor: 'var(--admin-gold)', cursor: 'pointer' }}
                />
                <label htmlFor="isEnabledDept" style={{ color: 'var(--admin-text-primary)', fontSize: '13px', cursor: 'pointer' }}>
                  Active Department (Visible in Product Creation)
                </label>
              </div>

              {/* Department Categories & Subcategories Management Section */}
              <div style={styles.categoriesEditorSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={styles.label}>Categories & Subcategories Hierarchy</label>
                  <button
                    type="button"
                    onClick={handleAddCategoryField}
                    style={styles.smallGoldBtn}
                  >
                    + Add Category
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                  {formData.categories.map((cat, cIdx) => (
                    <CategoryEditorCard
                      key={cIdx}
                      catIndex={cIdx}
                      category={cat}
                      onNameChange={(name) => handleCategoryNameChange(cIdx, name)}
                      onRemoveCategory={() => handleRemoveCategoryField(cIdx)}
                      onAddSubcategory={(subName) => handleAddSubcategoryField(cIdx, subName)}
                      onRemoveSubcategory={(sIdx) => handleRemoveSubcategoryField(cIdx, sIdx)}
                    />
                  ))}
                </div>
              </div>

              <div style={styles.modalActions}>
                <Button type="button" onClick={() => setModalOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} variant="primary">
                  {submitting ? 'Saving...' : (editDept ? 'Update Department' : 'Create Department')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Catalog Import Modal (CSV/JSON 2-stage upload -> preview -> import) */}
      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        existingDepartments={departments}
        onSuccess={() => {
          fetchData();
          setBulkImportOpen(false);
          toast.success('Catalog hierarchy bulk import completed successfully.', 'Catalog Updated');
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message={`Are you sure you want to permanently delete department "${selectedDept?.name}"? This action cannot be undone.`}
        confirmText="Delete Department"
        danger={true}
        loading={deleteLoading}
      />
    </AdminLayout>
  );
};

// Interactive Sub-component for Bulk Catalog Import
const BulkImportModal = ({ isOpen, onClose, existingDepartments, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [stage, setStage] = useState('upload'); // 'upload' | 'preview'
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent = `department,department_image,description,category,subcategory
Women's Fashion,https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80,Luxury Indian ethnic and western couture collection for women,Indian Wear,Sarees
Women's Fashion,,,Indian Wear,Kurtis
Women's Fashion,,,Western Wear,Dresses
Men's Fashion,https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80,Refined menswear including western and ethnic attire,Western Wear,Shirts
Men's Fashion,,,Bottom Wear,Jeans
Jewelry,https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80,Handcrafted fine jewelry and luxury ornaments,Earrings,Stud Earrings
Bags & Accessories,https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80,Handbags luxury belts and fashion accessories,Belts,Men's Belts
Gadgets & Electronics,https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80,Smart audio devices and wearable tech,Audio,Wireless Earbuds`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'catalog_hierarchy_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = [];
      const errs = [];

      try {
        if (selectedFile.name.endsWith('.json')) {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            json.forEach((item, idx) => {
              if (item.department && item.category) {
                parsed.push({
                  department: String(item.department).trim(),
                  category: String(item.category).trim(),
                  subcategory: String(item.subcategory || item.subCategory || '').trim(),
                  image: String(item.department_image || item.image || item.img || '').trim(),
                  description: String(item.description || item.dept_description || item.desc || '').trim()
                });
              } else {
                errs.push(`Row ${idx + 1}: Missing department or category.`);
              }
            });
          }
        } else {
          // CSV Parser
          const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
          if (lines.length <= 1) {
            errs.push('File appears empty or missing data rows.');
          } else {
            const header = lines[0].toLowerCase().split(',').map(h => h.trim());
            const deptIdx = header.findIndex(h => h === 'department' || h === 'department_name' || (h.includes('dept') && !h.includes('image') && !h.includes('desc')));
            const imgIdx = header.findIndex(h => h === 'department_image' || h === 'image' || h.includes('img') || h.includes('banner') || h.includes('picture'));
            const descIdx = header.findIndex(h => h === 'description' || h.includes('desc'));
            const catIdx = header.findIndex(h => h.includes('category') && !h.includes('sub') && !h.includes('dept'));
            const subIdx = header.findIndex(h => h.includes('subcategory') || h.includes('sub_category'));

            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',').map(c => c.trim());
              const deptVal = deptIdx >= 0 ? cols[deptIdx] : cols[0];
              const catVal = catIdx >= 0 ? cols[catIdx] : (cols[3] && !cols[3].startsWith('http') ? cols[3] : cols[1]);
              const subVal = subIdx >= 0 ? cols[subIdx] : (cols[4] ? cols[4] : cols[2]);
              const imgVal = imgIdx >= 0 ? cols[imgIdx] : (cols[1] && cols[1].startsWith('http') ? cols[1] : (cols[3] && cols[3].startsWith('http') ? cols[3] : ''));
              const descVal = descIdx >= 0 ? cols[descIdx] : (cols[2] && !cols[2].startsWith('http') ? cols[2] : '');

              if (!deptVal && !catVal) {
                errs.push(`Row ${i + 1}: Department and category are missing.`);
                continue;
              }
              if (!deptVal) {
                errs.push(`Row ${i + 1}: Department name is missing.`);
                continue;
              }
              if (!catVal) {
                errs.push(`Row ${i + 1}: Category name is missing.`);
                continue;
              }

              parsed.push({
                department: deptVal,
                category: catVal,
                subcategory: subVal || '',
                image: imgVal || '',
                description: descVal || ''
              });

              if (!subVal) {
                errs.push(`Row ${i + 1}: Subcategory is missing for category "${catVal}".`);
              }
            }
          }
        }

        setParsedItems(parsed);
        setWarnings(errs);
        setStage('preview');
      } catch (err) {
        console.error('File parsing error:', err);
        alert('Failed to parse file. Please verify CSV/JSON formatting.');
      }
    };

    reader.readAsText(selectedFile);
  };

  // Calculate Preview Breakdown against existing DB state
  const breakdown = (() => {
    let newDepts = new Set();
    let newCats = new Set();
    let newSubs = new Set();
    let existDepts = new Set();
    let existCats = new Set();
    let existSubs = new Set();

    const currentDeptsMap = new Map();
    (existingDepartments || []).forEach(d => {
      const catMap = new Map();
      (d.categories || []).forEach(c => {
        const subSet = new Set((c.subcategories || []).map(s => s.name.toLowerCase()));
        catMap.set(c.name.toLowerCase(), subSet);
      });
      currentDeptsMap.set(d.name.toLowerCase(), catMap);
    });

    parsedItems.forEach(item => {
      const dKey = item.department.toLowerCase();
      const cKey = item.category.toLowerCase();
      const sKey = (item.subcategory || '').toLowerCase();

      if (currentDeptsMap.has(dKey)) {
        existDepts.add(item.department);
        const catMap = currentDeptsMap.get(dKey);
        if (catMap.has(cKey)) {
          existCats.add(`${item.department} -> ${item.category}`);
          const subSet = catMap.get(cKey);
          if (sKey) {
            if (subSet.has(sKey)) {
              existSubs.add(`${item.category} -> ${item.subcategory}`);
            } else {
              newSubs.add(`${item.category} -> ${item.subcategory}`);
            }
          }
        } else {
          newCats.add(`${item.department} -> ${item.category}`);
          if (sKey) newSubs.add(`${item.category} -> ${item.subcategory}`);
        }
      } else {
        newDepts.add(item.department);
        newCats.add(`${item.department} -> ${item.category}`);
        if (sKey) newSubs.add(`${item.category} -> ${item.subcategory}`);
      }
    });

    return {
      newDeptsCount: newDepts.size,
      newCatsCount: newCats.size,
      newSubsCount: newSubs.size,
      existDeptsCount: existDepts.size,
      existCatsCount: existCats.size,
      existSubsCount: existSubs.size
    };
  })();

  const handleConfirmImport = async () => {
    if (parsedItems.length === 0) return;
    setImporting(true);

    try {
      const res = await categoryAPI.bulkImport(parsedItems);
      if (res && res.success) {
        onSuccess();
      } else {
        alert(res.message || 'Error processing catalog bulk import');
      }
    } catch (err) {
      console.error('Error confirming bulk import:', err);
      alert('Error connecting to server during import.');
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setParsedItems([]);
    setWarnings([]);
    setStage('upload');
    onClose();
  };

  return (
    <div style={styles.modalBackdrop} onClick={resetModal}>
      <div style={{ ...styles.modalCard, width: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Bulk Import Catalog Hierarchy</h3>
          <button onClick={resetModal} style={styles.modalClose}>×</button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stage === 'upload' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                  Upload a CSV or JSON file containing department, category, and subcategory records.
                </span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  style={styles.smallGoldBtn}
                >
                  <Download size={13} /> Download Template
                </button>
              </div>

              <div style={styles.dropzoneBox}>
                <FileText size={36} color="var(--admin-gold)" />
                <span style={{ fontSize: '13px', color: 'var(--admin-text-primary)', fontWeight: '600' }}>
                  {file ? file.name : 'Select or Drop CSV / JSON Catalog File'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                  Supported headers: department, department_image, description, category, subcategory
                </span>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  style={styles.hiddenFileInput}
                />
              </div>
            </>
          ) : (
            <>
              {/* Import Preview Stage */}
              <div style={styles.previewSummaryBox}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: 'var(--admin-text-primary)' }}>
                  Import Validation & Preview
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div style={styles.statTileNew}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#10B981', textTransform: 'uppercase' }}>New Additions</span>
                    <span style={{ fontSize: '13px', color: '#F9F6F0', display: 'block', marginTop: '4px' }}>
                      ✓ {breakdown.newDeptsCount} Departments
                    </span>
                    <span style={{ fontSize: '13px', color: '#F9F6F0', display: 'block' }}>
                      ✓ {breakdown.newCatsCount} Categories
                    </span>
                    <span style={{ fontSize: '13px', color: '#F9F6F0', display: 'block' }}>
                      ✓ {breakdown.newSubsCount} Subcategories
                    </span>
                  </div>

                  <div style={styles.statTileExist}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--admin-gold)', textTransform: 'uppercase' }}>Already Exists (Preserved)</span>
                    <span style={{ fontSize: '13px', color: '#F9F6F0', display: 'block', marginTop: '4px' }}>
                      • {breakdown.existDeptsCount} Departments
                    </span>
                    <span style={{ fontSize: '13px', color: '#F9F6F0', display: 'block' }}>
                      • {breakdown.existCatsCount} Categories
                    </span>
                    <span style={{ fontSize: '13px', color: '#F9F6F0', display: 'block' }}>
                      • {breakdown.existSubsCount} Subcategories
                    </span>
                  </div>
                </div>

                {warnings.length > 0 && (
                  <div style={styles.warningListBox}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--admin-danger)' }}>
                      Warnings ({warnings.length}):
                    </span>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '11px', color: 'var(--admin-text-secondary)' }}>
                      {warnings.slice(0, 4).map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                      {warnings.length > 4 && <li>...and {warnings.length - 4} more warnings</li>}
                    </ul>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button type="button" onClick={() => setStage('upload')} variant="outline">
                  Re-upload File
                </Button>
                <Button type="button" onClick={handleConfirmImport} disabled={importing} variant="primary">
                  {importing ? 'Importing Catalog...' : `Import ${parsedItems.length} Valid Records`}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for editing a category & its subcategories inside the modal
const CategoryEditorCard = ({ catIndex, category, onNameChange, onRemoveCategory, onAddSubcategory, onRemoveSubcategory }) => {
  const [newSubInput, setNewSubInput] = useState('');

  const handleAddSub = () => {
    if (newSubInput.trim()) {
      onAddSubcategory(newSubInput.trim());
      setNewSubInput('');
    }
  };

  return (
    <div style={styles.catEditorCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--admin-gold)' }}>Category {catIndex + 1}:</span>
        <input
          type="text"
          value={category.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Indian Wear"
          required
          style={{ ...styles.input, flex: 1, padding: '8px 10px', fontSize: '12px' }}
        />
        <button
          type="button"
          onClick={onRemoveCategory}
          style={styles.removeCatBtn}
          title="Remove Category"
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ marginTop: '8px', paddingLeft: '14px', borderLeft: '2px solid var(--admin-border-gold)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
          {(category.subcategories || []).map((sub, sIdx) => (
            <span key={sub._id || sIdx} style={styles.subPillEditable}>
              {sub.name}
              <button
                type="button"
                onClick={() => onRemoveSubcategory(sIdx)}
                style={styles.subRemoveX}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="text"
            value={newSubInput}
            onChange={(e) => setNewSubInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSub(); } }}
            placeholder="+ Add subcategory (e.g. Sarees)..."
            style={{ ...styles.input, fontSize: '11px', padding: '6px 10px', flex: 1 }}
          />
          <button
            type="button"
            onClick={handleAddSub}
            style={styles.addSubBtn}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  expandToggleBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertNotice: {
    padding: '12px 18px',
    backgroundColor: 'var(--admin-danger-bg, rgba(239, 68, 68, 0.12))',
    border: '1px solid var(--admin-danger, #EF4444)',
    borderRadius: 'var(--radius-sm, 8px)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },
  alertClose: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-secondary)',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center'
  },
  iconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    backgroundColor: 'var(--admin-gold-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  expandedSubtreeCard: {
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '12px',
    padding: '18px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: 'var(--admin-shadow-sm)'
  },
  subtreeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--admin-border-subtle)',
    paddingBottom: '10px'
  },
  subtreeTitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px'
  },
  categoryBox: {
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-border-subtle)',
    borderRadius: '8px',
    padding: '12px'
  },
  categoryBoxTitle: {
    fontSize: '13px',
    color: 'var(--admin-text-primary)',
    marginBottom: '8px'
  },
  subcategoryTagWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  subcategoryPill: {
    backgroundColor: 'var(--admin-gold-muted)',
    color: 'var(--admin-gold)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '12px',
    padding: '2px 10px',
    fontSize: '11px',
    fontWeight: '500'
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    zIndex: 'var(--z-modal, 9999)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  modalCard: {
    backgroundColor: 'var(--admin-modal-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '12px',
    boxShadow: 'var(--admin-shadow-lg)',
    overflow: 'hidden',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid var(--admin-border-subtle)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--admin-card-bg)'
  },
  modalTitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-muted)',
    fontSize: '22px',
    cursor: 'pointer'
  },
  formStack: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflowY: 'auto'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '11px',
    color: 'var(--admin-gold)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
  },
  input: {
    padding: '10px 14px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '6px',
    color: 'var(--admin-text-primary)',
    fontSize: '13px',
    outline: 'none'
  },
  textarea: {
    padding: '10px 14px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '6px',
    color: 'var(--admin-text-primary)',
    fontSize: '13px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  categoriesEditorSection: {
    marginTop: '6px',
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-subtle)',
    borderRadius: '8px',
    padding: '14px'
  },
  catEditorCard: {
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-border-subtle)',
    borderRadius: '6px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  removeCatBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-danger)',
    cursor: 'pointer',
    padding: '4px'
  },
  subPillEditable: {
    backgroundColor: 'var(--admin-gold-muted)',
    color: 'var(--admin-gold)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: '11px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  subRemoveX: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-gold)',
    fontSize: '14px',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0
  },
  addSubBtn: {
    padding: '6px 12px',
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    color: 'var(--admin-gold)',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  smallGoldBtn: {
    padding: '5px 12px',
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    color: 'var(--admin-gold)',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px'
  },
  dropzoneBox: {
    border: '2px dashed var(--admin-border-gold)',
    borderRadius: '10px',
    backgroundColor: 'var(--admin-input-bg)',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
    cursor: 'pointer'
  },
  hiddenFileInput: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0,
    cursor: 'pointer'
  },
  previewSummaryBox: {
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '8px',
    padding: '16px'
  },
  statTileNew: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    padding: '12px'
  },
  statTileExist: {
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '8px',
    padding: '12px'
  },
  warningListBox: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '6px'
  }
};

export default CategoryManagement;
