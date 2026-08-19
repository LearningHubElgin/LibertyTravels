import React, { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const ModuleLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[45vh] w-full animate-fadeIn">
    <LoadingSpinner size="md" text="Loading module..." />
  </div>
);

export const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col w-full">
      {/* Sidebar Navigation - Permanently mounted, never blinks */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen w-full min-w-0">
        {/* Navbar - Permanently mounted, never blinks */}
        <Navbar onOpenMobile={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-24 lg:pb-8 w-full min-w-0">
          {/* Inner Content Suspense - Only the inner route content updates */}
          <Suspense fallback={<ModuleLoader />}>
            <Outlet />
          </Suspense>
        </main>

        {/* Mobile Responsive Bottom Navigation Tray */}
        <MobileBottomNav onOpenMenu={() => setIsMobileSidebarOpen(true)} />
      </div>
    </div>
  );
};
