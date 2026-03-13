'use client';

import { motion } from 'framer-motion';
import { Plus, ArrowRight, RotateCcw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface ToolbarProps {
  onAddNode: () => void;
  onAddEdge: () => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  nodeCount: number;
  edgeCount: number;
}

export default function Toolbar({
  onAddNode,
  onAddEdge,
  onReset,
  onZoomIn,
  onZoomOut,
  onFit,
  nodeCount,
  edgeCount,
}: ToolbarProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Brand */}
      <div style={{
        marginBottom: '8px',
        padding: '10px 14px',
        background: 'rgba(10, 10, 26, 0.9)',
        border: '1px solid rgba(74, 158, 255, 0.2)',
        borderRadius: '8px',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#4a9eff', fontWeight: 700, letterSpacing: '0.05em' }}>
          KNOWLEDGE GRAPH
        </div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#445566', marginTop: '2px' }}>
          {nodeCount} nodes · {edgeCount} edges
        </div>
      </div>

      {/* Primary actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button onClick={onAddNode} className="toolbar-btn toolbar-btn-primary">
          <Plus size={14} />
          Add Node
        </button>
        <button onClick={onAddEdge} className="toolbar-btn toolbar-btn-accent">
          <ArrowRight size={14} />
          Connect
        </button>
      </div>

      {/* Zoom controls */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '8px',
        background: 'rgba(10, 10, 26, 0.85)',
        border: '1px solid rgba(74, 158, 255, 0.1)',
        borderRadius: '8px',
        backdropFilter: 'blur(12px)',
      }}>
        <button onClick={onZoomIn} className="icon-btn" title="Zoom in"><ZoomIn size={14} /></button>
        <button onClick={onZoomOut} className="icon-btn" title="Zoom out"><ZoomOut size={14} /></button>
        <button onClick={onFit} className="icon-btn" title="Fit view"><Maximize size={14} /></button>
        <div style={{ width: '1px', background: 'rgba(74, 158, 255, 0.15)', margin: '0 2px' }} />
        <button onClick={onReset} className="icon-btn" title="Reset layout"><RotateCcw size={14} /></button>
      </div>
    </motion.div>
  );
}
