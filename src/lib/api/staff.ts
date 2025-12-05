import apiClient, { ApiResponse } from './client';

export interface StaffMember {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    position: string;
    specializations: string[];
    avatar?: string;
    isActive: boolean;
    schedule?: Record<string, { start: string; end: string }>;
    createdAt: string;
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
    getAll: async (filters?: StaffFilters): Promise<ApiResponse<StaffMember[]>> => {
        return apiClient.get('/staff', filters);
    },

    getById: async (id: string): Promise<StaffMember> => {
        return apiClient.get(`/staff/${id}`);
    },

    create: async (data: CreateStaffRequest): Promise<StaffMember> => {
        return apiClient.post('/staff', data);
    },

    update: async (id: string, data: Partial<CreateStaffRequest>): Promise<StaffMember> => {
        return apiClient.put(`/staff/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return apiClient.delete(`/staff/${id}`);
    },

    getSchedule: async (id: string, params?: { dateFrom?: string; dateTo?: string }) => {
        return apiClient.get(`/staff/${id}/schedule`, params);
    },

    updateSchedule: async (id: string, schedule: Record<string, { start: string; end: string }>) => {
        return apiClient.post(`/staff/${id}/schedule`, { schedule });
    },
};

export default staffApi;
