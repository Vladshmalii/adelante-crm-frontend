import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckOutlined,
  IdcardOutlined,
  ScissorOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';
import { App, Button, Result, Spin } from 'antd';
import { useRef, useState } from 'react';

import { ApiError, errorMessage, type Schema } from '@/shared/api';

import {
  mastersQueryOptions,
  salonQueryOptions,
  servicesQueryOptions,
  useCreateBooking,
} from '../api/booking.api';
import { ANY_MASTER, BOOKING_STEPS, type BookingSearch, type BookingStep } from '../model/search';
import { BookingCard, BookingShell, StepsBar } from './BookingShell';
import { ConfirmStep } from './ConfirmStep';
import { DateTimeStep } from './DateTimeStep';
import { type ClientDetails, DetailsStep } from './DetailsStep';
import { MasterStep } from './MasterStep';
import { SalonHeader } from './SalonHeader';
import { ServiceStep } from './ServiceStep';
import { SuccessView } from './SuccessView';

type Booking = Schema<'BookingOut'>;

const route = getRouteApi('/booking/$slug/');

const STEPS: { key: BookingStep; label: string; icon: React.ReactNode }[] = [
  { key: 'service', label: 'Послуга', icon: <ScissorOutlined /> },
  { key: 'master', label: 'Майстер', icon: <UserOutlined /> },
  { key: 'datetime', label: 'Дата і час', icon: <CalendarOutlined /> },
  { key: 'details', label: 'Ваші дані', icon: <IdcardOutlined /> },
  { key: 'confirm', label: 'Підтвердження', icon: <CheckOutlined /> },
];

/**
 * Шаг, который реально можно показать: если в адресе шаг дальше, чем выбрано (перезагрузка,
 * ссылка из чата), — откатываемся к первому незаполненному.
 */
function reachableStep(s: BookingSearch, details: ClientDetails | null): BookingStep {
  const wanted = BOOKING_STEPS.indexOf(s.step);
  const missing: BookingStep | null = !s.service
    ? 'service'
    : !s.master
      ? 'master'
      : !s.date || !s.slot
        ? 'datetime'
        : !details
          ? 'details'
          : null;
  if (missing && BOOKING_STEPS.indexOf(missing) < wanted) return missing;
  return s.step;
}

/** Сайт записи салона: услуга → мастер → дата и время → данные → подтверждение. */
export function BookingPage() {
  const { slug } = route.useParams();
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { message } = App.useApp();
  const salon = useQuery(salonQueryOptions(slug));
  const { data: services = [] } = useQuery(servicesQueryOptions(slug));
  const service = services.find((s) => s.id === search.service);
  const { data: masters = [] } = useQuery({
    ...mastersQueryOptions(slug, search.service ?? ''),
    enabled: !!search.service,
  });
  const create = useCreateBooking(slug);
  const [details, setDetails] = useState<ClientDetails | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  // Один ключ идемпотентности на одну и ту же попытку записи (повтор после обрыва — не дубль).
  const attempt = useRef<{ signature: string; key: string } | null>(null);

  const go = (patch: Partial<BookingSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });

  if (salon.isPending) {
    return (
      <BookingShell>
        <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />
      </BookingShell>
    );
  }
  if (salon.isError) {
    const notFound = salon.error instanceof ApiError && salon.error.status === 404;
    return (
      <BookingShell>
        <BookingCard>
          <Result
            status={notFound ? '404' : 'error'}
            title={notFound ? 'Салон не знайдено' : 'Не вдалося завантажити сторінку'}
            subTitle={notFound ? 'Перевірте посилання на онлайн-запис.' : errorMessage(salon.error)}
            extra={
              notFound ? (
                <Link to="/booking">
                  <Button type="primary">Усі салони</Button>
                </Link>
              ) : (
                <Button type="primary" onClick={() => void salon.refetch()}>
                  Спробувати ще раз
                </Button>
              )
            }
          />
        </BookingCard>
      </BookingShell>
    );
  }

  if (booking) {
    return (
      <BookingShell>
        <SuccessView
          booking={booking}
          salon={salon.data}
          onNewBooking={() => {
            setBooking(null);
            attempt.current = null;
            void navigate({ search: { step: 'service' } });
          }}
        />
      </BookingShell>
    );
  }

  const step = reachableStep(search, details);
  const index = BOOKING_STEPS.indexOf(step);
  const masterName =
    search.master === ANY_MASTER
      ? 'Будь-який вільний майстер'
      : (masters.find((m) => m.id === search.master)?.name ?? '');

  const confirm = () => {
    if (!service || !search.slot || !details) return;
    const body: Schema<'BookingCreate'> = {
      service_id: service.id,
      master_id: search.master === ANY_MASTER ? null : (search.master ?? null),
      start_at: search.slot,
      client_name: details.name,
      client_phone: details.phone,
      comment: details.comment ?? null,
    };
    const signature = JSON.stringify(body);
    if (attempt.current?.signature !== signature) {
      attempt.current = { signature, key: crypto.randomUUID() };
    }
    create.mutate(
      { body, idempotencyKey: attempt.current.key },
      {
        onSuccess: setBooking,
        onError: (e) => {
          void message.error(errorMessage(e));
          // Время заняли, пока клиент заполнял данные — назад к выбору времени.
          if (e instanceof ApiError && e.status === 409) go({ step: 'datetime', slot: undefined });
        },
      },
    );
  };

  return (
    <BookingShell>
      <SalonHeader salon={salon.data} />
      <StepsBar steps={STEPS} current={index} />
      <BookingCard>
        {step === 'service' && (
          <ServiceStep
            slug={slug}
            selectedId={search.service}
            onSelect={(s) => {
              go({
                step: 'master',
                service: s.id,
                ...(s.id !== search.service
                  ? { master: undefined, date: undefined, slot: undefined }
                  : {}),
              });
            }}
          />
        )}
        {step === 'master' && service && (
          <MasterStep
            slug={slug}
            service={service}
            selectedId={search.master}
            onSelect={(master) => {
              go({
                step: 'datetime',
                master,
                ...(master !== search.master ? { date: undefined, slot: undefined } : {}),
              });
            }}
          />
        )}
        {step === 'datetime' && service && search.master && (
          <DateTimeStep
            slug={slug}
            service={service}
            master={search.master}
            date={search.date}
            slot={search.slot}
            onDate={(date) => {
              go({ date, slot: undefined });
            }}
            onSlot={(slot) => {
              go({ slot, step: 'details' });
            }}
          />
        )}
        {step === 'details' && (
          <DetailsStep
            value={details}
            onSubmit={(d) => {
              setDetails(d);
              go({ step: 'confirm' });
            }}
          />
        )}
        {step === 'confirm' && service && search.slot && details && (
          <ConfirmStep
            service={service}
            masterName={masterName}
            slot={search.slot}
            details={details}
            loading={create.isPending}
            onConfirm={confirm}
          />
        )}
        {(step === 'master' || step === 'datetime') && !service && (
          <Spin style={{ display: 'block', margin: '40px auto' }} />
        )}

        {index > 0 && (
          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                go({ step: BOOKING_STEPS[index - 1] });
              }}
            >
              Назад
            </Button>
          </div>
        )}
      </BookingCard>
    </BookingShell>
  );
}
