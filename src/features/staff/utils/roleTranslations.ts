import { StaffRole } from '../types';

/**
 * Маска для перекладу ролей співробітників з англійської на українську
 */
export const ROLE_TRANSLATIONS: Record<string, string> = {
    master: 'Майстер',
    administrator: 'Адміністратор',
    manager: 'Менеджер',
    // Додаткові можливі варіанти
    admin: 'Адміністратор',
    masters: 'Майстер',
    masters_plural: 'Майстери',
};

/**
 * Отримати український переклад ролі співробітника
 * @param role - Роль співробітника (англійською або вже перекладена)
 * @returns Українська назва ролі
 */
export function getRoleLabel(role: StaffRole | string | undefined): string {
    if (!role) return 'Не визначено';
    
    // Якщо роль вже українською (починається з великої кириличної літери), повертаємо як є
    const firstChar = role.charAt(0);
    if (/[А-ЯЄІЇҐ]/.test(firstChar)) {
        return role;
    }
    
    // Перекладаємо з англійської
    return ROLE_TRANSLATIONS[role.toLowerCase()] || role;
}

