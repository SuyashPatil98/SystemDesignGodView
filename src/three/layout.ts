import * as THREE from 'three';
import type { GNode, Domain } from '../data/schema';

// ───────────────────── Tech Galaxy — Mind-map tree layout ─────────────────────
//
// Two-level radial mind map.
//
//   1. The 26 domains are grouped into 6 *thematic super-clusters*
//      (Foundations / Storage / DevOps / Data / ML / GenAI). Each cluster gets
//      its own region of the sphere, so related domains end up as visual
//      neighbours instead of being scattered.
//   2. Inside each domain, subdomains fan outward in a tight cone; concepts
//      fan further along that branch; detail leaves at the tips.
//
// Parent → child edges are the primary visual.

// Distances per tree level.
const D_DOMAIN_FROM_ORIGIN = 70;
const D_SUB_FROM_DOMAIN = 38;
const D_CONCEPT_FROM_SUB = 22;
const D_DETAIL_FROM_CONCEPT = 12;

// Cone half-angles for fanning out children around the parent's outward axis.
const CONE_SUB = (24 * Math.PI) / 180;
const CONE_CONCEPT = (20 * Math.PI) / 180;
const CONE_DETAIL = (16 * Math.PI) / 180;

// Thematic super-clusters. Domains in the same cluster sit close on the sphere.
interface Cluster {
  id: string;
  name: string;
  domainIds: string[];
}

const CLUSTERS: Cluster[] = [
  {
    id: 'foundations',
    name: 'Foundations',
    domainIds: ['system-design', 'distributed-systems', 'backend-eng', 'api-design'],
  },
  {
    id: 'storage',
    name: 'Storage & Messaging',
    domainIds: ['databases', 'caching', 'messaging'],
  },
  {
    id: 'devops-cloud',
    name: 'DevOps & Cloud',
    domainIds: ['devops', 'cloud', 'kubernetes', 'iac', 'cicd', 'observability', 'security'],
  },
  {
    id: 'data',
    name: 'Data',
    domainIds: ['data-eng', 'dw', 'lakehouse', 'streaming', 'batch'],
  },
  {
    id: 'ml',
    name: 'Machine Learning',
    domainIds: ['ml', 'dl', 'mlops'],
  },
  {
    id: 'genai',
    name: 'GenAI & Production AI',
    domainIds: ['genai', 'llmops', 'vector', 'prod-ai'],
  },
];

// Hand-picked vivid palette per domain.
const DOMAIN_PALETTE: Record<string, string> = {
  'system-design': '#22d3ee',
  'distributed-systems': '#38bdf8',
  'backend-eng': '#14b8a6',
  'databases': '#f59e0b',
  'caching': '#fbbf24',
  'messaging': '#a78bfa',
  'api-design': '#10b981',
  'devops': '#84cc16',
  'cloud': '#06b6d4',
  'kubernetes': '#6366f1',
  'iac': '#22c55e',
  'cicd': '#a3e635',
  'observability': '#eab308',
  'security': '#ef4444',
  'data-eng': '#c026d3',
  'dw': '#d946ef',
  'lakehouse': '#8b5cf6',
  'streaming': '#e879f9',
  'batch': '#7c3aed',
  'ml': '#ec4899',
  'dl': '#f43f5e',
  'mlops': '#fb7185',
  'genai': '#f97316',
  'llmops': '#fb923c',
  'vector': '#facc15',
  'prod-ai': '#dc2626',
};

const FALLBACK = '#94a3b8';

export interface Positioned {
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
}

function fibonacciSphereDirs(n: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    out.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
  }
  return out;
}

// Distribute N positions inside a cone around `axis`, at distance `radius`.
function placeInCone(
  n: number,
  axis: THREE.Vector3,
  radius: number,
  halfAngle: number,
): THREE.Vector3[] {
  if (n <= 0) return [];
  if (n === 1) return [axis.clone().normalize().multiplyScalar(radius)];

  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    axis.clone().normalize(),
  );
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const sinH = Math.sin(halfAngle);

  const out: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const rXY = Math.sqrt(t) * sinH;
    const y = Math.sqrt(Math.max(0, 1 - rXY * rXY));
    const theta = i * goldenAngle;
    const local = new THREE.Vector3(
      Math.cos(theta) * rXY,
      y,
      Math.sin(theta) * rXY,
    );
    local.applyQuaternion(q).multiplyScalar(radius);
    out.push(local);
  }
  return out;
}

// Inner-cluster cone size scales gently with member count so the 7-domain
// DevOps cluster doesn't crowd into the 3-domain Storage cluster.
function clusterHalfAngle(count: number): number {
  if (count <= 3) return (22 * Math.PI) / 180;
  if (count <= 4) return (26 * Math.PI) / 180;
  if (count <= 5) return (30 * Math.PI) / 180;
  return (34 * Math.PI) / 180; // 6-7
}

