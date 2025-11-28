export type OperationType = 'payment' | 'refund' | 'transfer' | 'withdrawal' | 'deposit';
export type OperationStatus = 'completed' | 'pending' | 'cancelled';
export type DocumentType = 'receipt' | 'invoice' | 'expense' | 'income' | 'act';
export type DocumentContentType = 'services' | 'products' | 'mixed';
export type DocumentStatus = 'draft' | 'completed' | 'cancelled';
export type ReceiptStatus = 'paid' | 'cancelled' | 'partial';
export type ReceiptSource = 'web' | 'mobile' | 'pos';
export type PaymentMethodType = 'cash' | 'card' | 'online' | 'certificate' | 'bonus' | 'tips' | 'other';
export type CommissionType = 'none' | 'percentage' | 'fixed';
export type CommissionPayer = 'client' | 'salon' | 'split';

export interface FinanceOperation {
    id: string;
    date: string;
    documentNumber: string;
    cashRegister: string;
    client: string;
    amount: number;
    paymentMethod: string;
    type: OperationType;
    status: OperationStatus;
    author: string;
    description?: string;
}

export interface FinanceDocument {
    id: string;
    number: string;
    date: string;
    type: DocumentType;
    contentType: DocumentContentType;
    amount: number;
    servicesCount: number;
    productsCount: number;
    counterparty: string;
    comment?: string;
    author: string;
    status: DocumentStatus;
}

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
    id: string;
    name: string;
    type: PaymentMethodType;
    cashRegister: string;
    commissionType: CommissionType;
    commissionValue: number;
    commissionPayer: CommissionPayer;
    availableOnline: boolean;
    allowPartialPayment: boolean;
    allowTips: boolean;
    sortOrder: number;
    isActive: boolean;
}

export interface CashRegister {
    id: string;
    name: string;
    location: string;
    balance: number;
    isActive: boolean;
}