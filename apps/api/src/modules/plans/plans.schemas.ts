import { z } from 'zod';
const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9_-]{0,63}$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const amount = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/);
export const createPlanSchema = z.object({
  planCode: code,
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  minimumQuantity: z.number().int().positive().optional(),
  maximumQuantity: z.number().int().positive().nullable().optional(),
  startsAt: date.nullable().optional(),
  endsAt: date.nullable().optional(),
  autoClose: z.boolean().optional(),
  closable: z.boolean().optional(),
  pausable: z.boolean().optional(),
  renewable: z.boolean().optional(),
});
export const updatePlanSchema = createPlanSchema.omit({ planCode: true }).partial();
export const createItemSchema = z.object({
  productId: z.uuid(),
  variantId: z.uuid().nullable().optional(),
  quantity: z.number().int().positive(),
});
export const createPriceSchema = z.object({
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/),
  billingPeriod: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  amount,
  effectiveFrom: date,
  effectiveUntil: date.nullable().optional(),
});
export const closePriceSchema = z.object({ effectiveUntil: date });
