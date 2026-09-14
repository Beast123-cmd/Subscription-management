import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/data/FilterBar';
import { DataTable, type ColumnDef } from '@/components/data/DataTable';
import { DateDisplay } from '@/components/data/DateDisplay';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';
import type { AuditLog } from '@/types';

export function AuditLogPage() {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['audit', activeOrg?.id, search],
    queryFn: () => apiClient.getAuditLogs(),
  });

  const rawLogs = data?.data || [];
  const filteredLogs = rawLogs.filter(
    (l) =>
      !search ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorName.toLowerCase().includes(search.toLowerCase()) ||
      l.resourceId.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<AuditLog>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      accessorKey: 'timestamp',
      sortable: true,
      cell: (row) => <DateDisplay date={row.timestamp} mode="datetime" includeTimezone />,
    },
    {
      id: 'actorName',
      header: 'Actor',
      accessorKey: 'actorName',
      cell: (row) => (
        <span className="font-medium text-slate-900 text-xs">{row.actorName}</span>
      ),
    },
    {
      id: 'action',
      header: 'Action Code',
      accessorKey: 'action',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
          {row.action}
        </span>
      ),
    },
    {
      id: 'resource',
      header: 'Target Entity',
      accessorKey: 'resource',
      cell: (row) => (
        <div>
          <span className="font-medium text-slate-800">{row.resource}</span>
          <span className="text-[11px] text-slate-400 block font-mono">{row.resourceId}</span>
        </div>
      ),
    },
    {
      id: 'details',
      header: 'Details',
      accessorKey: 'details',
      cell: (row) => <span className="text-xs text-slate-600 max-w-md block truncate">{row.details}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Immutable record of security, commercial, and financial modifications executed in this tenant."
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter audit events by actor, action or resource..."
        isFiltered={Boolean(search)}
        onReset={() => setSearch('')}
      />

      <DataTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        emptyTitle="No audit logs"
        emptyDescription="System audit entries will record here automatically."
      />
    </div>
  );
}
