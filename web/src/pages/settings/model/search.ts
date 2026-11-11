import { z } from 'zod';

export const SETTINGS_TABS = ['salon', 'schedule'] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

/**
 * Вкладки, переехавшие в «Лояльність» (frontend-loyalty-page.md, решение 7). Схема их ещё
 * принимает, чтобы старые ссылки не падали на валидации: роут редиректит их на новые страницы.
 */
export const MOVED_SETTINGS_TABS = ['loyalty', 'certificates'] as const;

export const settingsSearchSchema = z.object({
  tab: z.enum([...SETTINGS_TABS, ...MOVED_SETTINGS_TABS]).default('salon'),
});

export type SettingsSearch = z.infer<typeof settingsSearchSchema>;
