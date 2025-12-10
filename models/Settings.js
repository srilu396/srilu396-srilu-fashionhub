const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  general: {
    siteName: { type: String, default: 'SriluFashionHub' },
    siteTagline: { type: String, default: 'Where Luxury Meets Elegance' },
    adminEmail: { type: String, default: 'admin@srilufashionhub.com' },
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
  },
  
  store: {
    taxRate: { type: Number, default: 18 },
    shippingFee: { type: Number, default: 5.99 },
    freeShippingThreshold: { type: Number, default: 100 },
    storeCurrency: { type: String, default: 'USD' },
    weightUnit: { type: String, default: 'kg' },
    dimensionsUnit: { type: String, default: 'cm' },
  },
  
  payments: {
    stripeEnabled: { type: Boolean, default: true },
    paypalEnabled: { type: Boolean, default: true },
    razorpayEnabled: { type: Boolean, default: true },
    cashOnDelivery: { type: Boolean, default: true },
    paymentGateway: { type: String, default: 'stripe' },
    stripeKey: { type: String, default: '' },
    paypalClientId: { type: String, default: '' },
  },
  
  email: {
    smtpHost: { type: String, default: 'smtp.gmail.com' },
    smtpPort: { type: String, default: '587' },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    emailSender: { type: String, default: 'noreply@srilufashionhub.com' },
    emailEncryption: { type: String, default: 'tls' },
  },
  
  security: {
    twoFactorAuth: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 30 },
    ipRestriction: { type: Boolean, default: false },
    allowedIPs: [{ type: String }],
    loginAttempts: { type: Number, default: 5 },
  },
  
  notifications: {
    notifyNewOrders: { type: Boolean, default: true },
    notifyLowStock: { type: Boolean, default: true },
    notifyNewUsers: { type: Boolean, default: true },
    notifyReviews: { type: Boolean, default: true },
  },
  
  maintenance: {
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { 
      type: String, 
      default: 'We are upgrading our system for better service. Please check back soon.' 
    },
    allowAdminAccess: { type: Boolean, default: true },
  },
  
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);