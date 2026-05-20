// Mindmap correctness check.
//
//   npm run validate
//
// Walks the entire dataset and reports anything broken:
//   • orphan nodes (parentId pointing nowhere)
//   • edges referencing missing nodes
//   • relatedIds / toolIds pointing to missing nodes
//   • learning paths / projects / tradeoffs referencing missing nodes
//   • clusters not summing to 26 domains
//   • domains with zero children, kinds with weird parent kinds, etc.
//
// Exits non-zero if any error is found, so this can also gate CI later.

import { graph, nodeById, domainById } from '../src/data/index';
import { getClusters } from '../src/three/layout';
import type { GNode } from '../src/data/schema';

const errors: string[] = [];
const warnings: string[] = [];

function err(msg: string) {
  errors.push(msg);
}
function warn(msg: string) {
  warnings.push(msg);
}

// 1) Node id uniqueness.
{
  const seen = new Map<string, number>();
  for (const n of graph.nodes) {
    seen.set(n.id, (seen.get(n.id) ?? 0) + 1);
  }
  for (const [id, c] of seen) {
    if (c > 1) err(`duplicate node id "${id}" appears ${c} times`);
  }
}

// 2) domainId references a valid domain.
for (const n of graph.nodes) {
  if (!domainById.has(n.domainId)) {
    err(`node "${n.id}" has unknown domainId "${n.domainId}"`);
  }
}

// 3) parentId references an existing node, and the parent kind makes sense.
for (const n of graph.nodes) {
  if (n.kind === 'domain') {
    if (n.parentId) err(`domain "${n.id}" has a parentId — domains should be roots`);
    continue;
  }
  if (!n.parentId) {
    warn(`${n.kind} "${n.id}" has no parentId`);
    continue;
  }
  const p = nodeById.get(n.parentId);
  if (!p) {
    err(`node "${n.id}" (${n.kind}) has parentId "${n.parentId}" which doesn't exist`);
    continue;
  }
  if (n.kind === 'subdomain' && p.kind !== 'domain') {
    warn(`subdomain "${n.id}" has parent "${p.id}" which is a ${p.kind}, expected domain`);
  }
  // concept/pattern/tool/metric/failureMode should hang off a subdomain.
  if (['concept', 'pattern', 'tool', 'metric', 'failureMode'].includes(n.kind)) {
    if (p.kind !== 'subdomain' && p.kind !== 'concept') {
      warn(
        `${n.kind} "${n.id}" has parent "${p.id}" which is a ${p.kind}; expected subdomain (or concept for deeper detail)`,
      );
    }
  }
}

// 4) Edges reference existing nodes.
for (const e of graph.edges) {
  if (!nodeById.has(e.source)) err(`edge ${e.kind} → "${e.target}" has missing source "${e.source}"`);
  if (!nodeById.has(e.target)) err(`edge ${e.kind} from "${e.source}" → has missing target "${e.target}"`);
}

// 5) Self-edges.
for (const e of graph.edges) {
  if (e.source === e.target) warn(`self-edge ${e.kind} on "${e.source}"`);
}

// 6) relatedIds / toolIds references.
for (const n of graph.nodes) {
  for (const rid of n.relatedIds ?? []) {
    if (!nodeById.has(rid)) err(`node "${n.id}".relatedIds → missing node "${rid}"`);
  }
  for (const tid of n.toolIds ?? []) {
    if (!nodeById.has(tid)) err(`node "${n.id}".toolIds → missing node "${tid}"`);
  }
}

// 7) Domain coverage.
const domainsWithChildren = new Set<string>();
for (const n of graph.nodes) {
  if (n.parentId) {
    const p = nodeById.get(n.parentId);
    if (p?.kind === 'domain') domainsWithChildren.add(p.id);
  }
}
for (const d of graph.domains) {
  if (!domainsWithChildren.has(d.id)) {
    warn(`domain "${d.id}" (${d.name}) has zero subdomains`);
  }
}

// 8) Cluster coverage — every domain must belong to exactly one cluster.
{
  const clusters = getClusters();
  const counts = new Map<string, number>();
  for (const d of graph.domains) counts.set(d.id, 0);
  for (const c of clusters) {
    for (const did of c.domainIds) {
      if (!counts.has(did)) err(`cluster "${c.id}" lists unknown domain "${did}"`);
      else counts.set(did, (counts.get(did) ?? 0) + 1);
    }
  }
  for (const [did, n] of counts) {
    if (n === 0) err(`domain "${did}" is not in any cluster`);
    else if (n > 1) err(`domain "${did}" is in ${n} clusters`);
  }
  const total = clusters.reduce((s, c) => s + c.domainIds.length, 0);
  if (total !== graph.domains.length) {
    err(`cluster total ${total} ≠ domain count ${graph.domains.length}`);
  }
}

// 9) Learning paths.
for (const p of graph.learningPaths) {
  for (const id of p.nodeIds) {
    if (!nodeById.has(id)) err(`learning path "${p.id}" → missing node "${id}"`);
  }
  for (const pid of p.projectIds ?? []) {
    const ok = graph.projects.some((pr) => pr.id === pid);
    if (!ok) err(`learning path "${p.id}" → missing project "${pid}"`);
  }
}

// 10) Projects.
for (const proj of graph.projects) {
  for (const cid of proj.conceptIds) {
    if (!nodeById.has(cid)) err(`project "${proj.id}" conceptIds → missing node "${cid}"`);
  }
}

// 11) Tradeoffs.
for (const t of graph.tradeoffs) {
  for (const rid of t.relatedNodeIds ?? []) {
    if (!nodeById.has(rid)) err(`tradeoff "${t.id}" relatedNodeIds → missing node "${rid}"`);
  }
}

// 12) Stats summary.
const byKind = new Map<string, number>();
for (const n of graph.nodes) byKind.set(n.kind, (byKind.get(n.kind) ?? 0) + 1);
const byEdgeKind = new Map<string, number>();
for (const e of graph.edges) byEdgeKind.set(e.kind, (byEdgeKind.get(e.kind) ?? 0) + 1);

// ───────────────────────── Report ─────────────────────────
console.log('═══════════════════════════════════════════════════════════');
console.log('   Tech Galaxy — dataset validation');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log(`  domains:        ${graph.domains.length}`);
console.log(`  total nodes:    ${graph.nodes.length}`);
for (const [k, n] of [...byKind].sort((a, b) => b[1] - a[1])) {
  console.log(`    · ${k.padEnd(14)} ${n}`);
}
console.log(`  total edges:    ${graph.edges.length}`);
for (const [k, n] of [...byEdgeKind].sort((a, b) => b[1] - a[1])) {
  console.log(`    · ${k.padEnd(14)} ${n}`);
}
console.log(`  learning paths: ${graph.learningPaths.length}`);
console.log(`  projects:       ${graph.projects.length}`);
console.log(`  tradeoffs:      ${graph.tradeoffs.length}`);
console.log('');

if (warnings.length > 0) {
  console.log(`──────── ${warnings.length} warning(s) ────────`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  console.log('');
}

if (errors.length > 0) {
  console.log(`──────── ${errors.length} error(s) ────────`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log('');
  console.log('FAIL — fix the errors above before shipping.');
  process.exit(1);
} else {
  console.log('✓ All checks passed.');
}
