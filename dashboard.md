# AI Call Analytics Dashboard

A Next.js-based visual analytics application for analyzing call resolution data from legal receptionist call handling systems. Transforms raw call metadata (JSON) and transcripts (TXT) into interactive visualizations and deep-dive analytics.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features](#features)
- [Data Model](#data-model)
- [Pages](#pages)
- [Filtering System](#filtering-system)
- [Visualizations](#visualizations)
- [Technology Stack](#technology-stack)

---

## Overview

**Purpose:** Enable data-driven analysis of call handling operations, resolution patterns, transfer outcomes, and caller journeys.

**Key Capabilities:**
- Interactive Sankey diagrams showing call flow journeys
- Multi-dimensional heatmaps for correlation analysis
- 7-axis filtering system for precise data exploration
- Individual call record inspection with transcripts
- Comprehensive field definitions reference

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd AI-Call-Analytics

# Install dependencies
npm install

# Generate sample data (optional, for demo)
npm run generate-sample

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run generate-sample` | Generate sample data from `data/` folder |

---

## Project Structure

```
AI-Call-Analytics/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Home (data upload/sample selection)
│   ├── layout.tsx               # Root layout with theme provider
│   ├── dashboard/               # Dashboard routes
│   │   ├── layout.tsx          # Dashboard layout (navbar + sidebar)
│   │   ├── flow/page.tsx       # Sankey flow analysis
│   │   ├── heatmap/page.tsx    # 2D/3D heatmap analysis
│   │   ├── deep-dive/page.tsx  # Individual file browser
│   │   └── info/page.tsx       # Field definitions reference
│   └── api/
│       └── sample-data/route.ts # Sample data API
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── charts/                  # Plotly visualizations
│   ├── filters/                 # Filter sidebar
│   ├── layout/                  # Navigation components
│   └── data/                    # Data upload/viewing components
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   ├── definitions.ts          # Field vocabularies
│   ├── parser.ts               # JSON/TXT parsing
│   ├── filters.ts              # Filter implementation
│   ├── sankey.ts               # Sankey data transformation
│   └── plotly-transforms.ts    # Plotly formatting
├── store/
│   └── callDataStore.ts        # Zustand global state
└── data/                        # Sample call data files
```

---

## Features

### Data Input
- **Folder Upload**: Drag-and-drop or file picker for nested folders containing JSON + TXT files
- **Sample Data**: Pre-generated 1000+ call records for demonstration

### Visual Analytics
- **Sankey Diagrams**: 5 preset flows + custom layer builder
- **Heatmaps**: 2D (3 presets) and 3D visualizations
- **KPI Cards**: Summary metrics (resolution rate, transfer success, etc.)

### Data Exploration
- **7-Axis Filtering**: Filter by resolution type, status, caller, intent, transfer, duration, multi-case
- **Full-Text Search**: Search across file names, outcomes, caller types
- **File Viewer**: JSON metadata + transcript inspection

### User Experience
- **Dark/Light Themes**: System preference detection with manual toggle
- **Responsive Design**: Desktop and mobile layouts
- **Session Persistence**: Preferences saved to localStorage

---

## Data Model

### FileInfo (Core Data Structure)

Each call record contains:

```typescript
interface FileInfo {
  id: string;                      // Unique identifier
  path: string;                    // File path
  name: string;                    // Filename

  // Classification fields
  resolution_type: string;         // How call was resolved
  caller_type: string;             // Type of caller
  resolution_achieved: boolean | null;
  transfer_success: boolean | null;
  transfer_destination: string | null;
  secondary_action: string | null;
  call_duration: number | null;    // Seconds
  primary_intent: string | null;
  final_outcome: string;

  // Raw data
  transcript: string | null;       // TXT content
  data: CallData;                  // Original JSON
}
```

### Classification Vocabularies

| Category | Example Values |
|----------|---------------|
| **Caller Type** | insurance_rep, medical_provider, new_client, existing_client, spanish_speaker, unknown |
| **Primary Intent** | speak_with_staff, check_case_status, financial_and_settlement_inquiry, new_client_intake |
| **Resolution Type** | transfer_attempted, information_provided, callback_scheduled, message_taken |
| **Transfer Destination** | case_management, legal_counsel, billing_and_disbursements, specific_staff_member |

See the **Definitions** page in the dashboard for complete vocabularies with descriptions.

---

## Pages

### 1. Home Page (`/`)

Entry point for data selection:
- Upload folder with JSON/TXT files
- Load pre-generated sample data
- Feature highlights

### 2. Flow Analysis (`/dashboard/flow`)

Interactive Sankey diagram visualization with:

**5 Preset Views:**
1. **Resolution Overview**: All Calls → Resolved/Unresolved → Resolution Types
2. **Transfer Deep-Dive**: Transfers → Connected/Failed → Destinations → Actions
3. **Caller Analysis**: All Calls → Caller Types → Resolution Status → Types
4. **Intent Journey**: All Calls → Intents → Resolution Status → Types
5. **Custom**: Configure any combination of layers

**KPI Cards:**
- Total Calls
- Resolution Rate
- Unresolved Count
- Transfer Success Rate
- Average Duration
- Top Intent

**Interaction:** Click any flow link to select and view associated files.

### 3. Heatmap Analysis (`/dashboard/heatmap`)

Cross-dimensional correlation analysis:

**2D Heatmaps (3 presets):**
- Resolution Type × Caller Type
- Resolution Type × Primary Intent
- Caller Type × Primary Intent

**3D Heatmap:**
- All three dimensions simultaneously
- Marker size/color indicates count

### 4. Deep Dive (`/dashboard/deep-dive`)

Individual call record browser:

- Searchable file list
- File statistics (count, duration, transcripts)
- Tabbed viewer: JSON data + Transcript
- Previous/Next navigation

### 5. Definitions (`/dashboard/info`)

Reference guide for classification system:

- 7 collapsible category sections
- Searchable field definitions
- System rules explanation

---

## Filtering System

### 7-Axis Filters

All filters apply with AND logic across the dashboard:

| Filter | Type | Description |
|--------|------|-------------|
| Resolution Type | Multi-select | Filter by how calls were resolved |
| Resolution Achieved | Multi-select | resolved, unresolved, unknown |
| Caller Type | Multi-select | Filter by caller classification |
| Transfer Status | Multi-select | successful, failed, no_transfer |
| Call Duration | Range slider | Min/max duration in seconds |
| Multi-Case | Multi-select | true, false, unknown |

### Filter Sidebar Features

- Real-time count updates per filter value
- Select All / None buttons per category
- Reset Filters button
- Filtered files count display
- Total duration display

---

## Visualizations

### Sankey Diagram

Built with Plotly.js, the Sankey shows call flow from left to right:

- **Nodes**: Represent categories (All Calls, Resolved, Transfer Types, etc.)
- **Links**: Show flow volume between nodes
- **Colors**: Semantic coloring (green=resolved, red=unresolved, etc.)
- **Click Interaction**: Select files associated with any link

### Heatmaps

**2D Heatmap:**
- Color intensity indicates count
- Cell values show count and percentage
- Light blue gradient color scale

**3D Heatmap:**
- Scatter plot with 3 dimensions
- Marker size proportional to count
- Interactive rotation and zoom

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 |
| React | React 19 |
| TypeScript | TypeScript 5 |
| State Management | Zustand |
| UI Components | Radix UI (shadcn/ui) |
| Styling | Tailwind CSS 4 |
| Charts | Plotly.js |
| Icons | Lucide React |
| Themes | next-themes |

---

## State Management

### Zustand Store (`useCallDataStore`)

Global state with localStorage persistence:

**State:**
- `files`: Loaded FileInfo array
- `filters`: Current filter configuration
- `stats`: Computed statistics
- `sankeyOptions`: Visualization preferences
- `selectedFileId`: Current file in Deep Dive

**Actions:**
- `setFiles()`: Load data and compute stats
- `setFilters()`: Update filters
- `resetFilters()`: Reset to defaults
- `setSankeyOptions()`: Change visualization
- `clearData()`: Clear and return to home

---

## Data Processing

### File Parsing Flow

1. **Upload**: User selects folder with JSON + TXT files
2. **Separate**: JSON metadata files and TXT transcripts
3. **Parse JSON**: Extract call_summary, transfer_context, etc.
4. **Match Transcripts**: Link TXT files by naming convention
5. **Compute Fields**: Derive transfer_success, transfer_destination
6. **Create FileInfo**: Combine all data into unified structure
7. **Store**: Save to Zustand for app-wide access

### Transcript Matching

The parser matches transcripts using these patterns:
- `call_123.json` ↔ `call_123.txt`
- `call_123_gemini.json` ↔ `call_123.txt` (removes provider suffix)

---

## Key Design Patterns

### 1. Client-Side Processing
All filtering and visualization runs client-side for instant interactivity.

### 2. Hydration Safety
Components using Radix UI use `useState(false)` mounting pattern to prevent Next.js hydration mismatches.

### 3. Theme-Aware Charts
Plotly layouts adjust colors based on dark/light theme.

### 4. Persistent Preferences
Sankey visualization options persist across sessions via localStorage.

---

## Data Flow

```
User uploads data / loads sample
           ↓
    Parse JSON/TXT files
           ↓
    Store in Zustand
           ↓
┌──────────────────────────────┐
│    User adjusts filters      │
│            ↓                 │
│   applyAllFilters()          │
│            ↓                 │
│   Filtered files propagate   │
│   to all dashboard pages     │
└──────────────────────────────┘
           ↓
    ┌──────┴──────┐
    ↓             ↓
Flow Page    Heatmap Page    Deep Dive
    ↓             ↓              ↓
Sankey       Heatmap        File List
Diagram      Charts         & Viewer
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Run `npm run lint` to check for issues
5. Submit a pull request

---

## License

[Add license information]

---

## Support

For issues or questions, please [open an issue](link-to-issues) on GitHub.
