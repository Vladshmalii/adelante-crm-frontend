export type ServiceCategory = 'hair' | 'nails' | 'face' | 'body' | 'makeup' | 'other';
export type ServiceStatus = 'active' | 'inactive' | 'archived';

export interface Service {
    id: string;
    name: string;
    category: ServiceCategory;
    description?: string;
    duration: number; // в хвилинах
    price: number;
    status: ServiceStatus;
    staff?: string[]; // ID співробітників, які надають цю послугу
    color?: string;
}

export interface ServiceFilters {
    category?: ServiceCategory | '';
    status?: ServiceStatus | '';
    priceFrom?: number;
    priceTo?: number;
}

export interface AddServiceFormData {
    name: string;
    category: ServiceCategory;
    description?: string;
    duration: number;
    price: number;
    status: ServiceStatus;
    staff?: string[];
    color?: string;
}
