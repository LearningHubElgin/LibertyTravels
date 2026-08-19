import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';

export const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col w-full">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen w-full min-w-0">
        <Navbar onOpenMobile={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-24 lg:pb-8 w-full min-w-0">
          <Outlet />
        </main>

        {/* Mobile Responsive Bottom Navigation Tray */}
        <MobileBottomNav onOpenMenu={() => setIsMobileSidebarOpen(true)} />
      </div>
    </div>
  );
};
