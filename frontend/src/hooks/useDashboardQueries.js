import { useQuery } from '@tanstack/react-query';
import { productAPI, categoryAPI, wishlistAPI, cartAPI } from '../utils/api';
import { productsData } from '../data/products';

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => {
      const u = localStorage.getItem('user');
      if (!u || u === 'undefined') return null;
      try {
        return JSON.parse(u);
      } catch (_) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories', 'enabledOnly'],
    queryFn: async () => {
      const res = await categoryAPI.getAll(true).catch(() => null);
      if (res && res.success) {
        return res.departments || res.categories || [];
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useProducts = (selectedCategory = 'All', limit = 12) => {
  return useQuery({
    queryKey: ['products', { category: selectedCategory, limit }],
    queryFn: async () => {
      const params = { limit };
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      const pRes = await productAPI.getFiltered(params).catch(() => null);
      
      let prods = [];
      if (pRes && pRes.success && Array.isArray(pRes.products)) {
        prods = pRes.products;
      } else if (Array.isArray(pRes)) {
        prods = pRes;
      }

      if (prods.length === 0 && selectedCategory === 'All') {
        return productsData;
      }
      return prods;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useWishlistQuery = (userId) => {
  return useQuery({
    queryKey: ['wishlist', userId],
    queryFn: async () => {
      const res = await wishlistAPI.getWishlist().catch(() => ({ wishlist: [] }));
      return res?.wishlist || [];
    },
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000,
  });
};

export const useCartQuery = (userId) => {
  return useQuery({
    queryKey: ['cart', userId],
    queryFn: async () => {
      const res = await cartAPI.getCart().catch(() => ({ cart: [] }));
      return res?.cart || [];
    },
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000,
  });
};

export const useUnreadChatCount = (userId) => {
  return useQuery({
    queryKey: ['unreadChat', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_BASE}/api/chat/unread/user/${userId}`);
      const data = await res.json();
      return data?.success ? (data.unreadCount || 0) : 0;
    },
    enabled: Boolean(userId),
    refetchInterval: 15000,
  });
};
