/**
 * Types and computation logic for firm comparison feature
 */

import type { FileInfo } from './types';

export interface FirmStats {
  firmId: string;
  firmName: string;
  totalCalls: number;
  resolutionRate: number;        // % resolved (0-100)
  transferSuccessRate: number;   // % successful transfers (0-100)
  avgDuration: number;           // seconds
  resolutionTypes: Record<string, number>;  // counts by type
  callerTypes: Record<string, number>;
  primaryIntents: Record<string, number>;
}

/**
 * Compute stats for a single firm from its file data
 */
export function computeFirmStats(
  firmId: string,
  firmName: string,
  files: FileInfo[]
): FirmStats {
  const totalCalls = files.length;

  let resolvedCount = 0;
  let transfersCount = 0;
  let transfersSuccessCount = 0;
  let durationSum = 0;
  let durationCount = 0;

  const resolutionTypes: Record<string, number> = {};
  const callerTypes: Record<string, number> = {};
  const primaryIntents: Record<string, number> = {};

  for (const file of files) {
    // Resolution status
    if (file.resolution_achieved === true) {
      resolvedCount++;
    }

    // Transfer status
    if (file.transfer_success !== null) {
      transfersCount++;
      if (file.transfer_success === true) {
        transfersSuccessCount++;
      }
    }

    // Duration
    if (file.call_duration != null) {
      durationSum += file.call_duration;
      durationCount++;
    }

    // Resolution types
    const resType = file.resolution_type || 'unknown';
    resolutionTypes[resType] = (resolutionTypes[resType] || 0) + 1;

    // Caller types
    const callerType = file.caller_type || 'unknown';
    callerTypes[callerType] = (callerTypes[callerType] || 0) + 1;

    // Primary intents
    if (file.primary_intent) {
      primaryIntents[file.primary_intent] = (primaryIntents[file.primary_intent] || 0) + 1;
    }
  }

  const resolutionRate = totalCalls > 0 ? (resolvedCount / totalCalls) * 100 : 0;
  const transferSuccessRate = transfersCount > 0 ? (transfersSuccessCount / transfersCount) * 100 : 0;
  const avgDuration = durationCount > 0 ? durationSum / durationCount : 0;

  return {
    firmId,
    firmName,
    totalCalls,
    resolutionRate,
    transferSuccessRate,
    avgDuration,
    resolutionTypes,
    callerTypes,
    primaryIntents,
  };
}
