import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type NodeChange,
} from '@xyflow/react';
import type { LayoutDirection, SolutionNode, Taxonomy } from './types';
import { buildIndex, visibleIds, type GraphIndex } from './lib/graphIndex';
import { NODE_HEIGHT, NODE_WIDTH, layoutTree } from './lib/layout';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { AtlasNodeCard, NodeActionsContext, type AtlasFlowNode, type NodeActions } from './components/AtlasNodeCard';
import { SearchModal } from './components/SearchModal';
import { DetailDrawer } from './components/DetailDrawer';
import { Toolbar } from './components/Toolbar';
import { Legend } from './components/Legend';

const nodeTypes = { atlas: AtlasNodeCard };

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Matches the drawer's max-w-md. */
const DRAWER_WIDTH = 448;

const HASH_PREFIX = '#/n/';
const idFromHash = () => (location.hash.startsWith(HASH_PREFIX) ? decodeURIComponent(location.hash.slice(HASH_PREFIX.length)) : null);

export default function App() {
  const [index, setIndex] = useState<GraphIndex | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/taxonomy.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Taxonomy>;
      })
      .then((t) => setIndex(buildIndex(t)))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-slate-700 dark:text-slate-300">
        Couldn’t load the taxonomy ({error}).
      </div>
    );
  }
  if (!index) {
    return <div className="flex h-full items-center justify-center text-slate-500">Loading atlas…</div>;
  }
  return (
    <ReactFlowProvider>
      <Atlas index={index} />
    </ReactFlowProvider>
  );
}

