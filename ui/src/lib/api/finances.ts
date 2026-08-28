import apiClient from './client';
import { toNumber } from '../utils/formatters';

// --- DTO бекенда (snake->camel вже робить apiClient) -------------------------

interface PersonRefDto {
    id?: string | null;
    name?: string | null;
}

interface OperationDto {
    id: string;
    type: string;
    amount: string;
    category: string | null;
    description: string | null;
    date: string;
    status: string;
    paymentMethod: PersonRefDto | null;
    cashRegister: PersonRefDto | null;
    clientId: string | null;
    recordId: string | null;
    receiptId: string | null;
    documentId: string | null;
    author: PersonRefDto;
    createdAt: string;
}

export interface FinanceOperation {
    id: string | number;
    type: string;
    amount: number;
    category?: string;
    description?: string;
    date: string;
    status: string;
    paymentMethodId?: string;
    paymentMethod?: string;
    cashRegisterId?: string;
    cashRegister?: string;
    clientId?: string;
    recordId?: string;
    receiptId?: string;
    documentId?: string;
    author?: string;
    createdAt: string;
}

function operationFromDto(dto: OperationDto): FinanceOperation {
    return {
        id: dto.id,
        type: dto.type,
        amount: toNumber(dto.amount),
        category: dto.category ?? undefined,
        description: dto.description ?? undefined,
        date: dto.date,
        status: dto.status,
        paymentMethodId: dto.paymentMethod?.id ?? undefined,
        paymentMethod: dto.paymentMethod?.name ?? undefined,
        cashRegisterId: dto.cashRegister?.id ?? undefined,
        cashRegister: dto.cashRegister?.name ?? undefined,
        clientId: dto.clientId ?? undefined,
        recordId: dto.recordId ?? undefined,
        receiptId: dto.receiptId ?? undefined,
        documentId: dto.documentId ?? undefined,
        author: dto.author?.name ?? undefined,
        createdAt: dto.createdAt,
    };
}

export interface OperationFilters {
    type?: string;
    category?: string;
    cashRegisterId?: string;
    paymentMethodId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
}

export interface CreateOperationPayload {
    type: string;
    amount: number;
    category?: string;
    description?: string;
    date: string;
    paymentMethodId?: string;
    cashRegisterId?: string;
    clientId?: string;
}

export interface PatchOperationPayload {
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
    status?: string;
}

interface DocumentDto {
    id: string;
    type: string;
    number: string;
    date: string;
    amount: string;
    contentType: string;
    counterparty: string | null;
    comment: string | null;
    status: string;
    author: PersonRefDto;
    createdAt: string;
}

export interface FinanceDocument {
    id: string | number;
    type: string;
    number: string;
    date: string;
    amount: number;
    contentType: string;
    counterparty?: string;
    comment?: string;
    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    author?: string;
    createdAt: string;
}

function documentFromDto(dto: DocumentDto): FinanceDocument {
    return {
        id: dto.id,
        type: dto.type,
        number: dto.number,
        date: dto.date,
        amount: toNumber(dto.amount),
        contentType: dto.contentType,
        counterparty: dto.counterparty ?? undefined,
        comment: dto.comment ?? undefined,
        status: dto.status as FinanceDocument['status'],
        author: dto.author?.name ?? undefined,
        createdAt: dto.createdAt,
    };
}

export interface DocumentFilters {
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
}

export interface CreateDocumentPayload {
    type: string;
    number: string;
    date: string;
    amount: number;
    contentType?: string;
    counterparty?: string;
    comment?: string;
    status?: string;
}

export interface PatchDocumentPayload {
    date?: string;
    amount?: number;
    contentType?: string;
    counterparty?: string;
    comment?: string;
    status?: string;
}

interface ReceiptPaymentDto {
    method: PersonRefDto;
    methodType: string | null;
    amount: string;
}

interface ReceiptDto {
    id: string;
    number: string;
    date: string;
    cashRegister: PersonRefDto;
    client: PersonRefDto | null;
    recordId: string | null;
    amount: string;
    payments: ReceiptPaymentDto[];
    status: string;
    source: string;
    author: PersonRefDto;
}

export interface FinanceReceipt {
    id: string;
    number: string;
    date: string;
    cashRegister?: string;
    client?: string;
    recordId?: string;
    amount: number;
    paymentMethod?: string;
    status: 'paid' | 'cancelled' | 'partial';
    source: 'web' | 'mobile' | 'pos';
    author?: string;
}

