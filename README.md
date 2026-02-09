# HelloCounsel Analytics Dashboard

A client-side analytics dashboard for legal call center data. Transforms JSON call metadata and TXT transcripts into interactive Sankey diagrams, heatmaps, and filterable call records.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **State**: Zustand with localStorage persistence
- **UI**: Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Charts**: Plotly.js + D3 Sankey
- **3D**: Three.js (wave dot animation background)
- **Auth**: JWT via jose (HTTP-only cookies)

## Getting Started

```bash
npm install
cp .env.example .env.local   # optional - configure JWT_SECRET
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

### Authentication

The dashboard is gated behind login. Two credential pairs are available:

| Username | Password |
|---|---|
| `admin` | `admin123` |
| `admin@hellocounsel` | `xqUXCMUhuFPUgxyP` |

The home page (`/`) is public. All `/analyze/*`, `/compare/*`, and `/api/*` routes require authentication.

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production (generates sample data via prebuild hook)
npm run lint             # Run ESLint
npm run generate-sample  # Generate sample data from data/ folder
```

## Architecture

### Key Directories

- `app/analyze/` - Analysis pages: data selection, flow (Sankey), heatmap, deep-dive, definitions
- `app/compare/` - Firm comparison: firm selection, side-by-side dashboard
- `app/login/` - Login page
- `lib/` - Core logic: parser, filters, sankey, heatmap, definitions, auth
- `store/` - Zustand stores for call data and comparison state
- `components/charts/` - PlotlySankey, PlotlyHeatmap, Heatmap3D
- `components/backgrounds/` - Three.js wave dot animation
- `middleware.ts` - Route protection (JWT verification)

### Data Flow

1. User logs in and selects a pre-loaded firm dataset or uploads their own
2. `parser.ts` extracts FileInfo from JSON/TXT files
3. Data stored in Zustand triggers stats computation
4. 7-axis filters applied via `applyAllFilters()` flow to all visualization pages
5. Sankey diagrams and heatmaps consume filtered data

### Modes

- **Analyze** - Deep dive into a single firm's call data with Sankey flows, heatmaps, and transcript browser
- **Compare** - Side-by-side comparison of multiple firms with synchronized filters and metrics

## Deployment

Optimized for Vercel. Sample data is pre-generated during build via the `prebuild` hook. Set `JWT_SECRET` in your environment for production.
