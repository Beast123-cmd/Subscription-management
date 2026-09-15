import { z } from 'zod';
const money = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/);
export const createInvoiceSchema = z.object({
  customerId: z.uuid(),
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export const lineSchema = z.object({
  description: z.string().trim().min(1).max(2000),
  quantity: z.number().int().positive(),
  unitPrice: money,
  discountAmount: money.optional(),
  taxAmount: money.optional(),
  discountId: z.uuid().optional(),
  taxId: z.uuid().optional(),
});
