import {
  AppstoreOutlined,
  ScissorOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button, Empty, Input, Modal, Spin, theme, Typography } from 'antd';
import { type ReactNode, useEffect, useState } from 'react';

import { canAccess, useViewer } from '@/shared/auth';
import { formatPhone, useDebouncedValue } from '@/shared/lib';

import { menuItems } from './menu';
import { searchClientsQuery, searchServicesQuery, searchStaffQuery } from './search.queries';

interface Result {
  key: string;
  group: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  go: () => void;
}

const MIN_QUERY = 2;
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent);

/** Глобальный поиск (Ctrl/⌘+K): разделы, клиенты, для администратора — сотрудники и услуги. */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <>
      <Button
        icon={<SearchOutlined />}
        onClick={() => {
          setOpen(true);
        }}
      >
        Пошук{' '}
        <Typography.Text type="secondary" keyboard>
          {isMac ? '⌘' : 'Ctrl'} K
        </Typography.Text>
      </Button>
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
        }}
        footer={null}
        closable={false}
        destroyOnHidden
        width={560}
        styles={{ body: { padding: 0 } }}
        title={null}
      >
        <SearchPanel
          onClose={() => {
            setOpen(false);
          }}
        />
      </Modal>
    </>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { viewer } = useViewer();
  const [text, setText] = useState('');
  const [active, setActive] = useState(0);
  const query = useDebouncedValue(text.trim());
  const enabled = query.length >= MIN_QUERY;

  const clients = useQuery({ ...searchClientsQuery(query), enabled });
  const staff = useQuery({ ...searchStaffQuery(query), enabled: enabled && viewer.isAdmin });
  const services = useQuery({ ...searchServicesQuery(query), enabled: enabled && viewer.isAdmin });

  const go = (fn: () => Promise<void>) => () => {
    onClose();
    void fn();
  };

  const needle = text.trim().toLowerCase();
  const results: Result[] = [
    ...menuItems
      .filter(
        (m) => canAccess(viewer, m.section) && needle && m.name.toLowerCase().includes(needle),
      )
      .map((m) => ({
        key: `page:${m.path}`,
        group: 'Розділи',
        icon: <AppstoreOutlined />,
        title: m.name,
        go: go(() => navigate({ to: m.path })),
      })),
    ...(enabled ? (clients.data ?? []) : []).map((c) => ({
      key: `client:${c.id}`,
      group: 'Клієнти',
      icon: <UserOutlined />,
      title: [c.lastName, c.firstName, c.middleName].filter(Boolean).join(' '),
      subtitle: formatPhone(c.phone),
      go: go(() => navigate({ to: '/clients', search: { id: c.id } })),
    })),
    ...(enabled ? (staff.data ?? []) : []).map((s) => {
      const name = [s.lastName, s.firstName].filter(Boolean).join(' ');
      return {
        key: `staff:${s.id}`,
        group: 'Співробітники',
        icon: <TeamOutlined />,
        title: name,
        subtitle: s.position ?? undefined,
        go: go(() => navigate({ to: '/staff', search: { query: s.firstName, status: s.status } })),
      };
    }),
    ...(enabled ? (services.data ?? []) : []).map((s) => ({
      key: `service:${s.id}`,
      group: 'Послуги',
      icon: <ScissorOutlined />,
      title: s.name,
      subtitle: `${s.durationMinutes} хв`,
      go: go(() => navigate({ to: '/services', search: { query: s.name } })),
    })),
  ];

  const loading = enabled && (clients.isFetching || staff.isFetching || services.isFetching);
  const current = Math.min(active, Math.max(results.length - 1, 0));

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActive((current + 1) % Math.max(results.length, 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActive((current - 1 + results.length) % Math.max(results.length, 1));
        } else if (e.key === 'Enter') {
          results[current]?.go();
        }
      }}
    >
      <Input
        autoFocus
        size="large"
        variant="borderless"
        prefix={<SearchOutlined />}
        suffix={loading ? <Spin size="small" /> : null}
        placeholder="Клієнт, співробітник, послуга або розділ…"
        value={text}
        style={{ padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` }}
        onChange={(e) => {
          setText(e.target.value);
          setActive(0);
        }}
      />
      <div role="listbox" style={{ maxHeight: 400, overflow: 'auto', padding: 8 }}>
        {results.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              needle.length < MIN_QUERY
                ? 'Введіть щонайменше 2 символи'
                : loading
                  ? 'Шукаємо…'
                  : 'Нічого не знайдено'
            }
          />
        ) : (
          results.map((r, i) => (
            <div key={r.key}>
              {(i === 0 || results[i - 1]?.group !== r.group) && (
                <Typography.Text
                  type="secondary"
                  style={{ display: 'block', fontSize: 12, padding: '8px 12px 4px' }}
                >
                  {r.group}
                </Typography.Text>
              )}
              <div
                role="option"
                aria-selected={i === current}
                onMouseEnter={() => {
                  setActive(i);
                }}
                onClick={r.go}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: token.borderRadius,
                  cursor: 'pointer',
                  background: i === current ? token.controlItemBgActive : undefined,
                }}
              >
                {r.icon}
                <span style={{ flex: 1 }}>{r.title}</span>
                {r.subtitle && <Typography.Text type="secondary">{r.subtitle}</Typography.Text>}
              </div>
            </div>
          ))
        )}
      </div>
      <Typography.Text
        type="secondary"
        style={{
          display: 'block',
          fontSize: 12,
          padding: '8px 16px',
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        ↑↓ — вибір · Enter — відкрити · Esc — закрити
      </Typography.Text>
    </div>
  );
}
