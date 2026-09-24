# Problem Atlas

An interactive, keyboard-first map for diagnosing problems in **higher education**. Walk from a department to a role to a concrete task scenario, and land on an outcome that says what kind of fix the problem needs:

| Outcome | Meaning |
| --- | --- |
| **AI Solution** | A model-driven capability (RAG, agents, summarization, classification) is the right lever. |
| **Process Improvement** | The bottleneck is how work is organized: standards, ownership, handoffs. |
| **Automation Fit** | Deterministic, rule-based work for integrations, webhooks, or scheduled jobs. |
| **Requirements Gap** | Something must exist first (clean data, an API, a policy or contract) before any fix will hold. |

Every outcome also carries a **data sensitivity** level and privacy notes. In higher ed, whether an idea is feasible usually depends on FERPA, GLBA, and similar rules as much as on technology.

Live site: https://clarkngo.github.io/problem-atlas/

## Stack

React 19 + TypeScript + Vite, Tailwind CSS v4, [React Flow](https://reactflow.dev) (`@xyflow/react`) for the canvas, [Dagre](https://github.com/dagrejs/dagre) for tree layout, and [Fuse.js](https://www.fusejs.io) for fuzzy search. It's a fully static site: no backend, no analytics, no student data.

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
  "dataSensitivity": "ferpa",          // | public | internal | restricted
  "tags": ["feedback", "lms"],
  "details": {
    "description": "…",
    "pattern": "…",                    // optional
    "signals": ["…"],                  // optional: "you're in this situation if…"
    "implementationSteps": ["…"],
    "keyBlockers": ["…"],
    "privacyNotes": ["…"]              // required for ferpa / restricted
  }
}
```

Scenario nodes carry `details.context` and `details.problemStatement`. Branch nodes (industry, domain, role) take an optional `summary`.

`npm run validate` (run automatically by `npm run build` and CI) checks that ids are unique, that parent and child links agree in both directions, that the tier order holds, that required fields are present, and that every `ferpa` or `restricted` outcome explains its privacy handling.

### Data sensitivity levels

| Level | Use when the outcome touches… |
| --- | --- |
| `public` | Catalogs, published policy, aggregate statistics. No student records. |
| `internal` | Institutional operations data with no student-identifiable records. |
| `ferpa` | Personally identifiable information from education records. |
| `restricted` | FERPA plus stricter rules: SSNs, FAFSA federal tax information, GLBA-covered aid data, health or counseling, disability, or Title IX records. |

> **Not legal advice.** The privacy notes are planning guidance for spotting risk early. Confirm specifics with your registrar, privacy office, and general counsel before handling student data.

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
