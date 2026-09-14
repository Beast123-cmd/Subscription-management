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
  OrganizationMember,
  Role,
  PaginatedResponse,
} from '@/types';

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

  async getOrganizationMembers(): Promise<{ data: OrganizationMember[] }> {
    return this.request<{ data: OrganizationMember[] }>('/organizations/members');
  }

  async getOrganizationRoles(): Promise<{ data: Role[] }> {
    return this.request<{ data: Role[] }>('/organizations/roles');
  }

  // ==========================================
  // Customers
  // ==========================================

  async getCustomers(params?: {
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<Customer>> {
    void params;
    return this.request<PaginatedResponse<Customer>>('/customers');
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }

  // ==========================================
  // Catalog & Plans
  // ==========================================

  async getProducts(): Promise<PaginatedResponse<Product>> {
    return this.request<PaginatedResponse<Product>>('/products');
  }

  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async getPlans(): Promise<PaginatedResponse<Plan>> {
    return this.request<PaginatedResponse<Plan>>('/plans');
  }

  async getPlan(id: string): Promise<Plan> {
    return this.request<Plan>(`/plans/${id}`);
  }

  // ==========================================
  // Subscriptions & Quotations
  // ==========================================

  async getSubscriptions(): Promise<PaginatedResponse<Subscription>> {
    return this.request<PaginatedResponse<Subscription>>('/subscriptions');
  }

  async getSubscription(id: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${id}`);
  }

  async getQuotations(): Promise<PaginatedResponse<Quotation>> {
    return this.request<PaginatedResponse<Quotation>>('/quotations');
  }

  async getQuotation(id: string): Promise<Quotation> {
    return this.request<Quotation>(`/quotations/${id}`);
  }

  // ==========================================
  // Invoices, Payments & Refunds
  // ==========================================

  async getInvoices(): Promise<PaginatedResponse<Invoice>> {
    return this.request<PaginatedResponse<Invoice>>('/invoices');
  }

  async getInvoiceSummary(): Promise<{
    year: number;
    totals: Array<{ currencyCode: string; amount: string }>;
  }> {
    return this.request('/invoices/summary');
  }

  async getInvoice(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}`);
  }

  async getPayments(): Promise<PaginatedResponse<Payment>> {
    return this.request<PaginatedResponse<Payment>>('/payments');
  }

  async getPayment(id: string): Promise<Payment> {
    return this.request<Payment>(`/payments/${id}`);
  }

  async getRefunds(): Promise<PaginatedResponse<Refund>> {
    throw new ApiError('Refunds are not implemented yet.', 'NOT_IMPLEMENTED', 501);
  }

  // ==========================================
  // Audit Logs
  // ==========================================

  async getAuditLogs(): Promise<PaginatedResponse<AuditLog>> {
    throw new ApiError('Audit logs are not implemented yet.', 'NOT_IMPLEMENTED', 501);
  }
}

export const apiClient = new ApiClient();
