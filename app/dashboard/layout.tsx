'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { FilterSidebar } from '@/components/filters/FilterSidebar';
import { useCallDataStore } from '@/store/callDataStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { files, dataSource } = useCallDataStore();

  // Redirect to home if no data
  useEffect(() => {
    if (files.length === 0 && dataSource === 'none') {
      router.push('/');
    }
  }, [files, dataSource, router]);

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
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
