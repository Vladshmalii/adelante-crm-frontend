import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { meQueryOptions, toViewer } from '@/shared/auth';
import { isAuthenticated, useSessionStore } from '@/shared/session';
import { AppLayout } from '@/widgets/app-layout';

/**
 * Pathless-layout для всех страниц за логином: проверка входа, загрузка профиля и общий layout.
 * Профиль грузим в beforeLoad (а не в loader), чтобы дочерние роуты могли проверить права
 * по `context.viewer` в своих beforeLoad.
 */
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context, location }) => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
    const me = await context.queryClient.query(meQueryOptions);
    const { salonId, setSalonId } = useSessionStore.getState();
    const firstSalon = me.salons[0];
    if (firstSalon && !me.salons.some((s) => s.id === salonId)) setSalonId(firstSalon.id);
    return { viewer: toViewer(me) };
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
