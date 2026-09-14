import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-3 text-xs text-slate-500 border-t border-slate-200', className)}>
      <div className="flex items-center gap-2">
        {totalItems !== undefined ? (
          <span>
            Showing <strong className="text-slate-800 font-medium">{startItem}</strong> to{' '}
            <strong className="text-slate-800 font-medium">{endItem}</strong> of{' '}
            <strong className="text-slate-800 font-medium">{totalItems}</strong> records
          </span>
        ) : (
          <span>
            Page <strong className="text-slate-800 font-medium">{currentPage}</strong> of{' '}
            <strong className="text-slate-800 font-medium">{totalPages || 1}</strong>
          </span>
        )}

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-3">
            <span className="text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Rows per page"
              className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
        >
          Previous
        </Button>
        <div className="px-2 text-xs font-medium text-slate-700">
          {currentPage} / {totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
