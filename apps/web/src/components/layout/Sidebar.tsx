import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  FileCheck,
  Package,
  Layers,
  BarChart3,
  ShieldCheck,
  Building,
  RotateCcw,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { usePermission } from '@/contexts/PermissionContext';
import { PERMISSIONS } from '@/lib/permissions';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/app/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Revenue',
    items: [
      {
        label: 'Customers',
        href: '/app/customers',
        icon: Users,
        permission: PERMISSIONS.CUSTOMER_READ,
      },
      {
        label: 'Quotations',
        href: '/app/quotations',
        icon: FileCheck,
        permission: PERMISSIONS.QUOTATION_READ,
      },
      {
        label: 'Subscriptions',
        href: '/app/subscriptions',
        icon: CreditCard,
        permission: PERMISSIONS.SUBSCRIPTION_READ,
      },
      {
        label: 'Invoices',
        href: '/app/invoices',
        icon: FileText,
        permission: PERMISSIONS.INVOICE_READ,
      },
      {
        label: 'Payments',
        href: '/app/payments',
        icon: Receipt,
        permission: PERMISSIONS.PAYMENT_READ,
      },
      {
        label: 'Refunds',
        href: '/app/refunds',
        icon: RotateCcw,
        permission: PERMISSIONS.PAYMENT_READ,
      },
    ],
  },
  {
    title: 'Catalog',
    items: [
      {
        label: 'Products',
        href: '/app/products',
        icon: Package,
        permission: PERMISSIONS.PRODUCT_READ,
      },
      {
        label: 'Plans & Pricing',
        href: '/app/plans',
        icon: Layers,
        permission: PERMISSIONS.PLAN_READ,
      },
    ],
  },
  {
    title: 'Insights',
    items: [
      {
        label: 'Reports',
        href: '/app/reports',
        icon: BarChart3,
        permission: PERMISSIONS.REPORT_READ,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Users',
        href: '/app/users',
        icon: Users,
        permission: PERMISSIONS.USER_READ,
      },
      {
        label: 'Roles & Permissions',
        href: '/app/roles',
        icon: ShieldCheck,
        permission: PERMISSIONS.ROLE_READ,
      },
      {
        label: 'Organization Settings',
        href: '/app/settings',
        icon: Building,
        permission: PERMISSIONS.ORGANIZATION_READ,
      },
    ],
  },
];

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
  className?: string;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
  className,
}: SidebarProps) {
  const { can } = usePermission();

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-200 bg-white transition-all duration-200 select-none z-30',
        isCollapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-3.5 border-b border-slate-100">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-semibold text-xs shadow-xs">
              RO
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-slate-900 tracking-tight leading-tight">
                RevOps Platform
              </span>
              <span className="text-[10px] text-slate-500 font-medium leading-tight">
                Subscription Cloud
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-semibold text-xs shadow-xs">
            RO
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={cn(
            'hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors',
            isCollapsed && 'hidden'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_SECTIONS.map((section) => {
          // Filter items by permission
          const visibleItems = section.items.filter((item) => {
            if (!item.permission) return true;
            return can(item.permission);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-0.5">
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              )}

              {visibleItems.map((item) => {
                const Icon = item.icon;
                const linkContent = (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors group relative',
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        isCollapsed && 'justify-center px-0'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-700'
                          )}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                        {!isCollapsed && item.badge && (
                          <span className="ml-auto rounded bg-slate-200/70 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.href} content={item.label} side="right">
                      {linkContent}
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </div>
          );
        })}
      </div>

      {/* Collapse Toggle at Bottom (When collapsed) */}
      {isCollapsed && (
        <div className="p-2 border-t border-slate-100 hidden lg:flex justify-center">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
