import apiClient, { ApiResponse } from './client';

export interface Appointment {
    id: string;
    clientId: string;
    staffId: string;
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAppointmentRequest {
    clientId: string;
    staffId: string;
    serviceId: string;
    date: string;
    startTime: string;
    notes?: string;
}

export interface AppointmentFilters {
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    staffId?: string;
    status?: string;
    page?: number;
    perPage?: number;
}

export const appointmentsApi = {
    getAll: async (filters?: AppointmentFilters): Promise<ApiResponse<Appointment[]>> => {
        return apiClient.get('/appointments', filters);
    },

    getById: async (id: string): Promise<Appointment> => {
        return apiClient.get(`/appointments/${id}`);
    },

    create: async (data: CreateAppointmentRequest): Promise<Appointment> => {
        return apiClient.post('/appointments', data);
    },

    update: async (id: string, data: Partial<CreateAppointmentRequest>): Promise<Appointment> => {
        return apiClient.put(`/appointments/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return apiClient.delete(`/appointments/${id}`);
    },

    updateStatus: async (id: string, status: Appointment['status']): Promise<Appointment> => {
        return apiClient.patch(`/appointments/${id}/status`, { status });
    },
};

export default appointmentsApi;
