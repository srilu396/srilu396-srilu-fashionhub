const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Category = require('../models/Category'); // kept for potential legacy reference
const adminAuth = require('../middleware/adminAuth');

// Default initial departments seed dataset
const defaultDepartments = [
  {
    name: "Women's Fashion",
    description: "Fashion collection for women including western and Indian couture",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
    isEnabled: true,
    categories: [
      {
        name: "Indian Wear",
        subcategories: [
          { name: "Sarees" },
          { name: "Kurtis" },
          { name: "Salwar Suits" },
          { name: "Churidar" },
          { name: "Anarkali" },
          { name: "Lehengas" }
        ]
      },
      {
        name: "Western Wear",
        subcategories: [
          { name: "Tops" },
          { name: "T-Shirts" },
          { name: "Shirts" },
          { name: "Dresses" },
          { name: "Jeans" },
          { name: "Skirts" }
        ]
      },
      {
        name: "Bottom Wear",
        subcategories: [
          { name: "Jeans" },
          { name: "Trousers" },
          { name: "Pants" },
          { name: "Skirts" },
          { name: "Shorts" }
        ]
      }
    ]
  },
  {
    name: "Men's Fashion",
    description: "Refined menswear including western, ethnic, and tailor-made attire",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80",
    isEnabled: true,
    categories: [
      {
        name: "Western Wear",
        subcategories: [
          { name: "T-Shirts" },
          { name: "Shirts" },
          { name: "Polo Shirts" },
          { name: "Hoodies" }
        ]
      },
      {
        name: "Bottom Wear",
        subcategories: [
          { name: "Jeans" },
          { name: "Trousers" },
          { name: "Chinos" },
          { name: "Cargo Pants" },
          { name: "Shorts" }
        ]
      },
      {
        name: "Indian Wear",
        subcategories: [
          { name: "Kurtas" },
          { name: "Kurta Sets" },
          { name: "Sherwanis" },
          { name: "Nehru Jackets" }
        ]
      }
    ]
  },
  {
    name: "Jewelry",
    description: "Handcrafted fine jewelry, luxury ornaments, and accessories",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
    isEnabled: true,
    categories: [
      {
        name: "Necklaces",
        subcategories: [
          { name: "Pendants" },
          { name: "Chokers" },
          { name: "Gold Chains" }
        ]
      },
      {
        name: "Earrings",
        subcategories: [
          { name: "Studs" },
          { name: "Hoops" },
          { name: "Jhumkas" }
        ]
      },
      {
        name: "Rings",
        subcategories: [
          { name: "Solitaire Rings" },
          { name: "Men's Rings" },
          { name: "Band Rings" }
        ]
      }
    ]
  },
  {
    name: "Bags & Accessories",
    description: "Handbags, luxury leather belts, wallets, and fashion add-ons",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
    isEnabled: true,
    categories: [
      {
        name: "Belts",
        subcategories: [
          { name: "Men's Belts" },
          { name: "Women's Belts" }
        ]
      },
      {
        name: "Bags",
        subcategories: [
          { name: "Tote Bags" },
          { name: "Clutches" },
          { name: "Backpacks" }
        ]
      },
      {
        name: "Wallets",
        subcategories: [
          { name: "Card Holders" },
          { name: "Leather Wallets" }
        ]
      }
    ]
  },
  {
    name: "Gadgets & Electronics",
    description: "Smart audio devices, wearable tech, and premium electronic accessories",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    isEnabled: true,
    categories: [
      {
        name: "Audio",
        subcategories: [
          { name: "Wireless Earbuds" },
          { name: "Headphones" },
          { name: "Bluetooth Speakers" }
        ]
      },
      {
        name: "Smart Devices",
        subcategories: [
          { name: "Smartwatches" },
          { name: "Fitness Bands" }
        ]
      }
    ]
  }
];

