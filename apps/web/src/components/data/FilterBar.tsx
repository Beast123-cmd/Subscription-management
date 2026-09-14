import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { SearchInput } from './SearchInput';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  statusOptions?: FilterOption[];
  onReset?: () => void;
  isFiltered?: boolean;
  extraActions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Filter records...',
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  onReset,
  isFiltered,
  extraActions,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />

        {statusOptions && onStatusFilterChange && (
          <div className="flex items-center gap-1">
            <div className="relative flex items-center">
              <Filter className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
              <select
                value={statusFilter || 'ALL'}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="h-8.5 appearance-none rounded-md border border-slate-300 bg-white pl-8 pr-7 text-xs text-slate-700 cursor-pointer focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="ALL">All Statuses</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isFiltered && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            leftIcon={<RotateCcw className="h-3 w-3" />}
            className="text-slate-500 hover:text-slate-900 h-8 text-xs"
          >
            Reset
          </Button>
        )}
      </div>

      {extraActions && <div className="flex items-center gap-2 shrink-0">{extraActions}</div>}
    </div>
  );
}
