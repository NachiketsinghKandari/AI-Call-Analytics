# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production (runs prebuild hook to generate all sample data)
npm run lint             # Run ESLint
npm run generate-sample  # Generate Firm 1 sample data from data/ folder
npm run generate-vapi    # Generate VAPI sample data
npm run generate-mccraw  # Generate Firm 2 sample data
npm run setup-sheets     # Setup Google Sheets for visit logging
```

No test framework is configured. Linting uses ESLint 9 with Next.js config. The `prebuild` hook runs all three generate scripts.

## Architecture

This is a **client-side analytics dashboard** for legal call center data. It transforms JSON call metadata + TXT transcripts into interactive Sankey diagrams, heatmaps, and filterable call records. There is no database - all data is uploaded by users or loaded from pre-generated samples. The app is gated behind JWT authentication.

### Tech Stack
- **Framework**: Next.js 16 with App Router, React 19, TypeScript 5
- **State**: Zustand with localStorage persistence (two stores: `callDataStore.ts`, `compareStore.ts`)
- **UI**: Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Charts**: Plotly.js + D3 Sankey
- **3D**: Three.js / React Three Fiber (wave background, 3D heatmap)
- **Auth**: JWT via jose library, HTTP-only cookies, Next.js middleware
- **Visit Logging**: Google Sheets API (optional, via env vars)

### Key Directories

- `app/` - Next.js App Router pages
  - `app/page.tsx` - Landing page (Analyze vs Compare mode selection)
  - `app/login/page.tsx` - Login page
  - `app/analyze/` - Single-firm analysis pages
    - `page.tsx` - Data source selection (Firm 1, Firm 2, VAPI, Upload)
    - `layout.tsx` - Dashboard layout with navbar, filter sidebar, URL state hydration
    - `flow/page.tsx` - Sankey flow analysis with 5 presets + custom
    - `heatmap/page.tsx` - 2D and 3D heatmap analysis
    - `deep-dive/page.tsx` - Individual file browser with transcripts
    - `info/page.tsx` - Field definitions reference with search, copy, PDF export
  - `app/compare/` - Multi-firm comparison
    - `page.tsx` - Firm selection (pick 2+ firms to compare)
    - `dashboard/page.tsx` - Side-by-side Sankey diagrams, metrics charts, PDF export
    - `dashboard/layout.tsx` - Compare dashboard layout with filter sidebar
  - `app/api/` - API routes
    - `sample-data/route.ts` - Serves Firm 1 pre-generated data
    - `vapi-data/route.ts` - Serves VAPI pre-generated data
    - `mccraw-data/route.ts` - Serves Firm 2 pre-generated data
    - `audio/[...path]/route.ts` - Audio file proxy for VAPI recordings
    - `log-visit/route.ts` - Google Sheets visit logging
    - `logout/route.ts` - Clear auth cookie
- `lib/` - Core logic:
  - `types.ts` - All TypeScript interfaces (FileInfo, FilterState, SankeyData, HeatmapData, etc.)
  - `parser.ts` - JSON/TXT file parsing, transcript matching, sample data loaders
  - `filters.ts` - 10-axis filter system (all filters AND-ed together)
  - `sankey.ts` - Sankey data transformation with 5 preset flows + custom builder
  - `heatmap.ts` - Heatmap cell calculations with 3 presets
  - `plotly-transforms.ts` - Converts SankeyData to Plotly trace format
  - `definitions.ts` - Controlled vocabularies for all 7 categories
  - `comparison.ts` - FirmStats computation for compare mode
  - `csv-export.ts` - CSV export with 17 columns
  - `auth.ts` - JWT creation/verification, credential validation
  - `actions/auth.ts` - Server actions for login/logout
  - `google-sheets.ts` - Google Sheets visit logging
  - `hooks.ts` - `useHydrated()`, `useResponsiveChartHeight()`
  - `utils.ts` - `cn()` for className merging
  - `urlState/` - URL state management for shareable links
    - `types.ts` - UrlState, UrlDataSource types
    - `defaults.ts` - Default filter values, mergeWithDefaults()
    - `encoding.ts` - LZ-string compressed filter state encoding
    - `parsing.ts` - Parse URL search params into state
- `store/` - Zustand stores
  - `callDataStore.ts` - Single-firm analysis state (files, filters, stats, sankeyOptions)
  - `compareStore.ts` - Multi-firm comparison state (selectedFirmIds, firmData, filters)
- `components/` - UI components
  - `charts/` - PlotlySankey, PlotlyHeatmap, Heatmap3D
  - `filters/` - FilterSidebar, CompareFilterSidebar, MobileFilterSheet
  - `layout/` - Navbar (with data source switcher, mode switcher)
  - `data/` - FolderUploader, FileList, FileViewer, FileViewerModal, AudioPlayer
  - `backgrounds/` - WaveBackground (Three.js wave animation)
  - `ui/` - shadcn/ui primitives (button, card, dialog, tabs, etc.)
  - `ShareButton.tsx` - Copy navigation/share URLs
  - `VisitLogger.tsx` - Client-side visit logging trigger
  - `logo.tsx`, `theme-provider.tsx`, `theme-toggle.tsx`
- `scripts/` - Build-time data generators
  - `generate-sample-data.ts` - Processes Firm 1 raw data into pre-generated JSON
  - `generate-vapi-data.ts` - Processes VAPI raw data
  - `generate-mccraw-data.ts` - Processes Firm 2 raw data
  - `setup-google-sheets.ts` - Initialize Google Sheets for visit logging
- `middleware.ts` - Route protection: all pages + API routes require JWT auth
- `hooks/useUrlState.ts` - Hook for reading URL state in pages

### Data Flow

1. User logs in → JWT cookie set → middleware allows access
2. User selects data source (Firm 1/2, VAPI, Upload) or loads shared URL
3. `parser.ts` extracts FileInfo array from JSON/TXT files
4. Data stored in Zustand → `computeStats()` runs → stats available
5. Filters applied via `applyAllFilters()` → filtered files flow to all pages
6. Visualizations (Sankey/Heatmap/File browser) consume filtered data
7. URL state can be shared via compressed query params (LZ-string encoding)

### State Management Pattern

**Single-firm analysis:**
```typescript
import { useCallDataStore } from '@/store/callDataStore';
const { files, filters, stats, sankeyOptions, setFiles, setFilters } = useCallDataStore();
```

**Multi-firm comparison:**
```typescript
import { useCompareStore } from '@/store/compareStore';
const { selectedFirmIds, firmData, filters, toggleFirmSelection } = useCompareStore();
```

### Core Data Types

Key fields in `FileInfo` (`lib/types.ts`):
- `resolution_type`, `caller_type`, `primary_intent` - Categorical from controlled vocabularies
- `resolution_achieved: boolean | null` - Whether call was resolved
- `transfer_success: boolean | null` - Transfer outcome (null = no transfer)
- `transfer_destination: string | null` - Where call was transferred
- `secondary_action: string | null` - Fallback action after failed transfer
- `call_duration: number | null` - Duration in seconds
- `callId: string` - Semantic ID for URL sharing
- `assistantId: string | null` - VAPI assistant ID
- `squadId: string | null` - VAPI squad ID
- `audioUrl: string | null` - Audio recording URL (VAPI)
- `transcript: string | null` - Full call transcript text

Filter axes in `FilterState` (10 total):
- `resolutionTypes`, `callerTypes`, `primaryIntents` - Multi-select string arrays
- `achievedStatus` - 'resolved' | 'unresolved' | 'unknown'
- `transferStatus` - 'successful' | 'failed' | 'no_transfer'
- `transferDestinations` - Multi-select string array
- `durationRange: [number, number]` - Min/max seconds
- `includeUnknownDuration: boolean` - Whether nulls pass filter
- `multiCase` - 'true' | 'false' | 'unknown'
- `assistantIds`, `squadIds` - VAPI-specific multi-select

### Adding Features

**New filter dimension:**
1. Add field to `FilterState` in `lib/types.ts`
2. Add `matches*()` function in `lib/filters.ts`
3. Add to `applyAllFilters()` chain
4. Add UI control in `components/filters/FilterSidebar.tsx`
5. Add to `computeStats()` in both `callDataStore.ts` and `compareStore.ts`

**New Sankey preset:**
1. Create `build*Flow()` function in `lib/sankey.ts`
2. Add case to `buildSankeyData()` switch
3. Add entry to `PRESET_INFO` in `app/analyze/flow/page.tsx`
4. Add tab trigger in the same file

**New data source:**
1. Create generate script in `scripts/`
2. Add npm script in `package.json` and to `prebuild`
3. Create API route in `app/api/`
4. Add loader function in `lib/parser.ts`
5. Add card in `app/analyze/page.tsx` and `app/compare/page.tsx`
6. Add to `FIRM_CONFIGS` in `store/compareStore.ts`
7. Add to navbar data sources in `components/layout/Navbar.tsx`

### Known Workarounds

**Plotly click handler bug**: Plotly.js doesn't bind click handlers on initial render. Both `flow/page.tsx` and `compare/dashboard/page.tsx` use a timed preset-toggle workaround (500-700ms after mount) to force re-binding. Do not remove this.

### Auth System

- `middleware.ts` protects all routes except `/login` and `/api/logout`
- `lib/auth.ts` has credential validation and JWT helpers
- `lib/actions/auth.ts` has server actions for login/logout forms
- Tokens expire after 24h

### Deployment Notes

Optimized for Vercel. Sample data is pre-generated during build via `prebuild` hook. The API routes have fallback paths for Vercel's file structure. Set `JWT_SECRET` env var for production. Google Sheets logging requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_SPREADSHEET_ID`.
