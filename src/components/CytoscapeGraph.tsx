'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import cytoscape, { Core, EventObject, NodeSingular } from 'cytoscape';
import { GraphState, GraphNode, GraphEdge } from '@/types/graph';

// @ts-expect-error no types
import fcose from 'cytoscape-fcose';

let fcoseRegistered = false;
if (typeof window !== 'undefined' && !fcoseRegistered) {
  cytoscape.use(fcose);
  fcoseRegistered = true;
}

// ── Edge label → colour mapping ──────────────────────────────────────────────
const EDGE_COLOR_MAP: Record<string, string> = {
  'built on':       '#f59e0b',
  'pairs well with':'#22d3ee',
  'uses':           '#a78bfa',
  'guides':         '#34d399',
  'improves':       '#4ade80',
  'requires':       '#f87171',
  'styled with':    '#fb7185',
  'impacts':        '#fbbf24',
  'implements':     '#818cf8',
  'depends on':     '#f97316',
  'relates to':     '#38bdf8',
  'see also':       '#a3e635',
  'part of':        '#c084fc',
};
const DEFAULT_EDGE_COLOR = '#4a9eff';

// ── Node colour tiers by degree ───────────────────────────────────────────────
const NODE_TIERS = [
  { bg: '#0f172a', border: '#4a9eff' },   // 0-1  blue
  { bg: '#1a1040', border: '#a78bfa' },   // 2-3  purple
  { bg: '#0d2d20', border: '#34d399' },   // 4-5  emerald
  { bg: '#2d1a0a', border: '#f59e0b' },   // 6-7  amber
  { bg: '#2d0a1a', border: '#f87171' },   // 8+   red hub
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

interface TooltipData {
  x: number;
  y: number;
  content: string;
  type: 'node' | 'edge';
  subtitle?: string;
  color?: string;
}

interface CytoscapeGraphProps {
  state: GraphState;
  selectedNodeId: string | null;
  onNodeClick: (node: GraphNode) => void;
  onCanvasClick: () => void;
  onNodePositionChange: (id: string, position: { x: number; y: number }) => void;
  onEdgeClick: (edge: GraphEdge) => void;
}

function buildStyles(state: GraphState): cytoscape.Stylesheet[] {
  const degree: Record<string, number> = {};
  state.nodes.forEach(n => { degree[n.id] = 0; });
  state.edges.forEach(e => {
    degree[e.source] = (degree[e.source] ?? 0) + 1;
    degree[e.target] = (degree[e.target] ?? 0) + 1;
  });

  const styles: cytoscape.Stylesheet[] = [
    {
      selector: 'node',
      style: {
        'background-color': '#0f172a',
        'border-color': '#4a9eff',
        'border-width': 2,
        'label': 'data(label)',
        'color': '#e2e8f0',
        'font-family': '"Space Mono", monospace',
        'font-size': '11px',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': '78px',
        'width': 92,
        'height': 92,
        'shape': 'roundrectangle',
        'transition-property': 'border-color, border-width, background-color, opacity, width, height',
        'transition-duration': 200,
        'opacity': 1,
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': '#00ffcc',
        'border-width': 3,
        'background-color': '#0d2d4a',
        'width': 102,
        'height': 102,
      },
    },
    {
      selector: 'node.hovered',
      style: { 'border-width': 3, 'width': 100, 'height': 100, 'overlay-opacity': 0 },
    },
    {
      selector: 'node.highlighted',
      style: { 'border-color': '#ff6b9d', 'border-width': 2.5, 'background-color': '#1a1040' },
    },
    {
      selector: 'node.dimmed',
      style: { 'opacity': 0.22 },
    },
    {
      selector: 'edge',
      style: {
        'width': 1.5,
        'line-color': '#334466',
        'target-arrow-color': '#334466',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'color': '#5577aa',
        'font-family': '"Space Mono", monospace',
        'font-size': '9px',
        'text-background-color': '#060611',
        'text-background-opacity': 0.9,
        'text-background-padding': '3px',
        'text-rotation': 'autorotate',
        'transition-property': 'line-color, target-arrow-color, opacity, width',
        'transition-duration': 200,
        'opacity': 1,
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'edge.hovered',
      style: { 'width': 3, 'overlay-opacity': 0 },
    },
    {
      selector: 'edge.highlighted',
      style: { 'width': 2.5, 'color': '#e2e8f0', 'text-background-opacity': 1 },
    },
    {
      selector: 'edge.dimmed',
      style: { 'opacity': 0.07 },
    },
  ];

  // Per-node colour by degree tier
  state.nodes.forEach(n => {
    const tier = getNodeTier(degree[n.id] ?? 0);
    styles.push({
      selector: `node[id="${n.id}"]`,
      style: { 'background-color': tier.bg, 'border-color': tier.border },
    });
    styles.push({
      selector: `node[id="${n.id}"].hovered`,
      style: { 'background-color': tier.bg, 'border-color': tier.border, 'border-width': 3 },
    });
  });

  // Per-edge colour by label
  state.edges.forEach(e => {
    const col = getEdgeColor(e.label);
    styles.push({
      selector: `edge[id="${e.id}"]`,
      style: { 'line-color': col, 'target-arrow-color': col, 'color': col },
    });
    styles.push({
      selector: `edge[id="${e.id}"].hovered`,
      style: { 'line-color': col, 'target-arrow-color': col, 'color': '#ffffff' },
    });
    styles.push({
      selector: `edge[id="${e.id}"].highlighted`,
      style: { 'line-color': col, 'target-arrow-color': col, 'color': col },
    });
  });

  return styles;
}

export default function CytoscapeGraph({
  state,
  selectedNodeId,
  onNodeClick,
  onCanvasClick,
  onNodePositionChange,
  onEdgeClick,
}: CytoscapeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const isInitialized = useRef(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTip = useCallback((data: TooltipData) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setTooltip(data);
  }, []);

  const hideTip = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setTooltip(null), 100);
  }, []);

  const runLayout = useCallback((cy: Core) => {
    cy.layout({
      name: 'fcose' as string,
      animate: true,
      animationDuration: 900,
      animationEasing: 'ease-out-cubic',
      fit: true,
      padding: 70,
      randomize: false,
      nodeRepulsion: () => 9000,
      idealEdgeLength: () => 190,
      edgeElasticity: () => 0.45,
      nodeSeparation: 110,
    } as Parameters<Core['layout']>[0]).run();
  }, []);

  // ── Initialize once ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || isInitialized.current || state.nodes.length === 0) return;
    isInitialized.current = true;

    const hasPositions = state.nodes.some(n => n.position);

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...state.nodes.map(n => ({ group: 'nodes' as const, data: { id: n.id, label: n.title }, position: n.position })),
        ...state.edges.map(e => ({ group: 'edges' as const, data: { id: e.id, source: e.source, target: e.target, label: e.label } })),
      ],
      style: buildStyles(state),
      layout: hasPositions ? { name: 'preset' } : { name: 'null' },
      wheelSensitivity: 0.3,
      minZoom: 0.15,
      maxZoom: 3,
    });

    cyRef.current = cy;
    if (!hasPositions) runLayout(cy);

    // Node hover
    cy.on('mouseover', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      node.addClass('hovered');
      containerRef.current!.style.cursor = 'pointer';
      const rp = node.renderedPosition();
      const gNode = state.nodes.find(n => n.id === node.id());
      if (!gNode) return;
      const deg = node.connectedEdges().length;
      const neighbours = node.neighborhood('node').map((n: NodeSingular) => n.data('label') as string).join(', ');
      const tier = getNodeTier(deg);
      showTip({
        x: rp.x, y: rp.y - 62,
        type: 'node',
        content: gNode.title,
        color: tier.border,
        subtitle: gNode.note
          ? (gNode.note.length > 90 ? gNode.note.slice(0, 90) + '…' : gNode.note)
          : `${deg} connection${deg !== 1 ? 's' : ''}${neighbours ? ` · ${neighbours}` : ''}`,
      });
    });

    cy.on('mouseout', 'node', (evt: EventObject) => {
      evt.target.removeClass('hovered');
      containerRef.current!.style.cursor = 'default';
      hideTip();
    });

    cy.on('drag', 'node', () => hideTip());

    // Edge hover
    cy.on('mouseover', 'edge', (evt: EventObject) => {
      const edge = evt.target;
      edge.addClass('hovered');
      containerRef.current!.style.cursor = 'pointer';
      const mp = evt.renderedPosition ?? { x: 0, y: 0 };
      const gEdge = state.edges.find(e => e.id === edge.id());
      if (!gEdge) return;
      const src = state.nodes.find(n => n.id === gEdge.source)?.title ?? '';
      const tgt = state.nodes.find(n => n.id === gEdge.target)?.title ?? '';
      showTip({
        x: mp.x, y: mp.y - 46,
        type: 'edge',
        content: gEdge.label,
        color: getEdgeColor(gEdge.label),
        subtitle: `${src}  →  ${tgt}`,
      });
    });

    cy.on('mouseout', 'edge', (evt: EventObject) => {
      evt.target.removeClass('hovered');
      containerRef.current!.style.cursor = 'default';
      hideTip();
    });

    // Tap
    cy.on('tap', 'node', (evt: EventObject) => {
      const gNode = state.nodes.find(n => n.id === evt.target.id());
      if (gNode) onNodeClick(gNode);
    });
    cy.on('tap', 'edge', (evt: EventObject) => {
      const gEdge = state.edges.find(e => e.id === evt.target.id());
      if (gEdge) onEdgeClick(gEdge);
    });
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) { onCanvasClick(); hideTip(); }
    });
    cy.on('dragfree', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      onNodePositionChange(node.id(), node.position());
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
      isInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.nodes.length > 0]);

  // ── Sync state changes ─────────────────────────────────────────────────────
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.style(buildStyles(state) as cytoscape.Stylesheet[]);

    const existingNodeIds = new Set(cy.nodes().map((n: NodeSingular) => n.id()));
    const stateNodeIds = new Set(state.nodes.map(n => n.id));

    existingNodeIds.forEach((id: string) => {
      if (!stateNodeIds.has(id)) {
        const el = cy.getElementById(id);
        el.animate({ style: { opacity: 0 } }, { duration: 260, complete: () => cy.remove(el) });
      }
    });

    state.nodes.forEach(n => {
      if (!existingNodeIds.has(n.id)) {
        const added = cy.add({ group: 'nodes', data: { id: n.id, label: n.title }, position: n.position || { x: cy.width() / 2 + Math.random() * 120 - 60, y: cy.height() / 2 + Math.random() * 120 - 60 } });
        added.style('opacity', 0);
        added.animate({ style: { opacity: 1 } }, { duration: 400 });
      } else {
        const el = cy.getElementById(n.id);
        if (el.data('label') !== n.title) el.data('label', n.title);
      }
    });

    const existingEdgeIds = new Set(cy.edges().map((e: cytoscape.EdgeSingular) => e.id()));
    const stateEdgeIds = new Set(state.edges.map(e => e.id));

    existingEdgeIds.forEach((id: string) => {
      if (!stateEdgeIds.has(id)) {
        const el = cy.getElementById(id);
        el.animate({ style: { opacity: 0 } }, { duration: 260, complete: () => cy.remove(el) });
      }
    });

    state.edges.forEach(e => {
      if (!existingEdgeIds.has(e.id)) {
        const added = cy.add({ group: 'edges', data: { id: e.id, source: e.source, target: e.target, label: e.label } });
        added.style('opacity', 0);
        added.animate({ style: { opacity: 1 } }, { duration: 400 });
      }
    });
  }, [state]);

  // ── Highlight on select ────────────────────────────────────────────────────
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass('highlighted dimmed');
    if (selectedNodeId) {
      const sel = cy.getElementById(selectedNodeId);
      if (sel.length) {
        const edges = sel.connectedEdges();
        const neighbours = edges.connectedNodes();
        const connected = edges.add(neighbours).add(sel);
        cy.elements().not(connected).addClass('dimmed');
        edges.addClass('highlighted');
        neighbours.not(sel).addClass('highlighted');
      }
    }
  }, [selectedNodeId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} className="cytoscape-container" style={{ width: '100%', height: '100%' }} />

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translate(-50%, -100%)',
          pointerEvents: 'none',
          zIndex: 200,
          maxWidth: '260px',
          padding: '9px 13px',
          background: 'rgba(4, 4, 14, 0.97)',
          border: `1px solid ${tooltip.color ?? 'rgba(74,158,255,0.4)'}44`,
          borderTop: `2px solid ${tooltip.color ?? '#4a9eff'}`,
          borderRadius: '8px',
          backdropFilter: 'blur(16px)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), 0 0 16px ${(tooltip.color ?? '#4a9eff')}22`,
          animation: 'tooltipIn 0.13s ease-out',
        }}>
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '11px',
            fontWeight: 700,
            color: tooltip.color ?? '#e2e8f0',
            marginBottom: tooltip.subtitle ? '5px' : 0,
            letterSpacing: '0.04em',
          }}>
            {tooltip.type === 'edge' ? `↗ ${tooltip.content}` : tooltip.content}
          </div>
          {tooltip.subtitle && (
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '10px',
              color: '#5577aa',
              lineHeight: 1.55,
            }}>
              {tooltip.subtitle}
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: -5, left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 8, height: 8,
            background: 'rgba(4, 4, 14, 0.97)',
            border: `1px solid ${(tooltip.color ?? '#4a9eff')}44`,
            borderTop: 'none', borderLeft: 'none',
          }} />
        </div>
      )}

      {/* Edge colour legend */}
      <EdgeLegend edges={state.edges} />

      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translate(-50%, calc(-100% + 8px)); }
          to   { opacity: 1; transform: translate(-50%, -100%); }
        }
      `}</style>
    </div>
  );
}

function EdgeLegend({ edges }: { edges: GraphEdge[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const usedLabels = Array.from(new Set(edges.map(e => e.label.toLowerCase().trim())));
  if (usedLabels.length === 0) return null;

  return (
    <div style={{
      position: 'absolute', bottom: '20px', right: '20px',
      background: 'rgba(4, 4, 14, 0.92)',
      border: '1px solid rgba(74,158,255,0.12)',
      borderRadius: '10px',
      padding: collapsed ? '10px 14px' : '12px 16px',
      backdropFilter: 'blur(14px)',
      zIndex: 50,
      minWidth: '150px',
    }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 0, gap: '10px' }}
      >
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#334455', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
          Edge Types
        </span>
        <span style={{ color: '#334455', fontSize: '9px' }}>{collapsed ? '▲' : '▼'}</span>
      </button>

      {!collapsed && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {usedLabels.map(label => {
            const color = getEdgeColor(label);
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{
                  width: '22px', height: '2px',
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                  borderRadius: '1px',
                  boxShadow: `0 0 5px ${color}66`,
                  flexShrink: 0,
                }} />
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color, letterSpacing: '0.03em' }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
