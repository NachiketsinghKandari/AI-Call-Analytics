/**
 * URL State Management Types
 *
 * Defines constants and types for URL-based state sharing
 */

// URL parameter keys
export const URL_PARAMS = {
  CALL_ID: 'c',      // Call ID for navigation
  INDEX: 'i',        // Index in filtered list
  SHARE: 's',        // Compressed share state
  FIRM_IDS: 'f',     // Firm IDs for compare page
  DATA_SOURCE: 'd',  // Data source (sample, mccraw, vapi)
  PRESET: 'p',       // Sankey preset (resolution, transfer, caller, intent, custom)
} as const;

// Valid Sankey presets
export type UrlSankeyPreset = 'resolution' | 'transfer' | 'caller' | 'intent' | 'custom';
export const VALID_PRESETS: UrlSankeyPreset[] = ['resolution', 'transfer', 'caller', 'intent', 'custom'];

// Valid data sources that can be auto-loaded from URL
export type UrlDataSource = 'sample' | 'mccraw' | 'vapi';
export const VALID_DATA_SOURCES: UrlDataSource[] = ['sample', 'mccraw', 'vapi'];

// Abbreviated filter keys for compression
export const ABBREVIATED_KEYS = {
  resolutionTypes: 'rt',
  achievedStatus: 'as',
  callerTypes: 'ct',
  primaryIntents: 'pi',
  transferStatus: 'ts',
  transferDestinations: 'td',
  durationRange: 'dr',
  includeUnknownDuration: 'ud',
  multiCase: 'mc',
  assistantIds: 'ai',
  squadIds: 'si',
} as const;

// Reverse mapping for expanding abbreviated keys
export const EXPANDED_KEYS: Record<string, keyof typeof ABBREVIATED_KEYS> = Object.fromEntries(
  Object.entries(ABBREVIATED_KEYS).map(([full, short]) => [short, full as keyof typeof ABBREVIATED_KEYS])
) as Record<string, keyof typeof ABBREVIATED_KEYS>;

// Schema version for future migrations
export const URL_STATE_VERSION = 1;

// Import FilterState for typing
import type { FilterState } from '@/lib/types';

// Types for URL state
export interface UrlState {
  callId?: string;
  index?: number;
  filters?: Partial<FilterState>;
  firmIds?: string[];
  dataSource?: UrlDataSource;
  preset?: UrlSankeyPreset;
}

export interface CompressedFilters {
  v?: number;  // Schema version
  rt?: string[];  // resolutionTypes
  as?: string[];  // achievedStatus
  ct?: string[];  // callerTypes
  pi?: string[];  // primaryIntents
  ts?: string[];  // transferStatus
  td?: string[];  // transferDestinations
  dr?: [number, number];  // durationRange
  ud?: boolean;  // includeUnknownDuration
  mc?: string[];  // multiCase
  ai?: string[];  // assistantIds
  si?: string[];  // squadIds
}
