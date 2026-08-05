import apiClient from './client';

export interface ReportParams {
    dateFrom: string;
    dateTo: string;
    staffId?: string;
    serviceId?: string;
}

export interface RevenueReport {
    totalRevenue: number;
    revenueByDay: { date: string; amount: number }[];
    revenueByService: { service: string; amount: number }[];
    revenueByStaff: { staff: string; amount: number }[];
}

export interface StaffPerformanceReport {
    staffId: string;
    staffName: string;
    totalAppointments: number;
    totalRevenue: number;
    occupancyRate: number;
    rating: number;
}

export interface ServicesPopularityReport {
    serviceId: string;
    serviceName: string;
    totalBookings: number;
    totalRevenue: number;
    growth: number;
}

export const reportsApi = {
    getRevenueReport: async (params: ReportParams): Promise<RevenueReport> => {
        return apiClient.get('/reports/revenue', params);
    },

    getStaffPerformance: async (params: ReportParams): Promise<StaffPerformanceReport[]> => {
        return apiClient.get('/reports/staff-performance', params);
    },

    getServicesPopularity: async (params: ReportParams): Promise<ServicesPopularityReport[]> => {
        return apiClient.get('/reports/services-popularity', params);
    },

    exportReport: async (params: ReportParams & { format: 'pdf' | 'xlsx' }): Promise<Blob> => {
        return apiClient.get('/reports/export', params);
    },
};

export default reportsApi;
