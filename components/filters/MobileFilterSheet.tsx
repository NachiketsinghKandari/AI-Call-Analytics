'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { FilterSidebar } from './FilterSidebar';
import { useCallDataStore } from '@/store/callDataStore';
import { applyAllFilters } from '@/lib/filters';
import { useHydrated } from '@/lib/hooks';

export function MobileFilterSheet() {
  const [open, setOpen] = useState(false);
  const { filters, stats, files } = useCallDataStore();
  const hydrated = useHydrated();

  // Calculate number of active filters (non-default selections)
  const activeFilterCount = useMemo(() => {
    if (!stats) return 0;

    let count = 0;

    // Resolution types - count if not all selected
    if (filters.resolutionTypes.length > 0 && filters.resolutionTypes.length < stats.resolutionTypes.length) {
      count++;
    }

    // Achieved status - count if not all 3 selected
    if (filters.achievedStatus.length > 0 && filters.achievedStatus.length < 3) {
      count++;
    }

    // Caller types - count if not all selected
    if (filters.callerTypes.length > 0 && filters.callerTypes.length < stats.callerTypes.length) {
      count++;
    }

    // Transfer status - count if not all 3 selected
    if (filters.transferStatus.length > 0 && filters.transferStatus.length < 3) {
      count++;
    }

    // Multi-case - count if not all 3 selected
    if (filters.multiCase.length > 0 && filters.multiCase.length < 3) {
      count++;
    }

    // Duration range - count if modified from full range
    if (
      filters.durationRange[0] > stats.durationRange[0] ||
      filters.durationRange[1] < stats.durationRange[1]
    ) {
      count++;
    }

    // VAPI filters
    if (stats.assistantIds.length > 0) {
      const maxAssistantOptions = stats.assistantIds.length + 1; // +1 for "none"
      if (filters.assistantIds.length > 0 && filters.assistantIds.length < maxAssistantOptions) {
        count++;
      }
    }

    if (stats.squadIds.length > 0) {
      const maxSquadOptions = stats.squadIds.length + 1; // +1 for "none"
      if (filters.squadIds.length > 0 && filters.squadIds.length < maxSquadOptions) {
        count++;
      }
    }

    return count;
  }, [filters, stats]);

  // Calculate filtered count for display
  const filteredCount = useMemo(() => {
    if (!files.length) return 0;
    return applyAllFilters(files, filters).length;
  }, [files, filters]);

  // Render placeholder during SSR to avoid Radix ID hydration mismatch
  if (!hydrated) {
    return (
      <Button
        size="icon"
        className="relative rounded-full h-14 w-14 shadow-xl hover:shadow-2xl transition-shadow bg-primary hover:bg-primary/90"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="relative rounded-full h-14 w-14 shadow-xl hover:shadow-2xl transition-shadow bg-primary hover:bg-primary/90"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 h-6 w-6 p-0 flex items-center justify-center text-xs font-bold border-2 border-background"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] flex flex-col rounded-t-xl">
        <SheetHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Filters</SheetTitle>
            {stats && (
              <span className="text-sm text-muted-foreground">
                {filteredCount} / {files.length} files
              </span>
            )}
          </div>
          <SheetDescription className="sr-only">
            Filter call data by various dimensions
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-auto -mx-4">
          <FilterSidebar />
        </div>
      </SheetContent>
    </Sheet>
  );
}
