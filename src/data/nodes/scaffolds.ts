// Scaffolded domain files for the 16 non-flagship domains.
// Each gets a domain node + subdomains referenced elsewhere in the dataset
// + a handful of concepts. Designed to be extended in turn 2 / by the user.

import { domainNode, subNode, conceptNode } from './_helpers';
import type { GNode } from '../schema';

// ──────────────────────────── Backend Engineering ─────────────────────────
const BE = 'backend-eng';
export const backendNodes: GNode[] = [
  domainNode(BE, 'Backend Engineering', 'Stateful, transactional services that survive load and change.', 'The craft of building reliable services — the substrate every other domain rides on.'),
  subNode(BE, 'HTTP & request lifecycle', BE, 'From TCP accept to response send.', 'Foundational; defines latency and observability surfaces.', { id: 'be-http' }),
  subNode(BE, 'Concurrency models', BE, 'Threads, goroutines, async I/O, actors.', 'Picks your scaling ceiling and failure modes.', { id: 'be-concurrency' }),
  subNode(BE, 'Auth & authz', BE, 'Sessions, tokens, RBAC, ABAC.', 'Security boundary of the system.', { id: 'be-auth' }),
  subNode(BE, 'Patterns', BE, 'Domain-driven design, event sourcing, CQRS.', 'The vocabulary of cleanly-shaped services.', { id: 'be-patterns' }),
  conceptNode('be-async-io', 'Async I/O & event loops', BE, 'be-concurrency', 'Non-blocking I/O multiplexed by a small thread pool.', { whyItMatters: 'Enables C10K and beyond on commodity hardware.', tradeoffs: ['Easier deadlocks; harder stack traces; CPU-bound tasks block the loop.'] }),
  conceptNode('be-timeouts', 'Timeouts & deadlines', BE, 'be-concurrency', 'Every outbound call must have a timeout; deadlines should propagate.', { whyItMatters: 'No timeouts = thread pool exhaustion + cascade.', relatedIds: ['fm-thread-pool'] }),
  conceptNode('be-oauth', 'OAuth & OIDC', BE, 'be-auth', 'Delegated authorization and identity layered on it.', { whyItMatters: 'Standard for any system with third-party integrations.' }),
];

// ──────────────────────────── API Design ─────────────────────────
const API = 'api-design';
export const apiNodes: GNode[] = [
  domainNode(API, 'API Design', 'Contracts that survive teams, versions, and decades.', 'APIs are products with users; design them like products.'),
  subNode(API, 'Architecture', API, 'REST, GraphQL, gRPC, webhooks.', 'Picking the right paradigm per consumer.', { id: 'api-arch' }),
  subNode(API, 'Versioning', API, 'URL, header, content-type strategies.', 'Wrong versioning blocks evolution forever.', { id: 'api-versioning' }),
  subNode(API, 'Pagination & filtering', API, 'Offset, cursor, keyset.', 'Performance and correctness for list endpoints.', { id: 'api-pagination' }),
  conceptNode('api-rest', 'REST conventions', API, 'api-arch', 'Resource-oriented HTTP with cacheable verbs.', { whyItMatters: 'Universal tooling; the lingua franca of public APIs.' }),
  conceptNode('api-graphql', 'GraphQL', API, 'api-arch', 'Client picks fields; single endpoint.', { whyItMatters: 'Reduces over/under-fetching for product UIs.' }),
  conceptNode('api-grpc', 'gRPC', API, 'api-arch', 'Binary protobuf over HTTP/2.', { whyItMatters: 'Internal high-perf service-to-service standard.' }),
  conceptNode('api-cursor', 'Cursor pagination', API, 'api-pagination', 'Token-based stable pagination across mutations.', { whyItMatters: 'Avoids the duplication and skip bugs of offset.' }),
];

