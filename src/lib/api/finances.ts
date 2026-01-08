import apiClient, { ApiResponse } from './client';

export interface FinanceOperation {
    id: number;
    type: 'income' | 'expense';
    amount: number;
    category?: string;
    description?: string;
    date: string;
    documentNumber?: string;
    paymentMethodId?: number;
    paymentMethod?: string;
    cashRegisterId?: number;
    clientId?: number;
    status: string;
    createdBy?: number;
    createdAt: string;
    updatedAt?: string;
}

export interface FinanceDocument {
    id: number;
    type: string;
    number: string;
    date: string;
    amount: number;
    contentType: string;
    counterparty?: string;
    comment?: string;
    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    createdAt: string;
    updatedAt?: string;
}

export interface FinanceDashboard {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    revenueByDay: Array<{ date: string; amount: number }>;
    expensesByCategory: Array<{ category: string; amount: number }>;
    topServices: Array<{ name: string; revenue: number; count: number }>;
}

export interface OperationFilters {
    type?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
}

export const financesApi = {
    getOperations: async (filters?: OperationFilters): Promise<FinanceOperation[]> => {
        return apiClient.get('/finances/operations', filters);
    },

    createOperation: async (data: Omit<FinanceOperation, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinanceOperation> => {
        return apiClient.post('/finances/operations', data);
    },

    getDocuments: async (filters?: { type?: string; status?: string; page?: number; limit?: number }): Promise<FinanceDocument[]> => {
        return apiClient.get('/finances/documents', filters);
    },

    createDocument: async (data: Omit<FinanceDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinanceDocument> => {
        return apiClient.post('/finances/documents', data);
    },

    getDashboard: async (params: { dateFrom: string; dateTo: string }): Promise<FinanceDashboard> => {
        return apiClient.get('/finances/dashboard', params);
    },

    getPaymentMethods: async (): Promise<Array<{ id: number; name: string; type: string; isActive: boolean }>> => {
        return apiClient.get('/finances/payment-methods');
    },

    getCashRegisters: async (): Promise<Array<{ id: number; name: string; balance: number; isActive: boolean }>> => {
        return apiClient.get('/finances/cash-registers');
    },

    exportReport: async (params: { dateFrom: string; dateTo: string; format?: string }): Promise<Blob> => {
        return apiClient.get('/finances/export', params);
    },
};

export default financesApi;
