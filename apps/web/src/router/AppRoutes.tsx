import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrgContext';
import { usePermission } from '@/contexts/PermissionContext';
import { PERMISSIONS } from '@/lib/permissions';
import { AppShell } from '@/components/layout/AppShell';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { SelectOrganizationPage } from '@/pages/auth/SelectOrganizationPage';

// Domain Pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CustomersListPage } from '@/pages/customers/CustomersListPage';
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage';
import { SubscriptionsListPage } from '@/pages/subscriptions/SubscriptionsListPage';
import { SubscriptionDetailPage } from '@/pages/subscriptions/SubscriptionDetailPage';
import { InvoicesListPage } from '@/pages/invoices/InvoicesListPage';
import { InvoiceDetailPage } from '@/pages/invoices/InvoiceDetailPage';
import { ProductsListPage } from '@/pages/products/ProductsListPage';
import { ProductDetailPage } from '@/pages/products/ProductDetailPage';
import { PlansListPage } from '@/pages/plans/PlansListPage';
import { PlanDetailPage } from '@/pages/plans/PlanDetailPage';
import { QuotationsListPage } from '@/pages/quotations/QuotationsListPage';
import { QuotationDetailPage } from '@/pages/quotations/QuotationDetailPage';
import { PaymentsListPage } from '@/pages/payments/PaymentsListPage';
import { PaymentDetailPage } from '@/pages/payments/PaymentDetailPage';
import { RefundsListPage } from '@/pages/refunds/RefundsListPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { RolesPage } from '@/pages/admin/RolesPage';
import { OrganizationSettingsPage } from '@/pages/admin/OrganizationSettingsPage';

// Error Pages
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <span>Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PermissionRoute({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { can } = usePermission();

  if (!can(permission)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}

function OrganizationRoute({ children }: { children: React.ReactNode }) {
  const { activeOrg, isLoadingOrganizations } = useOrganization();
  if (isLoadingOrganizations) return <div className="p-8 text-sm text-slate-500">Loading organization...</div>;
  if (!activeOrg) return <Navigate to="/select-organization" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public / Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/select-organization"
        element={
          <ProtectedRoute>
            <SelectOrganizationPage />
          </ProtectedRoute>
        }
      />

      {/* Protected App Shell */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <OrganizationRoute>
              <AppShell />
            </OrganizationRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Revenue */}
        <Route
          path="customers"
          element={
            <PermissionRoute permission={PERMISSIONS.CUSTOMER_READ}>
              <CustomersListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="customers/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.CUSTOMER_READ}>
              <CustomerDetailPage />
            </PermissionRoute>
          }
        />

        <Route
          path="subscriptions"
          element={
            <PermissionRoute permission={PERMISSIONS.SUBSCRIPTION_READ}>
              <SubscriptionsListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="subscriptions/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.SUBSCRIPTION_READ}>
              <SubscriptionDetailPage />
            </PermissionRoute>
          }
        />

        <Route
          path="invoices"
          element={
            <PermissionRoute permission={PERMISSIONS.INVOICE_READ}>
              <InvoicesListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="invoices/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.INVOICE_READ}>
              <InvoiceDetailPage />
            </PermissionRoute>
          }
        />

        <Route
          path="quotations"
          element={
            <PermissionRoute permission={PERMISSIONS.QUOTATION_READ}>
              <QuotationsListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="quotations/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.QUOTATION_READ}>
              <QuotationDetailPage />
            </PermissionRoute>
          }
        />

        <Route
          path="payments"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYMENT_READ}>
              <PaymentsListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payments/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYMENT_READ}>
              <PaymentDetailPage />
            </PermissionRoute>
          }
        />

        <Route
          path="refunds"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYMENT_READ}>
              <RefundsListPage />
            </PermissionRoute>
          }
        />

        {/* Catalog */}
        <Route
          path="products"
          element={
            <PermissionRoute permission={PERMISSIONS.PRODUCT_READ}>
              <ProductsListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="products/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.PRODUCT_READ}>
              <ProductDetailPage />
            </PermissionRoute>
          }
        />

        <Route
          path="plans"
          element={
            <PermissionRoute permission={PERMISSIONS.PLAN_READ}>
              <PlansListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="plans/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.PLAN_READ}>
              <PlanDetailPage />
            </PermissionRoute>
          }
        />

        {/* Insights */}
        <Route
          path="reports"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORT_READ}>
              <ReportsPage />
            </PermissionRoute>
          }
        />

        {/* Administration */}
        <Route
          path="users"
          element={
            <PermissionRoute permission={PERMISSIONS.USER_READ}>
              <UsersPage />
            </PermissionRoute>
          }
        />
        <Route
          path="roles"
          element={
            <PermissionRoute permission={PERMISSIONS.ROLE_READ}>
              <RolesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="settings"
          element={
            <PermissionRoute permission={PERMISSIONS.ORGANIZATION_READ}>
              <OrganizationSettingsPage />
            </PermissionRoute>
          }
        />

        {/* Catch-all 404 within app */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