// ──────────────────────────── DevOps ─────────────────────────
const DO = 'devops';
export const devopsNodes: GNode[] = [
  domainNode(DO, 'DevOps', 'Closing the loop between writing code and operating it.', 'Decides how fast and how safely teams ship.'),
  subNode(DO, 'Containers', DO, 'Standardized application packaging.', 'The unit of deployment for modern systems.', { id: 'devops-containers' }),
  subNode(DO, 'Release engineering', DO, 'Promotion, rollback, feature flags.', 'How big-bang releases stop being big-bang.', { id: 'devops-release' }),
  subNode(DO, 'Incident response', DO, 'Oncall, paging, runbooks, postmortems.', 'How teams convert outages into learning.', { id: 'devops-incident' }),
  conceptNode('devops-feature-flags', 'Feature flags', DO, 'devops-release', 'Decouple deploy from release.', { whyItMatters: 'Lets you ship dark, ramp, and instantly disable bad changes.' }),
  conceptNode('devops-postmortem', 'Blameless postmortems', DO, 'devops-incident', 'Process to extract learning without blame.', { whyItMatters: 'Teams that blame don\'t learn.' }),
];

// ──────────────────────────── Cloud ─────────────────────────
const CL = 'cloud';
export const cloudNodes: GNode[] = [
  domainNode(CL, 'Cloud Computing', 'Renting elastic compute, storage, and managed services.', 'The substrate; you optimize for cost, blast radius, and lock-in.'),
  subNode(CL, 'Providers', CL, 'AWS, Azure, GCP — strengths and lock-in.', 'Picks the menu; rarely fully reversible.', { id: 'cloud-providers' }),
  subNode(CL, 'Compute types', CL, 'VMs, containers, serverless, GPU.', 'Match workload shape to compute primitive.', { id: 'cloud-compute' }),
  subNode(CL, 'Networking', CL, 'VPCs, subnets, gateways, peering.', 'Where the most expensive surprises live.', { id: 'cloud-network' }),
  subNode(CL, 'Cost', CL, 'FinOps, savings plans, egress traps.', 'Cost is a non-functional requirement.', { id: 'cloud-cost' }),
  subNode(CL, 'Serverless', CL, 'Lambda, Cloud Run, etc.', 'Pay-per-request scale-to-zero compute.', { id: 'cloud-serverless' }),
  conceptNode('cloud-egress', 'Egress costs', CL, 'cloud-cost', 'Cross-AZ and cross-region transfers cost real money.', { whyItMatters: 'Many "cloud bill explosions" are egress.', failureModes: ['Cross-AZ traffic in tight loops; multi-region data joins.'] }),
  conceptNode('cloud-multi-az', 'Multi-AZ deployments', CL, 'cloud-network', 'Spread workload across availability zones for fault isolation.', { whyItMatters: 'The minimum bar for any production system.' }),
];

// ──────────────────────────── Kubernetes ─────────────────────────
const K8 = 'kubernetes';
export const kubernetesNodes: GNode[] = [
  domainNode(K8, 'Kubernetes & Orchestration', 'Declarative scheduling of containers across machines.', 'The control plane abstraction every cloud now mimics.'),
  subNode(K8, 'Workloads', K8, 'Pods, Deployments, StatefulSets, DaemonSets, Jobs.', 'Match shape to workload type.', { id: 'k8s-workloads' }),
  subNode(K8, 'Networking', K8, 'Services, Ingress, CNI, NetworkPolicy.', 'The most subtle source of production bugs.', { id: 'k8s-networking' }),
  subNode(K8, 'Autoscaling', K8, 'HPA, VPA, KEDA, Cluster Autoscaler.', 'Right capacity at right cost.', { id: 'k8s-autoscaling' }),
  subNode(K8, 'Packaging', K8, 'Helm, Kustomize.', 'Templated environment-specific manifests.', { id: 'k8s-packaging' }),
  subNode(K8, 'Patterns', K8, 'Sidecar, operator, ambassador.', 'Composition primitives.', { id: 'k8s-patterns' }),
  conceptNode('k8s-statefulset', 'StatefulSets', K8, 'k8s-workloads', 'Stable identity and storage for stateful workloads.', { whyItMatters: 'Databases on K8s only work when StatefulSets are configured correctly.' }),
  conceptNode('k8s-hpa', 'Horizontal Pod Autoscaler', K8, 'k8s-autoscaling', 'Scale replicas on metrics.', { whyItMatters: 'Default autoscaling primitive; combine with KEDA for queue depth.' }),
  conceptNode('k8s-operator', 'Operator pattern', K8, 'k8s-patterns', 'Custom controllers that encode operational knowledge.', { whyItMatters: 'How complex stateful systems live on K8s.' }),
];

