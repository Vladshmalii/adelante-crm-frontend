import apiClient, { ApiResponse } from './client';

export interface OverviewRecord {
    id: string;
    title: string;
    description: string;
    date: string;
    type: string;
}

export interface OverviewReview {
    id: string;
    author: string;
    rating: number;
    comment: string;
    date: string;
}

export interface OverviewChange {
    id: string;
    entity: string;
    action: string;
    user: string;
    timestamp: string;
    details: string;
}

export interface OverviewParams {
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
}

export const overviewApi = {
    getRecords: async (params?: OverviewParams): Promise<ApiResponse<OverviewRecord[]>> => {
        return apiClient.get('/overview/records', params);
    },

    getReviews: async (params?: OverviewParams): Promise<ApiResponse<OverviewReview[]>> => {
        return apiClient.get('/overview/reviews', params);
    },

    getChanges: async (params?: OverviewParams): Promise<ApiResponse<OverviewChange[]>> => {
        return apiClient.get('/overview/changes', params);
    },
};

export default overviewApi;
