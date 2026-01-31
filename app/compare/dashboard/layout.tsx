'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronsUpDown, BarChart3, GitCompareArrows, Filter, X, CheckCircle2, Users, Target, ArrowRightLeft, Clock, Layers } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function CompareDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const { selectedFirmIds, firmData, filterSidebarOpen, setFilterSidebarOpen } = useCompareStore();

  // Redirect if no firms selected OR if page was reloaded (firmData empty but selectedFirmIds exist)
  useEffect(() => {
    if (selectedFirmIds.length < 2) {
      router.push('/compare');
      return;
    }

    // Detect page reload: selectedFirmIds exist in localStorage but firmData is empty
    // This happens because firmData is not persisted, only selectedFirmIds is
    const hasNoLoadedData = selectedFirmIds.every((id) => !firmData[id]?.files?.length);
    const noDataLoading = selectedFirmIds.every((id) => !firmData[id]?.loading);

    if (hasNoLoadedData && noDataLoading) {
      // This is a page reload - redirect to /compare to re-select firms
      router.push('/compare');
    }
  }, [selectedFirmIds, firmData, router]);

  if (selectedFirmIds.length < 2) {
    return null;
  }

  // Also redirect during render if we detect reload state
  const hasNoLoadedData = selectedFirmIds.every((id) => !firmData[id]?.files?.length);
  if (hasNoLoadedData) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="shrink-0 z-50 w-full border-b bg-background">
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

      <div className="flex flex-1 overflow-hidden">
        {/* Collapsed sidebar with filter icons (always visible on lg screens) */}
        <aside className="hidden lg:flex w-10 shrink-0 border-r bg-muted/30 flex-col items-center pt-4 gap-1">
          <TooltipProvider>
            {/* Main filter toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setFilterSidebarOpen(!filterSidebarOpen)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {filterSidebarOpen ? 'Close filter panel' : 'Open filter panel'}
              </TooltipContent>
            </Tooltip>

            {/* Divider */}
            <div className="w-5 h-px bg-border my-2" />

            {/* Filter category icons */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setFilterSidebarOpen(true)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Resolution Status</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setFilterSidebarOpen(true)}
                >
                  <Layers className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Resolution Types</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setFilterSidebarOpen(true)}
                >
                  <Users className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Caller Types</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setFilterSidebarOpen(true)}
                >
                  <Target className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Primary Intents</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setFilterSidebarOpen(true)}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Transfer Status</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setFilterSidebarOpen(true)}
                >
                  <Clock className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Call Duration</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </aside>

        {/* Expandable Filter Sidebar */}
        <aside
          className={`hidden lg:flex shrink-0 border-r bg-muted/30 transition-all duration-300 ease-in-out overflow-hidden flex-col ${
            filterSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 border-r-0'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b shrink-0 w-72">
            <span className="text-sm font-medium">Filters</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setFilterSidebarOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto w-72">
            <CompareFilterSidebar />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
