'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { FilterSidebar } from '@/components/filters/FilterSidebar';
import { MobileFilterSheet } from '@/components/filters/MobileFilterSheet';
import { useCallDataStore } from '@/store/callDataStore';

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { files, dataSource } = useCallDataStore();

  // Check if we're on the data selection page or a dashboard sub-route
  const isDataSelectionPage = pathname === '/analyze';
  const isDashboardRoute = !isDataSelectionPage;

  // Redirect to data selection if no data and trying to access dashboard routes
  useEffect(() => {
    if (isDashboardRoute && files.length === 0 && dataSource === 'none') {
      router.push('/analyze');
    }
  }, [files, dataSource, router, isDashboardRoute]);

  // Data selection page - render without navbar/sidebar (it has its own header)
  if (isDataSelectionPage) {
    return <>{children}</>;
  }

  // Dashboard routes - render with navbar and sidebar
  return (
    <div className="flex flex-col h-screen">
      {/* Top Navbar */}
      <Navbar />

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Filters */}
        <aside className="hidden lg:flex w-72 flex-col border-r bg-muted/30">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm">Filters</h3>
          </div>
          <FilterSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Filter FAB */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <MobileFilterSheet />
      </div>
    </div>
  );
}
