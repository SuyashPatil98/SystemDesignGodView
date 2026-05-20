// Graph schema for the Tech Galaxy.
//
// A `Node` is the atomic unit of knowledge. It can be a domain, a subdomain,
// a concept, a pattern, a tool, a metric, or a failure mode. Edges describe
// relationships, and overlay entities (LearningPath, Project, Tradeoff)
// reference node ids.

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type Layer =
  | 'conceptual'
  | 'architectural'
  | 'implementation'
  | 'operational'
  | 'optimization';

export type NodeKind =
  | 'domain'
  | 'subdomain'
  | 'concept'
  | 'pattern'
  | 'tool'
  | 'metric'
  | 'failureMode';

export type EdgeKind =
  | 'parent'
  | 'related'
  | 'depends-on'
  | 'implements'
  | 'tradeoff-of'
  | 'fails-as';

export type ResourceKind =
  | 'wikipedia'
  | 'docs'
  | 'paper'
  | 'video'
  | 'blog'
  | 'book'
  | 'github'
  | 'search';

export interface ResourceLink {
  kind: ResourceKind;
  label: string;
  url: string;
}

export interface GNode {
  id: string;
  name: string;
  kind: NodeKind;
  domainId: string; // root domain this node belongs to (= id if kind === 'domain')
  parentId?: string; // hierarchical parent (none for domains)
  level: 0 | 1 | 2 | 3;
  difficulty: Difficulty;
  layer: Layer;
  tags: string[];

  // Content — every concept node should answer most of these.
  shortExplanation: string;
  whyItMatters: string;
  mentalModel?: string;
  problemSolved?: string;
  whereItAppears?: string[];
  useCases?: string[];
  tradeoffs?: string[];
  commonMistakes?: string[];
  failureModes?: string[];
  metricsToMonitor?: string[];
  designQuestions?: string[];
  interviewFraming?: string;
  productionFraming?: string;

  // Cross-links (additional to parent edge).
  relatedIds?: string[];
  toolIds?: string[];

  // Curated external resources — populated by data/resources.ts.
  resources?: ResourceLink[];

  // Visual hints — most are computed in layout, but a node may pin overrides.
  color?: string;
  size?: number;
  interviewRelevance?: 1 | 2 | 3 | 4 | 5;
  productionRelevance?: 1 | 2 | 3 | 4 | 5;
}

export interface GEdge {
  source: string;
  target: string;
  kind: EdgeKind;
  strength?: number; // 0..1 — visual weight
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  nodeIds: string[]; // ordered sequence
  projectIds?: string[];
  prerequisites?: string[]; // node ids
  estimatedWeeks?: number;
}

export interface ProjectIdea {
  id: string;
  name: string;
  oneLiner: string;
  difficulty: Difficulty;
  conceptIds: string[];
  components: string[];
  tools: string[];
  resumeValue: string;
  whyNonGeneric: string;
  extensions: string[];
  designQuestions: string[];
}

export interface TradeoffOption {
  name: string;
  whenToUse: string;
  pros: string[];
  cons: string[];
  failureModes?: string[];
  examples?: string[];
}

export interface Tradeoff {
  id: string;
  name: string;
  axis: string; // e.g. "Consistency vs availability"
  options: TradeoffOption[];
  interviewFraming: string;
  productionFraming: string;
  relatedNodeIds?: string[];
}

export interface Domain {
  id: string;
  name: string;
  hue: number; // 0..360 — drives color across all children
  oneLiner: string;
  flagship?: boolean;
}

export type Mode =
  | 'galaxy'
  | 'learning-path'
  | 'project'
  | 'tradeoff'
  | 'failure-mode'
  | 'metric'
  | 'pattern'
  | 'tool';

export interface Filters {
  domainIds: Set<string>;
  difficulty: Set<Difficulty>;
  layer: Set<Layer>;
  minInterview: number; // 1..5
  minProduction: number; // 1..5
  query: string;
}
