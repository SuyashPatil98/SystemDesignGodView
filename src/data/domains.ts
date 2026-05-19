import type { Domain } from './schema';

// All 26 top-level domains. `hue` drives every descendant's color.
// Flagship domains receive deep concept/failure/metric data in turn 1.

export const domains: Domain[] = [
  { id: 'system-design', name: 'System Design', hue: 195, oneLiner: 'Decomposing real-world requirements into components, contracts, and tradeoffs.', flagship: true },
  { id: 'distributed-systems', name: 'Distributed Systems', hue: 215, oneLiner: 'Coordinating computation across unreliable machines and networks.', flagship: true },
  { id: 'backend-eng', name: 'Backend Engineering', hue: 175, oneLiner: 'Building stateful, transactional services that survive load and change.', flagship: false },
  { id: 'databases', name: 'Databases', hue: 30, oneLiner: 'Durable, queryable storage with consistency and performance guarantees.', flagship: true },
  { id: 'caching', name: 'Caching', hue: 50, oneLiner: 'Trading staleness for speed at every layer of a system.', flagship: true },
  { id: 'messaging', name: 'Messaging & Event-Driven', hue: 280, oneLiner: 'Asynchronous coordination via durable queues and event logs.', flagship: true },
  { id: 'api-design', name: 'API Design', hue: 155, oneLiner: 'Contracts that survive teams, versions, and decades.', flagship: false },
  { id: 'devops', name: 'DevOps', hue: 130, oneLiner: 'Closing the loop between writing code and operating it.', flagship: true },
  { id: 'cloud', name: 'Cloud Computing', hue: 200, oneLiner: 'Renting elastic compute, storage, and managed services.', flagship: true },
  { id: 'kubernetes', name: 'Kubernetes & Orchestration', hue: 220, oneLiner: 'Declarative scheduling of containers across machines.', flagship: true },
  { id: 'iac', name: 'Infrastructure as Code', hue: 165, oneLiner: 'Versioned, reviewable, reproducible infrastructure.', flagship: false },
  { id: 'cicd', name: 'CI/CD', hue: 110, oneLiner: 'Continuous, safe paths from commit to production.', flagship: true },
  { id: 'observability', name: 'Observability', hue: 35, oneLiner: 'Logs, metrics, traces — knowing what your system is doing.', flagship: true },
  { id: 'security', name: 'Security & Reliability', hue: 0, oneLiner: 'Withstanding attackers, failures, and your own mistakes.', flagship: false },
  { id: 'data-eng', name: 'Data Engineering', hue: 270, oneLiner: 'Moving and shaping data at scale, reliably.', flagship: true },
  { id: 'dw', name: 'Data Warehousing', hue: 290, oneLiner: 'Modeled, columnar analytics at petabyte scale.', flagship: false },
  { id: 'lakehouse', name: 'Lakes & Lakehouses', hue: 250, oneLiner: 'Open-format storage with warehouse-grade semantics.', flagship: true },
  { id: 'streaming', name: 'Streaming Systems', hue: 305, oneLiner: 'Continuous computation over unbounded data.', flagship: true },
  { id: 'batch', name: 'Batch Processing', hue: 235, oneLiner: 'Large, periodic, throughput-optimized data jobs.', flagship: false },
  { id: 'ml', name: 'Machine Learning', hue: 320, oneLiner: 'Functions learned from data, with metrics and risks.', flagship: true },
  { id: 'dl', name: 'Deep Learning', hue: 335, oneLiner: 'Differentiable computation graphs at scale.', flagship: false },
  { id: 'mlops', name: 'MLOps', hue: 345, oneLiner: 'CI/CD for models and data — reproducibility, deployment, monitoring.', flagship: true },
  { id: 'genai', name: 'GenAI Engineering', hue: 15, oneLiner: 'Building products on top of LLMs and generative models.', flagship: true },
  { id: 'llmops', name: 'LLMOps', hue: 25, oneLiner: 'Serving, evaluating, and governing LLMs in production.', flagship: true },
  { id: 'vector', name: 'Vector DBs & Retrieval', hue: 65, oneLiner: 'Semantic search, ANN indexes, hybrid retrieval.', flagship: true },
  { id: 'prod-ai', name: 'Production AI Systems', hue: 350, oneLiner: 'End-to-end ML/GenAI systems built to survive production.', flagship: true },
];
