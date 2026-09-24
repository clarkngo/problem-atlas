import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { AtlasNode, SolutionCategory } from '../types';
import type { GraphIndex } from '../lib/graphIndex';
import { CATEGORY_STYLE, TIER_BADGE, TIER_LABEL } from '../lib/theme';

interface SearchDoc {
  id: string;
  label: string;
  type: AtlasNode['type'];
  category: string;
  solutionCategory?: SolutionCategory;
  regulations: string[];
  path: string;
  text: string;
  tags: string[];
}

interface Props {
  index: GraphIndex;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const MAX_RESULTS = 30;

export function SearchModal({ index, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const { strict, loose, docs } = useMemo(() => {
    const docs: SearchDoc[] = [...index.byId.values()].map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      category:
        n.type === 'solution'
          ? [n.solutionCategory, n.dataSensitivity, ...(n.regulations ?? []).flatMap((r) => [r, index.regulations[r]?.name ?? ''])].join(' ')
          : '',
      solutionCategory: n.type === 'solution' ? n.solutionCategory : undefined,
      regulations: n.type === 'solution' ? (n.regulations ?? []) : [],
      path: index
        .pathTo(n.id)
        .slice(0, -1)
        .map((id) => index.byId.get(id)!.label)
        .join(' › '),
      text:
        n.type === 'solution'
          ? `${n.details.description} ${n.details.keyBlockers.join(' ')} ${(n.details.privacyNotes ?? []).join(' ')}`
          : n.type === 'scenario'
            ? `${n.details.problemStatement} ${n.details.context}`
            : (n.summary ?? ''),
      tags: n.tags ?? [],
    }));
    const keys = [
        { name: 'label', weight: 3 },
        { name: 'tags', weight: 2 },
        { name: 'category', weight: 1.5 },
        { name: 'path', weight: 1 },
        { name: 'text', weight: 0.6 },
    ];
    const base = { keys, ignoreLocation: true, minMatchCharLength: 2 };
    // Extended search ANDs whitespace-separated fuzzy tokens, so "parent
    // consent" needs both words rather than fuzzy-matching the whole phrase.
    // It requires tokens to co-occur in one field, so fall back to loose
    // phrase matching for cross-field queries like "chatbot advising".
    const strict = new Fuse(docs, { ...base, threshold: 0.3, useExtendedSearch: true });
    const loose = new Fuse(docs, { ...base, threshold: 0.38 });
    return { strict, loose, docs };
  }, [index]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return docs.filter((d) => d.type === 'scenario').slice(0, MAX_RESULTS);
    // Strip extended-search operators (=, ', !, ^, $, |) so input is always a plain fuzzy match.
    const plain = q.replace(/[='!^$|]/g, ' ').trim();
    const hits = plain ? strict.search(plain, { limit: MAX_RESULTS }) : [];
    const fuzzy = (hits.length ? hits : loose.search(q, { limit: MAX_RESULTS })).map((r) => r.item);

    // Acronyms like "SSI" or "CJIS" are too short for fuzzy matching (they hit
    // "acce-ssi-bility"), so a query naming a regulation lists its outcomes first.
    const lower = q.toLowerCase();
    const reg = Object.keys(index.regulations).find(
      (code) => code.toLowerCase() === lower || index.regulations[code].name.toLowerCase() === lower,
    );
    if (!reg) return fuzzy;
    // Fuzzy scores are meaningless for short acronyms, so use exact whole-word
    // mentions instead: outcomes tagged with the regulation, then any node whose
    // text names it.
    const tagged = docs.filter((d) => d.regulations.includes(reg));
    const word = new RegExp(`\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const mentions = docs.filter((d) => !tagged.includes(d) && word.test(`${d.label} ${d.text}`));
    return [...tagged, ...mentions].slice(0, MAX_RESULTS);
  }, [query, strict, loose, docs, index]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (i: number) => {
    const r = results[i];
    if (r) onSelect(r.id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        onClose();
        break;
      case 'Tab':
        // Single-field dialog: keep focus inside it.
        e.preventDefault();
        break;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the atlas"
        className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-700">
          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-slate-400" aria-hidden>
            <path fill="currentColor" d="M8.5 3a5.5 5.5 0 014.38 8.83l3.65 3.64-1.06 1.06-3.64-3.65A5.5 5.5 0 118.5 3zm0 1.5a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search industries, roles, scenarios, outcomes…"
            className="h-14 w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <kbd className="hidden rounded border border-slate-300 px-1.5 text-[11px] text-slate-500 sm:block dark:border-slate-600">Esc</kbd>
        </div>

        <ul ref={listRef} id={listId} role="listbox" aria-label="Results" className="overflow-y-auto p-2">
          {!query.trim() && (
            <li role="presentation" className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Scenarios
            </li>
          )}
          {results.length === 0 && (
            <li role="presentation" className="px-3 py-8 text-center text-sm text-slate-500">
              No matches for “{query}”
            </li>
          )}
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`${listId}-${i}`}
              data-idx={i}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => choose(i)}
              className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 ${
                i === active ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''
              }`}
            >
              <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TIER_BADGE[r.type]}`}>
                {TIER_LABEL[r.type]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">{r.label}</span>
                {r.path && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{r.path}</span>}
              </span>
              {r.solutionCategory && (
                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${CATEGORY_STYLE[r.solutionCategory].badge}`}>
                  {CATEGORY_STYLE[r.solutionCategory].short}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="flex gap-4 border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-700">
          <span>
            <kbd className="font-sans">↑↓</kbd> move
          </span>
          <span>
            <kbd className="font-sans">↵</kbd> jump to node
          </span>
          <span className="ml-auto">{results.length} shown</span>
        </div>
      </div>
    </div>
  );
}
