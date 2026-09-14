import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  side?: 'left' | 'right';
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export function Sheet({
  isOpen,
  onClose,
  title,
  description,
  side = 'right',
  children,
  footer,
  width = 'max-w-md',
}: SheetProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className={cn('fixed inset-y-0 flex', side === 'right' ? 'right-0' : 'left-0')}>
        <div
          className={cn(
            'relative flex w-screen flex-col border-slate-200 bg-white shadow-2xl transition-all duration-200 ease-in-out',
            side === 'right'
              ? 'border-l animate-in slide-in-from-right'
              : 'border-r animate-in slide-in-from-left',
            width
          )}
        >
          {/* Sheet Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              {title && <h3 className="text-sm font-semibold text-slate-900">{title}</h3>}
              {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Close drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sheet Content */}
          <div className="flex-1 overflow-y-auto p-5">{children}</div>

          {/* Sheet Footer */}
          {footer && <div className="border-t border-slate-100 p-4 bg-slate-50 flex items-center justify-end gap-2">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
