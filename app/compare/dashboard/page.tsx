'use client';

import { useMemo, useState, useCallback, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import { Building2, Scale, Phone, Loader2, CheckCircle2, ArrowRightLeft, Clock, Settings2, RotateCcw, X, ChevronDown, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCompareStore, FIRM_CONFIGS } from '@/store/compareStore';
import { applyAllFilters } from '@/lib/filters';
import { buildPlotlySankeyTrace, type PlotlySankeyData } from '@/lib/plotly-transforms';
import { computeFirmStats, type FirmStats } from '@/lib/comparison';
import { cn } from '@/lib/utils';
import type { SankeyPreset, CustomSankeyOptions, FileInfo } from '@/lib/types';
import { FileViewerModal } from '@/components/data/FileViewerModal';
import { createShareUrl, getBaseUrl, parseUrlState } from '@/lib/urlState';

// Dynamic import for Plotly (no SSR)
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[350px] text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  ),
});

const FIRM_ICONS: Record<string, React.ElementType> = {
  sample: Building2,
  mccraw: Scale,
  vapi: Phone,
};

const FIRM_COLORS: Record<string, string> = {
  sample: '#3b82f6',
  mccraw: '#f59e0b',
  vapi: '#22c55e',
};

// Sankey preset info
const PRESET_INFO: Record<SankeyPreset, { label: string }> = {
  resolution: { label: 'Resolution' },
  transfer: { label: 'Transfers' },
  caller: { label: 'Callers' },
  intent: { label: 'Intents' },
  custom: { label: 'Custom' },
};

// Custom toggle options
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

// Type for Sankey link click point (Plotly doesn't export this)
interface SankeyLinkPoint {
  source: { index: number };
  target: { index: number };
  pointNumber: number;
}

