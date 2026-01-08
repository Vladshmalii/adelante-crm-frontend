import apiClient, { ApiResponse } from './client';

export interface Product {
    id: number;
    name: string;
    sku: string;
    category: string;
    type: string;
    quantity: number;
    minQuantity: number;
    price: number;
    costPrice: number;
    unit: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface StockMovement {
    id: number;
    productId: number;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason?: string;
    documentNumber?: string;
    createdBy?: number;
    createdAt: string;
}

export interface ProductFilters {
    search?: string;
    category?: string;
    type?: string;
    stockStatus?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

export const inventoryApi = {
    getProducts: async (filters?: ProductFilters): Promise<Product[]> => {
        return apiClient.get('/inventory/products', filters);
    },

    getProductById: async (id: number): Promise<Product> => {
        return apiClient.get(`/inventory/products/${id}`);
    },

    createProduct: async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
        return apiClient.post('/inventory/products', data);
    },

    updateProduct: async (id: number, data: Partial<Product>): Promise<Product> => {
        return apiClient.put(`/inventory/products/${id}`, data);
    },

    deleteProduct: async (id: number): Promise<void> => {
        return apiClient.delete(`/inventory/products/${id}`);
    },

    createStockMovement: async (data: Omit<StockMovement, 'id' | 'createdAt' | 'createdBy'>): Promise<StockMovement> => {
        return apiClient.post('/inventory/stock-movement', data);
    },

    getStockHistory: async (productId: number): Promise<StockMovement[]> => {
        return apiClient.get(`/inventory/products/${productId}/history`);
    },

    exportProducts: async (filters?: ProductFilters): Promise<Blob> => {
        return apiClient.get('/inventory/export', filters);
    },

    importProducts: async (file: File): Promise<{ imported: number; failed: number; errors: Array<{ row: number; error: string }> }> => {
        return apiClient.upload('/inventory/import', file);
    },
};

export default inventoryApi;
