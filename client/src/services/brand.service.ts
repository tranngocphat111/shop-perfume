import { apiService } from "./api";
import type { PageResponse } from "../types";

export interface Brand {
  brandId: number;
  name: string;
  country?: string;
  description?: string;
  url?: string;
}

export interface CreateBrandRequest {
  name: string;
  country?: string;
  description?: string;
  url?: string;
}

export interface UpdateBrandRequest {
  name: string;
  country?: string;
  description?: string;
  url?: string;
}

export const brandService = {
  async getAllBrands(): Promise<Brand[]> {
    return apiService.get<Brand[]>("/brands");
  },

  async getBrandPage(
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ): Promise<PageResponse<Brand>> {
    let url = `/brands/page?page=${page}&size=${size}`;

    if (sortBy && direction) {
      url += `&sortBy=${sortBy}&direction=${direction}`;
    }

    if (search && search.trim() !== "") {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    return apiService.get<PageResponse<Brand>>(url);
  },

  async getBrandById(id: number): Promise<Brand> {
    return apiService.get<Brand>(`/brands/${id}`);
  },

  async createBrand(data: CreateBrandRequest): Promise<Brand> {
    return apiService.post<Brand>("/brands", data);
  },

  async updateBrand(id: number, data: UpdateBrandRequest): Promise<Brand> {
    return apiService.put<Brand>(`/brands/${id}`, data);
  },

  async deleteBrand(id: number): Promise<void> {
    return apiService.delete(`/brands/${id}`);
  },
};
