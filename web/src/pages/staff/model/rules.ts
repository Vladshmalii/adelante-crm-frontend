import type { Schema } from '@/shared/api';
import type { Permissions, Viewer } from '@/shared/auth';

type Staff = Schema<'StaffOut'>;

/**
 * Может ли текущий пользователь управлять сотрудником (редактировать, график, увольнять,
 * восстанавливать): мастерами — администратор, администраторами — суперюзер (docs/ACCESS.md).
 */
export const canManage = (can: Permissions, staff: Staff) =>
  staff.role === 'master' ? can.staff.manageMasters : can.staff.manageAdmins;

/** Себя не увольняем и флаг суперюзера себе не снимаем (бекенд ответит 409). */
export const isSelf = (viewer: Viewer, staff: Staff) => viewer.id === staff.id;
