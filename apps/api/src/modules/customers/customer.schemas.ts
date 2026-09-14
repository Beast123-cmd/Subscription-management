import { z } from 'zod';

const currencyCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const createCustomerSchema = z.object({
  customerType: z.enum(['BUSINESS', 'INDIVIDUAL']),
  legalName: z.string().trim().min(1).max(160),
  displayName: z.string().trim().min(1).max(160),
  email: z.email().max(320).nullable().optional(),
  phone: optionalText(40),
  taxIdentifier: optionalText(100),
  defaultCurrencyCode: currencyCode,
});

export const updateCustomerSchema = createCustomerSchema.omit({ customerType: true }).partial();

export const createContactSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.email().max(320).nullable().optional(),
  phone: optionalText(40),
  jobTitle: optionalText(100),
  isPrimary: z.boolean().optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export const createAddressSchema = z.object({
  addressType: z.enum(['BILLING', 'SHIPPING', 'OTHER']),
  addressLine1: z.string().trim().min(1).max(160),
  addressLine2: optionalText(160),
  city: z.string().trim().min(1).max(100),
  state: optionalText(100),
  postalCode: optionalText(32),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();
