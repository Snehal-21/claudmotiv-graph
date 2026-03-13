'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { GraphNode } from '@/types/graph';

interface AddEdgePanelProps {
  nodes: GraphNode[];
  preselectedSource?: string;
  onAdd: (source: string, target: string, label: string) => void;
  onClose: () => void;
}

const LABEL_PRESETS = ['relates to', 'depends on', 'see also', 'built on', 'uses', 'guides', 'impacts', 'pairs well with', 'requires'];

export default function AddEdgePanel({ nodes, preselectedSource, onAdd, onClose }: AddEdgePanelProps) {
  const [source, setSource] = useState(preselectedSource ?? '');
  const [target, setTarget] = useState('');
  const [label, setLabel] = useState('relates to');
  const [customLabel, setCustomLabel] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const effectiveLabel = useCustom ? customLabel : label;

  const handleSubmit = () => {
    if (!source || !target || !effectiveLabel.trim() || source === target) return;
    onAdd(source, target, effectiveLabel);
    onClose();
  };

  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '360px',
        background: 'rgba(10, 10, 26, 0.96)',
        borderLeft: '1px solid rgba(74, 158, 255, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid rgba(74, 158, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowRight size={14} color="#ff6b9d" />
          <span style={{ color: '#ff6b9d', fontSize: '11px', fontFamily: 'Space Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            New Connection
          </span>
        </div>
        <button onClick={onClose} className="icon-btn"><X size={16} /></button>
      </div>

      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        {/* Source */}
        <div>
          <label className="field-label">From</label>
          <select value={source} onChange={e => setSource(e.target.value)} className="field-input field-select">
            <option value="">Select source node...</option>
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.title}</option>
            ))}
          </select>
        </div>

        {/* Arrow visual */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{ height: '1px', flex: 1, background: 'rgba(74, 158, 255, 0.2)' }} />
          <ArrowRight size={16} color="#4a9eff" />
          <div style={{ height: '1px', flex: 1, background: 'rgba(74, 158, 255, 0.2)' }} />
        </div>

        {/* Target */}
        <div>
          <label className="field-label">To</label>
          <select value={target} onChange={e => setTarget(e.target.value)} className="field-input field-select">
            <option value="">Select target node...</option>
            {nodes.filter(n => n.id !== source).map(n => (
              <option key={n.id} value={n.id}>{n.title}</option>
            ))}
          </select>
        </div>

        {/* Label */}
        <div>
          <label className="field-label">Relationship Label</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {LABEL_PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => { setLabel(preset); setUseCustom(false); }}
                className={`tag-btn ${!useCustom && label === preset ? 'tag-btn-active' : ''}`}
              >
                {preset}
              </button>
            ))}
            <button
              onClick={() => setUseCustom(true)}
              className={`tag-btn ${useCustom ? 'tag-btn-active' : ''}`}
            >
              custom...
            </button>
          </div>
          {useCustom && (
            <motion.input
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              className="field-input"
              placeholder="Custom label..."
              autoFocus
            />
          )}
        </div>

        {/* Preview */}
        {source && target && effectiveLabel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: '12px',
              background: 'rgba(74, 158, 255, 0.06)',
              border: '1px solid rgba(74, 158, 255, 0.15)',
              borderRadius: '6px',
              fontFamily: 'Space Mono, monospace',
              fontSize: '11px',
              color: '#8899bb',
              textAlign: 'center',
            }}
          >
            <span style={{ color: '#c8d0e0' }}>{nodes.find(n => n.id === source)?.title}</span>
            {' '}
            <span style={{ color: '#4a9eff' }}>—{effectiveLabel}→</span>
            {' '}
            <span style={{ color: '#c8d0e0' }}>{nodes.find(n => n.id === target)?.title}</span>
          </motion.div>
        )}
      </div>

      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(74, 158, 255, 0.1)', display: 'flex', gap: '10px' }}>
        <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!source || !target || !effectiveLabel.trim() || source === target}
          className="btn btn-accent"
          style={{ flex: 2 }}
        >
          <ArrowRight size={14} />
          Connect
        </button>
      </div>
    </motion.div>
  );
}
