// Sankey diagram data transformation with preset-based flows
import type { FileInfo, SankeyNode, SankeyLink, SankeyData, SankeyOptions, SankeyPreset, CustomSankeyOptions } from './types';

// Semantic color palette
const COLORS = {
  allCalls: '#6366f1', // indigo
  resolved: '#22c55e', // green
  unresolved: '#ef4444', // red
  unknown: '#94a3b8', // gray
  transferSuccess: '#10b981', // emerald
  transferFailed: '#f97316', // orange
  // Resolution types - blues and purples
  resolutionTypes: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#06b6d4', '#0ea5e9', '#14b8a6', '#10b981'],
  // Caller types
  callerTypes: {
    insurance_rep: '#6366f1', // indigo
    customer: '#0ea5e9', // sky
    provider: '#f59e0b', // amber
    unknown: '#94a3b8', // gray
    default: '#8b5cf6', // violet
  },
  // Intent colors - warm to cool gradient
  intents: ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'],
  // Destination colors
  destinations: ['#10b981', '#059669', '#047857', '#065f46', '#22c55e', '#16a34a', '#15803d'],
  // Secondary action colors
  actions: ['#0ea5e9', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'],
};

function getCallerTypeColor(callerType: string): string {
  const ct = callerType.toLowerCase();
  if (ct.includes('insurance')) return COLORS.callerTypes.insurance_rep;
  if (ct.includes('customer')) return COLORS.callerTypes.customer;
  if (ct.includes('provider')) return COLORS.callerTypes.provider;
  if (ct === 'unknown') return COLORS.callerTypes.unknown;
  return COLORS.callerTypes.default;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = map.get(key) || [];
    existing.push(item);
    map.set(key, existing);
  }
  return map;
}

// ============================================
// PRESET 1: Resolution Overview
// All Calls → Resolved/Unresolved → Resolution Types
// ============================================
function buildResolutionFlow(files: FileInfo[]): SankeyData {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];
  const total = files.length;

  if (total === 0) return { nodes, links };

  // Layer 0: All Calls
  nodes.push({
    id: 'all_calls',
    label: `All Calls (${total})`,
    count: total,
    percentage: 100,
    color: COLORS.allCalls,
    depth: 0,
  });

  // Layer 1: Resolution Status
  const resolvedFiles = files.filter((f) => f.resolution_achieved === true);
  const unresolvedFiles = files.filter((f) => f.resolution_achieved === false);
  const unknownFiles = files.filter((f) => f.resolution_achieved === null);

  if (resolvedFiles.length > 0) {
    const pct = (resolvedFiles.length / total) * 100;
    nodes.push({
      id: 'resolved',
      label: `Resolved (${resolvedFiles.length}, ${pct.toFixed(1)}%)`,
      count: resolvedFiles.length,
      percentage: pct,
      color: COLORS.resolved,
      depth: 1,
    });
    links.push({
      source: 'all_calls',
      target: 'resolved',
      value: resolvedFiles.length,
      color: hexToRgba(COLORS.resolved, 0.4),
      sourceFiles: resolvedFiles,
    });
  }

  if (unresolvedFiles.length > 0) {
    const pct = (unresolvedFiles.length / total) * 100;
    nodes.push({
      id: 'unresolved',
      label: `Unresolved (${unresolvedFiles.length}, ${pct.toFixed(1)}%)`,
      count: unresolvedFiles.length,
      percentage: pct,
      color: COLORS.unresolved,
      depth: 1,
    });
    links.push({
      source: 'all_calls',
      target: 'unresolved',
      value: unresolvedFiles.length,
      color: hexToRgba(COLORS.unresolved, 0.4),
      sourceFiles: unresolvedFiles,
    });
  }

  if (unknownFiles.length > 0) {
    const pct = (unknownFiles.length / total) * 100;
    nodes.push({
      id: 'unknown',
      label: `Unknown (${unknownFiles.length}, ${pct.toFixed(1)}%)`,
      count: unknownFiles.length,
      percentage: pct,
      color: COLORS.unknown,
      depth: 1,
    });
    links.push({
      source: 'all_calls',
      target: 'unknown',
      value: unknownFiles.length,
      color: hexToRgba(COLORS.unknown, 0.4),
      sourceFiles: unknownFiles,
    });
  }

  // Layer 2: Resolution Types (from resolved)
  const resolvedByType = groupBy(resolvedFiles, (f) => f.resolution_type);
  const sortedTypes = Array.from(resolvedByType.entries()).sort((a, b) => b[1].length - a[1].length);

  sortedTypes.forEach(([resType, typeFiles], idx) => {
    const pct = (typeFiles.length / resolvedFiles.length) * 100;
    const nodeId = `res_type_${resType}`;
    const color = COLORS.resolutionTypes[idx % COLORS.resolutionTypes.length];

    nodes.push({
      id: nodeId,
      label: `${resType.replace(/_/g, ' ')} (${typeFiles.length}, ${pct.toFixed(1)}%)`,
      count: typeFiles.length,
      percentage: pct,
      color,
      depth: 2,
    });

    links.push({
      source: 'resolved',
      target: nodeId,
      value: typeFiles.length,
      color: hexToRgba(color, 0.4),
      sourceFiles: typeFiles,
    });
  });

  // Layer 2: Unresolved Types
  const unresolvedByType = groupBy(unresolvedFiles, (f) => f.resolution_type);
  const sortedUnresTypes = Array.from(unresolvedByType.entries()).sort((a, b) => b[1].length - a[1].length);

  sortedUnresTypes.forEach(([resType, typeFiles], idx) => {
    const pct = (typeFiles.length / unresolvedFiles.length) * 100;
    const nodeId = `unres_type_${resType}`;
    const color = COLORS.resolutionTypes[(idx + 4) % COLORS.resolutionTypes.length];

    nodes.push({
      id: nodeId,
      label: `${resType.replace(/_/g, ' ')} (${typeFiles.length}, ${pct.toFixed(1)}%)`,
      count: typeFiles.length,
      percentage: pct,
      color,
      depth: 2,
    });

    links.push({
      source: 'unresolved',
      target: nodeId,
      value: typeFiles.length,
      color: hexToRgba(color, 0.4),
      sourceFiles: typeFiles,
    });
  });

  return { nodes, links };
}

