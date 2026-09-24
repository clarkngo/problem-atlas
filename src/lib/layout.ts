import dagre from '@dagrejs/dagre';
import type { LayoutDirection } from '../types';

export const NODE_WIDTH = 232;
export const NODE_HEIGHT = 84;

export interface LaidOutNode {
  id: string;
  x: number;
  y: number;
}

/** Positions are top-left corners, which is what React Flow expects. */
export function layoutTree(
  ids: string[],
  edges: { source: string; target: string }[],
  direction: LayoutDirection,
): Map<string, LaidOutNode> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: direction === 'LR' ? 18 : 28,
    ranksep: direction === 'LR' ? 90 : 70,
    marginx: 24,
    marginy: 24,
  });
  g.setDefaultEdgeLabel(() => ({}));
  ids.forEach((id) => g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  // Dagre's crossing-minimization reorders siblings (and its order
  // constraints aren't reliably honored). A tree has no crossings to
  // minimize, so skip it: dagre's initial DFS order is insertion order,
  // which keeps ↑/↓ on the keyboard matching what's on screen.
  dagre.layout(g, { disableOptimalOrderHeuristic: true });

  const out = new Map<string, LaidOutNode>();
  ids.forEach((id) => {
    const { x, y } = g.node(id);
    out.set(id, { id, x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 });
  });
  return out;
}
