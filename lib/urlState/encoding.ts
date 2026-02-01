/**
 * URL State Encoding/Decoding
 *
 * Handles compression of filter state for shareable URLs using lz-string
 */

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { FilterState } from '@/lib/types';
import { ABBREVIATED_KEYS, EXPANDED_KEYS, URL_STATE_VERSION, type CompressedFilters } from './types';
import { isDefaultFilterValue } from './defaults';

/**
 * Abbreviate filter keys for smaller URL payload
 */
export function abbreviateFilters(
  filters: Partial<FilterState>,
  stats?: { resolutionTypes?: string[]; callerTypes?: string[]; primaryIntents?: string[]; transferDestinations?: string[]; durationRange?: [number, number]; assistantIds?: string[]; squadIds?: string[] }
): CompressedFilters {
  const abbreviated: CompressedFilters = { v: URL_STATE_VERSION };

  (Object.entries(filters) as [keyof FilterState, unknown][]).forEach(([key, value]) => {
    // Skip if value is default (reduces URL size)
    if (isDefaultFilterValue(key, value, stats)) {
      return;
    }

    const abbrevKey = ABBREVIATED_KEYS[key as keyof typeof ABBREVIATED_KEYS];
    if (abbrevKey && value !== undefined) {
      (abbreviated as Record<string, unknown>)[abbrevKey] = value;
    }
  });

  return abbreviated;
}

/**
 * Expand abbreviated filter keys back to full names
 */
export function expandFilters(abbreviated: CompressedFilters): Partial<FilterState> {
  const expanded: Partial<FilterState> = {};

  Object.entries(abbreviated).forEach(([key, value]) => {
    if (key === 'v') return; // Skip version

    const fullKey = EXPANDED_KEYS[key];
    if (fullKey && value !== undefined) {
      (expanded as Record<string, unknown>)[fullKey] = value;
    }
  });

  return expanded;
}

/**
 * Compress filter state to URL-safe string
 */
export function compressState(
  filters: Partial<FilterState>,
  stats?: { resolutionTypes?: string[]; callerTypes?: string[]; primaryIntents?: string[]; transferDestinations?: string[]; durationRange?: [number, number]; assistantIds?: string[]; squadIds?: string[] }
): string {
  const abbreviated = abbreviateFilters(filters, stats);

  // Only include version if there are actual filter changes
  const hasFilters = Object.keys(abbreviated).length > 1; // > 1 because 'v' is always included
  if (!hasFilters) {
    return '';
  }

  const json = JSON.stringify(abbreviated);
  return compressToEncodedURIComponent(json);
}

/**
 * Decompress URL string back to filter state
 */
export function decompressState(compressed: string): Partial<FilterState> | null {
  if (!compressed) return null;

  try {
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) return null;

    const abbreviated = JSON.parse(json) as CompressedFilters;

    // Handle version migrations if needed in the future
    // const version = abbreviated.v ?? 1;

    return expandFilters(abbreviated);
  } catch (error) {
    console.error('Failed to decompress URL state:', error);
    return null;
  }
}

/**
 * Create a share URL with compressed state
 */
export function createShareUrl(
  baseUrl: string,
  filters: Partial<FilterState>,
  options?: {
    callId?: string;
    index?: number;
    firmIds?: string[];
    dataSource?: string;
    preset?: string;
    stats?: { resolutionTypes?: string[]; callerTypes?: string[]; primaryIntents?: string[]; transferDestinations?: string[]; durationRange?: [number, number]; assistantIds?: string[]; squadIds?: string[] };
  }
): string {
  const url = new URL(baseUrl);

  // Add data source (required for shared URLs to work)
  if (options?.dataSource) {
    url.searchParams.set('d', options.dataSource);
  }

  // Add preset if specified (and not default 'resolution')
  if (options?.preset && options.preset !== 'resolution') {
    url.searchParams.set('p', options.preset);
  }

  // Add compressed filters
  const compressed = compressState(filters, options?.stats);
  if (compressed) {
    url.searchParams.set('s', compressed);
  }

  // Add call ID if specified
  if (options?.callId) {
    url.searchParams.set('c', options.callId);
    if (options.index !== undefined) {
      url.searchParams.set('i', options.index.toString());
    }
  }

  // Add firm IDs if specified (for compare page)
  if (options?.firmIds && options.firmIds.length > 0) {
    url.searchParams.set('f', options.firmIds.join(','));
  }

  return url.toString();
}
