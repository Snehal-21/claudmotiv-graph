'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import cytoscape, { Core, EventObject, NodeSingular, EdgeSingular } from 'cytoscape';
import { GraphState, GraphNode, GraphEdge } from '@/types/graph';

// @ts-expect-error no types
import fcose from 'cytoscape-fcose';

let fcoseRegistered = false;
if (typeof window !== 'undefined' && !fcoseRegistered) {
  cytoscape.use(fcose);
  fcoseRegistered = true;
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOUR SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
const EDGE_COLOR_MAP: Record<string, string> = {
  'built on':        '#f59e0b',
  'pairs well with': '#22d3ee',
  'uses':            '#a78bfa',
  'guides':          '#34d399',
  'improves':        '#4ade80',
  'requires':        '#f87171',
  'styled with':     '#fb7185',
  'impacts':         '#fbbf24',
  'implements':      '#818cf8',
  'depends on':      '#f97316',
  'relates to':      '#38bdf8',
  'see also':        '#a3e635',
  'part of':         '#c084fc',
};
const DEFAULT_EDGE_COLOR = '#4a9eff';

const NODE_TIERS = [
  { bg: '#0b1628', border: '#3b82f6', glow: '#3b82f620' },
  { bg: '#16103a', border: '#8b5cf6', glow: '#8b5cf620' },
  { bg: '#0a2818', border: '#10b981', glow: '#10b98120' },
  { bg: '#271500', border: '#f59e0b', glow: '#f59e0b20' },
  { bg: '#2d0a0a', border: '#ef4444', glow: '#ef444420' },
];

function getNodeTier(degree: number) {
  if (degree >= 8) return NODE_TIERS[4];
  if (degree >= 6) return NODE_TIERS[3];
  if (degree >= 4) return NODE_TIERS[2];
  if (degree >= 2) return NODE_TIERS[1];
  return NODE_TIERS[0];
}

function getEdgeColor(label: string): string {
  return EDGE_COLOR_MAP[label.toLowerCase().trim()] ?? DEFAULT_EDGE_COLOR;
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE BUILDER — uses any[] to bypass missing shadow-* / corner-radius types
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStyles(state: GraphState): any[] {
  const degree: Record<string, number> = {};
  state.nodes.forEach(n => { degree[n.id] = 0; });
  state.edges.forEach(e => {
    degree[e.source] = (degree[e.source] ?? 0) + 1;
    degree[e.target] = (degree[e.target] ?? 0) + 1;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles: any[] = [
    {
      selector: 'node',
      style: {
        'background-color': '#0b1628',
        'background-opacity': 1,
        'border-color': '#3b82f6',
        'border-width': 2,
        'border-opacity': 1,
        'label': 'data(label)',
        'color': '#e2e8f0',
        'font-family': '"Space Mono", monospace',
        'font-size': '11px',
        'font-weight': '700',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': '76px',
        'text-outline-color': '#060611',
        'text-outline-width': 2,
        'width': 90,
        'height': 90,
        'shape': 'roundrectangle',
        'corner-radius': 10,
        'padding': '10px',
        'shadow-blur': 18,
        'shadow-color': '#3b82f640',
        'shadow-offset-x': 0,
        'shadow-offset-y': 4,
        'shadow-opacity': 0.6,
        'transition-property': 'border-color, border-width, background-color, width, height, opacity',
        'transition-duration': 220,
        'opacity': 1,
        'overlay-opacity': 0,
        'z-index': 10,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': '#00ffcc',
        'border-width': 3,
        'background-color': '#0d2d4a',
        'width': 104,
        'height': 104,
        'shadow-blur': 30,
        'shadow-color': '#00ffcc50',
        'z-index': 999,
      },
    },
    {
      selector: 'node.hovered',
      style: {
        'border-width': 3,
        'width': 100,
        'height': 100,
        'shadow-blur': 28,
        'overlay-opacity': 0,
        'z-index': 500,
      },
    },
    {
      selector: 'node.highlighted',
      style: {
        'border-color': '#ff6b9d',
        'border-width': 2.5,
        'background-color': '#1e1040',
        'shadow-color': '#ff6b9d40',
        'shadow-blur': 20,
      },
    },
    {
      selector: 'node.dimmed',
      style: { 'opacity': 0.18 },
    },
    {
      selector: 'node.search-match',
      style: {
        'border-color': '#fde047',
        'border-width': 3,
        'background-color': '#2d2600',
        'shadow-color': '#fde04760',
        'shadow-blur': 24,
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 1.5,
        'line-color': '#1e3a5f',
        'line-style': 'solid',
        'target-arrow-color': '#1e3a5f',
        'target-arrow-shape': 'triangle',
        'target-arrow-size': 8,
        'arrow-scale': 1.1,
        'curve-style': 'bezier',
        'control-point-step-size': 40,
        'label': 'data(label)',
        'color': '#4477aa',
        'font-family': '"Space Mono", monospace',
        'font-size': '9px',
        'font-weight': '400',
        'text-background-color': '#060611',
        'text-background-opacity': 0.88,
        'text-background-padding': '3px',
        'text-background-shape': 'roundrectangle',
        'text-rotation': 'autorotate',
        'text-margin-y': -6,
        'transition-property': 'line-color, target-arrow-color, width, opacity',
        'transition-duration': 200,
        'opacity': 1,
        'overlay-opacity': 0,
        'z-index': 5,
      },
    },
    {
      selector: 'edge.hovered',
      style: {
        'width': 3.5,
        'text-background-opacity': 1,
        'overlay-opacity': 0,
        'z-index': 100,
        'color': '#ffffff',
        'font-weight': '700',
      },
    },
    {
      selector: 'edge:selected',
      style: { 'width': 4, 'overlay-opacity': 0, 'z-index': 200 },
    },
    {
      selector: 'edge.highlighted',
      style: {
        'width': 2.5,
        'color': '#e2e8f0',
        'text-background-opacity': 1,
        'font-weight': '700',
      },
    },
    {
      selector: 'edge.dimmed',
      style: { 'opacity': 0.06 },
    },
    {
      selector: 'edge[label="see also"], edge[label="relates to"]',
      style: { 'line-style': 'dashed', 'line-dash-pattern': [6, 3] },
    },
    {
      selector: 'edge[label="pairs well with"]',
      style: { 'line-style': 'dotted' },
    },
  ];

  // Per-node colours
  state.nodes.forEach(n => {
    const tier = getNodeTier(degree[n.id] ?? 0);
    styles.push({ selector: `node[id="${n.id}"]`,           style: { 'background-color': tier.bg, 'border-color': tier.border, 'shadow-color': tier.glow } });
    styles.push({ selector: `node[id="${n.id}"].hovered`,   style: { 'background-color': tier.bg, 'border-color': tier.border, 'border-width': 3, 'shadow-color': tier.border + '60', 'shadow-blur': 26 } });
    styles.push({ selector: `node[id="${n.id}"]:selected`,  style: { 'shadow-color': tier.border + '80' } });
  });

  // Per-edge colours
  state.edges.forEach(e => {
    const col = getEdgeColor(e.label);
    styles.push({ selector: `edge[id="${e.id}"]`,             style: { 'line-color': col, 'target-arrow-color': col, 'color': col } });
    styles.push({ selector: `edge[id="${e.id}"].hovered`,     style: { 'line-color': col, 'target-arrow-color': col, 'color': '#ffffff' } });
    styles.push({ selector: `edge[id="${e.id}"].highlighted`, style: { 'line-color': col, 'target-arrow-color': col, 'color': col } });
    styles.push({ selector: `edge[id="${e.id}"]:selected`,    style: { 'line-color': col, 'target-arrow-color': col, 'color': '#ffffff' } });
  });

  return styles;
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface TooltipData {
  x: number; y: number;
  content: string;
  type: 'node' | 'edge';
  subtitle?: string;
  color?: string;
  badge?: string;
}

interface GraphStats {
  nodes: number; edges: number;
  avgDegree: string; mostConnected: string;
}

interface CytoscapeGraphProps {
  state: GraphState;
  selectedNodeId: string | null;
  onNodeClick: (node: GraphNode) => void;
  onCanvasClick: () => void;
  onNodePositionChange: (id: string, position: { x: number; y: number }) => void;
  onEdgeClick: (edge: GraphEdge) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUTS
// ─────────────────────────────────────────────────────────────────────────────
type LayoutName = 'fcose' | 'circle' | 'grid' | 'concentric' | 'breadthfirst';

const LAYOUTS: Record<LayoutName, { label: string; icon: string }> = {
  fcose:        { label: 'Force',      icon: '⚛' },
  circle:       { label: 'Circle',     icon: '◯' },
  grid:         { label: 'Grid',       icon: '⊞' },
  concentric:   { label: 'Concentric', icon: '◎' },
  breadthfirst: { label: 'Tree',       icon: '⑂' },
};

function getLayoutOptions(name: LayoutName): Parameters<Core['layout']>[0] {
  const base = { animate: true, animationDuration: 700, fit: true, padding: 70 };
  if (name === 'fcose') return { ...base, name: 'fcose', animationEasing: 'ease-out-cubic', randomize: false, nodeRepulsion: () => 9500, idealEdgeLength: () => 180, edgeElasticity: () => 0.45, nodeSeparation: 120 } as Parameters<Core['layout']>[0];
  if (name === 'concentric') return { ...base, name: 'concentric', concentric: (n: NodeSingular) => n.degree(false), levelWidth: () => 2, minNodeSpacing: 50 } as Parameters<Core['layout']>[0];
  if (name === 'breadthfirst') return { ...base, name: 'breadthfirst', directed: true, spacingFactor: 1.5 } as Parameters<Core['layout']>[0];
  return { ...base, name } as Parameters<Core['layout']>[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CytoscapeGraph({
  state, selectedNodeId,
  onNodeClick, onCanvasClick, onNodePositionChange, onEdgeClick,
}: CytoscapeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef        = useRef<Core | null>(null);
  const initialized  = useRef(false);

  // Live refs so event handlers always read the latest state/callbacks
  const stateRef                = useRef<GraphState>(state);
  const pathModeRef             = useRef(false);
  const onNodeClickRef          = useRef(onNodeClick);
  const onEdgeClickRef          = useRef(onEdgeClick);
  const onCanvasClickRef        = useRef(onCanvasClick);
  const onNodePositionChangeRef = useRef(onNodePositionChange);

  stateRef.current                = state;
  onNodeClickRef.current          = onNodeClick;
  onEdgeClickRef.current          = onEdgeClick;
  onCanvasClickRef.current        = onCanvasClick;
  onNodePositionChangeRef.current = onNodePositionChange;

  const [tooltip,      setTooltip]      = useState<TooltipData | null>(null);
  const [activeLayout, setActiveLayout] = useState<LayoutName>('fcose');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [stats,        setStats]        = useState<GraphStats | null>(null);
  const [minimap,      setMinimap]      = useState(true);
  const [showGrid,     setShowGrid]     = useState(false);
  const [pathMode,     setPathMode]     = useState(false);
  // keep pathModeRef in sync
  pathModeRef.current = pathMode;
  const [pathNodes,    setPathNodes]    = useState<string[]>([]);
  const [zoomLevel,    setZoomLevel]    = useState(1);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTip = useCallback((data: TooltipData) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setTooltip(data);
  }, []);

  const hideTip = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setTooltip(null), 120);
  }, []);

  const computeStats = useCallback((cy: Core) => {
    const n = cy.nodes().length;
    const e = cy.edges().length;
    const totalDeg = cy.nodes().reduce((sum: number, node: NodeSingular) => sum + node.degree(false), 0);
    const avg = n > 0 ? (totalDeg / n).toFixed(1) : '0';
    let maxDeg = 0, topNode = '';
    cy.nodes().forEach((node: NodeSingular) => {
      const d = node.degree(false);
      if (d > maxDeg) { maxDeg = d; topNode = node.data('label'); }
    });
    setStats({ nodes: n, edges: e, avgDegree: avg, mostConnected: topNode });
  }, []);

  const runLayout = useCallback((cy: Core, name: LayoutName = 'fcose') => {
    cy.layout(getLayoutOptions(name)).run();
  }, []);

  // Search
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().removeClass('search-match dimmed');
    cy.edges().removeClass('dimmed');
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    const matched   = cy.nodes().filter((n: NodeSingular) => (n.data('label') as string).toLowerCase().includes(q));
    const unmatched = cy.nodes().not(matched);
    matched.addClass('search-match');
    unmatched.addClass('dimmed');
    cy.edges().addClass('dimmed');
    matched.connectedEdges().removeClass('dimmed');
  }, [searchQuery]);

  // Path finding
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || pathNodes.length < 2) return;
    cy.elements().removeClass('highlighted dimmed');
    const src = cy.getElementById(pathNodes[0]);
    const tgt = cy.getElementById(pathNodes[1]);
    if (!src.length || !tgt.length) return;
    const dijkstra = cy.elements().dijkstra({ root: src, weight: () => 1, directed: false });
    const path = dijkstra.pathTo(tgt);
    if (path.length > 0) {
      cy.elements().not(path).addClass('dimmed');
      path.addClass('highlighted');
    } else {
      cy.elements().addClass('dimmed');
      src.removeClass('dimmed');
      tgt.removeClass('dimmed');
    }
  }, [pathNodes]);

  // Initialize
  useEffect(() => {
    if (!containerRef.current || initialized.current || state.nodes.length === 0) return;
    initialized.current = true;
    const hasPositions = state.nodes.some(n => n.position);

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...state.nodes.map(n => ({ group: 'nodes' as const, data: { id: n.id, label: n.title }, position: n.position })),
        ...state.edges.map(e => ({ group: 'edges' as const, data: { id: e.id, source: e.source, target: e.target, label: e.label } })),
      ],
      style: buildStyles(state),
      layout: hasPositions ? { name: 'preset' } : { name: 'null' },
      wheelSensitivity: 0.25,
      minZoom: 0.1,
      maxZoom: 4,
      boxSelectionEnabled: true,
      selectionType: 'single',
    });

    cyRef.current = cy;
    if (!hasPositions) runLayout(cy, 'fcose');
    computeStats(cy);

    cy.on('zoom', () => setZoomLevel(Math.round(cy.zoom() * 100) / 100));

    cy.on('mouseover', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      node.addClass('hovered');
      containerRef.current!.style.cursor = 'pointer';
      const rp    = node.renderedPosition();
      const gNode = stateRef.current.nodes.find(n => n.id === node.id());
      if (!gNode) return;
      const deg        = node.degree(false);
      const tier       = getNodeTier(deg);
      const inDeg      = node.indegree(false);
      const outDeg     = node.outdegree(false);
      const neighbours = node.neighborhood('node').map((n: NodeSingular) => n.data('label') as string).join(', ');
      showTip({
        x: rp.x, y: rp.y - 68, type: 'node', color: tier.border,
        content: gNode.title,
        badge: `↑${outDeg} ↓${inDeg}`,
        subtitle: gNode.note
          ? (gNode.note.length > 100 ? gNode.note.slice(0, 100) + '…' : gNode.note)
          : (neighbours ? `Connected: ${neighbours}` : 'No connections'),
      });
    });

    cy.on('mouseout', 'node', (evt: EventObject) => {
      evt.target.removeClass('hovered');
      containerRef.current!.style.cursor = 'default';
      hideTip();
    });

    cy.on('drag', 'node', () => hideTip());

    cy.on('mouseover', 'edge', (evt: EventObject) => {
      const edge  = evt.target as EdgeSingular;
      edge.addClass('hovered');
      containerRef.current!.style.cursor = 'pointer';
      const mp    = evt.renderedPosition ?? { x: 0, y: 0 };
      const gEdge = stateRef.current.edges.find(e => e.id === edge.id());
      if (!gEdge) return;
      const src = stateRef.current.nodes.find(n => n.id === gEdge.source)?.title ?? '';
      const tgt = stateRef.current.nodes.find(n => n.id === gEdge.target)?.title ?? '';
      showTip({ x: mp.x, y: mp.y - 50, type: 'edge', color: getEdgeColor(gEdge.label), content: gEdge.label, subtitle: `${src}  →  ${tgt}` });
    });

    cy.on('mouseout', 'edge', (evt: EventObject) => {
      evt.target.removeClass('hovered');
      containerRef.current!.style.cursor = 'default';
      hideTip();
    });

    cy.on('tap', 'node', (evt: EventObject) => {
      const gNode = stateRef.current.nodes.find(n => n.id === evt.target.id());
      if (!gNode) return;
      if (pathModeRef.current) {
        setPathNodes(prev => {
          if (prev.length === 0) return [gNode.id];
          if (prev.length === 1 && prev[0] !== gNode.id) return [prev[0], gNode.id];
          return [gNode.id];
        });
        return;
      }
      onNodeClickRef.current(gNode);
    });

    cy.on('tap', 'edge', (evt: EventObject) => {
      const gEdge = stateRef.current.edges.find(e => e.id === evt.target.id());
      if (gEdge) onEdgeClickRef.current(gEdge);
    });

    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        onCanvasClickRef.current(); hideTip();
        if (pathModeRef.current) { setPathNodes([]); cy.elements().removeClass('highlighted dimmed'); }
      }
    });

    cy.on('dragfree', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      onNodePositionChangeRef.current(node.id(), node.position());
    });

    cy.on('boxselect', () => computeStats(cy));

    return () => {
      cy.destroy();
      cyRef.current   = null;
      initialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.nodes.length > 0]);

  // Sync state
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.style(buildStyles(state));

    const existingNodeIds = new Set(cy.nodes().map((n: NodeSingular) => n.id()));
    const stateNodeIds    = new Set(state.nodes.map(n => n.id));

    existingNodeIds.forEach((id: string) => {
      if (!stateNodeIds.has(id)) {
        const el = cy.getElementById(id);
        el.animate({ style: { opacity: 0 } }, { duration: 280, complete: () => cy.remove(el) });
      }
    });
    state.nodes.forEach(n => {
      if (!existingNodeIds.has(n.id)) {
        const added = cy.add({ group: 'nodes', data: { id: n.id, label: n.title }, position: n.position || { x: cy.width() / 2 + Math.random() * 140 - 70, y: cy.height() / 2 + Math.random() * 140 - 70 } });
        added.style('opacity', 0);
        added.animate({ style: { opacity: 1 } }, { duration: 420 });
      } else {
        const el = cy.getElementById(n.id);
        if (el.data('label') !== n.title) el.data('label', n.title);
      }
    });

    const existingEdgeIds = new Set(cy.edges().map((e: EdgeSingular) => e.id()));
    const stateEdgeIds    = new Set(state.edges.map(e => e.id));

    existingEdgeIds.forEach((id: string) => {
      if (!stateEdgeIds.has(id)) {
        const el = cy.getElementById(id);
        el.animate({ style: { opacity: 0 } }, { duration: 280, complete: () => cy.remove(el) });
      }
    });
    state.edges.forEach(e => {
      if (!existingEdgeIds.has(e.id)) {
        const added = cy.add({ group: 'edges', data: { id: e.id, source: e.source, target: e.target, label: e.label } });
        added.style('opacity', 0);
        added.animate({ style: { opacity: 1 } }, { duration: 420 });
      }
    });

    computeStats(cy);
  }, [state, computeStats]);

  // Highlight neighbours
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || pathMode || searchQuery) return;
    cy.elements().removeClass('highlighted dimmed search-match');
    if (selectedNodeId) {
      const sel        = cy.getElementById(selectedNodeId);
      if (sel.length) {
        const edges      = sel.connectedEdges();
        const neighbours = edges.connectedNodes();
        const connected  = edges.add(neighbours).add(sel);
        cy.elements().not(connected).addClass('dimmed');
        edges.addClass('highlighted');
        neighbours.not(sel).addClass('highlighted');
      }
    }
  }, [selectedNodeId, pathMode, searchQuery]);

  const switchLayout = useCallback((name: LayoutName) => {
    const cy = cyRef.current;
    if (!cy) return;
    setActiveLayout(name);
    runLayout(cy, name);
  }, [runLayout]);

  const fitGraph    = useCallback(() => cyRef.current?.fit(undefined, 60), []);
  const zoomIn      = useCallback(() => { const cy = cyRef.current; if (cy) cy.zoom({ level: cy.zoom() * 1.3, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }); }, []);
  const zoomOut     = useCallback(() => { const cy = cyRef.current; if (cy) cy.zoom({ level: cy.zoom() * 0.77, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }); }, []);
  const centerGraph = useCallback(() => cyRef.current?.center(), []);

  const exportPNG = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const png = cy.png({ output: 'blob', bg: '#060611', scale: 2, full: true });
    const url = URL.createObjectURL(png as Blob);
    const a   = document.createElement('a');
    a.href = url; a.download = 'knowledge-graph.png'; a.click();
    URL.revokeObjectURL(url);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>

      {/* Canvas */}
      <div ref={containerRef} className="cytoscape-container" style={{
        width: '100%', height: '100%',
        background: showGrid
          ? 'radial-gradient(circle, #0e1a2e 1px, transparent 1px) 0 0 / 28px 28px, #060611'
          : '#060611',
      }} />

      {/* Tooltip */}
      {tooltip && (
        <div style={{ position: 'absolute', left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)', pointerEvents: 'none', zIndex: 300, maxWidth: '280px', minWidth: '160px', animation: 'tipIn 0.14s ease-out' }}>
          <div style={{ padding: '10px 14px', background: 'rgba(3,3,12,0.98)', border: `1px solid ${(tooltip.color ?? '#4a9eff')}30`, borderTop: `2px solid ${tooltip.color ?? '#4a9eff'}`, borderRadius: '9px', backdropFilter: 'blur(18px)', boxShadow: `0 10px 40px rgba(0,0,0,0.8), 0 0 20px ${(tooltip.color ?? '#4a9eff')}18` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: tooltip.subtitle ? '6px' : 0 }}>
              <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '11px', fontWeight: 700, color: tooltip.color ?? '#e2e8f0', letterSpacing: '0.04em', flex: 1 }}>
                {tooltip.type === 'edge' ? `↗ ${tooltip.content}` : tooltip.content}
              </span>
              {tooltip.badge && (
                <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '9px', color: tooltip.color ?? '#4a9eff', background: (tooltip.color ?? '#4a9eff') + '18', border: `1px solid ${(tooltip.color ?? '#4a9eff')}30`, borderRadius: '4px', padding: '1px 6px', flexShrink: 0 }}>
                  {tooltip.badge}
                </span>
              )}
            </div>
            {tooltip.subtitle && <div style={{ fontFamily: 'Space Mono,monospace', fontSize: '10px', color: '#4a6080', lineHeight: 1.6 }}>{tooltip.subtitle}</div>}
          </div>
          <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 8, height: 8, background: 'rgba(3,3,12,0.98)', border: `1px solid ${(tooltip.color ?? '#4a9eff')}30`, borderTop: 'none', borderLeft: 'none' }} />
        </div>
      )}

      {/* Top control bar */}
      <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(3,3,12,0.92)', border: '1px solid rgba(74,158,255,0.12)', borderRadius: '12px', padding: '6px 10px', backdropFilter: 'blur(14px)', zIndex: 50 }}>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#334455', pointerEvents: 'none' }}>⌕</span>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search nodes…"
            style={{ background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.15)', borderRadius: '7px', padding: '5px 10px 5px 24px', color: '#c8d8e8', fontFamily: 'Space Mono,monospace', fontSize: '10px', outline: 'none', width: '150px' }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#445', cursor: 'pointer', fontSize: '12px' }}>×</button>}
        </div>

        <Divider />

        {/* Layout buttons */}
        {(Object.keys(LAYOUTS) as LayoutName[]).map(name => (
          <button key={name} onClick={() => switchLayout(name)} title={LAYOUTS[name].label}
            style={{ background: activeLayout === name ? 'rgba(74,158,255,0.18)' : 'none', border: `1px solid ${activeLayout === name ? 'rgba(74,158,255,0.5)' : 'transparent'}`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'Space Mono,monospace', fontSize: '11px', color: activeLayout === name ? '#4a9eff' : '#334455', transition: 'all 0.15s' }}>
            {LAYOUTS[name].icon}
          </button>
        ))}

        <Divider />

        {/* Path mode */}
        <button onClick={() => { setPathMode(p => !p); setPathNodes([]); cyRef.current?.elements().removeClass('highlighted dimmed'); }} title="Shortest path finder"
          style={{ background: pathMode ? 'rgba(251,191,36,0.15)' : 'none', border: `1px solid ${pathMode ? 'rgba(251,191,36,0.5)' : 'transparent'}`, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'Space Mono,monospace', fontSize: '10px', color: pathMode ? '#fbbf24' : '#334455', transition: 'all 0.15s' }}>
          {pathMode ? `⚡ ${pathNodes.length}/2` : '⚡ Path'}
        </button>

        <Divider />

        {/* Grid + Minimap toggles */}
        <button onClick={() => setShowGrid(g => !g)} title="Toggle grid" style={{ background: showGrid ? 'rgba(74,158,255,0.12)' : 'none', border: `1px solid ${showGrid ? 'rgba(74,158,255,0.3)' : 'transparent'}`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: showGrid ? '#4a9eff' : '#334455', fontSize: '12px', transition: 'all 0.15s' }}>⊞</button>
        <button onClick={() => setMinimap(m => !m)} title="Toggle minimap" style={{ background: minimap ? 'rgba(74,158,255,0.12)' : 'none', border: `1px solid ${minimap ? 'rgba(74,158,255,0.3)' : 'transparent'}`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: minimap ? '#4a9eff' : '#334455', fontSize: '12px', transition: 'all 0.15s' }}>◫</button>

        <Divider />

        {/* Zoom */}
        <button onClick={zoomIn}  style={iconBtnStyle} title="Zoom in">+</button>
        <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '9px', color: '#334455', minWidth: '36px', textAlign: 'center' }}>{Math.round(zoomLevel * 100)}%</span>
        <button onClick={zoomOut} style={iconBtnStyle} title="Zoom out">−</button>
        <button onClick={fitGraph} style={iconBtnStyle} title="Fit">⊡</button>
        <button onClick={centerGraph} style={iconBtnStyle} title="Center">⊕</button>

        <Divider />

        {/* Export */}
        <button onClick={exportPNG} title="Export PNG" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'Space Mono,monospace', fontSize: '10px', color: '#10b981', transition: 'all 0.15s' }}>↓ PNG</button>
      </div>

      {/* Path banner */}
      {pathMode && (
        <div style={{ position: 'absolute', top: '68px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', padding: '7px 18px', zIndex: 50, fontFamily: 'Space Mono,monospace', fontSize: '10px', color: '#fbbf24', backdropFilter: 'blur(10px)' }}>
          {pathNodes.length === 0 && '⚡ Click first node to start path'}
          {pathNodes.length === 1 && `⚡ "${state.nodes.find(n => n.id === pathNodes[0])?.title}" → click second node`}
          {pathNodes.length === 2 && '⚡ Shortest path highlighted — click canvas to reset'}
        </div>
      )}

      {/* Stats bar */}
      {stats && (
        <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '1px', background: 'rgba(3,3,12,0.9)', border: '1px solid rgba(74,158,255,0.1)', borderRadius: '10px', backdropFilter: 'blur(14px)', zIndex: 50, overflow: 'hidden' }}>
          {[
            { label: 'Nodes',   value: stats.nodes,         color: '#4a9eff' },
            { label: 'Edges',   value: stats.edges,         color: '#a78bfa' },
            { label: 'Avg Deg', value: stats.avgDegree,     color: '#34d399' },
            { label: 'Hub',     value: stats.mostConnected, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '8px 16px', borderRight: i < 3 ? '1px solid rgba(74,158,255,0.07)' : 'none', textAlign: 'center', minWidth: '70px' }}>
              <div style={{ fontFamily: 'Space Mono,monospace', fontSize: '13px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: 'Space Mono,monospace', fontSize: '8px', color: '#334455', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Edge legend */}
      <EdgeLegend edges={state.edges} />

      {/* Node tier legend */}
      <NodeTierLegend />

      {/* Minimap */}
      {minimap && <Minimap cyRef={cyRef} state={state} />}

      {/* Help text */}
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', fontFamily: 'Space Mono,monospace', fontSize: '9px', color: '#1e2d3d', lineHeight: 1.9 }}>
        <div>Scroll — zoom · Drag — pan · Drag node — reposition</div>
        <div>Click node — inspect · ⚡ Path — shortest path finder</div>
        <div>Box drag — multi-select · ↓PNG — export image</div>
      </div>

      <style>{`
        @keyframes tipIn {
          from { opacity:0; transform:translate(-50%, calc(-100% + 10px)); }
          to   { opacity:1; transform:translate(-50%, -100%); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const iconBtnStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: '#445566', fontFamily: 'Space Mono,monospace', fontSize: '13px', padding: '2px 6px', borderRadius: '4px', transition: 'color 0.12s', lineHeight: 1 };

function Divider() {
  return <div style={{ width: 1, height: 20, background: 'rgba(74,158,255,0.1)', flexShrink: 0 }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// EDGE LEGEND
// ─────────────────────────────────────────────────────────────────────────────
function EdgeLegend({ edges }: { edges: GraphEdge[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const usedLabels = Array.from(new Set(edges.map(e => e.label.toLowerCase().trim())));
  if (!usedLabels.length) return null;

  const lineStyle = (label: string) => {
    if (label === 'see also' || label === 'relates to') return 'dashed';
    if (label === 'pairs well with') return 'dotted';
    return 'solid';
  };

  return (
    <div style={{ position: 'absolute', bottom: '68px', right: '20px', background: 'rgba(3,3,12,0.93)', border: '1px solid rgba(74,158,255,0.1)', borderRadius: '10px', padding: collapsed ? '10px 14px' : '12px 16px', backdropFilter: 'blur(14px)', zIndex: 50, minWidth: '155px' }}>
      <button onClick={() => setCollapsed(c => !c)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 0, gap: '10px' }}>
        <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '9px', color: '#2a3a4a', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Relationships</span>
        <span style={{ color: '#2a3a4a', fontSize: '9px' }}>{collapsed ? '▲' : '▼'}</span>
      </button>
      {!collapsed && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {usedLabels.map(label => {
            const color = EDGE_COLOR_MAP[label] ?? DEFAULT_EDGE_COLOR;
            const ls    = lineStyle(label);
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <svg width="22" height="8" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="4" x2="22" y2="4" stroke={color} strokeWidth="2" strokeDasharray={ls === 'dashed' ? '5,3' : ls === 'dotted' ? '1,3' : undefined} style={{ filter: `drop-shadow(0 0 3px ${color}88)` }} />
                  <polygon points="18,1 22,4 18,7" fill={color} />
                </svg>
                <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '9px', color, letterSpacing: '0.03em' }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE TIER LEGEND
// ─────────────────────────────────────────────────────────────────────────────
function NodeTierLegend() {
  const [collapsed, setCollapsed] = useState(true);
  const tiers = [
    { label: '0–1 connections', color: '#3b82f6' },
    { label: '2–3 connections', color: '#8b5cf6' },
    { label: '4–5 connections', color: '#10b981' },
    { label: '6–7 connections', color: '#f59e0b' },
    { label: '8+ hub node',     color: '#ef4444' },
  ];
  return (
    <div style={{ position: 'absolute', bottom: '68px', right: '194px', background: 'rgba(3,3,12,0.93)', border: '1px solid rgba(74,158,255,0.1)', borderRadius: '10px', padding: collapsed ? '10px 14px' : '12px 16px', backdropFilter: 'blur(14px)', zIndex: 50, minWidth: '155px' }}>
      <button onClick={() => setCollapsed(c => !c)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 0, gap: '10px' }}>
        <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '9px', color: '#2a3a4a', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Node Tiers</span>
        <span style={{ color: '#2a3a4a', fontSize: '9px' }}>{collapsed ? '▲' : '▼'}</span>
      </button>
      {!collapsed && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {tiers.map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '3px', border: `2px solid ${t.color}`, background: `${t.color}15`, flexShrink: 0, boxShadow: `0 0 6px ${t.color}50` }} />
              <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '9px', color: t.color }}>{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MINIMAP
// ─────────────────────────────────────────────────────────────────────────────
function Minimap({ cyRef, state }: { cyRef: React.RefObject<Core | null>; state: GraphState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const cy     = cyRef.current;
      if (!canvas || !cy) return;
      const ctx = canvas.getContext('2d');
      if (!ctx)  return;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const bb = cy.elements().boundingBox({});
      if (!bb || bb.w === 0 || bb.h === 0) return;
      const pad    = 8;
      const scale  = Math.min((W - pad * 2) / bb.w, (H - pad * 2) / bb.h);
      const toX    = (x: number) => pad + (x - bb.x1) * scale;
      const toY    = (y: number) => pad + (y - bb.y1) * scale;

      cy.edges().forEach((e: EdgeSingular) => {
        const s = e.source().position(), t = e.target().position();
        const col = getEdgeColor(e.data('label') ?? '');
        ctx.strokeStyle = col + '60'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(toX(s.x), toY(s.y)); ctx.lineTo(toX(t.x), toY(t.y)); ctx.stroke();
      });

      cy.nodes().forEach((n: NodeSingular) => {
        const pos  = n.position();
        const tier = getNodeTier(n.degree(false));
        ctx.fillStyle = tier.border + 'cc';
        ctx.shadowColor = tier.border; ctx.shadowBlur = 3;
        ctx.beginPath(); ctx.arc(toX(pos.x), toY(pos.y), 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });
    };

    draw();
    const id = setInterval(draw, 800);
    return () => clearInterval(id);
  }, [cyRef, state]);

  return (
    <div style={{ position: 'absolute', top: '72px', right: '20px', background: 'rgba(3,3,12,0.9)', border: '1px solid rgba(74,158,255,0.12)', borderRadius: '8px', overflow: 'hidden', zIndex: 50, backdropFilter: 'blur(10px)' }}>
      <div style={{ fontFamily: 'Space Mono,monospace', fontSize: '8px', color: '#2a3a4a', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid rgba(74,158,255,0.08)' }}>Minimap</div>
      <canvas ref={canvasRef} width={140} height={110} style={{ display: 'block' }} />
    </div>
  );
}