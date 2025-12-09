const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get all products with filtering
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, featured } = req.query;
    
    let query = {};
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Filter by featured
    if (featured === 'true') {
      query.featured = true;
    }
    
    // Sort options
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1 };
    } else if (sort === 'name') {
      sortOption = { name: 1 };
    }
    
    const products = await Product.find(query).sort(sortOption);
    
    // Get categories for filtering
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      count: products.length,
      products,
      categories: categories.map(cat => ({
        id: cat._id,
        name: cat._id,
        count: cat.count
      }))
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching products', 
      error: error.message 
    });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const { 
      name, description, price, originalPrice, discount, 
      category, brand, images, inventory, rating, isNew, featured 
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category || !images || !inventory) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    const product = new Product({
      name,
      description,
      price,
      originalPrice: originalPrice || price,
      discount: discount || 0,
      category,
      brand: brand || 'Luxury Brand',
      images,
      inventory,
      rating: rating || 4.5,
      isNew: isNew !== undefined ? isNew : true,
      featured: featured || false
    });

    const savedProduct = await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

// Import products from external API
router.post('/import-from-api', async (req, res) => {
  try {
    console.log('🔄 Starting API import...');
    
    // Using a reliable fake store API
    const response = await fetch('https://fakestoreapi.com/products');
    const externalProducts = await response.json();

    console.log(`📦 Fetched ${externalProducts.length} products from API`);

    // Filter only women's clothing and jewelry
    const filteredProducts = externalProducts.filter(product => 
      product.category === "women's clothing" || 
      product.category === "jewelery"
    );

    console.log(`👗 Filtered to ${filteredProducts.length} women's clothing & jewelry products`);

    // Transform to match our schema
    const productsToImport = filteredProducts.map(product => ({
      name: product.title, // Map title to name
      description: product.description,
      price: product.price,
      originalPrice: product.price * 1.2, // Add 20% as original price
      discount: 20, // Set discount to 20%
      category: product.category,
      brand: 'Designer Brand',
      images: [product.image],
      inventory: Math.floor(Math.random() * 100) + 10, // Random inventory 10-110
      rating: product.rating?.rate || 4.5,
      isNew: true,
      featured: Math.random() > 0.7 // 30% chance to be featured
    }));

    // Insert all products
    const importedProducts = await Product.insertMany(productsToImport);
    
    console.log(`✅ Successfully imported ${importedProducts.length} products to database`);
    
    res.json({
      success: true,
      message: `🎉 Successfully imported ${importedProducts.length} products!`,
      importedCount: importedProducts.length,
      products: importedProducts
    });
  } catch (error) {
    console.error('❌ Import error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error importing products from API', 
      error: error.message 
    });
  }
});

module.exports = router;