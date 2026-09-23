import { z } from 'zod';

export const staffSearchSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(25),
  query: z.string().optional(),
  status: z.enum(['active', 'vacation', 'sick', 'fired']).default('active'),
  role: z.enum(['administrator', 'master']).optional(),
});

export type StaffSearch = z.infer<typeof staffSearchSchema>;
