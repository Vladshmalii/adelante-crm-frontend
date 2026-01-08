export type ClientSegment = 'new' | 'repeat' | 'lost' | 'subscription-ending';

export type FilterType = 'visits' | 'clients' | 'sales';

export type ClientGender = 'male' | 'female' | 'other';

export type ClientCategory = 'vip' | 'regular' | 'new' | 'inactive';

export type ClientImportance = 'high' | 'medium' | 'low';

export interface Visit {
    id: string | number;
    clientId: string | number;
    appointmentId?: string;
    date: string;
    serviceName: string;
    staffId: string | number;
    staffName: string;
    notes: string;
    photos: string[];
    status: 'completed';
}

export interface Client {
    id: string | number;
    firstName: string;
    middleName?: string;
    lastName?: string;
    phone: string;
    email?: string;
    birthDate?: string;
    cardNumber?: string;
    gender?: string;
    source?: string;
    notes?: string;
    discount?: number;
    bonusBalance?: number;
    totalVisits: number;
    totalSpent: number;
    segment: ClientSegment;
    createdAt?: string;
    updatedAt?: string;
    lastVisit?: string;
    firstVisit?: string;
    visits?: Visit[];
}

export interface ClientFilters {
    visits?: string;
    clients?: string;
    sales?: string;
}

export interface PaginationState {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
}

export interface AddClientFormData {
    firstName: string;
    middleName?: string;
    lastName?: string;

    phone: string;
    additionalPhone?: string;
    email?: string;
    category: ClientCategory;
    gender: ClientGender;
    importance: ClientImportance;
    discount: number;
    cardNumber?: string;
    birthDay?: string;
    birthMonth?: string;
    birthYear?: string;
    colorLabel?: string;
    noOnlineBooking: boolean;
    totalSpent: number;
    totalPaid: number;
}

export interface ExportExcelOptions {
    includeVisits: boolean;
    includeProducts: boolean;
    dateFrom?: string;
    dateTo?: string;
}