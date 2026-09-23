import { ScissorOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
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
  { path: '/clients', name: 'Клієнти', icon: <UserOutlined />, section: 'clients' },
  { path: '/staff', name: 'Співробітники', icon: <TeamOutlined />, section: 'staff' },
  { path: '/services', name: 'Послуги', icon: <ScissorOutlined />, section: 'services' },
];