function colorForDomain(domainId: string, brighten = 0): THREE.Color {
  const hex = DOMAIN_PALETTE[domainId] ?? FALLBACK;
  const c = new THREE.Color(hex);
  if (brighten !== 0) {
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    hsl.l = Math.min(0.85, hsl.l + brighten);
    hsl.s = Math.min(1, hsl.s + 0.05);
    c.setHSL(hsl.h, hsl.s, hsl.l);
  }
  return c;
}

// Compute the world-space direction unit vector for every domain, accounting
// for its super-cluster.
function computeDomainDirections(domains: Domain[]): Map<string, THREE.Vector3> {
  const out = new Map<string, THREE.Vector3>();
  const clusterCenters = fibonacciSphereDirs(CLUSTERS.length);

  CLUSTERS.forEach((cluster, ci) => {
    const center = clusterCenters[ci];
    const halfAngle = clusterHalfAngle(cluster.domainIds.length);
    const offsets = placeInCone(
      cluster.domainIds.length,
      center,
      1,
      halfAngle,
    );
    cluster.domainIds.forEach((id, di) => {
      out.set(id, offsets[di].clone().normalize());
    });
  });

  // Any domain not assigned to a cluster falls back to plain Fibonacci.
  const unassigned = domains.filter((d) => !out.has(d.id));
  if (unassigned.length > 0) {
    const dirs = fibonacciSphereDirs(unassigned.length);
    unassigned.forEach((d, i) => out.set(d.id, dirs[i]));
  }

  return out;
}

export function computeLayout(
  domains: Domain[],
  nodes: GNode[],
): Map<string, Positioned> {
  const out = new Map<string, Positioned>();
  const childrenByParent = new Map<string, GNode[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const arr = childrenByParent.get(n.parentId) ?? [];
    arr.push(n);
    childrenByParent.set(n.parentId, arr);
  }

  // 1) Domains placed via super-clusters.
  const domainDirs = computeDomainDirections(domains);
  domains.forEach((d) => {
    const dir = domainDirs.get(d.id)!;
    out.set(d.id, {
      position: dir.clone().multiplyScalar(D_DOMAIN_FROM_ORIGIN),
      color: colorForDomain(d.id),
      size: 3.4,
    });
  });

  // 2) Subdomains fan out in a cone around their domain's outward direction.
  for (const d of domains) {
    const domainPos = out.get(d.id)!.position;
    const domainDir = domainPos.clone().normalize();
    const subs = childrenByParent.get(d.id) ?? [];
    const subOffsets = placeInCone(
      subs.length,
      domainDir,
      D_SUB_FROM_DOMAIN,
      CONE_SUB,
    );

    subs.forEach((s, i) => {
      const subPos = domainPos.clone().add(subOffsets[i]);
      out.set(s.id, {
        position: subPos,
        color: colorForDomain(d.id, 0.08),
        size: 1.7,
      });

      // 3) Concepts fan out from subdomain.
      const subOutward = subPos.clone().sub(domainPos).normalize();
      const concepts = childrenByParent.get(s.id) ?? [];
      const conceptOffsets = placeInCone(
        concepts.length,
        subOutward,
        D_CONCEPT_FROM_SUB,
        CONE_CONCEPT,
      );

      concepts.forEach((c, ci) => {
        const conceptPos = subPos.clone().add(conceptOffsets[ci]);
        out.set(c.id, {
          position: conceptPos,
          color: colorForDomain(d.id, 0.14),
          size: 0.95,
        });

        const conceptOutward = conceptPos.clone().sub(subPos).normalize();
        const details = childrenByParent.get(c.id) ?? [];
        const detailOffsets = placeInCone(
          details.length,
          conceptOutward,
          D_DETAIL_FROM_CONCEPT,
          CONE_DETAIL,
        );
        details.forEach((dt, di) => {
          out.set(dt.id, {
            position: conceptPos.clone().add(detailOffsets[di]),
            color: colorForDomain(d.id, 0.22),
            size: 0.55,
          });
        });
      });
    });
  }

  // Orphans go off-screen so they don't pollute the view.
  let orphan = 0;
  for (const n of nodes) {
    if (out.has(n.id)) continue;
    out.set(n.id, {
      position: new THREE.Vector3(0, -1000, 0).add(
        new THREE.Vector3(orphan++ * 0.1, 0, 0),
      ),
      color: new THREE.Color(FALLBACK),
      size: 0,
    });
  }

  return out;
}

export function domainColor(domainId: string): string {
  return DOMAIN_PALETTE[domainId] ?? FALLBACK;
}

export function getClusters(): Cluster[] {
  return CLUSTERS;
}
