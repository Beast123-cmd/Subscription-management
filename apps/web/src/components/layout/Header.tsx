import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Building,
  LogOut,
  Settings,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrgContext';
import { Dropdown } from '@/components/ui/dropdown';
import { CommandPalette } from '@/components/ui/command';

export interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { user, logout, roleName, setUserRole } = useAuth();
  const { activeOrg, organizations, selectOrganization } = useOrganization();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const navigate = useNavigate();

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={onOpenMobileMenu}
            className="flex lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Organization Selector */}
          <Dropdown
            align="left"
            width="w-64"
            trigger={
              <button
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                aria-label="Select organization"
              >
                <Building className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="max-w-[150px] sm:max-w-[190px] truncate font-semibold">
                  {activeOrg?.name || 'Select Organization'}
                </span>
                <span className="text-[10px] font-normal text-slate-400">
                  {activeOrg?.defaultCurrencyCode}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>
            }
            sections={[
              {
                title: 'Organizations',
                items: organizations.map((org) => ({
                  id: org.id,
                  label: `${org.name} (${org.defaultCurrencyCode})`,
                  checked: org.id === activeOrg?.id,
                  onClick: () => selectOrganization(org.id),
                })),
              },
              {
                items: [
                  {
                    id: 'manage-orgs',
                    label: 'Manage organizations',
                    icon: <Building className="h-3.5 w-3.5" />,
                    onClick: () => navigate('/select-organization'),
                  },
                ],
              },
            ]}
          />
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="flex items-center justify-center flex-1 max-w-md mx-4">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-white hover:text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Search customers, invoices, subscriptions...</span>
              <span className="sm:hidden">Search...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
              ⌘ K
            </kbd>
          </button>
        </div>

        {/* Right: Notifications & User Menu */}
        <div className="flex items-center gap-2">
          {/* Notifications Dropdown */}
          <Dropdown
            align="right"
            width="w-80"
            trigger={
              <button
                className="relative p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                aria-label="Notifications"
                onClick={() => setHasUnreadNotifications(false)}
              >
                <Bell className="h-4 w-4" />
                {hasUnreadNotifications && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
            }
          >
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <h5 className="font-semibold text-xs text-slate-900">Notifications</h5>
              <span className="text-[10px] text-slate-400">Platform Activity</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              <div className="p-3 text-xs hover:bg-slate-50 transition-colors">
                <p className="font-medium text-slate-800">Invoice INV-001429 Overdue</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Payment of ₹53,100.00 from Bharat Fintech is 14 days overdue.
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">1 hour ago</span>
              </div>
              <div className="p-3 text-xs hover:bg-slate-50 transition-colors">
                <p className="font-medium text-slate-800">Subscription SUB-000814 Paused</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Growth Monthly tier paused by billing operations team.
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">3 hours ago</span>
              </div>
            </div>
            <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
              <button
                onClick={() => navigate('/app/audit')}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
              >
                View Audit Trail →
              </button>
            </div>
          </Dropdown>

          {/* User Profile Menu */}
          <Dropdown
            align="right"
            width="w-60"
            trigger={
              <button
                className="flex items-center gap-2 rounded-full p-1 pl-2 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="User profile menu"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                  {user ? user.firstName[0] : 'U'}
                </div>
                <div className="hidden md:flex flex-col text-left mr-1">
                  <span className="text-xs font-medium text-slate-900 leading-tight">
                    {user ? `${user.firstName} ${user.lastName}` : 'Signed In'}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {roleName}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
              </button>
            }
            sections={[
              {
                title: 'Signed in as',
                items: [
                  {
                    id: 'user-info',
                    label: user ? user.email : '',
                    icon: <UserIcon className="h-3.5 w-3.5" />,
                    disabled: true,
                  },
                ],
              },
              {
                title: 'Switch Demo Persona (RBAC)',
                items: [
                  {
                    id: 'role-admin',
                    label: 'Organization Admin (Full)',
                    checked: roleName === 'Organization Admin',
                    icon: <Shield className="h-3.5 w-3.5" />,
                    onClick: () => setUserRole('Organization Admin'),
                  },
                  {
                    id: 'role-billing',
                    label: 'Billing Manager',
                    checked: roleName === 'Billing Manager',
                    icon: <Shield className="h-3.5 w-3.5" />,
                    onClick: () => setUserRole('Billing Manager'),
                  },
                  {
                    id: 'role-readonly',
                    label: 'Read-only User',
                    checked: roleName === 'Read-only User',
                    icon: <Shield className="h-3.5 w-3.5" />,
                    onClick: () => setUserRole('Read-only User'),
                  },
                ],
              },
              {
                items: [
                  {
                    id: 'settings',
                    label: 'Organization Settings',
                    icon: <Settings className="h-3.5 w-3.5" />,
                    onClick: () => navigate('/app/settings'),
                  },
                  {
                    id: 'logout',
                    label: 'Sign out',
                    icon: <LogOut className="h-3.5 w-3.5" />,
                    destructive: true,
                    onClick: () => {
                      logout();
                      navigate('/login');
                    },
                  },
                ],
              },
            ]}
          />
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
