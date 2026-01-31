import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FileInfo, FilterState, DataStats, SankeyOptions, CustomSankeyOptions } from '@/lib/types';

// Firm configuration
export interface FirmConfig {
  id: string;
  name: string;
  endpoint: string | null; // null for uploaded data
  color: string;
  isUpload?: boolean;
}

export const FIRM_CONFIGS: FirmConfig[] = [
  { id: 'sample', name: 'Bey & Associates', endpoint: '/api/sample-data', color: '#3b82f6' },
  { id: 'mccraw', name: 'McCraw Law', endpoint: '/api/mccraw-data', color: '#f59e0b' },
  { id: 'vapi', name: 'VAPI', endpoint: '/api/vapi-data', color: '#22c55e' },
];

// Counter for generating unique upload IDs
let uploadCounter = 0;

// Firm data with files
export interface FirmData {
  config: FirmConfig;
  files: FileInfo[];
  stats: DataStats | null;
  loading: boolean;
  error: string | null;
}

interface CompareState {
  // Selected firms for comparison
  selectedFirmIds: string[];

  // Loaded firm data
  firmData: Record<string, FirmData>;

  // Uploaded data configs (dynamic, user-created)
  uploadedConfigs: FirmConfig[];

  // Universal filters (applies to all firms)
  filters: FilterState;

  // Combined stats from all selected firms (for filter options)
  combinedStats: DataStats | null;

  // Sankey options
  sankeyOptions: SankeyOptions;

  // Filter sidebar visibility
  filterSidebarOpen: boolean;

  // Actions
  setSelectedFirmIds: (ids: string[]) => void;
  toggleFirmSelection: (firmId: string) => void;
  setFirmData: (firmId: string, data: Partial<FirmData>) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSankeyOptions: (options: Partial<SankeyOptions>) => void;
  setFilterSidebarOpen: (open: boolean) => void;
  loadFirmData: (firmId: string) => Promise<void>;
  loadAllSelectedFirms: () => Promise<void>;
  clearComparison: () => void;

  // Upload actions
  addUploadedData: (name: string, files: FileInfo[]) => string;
  removeUploadedData: (uploadId: string) => void;
  getAllConfigs: () => FirmConfig[];
}

const defaultFilters: FilterState = {
  resolutionTypes: [],
  achievedStatus: ['resolved', 'unresolved', 'unknown'],
  callerTypes: [],
  primaryIntents: [],
  transferStatus: ['successful', 'failed', 'no_transfer'],
  transferDestinations: [],
  durationRange: [0, 600],
  includeUnknownDuration: true,
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
  const transferDestinations = new Set<string>();
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
    if (file.transfer_destination) {
      transferDestinations.add(file.transfer_destination);
    }
    if (file.call_duration !== null) {
      minDuration = Math.min(minDuration, file.call_duration);
      maxDuration = Math.max(maxDuration, file.call_duration);
    }
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
    transferDestinations: Array.from(transferDestinations).sort(),
    durationRange: [
      minDuration === Infinity ? 0 : Math.floor(minDuration),
      maxDuration === -Infinity ? 600 : Math.ceil(maxDuration),
    ],
    assistantIds: Array.from(assistantIds).sort(),
    squadIds: Array.from(squadIds).sort(),
  };
}

// Combine stats from multiple firms
function combineStats(firmDataMap: Record<string, FirmData>, selectedIds: string[]): DataStats | null {
  const allFiles: FileInfo[] = [];

  for (const id of selectedIds) {
    const data = firmDataMap[id];
    if (data?.files) {
      allFiles.push(...data.files);
    }
  }

  if (allFiles.length === 0) return null;
  return computeStats(allFiles);
}