// ============================================
// PRESET 2: Transfer Deep-Dive
// Transfer Calls → Connected/Failed → Destinations → Actions
// ============================================
function buildTransferFlow(files: FileInfo[]): SankeyData {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  // Filter to only transfer-related calls
  const transferFiles = files.filter(
    (f) => f.resolution_type === 'transfer' || f.resolution_type === 'transfer_attempted' || f.transfer_success !== null
  );
  const total = transferFiles.length;

  if (total === 0) return { nodes, links };

  // Layer 0: All Transfers
  nodes.push({
    id: 'all_transfers',
    label: `All Transfers (${total})`,
    count: total,
    percentage: 100,
    color: COLORS.allCalls,
    depth: 0,
  });

  // Layer 1: Transfer Outcomes
  const connectedFiles = transferFiles.filter((f) => f.transfer_success === true);
  const failedFiles = transferFiles.filter((f) => f.transfer_success === false);
  const unknownFiles = transferFiles.filter((f) => f.transfer_success === null);

  if (connectedFiles.length > 0) {
    const pct = (connectedFiles.length / total) * 100;
    nodes.push({
      id: 'connected',
      label: `Connected (${connectedFiles.length}, ${pct.toFixed(1)}%)`,
      count: connectedFiles.length,
      percentage: pct,
      color: COLORS.transferSuccess,
      depth: 1,
    });
    links.push({
      source: 'all_transfers',
      target: 'connected',
      value: connectedFiles.length,
      color: hexToRgba(COLORS.transferSuccess, 0.4),
      sourceFiles: connectedFiles,
    });
  }

  if (failedFiles.length > 0) {
    const pct = (failedFiles.length / total) * 100;
    nodes.push({
      id: 'failed',
      label: `Failed (${failedFiles.length}, ${pct.toFixed(1)}%)`,
      count: failedFiles.length,
      percentage: pct,
      color: COLORS.transferFailed,
      depth: 1,
    });
    links.push({
      source: 'all_transfers',
      target: 'failed',
      value: failedFiles.length,
      color: hexToRgba(COLORS.transferFailed, 0.4),
      sourceFiles: failedFiles,
    });
  }

  if (unknownFiles.length > 0) {
    const pct = (unknownFiles.length / total) * 100;
    nodes.push({
      id: 'transfer_unknown',
      label: `Unknown (${unknownFiles.length}, ${pct.toFixed(1)}%)`,
      count: unknownFiles.length,
      percentage: pct,
      color: COLORS.unknown,
      depth: 1,
    });
    links.push({
      source: 'all_transfers',
      target: 'transfer_unknown',
      value: unknownFiles.length,
      color: hexToRgba(COLORS.unknown, 0.4),
      sourceFiles: unknownFiles,
    });
  }

  // Layer 2: Destinations (from connected)
  const connectedByDest = groupBy(connectedFiles, (f) => f.transfer_destination || 'Unknown');
  const sortedDests = Array.from(connectedByDest.entries()).sort((a, b) => b[1].length - a[1].length);

  sortedDests.forEach(([dest, destFiles], idx) => {
    const pct = (destFiles.length / connectedFiles.length) * 100;
    const nodeId = `dest_${dest.replace(/\s+/g, '_')}`;
    const color = COLORS.destinations[idx % COLORS.destinations.length];

    nodes.push({
      id: nodeId,
      label: `${dest.replace(/_/g, ' ')} (${destFiles.length}, ${pct.toFixed(1)}%)`,
      count: destFiles.length,
      percentage: pct,
      color,
      depth: 2,
    });

    links.push({
      source: 'connected',
      target: nodeId,
      value: destFiles.length,
      color: hexToRgba(color, 0.4),
      sourceFiles: destFiles,
    });
  });

  // Layer 2: Failed destinations
  const failedByDest = groupBy(failedFiles, (f) => f.transfer_destination || 'Unknown');
  const sortedFailedDests = Array.from(failedByDest.entries()).sort((a, b) => b[1].length - a[1].length);

  sortedFailedDests.forEach(([dest, destFiles], idx) => {
    const pct = (destFiles.length / failedFiles.length) * 100;
    const nodeId = `failed_dest_${dest.replace(/\s+/g, '_')}`;
    const color = COLORS.transferFailed;

    nodes.push({
      id: nodeId,
      label: `${dest.replace(/_/g, ' ')} (${destFiles.length}, ${pct.toFixed(1)}%)`,
      count: destFiles.length,
      percentage: pct,
      color,
      depth: 2,
    });

    links.push({
      source: 'failed',
      target: nodeId,
      value: destFiles.length,
      color: hexToRgba(color, 0.4),
      sourceFiles: destFiles,
    });
  });

  // Layer 3: Secondary Actions (from connected destinations)
  sortedDests.forEach(([dest, destFiles]) => {
    const destNodeId = `dest_${dest.replace(/\s+/g, '_')}`;
    const withActions = destFiles.filter((f) => f.secondary_action && f.secondary_action !== 'no_secondary_action');

    if (withActions.length > 0) {
      const byAction = groupBy(withActions, (f) => f.secondary_action!);
      Array.from(byAction.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .forEach(([action, actionFiles], idx) => {
          const pct = (actionFiles.length / destFiles.length) * 100;
          const nodeId = `action_${dest}_${action}`.replace(/\s+/g, '_');
          const color = COLORS.actions[idx % COLORS.actions.length];

          // Check if node already exists
          if (!nodes.find((n) => n.id === nodeId)) {
            nodes.push({
              id: nodeId,
              label: `${action.replace(/_/g, ' ')} (${actionFiles.length})`,
              count: actionFiles.length,
              percentage: pct,
              color,
              depth: 3,
            });
          }

          links.push({
            source: destNodeId,
            target: nodeId,
            value: actionFiles.length,
            color: hexToRgba(color, 0.4),
            sourceFiles: actionFiles,
          });
        });
    }
  });

  return { nodes, links };
}

// ============================================
// PRESET 3: Caller Analysis
// All Calls → Caller Types → Resolved/Unresolved → Resolution Types
// ============================================
function buildCallerFlow(files: FileInfo[]): SankeyData {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];
  const total = files.length;

  if (total === 0) return { nodes, links };

  // Layer 0: All Calls
  nodes.push({
    id: 'all_calls',
    label: `All Calls (${total})`,
    count: total,
    percentage: 100,
    color: COLORS.allCalls,
    depth: 0,
  });

  // Layer 1: Caller Types
  const byCallerType = groupBy(files, (f) => f.caller_type);
  const sortedCallers = Array.from(byCallerType.entries()).sort((a, b) => b[1].length - a[1].length);

  sortedCallers.forEach(([callerType, callerFiles]) => {
    const pct = (callerFiles.length / total) * 100;
    const nodeId = `caller_${callerType}`;
    const color = getCallerTypeColor(callerType);

    nodes.push({
      id: nodeId,
      label: `${callerType.replace(/_/g, ' ')} (${callerFiles.length}, ${pct.toFixed(1)}%)`,
      count: callerFiles.length,
      percentage: pct,
      color,
      depth: 1,
    });

    links.push({
      source: 'all_calls',
      target: nodeId,
      value: callerFiles.length,
      color: hexToRgba(color, 0.4),
      sourceFiles: callerFiles,
    });

    // Layer 2: Resolved/Unresolved per caller type
    const resolved = callerFiles.filter((f) => f.resolution_achieved === true);
    const unresolved = callerFiles.filter((f) => f.resolution_achieved === false);

    if (resolved.length > 0) {
      const resPct = (resolved.length / callerFiles.length) * 100;
      const resNodeId = `${nodeId}_resolved`;

      nodes.push({
        id: resNodeId,
        label: `Resolved (${resolved.length}, ${resPct.toFixed(1)}%)`,
        count: resolved.length,
        percentage: resPct,
        color: COLORS.resolved,
        depth: 2,
      });

      links.push({
        source: nodeId,
        target: resNodeId,
        value: resolved.length,
        color: hexToRgba(COLORS.resolved, 0.4),
        sourceFiles: resolved,
      });

      // Layer 3: Resolution Types per resolved
      const byType = groupBy(resolved, (f) => f.resolution_type);
      Array.from(byType.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 5) // Top 5 types per caller
        .forEach(([resType, typeFiles], idx) => {
          const typePct = (typeFiles.length / resolved.length) * 100;
          const typeNodeId = `${resNodeId}_${resType}`;
          const typeColor = COLORS.resolutionTypes[idx % COLORS.resolutionTypes.length];

          nodes.push({
            id: typeNodeId,
            label: `${resType.replace(/_/g, ' ')} (${typeFiles.length})`,
            count: typeFiles.length,
            percentage: typePct,
            color: typeColor,
            depth: 3,
          });

          links.push({
            source: resNodeId,
            target: typeNodeId,
            value: typeFiles.length,
            color: hexToRgba(typeColor, 0.4),
            sourceFiles: typeFiles,
          });
        });
    }

    if (unresolved.length > 0) {
      const unresPct = (unresolved.length / callerFiles.length) * 100;
      const unresNodeId = `${nodeId}_unresolved`;

      nodes.push({
        id: unresNodeId,
        label: `Unresolved (${unresolved.length}, ${unresPct.toFixed(1)}%)`,
        count: unresolved.length,
        percentage: unresPct,
        color: COLORS.unresolved,
        depth: 2,
      });

      links.push({
        source: nodeId,
        target: unresNodeId,
        value: unresolved.length,
        color: hexToRgba(COLORS.unresolved, 0.4),
        sourceFiles: unresolved,
      });
    }
  });

  return { nodes, links };
}

