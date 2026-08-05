import { StaffRole } from '@/features/staff/types';

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: StaffRole;
    avatar?: string;
    birthDate?: string;
    hireDate: string;
    salary?: number;
    commission?: number;
    specialization?: string;
    workSchedule?: string;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    telegramConnected?: boolean;
}

export interface ProfileFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate?: string;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    specialization?: string;
    workSchedule?: string;
}
