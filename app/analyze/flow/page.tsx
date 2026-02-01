'use client';

import { useMemo, useEffect, useCallback, Suspense } from 'react';
import { useHydrated, useResponsiveChartHeight } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PlotlySankey } from '@/components/charts/PlotlySankey';
import { useCallDataStore } from '@/store/callDataStore';
import { applyAllFilters } from '@/lib/filters';
import { CheckCircle2, XCircle, Phone, Clock, ArrowRightLeft, Target, Settings2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/ShareButton';
import { useUrlState } from '@/hooks/useUrlState';
import { createShareUrl, getBaseUrl } from '@/lib/urlState';
import type { SankeyPreset, CustomSankeyOptions, FileInfo } from '@/lib/types';

// Preset descriptions for the UI
const PRESET_INFO: Record<SankeyPreset, { label: string; description: string }> = {
  resolution: {
    label: 'Resolution Overview',
    description: 'How calls are being resolved',
  },
  transfer: {
    label: 'Transfer Deep-Dive',
    description: 'Transfer outcomes and destinations',
  },
  caller: {
    label: 'Caller Analysis',
    description: 'Who calls and their outcomes',
  },
  intent: {
    label: 'Intent Journey',
    description: 'Why people call and results',
  },
  custom: {
    label: 'Custom',
    description: 'Configure your own layer combination',
  },
};

// Custom toggle options configuration - grouped by category
const GENERAL_TOGGLES: { key: keyof CustomSankeyOptions; label: string }[] = [
  { key: 'showCallerType', label: 'Caller Type' },
  { key: 'showIntent', label: 'Intent' },
  { key: 'showResolutionStatus', label: 'Resolution Status' },
  { key: 'showResolutionType', label: 'Resolution Type' },
];

const TRANSFER_TOGGLES: { key: keyof CustomSankeyOptions; label: string }[] = [
  { key: 'showTransferStatus', label: 'Transfer Status' },
  { key: 'showDestination', label: 'Destination' },
  { key: 'showSecondaryAction', label: 'Secondary Action' },
];

// KPI Card Component
function KPICard({
  title,
  value,
  percentage,
  description,
  icon: Icon,
  colorClass = 'text-foreground',
}: {
  title: string;
  value: string | number;
  percentage?: number;
  description?: string;
  icon?: React.ElementType;
  colorClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <span className={`text-lg sm:text-2xl font-bold ${colorClass}`}>{value}</span>
              {percentage !== undefined && (
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                  ({percentage.toFixed(1)}%)
                </span>
              )}
            </div>
            {description && (
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={`p-1.5 sm:p-2 rounded-lg bg-muted ${colorClass} flex-shrink-0`}>
              <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FlowPageContent() {
  const hydrated = useHydrated();
  const chartHeight = useResponsiveChartHeight(350, 450, 550);
  const { files, filters, stats, dataSource, sankeyOptions, setSankeyOptions, setSelectedFileId } = useCallDataStore();
  const { urlState } = useUrlState();

  // Current preset (from URL or store)
  const currentPreset = sankeyOptions.preset || 'resolution';

  // Generate URLs for sharing (include data source and preset so shared links work)
  const getNavigationUrl = useCallback(() => {
    const url = new URL(getBaseUrl());
    if (dataSource && dataSource !== 'none' && dataSource !== 'uploaded') {
      url.searchParams.set('d', dataSource);
    }
    // Include preset if not default
    if (currentPreset !== 'resolution') {
      url.searchParams.set('p', currentPreset);
    }
    return url.toString();
  }, [dataSource, currentPreset]);

  const getShareUrl = useCallback(() => {
    return createShareUrl(getBaseUrl(), filters, {
      stats: stats ?? undefined,
      dataSource: dataSource !== 'none' && dataSource !== 'uploaded' ? dataSource : undefined,
      preset: currentPreset,
    });
  }, [filters, stats, dataSource, currentPreset]);

  // File-specific URL generators for the modal
  const getFileNavigationUrl = useCallback((file: FileInfo, index: number) => {
    const url = new URL(getBaseUrl());
    if (dataSource && dataSource !== 'none' && dataSource !== 'uploaded') {
      url.searchParams.set('d', dataSource);
    }
    // Include preset if not default
    if (currentPreset !== 'resolution') {
      url.searchParams.set('p', currentPreset);
    }
    url.searchParams.set('c', file.callId);
    url.searchParams.set('i', index.toString());
    return url.toString();
  }, [dataSource, currentPreset]);

  const getFileShareUrl = useCallback((file: FileInfo, index: number) => {
    return createShareUrl(getBaseUrl(), filters, {
      callId: file.callId,
      index,
      stats: stats ?? undefined,
      dataSource: dataSource !== 'none' && dataSource !== 'uploaded' ? dataSource : undefined,
      preset: currentPreset,
    });
  }, [filters, stats, dataSource, currentPreset]);

  const filteredFiles = useMemo(() => {
    return applyAllFilters(files, filters);
  }, [files, filters]);

  // ===================================================================================
  // IMPORTANT: Plotly Click Handler Bug Workaround - Part 2
  // ===================================================================================
  // This preset toggle works in conjunction with PlotlySankey's mount state machine.
  // Plotly's click handlers don't work on initial render - they only start working
  // after a "real" data change happens post-initialization.
  //
  // The PlotlySankey component handles the unmount/remount cycle (0-400ms).
  // This effect then triggers a preset toggle (500-700ms) AFTER that cycle completes,
  // which causes a final re-render with properly bound click handlers.
  //
  // Timeline:
  //   0-400ms:   PlotlySankey mount cycle (waiting -> mounted -> remounting -> ready)
  //   500ms:     This effect switches preset to an adjacent preset
  //   700ms:     This effect switches back to the target preset (from URL or default)
  //   After:     Click handlers work correctly
  //
  // DO NOT REMOVE OR "OPTIMIZE" THIS - it's not a bug, it's a bug prevention mechanism.
  // Without this, users cannot click on Sankey links to see file details.
  // ===================================================================================
  useEffect(() => {
    // Determine target preset: from URL if present, otherwise 'resolution'
    const targetPreset = urlState.preset || 'resolution';

    // Get an adjacent preset for the toggle (different from target)
    const presetOrder: SankeyPreset[] = ['resolution', 'transfer', 'caller', 'intent', 'custom'];
    const targetIndex = presetOrder.indexOf(targetPreset as SankeyPreset);
    const adjacentPreset = presetOrder[(targetIndex + 1) % presetOrder.length];

    console.log('[FlowPage] Mount effect triggered');
    console.log('[FlowPage] Current state - files:', files.length, 'hydrated:', hydrated, 'preset:', sankeyOptions.preset);
    console.log('[FlowPage] Target preset from URL:', targetPreset, '-> Will toggle:', targetPreset, '->', adjacentPreset, '->', targetPreset);

    // Wait for PlotlySankey mount cycle to complete (400ms), then toggle
    // Step 1: Switch to adjacent preset (at 500ms, after mount cycle)
    const timer1 = setTimeout(() => {
      console.log('[FlowPage] AUTO-TOGGLE Step 1: Switching to', adjacentPreset);
      setSankeyOptions({ preset: adjacentPreset });
    }, 500);

    // Step 2: Switch back to target preset (at 700ms)
    const timer2 = setTimeout(() => {
      console.log('[FlowPage] AUTO-TOGGLE Step 2: Switching back to', targetPreset);
      setSankeyOptions({ preset: targetPreset as SankeyPreset });
      console.log('[FlowPage] AUTO-TOGGLE Complete - click handlers should work now');
    }, 700);

    return () => {
      console.log('[FlowPage] Cleanup - clearing timers');
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get custom options with defaults
  const customOptions: CustomSankeyOptions = sankeyOptions.customOptions || {
    showCallerType: true,
    showIntent: false,
    showResolutionStatus: true,
    showResolutionType: true,
    showTransferStatus: false,
    showDestination: false,
    showSecondaryAction: false,
  };

  const handleCustomToggle = (key: keyof CustomSankeyOptions, checked: boolean) => {
    setSankeyOptions({
      customOptions: {
        ...customOptions,
        [key]: checked,
      },
    });
  };

  const resetCustomOptions = () => {
    setSankeyOptions({
      customOptions: {
        showCallerType: false,
        showIntent: false,
        showResolutionStatus: false,
        showResolutionType: false,
        showTransferStatus: false,
        showDestination: false,
        showSecondaryAction: false,
      },
    });
  };

  // Calculate insights - single-pass aggregation
  const insights = useMemo(() => {
    const total = filteredFiles.length;
    let resolvedCount = 0;
    let unresolvedCount = 0;
    let transfersCount = 0;
    let transfersConnectedCount = 0;
    let durationSum = 0;
    let durationCount = 0;
    const intentCounts = new Map<string, number>();

    // Single pass through all files
    for (const f of filteredFiles) {
      // Resolution status
      if (f.resolution_achieved === true) resolvedCount++;
      else if (f.resolution_achieved === false) unresolvedCount++;

      // Transfer status
      if (f.transfer_success !== null) {
        transfersCount++;
        if (f.transfer_success === true) transfersConnectedCount++;
      }

      // Duration
      if (f.call_duration != null) {
        durationSum += f.call_duration;
        durationCount++;
      }

      // Intent
      if (f.primary_intent) {
        intentCounts.set(f.primary_intent, (intentCounts.get(f.primary_intent) || 0) + 1);
      }
    }

    const avgDuration = durationCount > 0 ? durationSum / durationCount : 0;
    const topIntent = Array.from(intentCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];

    // Format duration
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return {
      total,
      resolved: resolvedCount,
      resolvedPct: total > 0 ? (resolvedCount / total) * 100 : 0,
      unresolved: unresolvedCount,
      unresolvedPct: total > 0 ? (unresolvedCount / total) * 100 : 0,
      transfers: transfersCount,
      transfersConnected: transfersConnectedCount,
      transferSuccessRate: transfersCount > 0 ? (transfersConnectedCount / transfersCount) * 100 : 0,
      avgDuration: formatDuration(avgDuration),
      avgDurationSecs: avgDuration,
      topIntent: topIntent ? topIntent[0].replace(/_/g, ' ') : 'N/A',
      topIntentCount: topIntent ? topIntent[1] : 0,
      topIntentPct: topIntent && total > 0 ? (topIntent[1] / total) * 100 : 0,
    };
  }, [filteredFiles]);

  const handleLinkClick = (clickedFiles: { id: string }[]) => {
    if (clickedFiles.length > 0) {
      setSelectedFileId(clickedFiles[0].id);
    }
  };

  const handlePresetChange = (preset: string) => {
    console.log('[FlowPage] USER-TOGGLE: User changed preset to', preset);
    setSankeyOptions({ preset: preset as SankeyPreset });
  };

  const presetInfo = PRESET_INFO[currentPreset] || PRESET_INFO.resolution;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Flow Analysis</h1>
          <p className="text-muted-foreground">
            Interactive Sankey diagram visualizing the caller journey
          </p>
        </div>
        <ShareButton
          getNavigationUrl={getNavigationUrl}
          getShareUrl={getShareUrl}
          variant="outline"
          size="sm"
          className="h-8 w-8"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-4">
        <KPICard
          title="Total Calls"
          value={insights.total}
          icon={Phone}
        />
        <KPICard
          title="Resolution Rate"
          value={insights.resolved}
          percentage={insights.resolvedPct}
          description="calls resolved"
          icon={CheckCircle2}
          colorClass="text-green-500"
        />
        <KPICard
          title="Unresolved"
          value={insights.unresolved}
          percentage={insights.unresolvedPct}
          description="need attention"
          icon={XCircle}
          colorClass="text-red-500"
        />
        <KPICard
          title="Transfer Success"
          value={insights.transfersConnected}
          percentage={insights.transferSuccessRate}
          description={`of ${insights.transfers} transfers`}
          icon={ArrowRightLeft}
          colorClass="text-blue-500"
        />
        <KPICard
          title="Avg Duration"
          value={insights.avgDuration}
          icon={Clock}
          colorClass="text-amber-500"
        />
        <KPICard
          title="Top Intent"
          value={insights.topIntentCount}
          percentage={insights.topIntentPct}
          description={insights.topIntent}
          icon={Target}
          colorClass="text-violet-500"
        />
      </div>

      {/* Preset Tabs */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Flow Visualization</CardTitle>
        </CardHeader>
        <CardContent className="py-0 pb-4">
          {hydrated ? (
            <Tabs value={currentPreset} onValueChange={handlePresetChange}>
              <TabsList className="flex w-full overflow-x-auto lg:grid lg:grid-cols-5 gap-1">
                <TabsTrigger value="resolution" className="flex-shrink-0 min-w-fit text-xs sm:text-sm">
                  Resolution
                </TabsTrigger>
                <TabsTrigger value="transfer" className="flex-shrink-0 min-w-fit text-xs sm:text-sm">
                  Transfers
                </TabsTrigger>
                <TabsTrigger value="caller" className="flex-shrink-0 min-w-fit text-xs sm:text-sm">
                  Callers
                </TabsTrigger>
                <TabsTrigger value="intent" className="flex-shrink-0 min-w-fit text-xs sm:text-sm">
                  Intents
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex-shrink-0 min-w-fit text-xs sm:text-sm gap-1">
                  <Settings2 className="h-3 w-3" />
                  Custom
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <div className="flex w-full overflow-x-auto lg:grid lg:grid-cols-5 gap-1 h-9 bg-muted p-1 rounded-lg">
              {['Resolution', 'Transfers', 'Callers', 'Intents', 'Custom'].map((label) => (
                <div
                  key={label}
                  className="flex-shrink-0 min-w-fit flex items-center justify-center text-xs sm:text-sm text-muted-foreground px-3"
                >
                  {label}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {presetInfo.description}
          </p>

          {/* Custom Options Panel */}
          {hydrated && currentPreset === 'custom' && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Header with Reset */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Configure Layers</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={resetCustomOptions}
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              </div>

              {/* General Layers */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">General Layers</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GENERAL_TOGGLES.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        id={key}
                        checked={customOptions[key]}
                        onCheckedChange={(checked) => handleCustomToggle(key, checked)}
                      />
                      <Label htmlFor={key} className="text-xs cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transfer Layers */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Transfer Layers</p>
                <p className="text-[10px] text-muted-foreground/70 mb-2">
                  Only applies to calls with resolution_type = transfer
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TRANSFER_TOGGLES.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        id={key}
                        checked={customOptions[key]}
                        onCheckedChange={(checked) => handleCustomToggle(key, checked)}
                      />
                      <Label htmlFor={key} className="text-xs cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sankey Diagram */}
      <Card>
        <CardContent className="p-4">
          <div className="min-h-[350px] sm:min-h-[450px] lg:min-h-[550px]">
            <PlotlySankey
              files={filteredFiles}
              options={sankeyOptions}
              height={chartHeight}
              onFilesSelect={handleLinkClick}
              initialCallId={urlState.callId}
              initialIndex={urlState.index}
              getNavigationUrl={getFileNavigationUrl}
              getShareUrl={getFileShareUrl}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FlowPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-muted-foreground">Loading...</div>}>
      <FlowPageContent />
    </Suspense>
  );
}
