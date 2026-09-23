import { redirect } from '@tanstack/react-router';

import { canAccess, type Section, type Viewer } from '@/shared/auth';

/** Для `beforeLoad` раздела: нет прав — страница 403 (бекенд тоже ответит 403). */
export function requireSection(viewer: Viewer, section: Section) {
  if (!canAccess(viewer, section)) throw redirect({ to: '/forbidden', replace: true });
}