// ============================================
// PRESET 4: Intent Journey
// All Calls → Primary Intents → Resolved/Unresolved → Resolution Types
// ============================================
function buildIntentFlow(files: FileInfo[]): SankeyData {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];
  const total = files.length;

  if (total === 0) return { nodes, links };

  // Layer 0: All Calls
  nodes.push({
    id: 'all_calls',
    label: `All Calls (${total})`,
    count: total,
    percentage: 100,
    color: COLORS.allCalls,
    depth: 0,
  });

  // Layer 1: Primary Intents
  const byIntent = groupBy(files, (f) => f.primary_intent || 'Unknown');
  const sortedIntents = Array.from(byIntent.entries()).sort((a, b) => b[1].length - a[1].length);

  sortedIntents.forEach(([intent, intentFiles], idx) => {
    const pct = (intentFiles.length / total) * 100;
    const nodeId = `intent_${intent.replace(/\s+/g, '_')}`;
    const color = COLORS.intents[idx % COLORS.intents.length];

    nodes.push({
      id: nodeId,
      label: `${intent.replace(/_/g, ' ')} (${intentFiles.length}, ${pct.toFixed(1)}%)`,
      count: intentFiles.length,
      percentage: pct,
      color,
      depth: 1,
    });

    links.push({
      source: 'all_calls',
      target: nodeId,
      value: intentFiles.length,
      color: hexToRgba(color, 0.4),
      sourceFiles: intentFiles,
    });

    // Layer 2: Resolved/Unresolved per intent
    const resolved = intentFiles.filter((f) => f.resolution_achieved === true);
    const unresolved = intentFiles.filter((f) => f.resolution_achieved === false);

    if (resolved.length > 0) {
      const resPct = (resolved.length / intentFiles.length) * 100;
      const resNodeId = `${nodeId}_resolved`;

      nodes.push({
        id: resNodeId,
        label: `Resolved (${resolved.length}, ${resPct.toFixed(1)}%)`,
        count: resolved.length,
        percentage: resPct,
        color: COLORS.resolved,
        depth: 2,
      });

      links.push({
        source: nodeId,
        target: resNodeId,
        value: resolved.length,
        color: hexToRgba(COLORS.resolved, 0.4),
        sourceFiles: resolved,
      });

      // Layer 3: Resolution Types per resolved intent
      const byType = groupBy(resolved, (f) => f.resolution_type);
      Array.from(byType.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 4) // Top 4 types per intent
        .forEach(([resType, typeFiles], typeIdx) => {
          const typePct = (typeFiles.length / resolved.length) * 100;
          const typeNodeId = `${resNodeId}_${resType}`;
          const typeColor = COLORS.resolutionTypes[typeIdx % COLORS.resolutionTypes.length];

          nodes.push({
            id: typeNodeId,
            label: `${resType.replace(/_/g, ' ')} (${typeFiles.length})`,
            count: typeFiles.length,
            percentage: typePct,
            color: typeColor,
            depth: 3,
          });

          links.push({
            source: resNodeId,
            target: typeNodeId,
            value: typeFiles.length,
            color: hexToRgba(typeColor, 0.4),
            sourceFiles: typeFiles,
          });
        });
    }

    if (unresolved.length > 0) {
      const unresPct = (unresolved.length / intentFiles.length) * 100;
      const unresNodeId = `${nodeId}_unresolved`;

      nodes.push({
        id: unresNodeId,
        label: `Unresolved (${unresolved.length}, ${unresPct.toFixed(1)}%)`,
        count: unresolved.length,
        percentage: unresPct,
        color: COLORS.unresolved,
        depth: 2,
      });

      links.push({
        source: nodeId,
        target: unresNodeId,
        value: unresolved.length,
        color: hexToRgba(COLORS.unresolved, 0.4),
        sourceFiles: unresolved,
      });
    }
  });

  return { nodes, links };
}

