import { apiService } from "./api";
import type { PageResponse, Product } from "../types";

export interface CreateProductRequest {
    name: string;
    description: string;
    perfumeLongevity: string;
    perfumeConcentration: string;
    releaseYear: string;
    columeMl: number;
    status: "ACTIVE" | "INACTIVE";
    unitPrice: number;
    brandId: number;
    categoryId: number;
}

export interface UpdateProductRequest {
    name: string;
    description: string;
    perfumeLongevity: string;
    perfumeConcentration: string;
    releaseYear: string;
    columeMl: number;
    status: "ACTIVE" | "INACTIVE";
    unitPrice: number;
    brandId: number;
    categoryId: number;
}

export const productService = {
    async getTotalSize(): Promise<number> {
        return apiService.get('/products/size');
    },
    async getProductPage(
        page: number,
        size: number,
        sortBy?: string,
        direction?: string,
        search?: string,
        status?: string
    ): Promise<PageResponse<Product>> {
        let url = `/products/page?page=${page}&size=${size}`;

        if (sortBy && direction) {
            url += `&sortBy=${sortBy}&direction=${direction}`;
        }

        if (search && search.trim() !== "") {
            url += `&search=${encodeURIComponent(search.trim())}`;
        }

        if (status && status.trim() !== "") {
            url += `&status=${status}`;
        }

        return apiService.get<PageResponse<Product>>(url);
    },

    async getProductById(id: number): Promise<Product> {
        return apiService.get<Product>(`/products/${id}`);
    },

    async createProduct(data: CreateProductRequest, images: File[], primaryImageIndex: number = 0): Promise<Product> {
        const formData = new FormData();

        // Append product data
        formData.append("name", data.name);
        formData.append("description", data.description);
        formData.append("perfumeLongevity", data.perfumeLongevity);
        formData.append("perfumeConcentration", data.perfumeConcentration);
        formData.append("releaseYear", data.releaseYear);
        formData.append("columeMl", data.columeMl.toString());
        formData.append("status", data.status);
        formData.append("unitPrice", data.unitPrice.toString());
        formData.append("brandId", data.brandId.toString());
        formData.append("categoryId", data.categoryId.toString());

        // Append images
        images.forEach((image) => {
            formData.append("images", image);
        });

        // Append primary image index
        formData.append("primaryImageIndex", primaryImageIndex.toString());

        return apiService.post<Product>("/products", formData);
    },

    async updateProduct(
        id: number,
        data: UpdateProductRequest
    ): Promise<Product> {
        return apiService.put<Product>(`/products/${id}`, data);
    },

    async updateProductWithImages(
        id: number,
        data: UpdateProductRequest,
        newImages?: File[],
        imagesToDelete?: number[],
        primaryImageId?: number
    ): Promise<Product> {
        const formData = new FormData();

        // Append product data
        formData.append("name", data.name);
        formData.append("description", data.description);
        formData.append("perfumeLongevity", data.perfumeLongevity);
        formData.append("perfumeConcentration", data.perfumeConcentration);
        formData.append("releaseYear", data.releaseYear);
        formData.append("columeMl", data.columeMl.toString());
        formData.append("status", data.status);
        formData.append("unitPrice", data.unitPrice.toString());
        formData.append("brandId", data.brandId.toString());
        formData.append("categoryId", data.categoryId.toString());

        // Append new images if any
        if (newImages && newImages.length > 0) {
            newImages.forEach((image) => {
                formData.append("images", image);
            });
        }

        // Append images to delete if any
        if (imagesToDelete && imagesToDelete.length > 0) {
            imagesToDelete.forEach((imageId) => {
                formData.append("imagesToDelete", imageId.toString());
            });
        }

        // Append primary image ID if specified
        if (primaryImageId !== undefined) {
            formData.append("primaryImageId", primaryImageId.toString());
        }

        return apiService.put<Product>(`/products/${id}/images`, formData);
    },

    async deleteProduct(id: number): Promise<void> {
        return apiService.delete<void>(`/products/${id}`);
    },
};
