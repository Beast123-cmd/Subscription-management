import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowRight, Check } from 'lucide-react';
import { useOrganization } from '@/contexts/OrgContext';

export function SelectOrganizationPage() {
  const { organizations, activeOrg, selectOrganization } = useOrganization();
  const navigate = useNavigate();

  const handleSelect = async (orgId: string) => {
    await selectOrganization(orgId);
    navigate('/app/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold text-sm shadow-md">
          RO
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Select organization
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose the active organization context where you want to work.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs divide-y divide-slate-100">
          {organizations.map((org) => {
            const isActive = org.id === activeOrg?.id;
            return (
              <div
                key={org.id}
                onClick={() => handleSelect(org.id)}
                className="group flex items-center justify-between py-3.5 px-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Building className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 truncate">
                        {org.name}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          <Check className="h-3 w-3 text-emerald-600" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {org.defaultCurrencyCode} · {org.timezone}
                    </p>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
