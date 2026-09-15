import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useOrganization } from '@/contexts/OrgContext';
import { useLocation } from 'react-router-dom';
import { Sheet } from '@/components/ui/sheet';

export function AppShell() {
  const { activeOrg, isSwitchingOrg } = useOrganization();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell flex h-dvh w-full overflow-hidden bg-[var(--workspace-canvas)]">
      <a href="#workspace" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">Skip to content</a>
      {/* Desktop Persistent Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        className="hidden lg:flex"
      />

      {/* Mobile / Tablet Drawer */}
      <Sheet
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        side="left"
        width="w-72"
        title="RevOps Navigation"
      >
        <Sidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          className="border-none w-full"
        />
      </Sheet>

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Dynamic Page Content */}
        <main id="workspace" tabIndex={-1} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div key={`${activeOrg?.id}:${location.pathname}`} className="workspace-page">{!isSwitchingOrg && <Outlet />}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
