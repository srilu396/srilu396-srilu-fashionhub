// Product categories with icons
export const CATEGORIES = [
  { id: 'all', name: 'All Products', icon: '🛍️', color: '#D4AF37' },
  { id: 'dresses', name: 'Dresses', icon: '👗', color: '#FF6B8B' },
  { id: 'tops', name: 'Tops & Blouses', icon: '👚', color: '#4B1C2F' },
  { id: 'shoes', name: 'Footwear', icon: '👠', color: '#014421' },
  { id: 'accessories', name: 'Accessories', icon: '👜', color: '#001F3F' },
  { id: 'coats', name: 'Coats & Jackets', icon: '🧥', color: '#7D2C4F' },
  { id: 'jewelry', name: 'Jewelry', icon: '💎', color: '#F7E7CE' },
  { id: 'bags', name: 'Handbags', icon: '🛍️', color: '#E5DCC3' },
  { id: 'perfumes', name: 'Perfumes', icon: '💄', color: '#9C27B0' },
];

// Background images for slideshow
export const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
];

// Quick actions for dashboard
export const QUICK_ACTIONS = [
  { icon: '🚚', label: 'Track Order', route: '/user/orders' },
  { icon: '❤️', label: 'Wishlist', route: '/user/wishlist' },
  { icon: '👑', label: 'VIP Club', route: '/user/vip' },
  { icon: '🛒', label: 'Cart', route: '/user/cart' },
  { icon: '⭐', label: 'Reviews', route: '/user/reviews' },
  { icon: '👤', label: 'Profile', route: '/user/profile' },
];

// Sort options
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
];

// Color theme - SINGLE DEFINITION
export const COLORS = {
  // Primary colors
  primary: '#1C1C1C',
  secondary: '#4B1C2F',
  accent: '#D4AF37',
  accent1: '#D4AF37',  // Alias for compatibility
  accent2: '#4B1C2F',  // Alias for compatibility
  lightAccent: '#F7E7CE',
  
  // Neutral colors
  neutral: '#F5F5F5',
  warmNeutral: '#E5DCC3',
  cta: '#014421',  // For call-to-action buttons
  
  // Status colors
  success: '#014421',
  info: '#001F3F',
  error: '#C41E3A',
  warning: '#FF9500',
};

// Animation styles
export const ANIMATIONS = {
  fadeIn: 'fade-in',
  slideUp: 'slide-up',
  zoomIn: 'zoom-in',
  slideInLeft: 'slide-in-left',
  slideInRight: 'slide-in-right',
  durations: {
    fast: 300,
    medium: 500,
    slow: 1000,
  }
};

// Breakpoints for responsive design
export const BREAKPOINTS = {
  // Pixel values
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
  
  // String values for media queries
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  large: '1200px'
};