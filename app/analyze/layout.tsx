'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense, useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { FilterSidebar } from '@/components/filters/FilterSidebar';
import { MobileFilterSheet } from '@/components/filters/MobileFilterSheet';
import { useCallDataStore } from '@/store/callDataStore';
import { parseUrlState, type UrlDataSource } from '@/lib/urlState';

const DATA_SOURCE_ENDPOINTS: Record<UrlDataSource, string> = {
  sample: '/api/sample-data',
  mccraw: '/api/mccraw-data',
  vapi: '/api/vapi-data',
};

const DATA_SOURCE_NAMES: Record<UrlDataSource, string> = {
  sample: 'Bey & Associates',
  mccraw: 'McCraw Law',
  vapi: 'VAPI',
};

function AnalyzeLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { files, dataSource, setFiles, setDataSource, setLoading, hydrateFromUrl } = useCallDataStore();

  // Track loading state for shared URLs
  const [isLoadingSharedUrl, setIsLoadingSharedUrl] = useState(false);
  const [loadingDataSourceName, setLoadingDataSourceName] = useState<string>('');
  const hasAttemptedLoad = useRef(false);
  const hasAppliedFilters = useRef(false);

  // Check if we're on the data selection page or a dashboard sub-route
  const isDataSelectionPage = pathname === '/analyze';
  const isDashboardRoute = !isDataSelectionPage;

  // Parse URL state
  const urlState = parseUrlState(searchParams);

  // Check if URL has share state params (indicates a shared link)
  const hasUrlState = searchParams.has('s') || searchParams.has('c') || searchParams.has('d');

  // Load data from shared URL
  const loadDataFromUrl = useCallback(async (source: UrlDataSource) => {
    setIsLoadingSharedUrl(true);
    setLoadingDataSourceName(DATA_SOURCE_NAMES[source]);
    setLoading(true);

    try {
      const response = await fetch(DATA_SOURCE_ENDPOINTS[source]);
      if (!response.ok) {
        throw new Error(`Failed to load ${source} data`);
      }
      const data = await response.json();
      setFiles(data.files);
      setDataSource(source);
    } catch (err) {
      console.error('Failed to load data from shared URL:', err);
      // On error, redirect to data selection
      router.push('/analyze');
    } finally {
      setLoading(false);
      setIsLoadingSharedUrl(false);
    }
  }, [setFiles, setDataSource, setLoading, router]);

  // Effect: Load data from URL if needed (shared URL)
  useEffect(() => {
    // Skip if on data selection page
    if (isDataSelectionPage) return;

    // Skip if no data source in URL
    if (!urlState.dataSource) return;

    // Skip if data is already loaded from the same source
    if (files.length > 0 && dataSource === urlState.dataSource) return;

    // Skip if already attempted
    if (hasAttemptedLoad.current) return;

    hasAttemptedLoad.current = true;
    loadDataFromUrl(urlState.dataSource);
  }, [isDataSelectionPage, urlState.dataSource, files.length, dataSource, loadDataFromUrl]);

  // Effect: Apply filters once data is loaded
  useEffect(() => {
    if (
      files.length === 0 ||
      !urlState.filters ||
      Object.keys(urlState.filters).length === 0 ||
      hasAppliedFilters.current
    ) {
      return;
    }

    // Check if data source matches (if specified in URL)
    if (urlState.dataSource && dataSource !== urlState.dataSource) {
      return; // Wait for correct data to load
    }

    hydrateFromUrl(urlState.filters);
    hasAppliedFilters.current = true;
  }, [files.length, urlState.filters, urlState.dataSource, dataSource, hydrateFromUrl]);

  // Redirect to data selection if no data and trying to access dashboard routes
  // BUT don't redirect if URL has state params (shared link) - data will be loaded
  useEffect(() => {
    if (isDashboardRoute && files.length === 0 && dataSource === 'none' && !hasUrlState) {
      router.push('/analyze');
    }
  }, [files, dataSource, router, isDashboardRoute, hasUrlState]);

  // Data selection page - render without navbar/sidebar (it has its own header)
  if (isDataSelectionPage) {
    return <>{children}</>;
  }

  // Show loading state when loading from a shared URL
  if (isLoadingSharedUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <div className="text-center">
          <p className="text-lg font-medium">Loading shared link...</p>
          <p className="text-sm text-muted-foreground">
            Loading {loadingDataSourceName} data
          </p>
        </div>
      </div>
    );
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

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <AnalyzeLayoutContent>{children}</AnalyzeLayoutContent>
    </Suspense>
  );
}
