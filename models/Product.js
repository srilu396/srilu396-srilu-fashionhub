const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {  // CHANGED: title to name for consistency
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {  // ADDED: For showing discounts
    type: Number,
    default: 0
  },
  discount: {  // ADDED: Discount percentage
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  category: {
  type: String,
  required: [true, 'Product category is required'],
  enum: ['dresses', 'tops', 'shoes', 'accessories', 'coats', 'jewelry', 'bags', 'perfumes', 'women\'s clothing', 'jewelery']
},
  brand: {  // ADDED: Brand name
    type: String,
    default: 'Luxury Brand'
  },
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  inventory: {
    type: Number,
    required: [true, 'Inventory count is required'],
    min: [0, 'Inventory cannot be negative'],
    default: 0
  },
  rating: {  // ADDED: Product rating
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  isNew: {  // ADDED: New product flag
    type: Boolean,
    default: true
  },
  featured: {  // ADDED: Featured product flag
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate originalPrice if not set
  if (!this.originalPrice || this.originalPrice === 0) {
    this.originalPrice = this.price;
  }
  
  // Calculate discount if originalPrice is higher than price
  if (this.originalPrice > this.price) {
    this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  
  next();
});

// Add index for better search performance
productSchema.index({ name: 'text', description: 'text', category: 1 });

module.exports = mongoose.model('Product', productSchema);