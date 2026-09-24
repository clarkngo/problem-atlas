import type { DataSensitivity, NodeTier, Readiness, SolutionCategory } from '../types';

export const TIER_LABEL: Record<NodeTier, string> = {
  industry: 'Industry',
  domain: 'Domain',
  role: 'Role',
  scenario: 'Scenario',
  solution: 'Outcome',
};

export const TIER_BADGE: Record<NodeTier, string> = {
  industry: 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900',
  domain: 'bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100',
  role: 'bg-violet-100 text-violet-900 dark:bg-violet-900/60 dark:text-violet-100',
  scenario: 'bg-teal-100 text-teal-900 dark:bg-teal-900/60 dark:text-teal-100',
  solution: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

export interface CategoryStyle {
  short: string;
  blurb: string;
  dot: string;
  badge: string;
  border: string;
}

export const CATEGORY_STYLE: Record<SolutionCategory, CategoryStyle> = {
  'AI Solution': {
    short: 'AI',
    blurb: 'A model-driven capability (RAG, agents, summarization, classification) is the right lever.',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100',
    border: 'border-l-indigo-500',
  },
  'Process Improvement': {
    short: 'Process',
    blurb: 'The bottleneck is how work is organized: standards, ownership, handoffs. Fix that before adding tech.',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100',
    border: 'border-l-emerald-500',
  },
  'Automation Fit': {
    short: 'Automation',
    blurb: 'Deterministic, rule-based work that integrations, webhooks, or scheduled scripts can take over.',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100',
    border: 'border-l-amber-500',
  },
  'Requirements Gap': {
    short: 'Gap',
    blurb: 'Something must exist first (clean data, an API, a policy decision) before any solution will hold.',
    dot: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100',
    border: 'border-l-rose-500',
  },
};

export const READINESS: Record<Readiness, { label: string; dot: string }> = {
  ready: { label: 'Ready to pilot', dot: 'bg-emerald-500' },
  'needs-work': { label: 'Needs groundwork', dot: 'bg-amber-500' },
  blocked: { label: 'Blocked', dot: 'bg-rose-500' },
};

export const SENSITIVITY: Record<DataSensitivity, { label: string; short: string; blurb: string; badge: string }> = {
  public: {
    label: 'Public data',
    short: 'Public',
    blurb: 'Published catalog, policy, or aggregate data. No student records involved.',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  internal: {
    label: 'Internal data',
    short: 'Internal',
    blurb: 'Institutional operations data without student-identifiable records. Normal data-governance approval applies.',
    badge: 'bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100',
  },
  ferpa: {
    label: 'FERPA education records',
    short: 'FERPA',
    blurb:
      'Touches personally identifiable information from education records. Vendors need a “school official” agreement, access is limited to legitimate educational interest, and directory-information opt-outs must be honored.',
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100',
  },
  restricted: {
    label: 'Restricted / highly sensitive',
    short: 'Restricted',
    blurb:
      'FERPA plus stricter rules: SSNs, FAFSA federal tax information, GLBA-covered financial aid data, health or counseling records, disability, or Title IX records. Keep out of general-purpose AI tools unless explicitly approved.',
    badge: 'bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100',
  },
};

export const PRIVACY_DISCLAIMER =
  'Planning guidance only, not legal advice. Confirm with your registrar, privacy office, and general counsel before handling student data.';
