// routes/products.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const fetch = require('node-fetch');  // Add this line

console.log('🚀 Products routes loading...');

// ===== TEST ROUTES =====

// Test if server is responding
router.get('/test', (req, res) => {
  console.log('✅ /test route hit');
  res.json({
    success: true,
    message: '✅ Products API is working!',
    timestamp: new Date().toISOString()
  });
});

// Test import route specifically
router.get('/test/import', (req, res) => {
  console.log('✅ /test/import route hit');
  res.json({
    success: true,
    message: '✅ Import route is working!',
    timestamp: new Date().toISOString()
  });
});

// ===== IMPORT ROUTES =====

// Import products from FakeStore API - ACTUAL WORKING VERSION
router.post('/import-from-api', async (req, res) => {
  try {
    console.log('🔄 Importing from FakeStore API...');
    
    // Fetch from FakeStore API
    const response = await fetch('https://fakestoreapi.com/products/category/women\'s clothing');
    const apiProducts = await response.json();
    
    console.log(`📥 Fetched ${apiProducts.length} products from FakeStore API`);
    
    // Transform the data to match your schema
    const transformedProducts = apiProducts.map(product => ({
      name: product.title,
      description: product.description,
      price: product.price,
      category: "women's clothing",
      brand: 'FakeStore',
      images: [product.image],
      rating: product.rating ? product.rating.rate : 4.5,
      inventory: Math.floor(Math.random() * 50) + 10, // Random stock 10-60
      featured: Math.random() > 0.7, // 30% chance to be featured
      isNew: Math.random() > 0.5, // 50% chance to be marked as new
      originalPrice: product.price * 1.2, // Add 20% for discount display
      discount: 20
    }));
    
    // Insert into database
    const importedProducts = await Product.insertMany(transformedProducts);
    
    console.log(`✅ Imported ${importedProducts.length} products`);
    
    res.json({
      success: true,
      message: `✅ Imported ${importedProducts.length} products from FakeStore API`,
      count: importedProducts.length,
      products: importedProducts
    });
    
  } catch (error) {
    console.error('❌ Import error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Import failed: ' + error.message,
      error: error.toString()
    });
  }
});

// Import sample products
router.post('/import-sample', async (req, res) => {
  try {
    console.log('🎨 Creating sample products...');
    
    const sampleProducts = [
      {
        name: 'Test Product 1',
        description: 'Test description',
        price: 99.99,
        category: "women's clothing",
        brand: 'Test Brand',
        images: ['https://via.placeholder.com/400'],
        inventory: 10
      },
      {
        name: 'Test Product 2',
        description: 'Another test product',
        price: 149.99,
        category: 'dresses',
        brand: 'Test Brand',
        images: ['https://via.placeholder.com/400'],
        inventory: 15
      }
    ];
    
    const importedProducts = await Product.insertMany(sampleProducts);
    
    res.json({
      success: true,
      message: `✅ Created ${importedProducts.length} sample products`,
      products: importedProducts
    });
    
  } catch (error) {
    console.error('❌ Sample import error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== BASIC CRUD ROUTES =====

// Create new product
router.post('/', async (req, res) => {
  try {
    console.log('🆕 Creating new product...');
    
    const product = new Product(req.body);
    const savedProduct = await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all products...');
    
    const products = await Product.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: products.length,
      products: products
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ===== ROUTES WITH :id PARAMETERS (MUST BE ABSOLUTELY LAST) =====

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`🔍 Fetching product with ID: ${req.params.id}`);
    
    // Check if it's a valid ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        id: req.params.id
      });
    }
    
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
    console.error(`❌ Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated',
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
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
      message: 'Product deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

console.log('✅ Products routes loaded successfully');
module.exports = router;