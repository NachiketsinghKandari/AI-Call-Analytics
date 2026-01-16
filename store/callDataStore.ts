import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FileInfo, FilterState, DataStats, SankeyOptions, CustomSankeyOptions } from '@/lib/types';

interface CallDataState {
  // Data
  files: FileInfo[];
  isLoading: boolean;
  error: string | null;
  dataSource: 'none' | 'sample' | 'uploaded' | 'vapi';

  // Computed stats
  stats: DataStats | null;

  // Filters
  filters: FilterState;

  // Selection
  selectedFileId: string | null;

  // Sankey options
  sankeyOptions: SankeyOptions;

  // Actions
  setFiles: (files: FileInfo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDataSource: (source: 'none' | 'sample' | 'uploaded' | 'vapi') => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSelectedFileId: (id: string | null) => void;
  setSankeyOptions: (options: Partial<SankeyOptions>) => void;
  clearData: () => void;
}

const defaultFilters: FilterState = {
  resolutionTypes: [],
  achievedStatus: ['resolved', 'unresolved', 'unknown'],
  callerTypes: [],
  primaryIntents: [],
  transferStatus: ['successful', 'failed', 'no_transfer'],
  durationRange: [0, 600],
  multiCase: ['true', 'false', 'unknown'],
  assistantIds: [],
  squadIds: [],
};

const defaultCustomOptions: CustomSankeyOptions = {
  showCallerType: true,
  showIntent: false,
  showResolutionStatus: true,
  showResolutionType: true,
  showTransferStatus: false,
  showDestination: false,
  showSecondaryAction: false,
};

const defaultSankeyOptions: SankeyOptions = {
  preset: 'resolution',
  customOptions: defaultCustomOptions,
};

function computeStats(files: FileInfo[]): DataStats {
  const resolutionTypes = new Set<string>();
  const callerTypes = new Set<string>();
  const primaryIntents = new Set<string>();
  const assistantIds = new Set<string>();
  const squadIds = new Set<string>();
  let minDuration = Infinity;
  let maxDuration = -Infinity;

  for (const file of files) {
    resolutionTypes.add(file.resolution_type);
    callerTypes.add(file.caller_type);
    if (file.primary_intent) {
      primaryIntents.add(file.primary_intent);
    }
    if (file.call_duration !== null) {
      minDuration = Math.min(minDuration, file.call_duration);
      maxDuration = Math.max(maxDuration, file.call_duration);
    }
    // VAPI-specific fields
    if (file.assistantId) {
      assistantIds.add(file.assistantId);
    }
    if (file.squadId) {
      squadIds.add(file.squadId);
    }
  }

  return {
    totalFiles: files.length,
    resolutionTypes: Array.from(resolutionTypes).sort(),
    callerTypes: Array.from(callerTypes).sort(),
    primaryIntents: Array.from(primaryIntents).sort(),
    durationRange: [
      minDuration === Infinity ? 0 : Math.floor(minDuration),
      maxDuration === -Infinity ? 600 : Math.ceil(maxDuration),
    ],
    assistantIds: Array.from(assistantIds).sort(),
    squadIds: Array.from(squadIds).sort(),
  };
}

export const useCallDataStore = create<CallDataState>()(
  persist(
    (set, get) => ({
      // Initial state
      files: [],
      isLoading: false,
      error: null,
      dataSource: 'none',
      stats: null,
      filters: defaultFilters,
      selectedFileId: null,
      sankeyOptions: defaultSankeyOptions,

      // Actions
      setFiles: (files) => {
        const stats = computeStats(files);
        // Include 'none' in assistant/squad filters to show files without these IDs
        const hasNullAssistant = files.some(f => f.assistantId === null);
        const hasNullSquad = files.some(f => f.squadId === null);
        const newFilters: FilterState = {
          ...defaultFilters,
          resolutionTypes: stats.resolutionTypes,
          callerTypes: stats.callerTypes,
          primaryIntents: stats.primaryIntents,
          durationRange: stats.durationRange,
          assistantIds: hasNullAssistant ? [...stats.assistantIds, 'none'] : stats.assistantIds,
          squadIds: hasNullSquad ? [...stats.squadIds, 'none'] : stats.squadIds,
        };
        set({
          files,
          stats,
          filters: newFilters,
          selectedFileId: files.length > 0 ? files[0].id : null,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setDataSource: (dataSource) => set({ dataSource }),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      resetFilters: () => {
        const { stats, files } = get();
        if (stats) {
          // Include 'none' in assistant/squad filters to show files without these IDs
          const hasNullAssistant = files.some(f => f.assistantId === null);
          const hasNullSquad = files.some(f => f.squadId === null);
          set({
            filters: {
              ...defaultFilters,
              resolutionTypes: stats.resolutionTypes,
              callerTypes: stats.callerTypes,
              primaryIntents: stats.primaryIntents,
              durationRange: stats.durationRange,
              assistantIds: hasNullAssistant ? [...stats.assistantIds, 'none'] : stats.assistantIds,
              squadIds: hasNullSquad ? [...stats.squadIds, 'none'] : stats.squadIds,
            },
          });
        } else {
          set({ filters: defaultFilters });
        }
      },

      setSelectedFileId: (selectedFileId) => set({ selectedFileId }),

      setSankeyOptions: (options) =>
        set((state) => ({
          sankeyOptions: { ...state.sankeyOptions, ...options },
        })),

      clearData: () =>
        set({
          files: [],
          stats: null,
          dataSource: 'none',
          filters: defaultFilters,
          selectedFileId: null,
          error: null,
        }),
    }),
    {
      name: 'resolution-analytics-storage',
      partialize: (state) => ({
        sankeyOptions: state.sankeyOptions,
      }),
    }
  )
);
