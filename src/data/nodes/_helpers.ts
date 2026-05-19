import type { GNode, Difficulty, Layer } from '../schema';

// Helper to declare a domain node compactly.
export const domainNode = (
  id: string,
  name: string,
  shortExplanation: string,
  whyItMatters: string,
  mentalModel?: string,
): GNode => ({
  id,
  name,
  kind: 'domain',
  domainId: id,
  level: 0,
  difficulty: 'expert',
  layer: 'conceptual',
  tags: ['domain'],
  shortExplanation,
  whyItMatters,
  mentalModel,
  interviewRelevance: 5,
  productionRelevance: 5,
});

// Helper for a subdomain node.
export const subNode = (
  id: string,
  name: string,
  domainId: string,
  shortExplanation: string,
  whyItMatters: string,
  opts: Partial<GNode> = {},
): GNode => ({
  id,
  name,
  kind: 'subdomain',
  domainId,
  parentId: domainId,
  level: 1,
  difficulty: 'advanced',
  layer: 'architectural',
  tags: [],
  shortExplanation,
  whyItMatters,
  interviewRelevance: 4,
  productionRelevance: 4,
  ...opts,
});

// Helper for a concept node.
export const conceptNode = (
  id: string,
  name: string,
  domainId: string,
  parentId: string,
  shortExplanation: string,
  opts: Partial<GNode> & { whyItMatters: string } & { difficulty?: Difficulty; layer?: Layer },
): GNode => ({
  id,
  name,
  kind: 'concept',
  domainId,
  parentId,
  level: 2,
  difficulty: opts.difficulty ?? 'intermediate',
  layer: opts.layer ?? 'architectural',
  tags: [],
  shortExplanation,
  interviewRelevance: 3,
  productionRelevance: 4,
  ...opts,
});
