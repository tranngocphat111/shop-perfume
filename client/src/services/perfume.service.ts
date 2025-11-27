import { apiService } from './api';
import type { Product, Inventory, Brand, Category, PageResponse } from '../types';

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

  async getProductPage(
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string,
    brandId?: number | null,
    categoryId?: number | null
  ): Promise<PageResponse<Product>> {
    let url = `/products/page?page=${page}&size=${size}`;

    if (sortBy && direction) {
      url += `&sortBy=${sortBy}&direction=${direction}`;
    }

    if (search && search.trim() !== "") {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    if (brandId) {
      url += `&brandId=${brandId}`;
    }

    if (categoryId) {
      url += `&categoryId=${categoryId}`;
    }

    return apiService.get<PageResponse<Product>>(url);
  },

  // Get best sellers (products sold most)
  async getBestSellers(limit: number = 100): Promise<Product[]> {
    const inventories = await apiService.get<Inventory[]>(`/inventories/best-sellers?limit=${limit}`);
    // Convert Inventory[] to Product[]
    return inventories.map(inv => inv.product);
  },
};
