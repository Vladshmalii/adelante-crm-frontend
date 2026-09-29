import { CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';
import { Alert, Button, Segmented, Space, Spin, Tag, theme, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { Fragment, useState } from 'react';

import type { Schema } from '@/shared/api';
import { canAccess, useViewer } from '@/shared/auth';
import { shiftMarkLabels } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { shiftGridQueryOptions } from '../api/shifts.api';
import type { ShiftsSearch } from '../model/search';
import { isPast, mondayOf, periodDays, shiftHint, shiftText, todayInSalon } from '../model/shifts';
import { FillShiftsModal } from './FillShiftsModal';
import { type OpenCell, ShiftCellModal } from './ShiftCellModal';

type Row = Schema<'StaffShiftsOut'>;
type Cell = Schema<'ShiftCellOut'>;

const route = getRouteApi('/_app/shifts');

const NAME_COL = 220;
const DAY_COL = 96;

/**
 * «Графік роботи»: сотрудники по строкам, даты по столбцам; в ячейке смена «09:00–18:00»,
 * «Відпустка» / «Лікарняний» или пусто (выходной). Дни, когда салон закрыт, — серым.
 */
export function ShiftsPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { viewer } = useViewer();
  const { token } = theme.useToken();
  const from = search.from ?? mondayOf(todayInSalon());
  const days = periodDays(from, search.weeks);
  const to = days[days.length - 1] ?? from;
  const { data, error, isPending, refetch } = useQuery(shiftGridQueryOptions(from, to));
  const [openCell, setOpenCell] = useState<OpenCell | null>(null);
  const [filling, setFilling] = useState(false);

  const setSearch = (patch: Partial<ShiftsSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  const shift = (weeks: number) => {
    setSearch({
      from: dayjs(from)
        .add(weeks * 7, 'day')
        .format('YYYY-MM-DD'),
    });
  };

  const today = todayInSalon();
  const salonDays = new Map((data?.days ?? []).map((d) => [d.date, d]));
  const editable = (data?.staff ?? []).filter((r) => r.canEdit);
  const masters = (data?.staff ?? []).filter((r) => r.role === 'master');
  const admins = (data?.staff ?? []).filter((r) => r.role === 'administrator');

  const renderRow = (row: Row) => (
    <Fragment key={row.staffId}>
      <div
        style={{
          position: 'sticky',
          left: 0,
          zIndex: 1,
          background: token.colorBgContainer,
          padding: '8px 12px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            flex: 'none',
            background: row.color ?? token.colorTextQuaternary,
          }}
        />
        <Typography.Text ellipsis>{row.name}</Typography.Text>
      </div>
      {days.map((date) => {
        const cell = row.days.find((c) => c.date === date) ?? {
          date,
          kind: null,
          recordsCount: 0,
        };
        return (
          <ShiftCell
            key={date}
            cell={cell}
            closed={salonDays.get(date)?.open === null}
            past={isPast(date)}
            today={date === today}
            onOpen={() => {
              setOpenCell({
                row,
                cell,
                salon: salonDays.get(date),
                salonConfigured: data?.salonScheduleConfigured ?? false,
              });
            }}
          />
        );
      })}
    </Fragment>
  );

  return (
    <PageContainer
      title="Графік роботи"
      extra={
        <Space wrap>
          <Space.Compact>
            <Button
              aria-label="Назад"
              icon={<LeftOutlined />}
              onClick={() => {
                shift(-1);
              }}
            />
            <Button
              icon={<CalendarOutlined />}
              onClick={() => {
                setSearch({ from: undefined });
              }}
            >
              Поточний тиждень
            </Button>
            <Button
              aria-label="Вперед"
              icon={<RightOutlined />}
              onClick={() => {
                shift(1);
              }}
            />
          </Space.Compact>
          <Segmented<ShiftsSearch['weeks']>
            value={search.weeks}
            onChange={(weeks) => {
              setSearch({ weeks });
            }}
            options={[
              { value: 1, label: 'Тиждень' },
              { value: 2, label: '2 тижні' },
              { value: 4, label: '4 тижні' },
            ]}
          />
          {/* Без графика салона — только відпустка / лікарняний (режим «відмітка»). */}
          {editable.length > 0 && (
            <Button
              type="primary"
              onClick={() => {
                setFilling(true);
              }}
            >
              Заповнити на період
            </Button>
          )}
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        {dayjs(from).format('D MMMM')} — {dayjs(to).format('D MMMM YYYY')}. Натисніть на клітинку,
        щоб поставити зміну, відпустку чи лікарняний; порожня клітинка — вихідний.
      </Typography.Paragraph>

      {data && !data.salonScheduleConfigured && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title="Спочатку заповніть графік роботи салону"
          description={
            canAccess(viewer, 'settings') ? (
              <Link to="/settings" search={{ tab: 'schedule' }}>
                Налаштування → Графік роботи
              </Link>
            ) : (
              'Зверніться до адміністратора. Поки графік салону не заповнений, можна ставити лише відпустку та лікарняний.'
            )
          }
        />
      )}
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />

      {isPending ? (
        <Spin style={{ display: 'block', margin: '80px auto' }} />
      ) : (
        <div
          style={{
            overflow: 'auto',
            maxHeight: 'calc(100vh - 280px)',
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `${NAME_COL}px repeat(${days.length}, minmax(${DAY_COL}px, 1fr))`,
              minWidth: NAME_COL + days.length * DAY_COL,
            }}
          >
            <div
              style={{
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 3,
                background: token.colorBgContainer,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
            />
            {days.map((date) => {
              const closed = salonDays.get(date)?.open === null;
              const d = dayjs(date);
              return (
                <div
                  key={date}
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    padding: '6px 4px',
                    textAlign: 'center',
                    borderLeft: `1px solid ${token.colorBorderSecondary}`,
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background:
                      date === today
                        ? token.colorPrimaryBg
                        : closed
                          ? token.colorFillSecondary
                          : token.colorBgContainer,
                  }}
                >
                  <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                    {d.format('dd')}
                  </Typography.Text>
                  <div style={{ fontWeight: date === today ? 700 : 500 }}>{d.format('DD.MM')}</div>
                </div>
              );
            })}

            {masters.map(renderRow)}
            {admins.length > 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  padding: '6px 12px',
                  background: token.colorFillQuaternary,
                  borderBottom: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Typography.Text type="secondary" strong>
                  Адміністратори
                </Typography.Text>
              </div>
            )}
            {admins.map(renderRow)}
          </div>
        </div>
      )}

      <ShiftCellModal
        open={openCell}
        onClose={() => {
          setOpenCell(null);
        }}
      />
      <FillShiftsModal
        open={filling}
        rows={editable}
        salonConfigured={data?.salonScheduleConfigured ?? false}
        onClose={() => {
          setFilling(false);
        }}
      />
    </PageContainer>
  );
}

/** Что в ячейке — для экранного диктора и тестов. */
const cellLabel = (cell: Cell) =>
  cell.kind === 'shift'
    ? shiftText(cell)
    : cell.kind
      ? shiftMarkLabels[cell.kind].text
      : 'вихідний';

function ShiftCell({
  cell,
  closed,
  past,
  today,
  onOpen,
}: {
  cell: Cell;
  closed: boolean;
  past: boolean;
  today: boolean;
  onOpen: () => void;
}) {
  const { token } = theme.useToken();
  const hint = cell.kind === 'shift' ? shiftHint(cell) : cell.comment;
  const content =
    cell.kind === 'shift' ? (
      <Typography.Text strong style={{ fontSize: token.fontSizeSM }}>
        {shiftText(cell)}
      </Typography.Text>
    ) : cell.kind ? (
      <Tag color={shiftMarkLabels[cell.kind].color} style={{ marginInlineEnd: 0 }}>
        {shiftMarkLabels[cell.kind].text}
      </Tag>
    ) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${cell.date} ${cellLabel(cell)}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
      }}
      style={{
        minHeight: 48,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        cursor: 'pointer',
        borderLeft: `1px solid ${token.colorBorderSecondary}`,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: closed
          ? token.colorFillSecondary
          : today
            ? token.colorPrimaryBg
            : cell.kind === 'shift'
              ? token.colorSuccessBg
              : undefined,
        opacity: past ? 0.55 : 1,
      }}
    >
      {hint ? <Tooltip title={hint}>{content}</Tooltip> : content}
      {cell.recordsCount > 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          записів: {cell.recordsCount}
        </Typography.Text>
      )}
    </div>
  );
}
