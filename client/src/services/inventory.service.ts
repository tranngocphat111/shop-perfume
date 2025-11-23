import { apiService } from "./api";
import type { PageResponse } from "../types";

export interface InventoryItem {
    inventoryId: number;
    product: {
        productId: number;
        name: string;
        brand: {
            brandId: number;
            name: string;
        };
        category: {
            categoryId: number;
            name: string;
        };
        columeMl: number;
        unitPrice: number;
        lastUpdatedBy: string;
    };
    quantity: number;
    lastUpdated: string;
}

export const inventoryService = {
    async getInventoryPage(
        page: number,
        size: number
    ): Promise<PageResponse<InventoryItem>> {
        return apiService.get<PageResponse<InventoryItem>>(
            `/inventories/page?page=${page}&size=${size}`
        );
    },

    async getInventoryById(id: number): Promise<InventoryItem> {
        return apiService.get<InventoryItem>(`/inventories/${id}`);
    },

    async updateInventory(
        id: number,
        quantity: number
    ): Promise<InventoryItem> {
        return apiService.put<InventoryItem>(`/inventories/${id}`, { quantity });
    },
};