// ============================================
// PRESET 5: Custom Flow
// Dynamically builds layers based on toggle options
// ============================================
function buildCustomFlow(files: FileInfo[], options: CustomSankeyOptions): SankeyData {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];
  const total = files.length;

  if (total === 0) return { nodes, links };

  // Track parent nodes for each layer to connect to
  type ParentNode = { id: string; files: FileInfo[]; depth: number };
  let parentNodes: ParentNode[] = [];
  let currentDepth = 0;

  // Layer 0: All Calls (always present)
  nodes.push({
    id: 'all_calls',
    label: `All Calls (${total})`,
    count: total,
    percentage: 100,
    color: COLORS.allCalls,
    depth: currentDepth,
  });
  parentNodes = [{ id: 'all_calls', files, depth: 0 }];
  currentDepth++;

  // Helper to add a layer based on a grouping function
  // Optional filterFn: filters which files to include, but percentage is ALWAYS relative to original parent
  const addLayer = (
    groupFn: (f: FileInfo) => string,
    colorFn: (key: string, idx: number) => string,
    labelFn: (key: string) => string,
    filterFn?: (f: FileInfo) => boolean
  ) => {
    const newParentNodes: ParentNode[] = [];

    for (const parent of parentNodes) {
      // Apply optional filter, but keep original count for percentage calculation
      const originalCount = parent.files.length;
      const filesToGroup = filterFn ? parent.files.filter(filterFn) : parent.files;

      const grouped = groupBy(filesToGroup, groupFn);
      const sorted = Array.from(grouped.entries()).sort((a, b) => b[1].length - a[1].length);

      sorted.forEach(([key, groupFiles], idx) => {
        // Percentage is ALWAYS relative to the original parent count
        const pct = (groupFiles.length / originalCount) * 100;
        const nodeId = `${parent.id}_${key.replace(/\s+/g, '_')}`;
        const color = colorFn(key, idx);

        // Check if node already exists (avoid duplicates)
        if (!nodes.find((n) => n.id === nodeId)) {
          nodes.push({
            id: nodeId,
            label: `${labelFn(key)} (${groupFiles.length}, ${pct.toFixed(1)}%)`,
            count: groupFiles.length,
            percentage: pct,
            color,
            depth: currentDepth,
          });
        }

        links.push({
          source: parent.id,
          target: nodeId,
          value: groupFiles.length,
          color: hexToRgba(color, 0.4),
          sourceFiles: groupFiles,
        });

        newParentNodes.push({ id: nodeId, files: groupFiles, depth: currentDepth });
      });
    }

    parentNodes = newParentNodes;
    currentDepth++;
  };

  // Layer: Caller Type
  if (options.showCallerType) {
    addLayer(
      (f) => f.caller_type,
      (key) => getCallerTypeColor(key),
      (key) => key.replace(/_/g, ' ')
    );
  }

  // Layer: Intent
  if (options.showIntent) {
    addLayer(
      (f) => f.primary_intent || 'Unknown',
      (_, idx) => COLORS.intents[idx % COLORS.intents.length],
      (key) => key.replace(/_/g, ' ')
    );
  }

  // Layer: Resolution Status
  if (options.showResolutionStatus) {
    addLayer(
      (f) => {
        if (f.resolution_achieved === true) return 'Resolved';
        if (f.resolution_achieved === false) return 'Unresolved';
        return 'Unknown';
      },
      (key) => {
        if (key === 'Resolved') return COLORS.resolved;
        if (key === 'Unresolved') return COLORS.unresolved;
        return COLORS.unknown;
      },
      (key) => key
    );
  }

  // Layer: Resolution Type
  if (options.showResolutionType) {
    addLayer(
      (f) => f.resolution_type,
      (_, idx) => COLORS.resolutionTypes[idx % COLORS.resolutionTypes.length],
      (key) => key.replace(/_/g, ' ')
    );
  }

  // Filter functions for transfer-related layers
  const isTransferCall = (f: FileInfo) =>
    f.resolution_type === 'transfer' ||
    f.resolution_type === 'transfer_attempted' ||
    f.transfer_success !== null;

  const hasSecondaryAction = (f: FileInfo) =>
    f.secondary_action != null && f.secondary_action !== 'no_secondary_action';

  // Layer: Transfer Status (only for transfer calls, percentage relative to parent)
  if (options.showTransferStatus) {
    addLayer(
      (f) => {
        if (f.transfer_success === true) return 'Connected';
        if (f.transfer_success === false) return 'Failed';
        return 'Unknown';
      },
      (key) => {
        if (key === 'Connected') return COLORS.transferSuccess;
        if (key === 'Failed') return COLORS.transferFailed;
        return COLORS.unknown;
      },
      (key) => key,
      isTransferCall // Filter to transfer calls, but % is relative to original parent
    );
  }

  // Layer: Destination (only for transfer calls with destinations)
  if (options.showDestination) {
    addLayer(
      (f) => f.transfer_destination || 'Unknown Destination',
      (_, idx) => COLORS.destinations[idx % COLORS.destinations.length],
      (key) => key.replace(/_/g, ' '),
      isTransferCall
    );
  }

  // Layer: Secondary Action (only for files with secondary actions)
  if (options.showSecondaryAction) {
    addLayer(
      (f) => f.secondary_action!,
      (_, idx) => COLORS.actions[idx % COLORS.actions.length],
      (key) => key.replace(/_/g, ' '),
      hasSecondaryAction // Filter to files with actions, but % is relative to original parent
    );
  }

  return { nodes, links };
}

// ============================================
// Main Entry Point
// ============================================
export function buildSankeyData(files: FileInfo[], options: SankeyOptions): SankeyData {
  switch (options.preset) {
    case 'resolution':
      return buildResolutionFlow(files);
    case 'transfer':
      return buildTransferFlow(files);
    case 'caller':
      return buildCallerFlow(files);
    case 'intent':
      return buildIntentFlow(files);
    case 'custom':
      return buildCustomFlow(files, options.customOptions || {
        showCallerType: true,
        showIntent: false,
        showResolutionStatus: true,
        showResolutionType: true,
        showTransferStatus: false,
        showDestination: false,
        showSecondaryAction: false,
      });
    default:
      return buildResolutionFlow(files);
  }
}
