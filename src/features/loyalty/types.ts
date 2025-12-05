export interface BonusProgram {
    id: string;
    name: string;
    description: string;
    percentCashback: number;
    minPurchaseAmount: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Discount {
    id: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    code?: string;
    minOrderAmount?: number;
    maxUses?: number;
    currentUses: number;
    validFrom: string;
    validTo: string;
    isActive: boolean;
    applicableTo: 'all' | 'services' | 'products';
    createdAt: string;
}

export interface Certificate {
    id: string;
    code: string;
    amount: number;
    balance: number;
    purchasedBy?: string;
    purchasedFor?: string;
    purchasedAt: string;
    validUntil: string;
    isUsed: boolean;
    usedAt?: string;
}

export interface LoyaltyFilters {
    search?: string;
    status?: 'all' | 'active' | 'inactive' | 'expired';
    dateFrom?: string;
    dateTo?: string;
}

export interface ClientBonus {
    clientId: string;
    clientName: string;
    totalPoints: number;
    availablePoints: number;
    usedPoints: number;
    level: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export type LoyaltyTab = 'bonuses' | 'discounts' | 'certificates' | 'clientBonuses';

