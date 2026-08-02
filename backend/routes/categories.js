const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const adminAuth = require('../middleware/adminAuth');

// Default initial categories seed helper
const defaultCategories = [
  { name: "Women's Couture", description: "Bespoke gowns, sarees, and haute couture for women", isEnabled: true, image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80' },
  { name: "Men's Atelier", description: "Refined tuxedos, sherwanis, and luxury menswear", isEnabled: true, image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80' },
  { name: "Indian Heritage", description: "Zardozi embroidered lehengas & bridal wear", isEnabled: true, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80' },
  { name: "Artisanal Accessories", description: "Handcrafted leatherware and fine jewelry", isEnabled: true, image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80' }
];

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const { enabledOnly } = req.query;
    const filter = {};
    if (enabledOnly === 'true') {
      filter.isEnabled = true;
    }

    let categories = await Category.find(filter).sort({ name: 1 });

    // Seed defaults if empty
    if (categories.length === 0) {
      categories = await Category.insertMany(defaultCategories);
    }

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/categories - Create category (Admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, isEnabled, image } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const category = new Category({
      name,
      description: description || '',
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      image: image || ''
    });

    await category.save();

    res.status(201).json({
      success: true,
      category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, isEnabled, image } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (isEnabled !== undefined) category.isEnabled = isEnabled;
    if (image !== undefined) category.image = image;

    await category.save();

    res.json({
      success: true,
      category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/categories/:id/status - Toggle Enable/Disable
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { isEnabled } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isEnabled: Boolean(isEnabled) },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({
      success: true,
      category,
      message: `Category ${category.isEnabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
