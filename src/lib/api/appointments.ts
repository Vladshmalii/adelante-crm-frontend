import apiClient, { ApiResponse } from './client';

export interface Appointment {
    id: number;
    clientId?: number;
    clientName: string;
    clientPhone?: string;
    staffId: number;
    serviceId?: number;
    serviceName: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    type: string;
    price?: number;
    notes?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateAppointmentRequest {
    clientId?: number;
    clientName: string;
    clientPhone?: string;
    staffId: number;
    serviceId?: number;
    service: string;
    date: string;
    startTime: string;
    endTime: string;
    status?: string;
    type?: string;
    notes?: string;
    price?: number;
}

export interface AppointmentFilters {
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    staffId?: number;
    status?: string;
    page?: number;
    limit?: number;
}

export const appointmentsApi = {
    getAll: async (filters?: AppointmentFilters): Promise<Appointment[]> => {
        return apiClient.get('/appointments', filters);
    },

    getById: async (id: number): Promise<Appointment> => {
        return apiClient.get(`/appointments/${id}`);
    },

    create: async (data: CreateAppointmentRequest): Promise<Appointment> => {
        return apiClient.post('/appointments', data);
    },

    update: async (id: number, data: Partial<CreateAppointmentRequest>): Promise<Appointment> => {
        return apiClient.put(`/appointments/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        return apiClient.delete(`/appointments/${id}`);
    },

    updateStatus: async (id: number, status: Appointment['status']): Promise<Appointment> => {
        return apiClient.patch(`/appointments/${id}/status`, { status });
    },
};

export default appointmentsApi;
