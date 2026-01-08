import apiClient, { ApiResponse } from './client';

export interface StaffMember {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    position: string;
    specializations: string[];
    hireDate?: string;
    salary?: number;
    commission?: number;
    avatar?: string;
    isActive: boolean;
    schedule?: Record<string, { start: string; end: string }>;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateStaffRequest {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    position: string;
    specializations?: string[];
}

export interface StaffFilters {
    search?: string;
    position?: string;
    isActive?: boolean;
    page?: number;
    perPage?: number;
}

export const staffApi = {
    getAll: async (filters?: StaffFilters): Promise<StaffMember[]> => {
        return apiClient.get('/staff', filters);
    },

    getById: async (id: number): Promise<StaffMember> => {
        return apiClient.get(`/staff/${id}`);
    },

    create: async (data: CreateStaffRequest): Promise<StaffMember> => {
        return apiClient.post('/staff', data);
    },

    update: async (id: number, data: Partial<CreateStaffRequest>): Promise<StaffMember> => {
        return apiClient.put(`/staff/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        return apiClient.delete(`/staff/${id}`);
    },

    getSchedule: async (id: number, params?: { dateFrom?: string; dateTo?: string }) => {
        return apiClient.get(`/staff/${id}/schedule`, params);
    },

    updateSchedule: async (id: number, data: { work_days: Record<string, any>; exceptions?: any[] }) => {
        return apiClient.post(`/staff/${id}/schedule`, data);
    },
};

export default staffApi;