// GET /api/categories - Get all departments and their hierarchy
router.get('/', async (req, res) => {
  try {
    const { enabledOnly } = req.query;

    const filter = {};
    if (enabledOnly === 'true') {
      filter.isEnabled = true;
    }

    const departments = await Department.find(filter).sort({ name: 1 });

    // Also format flat categories list for legacy endpoints/components if needed
    const flatCategories = [];
    departments.forEach(dept => {
      if (dept.categories && Array.isArray(dept.categories)) {
        dept.categories.forEach(cat => {
          flatCategories.push({
            _id: cat._id,
            id: cat._id,
            name: cat.name,
            department: dept.name,
            departmentId: dept._id,
            description: dept.description,
            image: dept.image,
            isEnabled: dept.isEnabled,
            subcategories: cat.subcategories || []
          });
        });
      }
    });

    res.json({
      success: true,
      departments,
      categories: departments // Provide departments under categories key for seamless compatibility
    });
  } catch (error) {
    console.error('Error fetching departments/categories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/categories/bulk-import - Idempotently import catalog hierarchy
router.post('/bulk-import', adminAuth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a non-empty items array for import' });
    }

    let newDeptsCount = 0;
    let newCatsCount = 0;
    let newSubsCount = 0;
    let existingDeptsCount = 0;
    let existingCatsCount = 0;
    let existingSubsCount = 0;
    const warnings = [];

    const existingDepartments = await Department.find({});

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const deptName = (row.department || row.Department || '').trim();
      const catName = (row.category || row.Category || '').trim();
      const subName = (row.subcategory || row.Subcategory || row.subCategory || '').trim();
      const deptImage = (row.image || row.Image || row.department_image || row.dept_image || '').trim();
      const deptDesc = (row.description || row.Description || row.dept_description || row.desc || '').trim();

      if (!deptName && !catName) {
        warnings.push(`Row ${i + 1}: Department and category are missing`);
        continue;
      }

      if (!deptName) {
        warnings.push(`Row ${i + 1}: Department name is missing`);
        continue;
      }

      if (!catName) {
        warnings.push(`Row ${i + 1}: Category name is missing`);
        continue;
      }

      // 1. Find or create Department
      let dept = existingDepartments.find(d => d.name.toLowerCase() === deptName.toLowerCase());
      if (!dept) {
        dept = await Department.findOne({ name: { $regex: new RegExp(`^${deptName}$`, 'i') } });
      }

      if (!dept) {
        dept = new Department({
          name: deptName,
          description: deptDesc || `${deptName} collection`,
          image: deptImage || '',
          isEnabled: true,
          categories: []
        });
        existingDepartments.push(dept);
        newDeptsCount++;
      } else {
        if (deptImage) dept.image = deptImage;
        if (deptDesc) dept.description = deptDesc;
        existingDeptsCount++;
      }

      // 2. Find or create Category inside Department
      let cat = dept.categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (!cat) {
        dept.categories.push({
          name: catName,
          subcategories: []
        });
        cat = dept.categories[dept.categories.length - 1];
        newCatsCount++;
      } else {
        existingCatsCount++;
      }

      // 3. Find or create Subcategory inside Category (if subName provided)
      if (subName) {
        let sub = cat.subcategories.find(s => s.name.toLowerCase() === subName.toLowerCase());
        if (!sub) {
          cat.subcategories.push({ name: subName });
          newSubsCount++;
        } else {
          existingSubsCount++;
        }
      } else {
        warnings.push(`Row ${i + 1}: Subcategory is missing for category "${catName}"`);
      }

      await dept.save();
    }

    res.json({
      success: true,
      message: 'Catalog bulk import processed successfully',
      summary: {
        newDepartments: newDeptsCount,
        newCategories: newCatsCount,
        newSubcategories: newSubsCount,
        existingDepartments: existingDeptsCount,
        existingCategories: existingCatsCount,
        existingSubcategories: existingSubsCount,
        warnings
      }
    });
  } catch (error) {
    console.error('Error during catalog bulk import:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/categories - Create new department (Admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, isEnabled, image, categories } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const existing = await Department.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Department with this name already exists' });
    }

    const department = new Department({
      name: name.trim(),
      description: description || '',
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      image: image || '',
      categories: Array.isArray(categories) ? categories : []
    });

    await department.save();

    res.status(201).json({
      success: true,
      department,
      category: department,
      message: 'Department created successfully'
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/categories/:id - Update department
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, isEnabled, image, categories } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (name) department.name = name.trim();
    if (description !== undefined) department.description = description;
    if (isEnabled !== undefined) department.isEnabled = isEnabled;
    if (image !== undefined) department.image = image;
    if (categories !== undefined && Array.isArray(categories)) {
      department.categories = categories;
    }

    await department.save();

    res.json({
      success: true,
      department,
      category: department,
      message: 'Department updated successfully'
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/categories/:id/status - Toggle Enable/Disable Department
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { isEnabled } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isEnabled: Boolean(isEnabled) },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.json({
      success: true,
      department,
      category: department,
      message: `Department ${department.isEnabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/categories/:id - Delete department
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const deptId = department._id;
    const deptName = department.name;

    const categoryIds = (department.categories || []).map(c => c._id);
    const subcategoryIds = [];
    const categoryNames = (department.categories || []).map(c => c.name);

    (department.categories || []).forEach(c => {
      (c.subcategories || []).forEach(s => {
        if (s._id) subcategoryIds.push(s._id);
      });
    });

    const productCount = await Product.countDocuments({
      $or: [
        { departmentId: deptId },
        { categoryId: { $in: categoryIds } },
        { subcategoryId: { $in: subcategoryIds } },
        { department: { $regex: new RegExp(`^${deptName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
        { category: { $in: categoryNames.map(n => new RegExp(`^${n.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i')) } }
      ]
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department "${deptName}" because ${productCount} product(s) are associated with it. Please delete those products first.`
      });
    }

    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Department "${deptName}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
