import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Button, Calendar, Flex, theme, Tooltip, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';

import { api, unwrap } from '@/shared/api';
import { inSalonTz } from '@/shared/lib';

import { dayLoad } from './load';

/** Тот же ключ, что у вида «Місяць» Розкладу: данные общие, WebSocket сбрасывает `records`. */
const summaryQueryOptions = (from: string, to: string) =>
  queryOptions({
    queryKey: ['records', 'daily-summary', from, to] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/records/daily-summary', {
          params: { query: { dateFrom: from, dateTo: to } },
          signal,
        }),
      ).data,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

/** 6 недель с понедельника, покрывающие месяц. */
function monthGrid(month: Dayjs): [string, string] {
  const first = month.startOf('month');
  const start = first.subtract((first.day() + 6) % 7, 'day');
  return [start.format('YYYY-MM-DD'), start.add(41, 'day').format('YYYY-MM-DD')];
}

function LoadRing({ load, children }: { load: number | null; children: React.ReactNode }) {
  const { token } = theme.useToken();
  const r = 11;
  const length = 2 * Math.PI * r;
  const color =
    load === null
      ? 'transparent'
      : load < 0.5
        ? token.colorSuccess
        : load < 0.8
          ? token.colorWarning
          : token.colorError;
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 26, height: 26 }}>
      <svg width={26} height={26} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        {load !== null && (
          <circle
            cx={13}
            cy={13}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray={`${length * load} ${length}`}
            transform="rotate(-90 13 13)"
          />
        )}
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
        }}
      >
        {children}
      </span>
    </span>
  );
}

/**
 * Мини-календарь в меню (новая запись — «Новий запис» в Розкладі и `Alt+N`): выбор даты открывает Розклад на этот день; кольцо вокруг числа —
 * загрузка мастеров (зелёное < 50%, жёлтое < 80%, красное — почти всё занято).
 */
export function MiniCalendar() {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const today = inSalonTz(new Date()).format('YYYY-MM-DD');
  const routeDate =
    location.pathname === '/calendar'
      ? ((location.search as { date?: string }).date ?? today)
      : today;
  // Листание месяцев — своё состояние; при смене даты в Розкладе календарь возвращается к ней.
  const [browsed, setBrowsed] = useState<{ for: string; month: Dayjs } | null>(null);
  const panel = browsed?.for === routeDate ? browsed.month : dayjs(routeDate);
  const setPanel = (month: Dayjs) => {
    setBrowsed({ for: routeDate, month });
  };

  const [from, to] = monthGrid(panel);
  const { data = [] } = useQuery(summaryQueryOptions(from, to));
  const byDate = new Map(data.map((d) => [d.date, d]));

  return (
    <div style={{ padding: '0 8px 8px' }}>
      <Calendar
        fullscreen={false}
        value={panel}
        onPanelChange={(d) => {
          setPanel(d);
        }}
        // Своя компактная шапка: стандартная (выпадающие год и месяц) не помещается в меню.
        headerRender={() => (
          <Flex justify="space-between" align="center" style={{ padding: '4px 0' }}>
            <Button
              type="text"
              size="small"
              aria-label="Попередній місяць"
              icon={<LeftOutlined />}
              onClick={() => {
                setPanel(panel.subtract(1, 'month'));
              }}
            />
            <Typography.Text strong>
              {panel.format('MMMM YYYY').replace(/^./, (c) => c.toUpperCase())}
            </Typography.Text>
            <Button
              type="text"
              size="small"
              aria-label="Наступний місяць"
              icon={<RightOutlined />}
              onClick={() => {
                setPanel(panel.add(1, 'month'));
              }}
            />
          </Flex>
        )}
        onSelect={(d, { source }) => {
          if (source !== 'date') return;
          void navigate({ to: '/calendar', search: { view: 'day', date: d.format('YYYY-MM-DD') } });
        }}
        fullCellRender={(current, info) => {
          if (info.type !== 'date') return info.originNode;
          const key = current.format('YYYY-MM-DD');
          const summary = byDate.get(key);
          const selected = key === routeDate;
          const cell = (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                opacity: current.month() === panel.month() ? 1 : 0.4,
                fontWeight: key === today ? 700 : undefined,
                color: selected ? token.colorPrimary : undefined,
              }}
            >
              <LoadRing load={dayLoad(summary)}>{current.date()}</LoadRing>
            </div>
          );
          return summary?.total ? (
            <Tooltip title={`Записів: ${summary.total}`} mouseEnterDelay={0.4}>
              {cell}
            </Tooltip>
          ) : (
            cell
          );
        }}
      />
    </div>
  );
}
