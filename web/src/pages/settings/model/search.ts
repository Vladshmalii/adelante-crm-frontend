import { z } from 'zod';

export const settingsSearchSchema = z.object({
  tab: z.enum(['salon', 'schedule', 'loyalty', 'certificates']).default('salon'),
});

export type SettingsSearch = z.infer<typeof settingsSearchSchema>;
export type SettingsTab = SettingsSearch['tab'];