// ──────────────────────────── IaC ─────────────────────────
const IAC = 'iac';
export const iacNodes: GNode[] = [
  domainNode(IAC, 'Infrastructure as Code', 'Versioned, reviewable, reproducible infra.', 'The only sustainable way to scale infra past one engineer.'),
  subNode(IAC, 'Declarative IaC', IAC, 'Terraform, OpenTofu, Pulumi, CDK.', 'Describe the desired state; reconcile.', { id: 'iac-declarative' }),
  conceptNode('iac-state', 'State management', IAC, 'iac-declarative', 'Where the source of truth of resources lives.', { whyItMatters: 'Bad state handling causes the worst infra outages.', failureModes: ['State drift; concurrent applies; lost state file.'] }),
  conceptNode('iac-modules', 'Modules & reuse', IAC, 'iac-declarative', 'Encapsulate reusable infra patterns with inputs and outputs.', { whyItMatters: 'Stops the copy-paste IaC catastrophe.' }),
];

// ──────────────────────────── CI/CD ─────────────────────────
const CD = 'cicd';
export const cicdNodes: GNode[] = [
  domainNode(CD, 'CI/CD', 'Continuous, safe paths from commit to production.', 'Decides shipping cadence and risk profile.'),
  subNode(CD, 'Pipelines', CD, 'Build → test → security → deploy stages.', 'The reliable rails for changes.', { id: 'cicd-pipelines' }),
  subNode(CD, 'Deploy strategies', CD, 'Blue/green, canary, shadow, rolling.', 'Reduces blast radius of bad changes.', { id: 'cicd-deploy-strategies' }),
  subNode(CD, 'GitOps', CD, 'Declarative cluster state from git.', 'Audit and rollback by design.', { id: 'cicd-gitops' }),
  conceptNode('cicd-canary', 'Canary deploys', CD, 'cicd-deploy-strategies', 'Route a small % of traffic to the new version, then ramp.', { whyItMatters: 'Catches regressions before they affect all users.' }),
  conceptNode('cicd-bluegreen', 'Blue/green', CD, 'cicd-deploy-strategies', 'Two parallel environments; switch traffic atomically.', { whyItMatters: 'Instant rollback; double infra cost during transition.' }),
];

// ──────────────────────────── Security & Reliability ─────────────────────────
const SEC = 'security';
export const securityNodes: GNode[] = [
  domainNode(SEC, 'Security & Reliability', 'Withstanding attackers, failures, and your own mistakes.', 'Becomes mandatory at exactly the moment it\'s too late to add later.'),
  subNode(SEC, 'AuthN/AuthZ', SEC, 'Identity, sessions, tokens, RBAC.', 'Who you are vs what you can do.', { id: 'sec-authn-authz' }),
  subNode(SEC, 'Secrets', SEC, 'KMS, Vault, rotation, scoping.', 'The unglamorous foundation of trust.', { id: 'sec-secrets' }),
  subNode(SEC, 'Network security', SEC, 'mTLS, WAFs, segmentation.', 'Where lateral movement is stopped.', { id: 'sec-network' }),
  subNode(SEC, 'Supply chain', SEC, 'SBOMs, signed builds, dependency scanning.', 'New surface that\'s been weaponized.', { id: 'sec-supply' }),
  conceptNode('sec-mtls', 'mTLS', SEC, 'sec-network', 'Mutual TLS between services.', { whyItMatters: 'Default service-to-service trust in zero-trust networks.' }),
  conceptNode('sec-zero-trust', 'Zero trust', SEC, 'sec-network', 'Trust nothing inside the network by default; verify every request.', { whyItMatters: 'Modern enterprise security baseline.' }),
];

