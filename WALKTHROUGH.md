# AI Call Analytics - Complete Codebase Walkthrough

A comprehensive guide to everything in the codebase. Read this on your flight and you'll understand the entire project.

---

## Table of Contents

1. [What This Project Does](#1-what-this-project-does)
2. [The Big Picture](#2-the-big-picture)
3. [Tech Stack Explained](#3-tech-stack-explained)
4. [Project Structure](#4-project-structure)
5. [The Domain: Call Analysis](#5-the-domain-call-analysis)
6. [Authentication System](#6-authentication-system)
7. [Data Model Deep Dive](#7-data-model-deep-dive)
8. [Data Flow: Upload to Visualization](#8-data-flow-upload-to-visualization)
9. [The Parser (`lib/parser.ts`)](#9-the-parser)
10. [The Filter System (`lib/filters.ts`)](#10-the-filter-system)
11. [Sankey Diagrams (`lib/sankey.ts`)](#11-sankey-diagrams)
12. [Heatmaps (`lib/heatmap.ts`)](#12-heatmaps)
13. [State Management (Zustand Stores)](#13-state-management)
14. [Pages Walkthrough](#14-pages-walkthrough)
15. [Compare Mode](#15-compare-mode)
16. [URL Sharing System](#16-url-sharing-system)
17. [Components Architecture](#17-components-architecture)
18. [API Routes](#18-api-routes)
19. [Build & Deploy Pipeline](#19-build--deploy-pipeline)
20. [The Wave Animation](#20-the-wave-animation)
21. [Design Patterns & Workarounds](#21-design-patterns--workarounds)
22. [File-by-File Reference](#22-file-by-file-reference)

---

## 1. What This Project Does

This is a **visual analytics dashboard** for legal call centers. Law firms use AI receptionists to answer calls. Each call produces:
- A **JSON metadata file** with structured analysis (caller type, intent, resolution, transfers, etc.)
- A **TXT transcript** of the conversation

This dashboard lets you upload those files (or use pre-loaded samples) and explore the data through:
- **Sankey flow diagrams** showing how calls flow from intake to resolution
- **Heatmaps** showing correlations between dimensions (who calls vs how it's resolved)
- **A file browser** to inspect individual calls with their transcripts
- **A comparison mode** to compare metrics across multiple law firms side-by-side

There is **no database**. Everything runs client-side in the browser. Data is either uploaded by the user or served from pre-generated JSON bundles.

---

## 2. The Big Picture

```
                          ┌──────────────┐
                          │   /login     │  JWT Auth
                          └──────┬───────┘
                                 │
                          ┌──────▼───────┐
                          │   / (Home)   │  Choose mode
                          └──┬───────┬───┘
                             │       │
                    ┌────────▼──┐ ┌──▼────────┐
                    │  /analyze │ │  /compare  │
                    │  Pick data│ │  Pick 2+   │
                    └────┬──────┘ │  firms     │
                         │        └──┬─────────┘
                 ┌───────▼────────┐  │
                 │ /analyze/flow  │  │
                 │ /analyze/heatmap│ │
                 │ /analyze/deep  │  │
                 │ /analyze/info  │  │
                 └────────────────┘  │
                              ┌──────▼────────────┐
                              │ /compare/dashboard │
                              │ Side-by-side view  │
                              └───────────────────┘
```

**Two modes:**
1. **Analyze** - Pick ONE data source, deep dive with Sankey + heatmap + file browser
2. **Compare** - Pick 2+ firms, see side-by-side Sankey diagrams and metric comparison charts

Both modes share the same filter system, data types, and Sankey engine.

---

## 3. Tech Stack Explained

| Technology | Why It's Used |
|---|---|
| **Next.js 16** | App Router for routing, server components for layout, API routes for data serving |
| **React 19** | UI rendering with hooks, Suspense, `useActionState` for forms |
| **TypeScript 5** | Type safety across all data models and components |
| **Zustand** | Lightweight state management with localStorage persistence. Two stores: one for single-firm, one for compare mode |
| **Tailwind CSS 4** | Utility-first styling with dark mode support |
| **shadcn/ui** | Pre-built accessible components (Button, Card, Dialog, Tabs, etc.) built on Radix UI |
| **Plotly.js** | Interactive charts - Sankey diagrams, 2D heatmaps, bar charts |
| **D3 Sankey** | The underlying algorithm for computing Sankey node/link layout |
| **Three.js** | 3D wave animation on landing page, 3D scatter plot heatmap |
| **React Three Fiber** | React wrapper for Three.js |
| **jose** | JWT creation and verification for auth |
| **LZ-string** | Compression for URL state sharing (filter state → compressed query params) |
| **jsPDF + html2canvas** | PDF export for comparison reports and field definitions |
| **next-themes** | Dark/light theme management |
| **Lucide React** | Icon library |
| **googleapis** | Google Sheets API for visit logging (optional) |

### Key Dev Dependencies
- **ESLint 9** with Next.js config (no Prettier)
- **tsx** for running TypeScript scripts (data generators)
- **Wrangler** listed but not actively used (Cloudflare Workers artifact)

---

## 4. Project Structure

```
AI-Call-Analytics/
├── app/                           # Next.js App Router (all pages)
│   ├── page.tsx                  # Landing page: Analyze or Compare
│   ├── layout.tsx                # Root layout: fonts, ThemeProvider, VisitLogger
│   ├── globals.css               # Tailwind base styles
│   ├── login/page.tsx            # Login form (useActionState)
│   ├── analyze/                  # Single-firm analysis
│   │   ├── page.tsx             # Data source picker (Firm 1, 2, VAPI, Upload)
│   │   ├── layout.tsx           # Navbar + FilterSidebar + URL hydration
│   │   ├── flow/page.tsx        # Sankey diagram page (5 presets + custom)
│   │   ├── heatmap/page.tsx     # 2D/3D heatmap page
│   │   ├── deep-dive/page.tsx   # File browser + viewer
│   │   └── info/page.tsx        # Field definitions reference
│   ├── compare/                  # Multi-firm comparison
│   │   ├── page.tsx             # Firm selection (click to toggle, 2+ required)
│   │   └── dashboard/
│   │       ├── page.tsx         # Side-by-side Sankey + metrics
│   │       └── layout.tsx       # Compare layout with filter sidebar
│   └── api/                      # Server-side API routes
│       ├── sample-data/route.ts # Serve Firm 1 JSON bundle
│       ├── vapi-data/route.ts   # Serve VAPI JSON bundle
│       ├── mccraw-data/route.ts # Serve Firm 2 JSON bundle
│       ├── audio/[...path]/route.ts  # Audio file proxy
│       ├── log-visit/route.ts   # Google Sheets visit logging
│       └── logout/route.ts      # Clear auth cookie
├── lib/                           # Core business logic
│   ├── types.ts                 # ALL TypeScript interfaces
│   ├── parser.ts                # File parsing + transcript matching
│   ├── filters.ts               # 10-axis AND-filter system
│   ├── sankey.ts                # Sankey data builder (5 presets + custom)
│   ├── plotly-transforms.ts     # SankeyData → Plotly trace
│   ├── heatmap.ts               # Heatmap aggregation (3 presets)
│   ├── definitions.ts           # Controlled vocabularies (7 categories, 60+ values)
│   ├── comparison.ts            # FirmStats computation for compare mode
│   ├── csv-export.ts            # CSV generation + download trigger
│   ├── auth.ts                  # JWT sign/verify, credential validation
│   ├── actions/auth.ts          # Server actions: loginAction, logoutAction
│   ├── google-sheets.ts         # Google Sheets API client
│   ├── hooks.ts                 # useHydrated(), useResponsiveChartHeight()
│   ├── utils.ts                 # cn() for className merging (clsx + tailwind-merge)
│   └── urlState/                # URL state management
│       ├── index.ts             # Re-exports
│       ├── types.ts             # UrlState, UrlDataSource
│       ├── defaults.ts          # Default filters, mergeWithDefaults()
│       ├── encoding.ts          # LZ-string compress/decompress filter state
│       └── parsing.ts           # parseUrlState(searchParams)
├── store/                         # Zustand state stores
│   ├── callDataStore.ts         # Single-firm: files, filters, stats, sankeyOptions
│   └── compareStore.ts          # Multi-firm: selectedFirmIds, firmData map, universal filters
├── components/                    # React components
│   ├── charts/
│   │   ├── PlotlySankey.tsx    # Sankey diagram (dynamic Plotly import, click handling)
│   │   ├── PlotlyHeatmap.tsx   # 2D heatmap (Plotly)
│   │   └── Heatmap3D.tsx       # 3D scatter plot (Plotly)
│   ├── filters/
│   │   ├── FilterSidebar.tsx   # Analyze mode: multi-select checkboxes, sliders, counts
│   │   ├── CompareFilterSidebar.tsx  # Compare mode filter sidebar
│   │   └── MobileFilterSheet.tsx     # Mobile bottom-sheet filter UI
│   ├── layout/
│   │   └── Navbar.tsx           # Top nav: logo, mode switcher, page tabs, data source dropdown
│   ├── data/
│   │   ├── FolderUploader.tsx  # Directory upload via webkitdirectory
│   │   ├── FileList.tsx        # Searchable, scrollable file list
│   │   ├── FileViewer.tsx      # Tabbed JSON/transcript viewer
│   │   ├── FileViewerModal.tsx # Modal wrapper for FileViewer (compare mode)
│   │   └── AudioPlayer.tsx     # Audio playback for VAPI recordings
│   ├── backgrounds/
│   │   ├── WaveBackground.tsx  # Three.js wave particle animation
│   │   └── index.ts
│   ├── ui/                      # 20+ shadcn/ui components
│   ├── ShareButton.tsx          # Copy nav/share URLs to clipboard
│   ├── VisitLogger.tsx          # Auto-logs visits to Google Sheets
│   ├── logo.tsx                 # App logo component
│   ├── theme-provider.tsx       # next-themes provider wrapper
│   └── theme-toggle.tsx         # Dark/light toggle button
├── hooks/
│   └── useUrlState.ts           # Parse URL state for pages
├── scripts/                       # Build-time data generators (run by prebuild)
│   ├── generate-sample-data.ts  # Firm 1 raw data → public/sample-data.json
│   ├── generate-vapi-data.ts    # VAPI raw data → public/vapi-data.json
│   ├── generate-mccraw-data.ts  # Firm 2 raw data → public/mccraw-data.json
│   └── setup-google-sheets.ts   # Initialize Google Sheets headers
├── data/                          # Raw call data files (JSON + TXT, gitignored in production)
├── public/                        # Static assets + pre-generated data bundles
├── middleware.ts                  # JWT auth for all routes
├── next.config.ts                # Next.js config (Turbopack)
├── package.json                  # Dependencies + scripts
├── tsconfig.json                 # TypeScript config
└── tailwind.config.ts            # Tailwind CSS config (if present)
```

---

## 5. The Domain: Call Analysis

This system analyzes calls handled by AI receptionists at law firms. Each call is classified along multiple dimensions by an AI (originally Gemini, but the dashboard is AI-agnostic).

### Classification Categories

**Caller Type** - Who is calling:
- `insurance_rep` - Insurance company representative
- `new_client` - First-time potential client
- `existing_client` - Current client with active case
- `medical_provider` - Healthcare professional
- `family_member` - Relative of a client
- `law_office` - Staff from another law firm
- `sales_vendor` - Solicitor offering products/services
- `business_vendor` - Supplier or service provider
- `spanish_speaker` - Requires Spanish support (takes priority)
- `unknown`

**Primary Intent** - Why they're calling:
- `speak_with_staff` - Want to talk to specific person
- `check_case_status` - Case progress update
- `financial_and_settlement_inquiry` - Money questions
- `new_client_intake` - Want legal representation
- `legal_operations_discussion` - Case strategy
- `document_and_evidence_submission` - File submission
- `administrative_request` - Address change, etc.
- `scheduling_and_appointments` - Book/cancel meetings
- `returning_call` - Returning a missed call
- `verify_representation` - Third party checking
- `solicitation_and_spam` - Junk calls
- `unknown_or_undetermined`

**Resolution Type** - How the call was handled:
- `transfer_attempted` - Tried to transfer (MUST be set if any transfer destination recorded)
- `information_provided` - Answered directly
- `callback_scheduled` - Arranged callback
- `message_taken` - Took a message
- `intake_completed` - New client intake done
- `pending_action` - Needs follow-up
- `interaction_failed` - No productive outcome
- `unresolved_staff_unavailable` - Couldn't reach staff
- `other`, `no_resolution_type`

**Transfer Destinations** - Where calls go:
- `case_management`, `legal_counsel`, `billing_and_disbursements`
- `intake_and_investigation`, `administration_and_operations`
- `specific_staff_member`, voicemail variants, `unspecified_internal_transfer`

### Key Business Rules

1. If any transfer destination is recorded, resolution type **must** be `transfer_attempted`
2. Transfer connection status = true means caller entered transfer path (not necessarily that staff answered)
3. Resolution achieved = true only if transfer succeeded OR fallback was accepted
4. Spanish speakers are always classified as `spanish_speaker` regardless of other attributes
5. Secondary action can only be set if transfer failed AND a fallback was accepted

---

## 6. Authentication System

### Flow
```
Browser → /login → POST loginAction (server action)
  → validateCredentials() → createToken() → set cookie → redirect to /

Browser → any protected route → middleware.ts
  → reads auth-token cookie → jwtVerify() → allow or redirect to /login
```

### Files
- **`middleware.ts`** - Runs on every request. Checks JWT in cookie. Protects all routes except `/login` and `/api/logout`. Returns 401 JSON for API routes, redirects to `/login` for page routes.
- **`lib/auth.ts`** - `validateCredentials()` checks username/password against hardcoded pairs. `createToken()` creates JWT with 24h expiry. `verifyToken()` and `getUsernameFromToken()` for verification.
- **`lib/actions/auth.ts`** - Server actions used by the login form. `loginAction()` validates, creates token, sets HTTP-only cookie, redirects. `logoutAction()` clears cookie.
- **`app/login/page.tsx`** - Login form using React 19's `useActionState` for form handling. Show/hide password toggle.

### Visit Logging
When a user logs in and visits the dashboard, `VisitLogger.tsx` (in root layout) makes a POST to `/api/log-visit`. The API route extracts the username from the JWT and appends a row to a Google Sheet via the Sheets API. This is optional and requires Google API credentials in env vars.

---

## 7. Data Model Deep Dive

### Core Type: `FileInfo` (`lib/types.ts`)

This is the central data structure. Every call record becomes a `FileInfo`:

```typescript
interface FileInfo {
  // Identity
  id: string;              // Random unique ID
  path: string;            // Original file path
  name: string;            // Filename
  callId: string;          // Semantic ID for URLs (prefix before _gemini)

  // Classification (from AI analysis)
  resolution_type: string;           // How it was resolved
  caller_type: string;               // Who called
  resolution_achieved: boolean | null; // Did it resolve?
  transfer_success: boolean | null;   // Did transfer connect?
  transfer_destination: string | null; // Where was it transferred?
  secondary_action: string | null;    // Fallback action
  call_duration: number | null;       // Seconds
  primary_intent: string | null;      // Why they called
  final_outcome: string;             // Free-text summary

  // Content
  transcript: string | null;  // Full conversation text
  data: CallData;             // Original JSON structure

  // VAPI-specific
  assistantId: string | null;
  squadId: string | null;
  audioUrl: string | null;    // Audio recording URL
}
```

### Filter State: `FilterState`

10 filter axes, all AND-ed together:

```typescript
interface FilterState {
  resolutionTypes: string[];        // Multi-select
  achievedStatus: AchievedStatus[]; // 'resolved' | 'unresolved' | 'unknown'
  callerTypes: string[];            // Multi-select
  primaryIntents: string[];         // Multi-select
  transferStatus: TransferStatus[]; // 'successful' | 'failed' | 'no_transfer'
  transferDestinations: string[];   // Multi-select
  durationRange: [number, number];  // Min/max seconds
  includeUnknownDuration: boolean;  // Include null durations?
  multiCase: MultiCaseStatus[];     // 'true' | 'false' | 'unknown'
  assistantIds: string[];           // VAPI-specific
  squadIds: string[];               // VAPI-specific
}
```

### Sankey Types

```typescript
interface SankeyNode {
  id: string; label: string; count: number;
  percentage: number; color: string; depth: number;
}

interface SankeyLink {
  source: string; target: string; value: number;
  color: string; sourceFiles: FileInfo[];  // Files flowing through this link
}

type SankeyPreset = 'resolution' | 'transfer' | 'caller' | 'intent' | 'custom';
```

The `sourceFiles` on each link is what enables clicking a Sankey link to see the actual call records.

---

## 8. Data Flow: Upload to Visualization

### Step 1: Data Loading
User picks a source on `/analyze`:
- **Pre-loaded firms**: Fetch from `/api/sample-data`, `/api/vapi-data`, or `/api/mccraw-data`
- **Upload**: `FolderUploader` uses `webkitdirectory` to get a folder of JSON+TXT files

### Step 2: Parsing (`parser.ts`)
For uploaded files: `processFiles()` separates JSON and TXT, parses each JSON, matches transcripts by filename pattern, computes derived fields (transfer success, destination).

For pre-loaded data: API returns already-parsed FileInfo[] (generated at build time by scripts).

### Step 3: Store in Zustand
`setFiles(files)` triggers:
- `computeStats()` - Scans all files to find unique values for each dimension, duration range
- Sets default filters to include all values (everything selected = no filtering)
- Auto-selects first file for Deep Dive

### Step 4: Filtering
Every page calls:
```typescript
const filteredFiles = useMemo(() => applyAllFilters(files, filters), [files, filters]);
```

This runs 10 matcher functions. A file must pass ALL of them. Empty filter arrays = pass (no restriction).

### Step 5: Visualization
- **Flow page**: `buildSankeyData(filteredFiles, options)` → `buildPlotlySankeyTrace()` → Plotly renders
- **Heatmap page**: `aggregateHeatmapData(filteredFiles, xDim, yDim)` → Plotly heatmap
- **Deep Dive**: `FileList` shows filtered files, `FileViewer` shows selected file's JSON + transcript

---

## 9. The Parser

**File: `lib/parser.ts`**

### `processFiles(files: File[]): Promise<FileInfo[]>`
1. Separates uploads into JSON files and TXT files (by extension)
2. For each JSON file:
   - Reads content, calls `parseCallData()` to extract `CallData`
   - Handles array-wrapped JSON: `[{...}]` → `{...}`
   - Finds matching TXT by calling `matchTxtFile()`
   - Computes `transfer_success` from `transfer_connection_status` array
   - Creates `FileInfo` with all fields
3. Sorts results by path

### `matchTxtFile(jsonName, txtFiles)`
Pattern matching:
- `call.json` → `call.txt` (direct)
- `call_gemini.json` → `call.txt` (remove suffix)
- Also handles `_deepgram`, `_soniox`, `_assemblyai` suffixes

### `computeTransferSuccess(status)`
- Empty/no array → `null` (no transfer)
- At least one `true` → `true` (connected)
- All `false` → `false` (failed)

### Data Loaders
- `loadSampleData()`, `loadVapiData()`, `loadMccrawData()` - Simple fetch from API routes

---

## 10. The Filter System

**File: `lib/filters.ts`**

### Architecture
10 independent matcher functions, each taking a file and filter value(s):

| Function | Logic |
|---|---|
| `matchesResolutionType(file, types[])` | file.resolution_type in types |
| `matchesAchieved(file, status[])` | Maps true→'resolved', false→'unresolved', null→'unknown' |
| `matchesCallerType(file, types[])` | file.caller_type in types |
| `matchesPrimaryIntent(file, intents[])` | file.primary_intent in intents |
| `matchesTransferSuccess(file, status[])` | Maps true→'successful', false→'failed', null→'no_transfer' |
| `matchesTransferDestination(file, dests[])` | file.transfer_destination in dests, null matches 'none' |
| `matchesDuration(file, range, includeUnknown)` | file.call_duration within [min, max] |
| `matchesMultiCase(file, values[])` | Checks data.call_summary.multi_case_details |
| `matchesAssistantId(file, ids[])` | VAPI-specific |
| `matchesSquadId(file, ids[])` | VAPI-specific |

### `applyAllFilters(files, filters)`
Simple AND chain:
```typescript
return files.filter(file =>
  matchesResolutionType(file, filters.resolutionTypes) &&
  matchesAchieved(file, filters.achievedStatus) &&
  matchesCallerType(file, filters.callerTypes) &&
  // ... all 10 matchers
);
```

**Key behavior**: Empty arrays = pass (no restriction). This means when all checkboxes are checked for a dimension, the array is full and everything passes. When nothing is checked, the array is empty and everything passes too (intentional - avoids showing zero results).

### `calculateDimensionCounts(files, dimension)`
Used by FilterSidebar to show counts next to each checkbox.

### `searchFiles(files, query)`
Text search across name, final_outcome, caller_type, path.

---

## 11. Sankey Diagrams

**File: `lib/sankey.ts`**

The Sankey engine builds layered flow diagrams from FileInfo arrays. Each preset defines what layers to show and how to group files.

### 5 Presets

**1. Resolution Overview** (`buildResolutionFlow`):
```
All Calls → Resolved/Unresolved/Unknown → Resolution Types (per status)
```
Shows the big picture: how many calls resolve vs don't, and what resolution types are used.

**2. Transfer Deep-Dive** (`buildTransferFlow`):
```
All Transfers → Connected/Failed/Unknown → Destinations → Secondary Actions
```
Filters to only transfer-related calls. Shows transfer outcomes, where calls go, and what fallback actions are taken.

**3. Caller Analysis** (`buildCallerFlow`):
```
All Calls → Caller Types → Resolved/Unresolved → Resolution Types (top 5)
```
Shows who's calling and how their calls are resolved.

**4. Intent Journey** (`buildIntentFlow`):
```
All Calls → Primary Intents → Resolved/Unresolved → Resolution Types (top 4)
```
Shows why people call and the outcomes.

**5. Custom** (`buildCustomFlow`):
Dynamically builds layers based on user toggles. 7 toggleable layers:
- Caller Type, Intent, Resolution Status, Resolution Type (general)
- Transfer Status, Destination, Secondary Action (transfer-specific, filters to relevant files)

### How It Works

Each preset builds `SankeyNode[]` and `SankeyLink[]`. Nodes have depth (column position), links have value (width) and `sourceFiles` (the actual FileInfo[] flowing through that link).

The key insight: **links carry the source files**. When a user clicks a link in the Sankey diagram, the component looks up `sourceFiles` to show which calls match that flow path.

### Color System
Semantic colors: green=resolved, red=unresolved, emerald=transfer success, orange=transfer failed. Resolution types get blues/purples, intents get warm-to-cool gradient.

### Plotly Transform (`lib/plotly-transforms.ts`)
`buildPlotlySankeyTrace()` converts the abstract SankeyData into Plotly's specific format (node labels, link sources/targets as integer indices, colors, layout). Also builds `linkToFilesMap` for click handling.

---

## 12. Heatmaps

**File: `lib/heatmap.ts`**

### 2D Heatmaps
`aggregateHeatmapData(files, xDimension, yDimension)` cross-tabulates two dimensions:

3 presets:
1. Resolution Type vs Caller Type
2. Resolution Type vs Primary Intent
3. Caller Type vs Primary Intent

Returns cells with count and percentage for each (x, y) combination.

### 3D Heatmap
`Heatmap3D` component uses Plotly's 3D scatter plot. All three dimensions (resolution, caller, intent) shown simultaneously. Marker size and color intensity represent count.

---

## 13. State Management

### Single-Firm Store: `store/callDataStore.ts`

```typescript
interface CallDataState {
  files: FileInfo[];                    // All loaded files
  isLoading: boolean;
  error: string | null;
  dataSource: 'none' | 'sample' | 'uploaded' | 'vapi' | 'mccraw';
  stats: DataStats | null;              // Computed unique values, ranges
  filters: FilterState;                 // Current filter settings
  selectedFileId: string | null;        // Selected file in Deep Dive
  sankeyOptions: SankeyOptions;         // Current preset + custom toggles
}
```

**Key actions:**
- `setFiles(files)` - Stores files, computes stats, resets filters to include all values
- `setFilters(partial)` - Merges partial filter update
- `resetFilters()` - Resets to all-inclusive defaults based on current stats
- `hydrateFromUrl(urlFilters)` - Applies filters from a shared URL

**Persistence**: Only `sankeyOptions` persists to localStorage (your preset preference survives page reloads). Files and filters are NOT persisted to avoid stale data.

### Compare Store: `store/compareStore.ts`

```typescript
interface CompareState {
  selectedFirmIds: string[];            // Which firms are selected
  firmData: Record<string, FirmData>;   // Files + stats per firm
  uploadedConfigs: FirmConfig[];        // User-uploaded data configs
  filters: FilterState;                 // Universal filters (applies to ALL firms)
  combinedStats: DataStats | null;      // Merged stats from all selected firms
  sankeyOptions: SankeyOptions;
  filterSidebarOpen: boolean;
}
```

**Key design**: Universal filters. When you adjust a filter in compare mode, it applies to ALL firms simultaneously. This ensures fair comparison.

**Firm configs** (`FIRM_CONFIGS`):
```typescript
{ id: 'sample', name: 'Firm 1', endpoint: '/api/sample-data', color: '#3b82f6' }
{ id: 'mccraw', name: 'Firm 2', endpoint: '/api/mccraw-data', color: '#f59e0b' }
{ id: 'vapi',   name: 'VAPI',   endpoint: '/api/vapi-data',   color: '#22c55e' }
```

Users can also upload their own data via `addUploadedData(name, files)`.

---

## 14. Pages Walkthrough

### Landing Page (`app/page.tsx`)
- Two cards: "Analyze" and "Compare" with descriptions and feature badges
- Three.js wave animation background (dynamic import, no SSR)
- Theme toggle in header

### Login (`app/login/page.tsx`)
- Form with `useActionState` for server action handling
- Show/hide password toggle
- Redirects to `callbackUrl` after login

### Data Selection (`app/analyze/page.tsx`)
- 4 cards: Firm 1, Firm 2, VAPI, Upload
- Loading state with spinner per source
- Redirects to `/analyze/flow` once data loads
- `FolderUploader` component for upload card

### Analyze Layout (`app/analyze/layout.tsx`)
- **Dashboard shell**: Navbar (top) + FilterSidebar (left, 72px wide) + main content area
- **URL hydration**: Reads search params, loads correct data source for shared URLs
- **Mobile**: Filter sidebar hidden, replaced by floating action button → MobileFilterSheet
- **Shared URL flow**: Detects `?s=...&d=...` params, loads data, applies filters

### Flow Analysis (`app/analyze/flow/page.tsx`)
- **KPI cards**: Total calls, resolution rate, unresolved count, transfer success, avg duration, top intent
- **Preset tabs**: Resolution, Transfers, Callers, Intents, Custom
- **Custom panel**: Toggle switches for 7 layers, grouped by General and Transfer
- **Sankey chart**: Full-width Plotly Sankey with click handling → opens FileViewerModal
- **Share button**: Generates compressed URL with current filters + preset
- **Plotly workaround**: Auto-toggles preset on mount (500-700ms) to fix click handler binding

### Heatmap Analysis (`app/analyze/heatmap/page.tsx`)
- **Stats cards**: Total calls, resolution types count, caller types count, intents count
- **2D/3D toggle**: Switch between Plotly heatmap and 3D scatter
- **Dimension tabs**: Resolution vs Caller, Resolution vs Intent, Caller vs Intent
- **3D view**: All three dimensions at once with interactive rotation

### Deep Dive (`app/analyze/deep-dive/page.tsx`)
- **Stats**: Filtered files count, total duration, files with transcripts, resolution types
- **Collapsible file list**: Search, scroll, click to select
- **File viewer**: Tabbed (JSON + Transcript), prev/next navigation
- **Audio player**: For VAPI files with audio recordings

### Definitions (`app/analyze/info/page.tsx`)
- **Search**: Filter definitions by text across value, label, description
- **Categories**: 7 collapsible sections (Caller Type, Intent, Resolution Type, etc.)
- **Export**: Copy as Markdown, Export as PDF (jsPDF)
- **System rules**: 5 key business rules displayed prominently

---

## 15. Compare Mode

### Firm Selection (`app/compare/page.tsx`)
- Cards for each pre-loaded firm + any uploaded data
- Click to toggle selection (checkmark appears)
- Upload card with folder picker + drag-and-drop
- "Start Comparison" button (requires 2+ selections)
- Clears previous comparison on mount

### Compare Dashboard (`app/compare/dashboard/page.tsx`)

**Sankey View:**
- Side-by-side Sankey diagrams (2 firms = 2 columns, 3 = single column each)
- Same preset applied to all firms simultaneously
- Click a link → shows files in "Selected Flow" section below
- FileViewerModal for inspecting individual calls

**Metrics View:**
- Bar charts: Resolution Rate, Transfer Success, Avg Duration, Total Calls
- Distribution charts: Resolution Types, Caller Types, Primary Intents (grouped bars)
- Each firm gets its own color

**Features:**
- Universal filters (sidebar applies to all firms)
- PDF export (jsPDF + html2canvas capture of charts)
- URL sharing with firm IDs in params

### Compare Layout (`app/compare/dashboard/layout.tsx`)
- Similar to analyze layout but with CompareFilterSidebar
- URL state hydration for shared comparison links

---

## 16. URL Sharing System

**Files: `lib/urlState/`**

### How It Works
1. User clicks Share button → `createShareUrl()` generates URL
2. Filter state is serialized to JSON, compressed with LZ-string, encoded as base64 query param
3. Data source (`d=sample`), preset (`p=resolution`), and optional call ID (`c=...`) added as plain params
4. Recipient opens URL → `parseUrlState()` reads params
5. Layout effect loads correct data source, then hydrates filters from compressed state

### URL Parameters
| Param | Purpose |
|---|---|
| `d` | Data source: `sample`, `mccraw`, `vapi` |
| `s` | Compressed filter state (LZ-string) |
| `p` | Sankey preset |
| `c` | Call ID (for deep-linking to specific file) |
| `i` | File index within results |
| `f` | Firm IDs for compare mode (comma-separated) |

### Two URL Types
- **Navigation URL** (lightweight): Just data source + preset + optional call ID
- **Share URL** (full state): Navigation + compressed filter state

---

## 17. Components Architecture

### Chart Components

**`PlotlySankey`** (`components/charts/PlotlySankey.tsx`):
- Dynamic import of `react-plotly.js` (no SSR)
- Takes files + options, builds Plotly trace via `buildPlotlySankeyTrace()`
- Click handler maps Plotly point events to FileInfo arrays
- FileViewerModal for viewing clicked files
- Mount state machine to handle Plotly initialization quirks

**`PlotlyHeatmap`** (`components/charts/PlotlyHeatmap.tsx`):
- Takes files + x/y dimensions, builds heatmap via `aggregateHeatmapData()`
- Annotated cells with count and percentage
- Theme-aware colors

**`Heatmap3D`** (`components/charts/Heatmap3D.tsx`):
- 3D Plotly scatter plot
- All three dimensions: resolution (X), caller (Y), intent (Z)
- Marker size proportional to count

### Filter Components

**`FilterSidebar`** (`components/filters/FilterSidebar.tsx`):
- Scrollable sidebar with sections for each filter dimension
- Checkboxes with real-time count badges
- Duration range slider
- "Select All" / "Select None" per section
- Reset all filters button
- Shows filtered count / total count

**`MobileFilterSheet`** (`components/filters/MobileFilterSheet.tsx`):
- Bottom-sheet (Radix Sheet) for mobile
- Same filter controls as sidebar
- Floating action button trigger

### Data Components

**`FolderUploader`** (`components/data/FolderUploader.tsx`):
- Uses `webkitdirectory` attribute for folder selection
- Processes files via `processFiles()` from parser
- Compact mode for data selection page

**`FileList`** (`components/data/FileList.tsx`):
- Searchable list with `searchFiles()`
- Virtual scrolling via ScrollArea
- Shows caller type, resolution type, duration per file
- Click to select → updates selectedFileId in store

**`FileViewer`** (`components/data/FileViewer.tsx`):
- Tabbed view: "Details" (JSON metadata) and "Transcript"
- Audio player for VAPI files
- Previous/Next navigation
- CSV export for current selection

**`FileViewerModal`** (`components/data/FileViewerModal.tsx`):
- Dialog wrapper around FileViewer
- Used in Flow page and Compare dashboard
- Navigation between files in selection
- Share URL per file

### Layout Components

**`Navbar`** (`components/layout/Navbar.tsx`):
- Logo + mode switcher (Analyze/Compare dropdown)
- Navigation tabs (Flow, Heatmap, Deep Dive, Definitions)
- Data source dropdown (switch between firms without leaving dashboard)
- Mobile: hamburger menu with full navigation
- Theme toggle + sign out in overflow menu

**`WaveBackground`** (`components/backgrounds/WaveBackground.tsx`):
- Three.js particle wave with custom GLSL shaders
- Mouse-interactive ripples
- Simplex noise ambient waves
- Responsive grid density (mobile vs desktop)
- See `docs/WAVE_ANIMATION.md` for full technical details

---

## 18. API Routes

All API routes (except `/api/logout`) require JWT authentication (enforced by middleware).

| Route | Method | Purpose |
|---|---|---|
| `/api/sample-data` | GET | Returns Firm 1 pre-generated FileInfo[] bundle |
| `/api/vapi-data` | GET | Returns VAPI pre-generated FileInfo[] bundle |
| `/api/mccraw-data` | GET | Returns Firm 2 pre-generated FileInfo[] bundle |
| `/api/audio/[...path]` | GET | Proxies audio files for VAPI recordings |
| `/api/log-visit` | POST | Logs username + timestamp to Google Sheets |
| `/api/logout` | POST | Clears auth cookie, redirects to /login |

### Data API Pattern
Each data route reads a pre-generated JSON file from `public/` (with fallback paths for Vercel). The JSON contains `{ files: FileInfo[] }`. These files are generated at build time by the scripts in `scripts/`.

---

## 19. Build & Deploy Pipeline

### Build Process
```bash
npm run build
  → prebuild: npm run generate-sample && npm run generate-vapi && npm run generate-mccraw
    → Each script reads raw data from data/, processes into FileInfo[], writes to public/*.json
  → next build (Next.js production build)
```

### Scripts (`scripts/`)
Each generator script:
1. Reads raw JSON + TXT files from a data directory
2. Parses them using the same logic as `parser.ts`
3. Writes a bundled `{ files: FileInfo[] }` JSON to `public/`
4. This JSON is then served by the API routes

### Deployment (Vercel)
- Next.js optimized for Vercel
- API routes search multiple paths for data files (handles Vercel's output directory structure)
- No database needed
- Set `JWT_SECRET` env var for production
- Optional: Google Sheets env vars for visit logging

---

## 20. The Wave Animation

The landing page features a Three.js particle wave animation. Full documentation in `docs/WAVE_ANIMATION.md`.

Quick summary:
- 50x50 grid of dots (30x30 on mobile)
- Custom GLSL vertex shader: 3 layers of simplex noise + mouse-interactive ripples
- Custom GLSL fragment shader: circular dots with glow, depth fading
- React Three Fiber for React integration
- Dynamic import with `ssr: false` (Three.js requires browser)
- Smooth fade-in on load (opacity transition)

---

## 21. Design Patterns & Workarounds

### Hydration Safety
Components that use browser-only APIs (Radix UI, localStorage, window) use `useHydrated()` hook:
```typescript
const hydrated = useHydrated();
if (!hydrated) return <Skeleton />;
return <ActualComponent />;
```
This uses `useSyncExternalStore` (React-recommended pattern) to avoid hydration mismatches.

### Plotly Click Handler Bug
Plotly.js doesn't properly bind click handlers on initial render. Both the Flow page and Compare dashboard use a workaround: after the component mounts, they automatically toggle the Sankey preset to an adjacent value and back (at 500ms and 700ms). This forces Plotly to re-render with properly bound handlers. **Do not remove this workaround.**

### Theme-Aware Charts
All Plotly charts detect dark/light mode via `useTheme()` and adjust:
- Background color, text color, grid color
- Sankey node and link colors

### Responsive Design
- Desktop: Navbar + FilterSidebar (72px) + main content
- Mobile: Navbar with hamburger menu + floating filter button → bottom sheet
- Chart heights adapt via `useResponsiveChartHeight(mobile, tablet, desktop)`

### Data Source Switching
The Navbar allows switching data sources without leaving the dashboard. It fetches new data, updates the store, and all pages instantly reflect the new data (React reactivity through Zustand).

### Filter Default Behavior
When data loads, filters are initialized to include ALL values. This means nothing is filtered out initially. As users uncheck values, the filter becomes restrictive. Empty filter arrays always pass (no restriction on that dimension).

---

## 22. File-by-File Reference

### Core Business Logic (`lib/`)

| File | Lines | Purpose |
|---|---|---|
| `types.ts` | 143 | All TypeScript interfaces: FileInfo, FilterState, SankeyData, HeatmapData, etc. |
| `parser.ts` | 298 | JSON/TXT parsing, transcript matching, sample data loaders |
| `filters.ts` | 220 | 10 matcher functions + applyAllFilters + dimension counts + text search |
| `sankey.ts` | 833 | 5 Sankey presets + custom flow builder with color system |
| `heatmap.ts` | 111 | Heatmap data aggregation with 3 presets |
| `plotly-transforms.ts` | ~200 | SankeyData → Plotly trace conversion with linkToFilesMap |
| `definitions.ts` | 385 | All 7 controlled vocabularies with descriptions |
| `comparison.ts` | 89 | FirmStats: resolution rate, transfer success, avg duration, distributions |
| `csv-export.ts` | 68 | CSV generation with 17 columns + browser download trigger |
| `auth.ts` | 41 | JWT sign/verify with jose, credential validation |
| `actions/auth.ts` | ~40 | Server actions for login/logout |
| `google-sheets.ts` | 55 | Google Sheets API: ensure headers + append visit row |
| `hooks.ts` | 47 | useHydrated (SSR-safe) + useResponsiveChartHeight |
| `utils.ts` | ~5 | cn() className merger |

### URL State (`lib/urlState/`)

| File | Purpose |
|---|---|
| `types.ts` | UrlState interface, UrlDataSource type |
| `defaults.ts` | Default FilterState, mergeWithDefaults() |
| `encoding.ts` | encodeFilterState/decodeFilterState using LZ-string |
| `parsing.ts` | parseUrlState(searchParams) → UrlState |

### Stores (`store/`)

| File | Purpose |
|---|---|
| `callDataStore.ts` | Single-firm Zustand store: files, filters, stats, sankeyOptions. Persists sankeyOptions only. |
| `compareStore.ts` | Multi-firm Zustand store: selectedFirmIds, firmData map, universal filters. Persists sankeyOptions + selectedFirmIds. |

### Pages (`app/`)

| File | Purpose |
|---|---|
| `page.tsx` | Landing page with Analyze/Compare cards + wave background |
| `login/page.tsx` | Login form with useActionState |
| `analyze/page.tsx` | Data source picker (4 cards) |
| `analyze/layout.tsx` | Dashboard shell: navbar + sidebar + URL hydration |
| `analyze/flow/page.tsx` | Sankey diagram with KPIs, presets, custom builder |
| `analyze/heatmap/page.tsx` | 2D/3D heatmap with dimension presets |
| `analyze/deep-dive/page.tsx` | File browser with search, viewer, navigation |
| `analyze/info/page.tsx` | Field definitions with search, export (copy/PDF) |
| `compare/page.tsx` | Firm selection with click-to-toggle cards |
| `compare/dashboard/page.tsx` | Side-by-side Sankey + metrics + PDF export |
| `compare/dashboard/layout.tsx` | Compare dashboard shell with filter sidebar |

### Components

| File | Purpose |
|---|---|
| `charts/PlotlySankey.tsx` | Sankey diagram with click → file selection |
| `charts/PlotlyHeatmap.tsx` | 2D heatmap with annotated cells |
| `charts/Heatmap3D.tsx` | 3D scatter plot heatmap |
| `filters/FilterSidebar.tsx` | Multi-select checkboxes, duration slider, counts |
| `filters/CompareFilterSidebar.tsx` | Compare mode filter sidebar |
| `filters/MobileFilterSheet.tsx` | Mobile bottom-sheet filters |
| `layout/Navbar.tsx` | Top navigation with data source + mode switcher |
| `data/FolderUploader.tsx` | Directory upload component |
| `data/FileList.tsx` | Searchable file list with selection |
| `data/FileViewer.tsx` | JSON + Transcript tabbed viewer |
| `data/FileViewerModal.tsx` | Modal wrapper for FileViewer |
| `data/AudioPlayer.tsx` | Audio playback for VAPI recordings |
| `backgrounds/WaveBackground.tsx` | Three.js wave particle animation |
| `ShareButton.tsx` | Copy navigation/share URLs |
| `VisitLogger.tsx` | Google Sheets visit logging trigger |

---

*End of walkthrough. You now know everything about this codebase.*
