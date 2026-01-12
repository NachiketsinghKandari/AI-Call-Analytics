'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import type { FileInfo } from '@/lib/types';
import { buildPlotlyHeatmap2D } from '@/lib/plotly-transforms';
import { Card, CardContent } from '@/components/ui/card';

// Dynamic import for Plotly (no SSR)
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] text-muted-foreground">
      Loading heatmap...
    </div>
  ),
});

interface PlotlyHeatmapProps {
  files: FileInfo[];
  xDimension: 'resolution' | 'caller' | 'intent';
  yDimension: 'resolution' | 'caller' | 'intent';
  title?: string;
  height?: number;
}

export function PlotlyHeatmap({ files, xDimension, yDimension, title, height = 550 }: PlotlyHeatmapProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  const { trace, layout } = useMemo(() => {
    return buildPlotlyHeatmap2D(files, xDimension, yDimension, isDarkMode);
  }, [files, xDimension, yDimension, isDarkMode]);

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No data available for heatmap visualization
        </CardContent>
      </Card>
    );
  }

  return (
    <Plot
      data={[trace]}
      layout={{
        ...layout,
        height,
        autosize: true,
        title: title ? {
          text: `<b>${title}</b>`,
          font: { size: 16 },
          x: 0.5,
        } : undefined,
      }}
      config={{
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        responsive: true,
      }}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
}
