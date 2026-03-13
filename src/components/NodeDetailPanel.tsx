'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Save, Link, BookOpen } from 'lucide-react';
import { GraphNode, GraphEdge } from '@/types/graph';

interface NodeDetailPanelProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  allNodes: GraphNode[];
  onUpdate: (id: string, updates: Partial<Pick<GraphNode, 'title' | 'note'>>) => void;
  onDelete: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  onClose: () => void;
}

export default function NodeDetailPanel({
  node,
  edges,
  allNodes,
  onUpdate,
  onDelete,
  onDeleteEdge,
  onClose,
}: NodeDetailPanelProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setNote(node.note);
      setIsDirty(false);
    }
  }, [node]);

  const handleSave = () => {
    if (!node) return;
    onUpdate(node.id, { title, note });
    setIsDirty(false);
  };

  const connectedEdges = edges.filter(e => node && (e.source === node.id || e.target === node.id));

  const getOtherNodeTitle = (edge: GraphEdge) => {
    if (!node) return '';
    const otherId = edge.source === node.id ? edge.target : edge.source;
    return allNodes.find(n => n.id === otherId)?.title ?? '(deleted)';
  };

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="panel"
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
          {/* Header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(74, 158, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={14} color="#4a9eff" />
              <span style={{ color: '#4a9eff', fontSize: '11px', fontFamily: 'Space Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Node Detail
              </span>
            </div>
            <button onClick={onClose} className="icon-btn">
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {/* Title */}
            <div style={{ marginBottom: '20px' }}>
              <label className="field-label">Title</label>
              <input
                value={title}
                onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
                className="field-input"
                placeholder="Node title..."
              />
            </div>

            {/* Note */}
            <div style={{ marginBottom: '24px' }}>
              <label className="field-label">Note</label>
              <textarea
                value={note}
                onChange={e => { setNote(e.target.value); setIsDirty(true); }}
                className="field-input field-textarea"
                placeholder="Add notes about this topic..."
                rows={5}
              />
            </div>

            {/* Save button */}
            <AnimatePresence>
              {isDirty && (
                <motion.button
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onClick={handleSave}
                  className="btn btn-primary"
                  style={{ width: '100%', marginBottom: '24px' }}
                >
                  <Save size={14} />
                  Save Changes
                </motion.button>
              )}
            </AnimatePresence>

            {/* Connected edges */}
            {connectedEdges.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Link size={12} color="#6688aa" />
                  <span className="field-label" style={{ marginBottom: 0 }}>
                    Connections ({connectedEdges.length})
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {connectedEdges.map(edge => (
                    <motion.div
                      key={edge.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'rgba(74, 158, 255, 0.05)',
                        border: '1px solid rgba(74, 158, 255, 0.12)',
                        borderRadius: '6px',
                      }}
                    >
                      <div>
                        <span style={{ color: '#6688aa', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>
                          {edge.source === node?.id ? '→' : '←'} {edge.label}
                        </span>
                        <div style={{ color: '#c8d0e0', fontSize: '12px', fontFamily: 'Space Mono, monospace', marginTop: '2px' }}>
                          {getOtherNodeTitle(edge)}
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteEdge(edge.id)}
                        className="icon-btn icon-btn-danger"
                        title="Delete edge"
                      >
                        <Trash2 size={12} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer — delete */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(74, 158, 255, 0.1)',
          }}>
            <button
              onClick={() => { onDelete(node.id); onClose(); }}
              className="btn btn-danger"
              style={{ width: '100%' }}
            >
              <Trash2 size={14} />
              Delete Node
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