// ──────────────────────────── Data Engineering ─────────────────────────
const DE = 'data-eng';
export const dataEngNodes: GNode[] = [
  domainNode(DE, 'Data Engineering', 'Moving and shaping data at scale, reliably.', 'The plumbing every analytics and ML system depends on.'),
  subNode(DE, 'Ingestion', DE, 'Batch + CDC + streaming ingestion patterns.', 'Where data quality is won or lost.', { id: 'de-ingestion' }),
  subNode(DE, 'Orchestration', DE, 'Airflow, Argo Workflows, Dagster, Prefect.', 'How pipelines run on time and recover.', { id: 'de-orchestration' }),
  subNode(DE, 'Transformation', DE, 'dbt, Spark, SQL — modeling data into curated tables.', 'The shape of analytics.', { id: 'de-transformation' }),
  subNode(DE, 'Quality', DE, 'Tests, contracts, freshness, lineage.', 'Without it, all downstream is suspect.', { id: 'de-quality' }),
  subNode(DE, 'Patterns', DE, 'Lambda, Kappa, medallion, CDC.', 'Reusable shapes for data pipelines.', { id: 'de-patterns' }),
  conceptNode('de-contracts', 'Data contracts', DE, 'de-quality', 'Producer-enforced schemas + SLAs for downstream consumers.', { whyItMatters: 'Stops upstream from silently breaking downstream.', relatedIds: ['fm-schema-drift', 'msg-schema-registry'] }),
  conceptNode('de-medallion', 'Medallion (bronze/silver/gold)', DE, 'de-transformation', 'Layered tables with increasing quality and curation.', { whyItMatters: 'Provides consistent quality boundaries.', relatedIds: ['pat-medallion'] }),
];

// ──────────────────────────── Data Warehousing ─────────────────────────
const DW = 'dw';
export const dwNodes: GNode[] = [
  domainNode(DW, 'Data Warehousing', 'Modeled, columnar analytics at petabyte scale.', 'Where analytics workloads belong.'),
  subNode(DW, 'Warehouse engines', DW, 'Snowflake, BigQuery, Redshift.', 'Different cost and performance shapes.', { id: 'dw-engines' }),
  conceptNode('dw-star-schema', 'Star schema', DW, 'dw-engines', 'Fact tables surrounded by dimensions.', { whyItMatters: 'The workhorse data model for BI.' }),
  conceptNode('dw-columnar', 'Columnar storage', DW, 'dw-engines', 'Store by column for compression and analytic scan speed.', { whyItMatters: 'Why analytics is fast on warehouses but slow on RDBMS.' }),
];

// ──────────────────────────── Lakes & Lakehouses ─────────────────────────
const LH = 'lakehouse';
export const lakehouseNodes: GNode[] = [
  domainNode(LH, 'Lakes & Lakehouses', 'Open-format storage with warehouse-grade semantics.', 'The cost-effective platform for BI + ML on the same data.'),
  subNode(LH, 'Table formats', LH, 'Delta, Iceberg, Hudi.', 'The open standard for lakehouse semantics.', { id: 'lake-formats' }),
  subNode(LH, 'Architecture', LH, 'Medallion, lakehouse patterns.', 'Layered quality boundaries.', { id: 'lake-patterns' }),
  subNode(LH, 'Lakehouse platforms', LH, 'Managed platforms like Databricks.', 'The vendor surface.', { id: 'lakehouse-platforms' }),
  conceptNode('lake-time-travel', 'Time travel', LH, 'lake-formats', 'Query a table as of a past snapshot.', { whyItMatters: 'Debugging, audits, accidental-deletion recovery.' }),
  conceptNode('lake-compaction', 'Compaction & small files', LH, 'lake-formats', 'Streaming writes create many small files; compact to fewer larger files.', { whyItMatters: 'Without compaction, query performance degrades over time.' }),
];

