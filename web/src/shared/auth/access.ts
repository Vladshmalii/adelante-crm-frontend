import type { Schema } from '@/shared/api';

/**
 * Права доступа по ролям — см. docs/ACCESS.md. Здесь только то, что нужно фронту,
 * чтобы спрятать недоступное; настоящие проверки — на бекенде.
 */
export type Section = 'clients' | 'staff' | 'services' | 'finances';

export interface Viewer {
  id: string;
  role: Schema<'Role'>;
  isAdmin: boolean;
  isMaster: boolean;
  /** Администратор с доступом к финансам, выгрузкам и управлению администраторами. */
  isSuperuser: boolean;
}

type Me = Schema<'MeOut'>;

export function toViewer(me: Me): Viewer {
  const isAdmin = me.role === 'administrator';
  // Флага пока нет в API (см. docs/ACCESS.md, «Что нужно на бекенде») — читаем его, если появится.
  const flag = (me as Me & { isSuperuser?: boolean }).isSuperuser === true;
  return {
    id: me.id,
    role: me.role,
    isAdmin,
    isMaster: me.role === 'master',
    isSuperuser: isAdmin && flag,
  };
}

const SECTIONS: Record<Section, (v: Viewer) => boolean> = {
  clients: () => true,
  staff: (v) => v.isAdmin,
  services: (v) => v.isAdmin,
  finances: (v) => v.isSuperuser,
};

export const canAccess = (viewer: Viewer, section: Section) => SECTIONS[section](viewer);

export const permissions = (v: Viewer) => ({
  clients: {
    create: true,
    edit: v.isAdmin,
    delete: v.isAdmin,
    import: v.isAdmin,
    export: v.isSuperuser,
  },
  staff: {
    manageMasters: v.isAdmin,
    manageAdmins: v.isSuperuser,
    /** Зарплата, комиссия и статистика выручки — финансовые данные. */
    viewFinance: v.isSuperuser,
    export: v.isSuperuser,
  },
  services: {
    manage: v.isAdmin,
  },
});

export type Permissions = ReturnType<typeof permissions>;
