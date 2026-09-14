import { z } from 'zod';
export const createSubscriptionSchema = z.object({
  customerId: z.uuid(),
  planId: z.uuid(),
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/),
  billingPeriod: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  billingStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  autoRenew: z.boolean().optional(),
  paymentTerms: z.string().trim().max(100).nullable().optional(),
});
export const reasonSchema = z.object({ reason: z.string().trim().min(1).max(500).optional() });
