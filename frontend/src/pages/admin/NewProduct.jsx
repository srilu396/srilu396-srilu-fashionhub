import React, { useState, useEffect } from 'react';
import { productAPI } from '../../utils/api';

const NewProduct = () => {
  const [formData, setFormData] = useState({
    name: '',  
    description: '',
    price: '',
    originalPrice: '',
    discount: '',
    category: '',
    brand: '',
    images: [''],
    inventory: '',
    rating: '4.5',
    isNew: true,
    featured: false
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Luxury color palette
  const colors = {
    primary: '#1C1C1C',
    gold: '#D4AF37',
    champagne: '#F7E7CE',
    burgundy: '#4B1C2F',
    neutral: '#F5F5F5',
    darkBg: '#0F0F0F',
    emerald: '#014421'
  };

  // Enhanced CSS styles with advanced animations
  const styles = {
    container: {
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.darkBg} 0%, ${colors.primary} 100%)`,
      padding: '24px',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      position: 'relative',
      overflow: 'hidden'
    },
    animatedBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      opacity: 0.6
    },
    floatingElement: {
      position: 'absolute',
      borderRadius: '50%',
      border: `1px solid ${colors.gold}20`,
      animation: 'float 8s ease-in-out infinite'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '32px',
      animation: 'slideInRight 0.8s ease-out',
      position: 'relative',
      zIndex: 2
    },
    accentBar: {
      width: '4px',
      height: '48px',
      background: `linear-gradient(to bottom, ${colors.gold}, ${colors.champagne})`,
      marginRight: '16px',
      borderRadius: '2px'
    },
    titleContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    emoji: {
      fontSize: '2rem',
      animation: 'bounceIn 1s ease-out, pulse 2s infinite 2s'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '700',
      background: `linear-gradient(135deg, ${colors.gold}, ${colors.champagne})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: '0 0 8px 0',
      animation: 'textGlow 3s ease-in-out infinite alternate'
    },
    subtitle: {
      color: '#9CA3AF',
      fontSize: '1.1rem',
      margin: 0,
      fontWeight: '300'
    },
    form: {
      background: `linear-gradient(145deg, ${colors.primary} 0%, #2C2C2C 100%)`,
      border: `1px solid ${colors.gold}30`,
      borderRadius: '20px',
      padding: '40px',
      boxShadow: `
        0 25px 50px -12px rgba(0, 0, 0, 0.5),
        inset 0 1px 0 ${colors.gold}20
      `,
      maxWidth: '800px',
      margin: '0 auto',
      animation: 'fadeInUp 0.8s ease-out 0.2s both',
      position: 'relative',
      overflow: 'hidden',
      zIndex: 2,
      backdropFilter: 'blur(20px)'
    },
    formGlow: {
      position: 'absolute',
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      background: `radial-gradient(circle, ${colors.gold}15 0%, transparent 70%)`,
      animation: 'rotateGlow 15s linear infinite'
    },
    particle: {
      position: 'absolute',
      width: '4px',
      height: '4px',
      background: colors.gold,
      borderRadius: '50%',
      animation: 'particleFloat 6s ease-in-out infinite'
    },
    input: {
      background: 'rgba(30, 30, 30, 0.9)',
      border: `1px solid #444`,
      color: colors.neutral,
      padding: '16px 20px',
      borderRadius: '12px',
      fontSize: '16px',
      width: '100%',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(10px)'
    },
    select: {
      background: `rgba(30, 30, 30, 0.95) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23D4AF37' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e") right 16px center/16px 16px no-repeat`,
      border: `1px solid #444`,
      color: colors.neutral,
      padding: '16px 20px',
      borderRadius: '12px',
      width: '100%',
      appearance: 'none',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      fontSize: '16px'
    },
    btnPrimary: {
      background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.champagne} 100%)`,
      color: colors.primary,
      border: 'none',
      padding: '16px 32px',
      borderRadius: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontSize: '16px',
      position: 'relative',
      overflow: 'hidden'
    },
    btnSecondary: {
      background: 'transparent',
      color: colors.gold,
      border: `2px solid ${colors.gold}`,
      padding: '12px 24px',
      borderRadius: '10px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(10px)'
    },
    message: {
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '24px',
      border: '1px solid',
      animation: 'fadeInUp 0.5s ease-out',
      backdropFilter: 'blur(10px)'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '28px'
    },
    label: {
      display: 'block',
      color: colors.gold,
      fontSize: '15px',
      fontWeight: '600',
      marginBottom: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    imageInputContainer: {
      display: 'flex',
      gap: '12px',
      marginBottom: '12px',
      alignItems: 'center'
    }
  };

  // Advanced animations with background effects
  const animations = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(40px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(-40px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes rotateGlow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    
    @keyframes bounceIn {
      0% { transform: scale(0.3) rotate(-180deg); opacity: 0; }
      50% { transform: scale(1.1) rotate(0deg); opacity: 0.8; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    
    @keyframes float {
      0%, 100% { 
        transform: translateY(0px) rotate(0deg) scale(1);
        opacity: 0.1;
      }
      33% { 
        transform: translateY(-20px) rotate(120deg) scale(1.1);
        opacity: 0.3;
      }
      66% { 
        transform: translateY(10px) rotate(240deg) scale(0.9);
        opacity: 0.2;
      }
    }
    
    @keyframes particleFloat {
      0%, 100% { 
        transform: translate(0, 0) scale(1);
        opacity: 0;
      }
      10% { 
        opacity: 1;
      }
      90% { 
        opacity: 0;
      }
    }
    
    @keyframes textGlow {
      from {
        filter: drop-shadow(0 0 5px ${colors.gold}40);
      }
      to {
        filter: drop-shadow(0 0 20px ${colors.gold}80);
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* Animation Classes */
    .fade-in-up { 
      animation: fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; 
    }
    
    .slide-in-right { 
      animation: slideInRight 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; 
    }
    
    .bounce-in { 
      animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) both; 
    }
    
    .hover-lift { 
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); 
    }
    
    .hover-lift:hover { 
      transform: translateY(-8px) scale(1.02); 
      box-shadow: 0 30px 60px rgba(212, 175, 55, 0.15); 
    }
    
    .pulse-once { 
      animation: pulse 0.5s ease-in-out; 
    }
    
    /* Button Effects */
    .btn-glow:hover::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: shimmer 1.5s infinite;
    }
    
    /* Form Element Focus States */
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: ${colors.gold} !important;
      box-shadow: 
        0 0 0 4px ${colors.gold}15,
        inset 0 0 20px rgba(212, 175, 55, 0.1) !important;
      transform: translateY(-2px);
      animation: pulse 0.3s ease-in-out;
    }
    
    /* Button Hover Effects */
    button:hover {
      transform: translateY(-3px);
      box-shadow: 
        0 20px 40px rgba(212, 175, 55, 0.3),
        0 0 30px rgba(212, 175, 55, 0.2);
    }
    
    /* Success Animation */
    .success-glow {
      animation: pulse 0.6s ease-in-out 3;
    }
    
    /* ========== FIXED SELECT DROPDOWN STYLES ========== */
    
    /* Select hover/focus states */
    select:hover {
      border-color: ${colors.gold} !important;
      background-color: rgba(40, 40, 40, 0.95) !important;
      color: ${colors.neutral} !important;
    }
    
    select:focus {
      border-color: ${colors.gold} !important;
      background-color: rgba(35, 35, 35, 0.98) !important;
      color: ${colors.neutral} !important;
    }
    
    /* Dropdown options styling - FIXED FOR ALL OPTIONS */
    select option {
      background-color: rgb(30, 30, 30) !important;
      color: ${colors.neutral} !important;
      padding: 12px 20px !important;
      font-size: 14px !important;
      height: 40px !important;
      line-height: 40px !important;
    }
    
    select option:hover,
    select option:focus {
      background-color: ${colors.gold} !important;
      color: ${colors.primary} !important;
      cursor: pointer !important;
    }
    
    select option:checked {
      background-color: ${colors.gold} !important;
      color: ${colors.primary} !important;
    }
    
    /* Ensure dropdown shows all options properly */
    select {
      height: auto !important;
      min-height: 56px !important;
      overflow-y: auto !important;
    }
    
    select:focus option:checked {
      background-color: ${colors.gold} !important;
      color: ${colors.primary} !important;
    }
    
    /* Ensure dropdown text is always visible */
    select, select option {
      color: ${colors.neutral} !important;
      background-color: rgba(30, 30, 30, 0.98) !important;
    }
    
    /* Fix dropdown arrow */
    select {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23D4AF37' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e") !important;
      background-repeat: no-repeat !important;
      background-position: right 16px center !important;
      background-size: 16px 16px !important;
      -webkit-appearance: none !important;
      -moz-appearance: none !important;
      appearance: none !important;
    }
    
    /* Fix dropdown container to show all options */
    select {
      z-index: 1000 !important;
      position: relative !important;
    }
    
    select:focus {
      z-index: 1001 !important;
    }
    
    /* Firefox specific fixes */
    @-moz-document url-prefix() {
      select {
        background-color: rgba(30, 30, 30, 0.98) !important;
        color: ${colors.neutral} !important;
        text-shadow: 0 0 0 ${colors.neutral} !important;
      }
      
      select option {
        background-color: rgb(30, 30, 30) !important;
        color: ${colors.neutral} !important;
        display: block !important;
        padding: 10px !important;
      }
    }
    
    /* Safari/Chrome fixes */
    @media screen and (-webkit-min-device-pixel-ratio:0) {
      select {
        padding-right: 50px !important;
      }
      
      select option {
        background-color: rgb(30, 30, 30) !important;
        color: ${colors.neutral} !important;
        padding: 12px 20px !important;
        font-size: 14px !important;
      }
    }
    
    /* Background animation elements */
    .animated-bg-element {
      position: absolute;
      pointer-events: none;
      z-index: 1;
    }
  `;

const getCategoryDisplayName = (category) => {
  const categoryMap = {
    'dresses': '👗 Dresses',
    'tops': '👚 Tops & Blouses', 
    'shoes': '👠 Footwear',
    'accessories': '👜 Accessories',
    'coats': '🧥 Coats & Jackets',
    'jewelry': '💎 Jewelry',
    'bags': '👜 Bags',
    'perfumes': '🌸 Perfumes',
    "women's clothing": "👚 Women's Clothing",
    'jewelery': '💎 Jewelery'
  };
  return categoryMap[category] || category;
};


  // Add styles to document and create animated background elements
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = animations;
    document.head.appendChild(styleSheet);
    
    // Create floating elements for background
    const container = document.querySelector('.animated-background');
    if (container) {
      for (let i = 0; i < 15; i++) {
        const element = document.createElement('div');
        element.className = 'animated-bg-element';
        Object.assign(element.style, {
          ...styles.floatingElement,
          width: `${Math.random() * 100 + 50}px`,
          height: `${Math.random() * 100 + 50}px`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${Math.random() * 10 + 10}s`,
          background: `radial-gradient(circle, ${colors.gold}${Math.floor(Math.random() * 10 + 5)} 0%, transparent 70%)`
        });
        container.appendChild(element);
      }
      
      // Create particles
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'animated-bg-element';
        Object.assign(particle.style, {
          ...styles.particle,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 6}s`,
          animationDuration: `${Math.random() * 4 + 4}s`,
          opacity: Math.random() * 0.5 + 0.1
        });
        container.appendChild(particle);
      }
    }
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Fetch categories on component mount - FIXED WITH ALL WOMEN'S CATEGORIES
  useEffect(() => {

async function fetchValidCategories() {
  try {
    console.log('🔍 Setting categories...');
    
    // DON'T fetch from database - use ALL categories your backend supports
    const allCategories = [
      'dresses',
      'tops', 
      'shoes',
      'accessories',
      'coats',
      'jewelry',
      'bags',
      'perfumes',
      "women's clothing",
      'jewelery'  // Keep this if your backend accepts it
    ];
    
    console.log('✅ All categories set:', allCategories);
    setCategories(allCategories);
    
    // Set default category if none selected
    if (!formData.category && allCategories.length > 0) {
      setFormData(prev => ({
        ...prev,
        category: allCategories[0]  // Default to 'dresses'
      }));
    }
    
  } catch (error) {
    console.error('❌ Error setting categories:', error);
    // Simple fallback
    const fallback = [
      'dresses',
      'tops', 
      'shoes',
      'accessories',
      'coats',
      'jewelry',
      'bags',
      'perfumes',
      "women's clothing"
    ];
    setCategories(fallback);
  }
}
    
    fetchValidCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const removeImageField = (index) => {
    if (formData.images.length > 1) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        images: newImages
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Basic validation
      if (!formData.name || formData.name.trim() === '') {
        throw new Error('Product name is required');
      }
      if (!formData.description || formData.description.trim() === '') {
        throw new Error('Description is required');
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('Price must be greater than 0');
      }
      if (!formData.category || formData.category.trim() === '') {
        throw new Error('Category is required');
      }
      if (!formData.inventory || parseInt(formData.inventory) < 0) {
        throw new Error('Inventory must be 0 or greater');
      }
      if (!formData.images || formData.images.length === 0 || !formData.images[0].trim()) {
        throw new Error('At least one image URL is required');
      }

      // Prepare data
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        images: formData.images.filter(img => img && img.trim() !== ''),
        inventory: parseInt(formData.inventory),
        brand: formData.brand || 'Unknown',
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : parseFloat(formData.price),
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        rating: formData.rating ? parseFloat(formData.rating) : 4.5,
        isNew: Boolean(formData.isNew),
        featured: Boolean(formData.featured)
      };

      console.log('📤 Sending to backend:', submitData);

      // Test API directly first (for debugging)
      console.log('🧪 Testing API directly...');
      const testResponse = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });
      
      const testText = await testResponse.text();
      console.log('🧪 Direct API Test Status:', testResponse.status);
      console.log('🧪 Direct API Test Response:', testText);
      
      let testData;
      try {
        testData = testText ? JSON.parse(testText) : {};
      } catch {
        testData = { raw: testText };
      }
      
      if (!testResponse.ok) {
        // Show detailed error
        const errorMsg = testData.message || testData.error || `Server error: ${testResponse.status}`;
        throw new Error(errorMsg);
      }
      
      // If direct test works, use the API utility
      console.log('✅ Direct test passed, using productAPI...');
      const result = await productAPI.create(submitData);
      
      console.log('📊 API Result:', result);
      
      if (result.success || result._id) {
        setMessage({ 
          type: 'success', 
          text: '🎉 Product created successfully! Redirecting to Products page...' 
        });
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          originalPrice: '',
          discount: '',
          category: '',
          brand: '',
          images: [''],
          inventory: '',
          rating: '4.5',
          isNew: true,
          featured: false
        });
        
        // Redirect to Products Management page after 2 seconds
        setTimeout(() => {
          window.location.href = '/admin/products';
        }, 2000);
        
      } else {
        throw new Error(result.message || 'Unknown error creating product');
      }
    } catch (error) {
      console.error('❌ Submit Error:', error);
      setMessage({ 
        type: 'error', 
        text: `❌ ${error.message || 'Error creating product'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // Test product data with all categories
  const fillTestData = () => {
    const testProducts = [
      {
        name: "Diamond Ring Set",
        description: "Beautiful diamond ring set with 18k gold band. Perfect for engagements and special occasions.",
        price: "599.99",
        category: "jewelry",
        images: [
          "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500&h=500&fit=crop"
        ],
        inventory: "8",
        brand: "Diamond Luxe",
        originalPrice: "699.99",
        discount: "14.3",
        rating: "4.9",
        isNew: true,
        featured: true
      },
      {
        name: "Evening Party Dress",
        description: "Stunning black evening dress with sequin details. Perfect for parties, weddings, and special events.",
        price: "189.99",
        category: "dresses",
        images: [
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=500&fit=crop"
        ],
        inventory: "15",
        brand: "Designer Collection",
        originalPrice: "229.99",
        discount: "17.4",
        rating: "4.7",
        isNew: true,
        featured: true
      },
      {
        name: "Designer High Heels",
        description: "Luxury designer high heels with crystal embellishments. Comfortable fit with premium leather.",
        price: "159.99",
        category: "shoes",
        images: [
          "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=500&fit=crop"
        ],
        inventory: "30",
        brand: "Chic Footwear",
        originalPrice: "199.99",
        discount: "20.0",
        rating: "4.5",
        isNew: true,
        featured: false
      },
      {
        name: "Silk Blouse",
        description: "Premium silk blouse available in various colors and patterns. Perfect for office or casual outings.",
        price: "79.99",
        category: "tops",
        images: [
          "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=500&h=500&fit=crop"
        ],
        inventory: "40",
        brand: "Silk Avenue",
        originalPrice: "89.99",
        discount: "11.1",
        rating: "4.3",
        isNew: false,
        featured: false
      },
      {
        name: "Designer Handbag",
        description: "Luxury leather handbag with gold hardware. Spacious interior with multiple compartments.",
        price: "349.99",
        category: "bags",
        images: [
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop"
        ],
        inventory: "12",
        brand: "Leather Luxe",
        originalPrice: "399.99",
        discount: "12.5",
        rating: "4.9",
        isNew: true,
        featured: true
      },
      {
        name: "Floral Perfume Set",
        description: "Elegant floral perfume set with three different scents. Perfect as a gift or personal use.",
        price: "89.99",
        category: "perfumes",
        images: [
          "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop"
        ],
        inventory: "35",
        brand: "Scent Luxury",
        originalPrice: "109.99",
        discount: "18.2",
        rating: "4.4",
        isNew: true,
        featured: false
      },
      {
        name: "Designer Scarf",
        description: "Premium silk scarf with beautiful patterns. Perfect accessory for any outfit.",
        price: "59.99",
        category: "accessories",
        images: [
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop"
        ],
        inventory: "50",
        brand: "Silk Accessories",
        originalPrice: "69.99",
        discount: "14.3",
        rating: "4.3",
        isNew: false,
        featured: false
      },
      {
        name: "Women's Jeans",
        description: "Comfortable and stylish women's jeans. Perfect for casual everyday wear.",
        price: "89.99",
        category: "pants",
        images: [
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop"
        ],
        inventory: "30",
        brand: "Denim Co.",
        originalPrice: "99.99",
        discount: "10.0",
        rating: "4.2",
        isNew: true,
        featured: false
      }
    ];

    // Randomly select one test product
    const randomProduct = testProducts[Math.floor(Math.random() * testProducts.length)];
    console.log('🎯 Filling test data:', randomProduct);
    setFormData(randomProduct);
  };

  // Add a test button to check backend
  const testBackendConnection = async () => {
    console.log('🔧 Testing backend connection...');
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      console.log('✅ Backend connection successful');
      console.log('📊 Products count:', data.products?.length || 0);
      if (data.products && data.products.length > 0) {
        console.log('📋 Sample product:', data.products[0]);
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
    }
  };

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div className="animated-background" style={styles.animatedBackground}></div>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.accentBar}></div>
          <div>
            <div style={styles.titleContainer}>
              <span style={styles.emoji}>✨</span>
              <h1 style={styles.title}>New Product</h1>
            </div>
            <p style={styles.subtitle}>Add luxury women's fashion items to your collection</p>
          </div>
        </div>

        {/* Test Buttons */}
        <div style={{ textAlign: 'center', marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }} className="fade-in-up">
          <button 
            onClick={fillTestData}
            style={styles.btnSecondary}
            className="hover-lift"
          >
            🎯 Fill Test Data
          </button>
          
          {/* Add this debug button after the test buttons */}
<button 
  onClick={() => {
    console.log('🔍 Current Categories:', categories);
    console.log('Count:', categories.length);
    console.log('With duplicates removed:', [...new Set(categories)]);
  }}
  style={{
    ...styles.btnSecondary,
    background: 'transparent',
    border: `2px solid ${colors.emerald}`,
    color: colors.emerald,
    marginLeft: '10px'
  }}
  className="hover-lift"
>
  🐛 Debug Categories
</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form} className="fade-in-up">
          <div style={styles.formGlow}></div>
          
          {/* Message */}
          {message && (
            <div style={{
              ...styles.message,
              background: message.type === 'error' ? 'rgba(153, 27, 27, 0.2)' : 'rgba(6, 95, 70, 0.2)',
              borderColor: message.type === 'error' ? '#DC2626' : '#059669',
              color: message.type === 'error' ? '#FCA5A5' : '#6EE7B7'
            }} className="bounce-in">
              {message.text}
            </div>
          )}

          {/* Category Info - Shows all available categories */}
          {/* Category Info */}
<div style={{
  background: 'rgba(212, 175, 55, 0.1)',
  border: `1px solid ${colors.gold}30`,
  borderRadius: '10px',
  padding: '15px',
  marginBottom: '20px'
}}>
  <div style={{ 
    color: colors.champagne, 
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '8px'
  }}>
    <strong>All Available Categories ({categories.length}):</strong>
  </div>
  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center'
  }}>
    {/* Show ALL categories, not just first 5 */}
    {categories.map((cat, index) => (
      <span key={index} style={{
        background: formData.category === cat ? colors.gold : 'rgba(212, 175, 55, 0.2)',
        color: formData.category === cat ? colors.primary : colors.gold,
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        border: `1px solid ${colors.gold}40`,
        fontWeight: formData.category === cat ? '600' : '400'
      }}>
        {getCategoryDisplayName(cat)}
      </span>
    ))}
  </div>
  {categories.length > 0 && (
    <div style={{ 
      color: colors.champagne, 
      fontSize: '12px',
      textAlign: 'center',
      marginTop: '8px'
    }}>
      Currently selected: <strong>{getCategoryDisplayName(formData.category) || 'None'}</strong>
    </div>
  )}
</div>

          <div style={styles.grid}>
            {/* Product Name */}
            <div>
              <label style={styles.label}>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={styles.input}
                placeholder="Enter product name"
                className="hover-lift"
              />
            </div>

            {/* Description */}
            <div>
              <label style={styles.label}>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="4"
                style={{...styles.input, resize: 'vertical'}}
                placeholder="Describe the product features..."
                className="hover-lift"
              />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px'}}>
              {/* Price */}
              <div>
                <label style={styles.label}>Price ($) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  style={styles.input}
                  placeholder="0.00"
                  className="hover-lift"
                />
              </div>

              {/* Category - FIXED DROPDOWN WITH ALL OPTIONS */}
              <div>
                <label style={styles.label}>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  style={styles.select}
                  className="hover-lift"
                  size="1" // Single select but shows all options when clicked
                >
                  <option value="">✨ Select a category</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>
                      {getCategoryDisplayName(cat)}
                    </option>
                  ))}
                </select>
                <div style={{
                  fontSize: '12px',
                  color: colors.champagne,
                  marginTop: '5px',
                  textAlign: 'center'
                }}>
                  {categories.length} categories available
                </div>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px'}}>
              {/* Inventory */}
              <div>
                <label style={styles.label}>Inventory *</label>
                <input
                  type="number"
                  name="inventory"
                  value={formData.inventory}
                  onChange={handleInputChange}
                  required
                  min="0"
                  style={styles.input}
                  placeholder="Stock quantity"
                  className="hover-lift"
                />
              </div>
              
              {/* Brand */}
              <div>
                <label style={styles.label}>Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Brand name"
                  className="hover-lift"
                />
              </div>
            </div>

            {/* Additional Fields */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px'}}>
              {/* Original Price */}
              <div>
                <label style={styles.label}>Original Price ($)</label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={styles.input}
                  placeholder="Original price for discounts"
                  className="hover-lift"
                />
              </div>

              {/* Discount */}
              <div>
                <label style={styles.label}>Discount (%)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                  style={styles.input}
                  placeholder="Discount percentage"
                  className="hover-lift"
                />
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px'}}>
              {/* Rating */}
              <div>
                <label style={styles.label}>Rating</label>
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  style={styles.select}
                  className="hover-lift"
                >
                  <option value="5.0">★★★★★ (5.0)</option>
                  <option value="4.5">★★★★½ (4.5)</option>
                  <option value="4.0">★★★★☆ (4.0)</option>
                  <option value="3.5">★★★½☆ (3.5)</option>
                  <option value="3.0">★★★☆☆ (3.0)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={styles.label}>Status</label>
                <div style={{display: 'flex', gap: '20px', marginTop: '10px'}}>
                  <label style={{color: colors.neutral, fontSize: '14px'}}>
                    <input
                      type="checkbox"
                      name="isNew"
                      checked={formData.isNew}
                      onChange={(e) => setFormData({...formData, isNew: e.target.checked})}
                      style={{marginRight: '8px'}}
                    />
                    New Arrival
                  </label>
                  <label style={{color: colors.neutral, fontSize: '14px'}}>
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                      style={{marginRight: '8px'}}
                    />
                    Featured
                  </label>
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <label style={styles.label}>Product Images *</label>
              {formData.images.map((image, index) => (
                <div key={index} style={styles.imageInputContainer}>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    placeholder="Enter image URL (e.g., https://images.unsplash.com/photo-...)"
                    style={styles.input}
                    required={index === 0}
                    className="hover-lift"
                  />
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      style={styles.btnSecondary}
                      className="hover-lift"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                style={styles.btnSecondary}
                className="hover-lift"
              >
                📷 Add Another Image
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{display: 'flex', justifyContent: 'center', marginTop: '40px'}}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.btnPrimary,
                opacity: loading ? 0.7 : 1,
                minWidth: '200px'
              }}
              className="btn-glow hover-lift"
            >
              {loading ? (
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: `2px solid ${colors.primary}`,
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Creating Product...
                </div>
              ) : (
                '🚀 Create Product'
              )}
            </button>
          </div>
        </form>

        {/* Testing Instructions */}
        <div style={{
          background: 'rgba(30, 30, 30, 0.8)',
          border: `1px solid ${colors.gold}30`,
          borderRadius: '12px',
          padding: '20px',
          marginTop: '30px',
          backdropFilter: 'blur(10px)'
        }} className="fade-in-up">
          <h3 style={{color: colors.gold, marginBottom: '10px'}}>👗 Women's Fashion Categories:</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '10px',
            marginTop: '15px'
          }}>
            {categories.slice(0, 12).map((cat, index) => (
              <div key={index} style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: `1px solid ${colors.gold}30`,
                borderRadius: '8px',
                padding: '8px',
                textAlign: 'center',
                fontSize: '12px',
                color: colors.gold
              }}>
                {getCategoryDisplayName(cat)}
              </div>
            ))}
          </div>
        </div>

        {/* Debug Section */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(30, 30, 30, 0.8)',
          borderRadius: '12px',
          border: `1px solid ${colors.gold}30`,
          backdropFilter: 'blur(10px)'
        }} className="fade-in-up">
          <h4 style={{ color: colors.gold, marginBottom: '15px' }}>🔧 Current Status</h4>
          
          <div style={{ marginTop: '15px', fontSize: '12px', color: '#9CA3AF' }}>
            <div><strong>Form Category:</strong> {formData.category || 'None'} - {getCategoryDisplayName(formData.category)}</div>
            <div><strong>Available Categories:</strong> {categories.length}</div>
            <div><strong>Sample Categories:</strong> {categories.map(c => getCategoryDisplayName(c)).join(', ')}...</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProduct;