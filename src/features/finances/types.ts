import type { FinanceOperation as ApiFinanceOperation, FinanceDocument as ApiFinanceDocument } from '@/lib/api/finances';

export type OperationType = 'payment' | 'refund' | 'transfer' | 'withdrawal' | 'deposit';
export type OperationStatus = 'completed' | 'pending' | 'cancelled';
export type DocumentType = 'receipt' | 'invoice' | 'expense' | 'income' | 'act';
export type DocumentContentType = 'services' | 'products' | 'mixed';
export type DocumentStatus = 'draft' | 'issued' | 'paid' | 'cancelled';
export type ReceiptStatus = 'paid' | 'cancelled' | 'partial';
export type ReceiptSource = 'web' | 'mobile' | 'pos';
export type PaymentMethodType = 'cash' | 'card' | 'online' | 'certificate' | 'bonus' | 'tips' | 'other';
export type CommissionType = 'none' | 'percentage' | 'fixed';
export type CommissionPayer = 'client' | 'salon' | 'split';

// Extend API types with optional fields that UI expects but API may not return yet.
export type FinanceOperation = Omit<ApiFinanceOperation, 'type' | 'createdAt'> & {
    type: string;
    createdAt?: string;
    documentNumber?: string;
    cashRegister?: string;
    client?: string;
    paymentMethod?: string;
    author?: string;
};

export type FinanceDocument = Omit<ApiFinanceDocument, 'createdAt'> & {
    createdAt?: string;
    servicesCount?: number;
    productsCount?: number;
    counterparty?: string;
    author?: string;
};

export interface FinanceReceipt {
    id: string;
    date: string;
    receiptNumber: string;
    documentNumber: string;
    cashRegister: string;
    client: string;
    amount: number;
    paymentMethod: string;
    status: ReceiptStatus;
    balanceAfter: number;
    source: ReceiptSource;
}

export interface PaymentMethod {
    id: string | number;
    name?: string;
    type?: PaymentMethodType | string;
    cashRegister?: string;
    commissionType?: CommissionType;
    commissionValue?: number;
    commissionPayer?: CommissionPayer;
    availableOnline?: boolean;
    allowPartialPayment?: boolean;
    allowTips?: boolean;
    sortOrder?: number;
    isActive?: boolean;
}

export interface CashRegister {
    id: string;
    name: string;
    location: string;
    balance: number;
    isActive: boolean;
}