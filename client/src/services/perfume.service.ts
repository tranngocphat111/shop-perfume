import { apiService } from './api';
import type { Product, Inventory, Brand, Category } from '../types';

export const productService = {
  // Get all inventories (products with stock)
  getAllInventories: async () => {
    return apiService.get<Inventory[]>('/inventories');
  },

  // Get inventory by product id
  getInventoryByProductId: async (productId: number) => {
    return apiService.get<Inventory>(`/inventories/product/${productId}`);
  },

  // Get all products
  getAllProducts: async () => {
    return apiService.get<Product[]>('/products');
  },

  // Get product by id
  getProductById: async (id: number) => {
    return apiService.get<Product>(`/products/${id}`);
  },

  // Get products by category
  getProductsByCategory: async (categoryId: number) => {
    return apiService.get<Product[]>(`/products/category/${categoryId}`);
  },

  // Get products by brand
  getProductsByBrand: async (brandId: number) => {
    return apiService.get<Product[]>(`/products/brand/${brandId}`);
  },

  // Search products
  searchProducts: async (query: string) => {
    return apiService.get<Product[]>(`/products/search?q=${query}`);
  },

  // Get all brands
  getAllBrands: async () => {
    return apiService.get<Brand[]>('/brands');
  },

  // Get all categories
  getAllCategories: async () => {
    return apiService.get<Category[]>('/categories');
  },
};
