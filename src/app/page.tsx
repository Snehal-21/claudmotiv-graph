'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { GraphNode, GraphEdge, PanelMode } from '@/types/graph';
import { useGraphState } from '@/hooks/useGraphState';
import Toolbar from '@/components/Toolbar';
import NodeDetailPanel from '@/components/NodeDetailPanel';
import AddNodePanel from '@/components/AddNodePanel';
import AddEdgePanel from '@/components/AddEdgePanel';
import { clearGraphState } from '@/lib/storage';
import { seedData } from '@/lib/seedData';

const CytoscapeGraph = dynamic(() => import('@/components/CytoscapeGraph'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#445566', fontFamily: 'Space Mono, monospace', fontSize: '12px' }}>
      Initializing graph...
    </div>
  ),
});

export default function HomePage() {
  const {
    state,
    isLoaded,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdge,
    updatePositions,
    updateState,
  } = useGraphState();

  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const cyRef = useRef<{ zoomIn: () => void; zoomOut: () => void; fit: () => void; runLayout: () => void } | null>(null);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    setPanelMode('node-detail');
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedNode(null);
    setPanelMode(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelMode(null);
    setSelectedNode(null);
  }, []);

  const handleAddNode = useCallback((title: string, note: string) => {
    addNode(title, note);
  }, [addNode]);

  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    // Select the source node to show edge in detail panel
    const sourceNode = state.nodes.find(n => n.id === edge.source);
    if (sourceNode) {
      setSelectedNode(sourceNode);
      setPanelMode('node-detail');
    }
  }, [state.nodes]);

  const handleReset = useCallback(() => {
    clearGraphState();
    updateState(seedData);
  }, [updateState]);

  // Sync selectedNode when state updates (e.g. after title edit)
  useEffect(() => {
    if (selectedNode) {
      const updated = state.nodes.find(n => n.id === selectedNode.id);
      if (updated) setSelectedNode(updated);
    }
  }, [state.nodes]);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#060611' }}>
      {/* Graph canvas */}
      {isLoaded && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <CytoscapeGraph
            state={state}
            selectedNodeId={selectedNode?.id ?? null}
            onNodeClick={handleNodeClick}
            onCanvasClick={handleCanvasClick}
            onNodePositionChange={(id, pos) => updatePositions({ [id]: pos })}
            onEdgeClick={handleEdgeClick}
          />
        </div>
      )}

      {/* Toolbar */}
      <Toolbar
        onAddNode={() => { setSelectedNode(null); setPanelMode('add-node'); }}
        onAddEdge={() => { setSelectedNode(null); setPanelMode('add-edge'); }}
        onReset={handleReset}
        onZoomIn={() => cyRef.current?.zoomIn()}
        onZoomOut={() => cyRef.current?.zoomOut()}
        onFit={() => cyRef.current?.fit()}
        nodeCount={state.nodes.length}
        edgeCount={state.edges.length}
      />

      {/* Help tip */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        fontFamily: 'Space Mono, monospace',
        fontSize: '10px',
        color: '#334455',
        lineHeight: 1.7,
      }}>
        Click node to inspect · Drag to reposition · Scroll to zoom
      </div>

      {/* Panels */}
      <AnimatePresence mode="wait">
        {panelMode === 'node-detail' && selectedNode && (
          <NodeDetailPanel
            key="node-detail"
            node={selectedNode}
            edges={state.edges}
            allNodes={state.nodes}
            onUpdate={(id, updates) => { updateNode(id, updates); }}
            onDelete={deleteNode}
            onDeleteEdge={deleteEdge}
            onClose={handleClosePanel}
          />
        )}
        {panelMode === 'add-node' && (
          <AddNodePanel
            key="add-node"
            onAdd={handleAddNode}
            onClose={handleClosePanel}
          />
        )}
        {panelMode === 'add-edge' && (
          <AddEdgePanel
            key="add-edge"
            nodes={state.nodes}
            preselectedSource={selectedNode?.id}
            onAdd={addEdge}
            onClose={handleClosePanel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
