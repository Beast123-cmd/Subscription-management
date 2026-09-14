import { z } from 'zod';

const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9_-]{0,63}$/);
const currency = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const amount = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/);

export const createProductSchema = z.object({
  productCode: code,
  name: z.string().trim().min(1).max(160),
  description: optionalText(2000),
  productType: z.enum(['GOODS', 'SERVICE']),
  costPrice: amount,
  costCurrencyCode: currency,
});

export const updateProductSchema = createProductSchema
  .omit({ productCode: true, productType: true })
  .partial();

export const createVariantSchema = z.object({
  sku: z.string().trim().toUpperCase().min(1).max(100),
  name: z.string().trim().min(1).max(160),
  description: optionalText(2000),
});

export const updateVariantSchema = createVariantSchema.partial().extend({
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export const createAttributeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  code,
});

export const createAttributeValueSchema = z.object({ value: z.string().trim().min(1).max(100) });
export const setVariantValuesSchema = z.object({ attributeValueIds: z.array(z.uuid()).max(100) });
