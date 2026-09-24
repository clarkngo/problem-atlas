# Problem Atlas

An interactive, keyboard-first map for diagnosing operational problems in **higher education, healthcare, police departments, and maritime**. Walk from an industry to a department, a role, and a concrete task scenario, and land on an outcome that says what kind of fix the problem needs:

| Outcome | Meaning |
| --- | --- |
| **AI Solution** | A model-driven capability (RAG, agents, summarization, classification) is the right lever. |
| **Process Improvement** | The bottleneck is how work is organized: standards, ownership, handoffs. |
| **Automation Fit** | Deterministic, rule-based work for integrations, webhooks, or scheduled jobs. |
| **Requirements Gap** | Something must exist first (clean data, an API, a policy or contract) before any fix will hold. |

Every outcome also carries a **data sensitivity** level, the **regulations** that govern it (FERPA, HIPAA, 42 CFR Part 2, CJIS, SSI, MLC 2006, …), and privacy notes. In these sectors, whether an idea is feasible depends on those rules as much as on technology. Some outcomes are marked **Blocked** with a “don’t build this yet” diagnosis.

Live site: https://clarkngo.github.io/problem-atlas/

## Stack

React 19 + TypeScript + Vite, Tailwind CSS v4, [React Flow](https://reactflow.dev) (`@xyflow/react`) for the canvas, [Dagre](https://github.com/dagrejs/dagre) for tree layout, and [Fuse.js](https://www.fusejs.io) for fuzzy search. It's a fully static site: no backend, no analytics, no personal data.

```bash
npm install
npm run dev        # http://localhost:5173/problem-atlas/
npm run build      # validate data → typecheck → build to dist/
npm run validate   # check public/data/taxonomy.json only
```

Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/static.yml`. In the repo, go to **Settings → Pages** and set the source to **GitHub Actions**.

## Keyboard

The canvas is an ARIA `tree` with a roving tabindex, so screen readers announce level, position, expanded state, outcome type, and data sensitivity.

| Key | Action |
| --- | --- |
| `→` / `Tab` | Focus the first child, expanding if needed |
| `←` / `Shift+Tab` | Focus the parent |
| `↓` / `↑` | Next / previous sibling (wraps) |
| `Home` / `End` | First / last sibling |
| `Enter` / `Space` | Expand or collapse a branch, or open the detail drawer on an outcome |
| `⌘K` / `Ctrl+K` / `/` | Open search |
| `Esc` | Close search, then the drawer, then deselect |

`Tab` only moves inside the tree while there's somewhere to go. At a leaf, or with `Shift+Tab` at the root, it falls through to the browser, so keyboard users are never trapped in the canvas.

Every focused node is reflected in the URL (`#/n/<node-id>`), so any node or outcome can be linked directly.

## Data

All content lives in [`public/data/taxonomy.json`](public/data/taxonomy.json) as a flat list. Tiers are strictly `industry → domain → role → scenario → solution`, and `childrenIds` order is display and keyboard order.

```jsonc
{
  "id": "sol-feedback-drafts",
  "label": "Rubric-Aligned Feedback Drafts",
  "type": "solution",
  "parentId": "task-feedback-at-scale",
  "childrenIds": [],
  "solutionCategory": "AI Solution",   // | Process Improvement | Automation Fit | Requirements Gap
  "readiness": "needs-work",           // | ready | blocked
  "dataSensitivity": "regulated",      // | public | internal | restricted
  "regulations": ["FERPA"],            // keys into the top-level glossary; required for regulated / restricted
  "tags": ["feedback", "lms"],
  "details": {
    "description": "…",
    "pattern": "…",                    // optional
    "signals": ["…"],                  // optional: "you're in this situation if…"
    "implementationSteps": ["…"],
    "keyBlockers": ["…"],
    "privacyNotes": ["…"]              // required for regulated / restricted
  }
}
```

Scenario nodes carry `details.context` and `details.problemStatement`. Branch nodes (industry, domain, role) take an optional `summary`.

The file also has a top-level `regulations` glossary, which the drawer uses to explain each rule an outcome cites:

```jsonc
"regulations": {
  "HIPAA": { "name": "HIPAA Privacy, Security & Breach Rules", "summary": "…" }
}
```

`npm run validate` (run automatically by `npm run build` and CI) checks that ids are unique, that parent and child links agree in both directions, that the tier order holds, that required fields are present, that every `regulated` or `restricted` outcome names its regulations and explains its privacy handling, and that every regulation code is defined in the glossary and actually used.

### Data sensitivity levels

| Level | Use when the outcome touches… |
| --- | --- |
| `public` | Published or aggregate data. No personal records. |
| `internal` | Operational data with no personal or protected records. |
| `regulated` | Personal data protected by a sector law: student education records (FERPA), PHI (HIPAA), criminal justice information (CJIS), crew personal data (GDPR, MLC). |
| `restricted` | The most protected data within a regime: SSNs, federal tax information, substance-use or psychotherapy records, juvenile or victim records, security plans (SSI). |

> **Not legal advice.** The privacy notes are planning guidance for spotting risk early. Confirm specifics with your privacy, security, or compliance officer and legal counsel before handling protected data.

## Project layout

```
src/
  App.tsx                   state, layout, viewport, deep links
  hooks/useKeyboardNav.ts   tree keyboard model and global shortcuts
  components/
    AtlasNodeCard.tsx       React Flow node (the ARIA treeitem)
    DetailDrawer.tsx        outcome details, including privacy and compliance
    SearchModal.tsx         Fuse.js combobox
    Toolbar.tsx, Legend.tsx
  lib/
    graphIndex.ts           parent, sibling, path, and outcome-count lookups
    layout.ts               Dagre layout
    theme.ts                category, readiness, and sensitivity styling
scripts/validate-taxonomy.mjs
public/data/taxonomy.json
```
