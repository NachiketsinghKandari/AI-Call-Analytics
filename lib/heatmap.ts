// Heatmap data aggregation - ported from Python heatmap_visualizer.py
import type { FileInfo, HeatmapData, HeatmapDimension } from './types';

/**
 * Get dimension value from a file
 */
function getDimensionValue(file: FileInfo, dimension: HeatmapDimension): string {
  switch (dimension) {
    case 'resolution':
      return file.resolution_type || 'unknown';
    case 'caller':
      return file.caller_type || 'unknown';
    case 'intent':
      return file.primary_intent || 'unknown';
  }
}

/**
 * Aggregate files into heatmap data for two dimensions
 */
export function aggregateHeatmapData(
  files: FileInfo[],
  xDimension: HeatmapDimension,
  yDimension: HeatmapDimension
): HeatmapData {
  const counts = new Map<string, number>();
  const xLabelsSet = new Set<string>();
  const yLabelsSet = new Set<string>();

  // Count occurrences
  for (const file of files) {
    const xVal = getDimensionValue(file, xDimension);
    const yVal = getDimensionValue(file, yDimension);
    const key = `${xVal}|${yVal}`;

    xLabelsSet.add(xVal);
    yLabelsSet.add(yVal);

    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const xLabels = Array.from(xLabelsSet).sort();
  const yLabels = Array.from(yLabelsSet).sort();

  // Build cells
  const total = files.length;
  let maxValue = 0;
  const cells: HeatmapData['cells'] = [];

  for (const y of yLabels) {
    for (const x of xLabels) {
      const key = `${x}|${y}`;
      const value = counts.get(key) || 0;
      maxValue = Math.max(maxValue, value);

      cells.push({
        x,
        y,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      });
    }
  }

  return {
    cells,
    xLabels,
    yLabels,
    maxValue,
    total,
  };
}

/**
 * Get human-readable dimension name
 */
export function getDimensionName(dimension: HeatmapDimension): string {
  switch (dimension) {
    case 'resolution':
      return 'Resolution Type';
    case 'caller':
      return 'Caller Type';
    case 'intent':
      return 'Primary Intent';
  }
}

/**
 * Preset heatmap configurations
 */
export const HEATMAP_PRESETS = [
  {
    id: 'resolution_caller',
    label: 'Resolution vs Caller',
    xDimension: 'resolution' as HeatmapDimension,
    yDimension: 'caller' as HeatmapDimension,
  },
  {
    id: 'resolution_intent',
    label: 'Resolution vs Intent',
    xDimension: 'resolution' as HeatmapDimension,
    yDimension: 'intent' as HeatmapDimension,
  },
  {
    id: 'caller_intent',
    label: 'Caller vs Intent',
    xDimension: 'caller' as HeatmapDimension,
    yDimension: 'intent' as HeatmapDimension,
  },
];
