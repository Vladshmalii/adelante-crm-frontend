import apiClient, { ApiResponse } from './client';

export interface Service {
    id: number;
    name: string;
    description?: string;
    category: string;
    duration: number;
    price: number;
    color?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
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
    getAll: async (filters?: ServiceFilters): Promise<Service[]> => {
        return apiClient.get('/services', filters);
    },

    getById: async (id: number): Promise<Service> => {
        return apiClient.get(`/services/${id}`);
    },

    create: async (data: CreateServiceRequest): Promise<Service> => {
        return apiClient.post('/services', data);
    },

    update: async (id: number, data: Partial<CreateServiceRequest>): Promise<Service> => {
        return apiClient.put(`/services/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        return apiClient.delete(`/services/${id}`);
    },

    getCategories: async (): Promise<string[]> => {
        return apiClient.get('/services/categories');
    },
};

export default servicesApi;
