import { SOLUTION_CATEGORIES } from '../lib/graphIndex';
import { CATEGORY_STYLE, PRIVACY_DISCLAIMER, READINESS, SENSITIVITY } from '../lib/theme';

const SHORTCUTS: [string, string][] = [
  ['→ / Tab', 'First child'],
  ['← / ⇧Tab', 'Parent'],
  ['↑ ↓', 'Siblings'],
  ['Home / End', 'First / last sibling'],
  ['Enter / Space', 'Expand · open details'],
  ['⌘K / Ctrl K or /', 'Search'],
  ['Esc', 'Close · deselect'],
];

export function Legend() {
  return (
    <details className="group absolute bottom-3 left-3 z-10 max-w-[calc(100%-5rem)] rounded-xl border border-slate-200 bg-white/95 text-xs shadow-lg backdrop-blur sm:max-w-xs dark:border-slate-700 dark:bg-slate-900/95">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2 font-medium text-slate-700 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-200 [&::-webkit-details-marker]:hidden">
        <span className="flex gap-1" aria-hidden>
          {SOLUTION_CATEGORIES.map((c) => (
            <span key={c} className={`h-2.5 w-2.5 rounded-full ${CATEGORY_STYLE[c].dot}`} />
          ))}
        </span>
        Legend &amp; keys
        <span className="ml-auto text-slate-400 transition-transform group-open:rotate-180" aria-hidden>
          ▴
        </span>
      </summary>

      <div className="space-y-3 border-t border-slate-200 px-3 py-3 dark:border-slate-700">
        <section>
          <h2 className="mb-1.5 font-semibold text-slate-900 dark:text-white">Outcome types</h2>
          <ul className="space-y-1.5">
            {SOLUTION_CATEGORIES.map((c) => (
              <li key={c} className="flex gap-2 text-slate-600 dark:text-slate-300">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${CATEGORY_STYLE[c].dot}`} aria-hidden />
                <span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{c}</span> — {CATEGORY_STYLE[c].blurb}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-1.5 font-semibold text-slate-900 dark:text-white">Readiness</h2>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-600 dark:text-slate-300">
            {Object.values(READINESS).map((r) => (
              <li key={r.label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${r.dot}`} aria-hidden />
                {r.label}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-1.5 font-semibold text-slate-900 dark:text-white">Data sensitivity</h2>
          <ul className="flex flex-wrap gap-1.5">
            {Object.values(SENSITIVITY).map((s) => (
              <li key={s.short} title={s.blurb} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${s.badge}`}>
                {s.short}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11px] italic text-slate-500 dark:text-slate-400">{PRIVACY_DISCLAIMER}</p>
        </section>

        <section>
          <h2 className="mb-1.5 font-semibold text-slate-900 dark:text-white">Keyboard</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-slate-600 dark:text-slate-300">
            {SHORTCUTS.map(([k, v]) => (
              <div key={k} className="contents">
                <dt>
                  <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-sans text-[11px] dark:border-slate-600 dark:bg-slate-800">
                    {k}
                  </kbd>
                </dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </details>
  );
}
