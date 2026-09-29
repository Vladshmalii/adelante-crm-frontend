import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';
import { dayRangeToApi } from '@/shared/lib';

type RecordItem = Schema<'RecordOut'>;

/**
 * Ключи начинаются с `records`, где данные зависят от записей: WebSocket-события
 * `record.created` / `record.updated` сбрасывают всё под `['records']`, и сетка обновляется сама.
 */
export const calendarKeys = {
  schedule: (from: string, to: string) => ['schedule', from, to] as const,
  records: (from: string, to: string) => ['records', 'calendar', from, to] as const,
  summary: (from: string, to: string) => ['records', 'daily-summary', from, to] as const,
  record: (id: string) => ['records', 'detail', id] as const,
};

/** Графики мастеров на дни `[from, to]` включительно: колонки, цвета, рабочие окна. */
export const scheduleQueryOptions = (from: string, to: string) =>
  queryOptions({
    queryKey: calendarKeys.schedule(from, to),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/schedule', {
          params: { query: { dateFrom: from, dateTo: to } },
          signal,
        }),
      ).data,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

const PAGE = 500;

/**
 * Все записи за дни `[from, to]`. Бекенд отдаёт не больше 500 за раз — догружаем страницы,
 * пока не соберём все (на неделю салона обычно хватает одной).
 */
export const calendarRecordsQueryOptions = (from: string, to: string) =>
  queryOptions({
    queryKey: calendarKeys.records(from, to),
    queryFn: async ({ signal }) => {
      const range = dayRangeToApi(from, to);
      const all: RecordItem[] = [];
      for (let page = 1; ; page++) {
        const res = unwrap(
          await api.GET('/api/admin/v1/records', {
            params: { query: { ...range, page, perPage: PAGE } },
            signal,
          }),
        );
        all.push(...res.data);
        if (res.data.length < PAGE || all.length >= (res.meta?.total ?? 0)) break;
      }
      return all;
    },
    placeholderData: keepPreviousData,
  });

/** Число записей и загрузка по дням — вид «Місяць». */
export const dailySummaryQueryOptions = (from: string, to: string) =>
  queryOptions({
    queryKey: calendarKeys.summary(from, to),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/records/daily-summary', {
          params: { query: { dateFrom: from, dateTo: to } },
          signal,
        }),
      ).data,
    placeholderData: keepPreviousData,
  });

export const recordQueryOptions = (id: string) =>
  queryOptions({
    queryKey: calendarKeys.record(id),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/records/{record_id}', {
          params: { path: { record_id: id } },
          signal,
        }),
      ).data,
  });

/** Активные услуги для выбора в записи. */
export const activeServicesQueryOptions = () =>
  queryOptions({
    queryKey: ['services', 'calendar'] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/services', {
          params: { query: { status: 'active' } },
          signal,
        }),
      ).data,
    staleTime: 5 * 60_000,
  });

/** Поиск клиента по имени или телефону (мастеру бекенд отдаёт только его клиентов). */
export const clientSearchQueryOptions = (query: string) =>
  queryOptions({
    queryKey: ['clients', 'search', query] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/clients', {
          params: { query: { query, perPage: 20 } },
          signal,
        }),
      ).data,
    enabled: query.trim().length >= 3,
    staleTime: 30_000,
  });

/** Карточка клиента в записи: визиты, потрачено, Telegram. */
export const clientCardQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['clients', 'card', id] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/clients/{client_id}', {
          params: { path: { client_id: id } },
          signal,
        }),
      ).data,
  });

/** Свободное время мастера под набор услуг — «Знайти вільний час». */
export const slotsQueryOptions = (masterId: string, date: string, serviceIds: string[]) =>
  queryOptions({
    queryKey: ['records', 'slots', masterId, date, serviceIds] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/masters/{master_id}/slots', {
          params: { path: { master_id: masterId }, query: { date, serviceIds } },
          signal,
        }),
      ).data,
  });

/** Способы оплаты визита — доступны любому администратору (не только суперюзеру). */
export const paymentMethodsQueryOptions = () =>
  queryOptions({
    queryKey: ['payment-methods', 'visit'] as const,
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/payment-methods', { signal })).data,
    staleTime: 5 * 60_000,
  });