// Upload colors for dynamically created uploads
const UPLOAD_COLORS = ['#a855f7', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      selectedFirmIds: [],
      firmData: {},
      uploadedConfigs: [],
      filters: defaultFilters,
      combinedStats: null,
      sankeyOptions: defaultSankeyOptions,
      filterSidebarOpen: true,

      setSelectedFirmIds: (ids) => {
        set({ selectedFirmIds: ids });
        // Recalculate combined stats
        const { firmData } = get();
        const combinedStats = combineStats(firmData, ids);
        if (combinedStats) {
          set({
            combinedStats,
            filters: {
              ...defaultFilters,
              resolutionTypes: combinedStats.resolutionTypes,
              callerTypes: combinedStats.callerTypes,
              primaryIntents: combinedStats.primaryIntents,
              transferDestinations: [...combinedStats.transferDestinations, 'none'],
              durationRange: combinedStats.durationRange,
              assistantIds: combinedStats.assistantIds,
              squadIds: combinedStats.squadIds,
            },
          });
        }
      },

      toggleFirmSelection: (firmId) => {
        const { selectedFirmIds } = get();
        const newIds = selectedFirmIds.includes(firmId)
          ? selectedFirmIds.filter((id) => id !== firmId)
          : [...selectedFirmIds, firmId];
        get().setSelectedFirmIds(newIds);
      },

      setFirmData: (firmId, data) => {
        set((state) => {
          const defaultConfig = FIRM_CONFIGS.find((c) => c.id === firmId)
            || state.uploadedConfigs.find((c) => c.id === firmId)
            || FIRM_CONFIGS[0];
          const existing = state.firmData[firmId] || {
            config: defaultConfig,
            files: [],
            stats: null,
            loading: false,
            error: null,
          };
          const updated = { ...existing, ...data };

          // Compute stats if files were updated
          if (data.files) {
            updated.stats = computeStats(data.files);
          }

          const newFirmData = { ...state.firmData, [firmId]: updated };

          // Recalculate combined stats
          const combinedStats = combineStats(newFirmData, state.selectedFirmIds);

          return {
            firmData: newFirmData,
            combinedStats,
            ...(combinedStats && {
              filters: {
                ...state.filters,
                resolutionTypes: combinedStats.resolutionTypes,
                callerTypes: combinedStats.callerTypes,
                primaryIntents: combinedStats.primaryIntents,
                transferDestinations: [...combinedStats.transferDestinations, 'none'],
                durationRange: combinedStats.durationRange,
              },
            }),
          };
        });
      },

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      resetFilters: () => {
        const { combinedStats } = get();
        if (combinedStats) {
          set({
            filters: {
              ...defaultFilters,
              resolutionTypes: combinedStats.resolutionTypes,
              callerTypes: combinedStats.callerTypes,
              primaryIntents: combinedStats.primaryIntents,
              transferDestinations: [...combinedStats.transferDestinations, 'none'],
              durationRange: combinedStats.durationRange,
              assistantIds: combinedStats.assistantIds,
              squadIds: combinedStats.squadIds,
            },
          });
        } else {
          set({ filters: defaultFilters });
        }
      },

      setSankeyOptions: (options) =>
        set((state) => ({
          sankeyOptions: { ...state.sankeyOptions, ...options },
        })),

      setFilterSidebarOpen: (open) => set({ filterSidebarOpen: open }),

      loadFirmData: async (firmId) => {
        const { uploadedConfigs } = get();
        const config = FIRM_CONFIGS.find((c) => c.id === firmId)
          || uploadedConfigs.find((c) => c.id === firmId);
        if (!config) return;

        // Skip loading for uploaded data (already has files)
        if (config.isUpload || !config.endpoint) {
          return;
        }

        // Set loading state
        get().setFirmData(firmId, { loading: true, error: null });

        try {
          const response = await fetch(config.endpoint);
          if (!response.ok) {
            throw new Error(`Failed to load ${config.name} data`);
          }
          const data = await response.json();
          get().setFirmData(firmId, {
            config,
            files: data.files,
            loading: false,
            error: null,
          });
        } catch (err) {
          get().setFirmData(firmId, {
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load data',
          });
        }
      },

      loadAllSelectedFirms: async () => {
        const { selectedFirmIds, loadFirmData, firmData } = get();
        const loadPromises = selectedFirmIds
          .filter((id) => !firmData[id]?.files?.length)
          .map((id) => loadFirmData(id));
        await Promise.all(loadPromises);
      },

      clearComparison: () =>
        set({
          selectedFirmIds: [],
          firmData: {},
          uploadedConfigs: [],
          filters: defaultFilters,
          combinedStats: null,
        }),

      // Upload actions
      addUploadedData: (name, files) => {
        const { uploadedConfigs, setFirmData, toggleFirmSelection } = get();
        const uploadId = `upload_${++uploadCounter}`;
        const colorIndex = uploadedConfigs.length % UPLOAD_COLORS.length;

        const newConfig: FirmConfig = {
          id: uploadId,
          name: name || `Upload ${uploadCounter}`,
          endpoint: null,
          color: UPLOAD_COLORS[colorIndex],
          isUpload: true,
        };

        set((state) => ({
          uploadedConfigs: [...state.uploadedConfigs, newConfig],
        }));

        // Set the firm data with the uploaded files
        setFirmData(uploadId, {
          config: newConfig,
          files,
          loading: false,
          error: null,
        });

        // Auto-select the uploaded data
        toggleFirmSelection(uploadId);

        return uploadId;
      },

      removeUploadedData: (uploadId) => {
        const { selectedFirmIds } = get();
        set((state) => ({
          uploadedConfigs: state.uploadedConfigs.filter((c) => c.id !== uploadId),
          firmData: Object.fromEntries(
            Object.entries(state.firmData).filter(([id]) => id !== uploadId)
          ),
          selectedFirmIds: selectedFirmIds.filter((id) => id !== uploadId),
        }));
      },

      getAllConfigs: () => {
        const { uploadedConfigs } = get();
        return [...FIRM_CONFIGS, ...uploadedConfigs];
      },
    }),
    {
      name: 'compare-analytics-storage',
      partialize: (state) => ({
        sankeyOptions: state.sankeyOptions,
        selectedFirmIds: state.selectedFirmIds,
        filterSidebarOpen: state.filterSidebarOpen,
      }),
    }
  )
);
