// Validates public/data/taxonomy.json. Runs before every build so a bad edit
// fails CI instead of shipping a broken map.
import { readFileSync } from 'node:fs';

const file = new URL('../public/data/taxonomy.json', import.meta.url);
const { nodes, regulations = {} } = JSON.parse(readFileSync(file, 'utf8'));

const TIERS = ['industry', 'domain', 'role', 'scenario', 'solution'];
const CATEGORIES = ['AI Solution', 'Process Improvement', 'Automation Fit', 'Requirements Gap'];
const READINESS = ['ready', 'needs-work', 'blocked'];
const SENSITIVITY = ['public', 'internal', 'regulated', 'restricted'];

const errors = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const byId = new Map();

for (const n of nodes) {
  if (byId.has(n.id)) err(n.id, 'duplicate id');
  byId.set(n.id, n);
}

for (const n of nodes) {
  if (!n.label) err(n.id, 'missing label');
  if (!TIERS.includes(n.type)) err(n.id, `unknown type "${n.type}"`);
  if (!Array.isArray(n.childrenIds)) err(n.id, 'childrenIds must be an array');

  if (n.parentId === null) {
    if (n.type !== 'industry') err(n.id, 'only industry nodes may be roots');
  } else {
    const parent = byId.get(n.parentId);
    if (!parent) err(n.id, `parent ${n.parentId} does not exist`);
    else {
      if (!parent.childrenIds.includes(n.id)) err(n.id, `parent ${n.parentId} does not list it in childrenIds`);
      if (TIERS.indexOf(n.type) !== TIERS.indexOf(parent.type) + 1)
        err(n.id, `${n.type} cannot be a child of ${parent.type}`);
    }
  }

  for (const c of n.childrenIds ?? []) {
    const child = byId.get(c);
    if (!child) err(n.id, `child ${c} does not exist`);
    else if (child.parentId !== n.id) err(n.id, `child ${c} has parentId ${child.parentId}`);
  }

  if (n.type === 'scenario') {
    if (!n.details?.context || !n.details?.problemStatement) err(n.id, 'scenario needs details.context and details.problemStatement');
    if (!n.childrenIds.length) err(n.id, 'scenario has no outcomes');
  }

  if (n.type === 'solution') {
    if (n.childrenIds.length) err(n.id, 'solutions must be leaves');
    if (!CATEGORIES.includes(n.solutionCategory)) err(n.id, `solutionCategory must be one of ${CATEGORIES.join(', ')}`);
    if (!READINESS.includes(n.readiness)) err(n.id, `readiness must be one of ${READINESS.join(', ')}`);
    if (!SENSITIVITY.includes(n.dataSensitivity)) err(n.id, `dataSensitivity must be one of ${SENSITIVITY.join(', ')}`);
    const d = n.details ?? {};
    if (!d.description) err(n.id, 'missing details.description');
    if (!d.implementationSteps?.length) err(n.id, 'missing details.implementationSteps');
    if (!d.keyBlockers?.length) err(n.id, 'missing details.keyBlockers');
    const protectedData = n.dataSensitivity === 'regulated' || n.dataSensitivity === 'restricted';
    if (protectedData && !d.privacyNotes?.length)
      err(n.id, `${n.dataSensitivity} outcomes must explain their privacy handling in details.privacyNotes`);
    if (protectedData && !n.regulations?.length)
      err(n.id, `${n.dataSensitivity} outcomes must name the governing law(s) in regulations`);
    for (const r of n.regulations ?? []) if (!regulations[r]) err(n.id, `regulation "${r}" is not defined in the top-level regulations glossary`);
  }
}

const used = new Set(nodes.flatMap((n) => n.regulations ?? []));
for (const [code, r] of Object.entries(regulations)) {
  if (!r.name || !r.summary) err(`regulations.${code}`, 'needs name and summary');
  if (!used.has(code)) err(`regulations.${code}`, 'defined but never used');
}

if (errors.length) {
  console.error(`taxonomy.json: ${errors.length} problem(s)\n  ` + errors.join('\n  '));
  process.exit(1);
}
const count = (t) => nodes.filter((n) => n.type === t).length;
console.log(
  `taxonomy.json OK: ${nodes.length} nodes (${TIERS.map((t) => `${count(t)} ${t}`).join(', ')})`,
);
