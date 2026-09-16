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

  getAccess(): Promise<{ roles: string[]; permissions: string[] }> { return this.request('/organizations/access'); }
  command(path: string, body?: unknown): Promise<unknown> { return this.request(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }); }
  getRules(kind: 'taxes' | 'discounts'): Promise<{ data: Array<{ id: string; name: string; rate: string; status: string }> }> { return this.request(`/${kind}`); }
  createRule(kind: 'taxes' | 'discounts', input: { name: string; rate: string }): Promise<unknown> { return this.request(`/${kind}`, { method: 'POST', body: JSON.stringify(input) }); }
  archiveRule(kind: 'taxes' | 'discounts', id: string): Promise<unknown> { return this.command(`/${kind}/${id}/archive`); }

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
  assignMemberRoles(membershipId: string, roleIds: string[]): Promise<unknown> { return this.command(`/organizations/members/${membershipId}/roles`, { roleIds }); }

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

  async createCustomer(input: { customerType: 'BUSINESS' | 'INDIVIDUAL'; legalName: string; displayName: string; email?: string; defaultCurrencyCode: string }): Promise<Customer> {
    return this.request<Customer>('/customers', { method: 'POST', body: JSON.stringify(input) });
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }
  getCustomerContacts(id: string): Promise<{ data: Customer['contacts'] extends infer T ? NonNullable<T> : never }> { return this.request(`/customers/${id}/contacts`); }
  createCustomerContact(id: string, input: { firstName: string; lastName: string; email?: string; phone?: string; jobTitle?: string; isPrimary?: boolean }): Promise<unknown> { return this.request(`/customers/${id}/contacts`, { method: 'POST', body: JSON.stringify(input) }); }
  getCustomerAddresses(id: string): Promise<{ data: Customer['addresses'] extends infer T ? NonNullable<T> : never }> { return this.request(`/customers/${id}/addresses`); }
  createCustomerAddress(id: string, input: { addressType: 'BILLING' | 'SHIPPING' | 'OTHER'; addressLine1: string; city: string; countryCode: string; postalCode?: string; state?: string; isDefault?: boolean }): Promise<unknown> { return this.request(`/customers/${id}/addresses`, { method: 'POST', body: JSON.stringify(input) }); }

  // ==========================================
  // Catalog & Plans
  // ==========================================

  async getProducts(): Promise<PaginatedResponse<Product>> {
    return this.request<PaginatedResponse<Product>>('/products');
  }
  async createProduct(input: { productCode: string; name: string; productType: 'GOODS' | 'SERVICE'; costPrice: string; costCurrencyCode: string }): Promise<Product> { return this.request<Product>('/products', { method: 'POST', body: JSON.stringify(input) }); }

  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async getPlans(): Promise<PaginatedResponse<Plan>> {
    return this.request<PaginatedResponse<Plan>>('/plans');
  }
  async createPlan(input: { planCode: string; name: string }): Promise<Plan> { return this.request<Plan>('/plans', { method: 'POST', body: JSON.stringify(input) }); }

  async getPlan(id: string): Promise<Plan> {
    return this.request<Plan>(`/plans/${id}`);
  }
  getPlanItems(id: string): Promise<{ data: Plan['items'] extends infer T ? NonNullable<T> : never }> { return this.request(`/plans/${id}/items`); }
  addPlanItem(id: string, input: { productId: string; quantity: number }): Promise<unknown> { return this.request(`/plans/${id}/items`, { method: 'POST', body: JSON.stringify(input) }); }
  getPlanPrices(id: string): Promise<{ data: Plan['prices'] extends infer T ? NonNullable<T> : never }> { return this.request(`/plans/${id}/prices`); }
  addPlanPrice(id: string, input: { currencyCode: string; billingPeriod: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'; amount: string; effectiveFrom: string }): Promise<unknown> { return this.request(`/plans/${id}/prices`, { method: 'POST', body: JSON.stringify(input) }); }

  // ==========================================
  // Subscriptions & Quotations
  // ==========================================

  async getSubscriptions(): Promise<PaginatedResponse<Subscription>> {
    return this.request<PaginatedResponse<Subscription>>('/subscriptions');
  }
  async createSubscription(input: { customerId: string; planId: string; currencyCode: string; billingPeriod: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'; startDate: string; billingStartDate: string }): Promise<Subscription> { return this.request<Subscription>('/subscriptions', { method: 'POST', body: JSON.stringify(input) }); }

  async getSubscription(id: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${id}`);
  }

  async getQuotations(): Promise<PaginatedResponse<Quotation>> {
    return this.request<PaginatedResponse<Quotation>>('/quotations');
  }
  async createQuotation(input: { customerId: string; currencyCode: string; validUntil: string; items: Array<{ description: string; quantity: number; unitPrice: string }> }): Promise<Quotation> { return this.request<Quotation>('/quotations', { method: 'POST', body: JSON.stringify(input) }); }

  async getQuotation(id: string): Promise<Quotation> {
    return this.request<Quotation>(`/quotations/${id}`);
  }
  convertQuotation(id: string, input: { planId: string; startDate: string; billingStartDate: string; autoRenew?: boolean }): Promise<{ id: string; subscriptionNumber: string }> { return this.request(`/quotations/${id}/convert`, { method: 'POST', body: JSON.stringify(input) }); }

  // ==========================================
  // Invoices, Payments & Refunds
  // ==========================================

  async getInvoices(): Promise<PaginatedResponse<Invoice>> {
    return this.request<PaginatedResponse<Invoice>>('/invoices');
  }
  async createInvoice(input: { customerId: string; currencyCode: string; issueDate: string; dueDate: string }): Promise<Invoice> { return this.request<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(input) }); }

  async getInvoiceSummary(): Promise<{
    year: number;
    totals: Array<{ currencyCode: string; amount: string }>;
  }> {
    return this.request('/invoices/summary');
  }

  async getInvoice(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}`);
  }

  finalizeInvoice(id: string): Promise<unknown> { return this.command(`/invoices/${id}/finalize`); }
  voidInvoice(id: string): Promise<unknown> { return this.command(`/invoices/${id}/void`); }

  async addInvoiceLine(id: string, input: { description: string; quantity: number; unitPrice: string; discountId?: string; taxId?: string }): Promise<unknown> {
    return this.request(`/invoices/${id}/items`, { method: 'POST', body: JSON.stringify(input) });
  }

  async getPayments(): Promise<PaginatedResponse<Payment>> {
    return this.request<PaginatedResponse<Payment>>('/payments');
  }

  async createPayment(input: { invoiceId: string; amount: string; method: string; reference?: string }): Promise<Payment> {
    return this.request<Payment>('/payments', { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(input) });
  }

  async getPayment(id: string): Promise<Payment> {
    return this.request<Payment>(`/payments/${id}`);
  }

  async getRefunds(): Promise<PaginatedResponse<Refund>> {
    return this.request<PaginatedResponse<Refund>>('/payments/refunds');
  }
  async createRefund(input: { paymentId: string; amount: string; reason: string }): Promise<Refund> { return this.request<Refund>('/payments/refunds', { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(input) }); }

}

export const apiClient = new ApiClient();
