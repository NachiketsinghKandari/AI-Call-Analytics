/**
 * CSV export utility for firm call data
 */

import type { FileInfo } from './types';

/** CSV column definitions mapping FileInfo fields to human-readable headers */
const CSV_COLUMNS: { header: string; getValue: (file: FileInfo) => string }[] = [
  { header: 'Call ID', getValue: (f) => f.callId },
  { header: 'File Name', getValue: (f) => f.name },
  { header: 'Caller Type', getValue: (f) => f.caller_type },
  { header: 'Primary Intent', getValue: (f) => f.primary_intent ?? '' },
  { header: 'Resolution Achieved', getValue: (f) => f.resolution_achieved === null ? '' : String(f.resolution_achieved) },
  { header: 'Resolution Type', getValue: (f) => f.resolution_type },
  { header: 'Transfer Success', getValue: (f) => f.transfer_success === null ? '' : String(f.transfer_success) },
  { header: 'Transfer Destination', getValue: (f) => f.transfer_destination ?? '' },
  { header: 'Secondary Action', getValue: (f) => f.secondary_action ?? '' },
  { header: 'Call Duration (seconds)', getValue: (f) => f.call_duration === null ? '' : String(f.call_duration) },
  { header: 'Final Outcome', getValue: (f) => f.final_outcome },
  { header: 'Multi-Case Details', getValue: (f) => {
    const val = f.data?.call_summary?.multi_case_details;
    return val === null || val === undefined ? '' : String(val);
  }},
  { header: 'Resolution Basis', getValue: (f) => f.data?.call_summary?.resolution_basis ?? '' },
  { header: 'Operational Terminal State', getValue: (f) => f.data?.call_summary?.operational_terminal_state ?? '' },
  { header: 'Call Duration (formatted)', getValue: (f) => f.data?.call_summary?.call_duration_formatted ?? '' },
  { header: 'Assistant ID', getValue: (f) => f.assistantId ?? '' },
  { header: 'Squad ID', getValue: (f) => f.squadId ?? '' },
];

/** Escape a value for CSV (handles commas, quotes, newlines) */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Convert FileInfo array to CSV string */
export function filesToCsv(files: FileInfo[]): string {
  const headerRow = CSV_COLUMNS.map((col) => escapeCsvValue(col.header)).join(',');
  const dataRows = files.map((file) =>
    CSV_COLUMNS.map((col) => escapeCsvValue(col.getValue(file))).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
}

/** Trigger a CSV file download in the browser */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Export a firm's call data as a CSV file */
export function exportFirmCsv(files: FileInfo[], firmName: string): void {
  const csv = filesToCsv(files);
  const safeName = firmName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  downloadCsv(csv, `${safeName}_call_data_${date}.csv`);
}
