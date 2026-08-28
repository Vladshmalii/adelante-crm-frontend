import apiClient from './client';
import { toNumber } from '../utils/formatters';
import type { Appointment, AppointmentStatus, AppointmentType } from '@/features/calendar/types';

// Форма ответа backend (GET/POST/PATCH /records) — camelCase, Decimal как
// строка, время как ISO datetime (UTC). См. backend/app/api/admin/records.py.
// Календарь и вкладка «Записи» на overview — один и тот же домен /records.
interface RecordDto {
    id: string;
    status: string;
    source: string;
    paymentStatus: string;
    importance: AppointmentType;
    startAt: string;
    endAt: string;
    actualStartAt?: string | null;
    actualEndAt?: string | null;
    master: { id: string; name: string; color?: string | null };
    client: { id: string; name: string; phone: string };
    service: { id: string; name: string; category: string; color?: string | null };
    price: string;
    totalAmount: string;
    visitorName?: string | null;
    visitorPhone?: string | null;
    comment?: string | null;
    createdAt: string;
    createdBy: { id?: string | null; name?: string | null };
}

// no_show (backend) <-> no-show (frontend)
function statusFromApi(status: string): AppointmentStatus {
    return status === 'no_show' ? 'no-show' : (status as AppointmentStatus);
}
function statusToApi(status: string): string {
    return status === 'no-show' ? 'no_show' : status;
}

function isoToDateTime(iso: string): { date: string; time: string } {
    const d = new Date(iso);
    const date = iso.slice(0, 10);
    const time = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    return { date, time };
}

// Записи хранятся в UTC (timestamptz); фронт пока не переводит в таймзону
// салона — час показуємо як є в UTC (див. обмеження нижче).
function dateTimeToIso(date: string, time: string): string {
    return new Date(`${date}T${time}:00.000Z`).toISOString();
}

function fromDto(dto: RecordDto): Appointment {
    const start = isoToDateTime(dto.startAt);
    const end = isoToDateTime(dto.endAt);
    return {
        id: dto.id,
        staffId: dto.master.id,
        clientId: dto.client.id,
        clientName: dto.client.name,
        clientPhone: dto.client.phone,
        service: dto.service.name,
        startTime: start.time,
        endTime: end.time,
        date: start.date,
        status: statusFromApi(dto.status),
        type: dto.importance,
        notes: dto.comment ?? undefined,
        price: toNumber(dto.totalAmount),
        isForAnotherPerson: Boolean(dto.visitorName || dto.visitorPhone),
        otherPersonName: dto.visitorName ?? undefined,
        otherPersonPhone: dto.visitorPhone ?? undefined,
    };
}

export interface AppointmentFilters {
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    staffId?: string;
    status?: string;
}

export interface CreateAppointmentPayload {
    staffId: string;
    serviceId: string;
    clientId?: string;
    newClient?: { name: string; phone: string };
    date: string;
    startTime: string;
    type?: AppointmentType;
    notes?: string;
    visitorName?: string;
    visitorPhone?: string;
    source?: 'admin' | 'phone' | 'walk_in';
}

export interface SlotDto {
    startAt: string;
    label: string;
}

export const appointmentsApi = {
    getAll: async (filters?: AppointmentFilters): Promise<Appointment[]> => {
        const dateFrom = filters?.dateFrom ?? filters?.date;
        const dateTo = filters?.dateTo ?? filters?.date;
        const dtos = await apiClient.get<RecordDto[]>('/records', {
            dateFrom: dateFrom ? dateTimeToIso(dateFrom, '00:00') : undefined,
            dateTo: dateTo ? dateTimeToIso(dateTo, '23:59') : undefined,
            masterId: filters?.staffId,
            status: filters?.status ? statusToApi(filters.status) : undefined,
            perPage: 200,
        });
        return dtos.map(fromDto);
    },

    create: async (data: CreateAppointmentPayload): Promise<Appointment> => {
        const dto = await apiClient.post<RecordDto>('/records', {
            masterId: data.staffId,
            serviceId: data.serviceId,
            clientId: data.clientId,
            newClient: data.newClient,
            startAt: dateTimeToIso(data.date, data.startTime),
            source: data.source ?? 'admin',
            importance: data.type ?? 'standard',
            comment: data.notes,
            visitorName: data.visitorName,
            visitorPhone: data.visitorPhone,
        });
        return fromDto(dto);
    },

    update: async (
        id: string,
        data: Partial<{
            staffId: string;
            serviceId: string;
            date: string;
            startTime: string;
            type: AppointmentType;
            notes: string;
        }>,
    ): Promise<Appointment> => {
        const payload: Record<string, unknown> = {};
        if (data.staffId) payload.masterId = data.staffId;
        if (data.serviceId) payload.serviceId = data.serviceId;
        if (data.date && data.startTime) payload.startAt = dateTimeToIso(data.date, data.startTime);
        if (data.type) payload.importance = data.type;
        if (data.notes !== undefined) payload.comment = data.notes;
        const dto = await apiClient.patch<RecordDto>(`/records/${id}`, payload);
        return fromDto(dto);
    },

    updateStatus: async (id: string, status: string): Promise<Appointment> => {
        const dto = await apiClient.post<RecordDto>(`/records/${id}/status`, {
            status: statusToApi(status),
        });
        return fromDto(dto);
    },

    // Backend не удаляет записи физически — "видалення" из UI это скасування
    delete: async (id: string): Promise<void> => {
        await apiClient.post(`/records/${id}/status`, { status: 'cancelled' });
    },

    complete: async (
        id: string,
        data: {
            payments: Array<{ paymentMethodId: string; amount: number }>;
            notes?: string;
            photoUrls?: string[];
        },
    ): Promise<Appointment> => {
        const dto = await apiClient.post<RecordDto>(`/records/${id}/complete`, data);
        return fromDto(dto);
    },

    getFreeSlots: async (masterId: string, date: string, serviceId: string): Promise<SlotDto[]> => {
        return apiClient.get(`/masters/${masterId}/slots`, { date, serviceId });
    },

    uploadPhoto: async (file: File): Promise<{ id: string; url: string }> => {
        return apiClient.upload('/uploads', file);
    },
};

export default appointmentsApi;
