import apiClient, { ApiResponse } from './client';

export interface Client {
    id: number;
    firstName: string;
    lastName: string;
    middleName?: string;
    phone: string;
    email?: string;
    birthDate?: string;
    cardNumber?: string;
    segment: 'new' | 'repeat' | 'lost';
    gender?: string;
    source?: string;
    notes?: string;
    discount?: number;
    bonusBalance: number;
    totalVisits: number;
    totalSpent: number;
    lastVisit?: string;
    createdAt: string;
    updatedAt?: string;
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
    getAll: async (filters?: ClientFilters): Promise<Client[]> => {
        return apiClient.get('/clients', filters);
    },

    getById: async (id: number): Promise<Client> => {
        return apiClient.get(`/clients/${id}`);
    },

    create: async (data: CreateClientRequest): Promise<Client> => {
        return apiClient.post('/clients', data);
    },

    update: async (id: number, data: Partial<CreateClientRequest>): Promise<Client> => {
        return apiClient.put(`/clients/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        return apiClient.delete(`/clients/${id}`);
    },

    getHistory: async (id: number, params?: { page?: number; perPage?: number; type?: string }) => {
        return apiClient.get(`/clients/${id}/history`, params);
    },

    import: async (file: File): Promise<{ imported: number; failed: number; errors: Array<{ row: number; error: string }> }> => {
        return apiClient.upload('/clients/import', file);
    },

    export: async (filters?: ClientFilters): Promise<Blob> => {
        return apiClient.get('/clients/export', filters);
    },
};

export default clientsApi;
