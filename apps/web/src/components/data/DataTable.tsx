import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Dropdown, type DropdownItem } from '@/components/ui/dropdown';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  actions?: (row: T) => DropdownItem[];
  onRowClick?: (row: T) => void;
  pageSize?: number;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records matching your active filters.',
  emptyAction,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  actions,
  onRowClick,
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.id === sortKey);
    if (!col || !col.accessorKey) return data;

    const key = col.accessorKey;
    return [...data].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [data, sortKey, sortOrder, columns]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSort = (columnId: string) => {
    if (sortKey === columnId) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(columnId);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(paginatedData.map(keyExtractor));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    }
  };

  const allSelected =
    paginatedData.length > 0 && paginatedData.every((row) => selectedIds.includes(keyExtractor(row)));

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState message={errorMessage} onRetry={onRetry} />
      </div>
    );
  }

  const totalCols = columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0);

  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden', className)}>
      {/* Row Selection Banner */}
      {selectable && selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-xs text-white">
          <span className="font-medium">
            {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => onSelectionChange?.([])}
            className="text-slate-300 hover:text-white underline cursor-pointer"
          >
            Clear selection
          </button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10 px-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all rows"
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer h-3.5 w-3.5"
                />
              </TableHead>
            )}

            {columns.map((col) => {
              const isSorted = sortKey === col.id;
              return (
                <TableHead
                  key={col.id}
                  align={col.align}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.id)}
                      className={cn(
                        'flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer',
                        col.align === 'right' && 'ml-auto'
                      )}
                    >
                      <span>{col.header}</span>
                      {isSorted ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5 text-slate-900 shrink-0" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-slate-900 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-60 hover:opacity-100 shrink-0" />
                      )}
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </TableHead>
              );
            })}

            {actions && <TableHead align="right" className="w-12 px-3">Actions</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} columns={totalCols} />
            ))
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={totalCols} className="p-8 text-center">
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  action={emptyAction}
                />
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row) => {
              const rowId = keyExtractor(row);
              const isSelected = selectedIds.includes(rowId);

              return (
                <TableRow
                  key={rowId}
                  data-state={isSelected ? 'selected' : undefined}
                  onClick={() => onRowClick?.(row)}
                  className={cn(onRowClick && 'cursor-pointer hover:bg-slate-50/80')}
                >
                  {selectable && (
                    <TableCell className="w-10 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(rowId, e.target.checked, e as unknown as React.MouseEvent)}
                        aria-label={`Select row ${rowId}`}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer h-3.5 w-3.5"
                      />
                    </TableCell>
                  )}

                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '—')
                        : '—'}
                    </TableCell>
                  ))}

                  {actions && (
                    <TableCell align="right" className="w-12 px-3" onClick={(e) => e.stopPropagation()}>
                      <Dropdown
                        align="right"
                        trigger={
                          <button
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            aria-label="Row actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        }
                        sections={[{ items: actions(row) }]}
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {!isLoading && sortedData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedData.length}
          pageSize={rowsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setRowsPerPage(size);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
