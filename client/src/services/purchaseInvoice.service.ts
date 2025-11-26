import { apiService } from './api';
import type { PurchaseInvoice, PurchaseInvoiceFormData, PageResponse } from '../types';

const PURCHASE_INVOICES_API = '/admin/purchase-invoices';

export const purchaseInvoiceService = {
    // Get all purchase invoices
    getAllInvoices: async (): Promise<PurchaseInvoice[]> => {
        return apiService.get<PurchaseInvoice[]>(PURCHASE_INVOICES_API);
    },

    // Get purchase invoices with pagination
    getInvoicesPaginated: async (
        page: number = 0,
        size: number = 25,
        sortBy?: string,
        direction?: 'ASC' | 'DESC'
    ): Promise<PageResponse<PurchaseInvoice>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });

        if (sortBy) params.append('sortBy', sortBy);
        if (direction) params.append('direction', direction);

        return apiService.get<PageResponse<PurchaseInvoice>>(
            `${PURCHASE_INVOICES_API}/page?${params.toString()}`
        );
    },

    // Get purchase invoice by ID
    getInvoiceById: async (id: number): Promise<PurchaseInvoice> => {
        return apiService.get<PurchaseInvoice>(`${PURCHASE_INVOICES_API}/${id}`);
    },

    // Create new purchase invoice
    createInvoice: async (data: PurchaseInvoiceFormData): Promise<PurchaseInvoice> => {
        return apiService.post<PurchaseInvoice>(PURCHASE_INVOICES_API, data);
    },

    // Update purchase invoice
    updateInvoice: async (id: number, data: PurchaseInvoiceFormData): Promise<PurchaseInvoice> => {
        return apiService.put<PurchaseInvoice>(`${PURCHASE_INVOICES_API}/${id}`, data);
    },

    // Delete purchase invoice
    deleteInvoice: async (id: number): Promise<void> => {
        await apiService.delete(`${PURCHASE_INVOICES_API}/${id}`);
    },
};

export default purchaseInvoiceService;
