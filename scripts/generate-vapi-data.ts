/**
 * Build-time script to generate pre-computed VAPI data from data/vapi folder.
 * Run with: npx tsx scripts/generate-vapi-data.ts
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
  callId: string;  // Semantic ID for URLs (UUID for VAPI)
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
  // VAPI-specific fields
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

// VAPI source data structure
interface VapiRecord {
  id: string;
  transcript: string | null;
  type: string;
  endedReason: string;
  durationSeconds: number | null;
  assistantId: string | null;
  squadId: string | null;
  llm_analysis: {
    caller_type: string;
    call_summary: {
      primary_intent: string | null;
      resolution_achieved: boolean;
      resolution_basis: string | null;
      resolution_type: string | null;
      operational_terminal_state: string | null;
      secondary_action: string | null;
      final_outcome: string;
    };
    transfer_context: {
      destinations: string[];
      transfer_connection_status: boolean[];
      reasons: string[];
      description: string | null;
    };
  } | null;
}

function computeTransferSuccess(status: boolean[]): boolean | null {
  if (!Array.isArray(status) || status.length === 0) {
    return null;
  }
  return status.some((v) => v === true);
}

function extractTransferDestination(destinations: string[]): string | null {
  for (const dest of destinations) {
    if (typeof dest === 'string' && dest.trim()) {
      return dest;
    }
  }
  return null;
}

function computeStats(files: FileInfo[]): DataStats {
  const resolutionTypes = new Set<string>();
  const callerTypes = new Set<string>();
  const primaryIntents = new Set<string>();
  const assistantIds = new Set<string>();
  const squadIds = new Set<string>();
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
    if (file.assistantId) assistantIds.add(file.assistantId);
    if (file.squadId) squadIds.add(file.squadId);
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
    assistantIds: Array.from(assistantIds).sort(),
    squadIds: Array.from(squadIds).sort(),
  };
}

function transformVapiRecord(record: VapiRecord): FileInfo | null {
  // Skip records without llm_analysis
  if (!record.llm_analysis) {
    return null;
  }

  const analysis = record.llm_analysis;
  const callSummary = analysis.call_summary;
  const transferContext = analysis.transfer_context;

  // Compute transfer success from transfer_connection_status array
  const transferSuccess = computeTransferSuccess(transferContext.transfer_connection_status);
  const transferDestination = extractTransferDestination(transferContext.destinations);

  // Build CallData structure to match existing FileInfo.data format
  const callData: CallData = {
    caller_type: analysis.caller_type,
    call_summary: {
      primary_intent: callSummary.primary_intent,
      resolution_achieved: callSummary.resolution_achieved,
      resolution_type: callSummary.resolution_type,
      resolution_basis: callSummary.resolution_basis,
      operational_terminal_state: callSummary.operational_terminal_state,
      secondary_action: callSummary.secondary_action,
      multi_case_details: null, // Not present in VAPI data
      final_outcome: callSummary.final_outcome || '',
      call_duration_seconds: record.durationSeconds,
      call_duration_formatted: null, // Not present in VAPI data
    },
    transfer_context: {
      destinations: transferContext.destinations,
      transfer_connection_status: transferContext.transfer_connection_status,
      reasons: transferContext.reasons,
      description: transferContext.description,
    },
  };

  return {
    id: record.id, // Use VAPI's UUID directly
    path: `vapi/${record.id}`,
    name: record.id,
    callId: record.id, // VAPI uses UUID as call ID
    resolution_type: callSummary.resolution_type || 'no_resolution_type',
    caller_type: analysis.caller_type,
    resolution_achieved: callSummary.resolution_achieved,
    transfer_success: transferSuccess,
    transfer_destination: transferDestination,
    secondary_action: callSummary.secondary_action,
    call_duration: record.durationSeconds, // Duration is at root level in VAPI data
    primary_intent: callSummary.primary_intent,
    final_outcome: callSummary.final_outcome || '',
    transcript: record.transcript,
    data: callData,
    assistantId: record.assistantId,
    squadId: record.squadId,
    audioUrl: null, // VAPI doesn't have audio files
  };
}

// Main generation function
function generate() {
  const VAPI_DIR = path.join(process.cwd(), 'data', 'vapi');
  const SOURCE_FILE = path.join(VAPI_DIR, 'vapi_extracted_calls_analysed_v10.json');
  const OUTPUT_PATH = path.join(process.cwd(), 'public', 'vapi-data.json');

  // Skip generation if output already exists
  if (fs.existsSync(OUTPUT_PATH)) {
    const stats = fs.statSync(OUTPUT_PATH);
    if (stats.size > 0) {
      console.log(`VAPI data already exists at ${OUTPUT_PATH} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log('Skipping generation. Delete the file to regenerate.');
      return;
    }
  }

  console.log(`Reading VAPI data from ${SOURCE_FILE}...`);

  if (!fs.existsSync(SOURCE_FILE)) {
    console.log(`VAPI source file not found: ${SOURCE_FILE}`);
    console.log('No VAPI data will be generated. This is OK for deployment.');
    return;
  }

  // Read and parse the source file
  const content = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const records: VapiRecord[] = JSON.parse(content);

  console.log(`Found ${records.length} VAPI records`);

  // Transform records to FileInfo format
  const fileInfos: FileInfo[] = [];
  let processed = 0;
  let skipped = 0;

  for (const record of records) {
    const fileInfo = transformVapiRecord(record);
    if (fileInfo) {
      fileInfos.push(fileInfo);
      processed++;
    } else {
      skipped++;
    }
  }

  // Sort by id
  fileInfos.sort((a, b) => a.id.localeCompare(b.id));

  // Compute stats
  const stats = computeStats(fileInfos);

  // Write output
  const output = { files: fileInfos, stats };
  const outputJson = JSON.stringify(output);

  fs.writeFileSync(OUTPUT_PATH, outputJson);

  const fileSizeMB = (Buffer.byteLength(outputJson, 'utf-8') / 1024 / 1024).toFixed(2);

  console.log(`\nGeneration complete!`);
  console.log(`  Processed: ${processed} records`);
  console.log(`  Skipped (no llm_analysis): ${skipped} records`);
  console.log(`  With transcripts: ${fileInfos.filter(f => f.transcript).length}`);
  console.log(`  Output: ${OUTPUT_PATH}`);
  console.log(`  Size: ${fileSizeMB} MB`);
  console.log(`\nStats:`);
  console.log(`  Resolution types: ${stats.resolutionTypes.length}`);
  console.log(`  Caller types: ${stats.callerTypes.length}`);
  console.log(`  Primary intents: ${stats.primaryIntents.length}`);
  console.log(`  Duration range: ${stats.durationRange[0]}s - ${stats.durationRange[1]}s`);
  console.log(`  Assistant IDs: ${stats.assistantIds.length}`);
  console.log(`  Squad IDs: ${stats.squadIds.length}`);
}

generate();
