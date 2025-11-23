import { apiService } from "./api";
import type { Supplier, PageResponse } from "../types";

export interface SupplierFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
}

export const supplierService = {
    // Get paginated suppliers with search, sort, and filter
    getSupplierPage: async (
        page: number = 0,
        size: number = 25,
        sortBy: string = "supplierId",
        direction: string = "ASC",
        search?: string
    ): Promise<PageResponse<Supplier>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            sortBy,
            direction,
        });

        if (search && search.trim()) {
            params.append("search", search.trim());
        }

        return apiService.get<PageResponse<Supplier>>(`/admin/suppliers?${params.toString()}`);
    },

    // Get supplier by ID
    getSupplierById: async (id: number): Promise<Supplier> => {
        return apiService.get<Supplier>(`/admin/suppliers/${id}`);
    },

    // Create new supplier
    createSupplier: async (supplier: SupplierFormData): Promise<Supplier> => {
        return apiService.post<Supplier>("/admin/suppliers", supplier);
    },

    // Update supplier
    updateSupplier: async (
        id: number,
        supplier: SupplierFormData
    ): Promise<Supplier> => {
        return apiService.put<Supplier>(`/admin/suppliers/${id}`, supplier);
    },

    // Delete supplier
    deleteSupplier: async (id: number): Promise<void> => {
        return apiService.delete<void>(`/admin/suppliers/${id}`);
    },

    // Get all suppliers (for dropdown, etc.)
    getAllSuppliers: async (): Promise<Supplier[]> => {
        return apiService.get<Supplier[]>("/admin/suppliers/all");
    },
};
