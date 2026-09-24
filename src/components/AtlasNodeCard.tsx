import { createContext, memo, useContext } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { AtlasNode, LayoutDirection } from '../types';
import { SOLUTION_CATEGORIES, type CategoryCounts } from '../lib/graphIndex';
import { CATEGORY_STYLE, READINESS, SENSITIVITY, TIER_BADGE, TIER_LABEL } from '../lib/theme';
import { NODE_HEIGHT, NODE_WIDTH } from '../lib/layout';

export type AtlasFlowNode = Node<
  {
    atlas: AtlasNode;
    expanded: boolean;
    focused: boolean;
    direction: LayoutDirection;
    counts: CategoryCounts;
    level: number;
    posInSet: number;
    setSize: number;
  },
  'atlas'
>;

export interface NodeActions {
  onActivate: (id: string) => void;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}

export const NodeActionsContext = createContext<NodeActions | null>(null);

function describe(n: AtlasNode, expanded: boolean, counts: CategoryCounts) {
  if (n.type === 'solution')
    return `${n.label}. ${n.solutionCategory} outcome, ${READINESS[n.readiness].label}, ${SENSITIVITY[n.dataSensitivity].label}${
      n.regulations?.length ? ` (${n.regulations.join(', ')})` : ''
    }.`;
  const total = SOLUTION_CATEGORIES.reduce((s, k) => s + counts[k], 0);
  return `${n.label}. ${TIER_LABEL[n.type]}, ${n.childrenIds.length} ${n.childrenIds.length === 1 ? 'child' : 'children'}, ${total} outcomes${expanded ? '' : ', collapsed'}.`;
}

function AtlasNodeCardImpl({ data }: NodeProps<AtlasFlowNode>) {
  const actions = useContext(NodeActionsContext)!;
  const { atlas: n, expanded, focused, direction, counts, level, posInSet, setSize } = data;
  const isOutcome = n.type === 'solution';
  const hasChildren = n.childrenIds.length > 0;
  const [target, source] = direction === 'LR' ? [Position.Left, Position.Right] : [Position.Top, Position.Bottom];

  return (
    <div
      data-atlas-id={n.id}
      role="treeitem"
      aria-level={level}
      aria-posinset={posInSet}
      aria-setsize={setSize}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={focused}
      aria-label={describe(n, expanded, counts)}
      tabIndex={focused ? 0 : -1}
      onFocus={() => !focused && actions.onActivate(n.id)}
      onClick={() => (isOutcome ? actions.onOpen(n.id) : actions.onActivate(n.id))}
      onDoubleClick={() => hasChildren && actions.onToggle(n.id)}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
      className={[
        'group relative flex flex-col justify-between rounded-xl border bg-white px-3 py-2 text-left shadow-sm outline-none transition-shadow',
        'dark:bg-slate-900',
        isOutcome ? `border-l-4 ${CATEGORY_STYLE[n.solutionCategory].border}` : '',
        focused
          ? 'border-indigo-500 ring-4 ring-indigo-500/30 shadow-md dark:border-indigo-400'
          : 'border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500',
        'focus-visible:ring-4 focus-visible:ring-indigo-500/60',
      ].join(' ')}
    >
      <Handle type="target" position={target} isConnectable={false} className="!pointer-events-none !opacity-0" />

      <div className="flex items-center gap-1.5">
        {isOutcome ? (
          <>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${CATEGORY_STYLE[n.solutionCategory].badge}`}>
              {CATEGORY_STYLE[n.solutionCategory].short}
            </span>
            {(n.dataSensitivity === 'regulated' || n.dataSensitivity === 'restricted') && (
              <span
                title={SENSITIVITY[n.dataSensitivity].label}
                className={`flex min-w-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${SENSITIVITY[n.dataSensitivity].badge}`}
              >
                <ShieldIcon className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{n.regulations?.[0] ?? SENSITIVITY[n.dataSensitivity].short}</span>
              </span>
            )}
          </>
        ) : (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIER_BADGE[n.type]}`}>
            {TIER_LABEL[n.type]}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1">
          {isOutcome ? (
            <span
              title={READINESS[n.readiness].label}
              className={`h-2.5 w-2.5 rounded-full ${READINESS[n.readiness].dot}`}
              aria-hidden
            />
          ) : (
            <OutcomeDots counts={counts} />
          )}
        </span>
      </div>

      <div className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900 dark:text-slate-100">{n.label}</div>

      {hasChildren && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={(e) => {
            e.stopPropagation();
            actions.onActivate(n.id);
            actions.onToggle(n.id);
          }}
          className={[
            'nodrag absolute z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-white text-xs font-bold text-slate-600 shadow-sm',
            'hover:border-indigo-500 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300',
            direction === 'LR' ? '-right-3 top-1/2 -translate-y-1/2' : '-bottom-3 left-1/2 -translate-x-1/2',
            expanded ? 'border-slate-300 dark:border-slate-600' : 'border-indigo-400 dark:border-indigo-500',
          ].join(' ')}
        >
          {expanded ? '−' : n.childrenIds.length}
        </button>
      )}

      <Handle type="source" position={source} isConnectable={false} className="!pointer-events-none !opacity-0" />
    </div>
  );
}

export function ShieldIcon({ className = 'h-2.5 w-2.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path fill="currentColor" d="M8 1l6 2.5v4C14 11 11.4 14 8 15 4.6 14 2 11 2 7.5v-4L8 1z" />
    </svg>
  );
}

/** One dot per outcome category present below this branch, sized by count. */
function OutcomeDots({ counts }: { counts: CategoryCounts }) {
  return (
    <>
      {SOLUTION_CATEGORIES.filter((k) => counts[k] > 0).map((k) => (
        <span
          key={k}
          title={`${counts[k]} ${k}`}
          className="flex items-center gap-0.5 text-[10px] font-medium tabular-nums text-slate-500 dark:text-slate-400"
          aria-hidden
        >
          <span className={`h-2 w-2 rounded-full ${CATEGORY_STYLE[k].dot}`} />
          {counts[k]}
        </span>
      ))}
    </>
  );
}

export const AtlasNodeCard = memo(AtlasNodeCardImpl);
