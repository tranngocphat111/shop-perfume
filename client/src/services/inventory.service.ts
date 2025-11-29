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
    async getLowStockItem(): Promise<number> {
        return apiService.get<number>('/inventories/lowStock');
    },
    async getInventoryPage(
        page: number,
        size: number,
        sortBy?: string,
        direction?: string
    ): Promise<PageResponse<InventoryItem>> {
        return apiService.get<PageResponse<InventoryItem>>(
            `/inventories/page?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`
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

    async getInventoryByProductId(productId: number): Promise<InventoryItem | null> {
        try {
            return await apiService.get<InventoryItem>(`/inventories/product/${productId}`);
        } catch (error) {
            // Return null if inventory not found (404)
            return null;
        }
    },
};