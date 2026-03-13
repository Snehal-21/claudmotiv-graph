import { GraphState } from '@/types/graph';
import { seedData } from './seedData';

const STORAGE_KEY = 'knowledge-graph-state';

export function loadGraphState(): GraphState {
  if (typeof window === 'undefined') return seedData;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as GraphState;
    }
  } catch {
    console.error('Failed to load graph state from localStorage');
  }
  return seedData;
}

export function saveGraphState(state: GraphState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.error('Failed to save graph state to localStorage');
  }
}

export function clearGraphState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
