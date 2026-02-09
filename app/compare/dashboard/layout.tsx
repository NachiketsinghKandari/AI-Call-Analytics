'use client';

import { useEffect, Suspense, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronsUpDown, BarChart3, GitCompareArrows, Filter, X, CheckCircle2, Users, Target, ArrowRightLeft, Clock, Layers, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelloCounselLogo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCompareStore, FIRM_CONFIGS } from '@/store/compareStore';
import { CompareFilterSidebar } from '@/components/filters/CompareFilterSidebar';
import { useHydrated } from '@/lib/hooks';
import { parseUrlState } from '@/lib/urlState';
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

function CompareDashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedFirmIds, firmData, filterSidebarOpen, setFilterSidebarOpen, setSelectedFirmIds, loadFirmData, hydrateFromUrl } = useCompareStore();

  // Track loading state for shared URLs
  const [isLoadingSharedUrl, setIsLoadingSharedUrl] = useState(false);
  const [loadingFirmNames, setLoadingFirmNames] = useState<string[]>([]);
  const hasAttemptedLoad = useRef(false);
  const hasAppliedFilters = useRef(false);

  // Parse URL state
  const urlState = parseUrlState(searchParams);

  // Check if URL has share state params (indicates a shared link)
  const hasUrlState = searchParams.has('s') || searchParams.has('c') || searchParams.has('f');

  // Load data from shared URL with firm IDs
  const loadDataFromUrl = useCallback(async (firmIds: string[]) => {
    // Get firm names for loading message
    const firmNames = firmIds
      .map(id => FIRM_CONFIGS.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];

    setIsLoadingSharedUrl(true);
    setLoadingFirmNames(firmNames);

    // Select the firms first
    setSelectedFirmIds(firmIds);

    // Load data for each firm
    try {
      await Promise.all(firmIds.map(id => loadFirmData(id)));
    } catch (err) {
      console.error('Failed to load data from shared URL:', err);
      router.push('/compare');
    } finally {
      setIsLoadingSharedUrl(false);
    }
  }, [setSelectedFirmIds, loadFirmData, router]);

  // Effect: Load data from URL if needed (shared URL with firm IDs)
  useEffect(() => {
    // Skip if no firm IDs in URL
    if (!urlState.firmIds || urlState.firmIds.length < 2) return;

    // Skip if already attempted
    if (hasAttemptedLoad.current) return;

    // Skip if data is already loaded for all firms
    const allFirmsLoaded = urlState.firmIds.every(id => firmData[id]?.files?.length > 0);
    if (allFirmsLoaded) return;

    hasAttemptedLoad.current = true;
    loadDataFromUrl(urlState.firmIds);
  }, [urlState.firmIds, firmData, loadDataFromUrl]);

  // Effect: Apply filters once data is loaded
  useEffect(() => {
    // Get all selected firm IDs (from URL or store)
    const currentFirmIds = urlState.firmIds || selectedFirmIds;

    if (
      currentFirmIds.length === 0 ||
      !urlState.filters ||
      Object.keys(urlState.filters).length === 0 ||
      hasAppliedFilters.current
    ) {
      return;
    }

    // Check if all firms have data loaded
    const allFirmsLoaded = currentFirmIds.every(id => firmData[id]?.files?.length > 0);
    if (!allFirmsLoaded) return;

    hydrateFromUrl(urlState.filters, urlState.firmIds);
    hasAppliedFilters.current = true;
  }, [selectedFirmIds, urlState.firmIds, urlState.filters, firmData, hydrateFromUrl]);

  // Redirect if no firms selected OR if page was reloaded (firmData empty but selectedFirmIds exist)
  // BUT don't redirect if URL has state params (shared link)
  useEffect(() => {
    if (hasUrlState) return; // Don't redirect if URL has state params

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
  }, [selectedFirmIds, firmData, router, hasUrlState]);

  // Show loading state when loading from a shared URL
  if (isLoadingSharedUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <div className="text-center">
          <p className="text-lg font-medium">Loading shared link...</p>
          <p className="text-sm text-muted-foreground">
            Loading {loadingFirmNames.join(' & ')} data
          </p>
        </div>
      </div>
    );
  }

  if (selectedFirmIds.length < 2 && !hasUrlState) {
    return null;
  }

  // Also redirect during render if we detect reload state (but not for shared links)
  const hasNoLoadedData = selectedFirmIds.every((id) => !firmData[id]?.files?.length);
  if (hasNoLoadedData && !hasUrlState) {
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
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-red-500 hover:text-red-600"
            onClick={async () => {
              await fetch('/api/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
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

export default function CompareDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <CompareDashboardLayoutContent>{children}</CompareDashboardLayoutContent>
    </Suspense>
  );
}
