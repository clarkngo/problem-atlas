import type { AtlasNode, Regulation, SolutionCategory, Taxonomy } from '../types';

export const SOLUTION_CATEGORIES: SolutionCategory[] = [
  'AI Solution',
  'Process Improvement',
  'Automation Fit',
  'Requirements Gap',
];

export type CategoryCounts = Record<SolutionCategory, number>;

/**
 * Precomputed lookups so keyboard navigation (parent / first child / siblings)
 * and search-result reveal are O(1) instead of scanning the node list.
 */
export interface GraphIndex {
  byId: Map<string, AtlasNode>;
  rootIds: string[];
  depth: Map<string, number>;
  /** Ordered list of ids from the root down to (and including) the node. */
  pathTo(id: string): string[];
  siblingsOf(id: string): string[];
  /** Solution outcomes anywhere beneath a node, by category. */
  outcomeCounts: Map<string, CategoryCounts>;
  branchIds: string[];
  regulations: Record<string, Regulation>;
}

function emptyCounts(): CategoryCounts {
  return { 'AI Solution': 0, 'Process Improvement': 0, 'Automation Fit': 0, 'Requirements Gap': 0 };
}

export function buildIndex(taxonomy: Taxonomy): GraphIndex {
  const byId = new Map(taxonomy.nodes.map((n) => [n.id, n]));
  const rootIds = taxonomy.nodes.filter((n) => n.parentId === null).map((n) => n.id);

  if (import.meta.env.DEV) {
    for (const n of taxonomy.nodes) {
      for (const c of n.childrenIds) {
        if (byId.get(c)?.parentId !== n.id) console.warn(`[taxonomy] ${n.id} lists child ${c} whose parentId disagrees`);
      }
    }
  }

  const depth = new Map<string, number>();
  const outcomeCounts = new Map<string, CategoryCounts>();

  const walk = (id: string, d: number): CategoryCounts => {
    const node = byId.get(id)!;
    depth.set(id, d);
    const counts = emptyCounts();
    if (node.type === 'solution') counts[node.solutionCategory] += 1;
    for (const c of node.childrenIds) {
      if (!byId.has(c)) continue;
      const sub = walk(c, d + 1);
      for (const k of SOLUTION_CATEGORIES) counts[k] += sub[k];
    }
    outcomeCounts.set(id, counts);
    return counts;
  };
  rootIds.forEach((id) => walk(id, 0));

  const pathTo = (id: string) => {
    const path: string[] = [];
    let cur = byId.get(id);
    while (cur) {
      path.unshift(cur.id);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return path;
  };

  const siblingsOf = (id: string) => {
    const node = byId.get(id);
    if (!node) return [];
    return node.parentId ? byId.get(node.parentId)?.childrenIds ?? [] : rootIds;
  };

  const branchIds = taxonomy.nodes.filter((n) => n.childrenIds.length > 0).map((n) => n.id);

  return { byId, rootIds, depth, pathTo, siblingsOf, outcomeCounts, branchIds, regulations: taxonomy.regulations ?? {} };
}

/** Nodes currently rendered: roots plus the children of every expanded, visible node. */
export function visibleIds(index: GraphIndex, expanded: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const visit = (id: string) => {
    out.push(id);
    if (!expanded.has(id)) return;
    for (const c of index.byId.get(id)?.childrenIds ?? []) if (index.byId.has(c)) visit(c);
  };
  index.rootIds.forEach(visit);
  return out;
}
