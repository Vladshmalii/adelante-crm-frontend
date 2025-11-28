export type OverviewTab = 'records' | 'reviews' | 'changes';

export type RecordStatus = 'completed' | 'confirmed' | 'pending' | 'cancelled';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';
export type RecordSource = 'online' | 'phone' | 'admin' | 'walk-in';

export interface Record {
    id: string;
    employee: string;
    service: string;
    client: string;
    phone: string;
    visitTime: string;
    createdBy: string;
    status: RecordStatus;
    paymentStatus: PaymentStatus;
    source: RecordSource;
}

export interface RecordsFilters {
    createdFrom?: string;
    createdTo?: string;
    visitFrom?: string;
    visitTo?: string;
    employee?: string;
    client?: string;
    serviceCategory?: string;
    visitStatus?: RecordStatus | '';
    paymentStatus?: PaymentStatus | '';
    source?: RecordSource | '';
}

export type ReviewType = 'positive' | 'neutral' | 'negative' | 'all';
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface Review {
    id: string;
    clientName: string;
    employee: string;
    rating: ReviewRating;
    phone: string;
    date: string;
    text?: string;
}

export interface ReviewsFilters {
    dateFrom?: string;
    dateTo?: string;
    type?: ReviewType;
    rating?: ReviewRating | '';
}

export type ChangeEntity = 'client' | 'record' | 'service' | 'employee' | 'product';
export type ChangeAction = 'created' | 'updated' | 'deleted';

export interface Change {
    id: string;
    date: string;
    entity: ChangeEntity;
    entityId: string;
    entityName: string;
    author: string;
    action: ChangeAction;
    details?: string;
}

export interface ChangesFilters {
    dateFrom?: string;
    dateTo?: string;
    entity?: ChangeEntity | '';
    author?: string;
    action?: ChangeAction | '';
}