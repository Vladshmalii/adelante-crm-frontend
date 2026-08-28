import apiClient from './client';
import { toNumber } from '../utils/formatters';
import type { Service, ServiceStatus } from '@/features/services/types';

// Форма ответа backend (GET/POST/PATCH /services) — camelCase, Decimal как строка.
// См. backend/app/api/admin/services.py ServiceOut.
interface ServiceDto {
    id: string;
    name: string;
    description?: string | null;
    category: string;
    color?: string | null;
    price: string;
    durationMinutes: number;
    status: ServiceStatus;
    masters: Array<{ id: string; name?: string | null }>;
}

function fromDto(dto: ServiceDto): Service {
    return {
        id: dto.id,
        name: dto.name,
        category: dto.category,
        description: dto.description ?? undefined,
        duration: dto.durationMinutes,
        price: toNumber(dto.price),
        color: dto.color ?? undefined,
        isActive: dto.status === 'active',
        status: dto.status,
        staff: dto.masters.map((m) => m.id),
    };
}

export interface ServiceWritePayload {
    name: string;
    description?: string;
    category: string;
    color?: string;
    price: number;
    duration: number;
    status?: ServiceStatus;
    staff?: string[];
}

function toPayload(data: Partial<ServiceWritePayload>): Record<string, unknown> {
    const { duration, staff, ...rest } = data;
    const payload: Record<string, unknown> = { ...rest };
    if (duration !== undefined) payload.durationMinutes = duration;
    if (staff !== undefined) payload.masterIds = staff;
    return payload;
}

export interface ServiceFilters {
    search?: string;
    category?: string;
    status?: string;
    priceFrom?: number;
    priceTo?: number;
}

export const servicesApi = {
    getAll: async (filters?: ServiceFilters): Promise<Service[]> => {
        const dtos = await apiClient.get<ServiceDto[]>('/services', {
            query: filters?.search,
            category: filters?.category,
            status: filters?.status,
            priceFrom: filters?.priceFrom,
            priceTo: filters?.priceTo,
        });
        return dtos.map(fromDto);
    },

    create: async (data: ServiceWritePayload): Promise<Service> => {
        const dto = await apiClient.post<ServiceDto>('/services', toPayload(data));
        return fromDto(dto);
    },

    update: async (id: string, data: Partial<ServiceWritePayload>): Promise<Service> => {
        const dto = await apiClient.patch<ServiceDto>(`/services/${id}`, toPayload(data));
        return fromDto(dto);
    },

    // Архивирование — backend не удаляет услугу физически (на неё ссылаются записи)
    archive: async (id: string): Promise<Service> => {
        const dto = await apiClient.delete<ServiceDto>(`/services/${id}`);
        return fromDto(dto);
    },

    getCategories: async (): Promise<Array<{ category: string; count: number }>> => {
        return apiClient.get('/services/categories');
    },
};

export default servicesApi;
