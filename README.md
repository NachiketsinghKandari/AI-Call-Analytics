# AI Call Analytics Dashboard

A client-side analytics dashboard for legal call center data. Transforms JSON call metadata and TXT transcripts into interactive Sankey diagrams, heatmaps, and filterable call records. Supports single-firm deep analysis and multi-firm side-by-side comparison.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **State**: Zustand with localStorage persistence (two stores)
- **UI**: Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Charts**: Plotly.js + D3 Sankey
- **3D**: Three.js / React Three Fiber (wave animation, 3D heatmap)
- **Auth**: JWT via jose (HTTP-only cookies, Next.js middleware)
- **Visit Logging**: Google Sheets API (optional)

## Getting Started

```bash
npm install
cp .env.example .env.local   # optional - configure JWT_SECRET, Google Sheets credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

### Authentication

All pages and API routes (except `/login`) require authentication via JWT. Available credentials:

| Username | Password |
|---|---|
| `admin` | `admin123` |
| `admin@aicallanalytics` | `xqUXCMUhuFPUgxyP` |
| `admin@receptionist.ai` | `admin@receptionist.ai123` |

Tokens expire after 24 hours. Set `JWT_SECRET` in environment for production.

## Scripts

```bash
npm run dev              # Start development server (Turbopack)
npm run build            # Build for production (prebuild generates all sample data)
npm run lint             # Run ESLint 9
npm run generate-sample  # Generate Firm 1 sample data from data/ folder
npm run generate-vapi    # Generate VAPI sample data
npm run generate-mccraw  # Generate Firm 2 sample data
npm run setup-sheets     # Initialize Google Sheets for visit logging
```

## Two Modes

### Analyze (`/analyze`)
Deep dive into a **single firm's** call data:
- **Flow Analysis** - Interactive Sankey diagrams with 5 presets + custom layer builder
- **Heatmap Analysis** - 2D and 3D correlation heatmaps
- **Deep Dive** - Browse individual call records with transcripts and audio
- **Definitions** - Reference guide for all classification fields

### Compare (`/compare`)
**Side-by-side comparison** of 2+ firms:
- Synchronized Sankey diagrams for each firm
- Metrics charts (resolution rate, transfer success, duration, distributions)
- Universal filters that apply to all firms simultaneously
- PDF export of comparison reports

### Pre-loaded Data Sources

| Source | Records | Description |
|--------|---------|-------------|
| Firm 1 | 1,000+ | Sample call data with full transcripts |
| Firm 2 | 486 | Gemini-generated transcripts and analysis |
| VAPI | 730 | AI-generated analysis with audio recordings |
| Upload | varies | User-uploaded JSON + TXT folders |

## Architecture

### Key Directories

```
app/
  page.tsx              # Landing: Analyze vs Compare
  login/page.tsx        # JWT login
  analyze/              # Single-firm analysis
    page.tsx            # Data source selection
    layout.tsx          # Dashboard layout + URL state hydration
    flow/page.tsx       # Sankey flow analysis
    heatmap/page.tsx    # 2D/3D heatmaps
    deep-dive/page.tsx  # File browser with transcripts
    info/page.tsx       # Field definitions
  compare/              # Multi-firm comparison
    page.tsx            # Firm selection
    dashboard/page.tsx  # Side-by-side dashboard
  api/                  # API routes (sample-data, vapi-data, mccraw-data, audio, log-visit, logout)
lib/
  types.ts              # TypeScript interfaces
  parser.ts             # JSON/TXT file parsing
  filters.ts            # 10-axis filter system
  sankey.ts             # 5 Sankey presets + custom
  heatmap.ts            # Heatmap data aggregation
  plotly-transforms.ts  # Sankey → Plotly trace conversion
  definitions.ts        # Controlled vocabularies (7 categories)
  comparison.ts         # FirmStats computation
  csv-export.ts         # CSV export (17 columns)
  auth.ts               # JWT helpers
  google-sheets.ts      # Visit logging
  urlState/             # Shareable URL state (LZ-string compression)
store/
  callDataStore.ts      # Single-firm Zustand store
  compareStore.ts       # Multi-firm Zustand store
components/
  charts/               # PlotlySankey, PlotlyHeatmap, Heatmap3D
  filters/              # FilterSidebar, CompareFilterSidebar, MobileFilterSheet
  layout/               # Navbar with data source and mode switcher
  data/                 # FolderUploader, FileList, FileViewer, FileViewerModal, AudioPlayer
  backgrounds/          # Three.js wave animation
  ui/                   # shadcn/ui primitives
scripts/                # Build-time data generators
middleware.ts           # Route protection (JWT verification)
```

### Data Flow

1. User logs in → JWT cookie set → middleware grants access
2. Select data source or load shared URL → `parser.ts` extracts FileInfo[]
3. Data stored in Zustand → stats auto-computed
4. 10-axis filters applied via `applyAllFilters()` → filtered data flows to all pages
5. Visualizations (Sankey, Heatmap, File browser) consume filtered data
6. Current view + filters shareable via compressed URL params

### URL Sharing

Pages support shareable URLs with compressed filter state using LZ-string encoding. The `ShareButton` component generates both navigation URLs (lightweight) and share URLs (includes full filter state). Shared links auto-load the correct data source and apply saved filters.

## Deployment

Optimized for Vercel. Sample data is pre-generated during build via the `prebuild` hook. API routes have fallback paths for Vercel's output structure.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Production | Secret key for JWT signing |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth for Sheets logging |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth secret |
| `GOOGLE_REFRESH_TOKEN` | Optional | Google OAuth refresh token |
| `GOOGLE_SPREADSHEET_ID` | Optional | Target spreadsheet for visit logs |