function Atlas({ index }: { index: GraphIndex }) {
  const rf = useReactFlow<AtlasFlowNode>();
  const treeRef = useRef<HTMLDivElement>(null);

  const [direction, setDirection] = useState<LayoutDirection>(() =>
    window.matchMedia('(max-width: 640px)').matches ? 'TB' : 'LR',
  );
  const [expanded, setExpandedSet] = useState<Set<string>>(() => {
    const initial = new Set(index.rootIds);
    const deep = idFromHash();
    if (deep && index.byId.has(deep)) index.pathTo(deep).slice(0, -1).forEach((id) => initial.add(id));
    return initial;
  });
  const [focusedId, setFocusedId] = useState<string | null>(() => {
    const deep = idFromHash();
    return deep && index.byId.has(deep) ? deep : null;
  });
  const [drawerId, setDrawerId] = useState<string | null>(() => {
    const deep = idFromHash();
    return deep && index.byId.get(deep)?.type === 'solution' ? deep : null;
  });
  const [searchOpen, setSearchOpen] = useState(false);

  // Pan requests are counted so repeated requests for the same node still fire.
  const [panTick, setPanTick] = useState(focusedId ? 1 : 0);
  const lastFocused = useRef<string | null>(focusedId);
  const initialDeepLink = useRef(focusedId !== null);

  // ── Actions ────────────────────────────────────────────────────────────
  const focusNode = useCallback((id: string | null, opts?: { pan?: boolean }) => {
    setFocusedId(id);
    if (id) lastFocused.current = id;
    if (id && opts?.pan) setPanTick((t) => t + 1);
    if (!id && treeRef.current?.contains(document.activeElement)) treeRef.current.focus({ preventScroll: true });
  }, []);

  const setExpanded = useCallback((id: string, open: boolean) => {
    setExpandedSet((prev) => {
      if (prev.has(id) === open) return prev;
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  /** Expand every ancestor so the node is on the canvas, then focus it. */
  const reveal = useCallback(
    (id: string) => {
      setExpandedSet((prev) => {
        const next = new Set(prev);
        index.pathTo(id).slice(0, -1).forEach((a) => next.add(a));
        return next;
      });
      focusNode(id, { pan: true });
    },
    [index, focusNode],
  );

  const openDrawer = useCallback(
    (id: string) => {
      if (index.byId.get(id)?.type !== 'solution') return;
      focusNode(id, { pan: true });
      setDrawerId(id);
    },
    [index, focusNode],
  );
  const closeDrawer = useCallback(() => setDrawerId(null), []);

  const collapseAll = () => {
    setExpandedSet(new Set());
    if (focusedId) focusNode(index.pathTo(focusedId)[0], { pan: true });
    setDrawerId(null);
  };
  const expandAll = () => {
    setExpandedSet(new Set(index.branchIds));
    requestAnimationFrame(() => rf.fitView({ duration: 400, padding: 0.1 }));
  };

  const nodeActions = useMemo<NodeActions>(
    () => ({
      onActivate: (id) => focusNode(id),
      onToggle: (id) => {
        setExpandedSet((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        focusNode(id, { pan: true });
      },
      onOpen: openDrawer,
    }),
    [focusNode, openDrawer],
  );

  const { onTreeKeyDown } = useKeyboardNav({
    index,
    focusedId,
    expanded,
    drawerOpen: drawerId !== null,
    searchOpen,
    focusNode,
    setExpanded,
    openDrawer,
    closeDrawer,
    openSearch: () => setSearchOpen(true),
    closeSearch: () => setSearchOpen(false),
  });

  // ── Layout ─────────────────────────────────────────────────────────────
  const visible = useMemo(() => visibleIds(index, expanded), [index, expanded]);

  const baseEdges = useMemo(() => {
    const set = new Set(visible);
    return visible.flatMap((id) => {
      const p = index.byId.get(id)!.parentId;
      return p && set.has(p) ? [{ id: `${p}->${id}`, source: p, target: id }] : [];
    });
  }, [index, visible]);

  const layout = useMemo(() => layoutTree(visible, baseEdges, direction), [visible, baseEdges, direction]);

  const focusPath = useMemo(() => new Set(focusedId ? index.pathTo(focusedId) : []), [index, focusedId]);

  const edges = useMemo<Edge[]>(
    () =>
      baseEdges.map((e) => {
        const onPath = focusPath.has(e.target);
        return {
          ...e,
          type: 'default',
          animated: onPath && e.target === focusedId,
          className: onPath ? 'atlas-edge-active' : 'atlas-edge',
          focusable: false,
        };
      }),
    [baseEdges, focusPath, focusedId],
  );

  const computedNodes = useMemo<AtlasFlowNode[]>(
    () =>
      visible.map((id) => {
        const n = index.byId.get(id)!;
        const siblings = index.siblingsOf(id);
        const pos = layout.get(id)!;
        return {
          id,
          type: 'atlas',
          position: { x: pos.x, y: pos.y },
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          focusable: false,
          selectable: false,
          // The card inside is the treeitem; the wrapper should be invisible to AT.
          ariaRole: 'none',
          data: {
            atlas: n,
            expanded: expanded.has(id),
            focused: id === focusedId,
            direction,
            counts: index.outcomeCounts.get(id)!,
            level: index.depth.get(id)! + 1,
            posInSet: siblings.indexOf(id) + 1,
            setSize: siblings.length,
          },
        };
      }),
    [visible, index, layout, expanded, focusedId, direction],
  );

  // React Flow owns drag positions; re-layout resets them, other updates keep them.
  const [nodes, setNodes] = useState<AtlasFlowNode[]>(computedNodes);
  const prevLayout = useRef(layout);
  useEffect(() => {
    const relayout = prevLayout.current !== layout;
    prevLayout.current = layout;
    setNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]));
      return computedNodes.map((n) => {
        const old = prevById.get(n.id);
        return old ? { ...n, position: relayout ? n.position : old.position, measured: old.measured } : n;
      });
    });
  }, [computedNodes, layout]);

  const onNodesChange = useCallback(
    (changes: NodeChange<AtlasFlowNode>[]) => setNodes((ns) => applyNodeChanges(changes, ns)),
    [],
  );

  // ── Viewport ───────────────────────────────────────────────────────────
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  useEffect(() => {
    if (!panTick || !focusedId) return;
    // Wait a frame so a re-layout triggered in the same update has landed.
    const raf = requestAnimationFrame(() => {
      const pos = nodesRef.current.find((n) => n.id === focusedId)?.position ?? layout.get(focusedId);
      if (!pos) return;
      const zoom = Math.max(rf.getZoom(), 0.75);
      // With the drawer open on a wide screen, center in the uncovered area.
      const drawerPx = drawerId && window.innerWidth >= 768 ? DRAWER_WIDTH : 0;
      rf.setCenter(pos.x + NODE_WIDTH / 2 + drawerPx / 2 / zoom, pos.y + NODE_HEIGHT / 2, {
        zoom,
        duration: reduceMotion() ? 0 : 350,
      });
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panTick, layout]);

  // React Flow hard-codes role="application" on its wrapper, which would sit
  // between our role="tree" and the treeitems and break tree ownership for
  // screen readers. React never rewrites an unchanged prop, so this sticks.
  useEffect(() => {
    treeRef.current?.querySelector('.react-flow')?.setAttribute('role', 'presentation');
  }, []);

  // Follow links pasted into the address bar on an already-open page.
  useEffect(() => {
    const onHash = () => {
      const id = idFromHash();
      if (!id || !index.byId.has(id) || id === lastFocused.current) return;
      reveal(id);
      setDrawerId(index.byId.get(id)!.type === 'solution' ? id : null);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [index, reveal]);

  // Keep a shareable deep link to the focused node (replaceState doesn't fire hashchange).
  useEffect(() => {
    const url = focusedId ? `${HASH_PREFIX}${encodeURIComponent(focusedId)}` : location.pathname + location.search;
    history.replaceState(null, '', url);
  }, [focusedId]);

  const drawerNode = drawerId ? (index.byId.get(drawerId) as SolutionNode | undefined) : undefined;

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        direction={direction}
        onDirection={setDirection}
        onSearch={() => setSearchOpen(true)}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onFit={() => rf.fitView({ duration: 400, padding: 0.1 })}
      />

      <main className="relative min-h-0 flex-1">
        <NodeActionsContext.Provider value={nodeActions}>
          <div
            ref={treeRef}
            role="tree"
            aria-label="Problem Atlas map. Arrow keys move between nodes; Enter expands or opens details."
            tabIndex={focusedId ? -1 : 0}
            onKeyDown={onTreeKeyDown}
            onFocus={(e) => {
              // Tabbing into the canvas with nothing focused lands on the last-used node.
              if (e.target !== e.currentTarget) return;
              if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) return;
              const target = lastFocused.current && visible.includes(lastFocused.current) ? lastFocused.current : index.rootIds[0];
              if (target) focusNode(target, { pan: true });
            }}
            className="h-full w-full outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-indigo-500/40"
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onPaneClick={() => focusNode(null)}
              nodesConnectable={false}
              elementsSelectable={false}
              disableKeyboardA11y
              fitView={!initialDeepLink.current}
              onInit={() => initialDeepLink.current && setPanTick((t) => t + 1)}
              fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
              minZoom={0.15}
              maxZoom={1.75}
              colorMode="system"
            >
              <Background gap={24} size={1} />
              <Controls showInteractive={false} position="bottom-right" />
              <MiniMap
                pannable
                zoomable
                position="top-right"
                className="!hidden md:!block"
                nodeColor={(n) => {
                  const a = (n as AtlasFlowNode).data.atlas;
                  if (a.type !== 'solution') return 'rgb(148 163 184)';
                  return { 'AI Solution': '#6366f1', 'Process Improvement': '#10b981', 'Automation Fit': '#f59e0b', 'Requirements Gap': '#f43f5e' }[a.solutionCategory];
                }}
                nodeStrokeWidth={3}
              />
            </ReactFlow>
          </div>
        </NodeActionsContext.Provider>

        <Legend />
      </main>

      {drawerNode && (
        <DetailDrawer
          index={index}
          node={drawerNode}
          onClose={closeDrawer}
          onNavigate={(id) => {
            reveal(id);
            setDrawerId(index.byId.get(id)?.type === 'solution' ? id : null);
          }}
        />
      )}

      {searchOpen && (
        <SearchModal
          index={index}
          onClose={() => setSearchOpen(false)}
          onSelect={(id) => {
            setSearchOpen(false);
            setDrawerId(null);
            reveal(id);
          }}
        />
      )}
    </div>
  );
}

