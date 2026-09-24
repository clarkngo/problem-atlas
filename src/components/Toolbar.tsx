import type { LayoutDirection } from '../types';

interface Props {
  direction: LayoutDirection;
  onDirection: (d: LayoutDirection) => void;
  onSearch: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onFit: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

const btn =
  'rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-200 dark:hover:bg-slate-800';

export function Toolbar({ direction, onDirection, onSearch, onExpandAll, onCollapseAll, onFit }: Props) {
  return (
    <header className="z-10 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mr-2 flex items-center gap-2">
        <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
          <path d="M12 14L20 9M12 18L20 23" stroke="currentColor" strokeWidth="2" className="text-slate-400" />
          <circle cx="8" cy="16" r="5" fill="#6366f1" />
          <circle cx="24" cy="8" r="4" fill="#10b981" />
          <circle cx="24" cy="24" r="4" fill="#f59e0b" />
        </svg>
        <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">Problem Atlas</h1>
      </div>

      <button
        type="button"
        onClick={onSearch}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-sm text-slate-500 hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-indigo-500 sm:max-w-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden>
          <path fill="currentColor" d="M8.5 3a5.5 5.5 0 014.38 8.83l3.65 3.64-1.06 1.06-3.64-3.65A5.5 5.5 0 118.5 3zm0 1.5a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
        <span className="flex-1 truncate">Search the atlas…</span>
        <kbd className="hidden rounded border border-slate-300 px-1 text-[11px] sm:inline dark:border-slate-600">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <div role="group" aria-label="Layout direction" className="mr-1 flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
          {(['LR', 'TB'] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={direction === d}
              onClick={() => onDirection(d)}
              className={`rounded-md px-2 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                direction === d
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {d === 'LR' ? 'Horizontal' : 'Vertical'}
            </button>
          ))}
        </div>
        <button type="button" className={btn} onClick={onExpandAll}>
          Expand all
        </button>
        <button type="button" className={btn} onClick={onCollapseAll}>
          Collapse
        </button>
        <button type="button" className={`${btn} hidden sm:block`} onClick={onFit}>
          Fit
        </button>
      </div>
    </header>
  );
}
