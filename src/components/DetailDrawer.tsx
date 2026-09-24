import { useEffect, useRef } from 'react';
import type { SolutionNode } from '../types';
import type { GraphIndex } from '../lib/graphIndex';
import { CATEGORY_STYLE, PRIVACY_DISCLAIMER, READINESS, SENSITIVITY, TIER_LABEL } from '../lib/theme';
import { ShieldIcon } from './AtlasNodeCard';

interface Props {
  index: GraphIndex;
  node: SolutionNode;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export function DetailDrawer({ index, node, onClose, onNavigate }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const headingId = `drawer-title-${node.id}`;
  const style = CATEGORY_STYLE[node.solutionCategory];

  const path = index.pathTo(node.id).map((id) => index.byId.get(id)!);
  const scenario = path.findLast((n) => n.type === 'scenario');
  const alternatives = index
    .siblingsOf(node.id)
    .filter((id) => id !== node.id)
    .map((id) => index.byId.get(id)!)
    .filter((n): n is SolutionNode => n.type === 'solution');

  useEffect(() => closeRef.current?.focus(), [node.id]);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[drawer-in_200ms_ease-out] dark:border-slate-700 dark:bg-slate-900"
    >
      <header className="flex items-start gap-3 border-b border-slate-200 p-5 dark:border-slate-700">
        <div className="min-w-0 flex-1">
          <nav aria-label="Path" className="mb-2 flex flex-wrap gap-x-1 text-xs text-slate-500 dark:text-slate-400">
            {path.slice(0, -1).map((p, i) => (
              <span key={p.id} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden>›</span>}
                <button type="button" className="hover:text-indigo-600 hover:underline" onClick={() => onNavigate(p.id)}>
                  {p.label}
                </button>
              </span>
            ))}
          </nav>
          <h2 id={headingId} className="text-lg font-semibold leading-snug text-slate-900 dark:text-slate-50">
            {node.label}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded px-2 py-0.5 font-semibold ${style.badge}`}>{node.solutionCategory}</span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className={`h-2 w-2 rounded-full ${READINESS[node.readiness].dot}`} aria-hidden />
              {READINESS[node.readiness].label}
            </span>
            <span className={`flex items-center gap-1 rounded px-2 py-0.5 font-semibold ${SENSITIVITY[node.dataSensitivity].badge}`}>
              <ShieldIcon className="h-3 w-3" />
              {SENSITIVITY[node.dataSensitivity].label}
            </span>
          </div>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
            <path fill="currentColor" d="M5.28 4.22L10 8.94l4.72-4.72 1.06 1.06L11.06 10l4.72 4.72-1.06 1.06L10 11.06l-4.72 4.72-1.06-1.06L8.94 10 4.22 5.28z" />
          </svg>
        </button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {scenario?.type === 'scenario' && (
          <Section title="Scenario context">
            <p>{scenario.details.context}</p>
            <p className="mt-3 rounded-lg border-l-4 border-teal-500 bg-teal-50 px-3 py-2 text-slate-800 dark:bg-teal-950/40 dark:text-slate-200">
              <span className="font-semibold">Problem: </span>
              {scenario.details.problemStatement}
            </p>
          </Section>
        )}

        <Section title="Diagnosis">
          <p>{node.details.description}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">{node.solutionCategory}:</span> {style.blurb}
          </p>
          {node.details.pattern && (
            <p className="mt-2 text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Pattern: </span>
              {node.details.pattern}
            </p>
          )}
        </Section>

        <Section title="Data privacy & compliance">
          <div className={`rounded-lg px-3 py-2 text-xs ${SENSITIVITY[node.dataSensitivity].badge}`}>
            <span className="font-semibold">{SENSITIVITY[node.dataSensitivity].label}. </span>
            {SENSITIVITY[node.dataSensitivity].blurb}
          </div>
          {node.details.privacyNotes && node.details.privacyNotes.length > 0 && (
            <ul className="mt-3 space-y-2">
              {node.details.privacyNotes.map((p) => (
                <li key={p} className="flex gap-2">
                  <ShieldIcon className="mt-1 h-3 w-3 shrink-0 text-slate-400" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] italic text-slate-500 dark:text-slate-400">{PRIVACY_DISCLAIMER}</p>
        </Section>

        {node.details.signals && node.details.signals.length > 0 && (
          <Section title="You're in this situation if…">
            <ul className="list-disc space-y-1 pl-5">
              {node.details.signals.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Implementation steps">
          <ol className="space-y-2">
            {node.details.implementationSteps.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Key blockers">
          <ul className="space-y-2">
            {node.details.keyBlockers.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Section>

        {alternatives.length > 0 && (
          <Section title="Other diagnoses for this scenario">
            <ul className="space-y-1">
              {alternatives.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(a.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_STYLE[a.solutionCategory].dot}`} aria-hidden />
                    <span className="flex-1">{a.label}</span>
                    <span className="text-xs text-slate-400">{CATEGORY_STYLE[a.solutionCategory].short}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {node.tags && node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {node.tags.map((t) => (
              <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-slate-200 px-5 py-3 text-[11px] text-slate-500 dark:border-slate-700">
        {TIER_LABEL.solution} · <code>{node.id}</code> · <kbd>Esc</kbd> to close
      </footer>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h3>
      {children}
    </section>
  );
}