function CompareDashboardPageContent() {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const exportRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const { selectedFirmIds, firmData, filters, sankeyOptions, setSankeyOptions, filterSidebarOpen } = useCompareStore();
  const [viewMode, setViewMode] = useState<'sankey' | 'metrics'>('sankey');
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[] | null>(null);
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [isSelectionVisible, setIsSelectionVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Simple mount state - wait for initial delay before rendering
  const [isPlotReady, setIsPlotReady] = useState(false);
  // Signal that Plotly workaround is complete (for auto-opening modal)
  const [isPlotlyWorkaroundComplete, setIsPlotlyWorkaroundComplete] = useState(false);

  // Parse URL state for auto-opening modal
  const urlState = useMemo(() => parseUrlState(searchParams), [searchParams]);

  // Auto-hide notification after 4 seconds
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => setShowNotification(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  // Auto-open modal from URL params when Plotly workaround is complete
  // Uses isPlotlyWorkaroundComplete signal instead of hard delay
  useEffect(() => {
    if (hasAutoOpened || !urlState.callId || !isPlotlyWorkaroundComplete) return;

    // Get all files from all selected firms
    const allFiles = selectedFirmIds.flatMap((id) => firmData[id]?.files || []);
    if (allFiles.length === 0) return;

    // Find the file by callId
    const file = allFiles.find((f) => f.callId === urlState.callId);
    if (file) {
      // Find which firm this file belongs to
      const firmId = selectedFirmIds.find((id) =>
        firmData[id]?.files?.some((f) => f.callId === urlState.callId)
      );

      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setSelectedFiles([file]);
        setSelectedFirmId(firmId || null);
        setModalIndex(urlState.index ?? 0);
        setModalOpen(true);
        setHasAutoOpened(true);
      });
    }
  }, [urlState.callId, urlState.index, selectedFirmIds, firmData, hasAutoOpened, isPlotlyWorkaroundComplete]);

  // Track visibility of the selected flow section
  useEffect(() => {
    const element = document.getElementById('selected-flow-section');
    if (!element) {
      queueMicrotask(() => setIsSelectionVisible(false));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsSelectionVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [selectedFiles]);

  // Get filtered data for each firm
  const filteredFirmData = useMemo(() => {
    const result: Record<string, { files: ReturnType<typeof applyAllFilters>; stats: FirmStats | null }> = {};
    for (const firmId of selectedFirmIds) {
      const files = firmData[firmId]?.files || [];
      const filtered = applyAllFilters(files, filters);
      result[firmId] = {
        files: filtered,
        stats: filtered.length > 0 ? computeFirmStats(firmId, FIRM_CONFIGS.find((c) => c.id === firmId)?.name || firmId, filtered) : null,
      };
    }
    return result;
  }, [selectedFirmIds, firmData, filters]);

  // Check if any firm is still loading
  const isLoading = selectedFirmIds.some((id) => firmData[id]?.loading);

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

  const handlePresetChange = (preset: string) => {
    console.log('[CompareDashboard] USER-TOGGLE: User changed preset to', preset);
    setSankeyOptions({ preset: preset as SankeyPreset });
  };

  const currentPreset = sankeyOptions.preset || 'resolution';

  // Build Sankey data for each firm using plotly-transforms
  const sankeyDataMap = useMemo(() => {
    const result: Record<string, PlotlySankeyData | null> = {};
    for (const firmId of selectedFirmIds) {
      const files = filteredFirmData[firmId]?.files || [];
      if (files.length > 0) {
        result[firmId] = buildPlotlySankeyTrace(files, sankeyOptions, isDarkMode);
      } else {
        result[firmId] = null;
      }
    }
    return result;
  }, [selectedFirmIds, filteredFirmData, sankeyOptions, isDarkMode]);

  // Check if any firm has data
  const hasAnyData = selectedFirmIds.some(id => (filteredFirmData[id]?.files.length || 0) > 0);

  // ===================================================================================
  // IMPORTANT: Plotly Click Handler Bug Workaround - Part 2
  // ===================================================================================
  // This preset toggle works in conjunction with the mount state machine.
  // Plotly's click handlers don't work on initial render - they only start working
  // after a "real" data change happens post-initialization.
  //
  // The mount cycle handles the unmount/remount (0-400ms).
  // This effect then triggers a preset toggle (500-700ms) AFTER that cycle completes,
  // which causes a final re-render with properly bound click handlers.
  //
  // Timeline:
  //   0-400ms:   Mount cycle (waiting -> mounted -> remounting -> ready)
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

    console.log('[CompareDashboard] Mount effect triggered');
    console.log('[CompareDashboard] Current state - hasAnyData:', hasAnyData, 'preset:', sankeyOptions.preset);
    console.log('[CompareDashboard] Target preset from URL:', targetPreset, '-> Will toggle:', targetPreset, '->', adjacentPreset, '->', targetPreset);

    // Wait for mount cycle to complete (400ms), then toggle
    // Step 1: Switch to adjacent preset (at 500ms, after mount cycle)
    const timer1 = setTimeout(() => {
      console.log('[CompareDashboard] AUTO-TOGGLE Step 1: Switching to', adjacentPreset);
      setSankeyOptions({ preset: adjacentPreset });
    }, 500);

    // Step 2: Switch back to target preset (at 700ms) and mark workaround complete
    const timer2 = setTimeout(() => {
      console.log('[CompareDashboard] AUTO-TOGGLE Step 2: Switching back to', targetPreset);
      setSankeyOptions({ preset: targetPreset as SankeyPreset });
      setIsPlotlyWorkaroundComplete(true);
      console.log('[CompareDashboard] AUTO-TOGGLE Complete - click handlers should work now');
    }, 700);

    return () => {
      console.log('[CompareDashboard] Cleanup - clearing timers');
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simple mount delay - wait for data then render
  useEffect(() => {
    console.log('[CompareDashboard] Mount effect - hasAnyData:', hasAnyData, 'isPlotReady:', isPlotReady);
    if (hasAnyData && !isPlotReady) {
      const timer = setTimeout(() => {
        console.log('[CompareDashboard] Plot ready to render');
        setIsPlotReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasAnyData, isPlotReady]);

  // Don't render Plot until ready
  const shouldRenderPlot = isPlotReady;

  // Key for Plot component
  const getPlotKey = useCallback((firmId: string) => {
    const filesCount = filteredFirmData[firmId]?.files.length || 0;
    return `${firmId}-${filesCount}-${sankeyOptions.preset}-${JSON.stringify(sankeyOptions.customOptions)}-${isDarkMode}`;
  }, [filteredFirmData, sankeyOptions, isDarkMode]);

  // Handle Sankey link click - remount mechanism ensures this has fresh data
  const createSankeyClickHandler = useCallback((firmId: string) => {
    return (event: Readonly<Plotly.PlotMouseEvent>) => {
      console.log('[CompareDashboard] Click event received for firm:', firmId, 'points:', event.points?.length);
      if (event.points && event.points.length > 0) {
        const point = event.points[0] as unknown as SankeyLinkPoint;
        console.log('[CompareDashboard] Point data:', { source: point.source, target: point.target, pointNumber: point.pointNumber });

        // Check if it's a link click (has source/target)
        if (point.source !== undefined && point.target !== undefined) {
          const linkIndex = point.pointNumber;
          const linkToFilesMap = sankeyDataMap[firmId]?.linkToFilesMap;
          const clickedFiles = linkToFilesMap?.get(linkIndex);
          console.log('[CompareDashboard] Link click - index:', linkIndex, 'files found:', clickedFiles?.length || 0);
          if (clickedFiles && clickedFiles.length > 0) {
            setSelectedFiles(clickedFiles);
            setSelectedFirmId(firmId);
            setShowNotification(true);
            setModalIndex(0);
          }
        } else {
          console.log('[CompareDashboard] Not a link click (node click or other)');
        }
      }
    };
  }, [sankeyDataMap]);

  const clearSelection = () => {
    setSelectedFiles(null);
    setSelectedFirmId(null);
  };

  const openFileModal = (index: number) => {
    setModalIndex(index);
    setModalOpen(true);
  };

  // URL generation for sharing
  const getFileNavigationUrl = useCallback((file: FileInfo, index: number) => {
    const url = new URL(getBaseUrl());
    // Add firm IDs
    url.searchParams.set('f', selectedFirmIds.join(','));
    // Include preset if not default
    if (currentPreset !== 'resolution') {
      url.searchParams.set('p', currentPreset);
    }
    url.searchParams.set('c', file.callId);
    url.searchParams.set('i', index.toString());
    return url.toString();
  }, [selectedFirmIds, currentPreset]);

  const getFileShareUrl = useCallback((file: FileInfo, index: number) => {
    return createShareUrl(getBaseUrl(), filters, {
      callId: file.callId,
      index,
      firmIds: selectedFirmIds,
      preset: currentPreset,
    });
  }, [filters, selectedFirmIds, currentPreset]);

  // Format category label - split by underscore and capitalize
  const formatCategoryLabel = (value: string): string => {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('<br>');
  };

  // Build distribution data for a category
  const buildDistributionData = useCallback((
    category: 'resolution_type' | 'caller_type' | 'primary_intent',
    title: string
  ) => {
    const firms = selectedFirmIds.map((id) => ({
      id,
      name: FIRM_CONFIGS.find((c) => c.id === id)?.name || id,
      files: filteredFirmData[id]?.files || [],
    }));

    // Get all unique values across all firms
    const allValues = new Set<string>();
    firms.forEach(firm => {
      firm.files.forEach(file => {
        const value = file[category];
        if (value) allValues.add(value);
      });
    });

    const categories = Array.from(allValues).sort();
    if (categories.length === 0) return null;

    // Build traces for each firm
    const traces = firms.map(firm => {
      const total = firm.files.length;
      const counts: Record<string, number> = {};
      firm.files.forEach(file => {
        const value = file[category];
        if (value) counts[value] = (counts[value] || 0) + 1;
      });

      const percentages = categories.map(c => total > 0 ? ((counts[c] || 0) / total) * 100 : 0);

      return {
        name: firm.name,
        x: categories.map(formatCategoryLabel),
        y: percentages,
        type: 'bar' as const,
        marker: { color: FIRM_COLORS[firm.id] || '#6b7280' },
        text: percentages.map(p => p > 0 ? `${p.toFixed(1)}%` : ''),
        textposition: 'outside' as const,
        textfont: { size: 9 },
        hovertemplate: `${firm.name}<br>%{x}: %{y:.1f}%<extra></extra>`,
      };
    });

    const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
    const textColor = isDarkMode ? '#e5e7eb' : '#1f2937';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';

    return {
      traces,
      layout: {
        title: { text: title, font: { size: 14 } },
        barmode: 'group' as const,
        paper_bgcolor: bgColor,
        plot_bgcolor: bgColor,
        font: { color: textColor, size: 10 },
        xaxis: {
          gridcolor: gridColor,
          tickangle: 0, // Vertical stacking via <br> instead of diagonal
          tickfont: { size: 9 },
        },
        yaxis: {
          gridcolor: gridColor,
          title: { text: 'Percentage (%)', font: { size: 10 } },
          range: [0, Math.min(100, Math.max(...traces.flatMap(t => t.y)) + 10)], // Highest bar + 10pp, capped at 100
        },
        margin: { t: 50, b: 100, l: 50, r: 20 },
        showlegend: true,
        legend: {
          orientation: 'h' as const,
          y: -0.35,
          x: 0.5,
          xanchor: 'center' as const,
        },
      },
    };
  }, [selectedFirmIds, filteredFirmData, isDarkMode]);

  // Build metrics comparison chart data
  const metricsChartData = useMemo(() => {
    const firms = selectedFirmIds.map((id) => ({
      id,
      name: FIRM_CONFIGS.find((c) => c.id === id)?.name || id,
      stats: filteredFirmData[id]?.stats,
    })).filter((f) => f.stats);

    if (firms.length === 0) return null;

    const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
    const textColor = isDarkMode ? '#e5e7eb' : '#1f2937';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';

    const commonLayout = {
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor, size: 11 },
      xaxis: { gridcolor: gridColor },
      yaxis: { gridcolor: gridColor },
      margin: { t: 40, b: 80, l: 50, r: 20 },
      showlegend: false,
    };

    // Overview metrics
    const resolutionRateTrace = {
      x: firms.map((f) => f.name),
      y: firms.map((f) => f.stats?.resolutionRate || 0),
      type: 'bar' as const,
      marker: { color: firms.map((f) => FIRM_COLORS[f.id] || '#6b7280') },
      text: firms.map((f) => `${(f.stats?.resolutionRate || 0).toFixed(1)}%`),
      textposition: 'outside' as const,
      hovertemplate: '%{x}<br>Resolution: %{y:.1f}%<extra></extra>',
    };

    const transferRateTrace = {
      x: firms.map((f) => f.name),
      y: firms.map((f) => f.stats?.transferSuccessRate || 0),
      type: 'bar' as const,
      marker: { color: firms.map((f) => FIRM_COLORS[f.id] || '#6b7280') },
      text: firms.map((f) => `${(f.stats?.transferSuccessRate || 0).toFixed(1)}%`),
      textposition: 'outside' as const,
      hovertemplate: '%{x}<br>Transfer Success: %{y:.1f}%<extra></extra>',
    };

    const durationTrace = {
      x: firms.map((f) => f.name),
      y: firms.map((f) => f.stats?.avgDuration || 0),
      type: 'bar' as const,
      marker: { color: firms.map((f) => FIRM_COLORS[f.id] || '#6b7280') },
      text: firms.map((f) => `${Math.round(f.stats?.avgDuration || 0)}s`),
      textposition: 'outside' as const,
      hovertemplate: '%{x}<br>Avg Duration: %{y:.0f}s<extra></extra>',
    };

    const callsTrace = {
      x: firms.map((f) => f.name),
      y: firms.map((f) => f.stats?.totalCalls || 0),
      type: 'bar' as const,
      marker: { color: firms.map((f) => FIRM_COLORS[f.id] || '#6b7280') },
      text: firms.map((f) => String(f.stats?.totalCalls || 0)),
      textposition: 'outside' as const,
      hovertemplate: '%{x}<br>Calls: %{y}<extra></extra>',
    };

    // Distribution charts
    const resolutionTypes = buildDistributionData('resolution_type', 'Resolution Types Distribution');
    const callerTypes = buildDistributionData('caller_type', 'Caller Types Distribution');
    const primaryIntents = buildDistributionData('primary_intent', 'Primary Intents Distribution');

    // Calculate dynamic ranges based on max values + 10pp headroom
    const maxResolution = Math.max(...firms.map((f) => f.stats?.resolutionRate || 0));
    const maxTransfer = Math.max(...firms.map((f) => f.stats?.transferSuccessRate || 0));
    const maxDuration = Math.max(...firms.map((f) => f.stats?.avgDuration || 0));
    const maxCalls = Math.max(...firms.map((f) => f.stats?.totalCalls || 0));

    return {
      resolutionRate: { trace: resolutionRateTrace, layout: { ...commonLayout, title: { text: 'Resolution Rate (%)', font: { size: 12 } }, yaxis: { ...commonLayout.yaxis, range: [0, Math.min(100, maxResolution + 10)] } } },
      transferRate: { trace: transferRateTrace, layout: { ...commonLayout, title: { text: 'Transfer Success (%)', font: { size: 12 } }, yaxis: { ...commonLayout.yaxis, range: [0, Math.min(100, maxTransfer + 10)] } } },
      duration: { trace: durationTrace, layout: { ...commonLayout, title: { text: 'Avg Duration (s)', font: { size: 12 } }, yaxis: { ...commonLayout.yaxis, range: [0, maxDuration * 1.15] } } },
      calls: { trace: callsTrace, layout: { ...commonLayout, title: { text: 'Total Calls', font: { size: 12 } }, yaxis: { ...commonLayout.yaxis, range: [0, maxCalls * 1.15] } } },
      resolutionTypes,
      callerTypes,
      primaryIntents,
    };
  }, [selectedFirmIds, filteredFirmData, isDarkMode, buildDistributionData]);

  // Export to PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Dynamically import jsPDF and html2canvas
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Firm Comparison Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Executive Summary
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', margin, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      selectedFirmIds.forEach((id) => {
        const config = FIRM_CONFIGS.find((c) => c.id === id);
        const stats = filteredFirmData[id]?.stats;
        const totalFiles = firmData[id]?.files?.length || 0;
        const filteredCount = filteredFirmData[id]?.files.length || 0;
        if (config && stats) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${config.name}`, margin + 5, yPosition);
          yPosition += 5;
          pdf.setFont('helvetica', 'normal');
          pdf.text(`  Total Calls: ${stats.totalCalls} (${filteredCount} of ${totalFiles} after filters)`, margin + 5, yPosition);
          yPosition += 4;
          pdf.text(`  Resolution Rate: ${stats.resolutionRate.toFixed(1)}%`, margin + 5, yPosition);
          yPosition += 4;
          pdf.text(`  Transfer Success Rate: ${stats.transferSuccessRate.toFixed(1)}%`, margin + 5, yPosition);
          yPosition += 4;
          pdf.text(`  Average Duration: ${Math.round(stats.avgDuration)}s`, margin + 5, yPosition);
          yPosition += 7;
        }
      });
      yPosition += 5;

      // Detailed Metrics Comparison Table
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detailed Metrics Comparison', margin, yPosition);
      yPosition += 8;

      // Table header
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      const colWidths = [50, 35, 35, 35, 30];
      const headers = ['Metric', ...selectedFirmIds.map(id => FIRM_CONFIGS.find(c => c.id === id)?.name || id)];
      let xPos = margin;
      headers.forEach((header, i) => {
        pdf.text(header, xPos, yPosition);
        xPos += colWidths[i] || 35;
      });
      yPosition += 5;

      // Draw line
      pdf.setDrawColor(200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 4;

      // Table rows
      pdf.setFont('helvetica', 'normal');
      const metrics = [
        { label: 'Total Calls', getValue: (s: FirmStats) => String(s.totalCalls) },
        { label: 'Resolution Rate', getValue: (s: FirmStats) => `${s.resolutionRate.toFixed(1)}%` },
        { label: 'Transfer Success', getValue: (s: FirmStats) => `${s.transferSuccessRate.toFixed(1)}%` },
        { label: 'Avg Duration', getValue: (s: FirmStats) => `${Math.round(s.avgDuration)}s` },
        { label: 'Resolution Types', getValue: (s: FirmStats) => `${Object.keys(s.resolutionTypes).length} types` },
        { label: 'Caller Types', getValue: (s: FirmStats) => `${Object.keys(s.callerTypes).length} types` },
        { label: 'Primary Intents', getValue: (s: FirmStats) => `${Object.keys(s.primaryIntents).length} intents` },
      ];

      metrics.forEach((metric) => {
        xPos = margin;
        pdf.text(metric.label, xPos, yPosition);
        xPos += colWidths[0];
        selectedFirmIds.forEach((id, i) => {
          const stats = filteredFirmData[id]?.stats;
          if (stats) {
            pdf.text(metric.getValue(stats), xPos, yPosition);
          }
          xPos += colWidths[i + 1] || 35;
        });
        yPosition += 5;
      });
      yPosition += 10;

      // Applied Filters Section
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Applied Filters', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Resolution Status: ${filters.achievedStatus.join(', ') || 'All'}`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text(`Transfer Status: ${filters.transferStatus.join(', ') || 'All'}`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text(`Duration Range: ${filters.durationRange[0]}s - ${filters.durationRange[1]}s`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text(`Resolution Types: ${filters.resolutionTypes.length} selected`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text(`Caller Types: ${filters.callerTypes.length} selected`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text(`Primary Intents: ${filters.primaryIntents.length} selected`, margin + 5, yPosition);
      yPosition += 10;

      // Capture charts if in metrics view
      if (exportRef.current) {
        pdf.addPage();
        yPosition = margin;

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Visual Charts', margin, yPosition);
        yPosition += 10;

        const canvas = await html2canvas(exportRef.current, {
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          logging: false,
          useCORS: true,
        } as Parameters<typeof html2canvas>[1]);

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add image, handling page breaks if needed
        const maxImageHeight = pageHeight - yPosition - margin;
        if (imgHeight <= maxImageHeight) {
          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        } else {
          // Scale to fit page
          const scaledHeight = maxImageHeight;
          const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
          pdf.addImage(imgData, 'PNG', margin, yPosition, Math.min(scaledWidth, imgWidth), scaledHeight);
        }
      }

      // Save
      const firmNames = selectedFirmIds.map(id => FIRM_CONFIGS.find(c => c.id === id)?.name || id).join('_vs_');
      pdf.save(`comparison_${firmNames}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading firm data...</p>
        </div>
      </div>
    );
  }

  const scrollToSelection = () => {
    const element = document.getElementById('selected-flow-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowNotification(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Notification banner when files are selected */}
      {showNotification && selectedFiles && !isSelectionVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <button
            onClick={scrollToSelection}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          >
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
              {selectedFiles.length}
            </Badge>
            <span className="text-sm font-medium">files selected</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Firm Comparison</h1>
          <p className="text-muted-foreground">
            Side-by-side analysis of {selectedFirmIds.length} firms with synchronized filters
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export PDF
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className={cn(
        'grid gap-4',
        selectedFirmIds.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
      )}>
        {selectedFirmIds.map((firmId) => {
          const config = FIRM_CONFIGS.find((c) => c.id === firmId);
          const Icon = FIRM_ICONS[firmId] || Building2;
          const color = FIRM_COLORS[firmId];
          const stats = filteredFirmData[firmId]?.stats;
          const totalFiles = firmData[firmId]?.files?.length || 0;
          const filteredCount = filteredFirmData[firmId]?.files.length || 0;

          return (
            <Card key={firmId}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{config?.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {filteredCount} of {totalFiles} calls
                    </p>
                  </div>
                </div>
                {stats && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-muted-foreground">Resolved:</span>
                      <span className="text-xs font-medium">{stats.resolutionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowRightLeft className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-muted-foreground">Transfers:</span>
                      <span className="text-xs font-medium">{stats.transferSuccessRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span className="text-xs text-muted-foreground">Avg Duration:</span>
                      <span className="text-xs font-medium">{Math.round(stats.avgDuration)}s</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View Mode Toggle */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Visualization</CardTitle>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'sankey' | 'metrics')}>
              <TabsList className="h-8">
                <TabsTrigger value="sankey" className="text-xs h-7 px-3">Flow Analysis</TabsTrigger>
                <TabsTrigger value="metrics" className="text-xs h-7 px-3">Metrics</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        {viewMode === 'sankey' && (
          <CardContent className="py-0 pb-4">
            <Tabs value={currentPreset} onValueChange={handlePresetChange}>
              <TabsList className="flex w-full overflow-x-auto lg:grid lg:grid-cols-5 gap-1">
                {Object.entries(PRESET_INFO).map(([key, info]) => (
                  <TabsTrigger key={key} value={key} className="flex-shrink-0 min-w-fit text-xs">
                    {key === 'custom' && <Settings2 className="h-3 w-3 mr-1" />}
                    {info.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Custom Options */}
            {currentPreset === 'custom' && (
              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Configure Layers</p>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={resetCustomOptions}>
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GENERAL_TOGGLES.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        id={key}
                        checked={customOptions[key]}
                        onCheckedChange={(checked) => handleCustomToggle(key, checked)}
                      />
                      <Label htmlFor={key} className="text-xs cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TRANSFER_TOGGLES.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        id={key}
                        checked={customOptions[key]}
                        onCheckedChange={(checked) => handleCustomToggle(key, checked)}
                      />
                      <Label htmlFor={key} className="text-xs cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Sankey Diagrams */}
      {viewMode === 'sankey' && (
        <div className={cn(
          'grid gap-4',
          selectedFirmIds.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        )}>
          {selectedFirmIds.map((firmId) => {
            const config = FIRM_CONFIGS.find((c) => c.id === firmId);
            const Icon = FIRM_ICONS[firmId] || Building2;
            const color = FIRM_COLORS[firmId];
            const sankeyData = sankeyDataMap[firmId];

            return (
              <Card key={firmId}>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color }} />
                    <CardTitle className="text-sm">{config?.name}</CardTitle>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {filteredFirmData[firmId]?.files.length || 0} calls
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  {sankeyData?.trace && shouldRenderPlot ? (
                    <Plot
                      key={getPlotKey(firmId)}
                      data={[sankeyData.trace]}
                      layout={{
                        ...sankeyData.layout,
                        height: selectedFirmIds.length === 2 ? 400 : 350,
                        autosize: true,
                      }}
                      config={{ displayModeBar: false, responsive: true }}
                      onClick={createSankeyClickHandler(firmId)}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                      {!shouldRenderPlot && sankeyData?.trace ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        'No data available with current filters'
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Selected Files Section */}
      {selectedFiles && selectedFiles.length > 0 && viewMode === 'sankey' && (
        <Card id="selected-flow-section">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              Selected Flow
              {selectedFirmId && (
                <Badge variant="outline" className="text-xs">
                  {FIRM_CONFIGS.find((c) => c.id === selectedFirmId)?.name}
                </Badge>
              )}
              <Badge variant="secondary">{selectedFiles.length} files</Badge>
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="py-0 pb-3">
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {selectedFiles.slice(0, 50).map((file, index) => (
                  <div
                    key={file.id}
                    className="text-xs p-2 rounded bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => openFileModal(index)}
                  >
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-muted-foreground truncate">
                      {file.caller_type.replace(/_/g, ' ')} • {file.resolution_type.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
                {selectedFiles.length > 50 && (
                  <div className="text-xs text-muted-foreground p-2">
                    ... and {selectedFiles.length - 50} more files
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* File Viewer Modal */}
      {selectedFiles && selectedFiles.length > 0 && (
        <FileViewerModal
          files={selectedFiles.slice(0, 50)}
          currentIndex={modalIndex}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onIndexChange={setModalIndex}
          firmName={selectedFirmId ? FIRM_CONFIGS.find((c) => c.id === selectedFirmId)?.name : undefined}
          firmColor={selectedFirmId ? FIRM_COLORS[selectedFirmId] : undefined}
          sidebarOpen={filterSidebarOpen}
          getNavigationUrl={getFileNavigationUrl}
          getShareUrl={getFileShareUrl}
        />
      )}

      {/* Metrics Charts */}
      {viewMode === 'metrics' && metricsChartData && (
        <div ref={exportRef} className="space-y-6">
          {/* Overview Metrics */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Overview Metrics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <Plot
                    data={[metricsChartData.resolutionRate.trace]}
                    layout={{ ...metricsChartData.resolutionRate.layout, height: 280, autosize: true }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%' }}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Plot
                    data={[metricsChartData.transferRate.trace]}
                    layout={{ ...metricsChartData.transferRate.layout, height: 280, autosize: true }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%' }}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Plot
                    data={[metricsChartData.duration.trace]}
                    layout={{ ...metricsChartData.duration.layout, height: 280, autosize: true }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%' }}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Plot
                    data={[metricsChartData.calls.trace]}
                    layout={{ ...metricsChartData.calls.layout, height: 280, autosize: true }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%' }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Distribution Charts */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Category Distributions</h3>
            <div className="space-y-4">
              {metricsChartData.resolutionTypes && (
                <Card>
                  <CardContent className="p-4">
                    <Plot
                      data={metricsChartData.resolutionTypes.traces}
                      layout={{ ...metricsChartData.resolutionTypes.layout, height: 350, autosize: true }}
                      config={{ displayModeBar: false, responsive: true }}
                      style={{ width: '100%' }}
                    />
                  </CardContent>
                </Card>
              )}
              {metricsChartData.callerTypes && (
                <Card>
                  <CardContent className="p-4">
                    <Plot
                      data={metricsChartData.callerTypes.traces}
                      layout={{ ...metricsChartData.callerTypes.layout, height: 350, autosize: true }}
                      config={{ displayModeBar: false, responsive: true }}
                      style={{ width: '100%' }}
                    />
                  </CardContent>
                </Card>
              )}
              {metricsChartData.primaryIntents && (
                <Card>
                  <CardContent className="p-4">
                    <Plot
                      data={metricsChartData.primaryIntents.traces}
                      layout={{ ...metricsChartData.primaryIntents.layout, height: 350, autosize: true }}
                      config={{ displayModeBar: false, responsive: true }}
                      style={{ width: '100%' }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center">
        Filters apply universally to all firms. Use the sidebar to adjust.
      </p>
    </div>
  );
}

export default function CompareDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-muted-foreground">Loading...</div>}>
      <CompareDashboardPageContent />
    </Suspense>
  );
}
