import { GraphNode, GraphEdge, GraphState } from '@/types/graph';

export const seedNodes: GraphNode[] = [
  { id: '1', title: 'React', note: 'A JavaScript library for building user interfaces using components.' },
  { id: '2', title: 'Next.js', note: 'React framework with SSR, routing, and API support built in.' },
  { id: '3', title: 'TypeScript', note: 'Typed superset of JavaScript that compiles to plain JS.' },
  { id: '4', title: 'State Management', note: 'Patterns for managing shared application state (Context, Zustand, Redux).' },
  { id: '5', title: 'Component Design', note: 'Principles for building reusable, composable UI components.' },
  { id: '6', title: 'Performance', note: 'Techniques like memoization, lazy loading, and virtualization.' },
  { id: '7', title: 'Testing', note: 'Unit, integration, and e2e testing strategies for frontend apps.' },
  { id: '8', title: 'CSS & Styling', note: 'Styling approaches including Tailwind, CSS Modules, and styled-components.' },
  { id: '9', title: 'Redux', note: 'Predictable state container for JavaScript apps. Uses actions, reducers, and a single global store.' },
];

export const seedEdges: GraphEdge[] = [
  { id: 'e1', source: '2', target: '1', label: 'built on' },
  { id: 'e2', source: '1', target: '3', label: 'pairs well with' },
  { id: 'e3', source: '1', target: '4', label: 'uses' },
  { id: 'e4', source: '1', target: '5', label: 'guides' },
  { id: 'e5', source: '2', target: '6', label: 'improves' },
  { id: 'e6', source: '1', target: '7', label: 'requires' },
  { id: 'e7', source: '1', target: '8', label: 'styled with' },
  { id: 'e8', source: '4', target: '6', label: 'impacts' },
  { id: 'e9', source: '5', target: '6', label: 'impacts' },
  { id: 'e10', source: '9', target: '4', label: 'implements' },
];

export const seedData: GraphState = {
  nodes: seedNodes,
  edges: seedEdges,
};
