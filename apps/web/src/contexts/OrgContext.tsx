import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Organization } from '@/types';
import { apiClient } from '@/lib/api-client';
import { MOCK_ORGANIZATIONS } from '@/lib/mock-data';
import { useToast } from './ToastContext';

interface OrgContextValue {
  activeOrg: Organization | null;
  organizations: Organization[];
  isSwitchingOrg: boolean;
  selectOrganization: (orgId: string) => Promise<void>;
  reloadOrganizations: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>(MOCK_ORGANIZATIONS);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [isSwitchingOrg, setIsSwitchingOrg] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const loadOrgs = useCallback(async () => {
    try {
      const resp = await apiClient.getOrganizations();
      setOrganizations(resp.data);
      const storedOrgId = localStorage.getItem('revops_active_org_id');
      const matched = resp.data.find((o) => o.id === storedOrgId) || resp.data[0];
      if (matched) {
        setActiveOrg(matched);
        localStorage.setItem('revops_active_org_id', matched.id);
      }
    } catch {
      // Fallback to mock
      setOrganizations(MOCK_ORGANIZATIONS);
      const matched = MOCK_ORGANIZATIONS[0]!;
      setActiveOrg(matched);
      localStorage.setItem('revops_active_org_id', matched.id);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  const selectOrganization = useCallback(
    async (orgId: string) => {
      const target = organizations.find((o) => o.id === orgId);
      if (!target) return;

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
          'Organization Changed'
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to switch organization.';
        toast.error(msg, 'Tenant Switch Error');
      } finally {
        setTimeout(() => {
          setIsSwitchingOrg(false);
        }, 300);
      }
    },
    [organizations, queryClient, toast]
  );

  return (
    <OrgContext.Provider
      value={{
        activeOrg,
        organizations,
        isSwitchingOrg,
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
