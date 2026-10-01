import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { publicApi, type Schema, unwrap } from '@/shared/api';

/**
 * Публичный Booking API: салон — по slug в пути, без входа. Поля ответов — snake_case, как во
 * всём Booking API. Ключи кеша — под `booking`, отдельно от данных админки.
 */
const keys = {
  all: ['booking'] as const,
  salon: (slug: string) => ['booking', slug, 'salon'] as const,
  services: (slug: string) => ['booking', slug, 'services'] as const,
  masters: (slug: string, service: string) => ['booking', slug, 'masters', service] as const,
  availability: (slug: string, service: string, master: string | null, month: string) =>
    ['booking', slug, 'availability', service, master, month] as const,
  slots: (slug: string, service: string, master: string | null, date: string) =>
    ['booking', slug, 'slots', service, master, date] as const,
  review: (slug: string, token: string) => ['booking', slug, 'review', token] as const,
};

const path = (slug: string) => ({ salon_slug: slug });

export const salonQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: keys.salon(slug),
    queryFn: async ({ signal }) =>
      unwrap(
        await publicApi.GET('/api/booking/{salon_slug}/salon', {
          params: { path: path(slug) },
          signal,
        }),
      ),
    staleTime: 10 * 60_000,
    retry: false,
  });

export const servicesQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: keys.services(slug),
    queryFn: async ({ signal }) =>
      unwrap(
        await publicApi.GET('/api/booking/{salon_slug}/services', {
          params: { path: path(slug) },
          signal,
        }),
      ),
    staleTime: 5 * 60_000,
  });

export const mastersQueryOptions = (slug: string, serviceId: string) =>
  queryOptions({
    queryKey: keys.masters(slug, serviceId),
    queryFn: async ({ signal }) =>
      unwrap(
        await publicApi.GET('/api/booking/{salon_slug}/masters', {
          params: { path: path(slug), query: { service_id: serviceId } },
          signal,
        }),
      ),
    staleTime: 5 * 60_000,
  });

/** Дни месяца, в которые есть свободное время под услугу (и мастера). */
export const availabilityQueryOptions = (
  slug: string,
  serviceId: string,
  masterId: string | null,
  month: string,
) =>
  queryOptions({
    queryKey: keys.availability(slug, serviceId, masterId, month),
    queryFn: async ({ signal }) =>
      unwrap(
        await publicApi.GET('/api/booking/{salon_slug}/availability', {
          params: {
            path: path(slug),
            query: { service_id: serviceId, master_id: masterId, month },
          },
          signal,
        }),
      ).dates,
  });

export const slotsQueryOptions = (
  slug: string,
  serviceId: string,
  masterId: string | null,
  date: string,
) =>
  queryOptions({
    queryKey: keys.slots(slug, serviceId, masterId, date),
    queryFn: async ({ signal }) =>
      unwrap(
        await publicApi.GET('/api/booking/{salon_slug}/slots', {
          params: { path: path(slug), query: { service_id: serviceId, master_id: masterId, date } },
          signal,
        }),
      ),
  });

/**
 * Запись. `idempotencyKey` одинаковый для повторов одной и той же попытки: если ответ
 * потерялся и клиент нажмёт ещё раз, бекенд вернёт ту же запись, а не дубль.
 */
export function useCreateBooking(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      body,
      idempotencyKey,
    }: {
      body: Schema<'BookingCreate'>;
      idempotencyKey: string;
    }) =>
      unwrap(
        await publicApi.POST('/api/booking/{salon_slug}/records', {
          params: { path: path(slug), header: { 'Idempotency-Key': idempotencyKey } },
          body,
        }),
      ),
    // Свободное время изменилось (и при успехе, и при «время уже заняли»).
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === 'booking' &&
          q.queryKey[1] === slug &&
          (q.queryKey[2] === 'slots' || q.queryKey[2] === 'availability'),
      }),
  });
}

export const reviewContextQueryOptions = (slug: string, token: string) =>
  queryOptions({
    queryKey: keys.review(slug, token),
    queryFn: async ({ signal }) =>
      unwrap(
        await publicApi.GET('/api/booking/{salon_slug}/reviews/{token}', {
          params: { path: { salon_slug: slug, token } },
          signal,
        }),
      ),
    retry: false,
  });

export function useCreateReview(slug: string) {
  return useMutation({
    mutationFn: async (body: Schema<'ReviewCreate'>) =>
      unwrap(
        await publicApi.POST('/api/booking/{salon_slug}/reviews', {
          params: { path: path(slug) },
          body,
        }),
      ),
  });
}
