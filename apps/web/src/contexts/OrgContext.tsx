import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Organization } from '@/types';
import { apiClient } from '@/lib/api-client';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

interface OrgContextValue {
  activeOrg: Organization | null;
  organizations: Organization[];
  isSwitchingOrg: boolean;
  isLoadingOrganizations: boolean;
  organizationError: string | null;
  selectOrganization: (orgId: string) => Promise<void>;
  reloadOrganizations: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [isSwitchingOrg, setIsSwitchingOrg] = useState<boolean>(false);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState<boolean>(
    () => Boolean(localStorage.getItem('revops_auth_token')),
  );
  const [organizationError, setOrganizationError] = useState<string | null>(null);
  const { token, isLoading: isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const loadOrgs = useCallback(async () => {
    if (!token) return;
    setIsLoadingOrganizations(true);
    setOrganizationError(null);
    try {
      const resp = await apiClient.getOrganizations();
      setOrganizations(resp.data);
      const storedOrgId = localStorage.getItem('revops_active_org_id');
      setActiveOrg(resp.data.find((o) => o.id === storedOrgId) ?? null);
    } catch (error) {
      setOrganizations([]);
      setActiveOrg(null);
      setOrganizationError(error instanceof Error ? error.message : 'Unable to load organizations.');
    } finally {
      setIsLoadingOrganizations(false);
    }
  }, [token]);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (token) {
      void loadOrgs();
    } else {
      setOrganizations([]);
      setActiveOrg(null);
      setOrganizationError(null);
      setIsLoadingOrganizations(false);
    }
  }, [isLoadingAuth, token, loadOrgs]);

  const selectOrganization = useCallback(
    async (orgId: string) => {
      const target = organizations.find((o) => o.id === orgId);
      if (!target) throw new Error('Organization not found.');

      setIsSwitchingOrg(true);
      try {
        const resp = await apiClient.selectOrganization(orgId);
        if (resp.accessToken) {
          localStorage.setItem('revops_auth_token', resp.accessToken);
        }
        localStorage.setItem('revops_active_org_id', orgId);
        setActiveOrg(target);

        // Invalidate all server queries on tenant change
        await queryClient.invalidateQueries();

        toast.info(
          `Switched active tenant to ${target.name} (${target.defaultCurrencyCode} · ${target.timezone})`,
          'Organization Changed',
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to switch organization.';
        toast.error(msg, 'Tenant Switch Error');
        throw err;
      } finally {
        setTimeout(() => {
          setIsSwitchingOrg(false);
        }, 300);
      }
    },
    [organizations, queryClient, toast],
  );

  return (
    <OrgContext.Provider
      value={{
        activeOrg,
        organizations,
        isSwitchingOrg,
        isLoadingOrganizations,
        organizationError,
        selectOrganization,
        reloadOrganizations: loadOrgs,
      }}
    >
      {children}
      {/* Context switching overlay indicator */}
      {isSwitchingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px] transition-all">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-xl">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
            <span className="text-sm font-medium text-slate-800">
              Switching organization context...
            </span>
          </div>
        </div>
      )}
    </OrgContext.Provider>
  );
}

export function useOrganization(): OrgContextValue {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrgProvider');
  }
  return context;
}
