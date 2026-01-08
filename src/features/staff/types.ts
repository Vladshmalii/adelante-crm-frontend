export type StaffRole = 'master' | 'administrator' | 'manager' | string;

export type StaffStatus = 'active' | 'vacation' | 'sick' | 'fired' | string;

export type StaffGender = 'male' | 'female' | 'other';

export interface Staff {
    id: string | number;
    firstName: string;
    middleName?: string;
    lastName?: string;
    phone: string;
    email?: string;
    role: StaffRole;
    position?: string;
    status: StaffStatus;
    isActive?: boolean;
    salary?: number;
    commission?: number;
    hireDate?: string;
    avatar?: string;
    specialization?: string;
    specializations?: string[];
    workSchedule?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface StaffFilters {
    role?: string;
    status?: string;
    salary?: string;
}

export interface PaginationState {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
}

export interface AddStaffFormData {
    firstName: string;
    middleName?: string;
    lastName?: string;
    phone: string;
    additionalPhone?: string;
    email?: string;
    role: StaffRole;
    gender: StaffGender;
    salary: number;
    commission: number;
    birthDay?: string;
    birthMonth?: string;
    birthYear?: string;
    hireDate: string;
    specialization?: string;
    workSchedule?: string;
    colorLabel?: string;
}

export interface ExportExcelOptions {
    includeSalary: boolean;
    includeSchedule: boolean;
    dateFrom?: string;
    dateTo?: string;
}
