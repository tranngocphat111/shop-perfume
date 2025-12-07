import { apiService } from "./api";
import type { PageResponse } from "../types";

export interface Brand {
  brandId: number;
  name: string;
  country?: string;
  description?: string;
  url?: string;
  createdAt?: string;
  lastUpdated?: string;
  createdBy?: string;
  lastUpdatedBy?: string;
}

export interface CreateBrandRequest {
  name: string;
  country?: string;
  description?: string;
}

export interface UpdateBrandRequest {
  name: string;
  country?: string;
  description?: string;
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

  async createBrand(data: CreateBrandRequest, image?: File): Promise<Brand> {
    if (image) {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.country) formData.append("country", data.country);
      if (data.description) formData.append("description", data.description);
      formData.append("image", image);

      return apiService.post<Brand>("/brands", formData);
    } else {
      return apiService.post<Brand>("/brands", data);
    }
  },

  async updateBrand(
    id: number,
    data: UpdateBrandRequest,
    image?: File
  ): Promise<Brand> {
    if (image) {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.country) formData.append("country", data.country);
      if (data.description) formData.append("description", data.description);
      formData.append("image", image);

      return apiService.put<Brand>(`/brands/${id}`, formData);
    } else {
      return apiService.put<Brand>(`/brands/${id}`, data);
    }
  },

  async deleteBrand(id: number): Promise<void> {
    return apiService.delete(`/brands/${id}`);
  },
};
