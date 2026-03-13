# Knowledge Graph Viewer

An interactive personal knowledge base graph viewer built with **Next.js**, **TypeScript**, and **Cytoscape.js**. Map topics and relationships in a beautiful, dark-themed canvas interface — think a lightweight browser-based Obsidian.


---

## Features

### Core
- **Interactive Graph Canvas** — Render nodes and directed edges using Cytoscape.js with fCoSE auto-layout
- **Edge Labels** — Every connection shows its relationship type (e.g. "built on", "relates to", "depends on")
- **No-overlap Layout** — fCoSE force-directed layout ensures clean initial placement
- **Click to Inspect** — Click any node to open a side panel with title + note content
- **Inline Editing** — Edit title and note directly in the panel; unsaved changes are shown clearly
- **CRUD — Nodes** — Add nodes with title + optional note; delete nodes (connected edges auto-removed)
- **CRUD — Edges** — Connect two nodes with a custom or preset relationship label; delete edges
- **localStorage Persistence** — All graph state (including node positions) survives page refresh
- **Seed Data** — Pre-populated with 8 frontend tech nodes and 9 edges on first load

### Stretch Goals (Implemented)
- ✅ **Animated node appearance/removal** — Fade in on add, fade out on delete (Cytoscape animate API)
- ✅ **Animated edge drawing** — New edges fade in with Cytoscape animation
- ✅ **Highlight connected nodes** — On node select: connected neighbors turn pink, unrelated nodes dim to 30% opacity
- ✅ **Drag to reposition** — Drag any node; position persists to localStorage immediately

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Graph Rendering | Cytoscape.js + cytoscape-fcose layout |
| Animation | Framer Motion (panels) + Cytoscape animate API (nodes/edges) |
| Icons | lucide-react |
| Persistence | localStorage |
| Fonts | Space Mono (Google Fonts) |
| Styling | Plain CSS with CSS variables (no framework needed) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/knowledge-graph.git
cd knowledge-graph

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with font import
│   ├── page.tsx            # Main page — orchestrates all state + panels
│   └── globals.css         # Global CSS variables + shared component styles
├── components/
│   ├── CytoscapeGraph.tsx  # Cytoscape canvas — renders graph, handles events
│   ├── NodeDetailPanel.tsx # Slide-in panel for viewing/editing/deleting a node
│   ├── AddNodePanel.tsx    # Panel for creating new nodes
│   ├── AddEdgePanel.tsx    # Panel for connecting two nodes with a label
│   └── Toolbar.tsx         # Left sidebar with Add/Connect/Zoom controls
├── hooks/
│   └── useGraphState.ts    # All CRUD operations + localStorage sync
├── lib/
│   ├── seedData.ts         # CSV data hard-coded as typed arrays
│   └── storage.ts          # localStorage load/save/clear helpers
└── types/
    └── graph.ts            # GraphNode, GraphEdge, GraphState, PanelMode types
```

---

## How It Works

### State Management
All graph state lives in `useGraphState` (a custom hook). Every mutation — add, update, delete — immediately calls `saveGraphState()` which writes to `localStorage`. On mount, `loadGraphState()` reads from storage; if nothing exists, it returns `seedData`.

### Cytoscape Integration
`CytoscapeGraph` is loaded with `dynamic(..., { ssr: false })` because Cytoscape requires a DOM. It initializes once when the first node data is available. Subsequent state changes (add/delete node/edge) are synced via `useEffect` — the component diffs the current Cytoscape elements against the incoming state and animates additions/removals.

### Layout
On first load (no persisted positions), the **fCoSE** layout runs automatically with tuned `nodeRepulsion`, `idealEdgeLength`, and `nodeSeparation` to prevent overlaps. Once you drag a node, its position is saved and the next load uses `preset` layout.

### Panels
Panels slide in from the right using Framer Motion's `AnimatePresence`. Only one panel is visible at a time (`PanelMode` state in the parent).

---

## Seed Data

Matches the assignment CSV exactly:

**Nodes:** React, Next.js, TypeScript, State Management, Component Design, Performance, Testing, CSS & Styling

**Edges:** built on, pairs well with, uses, guides, improves, requires, styled with, impacts (×2)

Reset to seed data anytime via the **↺** button in the toolbar.

---

## Design Decisions

- **Space Mono font** — Monospace gives a "technical notebook" feel appropriate for a knowledge graph tool
- **Dark space theme** — Deep navy/black background with blue accent nodes reads well and reduces eye strain during long sessions
- **No UI framework** — Plain CSS with variables keeps the bundle lean and gives full control over the graph-tool aesthetic
- **`next.config.js` sets `reactStrictMode: false`** — Prevents Cytoscape from double-mounting in development (which would cause two graph instances)
