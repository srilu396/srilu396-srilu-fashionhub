import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import SelectDropdown from '../../components/admin/SelectDropdown';
import FilterDropdown from '../../components/admin/FilterDropdown';
import BulkUploadModal from '../../components/admin/BulkUploadModal';
import Button from '../../components/admin/Button';
import SearchBar from '../../components/admin/SearchBar';
import { productAPI, categoryAPI } from '../../utils/api';
import { Edit2, Trash2, Upload, Plus, X, Layers, Filter, RotateCcw } from 'lucide-react';
import { useToast } from '../../components/common/Toast/useToast';

const DEFAULT_IMAGE_SET = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'
];

const ProductsManagement = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Initial stock filter from query parameter (e.g. Overview Low Stock Card click)
  const initialStockFilter = searchParams.get('stockStatus') || searchParams.get('filter') || 'ALL';

  // Cascading Dependent Filter & Search States
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');
  const [selectedSubCatFilter, setSelectedSubCatFilter] = useState('ALL');
  const [selectedStockFilter, setSelectedStockFilter] = useState(initialStockFilter === 'low-stock' ? 'low_stock' : initialStockFilter);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Single Delete Product Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit Product Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: '',
    department: '',
    category: '',
    subCategory: '',
    description: '',
    rating: 4.5,
    stock: 10,
    images: ['', '', '']
  });
  const [editLoading, setEditLoading] = useState(false);

  // Bulk Upload Modal state
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getAll();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      } else if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      toast.error('Error loading products list');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      if (data.success && Array.isArray(data.departments)) {
        setCategories(data.departments);
      } else if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error loading catalog hierarchy:', err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // 1. Department Filter Options
  const departmentFilterOptions = useMemo(() => {
    const opts = [{ label: 'All Departments', value: 'ALL' }];
    const depts = new Set();
    categories.forEach(d => {
      if (d.name) depts.add(d.name);
    });
    products.forEach(p => {
      if (p.department) depts.add(p.department);
    });
    Array.from(depts).sort((a, b) => a.localeCompare(b)).forEach(dName => {
      opts.push({ label: dName, value: dName });
    });
    return opts;
  }, [categories, products]);

  // 2. Category Filter Options (Cascading - Dependent on Selected Department)
  const categoryFilterOptions = useMemo(() => {
    const opts = [{ label: 'All Categories', value: 'ALL' }];
    const cats = new Set();

    if (selectedDeptFilter !== 'ALL') {
      const deptObj = categories.find(d => d.name === selectedDeptFilter);
      if (deptObj && Array.isArray(deptObj.categories)) {
        deptObj.categories.forEach(c => {
          if (c.name) cats.add(c.name);
        });
      } else {
        products.forEach(p => {
          if (p.department === selectedDeptFilter && p.category) {
            cats.add(p.category);
          }
        });
      }
    } else {
      categories.forEach(d => {
        if (Array.isArray(d.categories)) {
          d.categories.forEach(c => {
            if (c.name) cats.add(c.name);
          });
        }
      });
      products.forEach(p => {
        if (p.category) cats.add(p.category);
      });
    }

    Array.from(cats).sort((a, b) => a.localeCompare(b)).forEach(cName => {
      opts.push({ label: cName, value: cName });
    });
    return opts;
  }, [categories, products, selectedDeptFilter]);

  // 3. Sub Category Filter Options (Cascading - Dependent on Selected Category)
  const subCategoryFilterOptions = useMemo(() => {
    const opts = [{ label: 'All Sub Categories', value: 'ALL' }];
    const subCats = new Set();

    if (selectedCatFilter !== 'ALL') {
      categories.forEach(d => {
        if (selectedDeptFilter === 'ALL' || d.name === selectedDeptFilter) {
          if (Array.isArray(d.categories)) {
            const catObj = d.categories.find(c => c.name === selectedCatFilter);
            if (catObj && Array.isArray(catObj.subcategories)) {
              catObj.subcategories.forEach(s => {
                const sName = typeof s === 'string' ? s : s.name;
                if (sName) subCats.add(sName);
              });
            }
          }
        }
      });
      products.forEach(p => {
        if (p.category === selectedCatFilter && p.subCategory) {
          subCats.add(p.subCategory);
        }
      });
    } else {
      categories.forEach(d => {
        if (selectedDeptFilter === 'ALL' || d.name === selectedDeptFilter) {
          if (Array.isArray(d.categories)) {
            d.categories.forEach(c => {
              if (Array.isArray(c.subcategories)) {
                c.subcategories.forEach(s => {
                  const sName = typeof s === 'string' ? s : s.name;
                  if (sName) subCats.add(sName);
                });
              }
            });
          }
        }
      });
      products.forEach(p => {
        if ((selectedDeptFilter === 'ALL' || p.department === selectedDeptFilter) && p.subCategory) {
          subCats.add(p.subCategory);
        }
      });
    }

    Array.from(subCats).sort((a, b) => a.localeCompare(b)).forEach(sName => {
      opts.push({ label: sName, value: sName });
    });
    return opts;
  }, [categories, products, selectedDeptFilter, selectedCatFilter]);

  // Cascading Filter Selection Handlers
  const handleDepartmentFilterChange = (val) => {
    setSelectedDeptFilter(val);
    setSelectedCatFilter('ALL');
    setSelectedSubCatFilter('ALL');
  };

  const handleCategoryFilterChange = (val) => {
    setSelectedCatFilter(val);
    setSelectedSubCatFilter('ALL');
  };

  const handleSubCategoryFilterChange = (val) => {
    setSelectedSubCatFilter(val);
  };

  const handleClearAllFilters = () => {
    setSelectedDeptFilter('ALL');
    setSelectedCatFilter('ALL');
    setSelectedSubCatFilter('ALL');
    setGlobalSearchQuery('');
  };

  // Filtered Products Calculation (Global Search + Department + Category + Sub Category)
  const filteredProducts = useMemo(() => {
    return products.filter(item => {
      // Global Search Across: Department, Category, Sub Category, Product Name/Title, SKU
      if (globalSearchQuery.trim()) {
        const q = globalSearchQuery.toLowerCase().trim();
        const matchName = (item.name || item.title || '').toLowerCase().includes(q);
        const matchSku = (item.sku || (item._id || item.id || '')).toLowerCase().includes(q);
        const matchDept = (item.department || '').toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        const matchSub = (item.subCategory || '').toLowerCase().includes(q);

        if (!matchName && !matchSku && !matchDept && !matchCat && !matchSub) {
          return false;
        }
      }

      // 1. Department Filter
      if (selectedDeptFilter !== 'ALL') {
        if ((item.department || '').toLowerCase() !== selectedDeptFilter.toLowerCase()) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCatFilter !== 'ALL') {
        if ((item.category || '').toLowerCase() !== selectedCatFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Sub Category Filter
      if (selectedSubCatFilter !== 'ALL') {
        if ((item.subCategory || '').toLowerCase() !== selectedSubCatFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [products, globalSearchQuery, selectedDeptFilter, selectedCatFilter, selectedSubCatFilter]);

  // Edit 3-Level Dropdown Options (Department -> Category -> Sub Category)
  const editDepartmentOptions = useMemo(() => {
    const depts = new Set();
    categories.forEach(d => {
      if (d.isEnabled !== false && d.name) depts.add(d.name);
    });
    if (editFormData.department) depts.add(editFormData.department);
    if (selectedProduct && selectedProduct.department) depts.add(selectedProduct.department);

    return Array.from(depts)
      .sort((a, b) => a.localeCompare(b))
      .map(d => ({ label: d, value: d }));
  }, [categories, editFormData.department, selectedProduct]);

  const editCategoryOptions = useMemo(() => {
    const cats = new Set();
    const currentDeptName = editFormData.department;

    if (currentDeptName) {
      const deptObj = categories.find(d => d.name === currentDeptName);
      if (deptObj && Array.isArray(deptObj.categories)) {
        deptObj.categories.forEach(c => {
          if (c.name) cats.add(c.name);
        });
      }
    }

    if (cats.size === 0) {
      categories.forEach(d => {
        if (Array.isArray(d.categories)) {
          d.categories.forEach(c => {
            if (c.name) cats.add(c.name);
          });
        }
      });
    }

    if (editFormData.category) cats.add(editFormData.category);
    if (selectedProduct && selectedProduct.category) cats.add(selectedProduct.category);

    return Array.from(cats)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map(c => ({ label: c, value: c }));
  }, [categories, editFormData.department, editFormData.category, selectedProduct]);

  const editSubCategoryOptions = useMemo(() => {
    const currentDeptName = editFormData.department;
    const currentCatName = editFormData.category;
    const subCats = new Set();

    if (currentDeptName && currentCatName) {
      const deptObj = categories.find(d => d.name === currentDeptName);
      if (deptObj && Array.isArray(deptObj.categories)) {
        const catObj = deptObj.categories.find(c => c.name === currentCatName);
        if (catObj && Array.isArray(catObj.subcategories)) {
          catObj.subcategories.forEach(s => subCats.add(typeof s === 'string' ? s : s.name));
        }
      }
    }

    if (subCats.size === 0 && currentCatName) {
      categories.forEach(d => {
        if (Array.isArray(d.categories)) {
          const cObj = d.categories.find(c => c.name === currentCatName);
          if (cObj && Array.isArray(cObj.subcategories)) {
            cObj.subcategories.forEach(s => subCats.add(typeof s === 'string' ? s : s.name));
          }
        }
      });
    }

    if (editFormData.subCategory) subCats.add(editFormData.subCategory);
    subCats.add('General');

    return Array.from(subCats)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map(s => ({ label: s, value: s }));
  }, [categories, editFormData.department, editFormData.category, editFormData.subCategory]);

  const handleEditDepartmentChange = (newDeptName) => {
    const deptObj = categories.find(d => d.name === newDeptName);
    const firstCat = deptObj && deptObj.categories && deptObj.categories.length > 0 ? deptObj.categories[0].name : '';
    const firstSub = deptObj && deptObj.categories && deptObj.categories[0] && deptObj.categories[0].subcategories && deptObj.categories[0].subcategories.length > 0
      ? (typeof deptObj.categories[0].subcategories[0] === 'string' ? deptObj.categories[0].subcategories[0] : deptObj.categories[0].subcategories[0].name)
      : 'General';

    setEditFormData(prev => ({
      ...prev,
      department: newDeptName,
      category: firstCat || prev.category,
      subCategory: firstSub || 'General'
    }));
  };

  const handleEditCategoryChange = (newCatName) => {
    let firstSub = 'General';
    const deptObj = categories.find(d => d.name === editFormData.department);
    if (deptObj && Array.isArray(deptObj.categories)) {
      const catObj = deptObj.categories.find(c => c.name === newCatName);
      if (catObj && Array.isArray(catObj.subcategories) && catObj.subcategories.length > 0) {
        firstSub = typeof catObj.subcategories[0] === 'string' ? catObj.subcategories[0] : catObj.subcategories[0].name;
      }
    } else {
      categories.forEach(d => {
        if (Array.isArray(d.categories)) {
          const catObj = d.categories.find(c => c.name === newCatName);
          if (catObj && Array.isArray(catObj.subcategories) && catObj.subcategories.length > 0) {
            firstSub = typeof catObj.subcategories[0] === 'string' ? catObj.subcategories[0] : catObj.subcategories[0].name;
          }
        }
      });
    }

    setEditFormData(prev => ({
      ...prev,
      category: newCatName,
      subCategory: firstSub || 'General'
    }));
  };

  // Single Delete Execution
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    setDeleteLoading(true);

    try {
      const res = await productAPI.delete(selectedProduct._id || selectedProduct.id);
      if (res.success) {
        toast.success(`"${selectedProduct.name}" removed from catalog`, 'Product Deleted');
        loadProducts();
        setDeleteModalOpen(false);
        setSelectedProduct(null);
      } else {
        toast.error(res.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Error deleting product');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    const existingImages = product.images && product.images.length > 0 
      ? [...product.images] 
      : (product.image ? [product.image] : []);

    while (existingImages.length < 3) {
      existingImages.push(DEFAULT_IMAGE_SET[existingImages.length % 3] || '');
    }

    let deptName = product.department || '';
    if (!deptName && product.category && categories.length > 0) {
      const parentDept = categories.find(d => 
        d.categories && d.categories.some(c => c.name === product.category)
      );
      if (parentDept) deptName = parentDept.name;
    }
    if (!deptName && categories.length > 0) {
      deptName = categories[0].name || "Women's Fashion";
    }

    setEditFormData({
      name: product.name || '',
      price: product.price !== undefined ? product.price : '',
      department: deptName,
      category: product.category || '',
      subCategory: product.subCategory || 'General',
      description: product.description || '',
      rating: product.rating || 4.5,
      stock: product.stock !== undefined ? product.stock : (product.inventory !== undefined ? product.inventory : 10),
      images: existingImages
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
      toast.warning('Every product must support at least 3 images minimum.', 'Image Requirement');
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
        toast.warning('Please ensure at least 3 valid image URLs are provided.', 'Validation Warning');
        setEditLoading(false);
        return;
      }

      const updatePayload = {
        name: editFormData.name,
        price: parseFloat(editFormData.price) || 0,
        department: editFormData.department,
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
        toast.success('Product details updated successfully.', 'Product Updated');
        loadProducts();
        setEditModalOpen(false);
      } else {
        toast.error(res.message || 'Failed to update product');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Error updating product. Please try again.');
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
                backgroundColor: 'var(--admin-surface-2)',
                border: '1px solid var(--admin-border-subtle)'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '600', color: 'var(--admin-text-primary)' }}>{row.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>
                SKU: {row.sku || (row._id || row.id || '').slice(-6).toUpperCase()}
              </span>
            </div>
          </div>
        );
      },
      sortable: true
    },
    {
      header: 'Classification',
      accessor: 'category',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: '600', color: 'var(--admin-gold)', fontSize: '12px' }}>
            {row.department || "Fashion Department"}
          </span>
          <span style={{ fontWeight: '500', color: 'var(--admin-text-primary)', fontSize: '12px' }}>
            {row.category || "Women's Fashion"}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>
            {row.subCategory || 'General'}
          </span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Price (₹)',
      accessor: 'price',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '600', fontFamily: "var(--font-serif, 'Playfair Display', serif)", color: 'var(--admin-gold)' }}>
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
                icon: <Edit2 size={14} color="var(--admin-gold)" />,
                onClick: () => openEditModal(row)
              },
              {
                label: 'Delete Product',
                icon: <Trash2 size={14} color="var(--admin-danger)" />,
                danger: true,
                onClick: () => openDeleteModal(row)
              }
            ]}
          />
        </div>
      )
    }
  ];

  const hasActiveFilters = selectedDeptFilter !== 'ALL' || selectedCatFilter !== 'ALL' || selectedSubCatFilter !== 'ALL' || selectedStockFilter !== 'ALL' || globalSearchQuery.trim() !== '';

  return (
    <AdminLayout title="Products Catalog">
      {/* Top-Right Page Header Action Alignment */}
      <PageHeader
        title="Products Management"
        subtitle="Manage inventory items with multi-tier department classification & stock status"
        breadcrumbs={[{ label: 'Products' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              to="/admin/new-product"
              variant="primary"
              icon={<Plus size={15} />}
            >
              Add Product
            </Button>
            <Button
              onClick={() => setBulkUploadOpen(true)}
              variant="secondary"
              icon={<Upload size={14} />}
              title="Bulk import products from Excel or CSV"
            >
              Bulk Upload
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

      {/* Main Products Table with Integrated Toolbar (Search + Department + Category + Sub Category) */}
      <DataTable
        columns={columns}
        data={filteredProducts.map(p => ({
          ...p,
          stockStatus: (p.stock || 0) === 0 ? 'out_of_stock' : (p.stock || 0) < 5 ? 'low_stock' : 'in_stock'
        }))}
        loading={loading}
        onRowClick={(row) => navigate(`/admin/products/${row._id || row.id}`)}
        searchPlaceholder="Search products by Department, Category, Sub Category, Title..."
        externalSearchQuery={globalSearchQuery}
        onSearchChange={(e) => setGlobalSearchQuery(e.target.value)}
        customFilters={
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            {/* 1. Department Filter */}
            <FilterDropdown
              label="Department"
              options={departmentFilterOptions}
              value={selectedDeptFilter}
              onChange={handleDepartmentFilterChange}
              placeholder="All Departments"
              width="180px"
            />

            {/* 2. Category Filter (Cascading Dependent Dropdown) */}
            <FilterDropdown
              label="Category"
              options={categoryFilterOptions}
              value={selectedCatFilter}
              onChange={handleCategoryFilterChange}
              placeholder="All Categories"
              width="180px"
            />

            {/* 3. Sub Category Filter (Cascading Dependent Dropdown) */}
            <FilterDropdown
              label="Sub Category"
              options={subCategoryFilterOptions}
              value={selectedSubCatFilter}
              onChange={handleSubCategoryFilterChange}
              placeholder="All Sub Categories"
              width="180px"
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  backgroundColor: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid var(--admin-border-gold)',
                  borderRadius: '20px',
                  color: 'var(--admin-gold)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: 'var(--admin-shadow-sm)',
                  height: '38px',
                  boxSizing: 'border-box'
                }}
                title="Clear search query and reset catalog filters"
              >
                <RotateCcw size={13} />
                Reset Filters
              </button>
            )}
          </div>
        }
        emptyTitle="No Products Found"
        emptyDescription={hasActiveFilters ? "No products match the selected cascading filters or search query." : "Start adding luxury fashion products to populate your store catalog."}
        onEmptyAction={() => {
          if (hasActiveFilters) handleClearAllFilters();
          else navigate('/admin/new-product');
        }}
        emptyActionLabel={hasActiveFilters ? "Reset Filters" : "+ Add First Product"}
      />

      {/* Single Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteProduct}
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

      {/* Product Edit Modal */}
      {editModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setEditModalOpen(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Product Specifications</h3>
              <button onClick={() => setEditModalOpen(false)} style={styles.modalClose}>×</button>
            </div>

            <form onSubmit={handleEditSubmit} style={styles.editForm}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Product Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  maxLength={100}
                  required
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div style={styles.inputGroup}>
                  <SelectDropdown
                    label="Department"
                    placeholder="Select Department"
                    options={editDepartmentOptions}
                    value={editFormData.department}
                    onChange={(val) => handleEditDepartmentChange(val)}
                    required={true}
                    searchable={true}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <SelectDropdown
                    label="Category"
                    placeholder="Select Category"
                    options={editCategoryOptions}
                    value={editFormData.category}
                    onChange={(val) => handleEditCategoryChange(val)}
                    required={true}
                    searchable={true}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <SelectDropdown
                    label="Sub Category"
                    placeholder="Select Sub Category"
                    options={editSubCategoryOptions}
                    value={editFormData.subCategory}
                    onChange={(val) => setEditFormData({ ...editFormData, subCategory: val })}
                    searchable={true}
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

              {/* Gallery Controls */}
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
    gap: '6px'
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
  filterToolbarCard: {
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '16px',
    padding: '18px 20px',
    marginBottom: '20px',
    boxShadow: 'var(--admin-shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  filterToolbarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '10px'
  },
  filterToolbarTitle: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--admin-text-primary)'
  },
  clearFiltersBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-gold)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  filterGrid: {
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '14px'
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
    backgroundColor: 'var(--admin-modal-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: 'var(--admin-shadow-lg)'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    borderBottom: '1px solid var(--admin-border-subtle)',
    paddingBottom: '12px'
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
    color: 'var(--admin-gold)'
  },
  input: {
    padding: '10px 12px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '6px',
    color: 'var(--admin-text-primary)',
    fontSize: '13px',
    outline: 'none'
  },
  textarea: {
    padding: '10px 12px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '6px',
    color: 'var(--admin-text-primary)',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  editImgCard: {
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-border-subtle)',
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
    color: 'var(--admin-danger)',
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
    borderTop: '1px solid var(--admin-border-subtle)'
  }
};

export default ProductsManagement;