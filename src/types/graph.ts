export interface GraphNode {
  id: string;
  title: string;
  note: string;
  position?: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type PanelMode = 'node-detail' | 'add-node' | 'add-edge' | null;
