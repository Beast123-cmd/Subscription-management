import type {
  AuthSession,
  Customer,
  Product,
  Plan,
  Subscription,
  Quotation,
  Invoice,
  Payment,
  Refund,
  AuditLog,
  Organization,
  PaginatedResponse,
} from '@/types';
import {
  MOCK_CUSTOMERS,
  MOCK_INVOICES,
  MOCK_ORGANIZATIONS,
  MOCK_PAYMENTS,
  MOCK_PLANS,
  MOCK_PRODUCTS,
  MOCK_REFUNDS,
  MOCK_SUBSCRIPTIONS,
  MOCK_QUOTATIONS,
  MOCK_AUDIT_LOGS,
  MOCK_USERS,
} from './mock-data';

export class ApiError extends Error {
  code: string;
  details?: unknown[];
  status: number;

  constructor(message: string, code = 'INTERNAL_ERROR', status = 500, details?: unknown[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

class ApiClient {
  private baseUrl = '/api';

  private getAuthToken(): string | null {
    return localStorage.getItem('revops_auth_token');
  }

  private getActiveOrgId(): string | null {
    return localStorage.getItem('revops_active_org_id');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    const activeOrgId = this.getActiveOrgId();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(activeOrgId ? { 'X-Organization-Id': activeOrgId } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: { error?: { code?: string; message?: string; details?: unknown[] } } = {};
        try {
          errorData = await response.json();
        } catch {
          // ignore non-json response
        }

        const message =
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        const code = errorData.error?.code || `HTTP_${response.status}`;
        throw new ApiError(message, code, response.status, errorData.error?.details);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      // Re-throw or simulate mock data on network connection failure
      throw err;
    }
  }

  // ==========================================
  // Auth & Organizations
  // ==========================================

  async login(email: string, password: string): Promise<AuthSession> {
    return this.request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser(): Promise<AuthSession['user']> {
    return this.request<AuthSession['user']>('/auth/me');
  }

  async getOrganizations(): Promise<{ data: Organization[] }> {
    return this.request<{ data: Organization[] }>('/organizations');
  }

  async selectOrganization(
    orgId: string,
  ): Promise<{ accessToken: string; activeOrganizationId: string }> {
    return this.request<{ accessToken: string; activeOrganizationId: string }>(
      `/organizations/${orgId}/select`,
      { method: 'POST' },
    );
  }

  // ==========================================
  // Customers
  // ==========================================

  async getCustomers(_params?: {
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<Customer>> {
    try {
      return await this.request<PaginatedResponse<Customer>>('/customers');
    } catch {
      return {
        data: MOCK_CUSTOMERS,
        page: { nextCursor: null, limit: 25, total: MOCK_CUSTOMERS.length },
      };
    }
  }

  async getCustomer(id: string): Promise<Customer> {
    try {
      return await this.request<Customer>(`/customers/${id}`);
    } catch {
      const customer = MOCK_CUSTOMERS.find((c) => c.id === id || c.customerNumber === id);
      if (!customer)
        throw new ApiError('Customer not found in active organization', 'NOT_FOUND', 404);
      return customer;
    }
  }

  // ==========================================
  // Catalog & Plans
  // ==========================================

  async getProducts(): Promise<PaginatedResponse<Product>> {
    try {
      return await this.request<PaginatedResponse<Product>>('/products');
    } catch {
      return {
        data: MOCK_PRODUCTS,
        page: { nextCursor: null, limit: 25, total: MOCK_PRODUCTS.length },
      };
    }
  }

  async getProduct(id: string): Promise<Product> {
    try {
      return await this.request<Product>(`/products/${id}`);
    } catch {
      const p = MOCK_PRODUCTS.find((x) => x.id === id || x.productCode === id);
      if (!p) throw new ApiError('Product not found in active organization', 'NOT_FOUND', 404);
      return p;
    }
  }

  async getPlans(): Promise<PaginatedResponse<Plan>> {
    try {
      return await this.request<PaginatedResponse<Plan>>('/plans');
    } catch {
      return {
        data: MOCK_PLANS,
        page: { nextCursor: null, limit: 25, total: MOCK_PLANS.length },
      };
    }
  }

  async getPlan(id: string): Promise<Plan> {
    try {
      return await this.request<Plan>(`/plans/${id}`);
    } catch {
      const plan = MOCK_PLANS.find((x) => x.id === id || x.planCode === id);
      if (!plan) throw new ApiError('Plan not found in active organization', 'NOT_FOUND', 404);
      return plan;
    }
  }

  // ==========================================
  // Subscriptions & Quotations
  // ==========================================

  async getSubscriptions(): Promise<PaginatedResponse<Subscription>> {
    try {
      return await this.request<PaginatedResponse<Subscription>>('/subscriptions');
    } catch {
      return {
        data: MOCK_SUBSCRIPTIONS,
        page: { nextCursor: null, limit: 25, total: MOCK_SUBSCRIPTIONS.length },
      };
    }
  }

  async getSubscription(id: string): Promise<Subscription> {
    try {
      return await this.request<Subscription>(`/subscriptions/${id}`);
    } catch {
      const s = MOCK_SUBSCRIPTIONS.find((x) => x.id === id || x.subscriptionNumber === id);
      if (!s) throw new ApiError('Subscription not found in active organization', 'NOT_FOUND', 404);
      return s;
    }
  }

  async getQuotations(): Promise<PaginatedResponse<Quotation>> {
    try {
      return await this.request<PaginatedResponse<Quotation>>('/quotations');
    } catch {
      return {
        data: MOCK_QUOTATIONS,
        page: { nextCursor: null, limit: 25, total: MOCK_QUOTATIONS.length },
      };
    }
  }

  async getQuotation(id: string): Promise<Quotation> {
    try {
      return await this.request<Quotation>(`/quotations/${id}`);
    } catch {
      const q = MOCK_QUOTATIONS.find((x) => x.id === id || x.quotationNumber === id);
      if (!q) throw new ApiError('Quotation not found in active organization', 'NOT_FOUND', 404);
      return q;
    }
  }

  // ==========================================
  // Invoices, Payments & Refunds
  // ==========================================

  async getInvoices(): Promise<PaginatedResponse<Invoice>> {
    try {
      return await this.request<PaginatedResponse<Invoice>>('/invoices');
    } catch {
      return {
        data: MOCK_INVOICES,
        page: { nextCursor: null, limit: 25, total: MOCK_INVOICES.length },
      };
    }
  }

  async getInvoice(id: string): Promise<Invoice> {
    try {
      return await this.request<Invoice>(`/invoices/${id}`);
    } catch {
      const inv = MOCK_INVOICES.find((x) => x.id === id || x.invoiceNumber === id);
      if (!inv) throw new ApiError('Invoice not found in active organization', 'NOT_FOUND', 404);
      return inv;
    }
  }

  async getPayments(): Promise<PaginatedResponse<Payment>> {
    try {
      return await this.request<PaginatedResponse<Payment>>('/payments');
    } catch {
      return {
        data: MOCK_PAYMENTS,
        page: { nextCursor: null, limit: 25, total: MOCK_PAYMENTS.length },
      };
    }
  }

  async getPayment(id: string): Promise<Payment> {
    try {
      return await this.request<Payment>(`/payments/${id}`);
    } catch {
      const p = MOCK_PAYMENTS.find((x) => x.id === id || x.paymentNumber === id);
      if (!p) throw new ApiError('Payment not found in active organization', 'NOT_FOUND', 404);
      return p;
    }
  }

  async getRefunds(): Promise<PaginatedResponse<Refund>> {
    try {
      return await this.request<PaginatedResponse<Refund>>('/refunds');
    } catch {
      return {
        data: MOCK_REFUNDS,
        page: { nextCursor: null, limit: 25, total: MOCK_REFUNDS.length },
      };
    }
  }

  // ==========================================
  // Audit Logs
  // ==========================================

  async getAuditLogs(): Promise<PaginatedResponse<AuditLog>> {
    try {
      return await this.request<PaginatedResponse<AuditLog>>('/audit');
    } catch {
      return {
        data: MOCK_AUDIT_LOGS,
        page: { nextCursor: null, limit: 25, total: MOCK_AUDIT_LOGS.length },
      };
    }
  }
}

export const apiClient = new ApiClient();