function receiptFromDto(dto: ReceiptDto): FinanceReceipt {
    return {
        id: dto.id,
        number: dto.number,
        date: dto.date,
        cashRegister: dto.cashRegister?.name ?? undefined,
        client: dto.client?.name ?? undefined,
        recordId: dto.recordId ?? undefined,
        amount: toNumber(dto.amount),
        paymentMethod:
            dto.payments
                .map((p) => p.method.name)
                .filter(Boolean)
                .join(', ') || undefined,
        status: dto.status as FinanceReceipt['status'],
        source: dto.source as FinanceReceipt['source'],
        author: dto.author?.name ?? undefined,
    };
}

export interface ReceiptFilters {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
}

export interface CreateReceiptPayload {
    clientId?: string;
    clientName?: string;
    payments: Array<{ paymentMethodId: string; amount: number }>;
    source?: string;
    date?: string;
}

interface PaymentMethodDto {
    id: string;
    name: string;
    type: string;
    cashRegisterId: string | null;
    commissionType: string;
    commissionValue: string;
    commissionPayer: string;
    availableOnline: boolean;
    allowPartialPayment: boolean;
    allowTips: boolean;
    sortOrder: number;
    isActive: boolean;
}

export interface FinancePaymentMethod {
    id: string;
    name: string;
    type: string;
    cashRegisterId?: string;
    commissionType: string;
    commissionValue: number;
    commissionPayer: string;
    availableOnline: boolean;
    allowPartialPayment: boolean;
    allowTips: boolean;
    sortOrder: number;
    isActive: boolean;
}

function paymentMethodFromDto(dto: PaymentMethodDto): FinancePaymentMethod {
    return {
        id: dto.id,
        name: dto.name,
        type: dto.type,
        cashRegisterId: dto.cashRegisterId ?? undefined,
        commissionType: dto.commissionType,
        commissionValue: toNumber(dto.commissionValue),
        commissionPayer: dto.commissionPayer,
        availableOnline: dto.availableOnline,
        allowPartialPayment: dto.allowPartialPayment,
        allowTips: dto.allowTips,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
    };
}

export interface CreatePaymentMethodPayload {
    name: string;
    type: string;
    cashRegisterId?: string;
    commissionType?: string;
    commissionValue?: number;
    commissionPayer?: string;
    availableOnline?: boolean;
    allowPartialPayment?: boolean;
    allowTips?: boolean;
    sortOrder?: number;
    isActive?: boolean;
}

interface CashRegisterDto {
    id: string;
    name: string;
    location: string | null;
    balance: string;
    isActive: boolean;
}

export interface FinanceCashRegister {
    id: string;
    name: string;
    location?: string;
    balance: number;
    isActive: boolean;
}

function cashRegisterFromDto(dto: CashRegisterDto): FinanceCashRegister {
    return {
        id: dto.id,
        name: dto.name,
        location: dto.location ?? undefined,
        balance: toNumber(dto.balance),
        isActive: dto.isActive,
    };
}

export interface CreateCashRegisterPayload {
    name: string;
    location?: string;
    isActive?: boolean;
}

interface DashboardDto {
    totalRevenue: string;
    totalExpenses: string;
    netIncome: string;
    revenueByDay: Array<{ date: string; amount: string }>;
    expensesByCategory: Array<{ category: string; amount: string }>;
    paymentSplit: Array<{ methodType: string; amount: string; share: number }>;
    topServices: Array<{ name: string; revenue: string; count: number }>;
}

export interface FinanceDashboard {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    revenueByDay: Array<{ date: string; amount: number }>;
    expensesByCategory: Array<{ category: string; amount: number }>;
    paymentSplit: Array<{ methodType: string; amount: number; share: number }>;
    topServices: Array<{ name: string; revenue: number; count: number }>;
}

function dashboardFromDto(dto: DashboardDto): FinanceDashboard {
    return {
        totalRevenue: toNumber(dto.totalRevenue),
        totalExpenses: toNumber(dto.totalExpenses),
        netIncome: toNumber(dto.netIncome),
        revenueByDay: dto.revenueByDay.map((d) => ({ date: d.date, amount: toNumber(d.amount) })),
        expensesByCategory: dto.expensesByCategory.map((c) => ({
            category: c.category,
            amount: toNumber(c.amount),
        })),
        paymentSplit: dto.paymentSplit.map((p) => ({
            methodType: p.methodType,
            amount: toNumber(p.amount),
            share: p.share,
        })),
        topServices: dto.topServices.map((s) => ({
            name: s.name,
            revenue: toNumber(s.revenue),
            count: s.count,
        })),
    };
}

