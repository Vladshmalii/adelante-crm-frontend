import apiClient, { ApiResponse } from './client';
import { toNumber } from '../utils/formatters';
import type { Client, ClientCategory, ClientImportance, Visit } from '@/features/clients/types';

// Форма ответа backend (GET/POST/PATCH /clients) — camelCase, Decimal как строка.
// См. backend/app/api/admin/clients.py ClientOut.
interface ClientDto {
    id: string;
    firstName: string;
    middleName?: string | null;
    lastName?: string | null;
    phone: string;
    additionalPhone?: string | null;
    email?: string | null;
    birthDate?: string | null;
    gender?: string | null;
    cardNumber?: string | null;
    source?: string | null;
    notes?: string | null;
    color?: string | null;
    category: ClientCategory;
    importance: ClientImportance;
    discountPercent: number;
    noOnlineBooking: boolean;
    totalVisits: number;
    totalSpent: string;
    firstVisit?: string | null;
    lastVisit?: string | null;
    segment: Client['segment'];
}

interface VisitDto {
    id: string;
    startAt: string;
    serviceId: string;
    serviceName: string;
    masterId: string;
    masterName: string;
    status: string;
    totalAmount: string;
    internalNotes?: string | null;
    photos: string[];
}

function fromDto(dto: ClientDto): Client {
    return {
        id: dto.id,
        firstName: dto.firstName,
        middleName: dto.middleName ?? undefined,
        lastName: dto.lastName ?? undefined,
        phone: dto.phone,
        additionalPhone: dto.additionalPhone ?? undefined,
        email: dto.email ?? undefined,
        birthDate: dto.birthDate ?? undefined,
        gender: dto.gender ?? undefined,
        cardNumber: dto.cardNumber ?? undefined,
        source: dto.source ?? undefined,
        notes: dto.notes ?? undefined,
        color: dto.color ?? undefined,
        category: dto.category,
        importance: dto.importance,
        discount: dto.discountPercent,
        noOnlineBooking: dto.noOnlineBooking,
        totalVisits: dto.totalVisits,
        totalSpent: toNumber(dto.totalSpent),
        firstVisit: dto.firstVisit ?? undefined,
        lastVisit: dto.lastVisit ?? undefined,
        segment: dto.segment,
    };
}

function visitFromDto(dto: VisitDto): Visit {
    return {
        id: dto.id,
        clientId: '',
        date: dto.startAt,
        serviceName: dto.serviceName,
        staffId: dto.masterId,
        staffName: dto.masterName,
        notes: dto.internalNotes ?? '',
        photos: dto.photos,
        status: 'completed',
    };
}

export interface ClientWritePayload {
    firstName: string;
    middleName?: string;
    lastName?: string;
    phone: string;
    additionalPhone?: string;
    email?: string;
    birthDate?: string;
    gender?: string;
    cardNumber?: string;
    source?: string;
    notes?: string;
    color?: string;
    category?: ClientCategory;
    importance?: ClientImportance;
    discount?: number;
    noOnlineBooking?: boolean;
}

function toPayload(data: Partial<ClientWritePayload>): Record<string, unknown> {
    const { discount, ...rest } = data;
    const payload: Record<string, unknown> = { ...rest };
    if (discount !== undefined) payload.discountPercent = discount;
    return payload;
}

export interface ClientFilters {
    search?: string;
    segment?: string;
    category?: string;
    sort?: string;
    page?: number;
    perPage?: number;
}

export interface ClientsPage {
    items: Client[];
    meta: NonNullable<ApiResponse<unknown>['meta']>;
}

export const clientsApi = {
    getAll: async (filters?: ClientFilters): Promise<ClientsPage> => {
        const response = await apiClient.getPaged<ClientDto[]>('/clients', {
            query: filters?.search,
            segment: filters?.segment,
            category: filters?.category,
            sort: filters?.sort,
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

    getById: async (id: string): Promise<Client> => {
        const dto = await apiClient.get<ClientDto>(`/clients/${id}`);
        return fromDto(dto);
    },

    create: async (data: ClientWritePayload): Promise<Client> => {
        const dto = await apiClient.post<ClientDto>('/clients', toPayload(data));
        return fromDto(dto);
    },

    update: async (id: string, data: Partial<ClientWritePayload>): Promise<Client> => {
        const dto = await apiClient.patch<ClientDto>(`/clients/${id}`, toPayload(data));
        return fromDto(dto);
    },

    delete: async (id: string): Promise<void> => {
        return apiClient.delete(`/clients/${id}`);
    },

    getVisits: async (
        id: string,
        params?: { page?: number; perPage?: number },
    ): Promise<Visit[]> => {
        const dtos = await apiClient.get<VisitDto[]>(`/clients/${id}/visits`, params);
        return dtos.map((dto) => ({ ...visitFromDto(dto), clientId: id }));
    },

    import: async (file: File): Promise<{ created: number; updated: number; errors: string[] }> => {
        return apiClient.upload('/clients/import', file);
    },

    export: async (options?: { includeVisits?: boolean }): Promise<Blob> => {
        return apiClient.getBlob('/clients/export', { includeVisits: options?.includeVisits });
    },
};

export default clientsApi;
