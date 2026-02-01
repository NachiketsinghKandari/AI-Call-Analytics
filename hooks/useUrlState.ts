'use client';

/**
 * useUrlState Hook
 *
 * Main hook for URL state management - handles reading/writing URL params,
 * generating share URLs, and navigating to calls via URL.
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { FileInfo, FilterState } from '@/lib/types';
import {
  parseUrlState,
  buildNavigationParams,
  updateBrowserUrl,
  clearUrlParams as clearParams,
  createShareUrl,
  getBaseUrl,
  type UrlState,
} from '@/lib/urlState';

interface UseUrlStateOptions {
  /** Callback when URL state is parsed (for hydration) */
  onHydrate?: (state: UrlState) => void;
}

interface UseUrlStateReturn {
  /** Current URL state */
  urlState: UrlState;
  /** Whether the URL has been parsed */
  isHydrated: boolean;
  /** Set call modal state in URL */
  setCallInUrl: (callId: string, index?: number) => void;
  /** Clear URL params (e.g., when closing modal) */
  clearUrlParams: () => void;
  /** Generate a shareable URL with filters */
  generateShareUrl: (
    filters: Partial<FilterState>,
    options?: {
      callId?: string;
      index?: number;
      firmIds?: string[];
      stats?: {
        resolutionTypes?: string[];
        callerTypes?: string[];
        primaryIntents?: string[];
        transferDestinations?: string[];
        durationRange?: [number, number];
        assistantIds?: string[];
        squadIds?: string[];
      };
    }
  ) => string;
  /** Generate a navigation URL (lightweight, no filters) */
  generateNavigationUrl: (callId: string, index?: number) => string;
}

export function useUrlState(options?: UseUrlStateOptions): UseUrlStateReturn {
  const searchParams = useSearchParams();

  // Parse URL state synchronously (useMemo instead of useEffect to avoid cascading renders)
  const urlState = useMemo(() => parseUrlState(searchParams), [searchParams]);

  // Track hydration state
  const [isHydrated, setIsHydrated] = useState(false);

  // Set hydrated on mount and call onHydrate callback
  useEffect(() => {
    setIsHydrated(true);
    if (options?.onHydrate && Object.keys(urlState).length > 0) {
      options.onHydrate(urlState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set call in URL (for navigation)
  const setCallInUrl = useCallback((callId: string, index?: number) => {
    const params = buildNavigationParams(callId, index);
    updateBrowserUrl(params, false);
  }, []);

  // Clear all URL params
  const clearUrlParams = useCallback(() => {
    clearParams();
  }, []);

  // Generate a shareable URL with compressed filters
  const generateShareUrl = useCallback(
    (
      filters: Partial<FilterState>,
      shareOptions?: {
        callId?: string;
        index?: number;
        firmIds?: string[];
        stats?: {
          resolutionTypes?: string[];
          callerTypes?: string[];
          primaryIntents?: string[];
          transferDestinations?: string[];
          durationRange?: [number, number];
          assistantIds?: string[];
          squadIds?: string[];
        };
      }
    ) => {
      const baseUrl = getBaseUrl();
      return createShareUrl(baseUrl, filters, shareOptions);
    },
    []
  );

  // Generate a lightweight navigation URL (no filters)
  const generateNavigationUrl = useCallback(
    (callId: string, index?: number) => {
      const params = buildNavigationParams(callId, index);
      const baseUrl = getBaseUrl();
      return `${baseUrl}?${params.toString()}`;
    },
    []
  );

  return {
    urlState,
    isHydrated,
    setCallInUrl,
    clearUrlParams,
    generateShareUrl,
    generateNavigationUrl,
  };
}

/**
 * Find a file by call ID in a list of files
 */
export function findFileByCallId(
  files: FileInfo[],
  callId: string
): FileInfo | undefined {
  return files.find((file) => file.callId === callId);
}
