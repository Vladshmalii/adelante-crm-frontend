import apiClient, { ApiResponse } from './client';
import { toNumber } from '../utils/formatters';
import type { Staff, StaffRole, StaffStatus } from '@/features/staff/types';

// Форма ответа backend (GET/POST/PATCH /staff) — camelCase, Decimal как строка.
// См. backend/app/api/admin/staff.py StaffOut.
interface StaffDto {
    id: string;
    firstName: string;
    middleName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    additionalPhone?: string | null;
    email?: string | null;
    gender?: string | null;
    birthDate?: string | null;
    avatarUrl?: string | null;
    role: StaffRole;
    position?: string | null;
    specializations: string[];
    status: StaffStatus;
    salary?: string | null;
    commissionPercent?: string | null;
    hireDate?: string | null;
    firedAt?: string | null;
    color?: string | null;
}

function fromDto(dto: StaffDto): Staff {
    return {
        id: dto.id,
        firstName: dto.firstName,
        middleName: dto.middleName ?? undefined,
        lastName: dto.lastName ?? undefined,
        phone: dto.phone ?? '',
        additionalPhone: dto.additionalPhone ?? undefined,
        email: dto.email ?? undefined,
        role: dto.role,
        position: dto.position ?? undefined,
        status: dto.status,
        isActive: dto.status !== 'fired',
        salary: dto.salary !== null && dto.salary !== undefined ? toNumber(dto.salary) : undefined,
        commission:
            dto.commissionPercent !== null && dto.commissionPercent !== undefined
                ? toNumber(dto.commissionPercent)
                : undefined,
        hireDate: dto.hireDate ?? undefined,
        avatar: dto.avatarUrl ?? undefined,
        specialization: dto.specializations?.[0],
        specializations: dto.specializations,
        color: dto.color ?? undefined,
    };
}

export interface StaffWritePayload {
    firstName: string;
    middleName?: string;
    lastName?: string;
    phone: string;
    additionalPhone?: string;
    email?: string;
    role?: StaffRole;
    position?: string;
    specializations?: string[];
    salary?: number;
    commission?: number;
    hireDate?: string;
    color?: string;
}

function toPayload(data: Partial<StaffWritePayload>): Record<string, unknown> {
    const { commission, ...rest } = data;
    const payload: Record<string, unknown> = { ...rest };
    if (commission !== undefined) payload.commissionPercent = commission;
    return payload;
}

export interface StaffFilters {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    perPage?: number;
}

export interface StaffPage {
    items: Staff[];
    meta: NonNullable<ApiResponse<unknown>['meta']>;
}

export interface StaffStats {
    visits: number;
    revenue: number;
    avgCheck: number;
    rating: number | null;
}

export interface DaySchedule {
    isWorkDay: boolean;
    start?: string;
    end?: string;
    breakStart?: string;
    breakEnd?: string;
}

export interface StaffSchedule {
    week: Record<string, DaySchedule>;
    exceptions: Array<{
        id: string;
        dateFrom: string;
        dateTo: string;
        type: string;
        start?: string;
        end?: string;
        comment?: string;
    }>;
}

export const staffApi = {
    getAll: async (filters?: StaffFilters): Promise<StaffPage> => {
        const response = await apiClient.getPaged<StaffDto[]>('/staff', {
            query: filters?.search,
            role: filters?.role,
            status: filters?.status,
            page: filters?.page,
            perPage: filters?.perPage,
        });
        return {
            items: response.data.map(fromDto),
            meta: response.meta ?? {
                page: 1,
                perPage: response.data.length,
                total: response.data.length,
                totalPages: 1,
            },
        };
    },

    create: async (data: StaffWritePayload): Promise<Staff> => {
        const dto = await apiClient.post<StaffDto>('/staff', toPayload(data));
        return fromDto(dto);
    },

    update: async (id: string, data: Partial<StaffWritePayload>): Promise<Staff> => {
        const dto = await apiClient.patch<StaffDto>(`/staff/${id}`, toPayload(data));
        return fromDto(dto);
    },

    // Увольнение (status=fired) — backend не удаляет запись физически
    fire: async (id: string): Promise<Staff> => {
        const dto = await apiClient.delete<StaffDto>(`/staff/${id}`);
        return fromDto(dto);
    },

    getSchedule: async (id: string): Promise<StaffSchedule> => {
        return apiClient.get(`/staff/${id}/schedule`);
    },

    saveSchedule: async (id: string, week: Record<string, DaySchedule>): Promise<StaffSchedule> => {
        return apiClient.post(`/staff/${id}/schedule`, week);
    },

    addException: async (
        id: string,
        data: {
            dateFrom: string;
            dateTo: string;
            type: string;
            start?: string;
            end?: string;
            comment?: string;
        },
    ) => {
        return apiClient.post(`/staff/${id}/schedule/exceptions`, data);
    },

    getStats: async (
        id: string,
        params?: { dateFrom?: string; dateTo?: string },
    ): Promise<StaffStats> => {
        const dto = await apiClient.get<{
            visits: number;
            revenue: string;
            avgCheck: string;
            rating: number | null;
        }>(`/staff/${id}/stats`, params);
        return {
            visits: dto.visits,
            revenue: toNumber(dto.revenue),
            avgCheck: toNumber(dto.avgCheck),
            rating: dto.rating,
        };
    },
};

export default staffApi;
