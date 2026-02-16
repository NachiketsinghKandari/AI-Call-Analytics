# AI Call Analytics Dashboard — Technical Reference

A Next.js-based visual analytics application for analyzing call resolution data from legal receptionist call handling systems. Transforms raw call metadata (JSON) and transcripts (TXT) into interactive Sankey diagrams, heatmaps, and filterable call records. Supports single-firm deep analysis and multi-firm side-by-side comparison.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [Features](#features)
- [Data Model](#data-model)
- [Two Modes](#two-modes)
- [Pages — Analyze Mode](#pages--analyze-mode)
- [Pages — Compare Mode](#pages--compare-mode)
- [Filtering System](#filtering-system)
- [Visualizations](#visualizations)
- [Technology Stack](#technology-stack)
- [State Management](#state-management)
- [Data Processing](#data-processing)
- [URL Sharing](#url-sharing)
- [API Routes](#api-routes)
- [Key Design Patterns](#key-design-patterns)
- [Data Flow](#data-flow)

---

## Overview

**Purpose:** Enable data-driven analysis of call handling operations, resolution patterns, transfer outcomes, and caller journeys for legal call centers.

**Key Capabilities:**
- Interactive Sankey diagrams showing call flow journeys (5 presets + custom builder)
- Multi-dimensional heatmaps for correlation analysis (2D and 3D)
- 10-axis filtering system for precise data exploration
- Individual call record inspection with transcripts and audio playback
- Multi-firm side-by-side comparison with synchronized visualizations
- Shareable URLs with compressed filter state (LZ-string)
- CSV and PDF export
- Comprehensive field definitions reference

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd AI-Call-Analytics

# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env.local   # Set JWT_SECRET, Google Sheets credentials

# Generate sample data (optional, for demo)
npm run generate-sample

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Build for production (prebuild generates all sample data) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint 9 |
| `npm run generate-sample` | Generate Firm 1 sample data from `data/` folder |
| `npm run generate-vapi` | Generate VAPI sample data |
| `npm run generate-mccraw` | Generate Firm 2 sample data |
| `npm run setup-sheets` | Initialize Google Sheets for visit logging |

The `prebuild` hook runs all three generators before `npm run build`.

---

## Authentication

All pages and API routes (except `/login` and `/api/logout`) require JWT authentication.

### Credentials

| Username | Password |
|---|---|
| `admin` | `admin123` |
| `admin@aicallanalytics` | `xqUXCMUhuFPUgxyP` |
| `admin@receptionist.ai` | `admin@receptionist.ai123` |

### How It Works

1. User submits credentials on `/login` page
2. `lib/auth.ts` validates against hardcoded credential pairs using `validateCredentials()`
3. JWT signed with `jose` library (HS256), 24-hour expiry
4. Token stored as HTTP-only cookie (`auth-token`)
5. `middleware.ts` intercepts every request and verifies JWT
   - API routes get 401 JSON response if unauthorized
   - Page routes redirect to `/login`
6. Logout clears the cookie via `/api/logout`

Set `JWT_SECRET` environment variable for production (defaults to a hardcoded fallback).

---

## Project Structure

```
AI-Call-Analytics/
├── app/                              # Next.js App Router
│   ├── page.tsx                     # Landing: Analyze vs Compare mode
│   ├── layout.tsx                   # Root layout (fonts, ThemeProvider, VisitLogger)
│   ├── globals.css                  # Tailwind CSS imports
│   ├── login/page.tsx               # JWT login page
│   ├── analyze/                     # Single-firm analysis mode
│   │   ├── page.tsx                # Data source selection (Firm 1, Firm 2, VAPI, Upload)
│   │   ├── layout.tsx              # Dashboard shell (Navbar + FilterSidebar + URL state hydration)
│   │   ├── flow/page.tsx           # Sankey flow analysis
│   │   ├── heatmap/page.tsx        # 2D/3D heatmap analysis
│   │   ├── deep-dive/page.tsx      # File browser with transcripts + audio
│   │   └── info/page.tsx           # Field definitions reference
│   ├── compare/                     # Multi-firm comparison mode
│   │   ├── page.tsx                # Firm selection (pick 2+)
│   │   └── dashboard/page.tsx      # Side-by-side comparison dashboard
│   └── api/                         # API routes
│       ├── sample-data/route.ts    # Firm 1 data (JSON)
│       ├── vapi-data/route.ts      # VAPI data (JSON)
│       ├── mccraw-data/route.ts    # Firm 2 data (JSON)
│       ├── audio/[callId]/route.ts # Audio proxy for VAPI recordings
│       ├── log-visit/route.ts      # Google Sheets visit logging
│       └── logout/route.ts         # Clear auth cookie
├── components/
│   ├── ui/                          # shadcn/ui primitives (Button, Card, Dialog, Tabs, etc.)
│   ├── charts/                      # Visualization components
│   │   ├── PlotlySankey.tsx        # Plotly Sankey with click handlers
│   │   ├── PlotlyHeatmap.tsx       # Plotly 2D heatmap
│   │   └── Heatmap3D.tsx           # Three.js 3D scatter heatmap
│   ├── filters/                     # Filter UI
│   │   ├── FilterSidebar.tsx       # Analyze mode sidebar (10 filter axes)
│   │   ├── CompareFilterSidebar.tsx # Compare mode sidebar (universal filters)
│   │   └── MobileFilterSheet.tsx   # Mobile bottom sheet filter
│   ├── layout/                      # Navigation
│   │   └── Navbar.tsx              # Logo, mode switcher, nav tabs, data source dropdown, sign out
│   ├── data/                        # Data display
│   │   ├── FolderUploader.tsx      # Drag-and-drop folder upload
│   │   ├── FileList.tsx            # Scrollable file list with search
│   │   ├── FileViewer.tsx          # JSON + transcript tabbed viewer
│   │   ├── FileViewerModal.tsx     # Modal variant for Compare mode
│   │   └── AudioPlayer.tsx         # Audio playback for VAPI calls
│   ├── backgrounds/                 # Visual effects
│   │   └── WaveBackground.tsx      # Three.js / React Three Fiber wave animation
│   ├── VisitLogger.tsx              # Fires POST /api/log-visit on mount
│   └── theme-provider.tsx           # next-themes wrapper
├── lib/                              # Core logic
│   ├── types.ts                     # TypeScript interfaces (FileInfo, FilterState, SankeyData, etc.)
│   ├── definitions.ts               # 7 controlled vocabularies with descriptions
│   ├── parser.ts                    # JSON/TXT parsing + sample/VAPI/Firm 2 loaders
│   ├── filters.ts                   # 10-axis filter implementation
│   ├── sankey.ts                    # 5 Sankey preset builders + custom flow
│   ├── heatmap.ts                   # Heatmap aggregation (3 presets)
│   ├── plotly-transforms.ts         # Sankey → Plotly trace conversion
│   ├── comparison.ts                # FirmStats computation for Compare mode
│   ├── csv-export.ts                # CSV export (17 columns)
│   ├── auth.ts                      # JWT helpers (validate, create, verify)
│   ├── google-sheets.ts             # Google Sheets visit logging
│   ├── hooks.ts                     # useHydrated(), useResponsiveChartHeight()
│   └── urlState/                    # URL state utilities
│       ├── index.ts                # Re-exports
│       ├── encoder.ts              # LZ-string compression/decompression
│       ├── shareUrl.ts             # Share URL generation
│       └── hydrator.ts             # URL → store hydration
├── store/                            # Zustand state management
│   ├── callDataStore.ts             # Single-firm store (files, filters, stats, sankeyOptions)
│   └── compareStore.ts              # Multi-firm store (firmData, universal filters, combined stats)
├── scripts/                          # Build-time data generators
│   ├── generate-sample-data.ts      # Firm 1 generator
│   ├── generate-vapi-data.ts        # VAPI generator
│   └── generate-mccraw-data.ts      # Firm 2 generator
├── middleware.ts                     # Route protection (JWT verification)
├── next.config.ts                   # Next.js config (Turbopack root)
├── tailwind.config.ts               # Tailwind configuration
└── data/                             # Raw source data for generators
```

---

## Features

### Data Input
- **Folder Upload**: Drag-and-drop or file picker for nested folders containing JSON + TXT files
- **Pre-loaded Sources**: Firm 1 (1000+ records), Firm 2 (486 records), VAPI (730 records with audio)
- **Live Source Switching**: Change data source from the Navbar dropdown without leaving the dashboard

### Visual Analytics
- **Sankey Diagrams**: 5 preset flows + custom layer builder with full click interaction
- **Heatmaps**: 2D Plotly heatmaps (3 presets) and 3D Three.js scatter visualization
- **KPI Cards**: Summary metrics (total calls, resolution rate, transfer success, avg duration, top intent, unresolved count)
- **Comparison Charts**: Side-by-side bar charts for resolution rate, transfer success, duration, distributions

### Data Exploration
- **10-Axis Filtering**: Resolution type, achieved status, caller type, primary intent, transfer status, transfer destination, duration range, multi-case flag, assistant ID (VAPI), squad ID (VAPI)
- **Full-Text Search**: Search across file names, outcomes, caller types
- **File Viewer**: JSON metadata + transcript inspection with tabbed UI
- **Audio Player**: Play VAPI call recordings directly in the browser

### User Experience
- **Dark/Light Themes**: System preference detection with manual toggle
- **Responsive Design**: Desktop sidebar + mobile bottom sheet filter
- **Session Persistence**: Sankey options persist to localStorage
- **Shareable URLs**: Compressed filter state in URL params (LZ-string)
- **CSV Export**: 17-column CSV download of filtered data
- **PDF Export**: Comparison reports and definitions as PDF

---

## Data Model

### FileInfo (Core Data Structure)

Each call record contains:

```typescript
interface FileInfo {
  id: string;                         // Unique identifier
  path: string;                       // File path
  name: string;                       // Filename

  // Classification fields
  resolution_type: string;            // How call was resolved
  caller_type: string;                // Type of caller
  resolution_achieved: boolean | null; // Whether call was resolved
  transfer_success: boolean | null;   // Transfer outcome (null = no transfer)
  transfer_destination: string | null; // Where transfer was directed
  secondary_action: string | null;    // Secondary action taken
  call_duration: number | null;       // Duration in seconds
  primary_intent: string | null;      // Caller's primary intent
  final_outcome: string;              // Final outcome summary
  multi_case: boolean | null;         // Whether caller has multiple cases
  operational_state: string | null;   // Operational state classification
  resolution_basis: string | null;    // Basis for resolution

  // VAPI-specific fields
  callId: string | null;              // VAPI call ID (for audio)
  assistantId: string | null;         // VAPI assistant ID
  squadId: string | null;             // VAPI squad ID
  audioUrl: string | null;            // Direct audio URL

  // Raw data
  transcript: string | null;          // TXT content (matched by filename)
  data: CallData;                     // Original JSON
}
```

### Classification Vocabularies

7 controlled vocabularies defined in `lib/definitions.ts`:

| Category | Example Values |
|----------|---------------|
| **Caller Type** | insurance_rep, medical_provider, new_client, existing_client, spanish_speaker, unknown |
| **Primary Intent** | speak_with_staff, check_case_status, financial_and_settlement_inquiry, new_client_intake |
| **Resolution Type** | transfer_attempted, information_provided, callback_scheduled, message_taken |
| **Transfer Destination** | case_management, legal_counsel, billing_and_disbursements, specific_staff_member |
| **Operational State** | normal_operations, after_hours, lunch_break, staff_unavailable |
| **Resolution Basis** | caller_request_fulfilled, protocol_followed, caller_satisfied |
| **Secondary Action** | voicemail_left, email_sent, follow_up_scheduled |

See the **Definitions** page (`/analyze/info`) in the dashboard for complete vocabularies with descriptions.

---

## Two Modes

### Analyze Mode (`/analyze`)

Deep dive into a **single firm's** call data. Select one data source and explore through four pages:
- Flow Analysis (Sankey)
- Heatmap Analysis (2D/3D)
- Deep Dive (file browser)
- Definitions (reference)

### Compare Mode (`/compare`)

**Side-by-side comparison** of 2 or more firms:
- Select firms on the selection page (click to toggle, drag-and-drop upload for custom data)
- View synchronized Sankey diagrams, metrics charts, and distribution breakdowns
- Universal filters apply to all firms simultaneously
- PDF export of comparison reports

### Navigation Between Modes

The Navbar includes a mode switcher dropdown (Analyze/Compare) visible on all dashboard pages, allowing instant switching between modes.

---

## Pages — Analyze Mode

### 1. Landing Page (`/`)

Entry point with two large cards:
- **Analyze** — Single firm deep dive
- **Compare** — Multi-firm comparison
- Three.js wave animation background

### 2. Data Source Selection (`/analyze`)

Choose data source before entering the dashboard:

| Source | Records | Description |
|--------|---------|-------------|
| Firm 1 | 1,000+ | Sample call data with full transcripts |
| Firm 2 | 486 | Gemini-generated transcripts and analysis |
| VAPI | 730 | AI-generated analysis with audio recordings |
| Upload | varies | User-uploaded JSON + TXT folders |

### 3. Flow Analysis (`/analyze/flow`)

Interactive Sankey diagram visualization with:

**5 Preset Views:**
1. **Resolution Overview**: All Calls → Resolved/Unresolved → Resolution Types
2. **Transfer Deep-Dive**: Transfers → Connected/Failed → Destinations → Actions
3. **Caller Analysis**: All Calls → Caller Types → Resolution Status → Types
4. **Intent Journey**: All Calls → Intents → Resolution Status → Types
5. **Custom**: Configure any combination of layers from available dimensions

**KPI Cards:**
- Total Calls, Resolution Rate, Unresolved Count
- Transfer Success Rate, Average Duration, Top Intent

**Interaction:** Click any Sankey link to select and view associated files in the sidebar.

**Share:** Generate compressed URL with current filters and preset selection.

### 4. Heatmap Analysis (`/analyze/heatmap`)

Cross-dimensional correlation analysis:

**2D Heatmaps (3 presets):**
- Resolution Type x Caller Type
- Resolution Type x Primary Intent
- Caller Type x Primary Intent

**3D Heatmap:**
- Three.js scatter plot with all three dimensions
- Marker size/color indicates count
- Interactive rotation and zoom

### 5. Deep Dive (`/analyze/deep-dive`)

Individual call record browser:

- Searchable, scrollable file list (left panel)
- File statistics cards (count, total duration, transcript count)
- Tabbed viewer: JSON metadata + Transcript text
- Previous/Next navigation buttons
- Audio playback for VAPI calls

### 6. Definitions (`/analyze/info`)

Reference guide for all 7 classification categories:

- Collapsible category sections
- Searchable field definitions
- Copy as Markdown button
- Export as PDF via jsPDF

---

## Pages — Compare Mode

### 7. Firm Selection (`/compare`)

- Click firm cards to toggle selection (need 2+ to proceed)
- Drag-and-drop or click to upload custom JSON data
- "Start Comparison" button activates when 2+ firms selected

### 8. Comparison Dashboard (`/compare/dashboard`)

Side-by-side analysis with:

- **Sankey Diagrams**: One per selected firm, synchronized preset selection
- **Metrics Charts**: Resolution rate, transfer success rate, average duration as grouped bar charts
- **Distribution Charts**: Resolution type, caller type, intent distributions
- **Universal Filters**: CompareFilterSidebar applies to all firms simultaneously
- **Click Interaction**: Click Sankey links to open FileViewerModal with call details
- **PDF Export**: Generate comparison report
- **URL Sharing**: Compressed state including selected firms and filters

---

## Filtering System

### 10-Axis Filters

All filters apply with AND logic across the dashboard:

| Filter | Type | Description |
|--------|------|-------------|
| Resolution Type | Multi-select | Filter by how calls were resolved |
| Resolution Achieved | Multi-select | resolved, unresolved, unknown |
| Caller Type | Multi-select | Filter by caller classification |
| Primary Intent | Multi-select | Filter by caller's primary intent |
| Transfer Status | Multi-select | successful, failed, no_transfer |
| Transfer Destination | Multi-select | Filter by transfer target |
| Call Duration | Range slider | Min/max duration in seconds (0–600) |
| Multi-Case | Multi-select | true, false, unknown |
| Assistant ID | Multi-select | Filter by VAPI assistant (VAPI data only) |
| Squad ID | Multi-select | Filter by VAPI squad (VAPI data only) |

### Filter Implementation (`lib/filters.ts`)

Each axis has a dedicated matcher function:
- `matchesResolutionType()`, `matchesAchieved()`, `matchesCallerType()`
- `matchesPrimaryIntent()`, `matchesTransferSuccess()`, `matchesTransferDestination()`
- `matchesDuration()`, `matchesMultiCase()`, `matchesAssistantId()`, `matchesSquadId()`

Entry point: `applyAllFilters(files, filters)` chains all 10 matchers.

`calculateDimensionCounts()` computes per-value counts for each filter dimension to show in the sidebar.

### Filter Sidebar Features

- Real-time count updates per filter value
- Select All / None buttons per category
- Reset Filters button
- Filtered files count display
- Total duration display
- Tooltips from definitions on hover
- Mobile: accessible via MobileFilterSheet (bottom sheet)

---

## Visualizations

### Sankey Diagram

Built with Plotly.js via `PlotlySankey.tsx`:

- **Nodes**: Represent categories (All Calls, Resolved, Transfer Types, etc.)
- **Links**: Show flow volume between nodes with color coding
- **Colors**: Semantic coloring (green = resolved, red = unresolved, blue = transfers, etc.)
- **Click Interaction**: Click links to select associated files; maps maintained via `nodeToFilesMap` and `linkToFilesMap`
- **Custom Builder**: Pick from available dimensions to build arbitrary flow layers

### Heatmaps

**2D Heatmap** (`PlotlyHeatmap.tsx`):
- Plotly heatmap with color intensity indicating count
- Cell values show count and percentage
- Theme-aware color scale

**3D Heatmap** (`Heatmap3D.tsx`):
- Three.js scatter plot with 3 dimensions
- Marker size proportional to count
- Interactive rotation, zoom, and pan

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| React | React 19 |
| TypeScript | TypeScript 5 |
| State Management | Zustand (2 stores, localStorage persistence) |
| UI Components | Radix UI (shadcn/ui) |
| Styling | Tailwind CSS 4 |
| Charts | Plotly.js |
| 3D | Three.js / React Three Fiber |
| Auth | jose (JWT), HTTP-only cookies |
| Icons | Lucide React |
| Themes | next-themes |
| URL Compression | lz-string |
| PDF Export | jsPDF |

---

## State Management

### Analyze Store (`useCallDataStore`)

Single-firm Zustand store in `store/callDataStore.ts`:

**State:**
- `files`: Loaded FileInfo array
- `filters`: Current 10-axis FilterState
- `stats`: Computed statistics (unique values per dimension)
- `sankeyOptions`: Visualization preferences (preset, custom layers)
- `dataSource`: Current data source identifier
- `selectedFileId`: Current file in Deep Dive

**Actions:**
- `setFiles()`: Load data and compute stats via `computeStats()`
- `setFilters()`: Update any filter axis
- `resetFilters()`: Reset to defaults (all selected, full duration range)
- `setSankeyOptions()`: Change Sankey preset or custom configuration
- `setDataSource()`: Switch data source
- `clearData()`: Clear everything and return to source selection

**Persistence:** Only `sankeyOptions` persists to localStorage.

### Compare Store (`useCompareStore`)

Multi-firm Zustand store in `store/compareStore.ts`:

**State:**
- `selectedFirmIds`: Array of selected firm identifiers
- `firmData`: Map of firm ID → FileInfo array
- `uploadedConfigs`: User-uploaded firm configurations
- `filters`: Universal FilterState applied across all firms
- `combinedStats`: Merged stats from all selected firms

**Actions:**
- `toggleFirm()`: Select/deselect a firm
- `setFirmData()`: Load data for a firm
- `addUploadedData()`: Add user-uploaded firm data
- `setFilters()`: Update universal filters
- `resetFilters()`: Reset universal filters

**Firm Configs:** `FIRM_CONFIGS` array defines available firms (Firm 1, Firm 2, VAPI) with their API endpoints and metadata.

---

## Data Processing

### File Parsing Flow

1. **Upload / Load**: User selects folder or loads pre-generated data via API
2. **Separate**: JSON metadata files and TXT transcripts identified
3. **Parse JSON**: Extract `call_summary`, `transfer_context`, `resolution_context`, etc.
4. **Match Transcripts**: Link TXT files by naming convention (strips provider suffixes like `_gemini`, `_deepgram`)
5. **Compute Fields**: Derive `transfer_success` from `transfer_context.outcome`, `transfer_destination`, `call_duration`
6. **Extract VAPI Fields**: Pull `callId`, `assistantId`, `squadId`, `audioUrl` from raw data
7. **Create FileInfo**: Combine all data into unified structure
8. **Store**: Save to Zustand, trigger `computeStats()`

### Transcript Matching

The parser matches transcripts using these patterns:
- `call_123.json` ↔ `call_123.txt`
- `call_123_gemini.json` ↔ `call_123.txt` (removes provider suffix)
- Case-insensitive, path-aware matching

### Data Loaders

| Function | Source | API Route |
|----------|--------|-----------|
| `loadSampleData()` | Firm 1 | `/api/sample-data` |
| `loadVapiData()` | VAPI | `/api/vapi-data` |
| `loadMccrawData()` | Firm 2 | `/api/mccraw-data` |
| `processFiles()` | Upload | Client-side |

---

## URL Sharing

Pages support shareable URLs with compressed filter state:

### How It Works

1. `ShareButton` component generates a URL
2. Current filters, data source, and page-specific state serialized to JSON
3. JSON compressed with LZ-string encoding
4. Compressed string added as URL search params
5. Recipient opens URL → `analyze/layout.tsx` hydrates store from URL params
6. Correct data source loaded, filters applied, page rendered

### URL State Modules (`lib/urlState/`)

- `encoder.ts`: LZ-string compress/decompress utilities
- `shareUrl.ts`: URL generation with state embedding
- `hydrator.ts`: URL params → store state restoration

Two URL types:
- **Navigation URL**: Lightweight, just data source + page
- **Share URL**: Full state including all filters and visualization options

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/sample-data` | GET | Returns Firm 1 pre-generated JSON (with Vercel fallback paths) |
| `/api/vapi-data` | GET | Returns VAPI pre-generated JSON |
| `/api/mccraw-data` | GET | Returns Firm 2 pre-generated JSON |
| `/api/audio/[callId]` | GET | Proxies VAPI audio recordings |
| `/api/log-visit` | POST | Logs authenticated visit to Google Sheets |
| `/api/logout` | POST | Clears auth cookie |

All routes except `/api/logout` are protected by JWT middleware.

---

## Key Design Patterns

### 1. Client-Side Processing
All filtering, aggregation, and visualization runs client-side. No database. The server only serves pre-generated JSON and handles auth.

### 2. Hydration Safety
Components using Radix UI use `useHydrated()` hook (via `useSyncExternalStore`) to prevent Next.js hydration mismatches between server and client renders.

### 3. Theme-Aware Charts
Plotly layouts dynamically adjust colors, backgrounds, and grid colors based on dark/light theme.

### 4. Persistent Preferences
Sankey visualization options persist across sessions via Zustand's `persist` middleware with localStorage.

### 5. Plotly Click Handler Workaround
Plotly's `plotly_click` event doesn't reliably bind on initial render. The flow and compare pages use a timed toggle workaround: after rendering, briefly switch preset away and back (500–700ms delay) to force Plotly to rebind click handlers. This is a known Plotly.js issue.

### 6. Dynamic Imports
Heavy components (PlotlySankey, PlotlyHeatmap, Heatmap3D, WaveBackground) use `next/dynamic` with `ssr: false` to avoid server-side rendering issues with browser-only libraries.

### 7. Responsive Layout
Desktop: fixed 72px sidebar + main content area. Mobile: floating filter button opens MobileFilterSheet (bottom sheet). Charts use `useResponsiveChartHeight()` for dynamic sizing.

---

## Data Flow

```
User logs in (JWT cookie set)
           ↓
Landing page: Analyze or Compare?
           ↓
    ┌──────┴──────┐
    ↓              ↓
ANALYZE          COMPARE
    ↓              ↓
Select source   Select 2+ firms
    ↓              ↓
Load data       Load all firm data
(API/upload)    (API/upload)
    ↓              ↓
Parse → Store   Parse → Store
(callDataStore)  (compareStore)
    ↓              ↓
┌────────────────────────────┐
│   User adjusts filters     │
│           ↓                │
│  applyAllFilters()         │
│           ↓                │
│  Filtered data propagates  │
│  to all pages/components   │
└────────────────────────────┘
    ↓              ↓
┌───┴───┐    ┌────┴────┐
↓   ↓   ↓    ↓    ↓    ↓
Flow Heatmap Deep  Sankey Metrics
Page  Page  Dive  ×N    Charts
↓     ↓     ↓     ↓     ↓
Sankey Heatmap File  Side-by PDF
Diagram Charts List  -side  Export
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Production | Secret key for JWT signing (defaults to fallback) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth for Sheets visit logging |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth secret |
| `GOOGLE_REFRESH_TOKEN` | Optional | Google OAuth refresh token |
| `GOOGLE_SPREADSHEET_ID` | Optional | Target spreadsheet for visit logs |

---

## Deployment

Optimized for Vercel:
- Sample data pre-generated during build via `prebuild` hook
- API routes have fallback paths for Vercel's `.vercel/output` file structure
- Dynamic imports for all heavy client-side libraries
- Middleware handles auth on edge runtime
