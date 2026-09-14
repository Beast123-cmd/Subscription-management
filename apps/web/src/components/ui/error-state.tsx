import React from 'react';
import { AlertOctagon, ShieldAlert, FileQuestion, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  statusCode?: 400 | 401 | 403 | 404 | 409 | 422 | 500 | number;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
}

export function ErrorState({
  statusCode = 500,
  title,
  message,
  onRetry,
  onBack,
  className,
}: ErrorStateProps) {
  let defaultTitle = 'An unexpected error occurred';
  let defaultMessage = 'We could not complete your request. Please try again or contact support.';
  let Icon = AlertOctagon;
  let iconColor = 'text-rose-600 bg-rose-50';

  if (statusCode === 403) {
    defaultTitle = 'Access Denied';
    defaultMessage = "You don't have permission to view or manage this resource within the active organization.";
    Icon = ShieldAlert;
    iconColor = 'text-amber-600 bg-amber-50';
  } else if (statusCode === 404) {
    defaultTitle = 'Resource Not Found';
    defaultMessage = 'The requested record does not exist in the active organization or may have been archived.';
    Icon = FileQuestion;
    iconColor = 'text-slate-600 bg-slate-100';
  } else if (statusCode === 409) {
    defaultTitle = 'Concurrency Conflict';
    defaultMessage = 'This record was modified by another transaction or an identical request was already processed.';
    Icon = AlertOctagon;
    iconColor = 'text-amber-600 bg-amber-50';
  } else if (statusCode === 422) {
    defaultTitle = 'Domain Rule Violation';
    defaultMessage = 'The requested transition cannot be performed from the current financial or lifecycle state.';
    Icon = AlertOctagon;
    iconColor = 'text-rose-600 bg-rose-50';
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-xl border border-slate-200 bg-white',
        className
      )}
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-full mb-3', iconColor)}>
        <Icon className="h-6 w-6" />
      </div>

      <h4 className="text-base font-semibold text-slate-900">{title || defaultTitle}</h4>
      <p className="mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
        {message || defaultMessage}
      </p>

      <div className="mt-5 flex items-center gap-2">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
            Go Back
          </Button>
        )}
        {onRetry && (
          <Button variant="primary" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
