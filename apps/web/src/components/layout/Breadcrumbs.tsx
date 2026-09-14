import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();

  const breadcrumbs: BreadcrumbItem[] = React.useMemo(() => {
    if (items) return items;

    const pathnames = location.pathname.split('/').filter((x) => x && x !== 'app');
    const trail: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/app/dashboard' }];

    let currentPath = '/app';
    pathnames.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

      trail.push({
        label,
        href: currentPath,
      });
    });

    return trail;
  }, [items, location.pathname]);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-slate-500 mb-3', className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />}
              {isLast || !item.href ? (
                <span className="font-semibold text-slate-800">{item.label}</span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-slate-900 transition-colors text-slate-500"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
