import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { type NavItem } from './Sidebar';
import Header from './Header';
import type { UserRole } from '../../types/database';

interface DashboardLayoutProps {
  navItems: NavItem[];
  role: UserRole;
}

export default function DashboardLayout({ navItems, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        items={navItems}
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
