import { create } from 'zustand';
import { financesApi, FinanceOperation, FinanceDocument, FinanceDashboard, OperationFilters } from '@/lib/api/finances';

export interface PaymentMethod {
    id: string;
    name: string;
}

export interface CashRegister {
    id: string;
    name: string;
    balance: number;
}

export type FinanceTab = 'overview' | 'operations' | 'documents' | 'reports';

interface FinancesState {
    operations: FinanceOperation[];
    documents: FinanceDocument[];
    receipts: FinanceDocument[];
    paymentMethods: PaymentMethod[];
    cashRegisters: CashRegister[];
    dashboard: FinanceDashboard | null;
    isLoading: boolean;
    activeTab: FinanceTab;

    fetchOperations: (filters?: OperationFilters) => Promise<void>;
    createOperation: (data: Omit<FinanceOperation, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
    fetchDocuments: (filters?: any) => Promise<void>;
    createDocument: (data: Omit<FinanceDocument, 'id' | 'createdAt'>) => Promise<void>;
    fetchReceipts: (filters?: any) => Promise<void>;
    createReceipt: (data: Omit<FinanceDocument, 'id' | 'createdAt'>) => Promise<void>;
    fetchPaymentMethods: () => Promise<void>;
    fetchCashRegisters: () => Promise<void>;
    fetchDashboard: (dateFrom: string, dateTo: string) => Promise<void>;
    setActiveTab: (tab: FinanceTab) => void;
}

export const useFinancesStore = create<FinancesState>((set) => ({
    operations: [],
    documents: [],
    receipts: [],
    paymentMethods: [],
    cashRegisters: [],
    dashboard: null,
    isLoading: false,
    activeTab: 'overview',

    fetchOperations: async (filters) => {
        set({ isLoading: true });
        try {
            const response = await financesApi.getOperations(filters);
            set({ operations: response.data || [] });
        } catch (error) {
            console.error('Failed to fetch operations:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    createOperation: async (data) => {
        set({ isLoading: true });
        try {
            const newOperation = await financesApi.createOperation(data);
            set((state) => ({ operations: [newOperation, ...state.operations] }));
        } catch (error) {
            console.error('Failed to create operation:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchDocuments: async (filters) => {
        set({ isLoading: true });
        try {
            const response = await financesApi.getDocuments(filters);
            set({ documents: response.data || [] });
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    createDocument: async (data) => {
        set({ isLoading: true });
        try {
            const newDocument = await financesApi.createDocument(data);
            set((state) => ({ documents: [newDocument, ...state.documents] }));
        } catch (error) {
            console.error('Failed to create document:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchReceipts: async (filters) => {
        set({ isLoading: true });
        try {
            // Using getDocuments filtered for receipts as there is no getReceipts in API
            const response = await financesApi.getDocuments({ ...filters, type: 'receipt' });
            set({ receipts: response.data || [] });
        } catch (error) {
            console.error('Failed to fetch receipts:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    createReceipt: async (data) => {
        set({ isLoading: true });
        try {
            // force type to receipt
            const receiptData = { ...data, type: 'receipt' as const };
            const newReceipt = await financesApi.createDocument(receiptData);
            set((state) => ({ receipts: [newReceipt, ...state.receipts] }));
        } catch (error) {
            console.error('Failed to create receipt:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchPaymentMethods: async () => {
        try {
            const paymentMethods = await financesApi.getPaymentMethods();
            set({ paymentMethods });
        } catch (error) {
            console.error('Failed to fetch payment methods:', error);
        }
    },

    fetchCashRegisters: async () => {
        try {
            const cashRegisters = await financesApi.getCashRegisters();
            set({ cashRegisters });
        } catch (error) {
            console.error('Failed to fetch cash registers:', error);
        }
    },

    fetchDashboard: async (dateFrom, dateTo) => {
        set({ isLoading: true });
        try {
            const dashboard = await financesApi.getDashboard({ dateFrom, dateTo });
            set({ dashboard });
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
}));
