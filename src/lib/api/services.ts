import apiClient, { ApiResponse } from './client';

export interface Service {
    id: string;
    name: string;
    description?: string;
    category: string;
    duration: number;
    price: number;
    isActive: boolean;
    createdAt: string;
}

export interface CreateServiceRequest {
    name: string;
    description?: string;
    category: string;
    duration: number;
    price: number;
    isActive?: boolean;
}

export interface ServiceFilters {
    search?: string;
    category?: string;
    isActive?: boolean;
    page?: number;
    perPage?: number;
}

export const servicesApi = {
    getAll: async (filters?: ServiceFilters): Promise<ApiResponse<Service[]>> => {
        return apiClient.get('/services', filters);
    },

    getById: async (id: string): Promise<Service> => {
        return apiClient.get(`/services/${id}`);
    },

    create: async (data: CreateServiceRequest): Promise<Service> => {
        return apiClient.post('/services', data);
    },

    update: async (id: string, data: Partial<CreateServiceRequest>): Promise<Service> => {
        return apiClient.put(`/services/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return apiClient.delete(`/services/${id}`);
    },

    getCategories: async (): Promise<string[]> => {
        return apiClient.get('/services/categories');
    },
};

export default servicesApi;
