import { z } from 'zod';
export const createRuleSchema = z.object({ name: z.string().trim().min(1).max(160), rate: z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/).refine((v) => Number(v) <= 100, 'Rate cannot exceed 100.') });