export const financesApi = {
    getOperations: async (filters?: OperationFilters): Promise<FinanceOperation[]> => {
        const dtos = await apiClient.get<OperationDto[]>('/finances/operations', {
            type: filters?.type,
            category: filters?.category,
            cashRegisterId: filters?.cashRegisterId,
            paymentMethodId: filters?.paymentMethodId,
            dateFrom: filters?.dateFrom,
            dateTo: filters?.dateTo,
            page: filters?.page,
            perPage: filters?.perPage ?? 200,
        });
        return dtos.map(operationFromDto);
    },

    createOperation: async (data: CreateOperationPayload): Promise<FinanceOperation> => {
        const dto = await apiClient.post<OperationDto>('/finances/operations', data);
        return operationFromDto(dto);
    },

    updateOperation: async (id: string, data: PatchOperationPayload): Promise<FinanceOperation> => {
        const dto = await apiClient.patch<OperationDto>(`/finances/operations/${id}`, data);
        return operationFromDto(dto);
    },

    getDocuments: async (filters?: DocumentFilters): Promise<FinanceDocument[]> => {
        const dtos = await apiClient.get<DocumentDto[]>('/finances/documents', {
            type: filters?.type,
            status: filters?.status,
            dateFrom: filters?.dateFrom,
            dateTo: filters?.dateTo,
            page: filters?.page,
            perPage: filters?.perPage ?? 200,
        });
        return dtos.map(documentFromDto);
    },

    createDocument: async (data: CreateDocumentPayload): Promise<FinanceDocument> => {
        const dto = await apiClient.post<DocumentDto>('/finances/documents', data);
        return documentFromDto(dto);
    },

    updateDocument: async (id: string, data: PatchDocumentPayload): Promise<FinanceDocument> => {
        const dto = await apiClient.patch<DocumentDto>(`/finances/documents/${id}`, data);
        return documentFromDto(dto);
    },

    getReceipts: async (filters?: ReceiptFilters): Promise<FinanceReceipt[]> => {
        const dtos = await apiClient.get<ReceiptDto[]>('/finances/receipts', {
            status: filters?.status,
            dateFrom: filters?.dateFrom,
            dateTo: filters?.dateTo,
            page: filters?.page,
            perPage: filters?.perPage ?? 200,
        });
        return dtos.map(receiptFromDto);
    },

    createReceipt: async (data: CreateReceiptPayload): Promise<FinanceReceipt> => {
        const dto = await apiClient.post<ReceiptDto>('/finances/receipts', data);
        return receiptFromDto(dto);
    },

    cancelReceipt: async (id: string): Promise<FinanceReceipt> => {
        const dto = await apiClient.post<ReceiptDto>(`/finances/receipts/${id}/cancel`, {});
        return receiptFromDto(dto);
    },

    getPaymentMethods: async (): Promise<FinancePaymentMethod[]> => {
        const dtos = await apiClient.get<PaymentMethodDto[]>('/finances/payment-methods');
        return dtos.map(paymentMethodFromDto);
    },

    createPaymentMethod: async (
        data: CreatePaymentMethodPayload,
    ): Promise<FinancePaymentMethod> => {
        const dto = await apiClient.post<PaymentMethodDto>('/finances/payment-methods', data);
        return paymentMethodFromDto(dto);
    },

    updatePaymentMethod: async (
        id: string,
        data: Partial<CreatePaymentMethodPayload>,
    ): Promise<FinancePaymentMethod> => {
        const dto = await apiClient.patch<PaymentMethodDto>(
            `/finances/payment-methods/${id}`,
            data,
        );
        return paymentMethodFromDto(dto);
    },

    getCashRegisters: async (): Promise<FinanceCashRegister[]> => {
        const dtos = await apiClient.get<CashRegisterDto[]>('/finances/cash-registers');
        return dtos.map(cashRegisterFromDto);
    },

    createCashRegister: async (data: CreateCashRegisterPayload): Promise<FinanceCashRegister> => {
        const dto = await apiClient.post<CashRegisterDto>('/finances/cash-registers', data);
        return cashRegisterFromDto(dto);
    },

    getDashboard: async (params: {
        dateFrom: string;
        dateTo: string;
    }): Promise<FinanceDashboard> => {
        const dto = await apiClient.get<DashboardDto>('/finances/dashboard', params);
        return dashboardFromDto(dto);
    },

    exportReport: async (params: { dateFrom: string; dateTo: string }): Promise<Blob> => {
        return apiClient.getBlob('/finances/export', params);
    },
};

export default financesApi;
