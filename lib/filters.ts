// 7-axis filter system - ported from Python call_analysis.py
import type { FileInfo, FilterState, AchievedStatus, TransferStatus, MultiCaseStatus } from './types';

/**
 * Check if file matches resolution type filter
 */
export function matchesResolutionType(file: FileInfo, types: string[]): boolean {
  if (types.length === 0) return true;
  return types.includes(file.resolution_type);
}

/**
 * Check if file matches resolution achieved filter
 */
export function matchesAchieved(file: FileInfo, status: AchievedStatus[]): boolean {
  if (status.length === 0) return true;

  if (file.resolution_achieved === true) {
    return status.includes('resolved');
  }
  if (file.resolution_achieved === false) {
    return status.includes('unresolved');
  }
  return status.includes('unknown');
}

/**
 * Check if file matches caller type filter
 */
export function matchesCallerType(file: FileInfo, types: string[]): boolean {
  if (types.length === 0) return true;
  return types.includes(file.caller_type);
}

/**
 * Check if file matches primary intent filter
 */
export function matchesPrimaryIntent(file: FileInfo, intents: string[]): boolean {
  if (intents.length === 0) return true;
  const fileIntent = file.primary_intent || 'unknown';
  return intents.includes(fileIntent);
}

/**
 * Check if file matches transfer success filter
 */
export function matchesTransferSuccess(file: FileInfo, status: TransferStatus[]): boolean {
  if (status.length === 0) return true;

  if (file.transfer_success === true) {
    return status.includes('successful');
  }
  if (file.transfer_success === false) {
    return status.includes('failed');
  }
  return status.includes('no_transfer');
}

/**
 * Check if file matches duration range filter
 */
export function matchesDuration(file: FileInfo, range: [number, number]): boolean {
  if (file.call_duration === null) {
    return false;
  }
  return file.call_duration >= range[0] && file.call_duration <= range[1];
}

/**
 * Check if file matches multi-case filter
 */
export function matchesMultiCase(file: FileInfo, values: MultiCaseStatus[]): boolean {
  if (values.length === 0) return true;

  const multiCase = file.data?.call_summary?.multi_case_details;

  if (multiCase === true) {
    return values.includes('true');
  }
  if (multiCase === false) {
    return values.includes('false');
  }
  return values.includes('unknown');
}

/**
 * Check if file matches assistant ID filter (VAPI-specific)
 */
export function matchesAssistantId(file: FileInfo, ids: string[]): boolean {
  if (ids.length === 0) return true;
  // Files without assistantId match if 'none' is in the filter, otherwise match by ID
  if (file.assistantId === null) {
    return ids.includes('none');
  }
  return ids.includes(file.assistantId);
}

/**
 * Check if file matches squad ID filter (VAPI-specific)
 */
export function matchesSquadId(file: FileInfo, ids: string[]): boolean {
  if (ids.length === 0) return true;
  // Files without squadId match if 'none' is in the filter, otherwise match by ID
  if (file.squadId === null) {
    return ids.includes('none');
  }
  return ids.includes(file.squadId);
}

/**
 * Apply all filters to a list of files
 */
export function applyAllFilters(files: FileInfo[], filters: FilterState): FileInfo[] {
  return files.filter((file) => {
    return (
      matchesResolutionType(file, filters.resolutionTypes) &&
      matchesAchieved(file, filters.achievedStatus) &&
      matchesCallerType(file, filters.callerTypes) &&
      matchesPrimaryIntent(file, filters.primaryIntents) &&
      matchesTransferSuccess(file, filters.transferStatus) &&
      matchesDuration(file, filters.durationRange) &&
      matchesMultiCase(file, filters.multiCase) &&
      matchesAssistantId(file, filters.assistantIds) &&
      matchesSquadId(file, filters.squadIds)
    );
  });
}

/**
 * Calculate counts for a specific dimension within filtered files
 */
export function calculateDimensionCounts(
  files: FileInfo[],
  dimension: 'resolution_type' | 'caller_type' | 'primary_intent' | 'achieved' | 'transfer' | 'multi_case' | 'assistant_id' | 'squad_id'
): Map<string, { count: number; duration: number }> {
  const counts = new Map<string, { count: number; duration: number }>();

  for (const file of files) {
    let key: string;

    switch (dimension) {
      case 'resolution_type':
        key = file.resolution_type;
        break;
      case 'caller_type':
        key = file.caller_type;
        break;
      case 'primary_intent':
        key = file.primary_intent || 'unknown';
        break;
      case 'achieved':
        if (file.resolution_achieved === true) key = 'resolved';
        else if (file.resolution_achieved === false) key = 'unresolved';
        else key = 'unknown';
        break;
      case 'transfer':
        if (file.transfer_success === true) key = 'successful';
        else if (file.transfer_success === false) key = 'failed';
        else key = 'no_transfer';
        break;
      case 'multi_case': {
        const multiCase = file.data?.call_summary?.multi_case_details;
        if (multiCase === true) key = 'true';
        else if (multiCase === false) key = 'false';
        else key = 'unknown';
        break;
      }
      case 'assistant_id':
        key = file.assistantId || 'none';
        break;
      case 'squad_id':
        key = file.squadId || 'none';
        break;
    }

    const existing = counts.get(key) || { count: 0, duration: 0 };
    counts.set(key, {
      count: existing.count + 1,
      duration: existing.duration + (file.call_duration || 0),
    });
  }

  return counts;
}

/**
 * Search files by text query (searches name, outcome, caller type)
 */
export function searchFiles(files: FileInfo[], query: string): FileInfo[] {
  if (!query.trim()) return files;

  const lowerQuery = query.toLowerCase();

  return files.filter((file) => {
    return (
      file.name.toLowerCase().includes(lowerQuery) ||
      file.final_outcome.toLowerCase().includes(lowerQuery) ||
      file.caller_type.toLowerCase().includes(lowerQuery) ||
      file.path.toLowerCase().includes(lowerQuery)
    );
  });
}