// ──────────────────────────── Batch Processing ─────────────────────────
const BT = 'batch';
export const batchNodes: GNode[] = [
  domainNode(BT, 'Batch Processing', 'Large, periodic, throughput-optimized data jobs.', 'Where most data still lives — and probably always will.'),
  subNode(BT, 'Engines', BT, 'Spark, Beam, dbt.', 'The workhorses of analytics and ML training data.', { id: 'batch-engines' }),
  subNode(BT, 'Patterns', BT, 'Idempotency, backfills, partitioning.', 'How batch survives reruns.', { id: 'batch-patterns' }),
  conceptNode('batch-idempotent', 'Idempotent jobs', BT, 'batch-patterns', 'Re-running a job produces the same result.', { whyItMatters: 'Required to safely retry, backfill, and recover.' }),
  conceptNode('batch-backfill', 'Backfills', BT, 'batch-patterns', 'Re-running historical partitions with new logic.', { whyItMatters: 'Cleanly bounded historical reprocessing.' }),
];

// ──────────────────────────── Machine Learning ─────────────────────────
const ML = 'ml';
export const mlNodes: GNode[] = [
  domainNode(ML, 'Machine Learning', 'Functions learned from data, with metrics and risks.', 'The substrate of modern AI products.'),
  subNode(ML, 'Modeling', ML, 'Linear, trees, ensembles, neural.', 'Pick model class to match data and constraints.', { id: 'ml-modeling' }),
  subNode(ML, 'Evaluation', ML, 'Metrics, holdouts, leakage, calibration.', 'The integrity of your work.', { id: 'ml-eval' }),
  subNode(ML, 'Distributed training', ML, 'Data and model parallelism.', 'For models that don\'t fit on one machine.', { id: 'ml-distributed' }),
  conceptNode('ml-class-imbalance', 'Class imbalance', ML, 'ml-eval', 'Skewed class distributions distort metrics.', { whyItMatters: 'Accuracy is meaningless when 99% of data is one class.', relatedIds: ['metric-precision', 'metric-recall'] }),
  conceptNode('ml-calibration', 'Calibration', ML, 'ml-eval', 'Predicted probabilities should match observed frequencies.', { whyItMatters: 'Decisions that use thresholds depend on calibrated probabilities.' }),
];

// ──────────────────────────── Deep Learning ─────────────────────────
const DL = 'dl';
export const dlNodes: GNode[] = [
  domainNode(DL, 'Deep Learning', 'Differentiable computation graphs at scale.', 'The engine of vision, language, and multimodal AI.'),
  subNode(DL, 'Architectures', DL, 'Transformers, CNNs, RNNs, diffusion.', 'Different inductive biases, different domains.', { id: 'dl-archs' }),
  subNode(DL, 'Training', DL, 'Optimizers, schedules, distributed strategies.', 'Compute-intensive engineering.', { id: 'dl-training' }),
  conceptNode('dl-transformer', 'Transformer', DL, 'dl-archs', 'Attention-only sequence model that scales spectacularly.', { whyItMatters: 'The architecture behind LLMs and a lot more.' }),
  conceptNode('dl-mixed-precision', 'Mixed precision training', DL, 'dl-training', 'Use FP16/BF16 for most ops; FP32 for accumulators.', { whyItMatters: 'Doubles or quadruples training throughput on modern GPUs.' }),
];

// ──────────────────────────── Production AI Systems ─────────────────────────
const PAI = 'prod-ai';
export const prodAiNodes: GNode[] = [
  domainNode(PAI, 'Production AI Systems', 'End-to-end ML/GenAI systems built to survive production.', 'Where models become products. The integration discipline.'),
  subNode(PAI, 'Architecture', PAI, 'Pipelines + features + serving + observability + feedback.', 'The full picture.', { id: 'pai-arch' }),
  subNode(PAI, 'HITL', PAI, 'Human-in-the-loop review and label collection.', 'Bridges model quality and product trust.', { id: 'pai-hitl' }),
  subNode(PAI, 'Feedback loops', PAI, 'Convert user signals into labels and retraining triggers.', 'How systems get better over time without manual heroics.', { id: 'pai-feedback' }),
  conceptNode('pai-shadow-prod', 'Shadow production', PAI, 'pai-arch', 'New models receive mirrored traffic without affecting users.', { whyItMatters: 'Surfaces production-only failure modes safely.' }),
  conceptNode('pai-label-feedback', 'Label feedback loops', PAI, 'pai-feedback', 'Convert user clicks/edits/thumbs into labels.', { whyItMatters: 'Almost-free supervision; watch for feedback-loop bias.' }),
];
