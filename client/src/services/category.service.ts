import { apiService } from "./api";
import type { PageResponse } from "../types";

export type Gender = "MALE" | "FEMALE" | "UNISEX";

export interface Category {
  categoryId: number;
  name: string;
  description?: string;
  gender?: Gender;
  createdAt?: string;
  lastUpdated?: string;
  createdBy?: string;
  lastUpdatedBy?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  gender?: Gender;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  gender?: Gender;
}

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    return apiService.get<Category[]>("/categories");
  },

  async getCategoryPage(
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ): Promise<PageResponse<Category>> {
    let url = `/categories/page?page=${page}&size=${size}`;

    if (sortBy && direction) {
      url += `&sortBy=${sortBy}&direction=${direction}`;
    }

    if (search && search.trim() !== "") {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    return apiService.get<PageResponse<Category>>(url);
  },

  async getCategoryById(id: number): Promise<Category> {
    return apiService.get<Category>(`/categories/${id}`);
  },

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    return apiService.post<Category>("/categories", data);
  },

  async updateCategory(
    id: number,
    data: UpdateCategoryRequest
  ): Promise<Category> {
    return apiService.put<Category>(`/categories/${id}`, data);
  },

  async deleteCategory(id: number): Promise<void> {
    return apiService.delete(`/categories/${id}`);
  },
};
