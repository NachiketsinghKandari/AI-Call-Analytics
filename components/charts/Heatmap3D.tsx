'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import type { FileInfo } from '@/lib/types';
import { build3DHeatmapData } from '@/lib/plotly-transforms';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

// Dynamic import for Plotly (no SSR)
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] text-muted-foreground">
      Loading 3D visualization...
    </div>
  ),
});

interface Heatmap3DProps {
  files: FileInfo[];
  height?: number;
}

export function Heatmap3D({ files, height = 650 }: Heatmap3DProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const [minCount, setMinCount] = useState(1);

  // Calculate max count for the slider range
  const maxCount = useMemo(() => {
    const groups = new Map<string, number>();
    files.forEach((file) => {
      const key = `${file.resolution_type}|${file.caller_type}|${file.primary_intent || 'Unknown'}`;
      groups.set(key, (groups.get(key) || 0) + 1);
    });
    return Math.max(...Array.from(groups.values()), 1);
  }, [files]);

  // Count visible points
  const visiblePoints = useMemo(() => {
    const groups = new Map<string, number>();
    files.forEach((file) => {
      const key = `${file.resolution_type}|${file.caller_type}|${file.primary_intent || 'Unknown'}`;
      groups.set(key, (groups.get(key) || 0) + 1);
    });
    return Array.from(groups.values()).filter((count) => count >= minCount).length;
  }, [files, minCount]);

  const { trace, layout } = useMemo(() => {
    return build3DHeatmapData(files, isDarkMode, minCount);
  }, [files, isDarkMode, minCount]);

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No data available for 3D visualization
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Threshold Slider */}
      <div className="flex items-center gap-4 px-2">
        <Label className="text-sm font-medium whitespace-nowrap">
          Min Call Count:
        </Label>
        <div className="flex-1 max-w-xs">
          <Slider
            min={1}
            max={Math.max(maxCount, 2)}
            step={1}
            value={[minCount]}
            onValueChange={(values) => setMinCount(values[0])}
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-primary">{minCount}</span>
          <span className="text-muted-foreground">
            ({visiblePoints} points)
          </span>
        </div>
      </div>

      {/* 3D Plot */}
      <div className="relative">
        <Plot
          data={[trace]}
          layout={{
            ...layout,
            height,
            autosize: true,
          }}
          config={{
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['toImage'],
            responsive: true,
          }}
          style={{ width: '100%' }}
          useResizeHandler
        />
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          Drag to rotate • Scroll to zoom • Right-click to pan
        </div>
      </div>
    </div>
  );
}
