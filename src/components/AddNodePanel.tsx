'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';

interface AddNodePanelProps {
  onAdd: (title: string, note: string) => void;
  onClose: () => void;
}

export default function AddNodePanel({ onAdd, onClose }: AddNodePanelProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd(title, note);
    setTitle('');
    setNote('');
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
          <Plus size={14} color="#00ffcc" />
          <span style={{ color: '#00ffcc', fontSize: '11px', fontFamily: 'Space Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            New Node
          </span>
        </div>
        <button onClick={onClose} className="icon-btn"><X size={16} /></button>
      </div>

      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label className="field-label">Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="field-input"
            placeholder="Topic title..."
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <div>
          <label className="field-label">Note</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            className="field-input field-textarea"
            placeholder="Optional description..."
            rows={5}
          />
        </div>
      </div>

      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(74, 158, 255, 0.1)', display: 'flex', gap: '10px' }}>
        <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="btn btn-primary"
          style={{ flex: 2 }}
        >
          <Plus size={14} />
          Add Node
        </button>
      </div>
    </motion.div>
  );
}
