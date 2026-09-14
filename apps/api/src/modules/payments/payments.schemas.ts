import { z } from 'zod';
const money = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/);
export const createPaymentSchema = z.object({
  invoiceId: z.uuid(), amount: money,
  method: z.enum(['BANK_TRANSFER', 'CARD', 'UPI', 'CASH', 'OTHER']),
  reference: z.string().trim().max(255).optional(), notes: z.string().trim().max(2000).optional(),
});
