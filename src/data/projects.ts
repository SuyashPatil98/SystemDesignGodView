import type { ProjectIdea } from './schema';

export const projects: ProjectIdea[] = [
  {
    id: 'proj-fraud',
    name: 'Real-time fraud detection platform',
    oneLiner:
      'Score every payment under 50ms using streamed features, a low-latency model, and a feedback loop from human reviewers.',
    difficulty: 'expert',
    conceptIds: ['sd-event-arch', 'stream-engines', 'mlops-features', 'mlops-serving', 'pat-hitl', 'metric-inference-latency'],
    components: [
      'Event source (Kafka)',
      'Stream processor (Flink) computing real-time features',
      'Online feature store (Redis/DynamoDB)',
      'Offline feature store (Iceberg/Delta)',
      'Low-latency model serving (gRPC + GPU optional)',
      'Reviewer UI + label collection',
      'Drift + business-metric monitoring',
    ],
    tools: ['Kafka', 'Flink', 'Feast', 'Redis', 'KServe / BentoML', 'MLflow', 'Prometheus / Grafana'],
    resumeValue:
      'Demonstrates streaming features + online inference + human-in-the-loop + drift monitoring in one system — the holy grail of production ML.',
    whyNonGeneric:
      'Forces you to confront training-serving skew, p99 latency under burst, label delay, and feedback-loop bias — all the hard parts.',
    extensions: [
      'Add an LLM agent to explain flagged transactions to reviewers',
      'Multi-region active-active with conflict resolution',
      'Counterfactual evaluation harness',
    ],
    designQuestions: [
      'How do you guarantee train/serve feature parity?',
      'How do you handle slow label arrival (chargebacks weeks later)?',
      'How do you avoid the reviewer-bias feedback loop?',
    ],
  },
  {
    id: 'proj-feature-store',
    name: 'Feature store with streaming ingestion',
    oneLiner:
      'Build a registry, offline+online stores, and pipelines that compute features once and serve them everywhere.',
    difficulty: 'advanced',
    conceptIds: ['mlops-features', 'pat-feature-store-arch', 'stream-engines', 'pat-lakehouse', 'fm-training-serving-skew'],
    components: [
      'Feature registry with schemas and lineage',
      'Streaming pipeline (Flink) for fresh features',
      'Batch pipeline (Spark) for historical features',
      'Online store (Redis / DynamoDB) + offline store (Iceberg/Delta)',
      'Feature server (gRPC) with point-in-time joins',
    ],
    tools: ['Feast', 'Flink', 'Spark', 'Iceberg', 'Redis', 'Prometheus'],
    resumeValue: 'Shows mastery of dual-store consistency, point-in-time correctness, and ML platform design.',
    whyNonGeneric:
      'Point-in-time correctness and streaming/batch parity are real-world hard problems that generic tutorials skip.',
    extensions: ['Multi-tenant with per-team quotas', 'Auto-generated dbt models from feature definitions'],
    designQuestions: [
      'How do you do point-in-time joins correctly?',
      'How do you migrate a feature definition without breaking models?',
    ],
  },
  {
    id: 'proj-rag-eval',
    name: 'RAG system with evaluation and observability',
    oneLiner:
      'Production-grade RAG: hybrid retrieval, reranking, guardrails, evaluation harness, observability of every retrieval+generation.',
    difficulty: 'advanced',
    conceptIds: ['pat-rag', 'vector-engines', 'metric-faithfulness', 'metric-retrieval-precision', 'llm-eval', 'fm-prompt-injection', 'fm-hallucination'],
    components: [
      'Document ingestion + chunking + embedding pipeline',
      'Hybrid index (BM25 + vector) with reranker',
      'Prompt orchestrator with policy LLM',
      'Eval harness (golden questions, RAGAS, LLM-as-judge)',
      'Per-request tracing with prompts, retrieved chunks, scores',
      'Guardrails for prompt injection + PII',
    ],
    tools: ['LlamaIndex / LangChain', 'OpenSearch / Qdrant', 'vLLM / Hugging Face', 'Langfuse / Arize Phoenix', 'OpenTelemetry'],
    resumeValue:
      'Most "RAG demos" are toys. A measured + monitored RAG with evaluation is what production looks like.',
    whyNonGeneric:
      'Includes evaluation and observability — the two parts almost everyone skips and the two parts that decide product trust.',
    extensions: ['Add agent loop with tool use', 'Multi-modal retrieval (PDF tables + figures)'],
    designQuestions: [
      'How do you measure faithfulness without manual labels?',
      'How do you defend against indirect prompt injection from retrieved docs?',
    ],
  },
  {
    id: 'proj-saas-backend',
    name: 'Multi-tenant SaaS backend with rate limiting and billing',
    oneLiner:
      'A backend ready to onboard the 100th customer: per-tenant isolation, rate limiting, usage metering, audit logs.',
    difficulty: 'advanced',
    conceptIds: ['sd-multitenant', 'pat-bulkhead', 'pat-rate-limit', 'be-auth', 'observ-traces'],
    components: [
      'Tenant-aware data model (shared vs siloed)',
      'Per-tenant rate limiter (token bucket in Redis)',
      'Usage metering pipeline (events → warehouse)',
      'Audit log table with append-only + retention',
      'Multi-tenant authn/authz with org+role+resource',
    ],
    tools: ['PostgreSQL', 'Redis', 'OpenTelemetry', 'Stripe (or Lago/Metronome)', 'Kafka for events'],
    resumeValue:
      'Production SaaS backend hygiene that most early companies skip until pain.',
    whyNonGeneric:
      'Multi-tenant isolation, metering correctness, and audit trails are real production needs rarely shown in tutorials.',
    extensions: ['Per-tenant region pinning', 'Self-serve admin console with role inheritance'],
    designQuestions: [
      'How do you isolate a noisy tenant without per-tenant clusters?',
      'How do you ensure metering events are exactly-once for billing?',
    ],
  },
  {
    id: 'proj-model-serving',
    name: 'ML model serving platform with canary deployment',
    oneLiner:
      'Versioned, observable serving plane on Kubernetes with canary, shadow, and automated rollback.',
    difficulty: 'advanced',
    conceptIds: ['pat-model-serving', 'mlops-serving', 'cicd-deploy-strategies', 'mlops-registry', 'observ-traces'],
    components: [
      'Model registry with promotion stages',
      'Inference service (KServe/BentoML) with traffic splitting',
      'Shadow traffic + metric comparison',
      'Automated rollback on metric burn',
      'Per-request feature + prediction logging',
    ],
    tools: ['KServe', 'BentoML', 'MLflow', 'Argo Rollouts', 'Prometheus'],
    resumeValue: 'Real platform-team work: SLOs for models, not just for services.',
    whyNonGeneric: 'Includes shadow traffic, automated rollback, and metric-burn alerts — the operational meat.',
    extensions: ['GPU autoscaling', 'Multi-model routing based on cost/latency'],
    designQuestions: [
      'How do you compare shadow vs primary without burning users?',
      'What metric burn triggers an automated rollback?',
    ],
  },
  {
    id: 'proj-event-analytics',
    name: 'Event-driven analytics platform',
    oneLiner:
      'Capture, enrich, and analyze user/product events with both real-time dashboards and warehouse-scale queries.',
    difficulty: 'intermediate',
    conceptIds: ['sd-event-arch', 'stream-engines', 'pat-medallion', 'pat-kappa-arch', 'metric-consumer-lag'],
    components: [
      'Ingestion API with schema validation',
      'Kafka backbone',
      'Flink jobs for sessionization + real-time dashboards',
      'Sink to Iceberg/Delta tables (bronze/silver/gold)',
      'dbt models for analytics',
    ],
    tools: ['Kafka', 'Flink', 'Iceberg / Delta', 'dbt', 'Snowflake / BigQuery / Trino', 'Grafana'],
    resumeValue: 'A canonical modern data platform — fully operable, schema-enforced, replayable.',
    whyNonGeneric: 'Combines event-time semantics, schema evolution, and dual streaming + warehouse query layers.',
    extensions: ['Sub-second materialized views', 'Per-event privacy redaction'],
    designQuestions: [
      'How do you handle schema evolution at the producer?',
      'How do you reconcile streaming and batch counts?',
    ],
  },
  {
    id: 'proj-k8s-pipeline',
    name: 'Kubernetes-based data pipeline orchestration',
    oneLiner: 'Run Airflow/Argo Workflows on K8s with autoscaled workers, secrets, and per-team isolation.',
    difficulty: 'advanced',
    conceptIds: ['k8s-workloads', 'de-orchestration', 'k8s-autoscaling', 'observ-metrics'],
    components: [
      'Multi-tenant Airflow on K8s with KEDA-driven workers',
      'Secret management via External Secrets Operator',
      'Pod-level resource quotas per team',
      'Observability: structured logs + metrics per DAG run',
    ],
    tools: ['Airflow / Argo Workflows', 'KEDA', 'External Secrets Operator', 'OpenTelemetry'],
    resumeValue: 'Bridges DevOps and Data Engineering — rare combination that platforms teams need.',
    whyNonGeneric: 'Autoscaled workers + isolation + secrets done right; not a single Helm-chart blog post.',
    extensions: ['GPU-aware scheduling for ML jobs', 'Auto-derived lineage to OpenLineage'],
    designQuestions: [
      'How do you isolate failure of one DAG from the rest of the cluster?',
      'How do you give each team a quota without underutilizing the fleet?',
    ],
  },
  {
    id: 'proj-llm-evals',
    name: 'LLM agent evaluation dashboard',
    oneLiner:
      'A harness that runs agent workflows against scenario suites, scores them, and flags regressions across model upgrades.',
    difficulty: 'expert',
    conceptIds: ['pat-agentic', 'llm-eval', 'metric-faithfulness', 'metric-hallucination', 'fm-prompt-injection'],
    components: [
      'Scenario library with grader prompts',
      'Trace recorder for every tool call',
      'Regression diff against last release',
      'Cost/latency dashboard per scenario',
      'Adversarial prompt injection suite',
    ],
    tools: ['Langfuse / Phoenix', 'OpenTelemetry', 'pytest-eval / inspect-eval', 'LLM-as-judge'],
    resumeValue: 'Owning evals is the highest-leverage role on a GenAI team.',
    whyNonGeneric: 'Goes far beyond happy-path demos — includes adversarial scenarios and regression diffs.',
    extensions: ['Multi-judge ensemble to reduce single-LLM judge bias'],
    designQuestions: [
      'How do you make eval scores stable enough to detect a 1% regression?',
      'How do you keep scenarios fresh without overfitting?',
    ],
  },
  {
    id: 'proj-log-system',
    name: 'Distributed log processing system',
    oneLiner: 'High-volume log ingest → parsing → enrichment → indexed query, designed for cost at scale.',
    difficulty: 'advanced',
    conceptIds: ['stream-engines', 'observ-logs', 'sd-storage', 'pat-medallion'],
    components: [
      'Edge log collectors (Vector/Fluent Bit)',
      'Kafka ingestion buffer',
      'Flink/Spark enrichment jobs',
      'Loki / OpenSearch indexes split by signal/cost',
      'Cold storage in object store with retention policies',
    ],
    tools: ['Vector / Fluent Bit', 'Kafka', 'Flink', 'Loki', 'OpenSearch', 'S3'],
    resumeValue: 'Production-grade observability at cost-conscious scale.',
    whyNonGeneric: 'Designs for unit cost per GB, not just for working features.',
    extensions: ['Tiered indexing with auto-promotion on hot queries'],
    designQuestions: [
      'How do you keep log indexes affordable at TB/day?',
      'How do you guarantee no log loss without overpaying for durability?',
    ],
  },
  {
    id: 'proj-lakehouse',
    name: 'End-to-end lakehouse analytics platform',
    oneLiner:
      'Bronze → silver → gold tables on Iceberg/Delta with schema enforcement, tests, lineage, and BI access.',
    difficulty: 'advanced',
    conceptIds: ['pat-lakehouse', 'pat-medallion', 'lake-formats', 'de-transformation', 'metric-data-quality'],
    components: [
      'Ingestion (CDC / batch)',
      'Bronze raw + silver cleaned tables on Iceberg',
      'dbt models producing gold marts',
      'Data tests (great expectations / dbt tests)',
      'BI layer (Trino + dashboards)',
      'Lineage via OpenLineage',
    ],
    tools: ['Iceberg / Delta', 'Spark', 'dbt', 'Trino / Athena', 'OpenLineage'],
    resumeValue: 'A modern data platform end-to-end — open formats, tested transformations, governed.',
    whyNonGeneric: 'Built around open formats and tests, not vendor demos.',
    extensions: ['Materialize Iceberg into a fast tier for hot dashboards', 'Tagging-based access control'],
    designQuestions: [
      'How do you handle small-file compaction without disrupting readers?',
      'How do you enforce contracts between bronze and silver?',
    ],
  },
];
