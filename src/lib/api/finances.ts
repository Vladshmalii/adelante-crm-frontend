import apiClient, { ApiResponse } from './client';

export interface FinanceOperation {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description?: string;
    date: string;
    paymentMethod: string;
    cashRegisterId?: string;
    createdBy: string;
    createdAt: string;
}

export interface FinanceDocument {
    id: string;
    type: 'invoice' | 'receipt' | 'report';
    number: string;
    date: string;
    amount: number;
    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    clientId?: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    createdAt: string;
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
    getOperations: async (filters?: OperationFilters): Promise<ApiResponse<FinanceOperation[]>> => {
        return apiClient.get('/finances/operations', filters);
    },

    createOperation: async (data: Omit<FinanceOperation, 'id' | 'createdAt' | 'createdBy'>): Promise<FinanceOperation> => {
        return apiClient.post('/finances/operations', data);
    },

    getDocuments: async (filters?: { type?: string; status?: string; page?: number; perPage?: number }): Promise<ApiResponse<FinanceDocument[]>> => {
        return apiClient.get('/finances/documents', filters);
    },

    createDocument: async (data: Omit<FinanceDocument, 'id' | 'createdAt'>): Promise<FinanceDocument> => {
        return apiClient.post('/finances/documents', data);
    },

    getDashboard: async (params: { dateFrom: string; dateTo: string }): Promise<FinanceDashboard> => {
        return apiClient.get('/finances/dashboard', params);
    },

    getPaymentMethods: async (): Promise<Array<{ id: string; name: string }>> => {
        return apiClient.get('/finances/payment-methods');
    },

    getCashRegisters: async (): Promise<Array<{ id: string; name: string; balance: number }>> => {
        return apiClient.get('/finances/cash-registers');
    },

    exportReport: async (params: { dateFrom: string; dateTo: string; format: 'xlsx' | 'pdf' }): Promise<Blob> => {
        return apiClient.get('/finances/export', params);
    },
};

export default financesApi;
