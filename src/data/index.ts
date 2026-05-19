// Single aggregation point for the dataset.
//
// Combines:
//  - 26 domain nodes
//  - flagship domain trees (deep nodes)
//  - scaffolded domain trees (shallow nodes)
//  - cross-domain tool/metric/pattern/failure nodes
//  - cross edges (parent edges derived from parentId)
//
// The exported `graph` is what the renderer consumes.

import type { GNode, GEdge } from './schema';
import { domains } from './domains';

// Flagship domain node files.
import { systemDesignNodes } from './nodes/systemDesign';
import { distributedSystemsNodes } from './nodes/distributedSystems';
import { databasesNodes } from './nodes/databases';
import { cachingNodes } from './nodes/caching';
import { messagingNodes } from './nodes/messaging';
import { mlopsNodes } from './nodes/mlops';
import { genaiNodes } from './nodes/genai';
import { llmopsNodes } from './nodes/llmops';
import { vectorNodes } from './nodes/vectorRetrieval';
import { streamingNodes } from './nodes/streaming';
import { observabilityNodes } from './nodes/observability';

// Scaffolded domain nodes.
import {
  backendNodes,
  apiNodes,
  devopsNodes,
  cloudNodes,
  kubernetesNodes,
  iacNodes,
  cicdNodes,
  securityNodes,
  dataEngNodes,
  dwNodes,
  lakehouseNodes,
  batchNodes,
  mlNodes,
  dlNodes,
  prodAiNodes,
} from './nodes/scaffolds';

// Cross-cutting collections.
import { tools } from './tools';
import { metrics } from './metrics';
import { patterns } from './patterns';
import { failureModes } from './failureModes';

import { crossEdges } from './edges';

// Overlay data (paths/projects/tradeoffs).
import { learningPaths } from './learningPaths';
import { projects } from './projects';
import { tradeoffs } from './tradeoffs';

function collectNodes(): GNode[] {
  return [
    ...systemDesignNodes,
    ...distributedSystemsNodes,
    ...databasesNodes,
    ...cachingNodes,
    ...messagingNodes,
    ...mlopsNodes,
    ...genaiNodes,
    ...llmopsNodes,
    ...vectorNodes,
    ...streamingNodes,
    ...observabilityNodes,
    // scaffolded
    ...backendNodes,
    ...apiNodes,
    ...devopsNodes,
    ...cloudNodes,
    ...kubernetesNodes,
    ...iacNodes,
    ...cicdNodes,
    ...securityNodes,
    ...dataEngNodes,
    ...dwNodes,
    ...lakehouseNodes,
    ...batchNodes,
    ...mlNodes,
    ...dlNodes,
    ...prodAiNodes,
    // cross-cutting
    ...tools,
    ...metrics,
    ...patterns,
    ...failureModes,
  ];
}

function dedupeNodes(nodes: GNode[]): GNode[] {
  const seen = new Map<string, GNode>();
  for (const n of nodes) {
    if (!seen.has(n.id)) seen.set(n.id, n);
  }
  return Array.from(seen.values());
}

function deriveParentEdges(nodes: GNode[]): GEdge[] {
  const ids = new Set(nodes.map((n) => n.id));
  const edges: GEdge[] = [];
  for (const n of nodes) {
    if (!n.parentId) continue;
    if (!ids.has(n.parentId)) continue;
    edges.push({ source: n.id, target: n.parentId, kind: 'parent', strength: 0.2 });
  }
  return edges;
}

function deriveRelatedEdges(nodes: GNode[]): GEdge[] {
  const ids = new Set(nodes.map((n) => n.id));
  const edges: GEdge[] = [];
  for (const n of nodes) {
    if (!n.relatedIds) continue;
    for (const rid of n.relatedIds) {
      if (!ids.has(rid)) continue;
      edges.push({ source: n.id, target: rid, kind: 'related', strength: 0.55 });
    }
  }
  return edges;
}

function filterValidEdges(nodes: GNode[], edges: GEdge[]): GEdge[] {
  const ids = new Set(nodes.map((n) => n.id));
  return edges.filter((e) => ids.has(e.source) && ids.has(e.target));
}

const allNodes = dedupeNodes(collectNodes());
const allEdges = [
  ...deriveParentEdges(allNodes),
  ...deriveRelatedEdges(allNodes),
  ...filterValidEdges(allNodes, crossEdges),
];

export const graph = {
  domains,
  nodes: allNodes,
  edges: allEdges,
  learningPaths,
  projects,
  tradeoffs,
};

export type Graph = typeof graph;

// Convenience indexes used by the renderer.
export const nodeById = new Map<string, GNode>(allNodes.map((n) => [n.id, n]));
export const domainById = new Map(domains.map((d) => [d.id, d]));

export const failureModeNodes = allNodes.filter((n) => n.kind === 'failureMode');
export const metricNodes = allNodes.filter((n) => n.kind === 'metric');
export const patternNodes = allNodes.filter((n) => n.kind === 'pattern');
export const toolNodes = allNodes.filter((n) => n.kind === 'tool');
