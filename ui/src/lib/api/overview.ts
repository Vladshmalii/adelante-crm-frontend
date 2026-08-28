import apiClient from './client';
import { toNumber } from '../utils/formatters';
import type {
    Record as OverviewRecord,
    RecordsFilters,
    Review,
    ReviewsFilters,
    Change,
    ChangesFilters,
} from '@/features/overview/types';

// Вкладка «Записи» на overview использует тот самый домен /records, что й
// календар (див. lib/api/appointments.ts) — тут окремий, спрощений мапінг
// під ширшу форму Record з overview/types.ts.
interface RecordDto {
    id: string;
    status: string;
    source: string;
    paymentStatus: string;
    startAt: string;
    endAt: string;
    actualStartAt?: string | null;
    actualEndAt?: string | null;
    master: { id: string; name: string };
    client: { id: string; name: string; phone: string };
    service: { id: string; name: string };
    totalAmount: string;
    createdAt: string;
    createdBy: { id?: string | null; name?: string | null };
}

// scheduled/arrived (backend) не мають прямого відповідника в overview —
// показуємо як "очікується" (pending), no_show — як скасовано.
function recordStatusFromApi(status: string): OverviewRecord['status'] {
    switch (status) {
        case 'completed':
            return 'completed';
        case 'confirmed':
        case 'arrived':
            return 'confirmed';
        case 'cancelled':
        case 'no_show':
            return 'cancelled';
        default:
            return 'pending';
    }
}

// booking/bot (публічні канали) відображаємо як "онлайн", walk_in -> walk-in.
function recordSourceFromApi(source: string): OverviewRecord['source'] {
    switch (source) {
        case 'booking':
        case 'bot':
            return 'online';
        case 'walk_in':
            return 'walk-in';
        case 'phone':
            return 'phone';
        default:
            return 'admin';
    }
}

function recordFromDto(dto: RecordDto): OverviewRecord {
    return {
        id: dto.id,
        employee: dto.master.name,
        service: dto.service.name,
        client: dto.client.name,
        phone: dto.client.phone,
        visitTime: dto.startAt,
        createdAt: dto.createdAt,
        createdBy: dto.createdBy.name || '—',
        status: recordStatusFromApi(dto.status),
        paymentStatus: dto.paymentStatus as OverviewRecord['paymentStatus'],
        source: recordSourceFromApi(dto.source),
        amount: toNumber(dto.totalAmount),
        actualStartTime: dto.actualStartAt ?? undefined,
        actualEndTime: dto.actualEndAt ?? undefined,
    };
}

function recordStatusToApi(status: string): string | undefined {
    switch (status) {
        case 'completed':
            return 'completed';
        case 'confirmed':
            return 'confirmed';
        case 'cancelled':
            return 'cancelled';
        default:
            return undefined;
    }
}

interface ReviewDto {
    id: string;
    rating: number;
    text: string | null;
    createdAt: string;
    client: { id: string; name: string };
    master: { id: string; name: string };
    recordId: string;
}

function reviewFromDto(dto: ReviewDto): Review {
    return {
        id: dto.id,
        clientName: dto.client.name,
        employee: dto.master.name,
        rating: dto.rating as Review['rating'],
        phone: '',
        date: dto.createdAt,
        text: dto.text ?? undefined,
    };
}

interface AuditDto {
    id: string;
    createdAt: string;
    entity: string;
    entityId: string;
    entityName: string;
    action: string;
    author: { id?: string | null; name?: string | null };
    details: { [key: string]: unknown } | null;
}

function changeFromDto(dto: AuditDto): Change {
    return {
        id: dto.id,
        date: dto.createdAt,
        entity: dto.entity as Change['entity'],
        entityId: dto.entityId,
        entityName: dto.entityName,
        author: dto.author.name || '—',
        action: dto.action as Change['action'],
        details: dto.details ? JSON.stringify(dto.details) : undefined,
    };
}

export const overviewApi = {
    getRecords: async (filters?: RecordsFilters): Promise<OverviewRecord[]> => {
        const dtos = await apiClient.get<RecordDto[]>('/records', {
            createdFrom: filters?.createdFrom,
            createdTo: filters?.createdTo,
            status: filters?.visitStatus ? recordStatusToApi(filters.visitStatus) : undefined,
            paymentStatus: filters?.paymentStatus || undefined,
            clientQuery: filters?.client || undefined,
            perPage: 200,
        });
        return dtos.map(recordFromDto);
    },

    getReviews: async (filters?: ReviewsFilters): Promise<Review[]> => {
        const dtos = await apiClient.get<ReviewDto[]>('/reviews', {
            dateFrom: filters?.dateFrom,
            dateTo: filters?.dateTo,
            rating: filters?.rating || undefined,
            type: filters?.type && filters.type !== 'all' ? filters.type : undefined,
            perPage: 200,
        });
        return dtos.map(reviewFromDto);
    },

    getChanges: async (filters?: ChangesFilters): Promise<Change[]> => {
        const dtos = await apiClient.get<AuditDto[]>('/audit', {
            dateFrom: filters?.dateFrom,
            dateTo: filters?.dateTo,
            entity: filters?.entity || undefined,
            action: filters?.action || undefined,
            perPage: 200,
        });
        return dtos.map(changeFromDto);
    },
};

export default overviewApi;
