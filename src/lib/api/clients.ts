import apiClient, { ApiResponse } from './client';

export interface Client {
    id: string;
    firstName: string;
    lastName?: string;
    middleName?: string;
    phone: string;
    email?: string;
    birthDate?: string;
    cardNumber?: string;
    segment: 'new' | 'repeat' | 'lost';
    notes?: string;
    totalVisits: number;
    totalSpent: number;
    lastVisit?: string;
    createdAt: string;
}

export interface CreateClientRequest {
    firstName: string;
    lastName?: string;
    middleName?: string;
    phone: string;
    email?: string;
    birthDate?: string;
    notes?: string;
}

export interface ClientFilters {
    search?: string;
    segment?: string;
    page?: number;
    perPage?: number;
}

export const clientsApi = {
    getAll: async (filters?: ClientFilters): Promise<ApiResponse<Client[]>> => {
        return apiClient.get('/clients', filters);
    },

    getById: async (id: string): Promise<Client> => {
        return apiClient.get(`/clients/${id}`);
    },

    create: async (data: CreateClientRequest): Promise<Client> => {
        return apiClient.post('/clients', data);
    },

    update: async (id: string, data: Partial<CreateClientRequest>): Promise<Client> => {
        return apiClient.put(`/clients/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return apiClient.delete(`/clients/${id}`);
    },

    getHistory: async (id: string, params?: { page?: number; perPage?: number }) => {
        return apiClient.get(`/clients/${id}/history`, params);
    },

    import: async (file: File): Promise<{ imported: number; errors: string[] }> => {
        return apiClient.upload('/clients/import', file);
    },

    export: async (filters?: ClientFilters): Promise<Blob> => {
        return apiClient.get('/clients/export', { ...filters, format: 'xlsx' });
    },
};

export default clientsApi;
