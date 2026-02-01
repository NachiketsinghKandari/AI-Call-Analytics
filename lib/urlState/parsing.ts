/**
 * URL State Parsing
 *
 * Parse URL parameters and extract state, build navigation URLs
 */

import type { FileInfo } from '@/lib/types';
import { URL_PARAMS, VALID_DATA_SOURCES, VALID_PRESETS, type UrlState, type UrlDataSource, type UrlSankeyPreset } from './types';
import { decompressState } from './encoding';

/**
 * Extract semantic call ID from a file
 *
 * For non-VAPI files (McCraw, Bey & Associates):
 *   Filename: 20251212-121028_3_+18447096877_Incoming_Auto_3375065997005_gemini.json
 *   Call ID: 20251212-121028_3_+18447096877_Incoming_Auto_3375065997005
 *
 * For VAPI files:
 *   The file already has a UUID as its ID (e.g., 019bb239-bbe2-711c-9363-1b5f9d68546d)
 */
export function extractCallId(file: FileInfo, dataSource: string): string {
  // VAPI files use the record UUID directly
  if (dataSource === 'vapi') {
    return file.id;
  }

  // For non-VAPI files, extract the prefix before _gemini
  const filename = file.name;
  const callId = filename.replace(/_gemini\.(json|txt)$/i, '').replace(/\.(json|txt)$/i, '');
  return callId;
}

/**
 * Parse URL search params to extract state
 */
export function parseUrlState(searchParams: URLSearchParams): UrlState {
  const state: UrlState = {};

  // Parse call ID
  const callId = searchParams.get(URL_PARAMS.CALL_ID);
  if (callId) {
    state.callId = callId;
  }

  // Parse index
  const indexStr = searchParams.get(URL_PARAMS.INDEX);
  if (indexStr) {
    const index = parseInt(indexStr, 10);
    if (!isNaN(index) && index >= 0) {
      state.index = index;
    }
  }

  // Parse compressed share state
  const shareState = searchParams.get(URL_PARAMS.SHARE);
  if (shareState) {
    const filters = decompressState(shareState);
    if (filters) {
      state.filters = filters as UrlState['filters'];
    }
  }

  // Parse firm IDs (for compare page)
  const firmIds = searchParams.get(URL_PARAMS.FIRM_IDS);
  if (firmIds) {
    state.firmIds = firmIds.split(',').filter(Boolean);
  }

  // Parse data source
  const dataSourceParam = searchParams.get(URL_PARAMS.DATA_SOURCE);
  if (dataSourceParam && VALID_DATA_SOURCES.includes(dataSourceParam as UrlDataSource)) {
    state.dataSource = dataSourceParam as UrlDataSource;
  }

  // Parse preset
  const presetParam = searchParams.get(URL_PARAMS.PRESET);
  if (presetParam && VALID_PRESETS.includes(presetParam as UrlSankeyPreset)) {
    state.preset = presetParam as UrlSankeyPreset;
  }

  return state;
}

/**
 * Build navigation params for a lightweight URL (no filters)
 */
export function buildNavigationParams(callId: string, index?: number): URLSearchParams {
  const params = new URLSearchParams();
  params.set(URL_PARAMS.CALL_ID, callId);
  if (index !== undefined && index >= 0) {
    params.set(URL_PARAMS.INDEX, index.toString());
  }
  return params;
}

/**
 * Find a file by its call ID
 */
export function findFileByCallId(
  files: FileInfo[],
  callId: string,
  dataSource: string
): FileInfo | undefined {
  return files.find((file) => extractCallId(file, dataSource) === callId);
}

/**
 * Get the current page's base URL (without search params)
 */
export function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return `${window.location.origin}${window.location.pathname}`;
}

/**
 * Update the browser URL without navigation
 */
export function updateBrowserUrl(params: URLSearchParams | null, replace = false): void {
  if (typeof window === 'undefined') return;

  const baseUrl = window.location.pathname;
  const newUrl = params && params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

  if (replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
}

/**
 * Clear all URL params
 */
export function clearUrlParams(): void {
  updateBrowserUrl(null, true);
}
