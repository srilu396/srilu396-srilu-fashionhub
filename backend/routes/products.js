const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const User = require('../models/User');

// Get all products with filtering
// Get all products with filtering
router.get('/', async (req, res) => {
  try {
    const Department = require('../models/Department');
    const { 
      category, 
      department, 
      subCategory, 
      subcategory, 
      departmentId, 
      categoryId, 
      subcategoryId,
      search, 
      minPrice, 
      maxPrice, 
      minRating,
      rating,
      minDiscount,
      discount,
      inStock,
      sort, 
      featured,
      page = 1,
      limit = 100
    } = req.query;
    
    let query = {};
    
    // 1. Department Filter
    const activeDept = department || departmentId;
    if (activeDept && activeDept !== 'all') {
      if (activeDept.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or = [{ departmentId: activeDept }, { department: activeDept }];
      } else {
        // Try finding department document by slug or name first
        const deptDoc = await Department.findOne({
          $or: [
            { slug: activeDept.toLowerCase() },
            { name: { $regex: new RegExp(`^${activeDept.replace(/-/g, ' ')}$`, 'i') } },
            { name: { $regex: new RegExp(`^${activeDept.replace(/-/g, '.*')}$`, 'i') } }
          ]
        });

        if (deptDoc) {
          query.$or = [
            { departmentId: deptDoc._id },
            { department: { $regex: new RegExp(`^${deptDoc.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
          ];
        } else {
          // Fallback regex match on department string
          const normalizedDeptStr = activeDept.replace(/-/g, '[\\s-]?');
          query.department = { $regex: new RegExp(`^${normalizedDeptStr}$`, 'i') };
        }
      }
    }

    // 2. Category Filter
    const activeCat = category || categoryId;
    if (activeCat && activeCat !== 'all') {
      if (activeCat.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or = (query.$or ? query.$or : []).concat([{ categoryId: activeCat }, { category: activeCat }]);
      } else {
        const normalizedCatStr = activeCat.replace(/-/g, '[\\s-]?');
        query.category = { $regex: new RegExp(`^${normalizedCatStr}$`, 'i') };
      }
    }

    // 3. Subcategory Filter
    const activeSub = subCategory || subcategory || subcategoryId;
    if (activeSub && activeSub !== 'all') {
      if (activeSub.match(/^[0-9a-fA-F]{24}$/)) {
        query.subcategoryId = activeSub;
      } else {
        const normalizedSubStr = activeSub.replace(/-/g, '[\\s-]?');
        query.subCategory = { $regex: new RegExp(`^${normalizedSubStr}$`, 'i') };
      }
    }
    
    // 4. Search by name, description, brand, etc.
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$and = (query.$and || []).concat([{
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { brand: searchRegex },
          { department: searchRegex },
          { category: searchRegex },
          { subCategory: searchRegex }
        ]
      }]);
    }
    
    // 5. Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice && !isNaN(parseFloat(minPrice))) query.price.$gte = parseFloat(minPrice);
      if (maxPrice && !isNaN(parseFloat(maxPrice))) query.price.$lte = parseFloat(maxPrice);
    }

    // 6. Rating filter
    const reqRating = minRating || rating;
    if (reqRating && !isNaN(parseFloat(reqRating))) {
      query.rating = { $gte: parseFloat(reqRating) };
    }

    // 7. Discount filter
    const reqDiscount = minDiscount || discount;
    if (reqDiscount && !isNaN(parseFloat(reqDiscount))) {
      query.discount = { $gte: parseFloat(reqDiscount) };
    }

    // 8. Stock availability filter
    if (inStock === 'true') {
      query.$or = (query.$or || []).concat([
        { stock: { $gt: 0 } },
        { inventory: { $gt: 0 } }
      ]);
    }
    
    // 9. Featured filter
    if (featured === 'true') {
      query.featured = true;
    }
    
    // 10. Sort options
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === 'popularity') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === 'name') {
      sortOption = { name: 1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }
    
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Calculate dynamic min/max prices for filtering UI
    const priceAgg = await Product.aggregate([
      { $match: query },
      { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } }
    ]);
    const minAvailablePrice = priceAgg.length > 0 ? priceAgg[0].min : 0;
    const maxAvailablePrice = priceAgg.length > 0 ? priceAgg[0].max : 10000;

    // Get categories count breakdown
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      minPrice: minAvailablePrice,
      maxPrice: maxAvailablePrice,
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

// GET /api/products/search-global - Live MongoDB Search across Departments, Categories, Subcategories, and Products
router.get('/search-global', async (req, res) => {
  try {
    const Department = require('../models/Department');
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.json({
        success: true,
        results: { departments: [], categories: [], subcategories: [], products: [] }
      });
    }

    const queryStr = q.trim();
    const searchRegex = new RegExp(queryStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');

    // 1. Search Departments & embedded Categories & Subcategories
    const departments = await Department.find({ isEnabled: true });
    
    const matchedDepts = [];
    const matchedCats = [];
    const matchedSubs = [];

    departments.forEach(dept => {
      const deptSlug = dept.slug || dept.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      // Match department name
      if (searchRegex.test(dept.name)) {
        if (matchedDepts.length < 3) {
          matchedDepts.push({
            id: dept._id,
            name: dept.name,
            slug: deptSlug,
            image: dept.image
          });
        }
      }

      // Match categories and subcategories embedded in department
      if (dept.categories && Array.isArray(dept.categories)) {
        dept.categories.forEach(cat => {
          const catSlug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          if (searchRegex.test(cat.name)) {
            if (matchedCats.length < 5 && !matchedCats.some(c => c.name.toLowerCase() === cat.name.toLowerCase() && c.departmentSlug === deptSlug)) {
              matchedCats.push({
                id: cat._id,
                name: cat.name,
                slug: catSlug,
                departmentName: dept.name,
                departmentSlug: deptSlug
              });
            }
          }

          if (cat.subcategories && Array.isArray(cat.subcategories)) {
            cat.subcategories.forEach(sub => {
              const subSlug = sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              if (searchRegex.test(sub.name)) {
                if (matchedSubs.length < 5 && !matchedSubs.some(s => s.name.toLowerCase() === sub.name.toLowerCase() && s.categorySlug === catSlug)) {
                  matchedSubs.push({
                    id: sub._id,
                    name: sub.name,
                    slug: subSlug,
                    categoryName: cat.name,
                    categorySlug: catSlug,
                    departmentName: dept.name,
                    departmentSlug: deptSlug
                  });
                }
              }
            });
          }
        });
      }
    });

    // 2. Search Products (matching name or description)
    const matchedProducts = await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    })
    .select('_id name price originalPrice discount images department category subCategory rating')
    .limit(5);

    res.json({
      success: true,
      query: queryStr,
      results: {
        departments: matchedDepts,
        categories: matchedCats,
        subcategories: matchedSubs,
        products: matchedProducts
      }
    });
  } catch (error) {
    console.error('Error performing global search:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id/related - Fetch related products (up to 10 items) prioritizing subcategory -> category -> department -> general catalog
router.get('/:id/related', async (req, res) => {
  try {
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const currentId = currentProduct._id;
    const TARGET_COUNT = 10;
    let relatedProducts = [];

    // Tier 1: Match Subcategory (ID or text string)
    const subConditions = [];
    if (currentProduct.subcategoryId) {
      subConditions.push({ subcategoryId: currentProduct.subcategoryId });
    }
    if (currentProduct.subCategory) {
      subConditions.push({ subCategory: { $regex: new RegExp(`^${currentProduct.subCategory.trim()}$`, 'i') } });
    }

    if (subConditions.length > 0) {
      relatedProducts = await Product.find({
        _id: { $ne: currentId },
        $or: subConditions
      })
      .select('_id name price originalPrice discount images image department category subCategory rating reviewCount stock')
      .limit(TARGET_COUNT);
    }

    // Tier 2: Backfill with Category match if Tier 1 returned fewer than 10 products
    if (relatedProducts.length < TARGET_COUNT) {
      const existingIds = [currentId, ...relatedProducts.map(p => p._id)];
      const catConditions = [];
      if (currentProduct.categoryId) {
        catConditions.push({ categoryId: currentProduct.categoryId });
      }
      if (currentProduct.category) {
        catConditions.push({ category: { $regex: new RegExp(`^${currentProduct.category.trim()}$`, 'i') } });
      }

      if (catConditions.length > 0) {
        const catProducts = await Product.find({
          _id: { $nin: existingIds },
          $or: catConditions
        })
        .select('_id name price originalPrice discount images image department category subCategory rating reviewCount stock')
        .limit(TARGET_COUNT - relatedProducts.length);

        relatedProducts = [...relatedProducts, ...catProducts];
      }
    }

    // Tier 3: Backfill with Department match if still fewer than 10 products
    if (relatedProducts.length < TARGET_COUNT) {
      const existingIds = [currentId, ...relatedProducts.map(p => p._id)];
      const deptConditions = [];
      if (currentProduct.departmentId) {
        deptConditions.push({ departmentId: currentProduct.departmentId });
      }
      if (currentProduct.department) {
        deptConditions.push({ department: { $regex: new RegExp(`^${currentProduct.department.trim()}$`, 'i') } });
      }

      if (deptConditions.length > 0) {
        const deptProducts = await Product.find({
          _id: { $nin: existingIds },
          $or: deptConditions
        })
        .select('_id name price originalPrice discount images image department category subCategory rating reviewCount stock')
        .limit(TARGET_COUNT - relatedProducts.length);

        relatedProducts = [...relatedProducts, ...deptProducts];
      }
    }

    // Tier 4: Backfill any other products if still fewer than 10
    if (relatedProducts.length < TARGET_COUNT) {
      const existingIds = [currentId, ...relatedProducts.map(p => p._id)];
      const extraProducts = await Product.find({ _id: { $nin: existingIds } })
        .select('_id name price originalPrice discount images image department category subCategory rating reviewCount stock')
        .limit(TARGET_COUNT - relatedProducts.length);

      relatedProducts = [...relatedProducts, ...extraProducts];
    }

    res.json({
      success: true,
      products: relatedProducts
    });
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ success: false, message: error.message });
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
      category, subCategory, department, departmentId, categoryId, subcategoryId,
      brand, images, inventory, rating, isNew, featured 
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
      department: department || '',
      departmentId: departmentId || null,
      categoryId: categoryId || null,
      subcategoryId: subcategoryId || null,
      category,
      subCategory: subCategory || 'General',
      brand: brand || 'Luxury Brand',
      images,
      inventory,
      stock: inventory,
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

// Bulk Delete products (Admin) - MUST be placed before DELETE /:id
router.delete('/bulk', adminAuth, async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a non-empty array of productIds to delete'
      });
    }

    const deleteResult = await Product.deleteMany({ _id: { $in: productIds } });

    // Clean up references from user carts & wishlists safely
    try {
      await User.updateMany(
        {},
        {
          $pull: {
            cart: { product: { $in: productIds } },
            wishlist: { $in: productIds }
          }
        }
      );
    } catch (cleanErr) {
      console.warn('Non-fatal cleanup error for user carts/wishlists:', cleanErr.message);
    }

    res.json({
      success: true,
      message: `${deleteResult.deletedCount || productIds.length} product(s) deleted successfully`,
      deletedCount: deleteResult.deletedCount || productIds.length
    });
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting products',
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

// Delete single product
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

// POST /api/products/:id/reviews - Add review & rating to product
router.post('/:id/reviews', async (req, res) => {
  try {
    const { rating, comment, images, videos, userName, userAvatar } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviewRating = Number(rating) || 5;
    const newReview = {
      userName: userName || 'Verified Customer',
      userAvatar: userAvatar || '',
      rating: reviewRating,
      comment: comment || '',
      images: Array.isArray(images) ? images : (req.body.image ? [req.body.image] : []),
      videos: Array.isArray(videos) ? videos : (req.body.video ? [req.body.video] : []),
      createdAt: new Date()
    };

    if (!product.reviews) product.reviews = [];
    product.reviews.unshift(newReview);
    product.numReviews = product.reviews.length;

    // Recalculate average rating automatically
    const totalRatingSum = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = Number((totalRatingSum / product.reviews.length).toFixed(1));

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review and rating added successfully!',
      product
    });
  } catch (error) {
    console.error('Error adding product review:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;