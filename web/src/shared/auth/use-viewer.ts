import { useSuspenseQuery } from '@tanstack/react-query';

import { permissions, toViewer } from './access';
import { meQueryOptions } from './me.query';

/** Текущий пользователь и его права. Профиль уже загружен в `_app` (beforeLoad). */
export function useViewer() {
  const { data: me } = useSuspenseQuery({ ...meQueryOptions, select: toViewer });
  return { viewer: me, can: permissions(me) };
}
