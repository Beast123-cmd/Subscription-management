// ==========================================
// Platform Identity & Tenancy
// ==========================================

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';
export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'REVOKED';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  defaultCurrencyCode: string;
  timezone: string;
  status: OrganizationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status?: UserStatus;
  lastLoginAt?: string | null;
}

export interface AuthSession {
  accessToken: string;
  user: User;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    defaultCurrencyCode?: string;
    timezone?: string;
  }>;
  activeOrganizationId?: string;
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
  permissionsCount?: number;
}

export interface OrganizationMember {
  id: string;
  status: MembershipStatus;
  joinedAt: string;
  user: User;
  roles: Array<{ role: Pick<Role, 'id' | 'name' | 'code'> }>;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  code: string;
  description?: string | null;
}

// ==========================================
// Customers
// ==========================================

export type CustomerType = 'BUSINESS' | 'INDIVIDUAL';
export type CustomerStatus = 'ACTIVE' | 'ARCHIVED';
export type CustomerContactStatus = 'ACTIVE' | 'ARCHIVED';
export type AddressType = 'BILLING' | 'SHIPPING' | 'OTHER';

export interface CustomerContact {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  isPrimary: boolean;
  status: CustomerContactStatus;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  addressType: AddressType;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  countryCode: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  organizationId: string;
  customerNumber: string; // e.g. CUS-000142
  customerType: CustomerType;
  legalName: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  taxIdentifier?: string | null;
  defaultCurrencyCode: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  contacts?: CustomerContact[];
  addresses?: CustomerAddress[];
}

// ==========================================
// Catalog & Pricing
// ==========================================

export type ProductType = 'GOODS' | 'SERVICE';
export type ProductStatus = 'ACTIVE' | 'ARCHIVED';

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description?: string | null;
  status: ProductStatus;
  costPrice?: string;
  costCurrencyCode?: string;
}

export interface Product {
  id: string;
  organizationId: string;
  productCode: string;
  name: string;
  description?: string | null;
  productType: ProductType;
  costPrice: string; // numeric decimal
  costCurrencyCode: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
}

export type PlanStatus = 'ACTIVE' | 'ARCHIVED';
export type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type PlanPriceStatus = 'ACTIVE' | 'ARCHIVED';

export interface PlanPrice {
  id: string;
  planId: string;
  currencyCode: string;
  billingPeriod: BillingPeriod;
  amount: string; // decimal numeric
  effectiveFrom: string; // YYYY-MM-DD
  effectiveUntil?: string | null; // YYYY-MM-DD, null = open-ended
  status: PlanPriceStatus;
}

export interface PlanItem {
  id: string;
  planId: string;
  productId: string;
  productName?: string;
  variantId?: string | null;
  quantity: number;
  product?: { name: string; productCode: string };
}

export interface Plan {
  id: string;
  organizationId: string;
  planCode: string;
  name: string;
  description?: string | null;
  status: PlanStatus;
  minimumQuantity: number;
  maximumQuantity?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  autoClose: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
  createdAt: string;
  updatedAt: string;
  items?: PlanItem[];
  prices?: PlanPrice[];
}

// ==========================================
// Subscriptions
// ==========================================

export type SubscriptionStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'CLOSED';

export type SubscriptionAmendmentType = 'PAUSED' | 'RESUMED' | 'CANCELLED';

export interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  productId?: string | null;
  variantId?: string | null;
  descriptionSnapshot: string;
  quantity: number;
  unitPrice: string;
  currencyCode: string;
}

export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  eventType: string;
  occurredAt: string;
  actorUserId?: string | null;
  actorName?: string;
  metadata?: Record<string, unknown> | null;
}

export interface SubscriptionAmendment {
  id: string;
  subscriptionId: string;
  amendmentType: SubscriptionAmendmentType;
  effectiveAt: string;
  reason?: string | null;
  beforeSnapshot: Record<string, unknown>;
  afterSnapshot: Record<string, unknown>;
  createdAt: string;
}

export interface Subscription {
  id: string;
  organizationId: string;
  subscriptionNumber: string; // e.g. SUB-000812
  customerId: string;
  customerName?: string;
  planId: string;
  planName?: string;
  status: SubscriptionStatus;
  startDate: string;
  expirationDate?: string | null;
  billingStartDate: string;
  currencyCode: string;
  paymentTerms?: string | null;
  autoRenew: boolean;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: SubscriptionItem[];
  events?: SubscriptionEvent[];
  amendments?: SubscriptionAmendment[];
  amount?: string;
}

// ==========================================
// Quotations
// ==========================================

export type QuotationStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface QuotationItem {
  id: string;
  quotationId: string;
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface Quotation {
  id: string;
  organizationId: string;
  quotationNumber: string; // e.g. Q-000142
  customerId: string;
  customerName?: string;
  status: QuotationStatus;
  issueDate?: string | null;
  validUntil: string;
  currencyCode: string;
  subtotal: string;
  grandTotal: string;
  createdAt: string;
  updatedAt: string;
  items?: QuotationItem[];
}

// ==========================================
// Invoices & Billing
// ==========================================

export type InvoiceStatus =
  | 'DRAFT'
  | 'FINALIZED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'VOID';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: string;
  taxAmount: string;
  lineTotal: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string; // e.g. INV-001428
  customerId: string;
  customerName?: string;
  subscriptionId?: string | null;
  subscriptionNumber?: string | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  currencyCode: string;
  subtotal: string;
  taxTotal: string;
  grandTotal: string;
  amountPaid: string;
  amountDue: string;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
}

// ==========================================
// Payments & Refunds
// ==========================================

export type PaymentStatus = 'SETTLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FAILED';
export type PaymentMethod = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'UPI' | 'ACH' | 'MANUAL';

export interface Payment {
  id: string;
  organizationId: string;
  paymentNumber: string; // e.g. PAY-000981
  invoiceId: string;
  invoiceNumber?: string;
  customerId: string;
  customerName?: string;
  amount: string;
  currencyCode: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  status: PaymentStatus;
  referenceNumber?: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  organizationId: string;
  refundNumber: string; // e.g. REF-000034
  paymentId: string;
  paymentNumber?: string;
  invoiceId: string;
  invoiceNumber?: string;
  amount: string;
  currencyCode: string;
  reason: string;
  createdAt: string;
}

// ==========================================
// API & Pagination Primitives
// ==========================================

export interface PageInfo {
  nextCursor: string | null;
  limit: number;
  total?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: PageInfo;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}
