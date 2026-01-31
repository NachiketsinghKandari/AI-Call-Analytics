/**
 * Build-time script to generate pre-computed sample data from the data/ folder.
 * Run with: npx tsx scripts/generate-sample-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Types (duplicated to avoid import issues with Next.js paths)
interface CallSummary {
  primary_intent: string | null;
  resolution_achieved: boolean | null;
  resolution_type: string | null;
  resolution_basis: string | null;
  operational_terminal_state: string | null;
  secondary_action: string | null;
  multi_case_details: boolean | null;
  final_outcome: string;
  call_duration_seconds: number | null;
  call_duration_formatted: string | null;
}

interface TransferContext {
  destinations: string[];
  transfer_connection_status: boolean[];
  reasons: string[];
  description: string | null;
}

interface CallData {
  caller_type: string;
  call_summary: CallSummary;
  transfer_context?: TransferContext;
}

interface FileInfo {
  id: string;
  path: string;
  name: string;
  resolution_type: string;
  caller_type: string;
  resolution_achieved: boolean | null;
  transfer_success: boolean | null;
  transfer_destination: string | null;
  secondary_action: string | null;
  call_duration: number | null;
  primary_intent: string | null;
  final_outcome: string;
  transcript: string | null;
  data: CallData;
  // VAPI-specific fields (null for sample data)
  assistantId: string | null;
  squadId: string | null;
  audioUrl: string | null;
}

interface DataStats {
  totalFiles: number;
  resolutionTypes: string[];
  callerTypes: string[];
  primaryIntents: string[];
  durationRange: [number, number];
  assistantIds: string[];
  squadIds: string[];
}

// Utility functions
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function computeTransferSuccess(status: unknown): boolean | null {
  if (!Array.isArray(status)) return null;
  if (status.length === 0) return null;
  const boolValues = status.filter((v): v is boolean => typeof v === 'boolean');
  if (boolValues.length === 0) return null;
  return boolValues.some((v) => v === true);
}

function parseCallData(jsonContent: string): CallData | null {
  try {
    let data = JSON.parse(jsonContent);

    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      data = data[0];
    }

    if (!data || typeof data !== 'object') return null;

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

    return { caller_type: callerType, call_summary: callSummary, transfer_context: transferContext };
  } catch {
    return null;
  }
}

function matchTxtFile(jsonName: string, txtFileNames: Set<string>): string | null {
  // Pattern 1: Direct match
  const directMatch = jsonName.replace(/\.json$/i, '.txt');
  if (txtFileNames.has(directMatch)) return directMatch;

  // Pattern 2: Remove provider suffixes
  const suffixes = ['_gemini', '_deepgram', '_soniox', '_assemblyai'];
  for (const suffix of suffixes) {
    if (jsonName.includes(`${suffix}.json`)) {
      const withoutSuffix = jsonName.replace(`${suffix}.json`, '.txt');
      if (txtFileNames.has(withoutSuffix)) return withoutSuffix;
    }
  }

  return null;
}

function extractTransferDestination(destinations: string[]): string | null {
  for (const dest of destinations) {
    if (typeof dest === 'string' && dest.trim()) return dest;
  }
  return null;
}

function computeStats(files: FileInfo[]): DataStats {
  const resolutionTypes = new Set<string>();
  const callerTypes = new Set<string>();
  const primaryIntents = new Set<string>();
  let minDuration = Infinity;
  let maxDuration = -Infinity;

  for (const file of files) {
    resolutionTypes.add(file.resolution_type);
    callerTypes.add(file.caller_type);
    if (file.primary_intent) primaryIntents.add(file.primary_intent);
    if (file.call_duration !== null) {
      minDuration = Math.min(minDuration, file.call_duration);
      maxDuration = Math.max(maxDuration, file.call_duration);
    }
  }

  return {
    totalFiles: files.length,
    resolutionTypes: Array.from(resolutionTypes).sort(),
    callerTypes: Array.from(callerTypes).sort(),
    primaryIntents: Array.from(primaryIntents).sort(),
    durationRange: [
      minDuration === Infinity ? 0 : Math.floor(minDuration),
      maxDuration === -Infinity ? 600 : Math.ceil(maxDuration),
    ],
    assistantIds: [], // Not applicable for sample data
    squadIds: [], // Not applicable for sample data
  };
}

// Main generation function
function generate() {
  const DATA_DIR = path.join(process.cwd(), 'data');
  const OUTPUT_PATH = path.join(process.cwd(), 'public', 'sample-data.json');

  // Skip generation if sample data already exists (for CI/Vercel builds)
  if (fs.existsSync(OUTPUT_PATH)) {
    const stats = fs.statSync(OUTPUT_PATH);
    if (stats.size > 0) {
      console.log(`Sample data already exists at ${OUTPUT_PATH} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log('Skipping generation. Delete the file to regenerate.');
      return;
    }
  }

  console.log(`Reading files from ${DATA_DIR}...`);

  if (!fs.existsSync(DATA_DIR)) {
    console.log(`Data directory not found: ${DATA_DIR}`);
    console.log('No sample data will be generated. This is OK for deployment.');
    return;
  }

  const allFiles = fs.readdirSync(DATA_DIR);
  const jsonFileNames = allFiles.filter(f => f.endsWith('.json'));
  const txtFileNames = new Set(allFiles.filter(f => f.endsWith('.txt')));

  console.log(`Found ${jsonFileNames.length} JSON files and ${txtFileNames.size} TXT files`);

  // Skip if no JSON files found (data folder may only have .gitkeep)
  if (jsonFileNames.length === 0) {
    console.log('No JSON files found in data folder.');
    console.log('No sample data will be generated. This is OK for deployment.');
    return;
  }

  // Pre-load all TXT files into memory
  const txtContents = new Map<string, string>();
  for (const txtName of txtFileNames) {
    try {
      txtContents.set(txtName, fs.readFileSync(path.join(DATA_DIR, txtName), 'utf-8'));
    } catch (err) {
      console.warn(`Failed to read ${txtName}:`, err);
    }
  }

  // Process JSON files
  const fileInfos: FileInfo[] = [];
  let processed = 0;
  let failed = 0;

  for (const jsonName of jsonFileNames) {
    try {
      const content = fs.readFileSync(path.join(DATA_DIR, jsonName), 'utf-8');
      const callData = parseCallData(content);

      if (!callData) {
        failed++;
        continue;
      }

      // Find matching transcript
      const matchedTxtName = matchTxtFile(jsonName, txtFileNames);
      const transcript = matchedTxtName ? txtContents.get(matchedTxtName) || null : null;

      // Compute derived fields
      const transferSuccess = callData.transfer_context
        ? computeTransferSuccess(callData.transfer_context.transfer_connection_status)
        : null;

      const transferDestination = callData.transfer_context
        ? extractTransferDestination(callData.transfer_context.destinations)
        : null;

      fileInfos.push({
        id: generateId(),
        path: jsonName,
        name: jsonName,
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
        assistantId: null, // Not applicable for sample data
        squadId: null, // Not applicable for sample data
        audioUrl: null, // Not applicable for sample data
      });

      processed++;
    } catch (err) {
      console.warn(`Error processing ${jsonName}:`, err);
      failed++;
    }
  }

  // Sort by name
  fileInfos.sort((a, b) => a.name.localeCompare(b.name));

  // Compute stats
  const stats = computeStats(fileInfos);

  // Write output
  const output = { files: fileInfos, stats };
  const outputJson = JSON.stringify(output);

  fs.writeFileSync(OUTPUT_PATH, outputJson);

  const fileSizeMB = (Buffer.byteLength(outputJson, 'utf-8') / 1024 / 1024).toFixed(2);

  console.log(`\nGeneration complete!`);
  console.log(`  Processed: ${processed} files`);
  console.log(`  Failed: ${failed} files`);
  console.log(`  With transcripts: ${fileInfos.filter(f => f.transcript).length}`);
  console.log(`  Output: ${OUTPUT_PATH}`);
  console.log(`  Size: ${fileSizeMB} MB`);
  console.log(`\nStats:`);
  console.log(`  Resolution types: ${stats.resolutionTypes.length}`);
  console.log(`  Caller types: ${stats.callerTypes.length}`);
  console.log(`  Primary intents: ${stats.primaryIntents.length}`);
  console.log(`  Duration range: ${stats.durationRange[0]}s - ${stats.durationRange[1]}s`);
}

generate();
