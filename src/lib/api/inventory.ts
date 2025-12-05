import apiClient, { ApiResponse } from './client';

export interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    quantity: number;
    minQuantity: number;
    price: number;
    costPrice: number;
    unit: string;
    isActive: boolean;
    createdAt: string;
}

export interface StockMovement {
    id: string;
    productId: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason?: string;
    createdBy: string;
    createdAt: string;
}

export interface ProductFilters {
    search?: string;
    category?: string;
    lowStock?: boolean;
    isActive?: boolean;
    page?: number;
    perPage?: number;
}

export const inventoryApi = {
    getProducts: async (filters?: ProductFilters): Promise<ApiResponse<Product[]>> => {
        return apiClient.get('/inventory/products', filters);
    },

    getProductById: async (id: string): Promise<Product> => {
        return apiClient.get(`/inventory/products/${id}`);
    },

    createProduct: async (data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
        return apiClient.post('/inventory/products', data);
    },

    updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
        return apiClient.put(`/inventory/products/${id}`, data);
    },

    deleteProduct: async (id: string): Promise<void> => {
        return apiClient.delete(`/inventory/products/${id}`);
    },

    createStockMovement: async (data: Omit<StockMovement, 'id' | 'createdAt' | 'createdBy'>): Promise<StockMovement> => {
        return apiClient.post('/inventory/stock-movement', data);
    },

    getStockHistory: async (productId: string): Promise<StockMovement[]> => {
        return apiClient.get(`/inventory/products/${productId}/history`);
    },

    exportProducts: async (filters?: ProductFilters): Promise<Blob> => {
        return apiClient.get('/inventory/export', { ...filters, format: 'xlsx' });
    },

    importProducts: async (file: File): Promise<{ imported: number; errors: string[] }> => {
        return apiClient.upload('/inventory/import', file);
    },
};

export default inventoryApi;
