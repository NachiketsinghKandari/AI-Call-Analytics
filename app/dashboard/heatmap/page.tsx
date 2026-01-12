'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PlotlyHeatmap } from '@/components/charts/PlotlyHeatmap';
import { Heatmap3D } from '@/components/charts/Heatmap3D';
import { useCallDataStore } from '@/store/callDataStore';
import { applyAllFilters } from '@/lib/filters';
import { HEATMAP_PRESETS, getDimensionName } from '@/lib/heatmap';
import { Grid3x3, Box } from 'lucide-react';

export default function HeatmapPage() {
  const { files, filters } = useCallDataStore();
  const [selectedPreset, setSelectedPreset] = useState(HEATMAP_PRESETS[0].id);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const filteredFiles = useMemo(() => {
    return applyAllFilters(files, filters);
  }, [files, filters]);

  const currentPreset = HEATMAP_PRESETS.find((p) => p.id === selectedPreset) || HEATMAP_PRESETS[0];

  // Get unique counts for stats
  const stats = useMemo(() => {
    const resolutionTypes = new Set(filteredFiles.map((f) => f.resolution_type));
    const callerTypes = new Set(filteredFiles.map((f) => f.caller_type));
    const intents = new Set(filteredFiles.map((f) => f.primary_intent || 'Unknown'));
    return {
      resolutionTypes: resolutionTypes.size,
      callerTypes: callerTypes.size,
      intents: intents.size,
    };
  }, [filteredFiles]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Heatmap Analysis</h1>
          <p className="text-muted-foreground">
            Explore correlations between call dimensions in 2D or 3D
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as '2d' | '3d')}
        >
          <ToggleGroupItem value="2d" aria-label="2D View">
            <Grid3x3 className="h-4 w-4 mr-2" />
            2D
          </ToggleGroupItem>
          <ToggleGroupItem value="3d" aria-label="3D View">
            <Box className="h-4 w-4 mr-2" />
            3D
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredFiles.length}</div>
            <div className="text-sm text-muted-foreground">Total Calls</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.resolutionTypes}</div>
            <div className="text-sm text-muted-foreground">Resolution Types</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.callerTypes}</div>
            <div className="text-sm text-muted-foreground">Caller Types</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.intents}</div>
            <div className="text-sm text-muted-foreground">Primary Intents</div>
          </CardContent>
        </Card>
      </div>

      {viewMode === '2d' ? (
        <>
          {/* 2D Dimension Selector */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Select Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-4">
              <Tabs value={selectedPreset} onValueChange={setSelectedPreset}>
                <TabsList className="grid w-full grid-cols-3">
                  {HEATMAP_PRESETS.map((preset) => (
                    <TabsTrigger key={preset.id} value={preset.id}>
                      {preset.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* 2D Heatmap */}
          <Card>
            <CardContent className="p-4">
              <PlotlyHeatmap
                files={filteredFiles}
                xDimension={currentPreset.xDimension}
                yDimension={currentPreset.yDimension}
                title={currentPreset.label}
                height={550}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* 3D Heatmap Info */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">3D Visualization</CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-4">
              <p className="text-sm text-muted-foreground">
                Explore all three dimensions at once: Resolution Type (X), Caller Type (Y), and Primary Intent (Z).
                Marker size and color indicate call count.
              </p>
            </CardContent>
          </Card>

          {/* 3D Heatmap */}
          <Card>
            <CardContent className="p-4">
              <Heatmap3D files={filteredFiles} height={650} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
