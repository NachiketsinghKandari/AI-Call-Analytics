// TypeScript interfaces for Resolution Analytics
// Ported from Python call_analysis.py

export interface CallSummary {
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

export interface TransferContext {
  destinations: string[];
  transfer_connection_status: boolean[];
  reasons: string[];
  description: string | null;
}

export interface CallData {
  caller_type: string;
  call_summary: CallSummary;
  transfer_context?: TransferContext;
}

export interface FileInfo {
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
}

export type AchievedStatus = 'resolved' | 'unresolved' | 'unknown';
export type TransferStatus = 'successful' | 'failed' | 'no_transfer';
export type MultiCaseStatus = 'true' | 'false' | 'unknown';

export interface FilterState {
  resolutionTypes: string[];
  achievedStatus: AchievedStatus[];
  callerTypes: string[];
  primaryIntents: string[];
  transferStatus: TransferStatus[];
  durationRange: [number, number];
  multiCase: MultiCaseStatus[];
}

export interface DataStats {
  totalFiles: number;
  resolutionTypes: string[];
  callerTypes: string[];
  primaryIntents: string[];
  durationRange: [number, number];
}

// Sankey diagram types
export interface SankeyNode {
  id: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  depth: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color: string;
  sourceFiles: FileInfo[];
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// Sankey preset types
export type SankeyPreset = 'resolution' | 'transfer' | 'caller' | 'intent' | 'custom';

export interface CustomSankeyOptions {
  showCallerType: boolean;
  showIntent: boolean;
  showResolutionStatus: boolean;
  showResolutionType: boolean;
  showTransferStatus: boolean;
  showDestination: boolean;
  showSecondaryAction: boolean;
}

export interface SankeyOptions {
  preset: SankeyPreset;
  customOptions?: CustomSankeyOptions;
}

// Heatmap types
export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
  percentage: number;
}

export interface HeatmapData {
  cells: HeatmapCell[];
  xLabels: string[];
  yLabels: string[];
  maxValue: number;
  total: number;
}

export type HeatmapDimension = 'resolution' | 'caller' | 'intent';
