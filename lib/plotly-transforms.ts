// Plotly data transformation utilities
import type { FileInfo, SankeyData, SankeyOptions } from './types';
import { buildSankeyData } from './sankey';
import type { Data, Layout } from 'plotly.js';

// Color palette
const COLORS = {
  allCalls: '#6366f1',
  resolved: '#22c55e',
  unresolved: '#ef4444',
  unknown: '#94a3b8',
  transferSuccess: '#10b981',
  transferFailed: '#f97316',
  resolutionTypes: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#06b6d4', '#0ea5e9', '#14b8a6', '#10b981'],
  callerTypes: ['#6366f1', '#0ea5e9', '#f59e0b', '#94a3b8', '#8b5cf6'],
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface PlotlySankeyData {
  trace: Data;
  layout: Partial<Layout>;
  nodeToFilesMap: Map<number, FileInfo[]>;
  linkToFilesMap: Map<number, FileInfo[]>;
}

/**
 * Transform SankeyData to Plotly Sankey trace format
 */
export function buildPlotlySankeyTrace(
  files: FileInfo[],
  options: SankeyOptions,
  isDarkMode: boolean = true
): PlotlySankeyData {
  const sankeyData = buildSankeyData(files, options);

  if (sankeyData.nodes.length === 0) {
    return {
      trace: {
        type: 'sankey',
        node: { label: [], color: [] },
        link: { source: [], target: [], value: [], color: [] },
      } as Data,
      layout: {},
      nodeToFilesMap: new Map(),
      linkToFilesMap: new Map(),
    };
  }

  // Create node index map
  const nodeIndexMap = new Map<string, number>();
  sankeyData.nodes.forEach((node, index) => {
    nodeIndexMap.set(node.id, index);
  });

  // Build node arrays
  const nodeLabels = sankeyData.nodes.map((n) => n.label);
  const nodeColors = sankeyData.nodes.map((n) => n.color);

  // Build link arrays
  const sources: number[] = [];
  const targets: number[] = [];
  const values: number[] = [];
  const linkColors: string[] = [];
  const linkLabels: string[] = [];
  const linkToFilesMap = new Map<number, FileInfo[]>();

  sankeyData.links.forEach((link) => {
    const sourceIdx = nodeIndexMap.get(link.source);
    const targetIdx = nodeIndexMap.get(link.target);

    if (sourceIdx !== undefined && targetIdx !== undefined) {
      // Use current array length as index BEFORE pushing - this matches Plotly's pointNumber
      const arrayIndex = sources.length;

      sources.push(sourceIdx);
      targets.push(targetIdx);
      values.push(link.value);
      linkColors.push(link.color);

      const sourceNode = sankeyData.nodes[sourceIdx];
      const targetNode = sankeyData.nodes[targetIdx];
      linkLabels.push(`${sourceNode.label.split(' (')[0]} → ${targetNode.label.split(' (')[0]}`);

      linkToFilesMap.set(arrayIndex, link.sourceFiles);
    }
  });

  // Build node to files map (aggregate all links coming into each node)
  const nodeToFilesMap = new Map<number, FileInfo[]>();
  sankeyData.links.forEach((link) => {
    const targetIdx = nodeIndexMap.get(link.target);
    if (targetIdx !== undefined) {
      const existing = nodeToFilesMap.get(targetIdx) || [];
      existing.push(...link.sourceFiles);
      nodeToFilesMap.set(targetIdx, existing);
    }
  });

  const textColor = isDarkMode ? '#e2e8f0' : '#1a1a2e';

  const trace: Data = {
    type: 'sankey',
    orientation: 'h',
    arrangement: 'freeform',
    node: {
      pad: 20,
      thickness: 25,
      line: { color: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', width: 1 },
      label: nodeLabels,
      color: nodeColors,
      hovertemplate: '%{label}<extra></extra>',
    },
    link: {
      source: sources,
      target: targets,
      value: values,
      color: linkColors,
      hovertemplate: '%{source.label} → %{target.label}<br><b>Count: %{value}</b><br><i>Click to view files</i><extra></extra>',
    },
  };

  const layout: Partial<Layout> = {
    font: {
      size: 12,
      color: textColor,
      family: 'Inter, system-ui, sans-serif',
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    margin: { l: 20, r: 20, t: 20, b: 20 },
  };

  return { trace, layout, nodeToFilesMap, linkToFilesMap };
}

export interface Heatmap3DData {
  trace: Data;
  layout: Partial<Layout>;
  pointToFilesMap: Map<string, FileInfo[]>;
}

/**
 * Build 3D scatter heatmap data from files
 */
export function build3DHeatmapData(
  files: FileInfo[],
  isDarkMode: boolean = true,
  minCount: number = 1
): Heatmap3DData {
  // Get unique values for each dimension
  const resolutionTypes = [...new Set(files.map((f) => f.resolution_type))].sort();
  const callerTypes = [...new Set(files.map((f) => f.caller_type))].sort();
  const primaryIntents = [...new Set(files.map((f) => f.primary_intent || 'Unknown'))].sort();

  // Create index maps
  const resTypeMap = new Map(resolutionTypes.map((v, i) => [v, i]));
  const callerMap = new Map(callerTypes.map((v, i) => [v, i]));
  const intentMap = new Map(primaryIntents.map((v, i) => [v, i]));

  // Group files by all three dimensions
  const groups = new Map<string, FileInfo[]>();
  files.forEach((file) => {
    const key = `${file.resolution_type}|${file.caller_type}|${file.primary_intent || 'Unknown'}`;
    const existing = groups.get(key) || [];
    existing.push(file);
    groups.set(key, existing);
  });

  // Build scatter data
  const xVals: number[] = [];
  const yVals: number[] = [];
  const zVals: number[] = [];
  const sizes: number[] = [];
  const colors: number[] = [];
  const hoverTexts: string[] = [];
  const pointToFilesMap = new Map<string, FileInfo[]>();

  const maxCount = Math.max(...Array.from(groups.values()).map((g) => g.length));

  groups.forEach((groupFiles, key) => {
    const count = groupFiles.length;

    // Filter by minimum count threshold
    if (count < minCount) return;

    const [resType, callerType, intent] = key.split('|');
    const pct = ((count / files.length) * 100).toFixed(1);

    xVals.push(resTypeMap.get(resType) || 0);
    yVals.push(callerMap.get(callerType) || 0);
    zVals.push(intentMap.get(intent) || 0);

    // Size: 8-48 based on count
    sizes.push(8 + (count / maxCount) * 40);
    colors.push(count);

    hoverTexts.push(
      `<b>Count: ${count}</b> (${pct}%)<br>` +
      `Resolution: ${resType.replace(/_/g, ' ')}<br>` +
      `Caller: ${callerType.replace(/_/g, ' ')}<br>` +
      `Intent: ${intent.replace(/_/g, ' ')}`
    );

    pointToFilesMap.set(key, groupFiles);
  });

  const textColor = isDarkMode ? '#e0e0e0' : '#1a1a2e';
  const gridColor = isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(100,100,100,0.3)';
  const zeroLineColor = isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  const bgColor = isDarkMode ? 'rgba(20,20,30,0.3)' : 'rgba(240,245,255,0.5)';

  const trace: Data = {
    type: 'scatter3d',
    mode: 'markers',
    x: xVals,
    y: yVals,
    z: zVals,
    marker: {
      size: sizes,
      color: colors,
      colorscale: 'Plasma',
      opacity: 0.9,
      line: { width: 1.5, color: 'rgba(255,255,255,0.8)' },
      colorbar: {
        title: { text: 'Count', font: { color: textColor } },
        thickness: 20,
        len: 0.7,
        tickfont: { color: textColor },
        outlinewidth: 0,
      },
    },
    text: hoverTexts,
    hoverinfo: 'text',
    hoverlabel: {
      bgcolor: isDarkMode ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
      font: { size: 12, family: 'Inter, sans-serif', color: textColor },
      bordercolor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
    },
  };

  const layout: Partial<Layout> = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'Inter, system-ui, sans-serif', color: textColor },
    margin: { l: 0, r: 0, t: 30, b: 0 },
    scene: {
      xaxis: {
        title: { text: 'Resolution Type', font: { size: 12, color: '#a5b4fc' } },
        ticktext: resolutionTypes.map((t) => t.replace(/_/g, ' ')),
        tickvals: resolutionTypes.map((_, i) => i),
        tickfont: { size: 10, color: textColor },
        showgrid: true,
        gridcolor: gridColor,
        gridwidth: 1,
        zeroline: true,
        zerolinecolor: zeroLineColor,
        showbackground: true,
        backgroundcolor: bgColor,
      },
      yaxis: {
        title: { text: 'Caller Type', font: { size: 12, color: '#d8b4fe' } },
        ticktext: callerTypes.map((t) => t.replace(/_/g, ' ')),
        tickvals: callerTypes.map((_, i) => i),
        tickfont: { size: 10, color: textColor },
        showgrid: true,
        gridcolor: gridColor,
        gridwidth: 1,
        zeroline: true,
        zerolinecolor: zeroLineColor,
        showbackground: true,
        backgroundcolor: bgColor,
      },
      zaxis: {
        title: { text: 'Primary Intent', font: { size: 12, color: '#f9a8d4' } },
        ticktext: primaryIntents.map((t) => t.replace(/_/g, ' ')),
        tickvals: primaryIntents.map((_, i) => i),
        tickfont: { size: 10, color: textColor },
        showgrid: true,
        gridcolor: gridColor,
        gridwidth: 1,
        zeroline: true,
        zerolinecolor: zeroLineColor,
        showbackground: true,
        backgroundcolor: bgColor,
      },
      camera: { eye: { x: 1.8, y: 1.8, z: 1.2 } },
      aspectmode: 'cube',
    },
  };

  return { trace, layout, pointToFilesMap };
}

export interface PlotlyHeatmap2DData {
  trace: Data;
  layout: Partial<Layout>;
}

/**
 * Build 2D Plotly heatmap data
 */
export function buildPlotlyHeatmap2D(
  files: FileInfo[],
  xDimension: 'resolution' | 'caller' | 'intent',
  yDimension: 'resolution' | 'caller' | 'intent',
  isDarkMode: boolean = true
): PlotlyHeatmap2DData {
  const getDimValue = (file: FileInfo, dim: string): string => {
    switch (dim) {
      case 'resolution': return file.resolution_type;
      case 'caller': return file.caller_type;
      case 'intent': return file.primary_intent || 'Unknown';
      default: return 'Unknown';
    }
  };

  const getDimLabel = (dim: string): string => {
    switch (dim) {
      case 'resolution': return 'Resolution Type';
      case 'caller': return 'Caller Type';
      case 'intent': return 'Primary Intent';
      default: return dim;
    }
  };

  // Single-pass: collect unique values and group counts simultaneously
  const xLabelsSet = new Set<string>();
  const yLabelsSet = new Set<string>();
  const cellCounts = new Map<string, number>();
  const total = files.length;

  for (const file of files) {
    const xVal = getDimValue(file, xDimension);
    const yVal = getDimValue(file, yDimension);
    xLabelsSet.add(xVal);
    yLabelsSet.add(yVal);
    const key = `${xVal}|${yVal}`;
    cellCounts.set(key, (cellCounts.get(key) || 0) + 1);
  }

  const xLabels = [...xLabelsSet].sort();
  const yLabels = [...yLabelsSet].sort();

  // Build count matrix using O(1) lookups
  const zData: number[][] = [];
  const textData: string[][] = [];

  for (const yVal of yLabels) {
    const row: number[] = [];
    const textRow: string[] = [];
    for (const xVal of xLabels) {
      const count = cellCounts.get(`${xVal}|${yVal}`) || 0;
      row.push(count);
      if (count > 0) {
        const pct = ((count / total) * 100).toFixed(1);
        textRow.push(`${count}<br>(${pct}%)`);
      } else {
        textRow.push('');
      }
    }
    zData.push(row);
    textData.push(textRow);
  }

  const textColor = isDarkMode ? '#e2e8f0' : '#1a1a2e';

  // Light blue gradient colorscale
  const customColorscale: [number, string][] = isDarkMode
    ? [
        [0, 'rgba(30, 41, 59, 0.2)'],    // slate-800 with low opacity
        [0.2, '#1e3a5f'],                 // dark blue
        [0.4, '#1d4ed8'],                 // blue-700
        [0.6, '#3b82f6'],                 // blue-500
        [0.8, '#60a5fa'],                 // blue-400
        [1, '#93c5fd'],                   // blue-300
      ]
    : [
        [0, 'rgba(241, 245, 249, 0.5)'],  // slate-100 with opacity
        [0.2, '#dbeafe'],                 // blue-100
        [0.4, '#93c5fd'],                 // blue-300
        [0.6, '#60a5fa'],                 // blue-400
        [0.8, '#3b82f6'],                 // blue-500
        [1, '#1d4ed8'],                   // blue-700
      ];

  const trace: Data = {
    type: 'heatmap',
    z: zData,
    x: xLabels.map((l) => l.replace(/_/g, ' ')),
    y: yLabels.map((l) => l.replace(/_/g, ' ')),
    text: textData as unknown as string[],
    texttemplate: '%{text}',
    textfont: { size: 10, color: isDarkMode ? '#fff' : '#1a1a2e' },
    colorscale: customColorscale,
    hovertemplate: '%{y} × %{x}<br>Count: %{z}<extra></extra>',
    colorbar: {
      title: { text: 'Count', font: { color: textColor } },
      tickfont: { color: textColor },
      outlinewidth: 0,
    },
  } as Data;

  const layout: Partial<Layout> = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'Inter, system-ui, sans-serif', color: textColor },
    margin: { l: 220, r: 50, t: 50, b: 120 },
    xaxis: {
      title: { text: getDimLabel(xDimension), font: { color: textColor } },
      tickangle: -45,
      tickfont: { color: textColor, size: 11 },
      showgrid: false,
    },
    yaxis: {
      title: { text: getDimLabel(yDimension), font: { color: textColor }, standoff: 20 },
      tickfont: { color: textColor, size: 11 },
      showgrid: false,
      automargin: true,
    },
  };

  return { trace, layout };
}
