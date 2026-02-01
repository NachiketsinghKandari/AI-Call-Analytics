'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useHydrated } from '@/lib/hooks';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import type { FileInfo, SankeyOptions } from '@/lib/types';
import { buildPlotlySankeyTrace } from '@/lib/plotly-transforms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileViewerModal } from '@/components/data/FileViewerModal';

// Dynamic import for Plotly (no SSR)
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] text-muted-foreground">
      Loading chart...
    </div>
  ),
});

interface PlotlySankeyProps {
  files: FileInfo[];
  options: SankeyOptions;
  height?: number;
  onFilesSelect?: (files: FileInfo[]) => void;
  /** Initial call ID from URL to auto-open modal */
  initialCallId?: string;
  /** Initial index from URL */
  initialIndex?: number;
  /** Function to generate navigation URL for sharing */
  getNavigationUrl?: (file: FileInfo, index: number) => string;
  /** Function to generate share URL with filters */
  getShareUrl?: (file: FileInfo, index: number) => string;
}

// Type for Sankey link click point (Plotly doesn't export this)
interface SankeyLinkPoint {
  source: { index: number };
  target: { index: number };
  pointNumber: number;
}

export function PlotlySankey({ files, options, height = 600, onFilesSelect, initialCallId, initialIndex, getNavigationUrl, getShareUrl }: PlotlySankeyProps) {
  const { resolvedTheme } = useTheme();
  const hydrated = useHydrated();
  const isDarkMode = resolvedTheme === 'dark';
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [isSelectionVisible, setIsSelectionVisible] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Auto-open modal from URL params when data becomes available
  useEffect(() => {
    if (hasAutoOpened || !initialCallId || files.length === 0) return;

    // Find the file by callId
    const file = files.find((f) => f.callId === initialCallId);
    if (file) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setSelectedFiles([file]);
        setModalIndex(initialIndex ?? 0);
        setModalOpen(true);
        setHasAutoOpened(true);
      });
    }
  }, [initialCallId, initialIndex, files, hasAutoOpened]);

  // ===================================================================================
  // IMPORTANT: Plotly Click Handler Bug Workaround
  // ===================================================================================
  // Plotly.js has a known issue where click handlers don't work on initial render.
  // The onClick callback passed to <Plot> is not properly bound until the component
  // goes through a complete unmount/remount cycle AFTER the initial render settles.
  //
  // This state machine forces that cycle:
  //   waiting (100ms) -> mounted (200ms) -> remounting (100ms) -> ready
  //
  // The 'remounting' state unmounts the Plot, then 'ready' remounts it with fresh
  // event handlers. Combined with the preset toggle in FlowPage/CompareDashboard
  // (which happens AFTER this cycle at 500-700ms), this ensures clicks work.
  //
  // DO NOT REMOVE OR "OPTIMIZE" THIS - it's not a bug, it's a bug prevention mechanism.
  // Without this, users cannot click on Sankey links to see file details.
  // ===================================================================================
  const [mountState, setMountState] = useState<'waiting' | 'mounted' | 'remounting' | 'ready'>('waiting');

  const { trace, layout, linkToFilesMap } = useMemo(() => {
    return buildPlotlySankeyTrace(files, options, isDarkMode);
  }, [files, options, isDarkMode]);

  // Mount state machine: waiting -> mounted -> remounting -> ready
  // This forces a complete unmount/remount cycle to fix Plotly click handlers
  useEffect(() => {
    console.log('[PlotlySankey] Mount state:', mountState, 'files:', files.length);

    if (files.length === 0) return;

    if (mountState === 'waiting') {
      // Initial delay before first mount
      const timer = setTimeout(() => {
        console.log('[PlotlySankey] State: waiting -> mounted');
        setMountState('mounted');
      }, 100);
      return () => clearTimeout(timer);
    }

    if (mountState === 'mounted') {
      // After first mount, trigger unmount
      const timer = setTimeout(() => {
        console.log('[PlotlySankey] State: mounted -> remounting (unmounting Plot)');
        setMountState('remounting');
      }, 200);
      return () => clearTimeout(timer);
    }

    if (mountState === 'remounting') {
      // After unmount, remount with fresh handlers
      const timer = setTimeout(() => {
        console.log('[PlotlySankey] State: remounting -> ready (remounting Plot with fresh handlers)');
        setMountState('ready');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [files.length, mountState]);

  // Key for Plot component - includes mountState to force remount
  const plotKey = useMemo(() => {
    const key = `${files.length}-${options.preset}-${JSON.stringify(options.customOptions)}-${isDarkMode}-${mountState}`;
    console.log('[PlotlySankey] Plot key changed:', key);
    return key;
  }, [files.length, options, isDarkMode, mountState]);

  // Only render Plot in 'mounted' or 'ready' states (not during 'waiting' or 'remounting')
  const shouldRenderPlot = mountState === 'mounted' || mountState === 'ready';

  // Track visibility of the selected flow section
  useEffect(() => {
    const element = document.getElementById('selected-flow-section');
    if (!element) {
      // Use queueMicrotask to avoid synchronous setState in effect
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

  // Auto-hide notification after 4 seconds
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => setShowNotification(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  // Click handler - remount mechanism ensures this has fresh data
  const handleClick = useCallback((event: Readonly<Plotly.PlotMouseEvent>) => {
    console.log('[PlotlySankey] Click event received:', event.points?.length, 'points');
    if (event.points && event.points.length > 0) {
      const point = event.points[0] as unknown as SankeyLinkPoint;
      console.log('[PlotlySankey] Point data:', { source: point.source, target: point.target, pointNumber: point.pointNumber });

      // Check if it's a link click (has source/target)
      if (point.source !== undefined && point.target !== undefined) {
        const linkIndex = point.pointNumber;
        const clickedFiles = linkToFilesMap.get(linkIndex);
        console.log('[PlotlySankey] Link click - index:', linkIndex, 'files found:', clickedFiles?.length || 0);
        if (clickedFiles && clickedFiles.length > 0) {
          setSelectedFiles(clickedFiles);
          setShowNotification(true);
          onFilesSelect?.(clickedFiles);
        }
      } else {
        console.log('[PlotlySankey] Not a link click (node click or other)');
      }
    }
  }, [linkToFilesMap, onFilesSelect]);

  const scrollToSelection = () => {
    const element = document.getElementById('selected-flow-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowNotification(false);
    }
  };

  const clearSelection = () => {
    setSelectedFiles(null);
  };

  const openFileModal = (index: number) => {
    setModalIndex(index);
    setModalOpen(true);
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No data available for visualization. Try adjusting filters or loading more data.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Notification banner when files are selected (hidden if section is already visible) */}
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

      {hydrated && shouldRenderPlot ? (
        <Plot
          key={plotKey}
          data={[trace]}
          layout={{
            ...layout,
            height,
            autosize: true,
          }}
          config={{
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            responsive: true,
          }}
          onClick={handleClick}
          style={{ width: '100%' }}
          useResizeHandler
        />
      ) : (
        <div className="flex items-center justify-center h-[600px] text-muted-foreground">
          Loading chart...
        </div>
      )}

      {selectedFiles && selectedFiles.length > 0 && (
        <Card id="selected-flow-section">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              Selected Flow
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
          getNavigationUrl={getNavigationUrl}
          getShareUrl={getShareUrl}
        />
      )}
    </div>
  );
}
