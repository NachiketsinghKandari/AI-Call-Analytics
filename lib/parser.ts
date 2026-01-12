// File parsing logic - ported from Python call_analysis.py
import type { CallData, FileInfo } from './types';

/**
 * Generate a unique ID for a file
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Compute transfer success from transfer_connection_status array
 * Logic ported from Python:
 * - Empty array or no array = null (no transfer)
 * - At least one true = true (success)
 * - All false = false (failed)
 */
export function computeTransferSuccess(status: unknown): boolean | null {
  if (!Array.isArray(status)) {
    return null;
  }

  if (status.length === 0) {
    return null;
  }

  const boolValues = status.filter((v): v is boolean => typeof v === 'boolean');

  if (boolValues.length === 0) {
    return null;
  }

  return boolValues.some((v) => v === true);
}

/**
 * Parse call data from JSON content
 */
export function parseCallData(jsonContent: string): CallData | null {
  try {
    let data = JSON.parse(jsonContent);

    // Handle array wrapper: [{"call_summary": {...}}]
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      data = data[0];
    }

    if (!data || typeof data !== 'object') {
      return null;
    }

    const callerType = typeof data.caller_type === 'string' ? data.caller_type : 'unknown';

    const callSummary = data.call_summary && typeof data.call_summary === 'object'
      ? {
          primary_intent: data.call_summary.primary_intent ?? null,
          resolution_achieved: data.call_summary.resolution_achieved ?? null,
          resolution_type: data.call_summary.resolution_type ?? null,
          resolution_basis: data.call_summary.resolution_basis ?? null,
          operational_terminal_state: data.call_summary.operational_terminal_state ?? null,
          secondary_action: data.call_summary.secondary_action ?? null,
          multi_case_details: data.call_summary.multi_case_details ?? null,
          final_outcome: data.call_summary.final_outcome ?? '',
          call_duration_seconds: data.call_summary.call_duration_seconds ?? null,
          call_duration_formatted: data.call_summary.call_duration_formatted ?? null,
        }
      : {
          primary_intent: null,
          resolution_achieved: null,
          resolution_type: null,
          resolution_basis: null,
          operational_terminal_state: null,
          secondary_action: null,
          multi_case_details: null,
          final_outcome: '',
          call_duration_seconds: null,
          call_duration_formatted: null,
        };

    const transferContext = data.transfer_context && typeof data.transfer_context === 'object'
      ? {
          destinations: Array.isArray(data.transfer_context.destinations)
            ? data.transfer_context.destinations
            : [],
          transfer_connection_status: Array.isArray(data.transfer_context.transfer_connection_status)
            ? data.transfer_context.transfer_connection_status
            : [],
          reasons: Array.isArray(data.transfer_context.reasons)
            ? data.transfer_context.reasons
            : [],
          description: data.transfer_context.description ?? null,
        }
      : undefined;

    return {
      caller_type: callerType,
      call_summary: callSummary,
      transfer_context: transferContext,
    };
  } catch {
    return null;
  }
}

/**
 * Match a TXT file to a JSON file by name patterns
 * Handles: file.json -> file.txt, file_gemini.json -> file.txt
 */
export function matchTxtFile(
  jsonName: string,
  txtFiles: Map<string, string>
): string | null {
  // Pattern 1: Direct match (file.json -> file.txt)
  const directMatch = jsonName.replace(/\.json$/i, '.txt');
  if (txtFiles.has(directMatch)) {
    return directMatch;
  }

  // Pattern 2: Remove _gemini suffix
  if (jsonName.includes('_gemini.json')) {
    const withoutGemini = jsonName.replace('_gemini.json', '.txt');
    if (txtFiles.has(withoutGemini)) {
      return withoutGemini;
    }
  }

  // Pattern 3: Remove other provider suffixes
  const suffixes = ['_gemini', '_deepgram', '_soniox', '_assemblyai'];
  for (const suffix of suffixes) {
    if (jsonName.includes(`${suffix}.json`)) {
      const withoutSuffix = jsonName.replace(`${suffix}.json`, '.txt');
      if (txtFiles.has(withoutSuffix)) {
        return withoutSuffix;
      }
    }
  }

  return null;
}

/**
 * Extract the first non-empty transfer destination
 */
function extractTransferDestination(destinations: string[]): string | null {
  for (const dest of destinations) {
    if (typeof dest === 'string' && dest.trim()) {
      return dest;
    }
  }
  return null;
}

/**
 * Process uploaded files into FileInfo array
 */
export async function processFiles(
  files: File[]
): Promise<FileInfo[]> {
  // Separate JSON and TXT files
  const jsonFiles: { file: File; path: string }[] = [];
  const txtFiles = new Map<string, { file: File; path: string }>();

  for (const file of files) {
    const path = file.webkitRelativePath || file.name;
    const name = file.name.toLowerCase();

    if (name.endsWith('.json')) {
      jsonFiles.push({ file, path });
    } else if (name.endsWith('.txt')) {
      txtFiles.set(file.name, { file, path });
    }
  }

  // Process JSON files
  const results: FileInfo[] = [];

  for (const { file: jsonFile, path } of jsonFiles) {
    try {
      const content = await jsonFile.text();
      const callData = parseCallData(content);

      if (!callData) {
        continue;
      }

      // Find matching TXT file
      let transcript: string | null = null;
      const matchedTxtName = matchTxtFile(jsonFile.name, new Map(
        Array.from(txtFiles.keys()).map(k => [k, k])
      ));

      if (matchedTxtName && txtFiles.has(matchedTxtName)) {
        const txtEntry = txtFiles.get(matchedTxtName)!;
        transcript = await txtEntry.file.text();
      }

      // Compute derived fields
      const transferSuccess = callData.transfer_context
        ? computeTransferSuccess(callData.transfer_context.transfer_connection_status)
        : null;

      const transferDestination = callData.transfer_context
        ? extractTransferDestination(callData.transfer_context.destinations)
        : null;

      const fileInfo: FileInfo = {
        id: generateId(),
        path,
        name: jsonFile.name,
        resolution_type: callData.call_summary.resolution_type || 'no_resolution_type',
        caller_type: callData.caller_type,
        resolution_achieved: callData.call_summary.resolution_achieved,
        transfer_success: transferSuccess,
        transfer_destination: transferDestination,
        secondary_action: callData.call_summary.secondary_action,
        call_duration: callData.call_summary.call_duration_seconds,
        primary_intent: callData.call_summary.primary_intent,
        final_outcome: callData.call_summary.final_outcome,
        transcript,
        data: callData,
      };

      results.push(fileInfo);
    } catch (error) {
      console.warn(`Error processing ${jsonFile.name}:`, error);
    }
  }

  // Sort by path
  results.sort((a, b) => a.path.localeCompare(b.path));

  return results;
}

/**
 * Load sample data from bundled JSON files
 */
export async function loadSampleData(): Promise<FileInfo[]> {
  try {
    const response = await fetch('/api/sample-data');
    if (!response.ok) {
      throw new Error('Failed to load sample data');
    }
    const data = await response.json();
    return data.files as FileInfo[];
  } catch (error) {
    console.error('Error loading sample data:', error);
    throw error;
  }
}
