import {
  BarChartOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  DashboardOutlined,
  InboxOutlined,
  SettingOutlined,
  ScissorOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import type { Section } from '@/shared/auth';

interface MenuItem {
  path: NonNullable<LinkProps['to']>;
  name: string;
  icon: ReactNode;
  /** Раздел для проверки прав (docs/ACCESS.md). */
  section: Section;
}

/**
 * Пункты бокового меню. Новая страница = новый роут в src/routes + строка здесь.
 * Раздел появляется в меню вместе с рабочей страницей (FEATURES.md, решение 4).
 */
export const menuItems: MenuItem[] = [
  { path: '/calendar', name: 'Розклад', icon: <CalendarOutlined />, section: 'calendar' },
  { path: '/shifts', name: 'Графік роботи', icon: <FieldTimeOutlined />, section: 'shifts' },
  { path: '/clients', name: 'Клієнти', icon: <UserOutlined />, section: 'clients' },
  { path: '/staff', name: 'Співробітники', icon: <TeamOutlined />, section: 'staff' },
  { path: '/services', name: 'Послуги', icon: <ScissorOutlined />, section: 'services' },
  { path: '/inventory', name: 'Склад', icon: <InboxOutlined />, section: 'inventory' },
  { path: '/overview', name: 'Огляд', icon: <DashboardOutlined />, section: 'overview' },
  { path: '/reports', name: 'Звіти', icon: <BarChartOutlined />, section: 'reports' },
  { path: '/finances', name: 'Фінанси', icon: <WalletOutlined />, section: 'finances' },
  { path: '/settings', name: 'Налаштування', icon: <SettingOutlined />, section: 'settings' },
];
