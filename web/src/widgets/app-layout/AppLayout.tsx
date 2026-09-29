import {
  LogoutOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Link, type LinkProps, useLocation, useNavigate } from '@tanstack/react-router';
import { Button, Dropdown, Select } from 'antd';
import { type ReactNode, useEffect } from 'react';

import { canAccess, meQueryOptions, useViewer } from '@/shared/auth';
import { usePreferencesStore } from '@/shared/preferences';
import { useSessionStore } from '@/shared/session';
import { MiniCalendar } from '@/widgets/mini-calendar';
import { NotificationsBell } from '@/widgets/notifications';

import { GlobalSearch } from './GlobalSearch';

import { menuItems } from './menu';

export function AppLayout({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const { viewer } = useViewer();
  const routes = menuItems
    .filter((item) => canAccess(viewer, item.section))
    .map(({ path, name, icon }) => ({ path, name, icon }));
  const pathname = useLocation({ select: (l) => l.pathname });
  const navigate = useNavigate();

  const { themeMode, toggleTheme, siderCollapsed, setSiderCollapsed } = usePreferencesStore();
  const salonId = useSessionStore((s) => s.salonId);
  const setSalonId = useSessionStore((s) => s.setSalonId);
  const logout = useSessionStore((s) => s.clear);

  // Alt+N — новая запись из любого раздела.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyN') {
        e.preventDefault();
        void navigate({ to: '/calendar', search: { create: true } });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [navigate]);

  const switchSalon = (id: string) => {
    setSalonId(id);
    // Все данные, кроме профиля, принадлежат салону — сбрасываем и грузим заново.
    void queryClient.resetQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
    // Профиль тоже зависит от салона (должность, оклад в этом салоне).
    void queryClient.invalidateQueries({ queryKey: meQueryOptions.queryKey });
  };

  return (
    <ProLayout
      title="Adelante CRM"
      logo="/favicon.svg"
      layout="mix"
      fixSiderbar
      route={{ path: '/', routes }}
      location={{ pathname }}
      collapsed={siderCollapsed}
      onCollapse={setSiderCollapsed}
      // Мини-календарь с загрузкой дней и «Додати запис» — над меню; в свёрнутом меню не помещается.
      menuExtraRender={({ collapsed }) => (collapsed ? null : <MiniCalendar />)}
      siderWidth={264}
      menuItemRender={(item, dom) =>
        // ProLayout отдаёт path как string; все пути берутся из типизированного menuItems.
        item.path ? <Link to={item.path as LinkProps['to']}>{dom}</Link> : dom
      }
      actionsRender={() => [
        <GlobalSearch key="search" />,
        <NotificationsBell key="bell" />,
        me.salons.length > 1 && (
          <Select
            key="salon"
            size="small"
            style={{ minWidth: 160 }}
            value={salonId}
            onChange={switchSalon}
            options={me.salons.map((s) => ({ value: s.id, label: s.name }))}
          />
        ),
        <Button
          key="theme"
          type="text"
          aria-label="Змінити тему"
          icon={themeMode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
        />,
      ]}
      avatarProps={{
        src: me.avatarUrl ?? undefined,
        title: me.name,
        size: 'small',
        render: (_, avatar) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile',
                  icon: <UserOutlined />,
                  label: 'Мій профіль',
                  onClick: () => void navigate({ to: '/profile' }),
                },
                ...(canAccess(viewer, 'settings')
                  ? [
                      {
                        key: 'settings',
                        icon: <SettingOutlined />,
                        label: 'Налаштування',
                        onClick: () => void navigate({ to: '/settings' }),
                      },
                    ]
                  : []),
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Вийти', onClick: logout },
              ],
            }}
          >
            {avatar}
          </Dropdown>
        ),
      }}
    >
      {children}
    </ProLayout>
  );
}
