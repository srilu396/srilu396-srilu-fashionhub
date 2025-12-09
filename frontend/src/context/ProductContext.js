import React, { createContext, useContext, useState, useCallback } from 'react';
import { productAPI } from '../utils/api';

const ProductContext = createContext();

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within ProductProvider');
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  // Fetch all products
  const fetchProducts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      if (filters.minPrice) {
        params.append('minPrice', filters.minPrice);
      }
      
      if (filters.maxPrice) {
        params.append('maxPrice', filters.maxPrice);
      }
      
      if (filters.sort) {
        params.append('sort', filters.sort);
      }
      
      const queryString = params.toString();
      const url = `/products${queryString ? `?${queryString}` : ''}`;
      
      const response = await productAPI.getAll();
      
      // Handle both response formats
      let productList = [];
      let categoryList = [];
      
      if (response.success) {
        // New format with success flag
        productList = response.products || [];
        categoryList = response.categories || [];
      } else {
        // Old format - assume it's just an array
        productList = Array.isArray(response) ? response : [];
      }
      
      setProducts(productList);
      
      // Update categories if available
      if (categoryList.length > 0) {
        setCategories(categoryList);
      }
      
      return productList;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get product by ID
  const getProductById = useCallback((id) => {
    return products.find(product => product._id === id || product.id === id);
  }, [products]);

  // Search products
  const searchProducts = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(product => {
      const name = product.name || product.title || '';
      const description = product.description || '';
      const brand = product.brand || '';
      
      return name.toLowerCase().includes(term) ||
             description.toLowerCase().includes(term) ||
             brand.toLowerCase().includes(term);
    });
  }, [products]);

  // Get products by category
  const getProductsByCategory = useCallback((categoryId) => {
    if (categoryId === 'all') return products;
    return products.filter(product => product.category === categoryId);
  }, [products]);

  const value = {
    products,
    loading,
    error,
    categories,
    fetchProducts,
    getProductById,
    searchProducts,
    getProductsByCategory,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};