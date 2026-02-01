/**
 * Default Filter Values
 *
 * Defines default values for filters to enable compression by omitting defaults
 */

import type { FilterState, AchievedStatus, TransferStatus, MultiCaseStatus } from '@/lib/types';

// Default filter values (must match store defaults)
export const DEFAULT_FILTER_VALUES: FilterState = {
  resolutionTypes: [],
  achievedStatus: ['resolved', 'unresolved', 'unknown'] as AchievedStatus[],
  callerTypes: [],
  primaryIntents: [],
  transferStatus: ['successful', 'failed', 'no_transfer'] as TransferStatus[],
  transferDestinations: [],
  durationRange: [0, 600] as [number, number],
  includeUnknownDuration: true,
  multiCase: ['true', 'false', 'unknown'] as MultiCaseStatus[],
  assistantIds: [],
  squadIds: [],
};

// All possible values for status fields (for detecting "all selected" = default)
export const ALL_ACHIEVED_STATUS: AchievedStatus[] = ['resolved', 'unresolved', 'unknown'];
export const ALL_TRANSFER_STATUS: TransferStatus[] = ['successful', 'failed', 'no_transfer'];
export const ALL_MULTI_CASE: MultiCaseStatus[] = ['true', 'false', 'unknown'];

/**
 * Check if a filter value is the default (can be omitted from URL)
 */
export function isDefaultFilterValue(
  key: keyof FilterState,
  value: unknown,
  stats?: { resolutionTypes?: string[]; callerTypes?: string[]; primaryIntents?: string[]; transferDestinations?: string[]; durationRange?: [number, number]; assistantIds?: string[]; squadIds?: string[] }
): boolean {
  switch (key) {
    case 'achievedStatus':
      // Default is all selected
      return arraysEqual(value as string[], ALL_ACHIEVED_STATUS);

    case 'transferStatus':
      // Default is all selected
      return arraysEqual(value as string[], ALL_TRANSFER_STATUS);

    case 'multiCase':
      // Default is all selected
      return arraysEqual(value as string[], ALL_MULTI_CASE);

    case 'includeUnknownDuration':
      // Default is true
      return value === true;

    case 'durationRange':
      // Default is [0, 600] or matches stats range
      const range = value as [number, number];
      if (stats?.durationRange) {
        return range[0] === stats.durationRange[0] && range[1] === stats.durationRange[1];
      }
      return range[0] === 0 && range[1] === 600;

    case 'resolutionTypes':
    case 'callerTypes':
    case 'primaryIntents':
    case 'transferDestinations':
    case 'assistantIds':
    case 'squadIds':
      // Default is all from stats (or empty if no stats)
      if (stats) {
        const statsKey = key as keyof typeof stats;
        const statsValues = stats[statsKey] as string[] | undefined;
        if (statsValues) {
          return arraysEqual(value as string[], statsValues);
        }
      }
      // Empty array is default when no stats
      return Array.isArray(value) && value.length === 0;

    default:
      return false;
  }
}

/**
 * Merge URL state with defaults to get complete filter state
 */
export function mergeWithDefaults(
  urlFilters: Partial<FilterState>,
  stats?: { resolutionTypes?: string[]; callerTypes?: string[]; primaryIntents?: string[]; transferDestinations?: string[]; durationRange?: [number, number]; assistantIds?: string[]; squadIds?: string[] }
): FilterState {
  const merged = { ...DEFAULT_FILTER_VALUES };

  // Apply stats-based defaults first
  if (stats) {
    if (stats.resolutionTypes) merged.resolutionTypes = stats.resolutionTypes;
    if (stats.callerTypes) merged.callerTypes = stats.callerTypes;
    if (stats.primaryIntents) merged.primaryIntents = stats.primaryIntents;
    if (stats.transferDestinations) merged.transferDestinations = stats.transferDestinations;
    if (stats.durationRange) merged.durationRange = stats.durationRange;
    if (stats.assistantIds) merged.assistantIds = stats.assistantIds;
    if (stats.squadIds) merged.squadIds = stats.squadIds;
  }

  // Then apply URL overrides
  Object.entries(urlFilters).forEach(([key, value]) => {
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  });

  return merged;
}

/**
 * Helper to compare arrays (order-independent)
 */
function arraysEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}
