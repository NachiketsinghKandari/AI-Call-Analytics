'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronsUpDown, BarChart3, GitCompareArrows } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelloCounselLogo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCompareStore } from '@/store/compareStore';
import { CompareFilterSidebar } from '@/components/filters/CompareFilterSidebar';
import { useHydrated } from '@/lib/hooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function CompareDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const { selectedFirmIds, firmData, loadAllSelectedFirms } = useCompareStore();

  // Redirect if no firms selected
  useEffect(() => {
    if (selectedFirmIds.length < 2) {
      router.push('/compare');
    }
  }, [selectedFirmIds, router]);

  // Load firm data if not loaded
  useEffect(() => {
    const needsLoading = selectedFirmIds.some((id) => !firmData[id]?.files?.length);
    if (needsLoading && selectedFirmIds.length >= 2) {
      loadAllSelectedFirms();
    }
  }, [selectedFirmIds, firmData, loadAllSelectedFirms]);

  if (selectedFirmIds.length < 2) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="flex h-14 items-center px-4 gap-4">
          {/* Logo + Mode Switcher - width matches sidebar on lg screens */}
          <div className="flex items-center gap-2 shrink-0 lg:w-[calc(18rem-1rem)]">
            <Link href="/" className="flex items-center shrink-0">
              <HelloCounselLogo className="h-6" />
            </Link>

            {/* Mode Switcher */}
            {hydrated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                    <GitCompareArrows className="h-4 w-4" />
                    <span className="hidden sm:inline">Compare</span>
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => router.push('/analyze')} className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analyze
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 bg-accent">
                    <GitCompareArrows className="h-4 w-4" />
                    Compare
                    <span className="ml-auto text-xs text-muted-foreground">Active</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" disabled>
                <GitCompareArrows className="h-4 w-4" />
                <span className="hidden sm:inline">Compare</span>
                <ChevronsUpDown className="h-3 w-3 opacity-50" />
              </Button>
            )}
          </div>

          <div className="flex-1" />

          <Link href="/compare">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Change Firms
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex">
        {/* Filter Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 border-r bg-muted/30">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <CompareFilterSidebar />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
