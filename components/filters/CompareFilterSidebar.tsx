'use client';

import { useMemo } from 'react';
import { RotateCcw, Building2, Scale, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCompareStore, FIRM_CONFIGS } from '@/store/compareStore';
import { applyAllFilters } from '@/lib/filters';
import type { AchievedStatus, TransferStatus, MultiCaseStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const FIRM_ICONS: Record<string, React.ElementType> = {
  sample: Building2,
  mccraw: Scale,
  vapi: Phone,
};

const FIRM_COLORS: Record<string, string> = {
  sample: 'text-blue-500',
  mccraw: 'text-amber-500',
  vapi: 'text-green-500',
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  onSelectAll?: () => void;
  onUnselectAll?: () => void;
}

function FilterSection({ title, children, onSelectAll, onUnselectAll }: FilterSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">{title}</h4>
        {(onSelectAll || onUnselectAll) && (
          <div className="flex gap-1 ml-auto mr-2">
            {onSelectAll && (
              <button
                onClick={onSelectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                All
              </button>
            )}
            {onSelectAll && onUnselectAll && (
              <span className="text-xs text-muted-foreground">/</span>
            )}
            {onUnselectAll && (
              <button
                onClick={onUnselectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                None
              </button>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

export function CompareFilterSidebar() {
  const { selectedFirmIds, firmData, filters, combinedStats, setFilters, resetFilters } = useCompareStore();

  // Get total filtered counts for each firm
  const firmCounts = useMemo(() => {
    const counts: Record<string, { total: number; filtered: number }> = {};
    for (const firmId of selectedFirmIds) {
      const files = firmData[firmId]?.files || [];
      const filtered = applyAllFilters(files, filters);
      counts[firmId] = { total: files.length, filtered: filtered.length };
    }
    return counts;
  }, [selectedFirmIds, firmData, filters]);

  const totalFiltered = useMemo(() => {
    return Object.values(firmCounts).reduce((sum, c) => sum + c.filtered, 0);
  }, [firmCounts]);

  const handleCheckboxChange = (
    field: 'resolutionTypes' | 'callerTypes' | 'primaryIntents' | 'achievedStatus' | 'transferStatus' | 'multiCase',
    value: string,
    checked: boolean
  ) => {
    const current = filters[field] as string[];
    if (checked) {
      setFilters({ [field]: [...current, value] });
    } else {
      setFilters({ [field]: current.filter((v: string) => v !== value) });
    }
  };

  const handleDurationChange = (values: number[]) => {
    setFilters({ durationRange: [values[0], values[1]] as [number, number] });
  };

  if (!combinedStats) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading filters...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Universal Filters</h3>
          <p className="text-xs text-muted-foreground">
            Applies to all {selectedFirmIds.length} firms
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 gap-1">
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      {/* Firm Summary */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Selected Firms</h4>
        <div className="space-y-1">
          {selectedFirmIds.map((firmId) => {
            const config = FIRM_CONFIGS.find((c) => c.id === firmId);
            const Icon = FIRM_ICONS[firmId] || Building2;
            const counts = firmCounts[firmId];
            return (
              <div key={firmId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', FIRM_COLORS[firmId])} />
                  <span className="truncate">{config?.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {counts?.filtered || 0}/{counts?.total || 0}
                </Badge>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Total: {totalFiltered} calls
        </p>
      </div>

      <Separator />

      {/* Resolution Status */}
      <FilterSection
        title="Resolution Status"
        onSelectAll={() => setFilters({ achievedStatus: ['resolved', 'unresolved', 'unknown'] })}
        onUnselectAll={() => setFilters({ achievedStatus: [] })}
      >
        <div className="grid grid-cols-1 gap-2">
          {(['resolved', 'unresolved', 'unknown'] as AchievedStatus[]).map((status) => (
            <label key={status} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={filters.achievedStatus.includes(status)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange('achievedStatus', status, !!checked)
                }
              />
              <span className="capitalize">{status}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Resolution Types */}
      <FilterSection
        title="Resolution Types"
        onSelectAll={() => setFilters({ resolutionTypes: combinedStats.resolutionTypes })}
        onUnselectAll={() => setFilters({ resolutionTypes: [] })}
      >
        <div className="max-h-40 overflow-y-auto space-y-1">
          {combinedStats.resolutionTypes.map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={filters.resolutionTypes.includes(type)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange('resolutionTypes', type, !!checked)
                }
              />
              <span className="truncate text-xs">{type.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Caller Types */}
      <FilterSection
        title="Caller Types"
        onSelectAll={() => setFilters({ callerTypes: combinedStats.callerTypes })}
        onUnselectAll={() => setFilters({ callerTypes: [] })}
      >
        <div className="max-h-40 overflow-y-auto space-y-1">
          {combinedStats.callerTypes.map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={filters.callerTypes.includes(type)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange('callerTypes', type, !!checked)
                }
              />
              <span className="truncate text-xs">{type.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Primary Intents */}
      <FilterSection
        title="Primary Intents"
        onSelectAll={() => setFilters({ primaryIntents: combinedStats.primaryIntents })}
        onUnselectAll={() => setFilters({ primaryIntents: [] })}
      >
        <div className="max-h-40 overflow-y-auto space-y-1">
          {combinedStats.primaryIntents.map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={filters.primaryIntents.includes(type)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange('primaryIntents', type, !!checked)
                }
              />
              <span className="truncate text-xs">{type.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Transfer Status */}
      <FilterSection
        title="Transfer Status"
        onSelectAll={() => setFilters({ transferStatus: ['successful', 'failed', 'no_transfer'] })}
        onUnselectAll={() => setFilters({ transferStatus: [] })}
      >
        <div className="grid grid-cols-1 gap-2">
          {(['successful', 'failed', 'no_transfer'] as TransferStatus[]).map((status) => (
            <label key={status} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={filters.transferStatus.includes(status)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange('transferStatus', status, !!checked)
                }
              />
              <span className="capitalize text-xs">{status.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Duration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Call Duration</h4>
          <span className="text-xs text-muted-foreground">
            {formatDuration(filters.durationRange[0])} - {formatDuration(filters.durationRange[1])}
          </span>
        </div>
        <Slider
          min={combinedStats.durationRange[0]}
          max={combinedStats.durationRange[1]}
          step={1}
          value={filters.durationRange}
          onValueChange={handleDurationChange}
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={filters.includeUnknownDuration}
            onCheckedChange={(checked) =>
              setFilters({ includeUnknownDuration: !!checked })
            }
          />
          <span className="text-xs">Include unknown duration</span>
        </label>
      </div>

      <Separator />

      {/* Multi-Case */}
      <FilterSection
        title="Multi-Case"
        onSelectAll={() => setFilters({ multiCase: ['true', 'false', 'unknown'] })}
        onUnselectAll={() => setFilters({ multiCase: [] })}
      >
        <div className="grid grid-cols-1 gap-2">
          {(['true', 'false', 'unknown'] as MultiCaseStatus[]).map((status) => (
            <label key={status} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={filters.multiCase.includes(status)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange('multiCase', status, !!checked)
                }
              />
              <span className="capitalize text-xs">{status === 'true' ? 'Yes' : status === 'false' ? 'No' : 'Unknown'}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}
