import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GraphNode, GraphEdge, GraphState } from '@/types/graph';
import { loadGraphState, saveGraphState } from '@/lib/storage';

export function useGraphState() {
  const [state, setState] = useState<GraphState>({ nodes: [], edges: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadGraphState();
    setState(loaded);
    setIsLoaded(true);
  }, []);

  const updateState = useCallback((newState: GraphState) => {
    setState(newState);
    saveGraphState(newState);
  }, []);

  const addNode = useCallback((title: string, note: string) => {
    const newNode: GraphNode = {
      id: uuidv4(),
      title: title.trim(),
      note: note.trim(),
    };
    setState(prev => {
      const next = { ...prev, nodes: [...prev.nodes, newNode] };
      saveGraphState(next);
      return next;
    });
    return newNode;
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<Pick<GraphNode, 'title' | 'note' | 'position'>>) => {
    setState(prev => {
      const next = {
        ...prev,
        nodes: prev.nodes.map(n => (n.id === id ? { ...n, ...updates } : n)),
      };
      saveGraphState(next);
      return next;
    });
  }, []);

  const deleteNode = useCallback((id: string) => {
    setState(prev => {
      const next = {
        nodes: prev.nodes.filter(n => n.id !== id),
        edges: prev.edges.filter(e => e.source !== id && e.target !== id),
      };
      saveGraphState(next);
      return next;
    });
  }, []);

  const addEdge = useCallback((source: string, target: string, label: string) => {
    const newEdge: GraphEdge = {
      id: uuidv4(),
      source,
      target,
      label: label.trim(),
    };
    setState(prev => {
      const next = { ...prev, edges: [...prev.edges, newEdge] };
      saveGraphState(next);
      return next;
    });
    return newEdge;
  }, []);

  const deleteEdge = useCallback((id: string) => {
    setState(prev => {
      const next = { ...prev, edges: prev.edges.filter(e => e.id !== id) };
      saveGraphState(next);
      return next;
    });
  }, []);

  const updatePositions = useCallback((positions: Record<string, { x: number; y: number }>) => {
    setState(prev => {
      const next = {
        ...prev,
        nodes: prev.nodes.map(n => ({
          ...n,
          position: positions[n.id] || n.position,
        })),
      };
      saveGraphState(next);
      return next;
    });
  }, []);

  return {
    state,
    isLoaded,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdge,
    updatePositions,
    updateState,
  };
}
