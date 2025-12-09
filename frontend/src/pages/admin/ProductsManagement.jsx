import React, { useState, useEffect } from 'react';
import { productAPI } from '../../utils/api';

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');



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

  // Categories based on your backend's actual categories
  const categories = {
    all: { 
      name: 'All Products', 
      icon: '🛍️' 
    },
    dresses: { 
      name: 'Dresses', 
      icon: '👗',
      subcategories: ['Casual Dresses', 'Party Wear', 'Evening Gowns', 'Ethnic Wear'] 
    },
    tops: { 
      name: 'Tops & Blouses', 
      icon: '👚',
      subcategories: ['Crop Tops', 'Shirts', 'Tunics', 'Tank Tops'] 
    },
    shoes: { 
      name: 'Footwear', 
      icon: '👠',
      subcategories: ['Heels', 'Flats', 'Sneakers', 'Sandals', 'Boots'] 
    },
    accessories: { 
      name: 'Accessories', 
      icon: '👜',
      subcategories: ['Bags', 'Belts', 'Scarves', 'Hats', 'Sunglasses'] 
    },
    jewelry: { 
      name: 'Jewelry', 
      icon: '💎',
      subcategories: ['Necklaces', 'Earrings', 'Rings', 'Bracelets', 'Anklets'] 
    },
    bags: { 
      name: 'Bags', 
      icon: '👜',
      subcategories: ['Handbags', 'Clutches', 'Tote Bags', 'Backpacks'] 
    },
    perfumes: { 
      name: 'Perfumes', 
      icon: '🌸',
      subcategories: ['Floral', 'Woody', 'Fresh', 'Oriental'] 
    },
    coats: { 
      name: 'Coats & Jackets', 
      icon: '🧥',
      subcategories: ['Winter Coats', 'Jackets', 'Blazers', 'Raincoats'] 
    },
    "women's clothing": { 
      name: "Women's Clothing", 
      icon: '👚',
      subcategories: ['General Wear'] 
    }
  };

  

  // Enhanced animations CSS
  const enhancedAnimations = `
    /* Modern Luxury Animations */
    @keyframes gentleFloat {
      0%, 100% { 
        transform: translateY(0px) scale(1);
        opacity: 0.6;
      }
      50% { 
        transform: translateY(-20px) scale(1.05);
        opacity: 0.8;
      }
    }
    
    @keyframes softGlow {
      0%, 100% { 
        opacity: 0.3;
        box-shadow: 0 0 20px rgba(212, 175, 55, 0.1);
      }
      50% { 
        opacity: 0.6;
        box-shadow: 0 0 40px rgba(212, 175, 55, 0.3);
      }
    }
    
    @keyframes smoothSlideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .smooth-appear {
      animation: smoothSlideUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    }
    
    .glass-morphism {
      background: rgba(30, 30, 30, 0.7);
      backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(212, 175, 55, 0.2);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
  `;

  // Add styles to document
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = enhancedAnimations;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  // FIXED: Correct API response handling
  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching products from API...');
      
      // Clear previous products first
      setProducts([]);
      
      const data = await productAPI.getAll();
      console.log('📊 Raw API response:', data);
      
      // Handle different response formats - FIXED!
      let productsArray = [];
      
      if (data && data.success && Array.isArray(data.products)) {
        // Standard response: {success: true, products: [...]}
        productsArray = data.products;
        console.log(`✅ Found ${productsArray.length} products in data.products`);
      } 
      else if (data && data.data && Array.isArray(data.data)) {
        // Alternative response: {data: [...]}
        productsArray = data.data;
        console.log(`✅ Found ${productsArray.length} products in data.data`);
      }
      else if (Array.isArray(data)) {
        // Direct array response
        productsArray = data;
        console.log(`✅ Found ${productsArray.length} products in direct array`);
      }
      else {
        console.warn('⚠️ Unexpected response format:', data);
        productsArray = []; // Ensure it's always an array
      }
      
      console.log(`✅ Loaded ${productsArray.length} products`);
      setProducts(productsArray);
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setMessage({ 
        type: 'error', 
        text: `❌ Error fetching products: ${error.message}` 
      });
      setProducts([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

 // In your handleImportFromAPI function in ProductsManagement.jsx
const handleImportFromAPI = async () => {
  setImporting(true);
  setMessage('');
  
  try {
    console.log('🚀 Starting import...');
    
    // First, test if the endpoint exists
    try {
      const testResponse = await fetch('http://localhost:5000/api/products/import-from-api', {
        method: 'OPTIONS'
      });
      console.log('🔍 Endpoint test:', testResponse.ok);
    } catch (testError) {
      console.error('🔍 Endpoint test failed:', testError);
    }
    
    const result = await productAPI.importFromAPI();
    console.log('📦 Import result:', result);
    
    if (result && result.success) {
      const messageText = result.message || 'Products imported successfully!';
      setMessage({ 
        type: 'success', 
        text: `✅ ${messageText}` 
      });
      
      setTimeout(() => {
        fetchProducts();
      }, 1500);
      
    } else {
      setMessage({ 
        type: 'error', 
        text: `❌ Import failed: ${result?.message || 'Unknown error'}` 
      });
    }
    
  } catch (error) {
    console.error('❌ Import error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    setMessage({ 
      type: 'error', 
      text: `❌ Import error: ${error.message}` 
    });
  } finally {
    setImporting(false);
  }
};

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      category: product.category || '',
      inventory: product.inventory || 0,
      brand: product.brand || '',
      originalPrice: product.originalPrice || product.price || 0,
      discount: product.discount || 0,
      rating: product.rating || 4.5,
      isNew: product.isNew || false,
      featured: product.featured || false
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const result = await productAPI.update(editingProduct._id, editFormData);
      if (result.success) {
        setMessage({ type: 'success', text: '✅ Product updated successfully!' });
        setEditingProduct(null);
        fetchProducts();
      } else {
        setMessage({ type: 'error', text: '❌ Error updating product' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error updating product: ' + error.message });
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(id);
        setMessage({ type: 'success', text: '✅ Product deleted successfully' });
        setProducts(products.filter(product => product._id !== id));
      } catch (error) {
        setMessage({ type: 'error', text: '❌ Error deleting product: ' + error.message });
      }
    }
  };

  const clearAllProducts = async () => {
    if (window.confirm('⚠️ This will delete ALL products. Are you sure?')) {
      try {
        for (const product of products) {
          await productAPI.delete(product._id);
        }
        setMessage({ type: 'success', text: '✅ All products deleted' });
        setProducts([]);
      } catch (error) {
        setMessage({ type: 'error', text: '❌ Error clearing products: ' + error.message });
      }
    }
  };

  // Enhanced filter logic
  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    if (!product || !product.name || !product.category) return false;
    
    const matchesCategory = activeCategory === 'all' || 
      (product.category && product.category.toLowerCase().includes(activeCategory)) ||
      (categories[activeCategory]?.subcategories?.some(sub => 
        product.category.toLowerCase().includes(sub.toLowerCase())
      ));
    
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  }) : [];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.darkBg} 0%, ${colors.primary} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          border: `3px solid ${colors.gold}30`,
          borderTop: `3px solid ${colors.gold}`,
          borderRadius: '50%',
          animation: 'gentleFloat 2s ease-in-out infinite',
          marginBottom: '30px'
        }}></div>
        <p style={{ 
          color: colors.neutral, 
          fontSize: '20px',
          background: `linear-gradient(135deg, ${colors.gold}, ${colors.champagne})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: '600'
        }}>Loading luxury collection...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      padding: '24px',
      overflow: 'hidden',
      background: `linear-gradient(135deg, ${colors.darkBg} 0%, ${colors.primary} 100%)`
    }}>
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* Header Section */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginBottom: '32px'
        }} className="smooth-appear">
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '6px',
              height: '60px',
              background: `linear-gradient(to bottom, ${colors.gold}, ${colors.champagne})`,
              marginRight: '20px',
              borderRadius: '3px',
              boxShadow: `0 0 20px ${colors.gold}`
            }}></div>
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                background: `linear-gradient(135deg, ${colors.gold}, ${colors.champagne})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: '0 0 8px 0'
              }}>
                Luxury Fashion Hub
              </h1>
              <p style={{
                color: colors.champagne,
                fontSize: '1.2rem',
                margin: '12px 0 0 0',
                fontWeight: '300',
                opacity: 0.9
              }}>Curated Collection Management</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={handleImportFromAPI}
              disabled={importing}
              className="glass-morphism"
              style={{
                background: 'transparent',
                color: colors.gold,
                border: `2px solid ${colors.gold}`,
                padding: '16px 32px',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: importing ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                opacity: importing ? 0.7 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              {importing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: `3px solid ${colors.gold}30`,
                    borderTop: `3px solid ${colors.gold}`,
                    borderRadius: '50%',
                    animation: 'gentleFloat 1s ease-in-out infinite'
                  }}></div>
                  Importing...
                </div>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🚀 Import New Products
                </span>
              )}
            </button>
            
            {products.length > 0 && (
              <button
                onClick={clearAllProducts}
                className="glass-morphism"
                style={{
                  background: 'transparent',
                  color: '#F87171',
                  border: '2px solid #F87171',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🗑️ Clear All Products
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid',
            background: message.type === 'error' ? 'rgba(153, 27, 27, 0.2)' : 'rgba(6, 95, 70, 0.2)',
            borderColor: message.type === 'error' ? '#DC2626' : '#059669',
            color: message.type === 'error' ? '#FCA5A5' : '#6EE7B7',
            animation: 'smoothSlideUp 0.5s ease-out',
            backdropFilter: 'blur(15px)'
          }} className="glass-morphism">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px' }}>
              {message.type === 'error' ? '❌' : '✅'}
              {message.text}
            </div>
          </div>
        )}

        {/* Debug Section - Add this */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => {
              console.log('🔍 Debugging products state...');
              console.log('Current products:', products);
              console.log('Type of products:', typeof products);
              console.log('Is array?', Array.isArray(products));
              console.log('Length:', products.length);
              console.log('Filtered products:', filteredProducts.length);
            }}
            style={{
              background: 'transparent',
              border: '1px solid #60A5FA',
              color: '#60A5FA',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            className="glass-morphism"
          >
            🔍 Debug State
          </button>
          
          <button
            onClick={async () => {
              console.log('📡 Testing API directly...');
              try {
                const response = await fetch('http://localhost:5000/api/products');
                const data = await response.json();
                console.log('Direct API response:', data);
                alert(`API Status: ${response.status}\nProducts: ${data.products?.length || 0}`);
              } catch (error) {
                console.error('API Test Error:', error);
                alert(`API Error: ${error.message}`);
              }
            }}
            style={{
              background: 'transparent',
              border: '1px solid #10B981',
              color: '#10B981',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            className="glass-morphism"
          >
            📡 Test API
          </button>
          
          <button
            onClick={fetchProducts}
            style={{
              background: 'transparent',
              border: '1px solid #F59E0B',
              color: '#F59E0B',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            className="glass-morphism"
          >
            🔄 Refresh Products
          </button>
        </div>

        {/* Category Filter */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }} className="smooth-appear">
          {Object.entries(categories).map(([key, category], index) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className="glass-morphism"
              style={{
                padding: '14px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                animation: `smoothSlideUp 0.6s ease-out ${index * 0.1}s both`,
                background: 'transparent',
                border: `1px solid ${colors.gold}40`,
                color: colors.neutral,
                transition: 'all 0.3s ease',
                ...(activeCategory === key ? {
                  background: `linear-gradient(135deg, ${colors.gold}20, ${colors.champagne}20)`,
                  border: `1px solid ${colors.gold}`,
                  color: colors.gold
                } : {})
              }}
            >
              <span>{category.icon}</span>
              {category.name}
              <span style={{ 
                background: colors.gold, 
                color: colors.primary,
                borderRadius: '10px',
                padding: '3px 8px',
                fontSize: '11px',
                marginLeft: '6px',
                fontWeight: '700',
                minWidth: '25px'
              }}>
                {key === 'all' ? products.length : products.filter(p => 
                  p.category && p.category.toLowerCase() === key.toLowerCase()
                ).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div style={{ marginBottom: '32px' }} className="smooth-appear">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'rgba(30, 30, 30, 0.8)',
                border: `1px solid #444`,
                color: colors.neutral,
                padding: '14px 20px 14px 45px',
                borderRadius: '10px',
                fontSize: '15px',
                width: '380px',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              className="glass-morphism"
            />
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.gold,
              fontSize: '16px'
            }}>🔍</div>
          </div>
        </div>

        {/* Products Display */}
        <div className="smooth-appear">
          {filteredProducts.length === 0 ? (
            <div style={{
              background: `linear-gradient(145deg, ${colors.primary} 0%, #2C2C2C 100%)`,
              border: `1px solid ${colors.gold}40`,
              borderRadius: '20px',
              padding: '60px',
              textAlign: 'center',
              color: '#9CA3AF',
              backdropFilter: 'blur(15px)'
            }} className="glass-morphism">
              <div style={{fontSize: '48px', marginBottom: '20px'}}>👗</div>
              <h3 style={{color: colors.gold, marginBottom: '12px', fontSize: '1.3rem'}}>
                No products found
              </h3>
              <p style={{color: colors.champagne, fontSize: '1rem'}}>
                {products.length === 0 ? 'Add products or import from API' : 
                 searchTerm ? 'Try a different search term' : 
                 `No products in "${categories[activeCategory]?.name}" category`}
              </p>
              {products.length === 0 && (
                <button
                  onClick={handleImportFromAPI}
                  style={{
                    marginTop: '20px',
                    background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.champagne} 100%)`,
                    color: colors.primary,
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🚀 Import Sample Products
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {filteredProducts.map((product, index) => (
                <div key={product._id || index} style={{
                  background: `linear-gradient(145deg, ${colors.primary} 0%, #2C2C2C 100%)`,
                  border: `1px solid ${colors.gold}30`,
                  borderRadius: '16px',
                  padding: '20px',
                  transition: 'all 0.4s ease',
                  animation: `smoothSlideUp 0.6s ease-out ${index * 0.1}s both`,
                  backdropFilter: 'blur(15px)'
                }} className="glass-morphism">
                  <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                    <img 
                      src={product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/70x70/1C1C1C/D4AF37?text=📷'} 
                      alt={product.name}
                      style={{ 
                        width: '70px', 
                        height: '70px', 
                        borderRadius: '10px', 
                        objectFit: 'cover',
                        border: `2px solid ${colors.gold}30`
                      }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/70x70/1C1C1C/D4AF37?text=📷';
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        color: colors.neutral, 
                        margin: '0 0 10px 0',
                        fontSize: '15px',
                        lineHeight: '1.4',
                        fontWeight: '600'
                      }}>
                        {product.name || 'Untitled Product'}
                      </h4>
                      <p style={{ 
                        color: '#9CA3AF', 
                        fontSize: '13px',
                        margin: '0 0 10px 0',
                        lineHeight: '1.4'
                      }}>
                        {(product.description || '').substring(0, 70)}...
                      </p>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          color: colors.champagne,
                          fontWeight: '700',
                          fontSize: '18px'
                        }}>
                          ${typeof product.price === 'number' ? product.price.toFixed(2) : (parseFloat(product.price) || 0).toFixed(2)}
                        </span>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: (product.inventory || 0) > 10 
                            ? 'rgba(6, 95, 70, 0.2)' 
                            : (product.inventory || 0) > 0 
                              ? 'rgba(146, 64, 14, 0.2)'
                              : 'rgba(153, 27, 27, 0.2)',
                          color: (product.inventory || 0) > 10 
                            ? '#6EE7B7' 
                            : (product.inventory || 0) > 0 
                              ? '#FBBF24'
                              : '#FCA5A5'
                        }}>
                          {product.inventory || 0} in stock
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px',
                    borderTop: `1px solid ${colors.gold}20`,
                    paddingTop: '16px'
                  }}>
                    <button 
                      onClick={() => handleEditProduct(product)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        background: 'transparent',
                        border: '1px solid #60A5FA',
                        color: '#60A5FA',
                        transition: 'all 0.3s ease'
                      }}
                      className="glass-morphism"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product._id)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        background: 'transparent',
                        border: '1px solid #F87171',
                        color: '#F87171',
                        transition: 'all 0.3s ease'
                      }}
                      className="glass-morphism"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {products.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '32px'
          }} className="smooth-appear">
            {[
              { label: 'Total Products', value: products.length },
              { label: 'In Stock', value: products.filter(p => (p.inventory || 0) > 0).length },
              { label: 'Total Value', value: `$${products.reduce((sum, p) => sum + (typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0), 0).toFixed(2)}` },
              { label: 'Categories', value: new Set(products.filter(p => p.category).map(p => p.category)).size }
            ].map((stat, index) => (
              <div key={stat.label} style={{
                background: `linear-gradient(145deg, ${colors.primary} 0%, #2C2C2C 100%)`,
                border: `1px solid ${colors.gold}40`,
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                transition: 'all 0.4s ease',
                backdropFilter: 'blur(15px)',
                animation: `smoothSlideUp 0.6s ease-out ${index * 0.1}s both`
              }} className="glass-morphism">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: colors.gold, marginBottom: '8px' }}>
                  {stat.value}
                </div>
                <div style={{ color: colors.champagne, fontSize: '14px', fontWeight: '600' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsManagement;