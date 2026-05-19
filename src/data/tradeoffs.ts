import type { Tradeoff } from './schema';

export const tradeoffs: Tradeoff[] = [
  {
    id: 'to-sql-nosql',
    name: 'SQL vs NoSQL',
    axis: 'Schema flexibility & query power vs scale & access-pattern fit',
    interviewFraming:
      'Start from workload, not preference. Ask: access patterns, consistency needs, joins, scale, team familiarity. Default to SQL unless you can name a concrete reason it loses.',
    productionFraming:
      'In practice most teams need both. Use a relational store for the source of truth and a specialized store (KV, document, search, time-series) for high-throughput or special-shape needs.',
    options: [
      {
        name: 'SQL (PostgreSQL, MySQL)',
        whenToUse: 'Transactional integrity, joins, ad-hoc queries, evolving schemas.',
        pros: ['ACID by default', 'Rich joins and aggregations', 'Mature tooling, backups, replication'],
        cons: ['Scaling writes requires effort (sharding)', 'Schema migrations need care'],
        examples: ['Stripe-style ledgers', 'Most SaaS apps'],
      },
      {
        name: 'NoSQL (Mongo, Dynamo, Cassandra)',
        whenToUse: 'Specific high-scale access patterns; flexible/evolving shapes; multi-region writes.',
        pros: ['Horizontal scale baked in', 'Single-digit ms latency at scale', 'Schema flexibility'],
        cons: ['Joins are anti-patterns', 'Forces access-pattern-first modeling', 'Cross-doc transactions limited'],
        examples: ['Shopping cart sessions', 'IoT telemetry', 'Time-series workloads'],
      },
    ],
  },
  {
    id: 'to-batch-stream',
    name: 'Batch vs Streaming',
    axis: 'Latency vs simplicity & cost',
    interviewFraming:
      'Decide based on freshness SLO and aggregation correctness needs. State that streaming is for seconds-to-minutes; batch is fine for hours-to-days.',
    productionFraming:
      'Most companies actually need both — streaming for fresh views, batch for backfills, joins, and corrections.',
    options: [
      {
        name: 'Batch',
        whenToUse: 'Hourly/daily aggregates, complex joins, corrections allowed.',
        pros: ['Operationally simple', 'Cheap per record', 'Easy to reason about correctness'],
        cons: ['Stale data', 'Late-arriving records are awkward'],
        examples: ['Nightly dbt models', 'Financial close', 'ML training datasets'],
      },
      {
        name: 'Streaming',
        whenToUse: 'Sub-minute freshness, alerting, dynamic personalization, fraud.',
        pros: ['Fresh data', 'Event-time semantics with Flink', 'Reactive systems'],
        cons: ['Stateful infra to operate', 'Backfills and reprocessing are harder', 'Costlier per record'],
        examples: ['Fraud detection', 'Live leaderboards', 'Real-time features for ML'],
      },
    ],
  },
  {
    id: 'to-mono-micro',
    name: 'Monolith vs Microservices',
    axis: 'Org speed and ops cost',
    interviewFraming:
      'Not a tech question — it\'s an org question. State: choose microservices when team coupling on deploys is the bottleneck.',
    productionFraming:
      'Most successful companies started as a modular monolith and extracted services as bottlenecks emerged. Premature microservices is a leading cause of slowdown.',
    options: [
      {
        name: 'Monolith / modular monolith',
        whenToUse: 'Small-medium team, evolving domain, few independent scaling needs.',
        pros: ['Atomic deploys', 'Simple ops', 'Refactor across modules easily'],
        cons: ['Big-bang releases', 'Coupling between teams as it grows'],
        examples: ['Shopify (famously)', 'Most early-stage startups'],
      },
      {
        name: 'Microservices',
        whenToUse: 'Many teams, very different scaling needs, polyglot tech.',
        pros: ['Independent deploys', 'Independent scaling', 'Team autonomy'],
        cons: ['Distributed-system tax', 'Schema/version coordination', 'Higher ops cost'],
        examples: ['Netflix', 'Uber'],
      },
    ],
  },
  {
    id: 'to-rest-graphql-grpc',
    name: 'REST vs GraphQL vs gRPC',
    axis: 'Client flexibility vs strictness vs perf',
    interviewFraming:
      'Pick based on consumer profile. REST for external/public, GraphQL for many-client UIs, gRPC for internal high-perf service-to-service.',
    productionFraming:
      'Most companies use REST externally, gRPC internally, GraphQL at the BFF layer for product surfaces.',
    options: [
      {
        name: 'REST',
        whenToUse: 'Public APIs, browser clients, integrations.',
        pros: ['Universal tooling', 'Cacheable via HTTP', 'Easiest to operate'],
        cons: ['Over/under-fetching for complex UIs', 'Versioning ceremony'],
        examples: ['Stripe', 'GitHub'],
      },
      {
        name: 'GraphQL',
        whenToUse: 'Product UIs with diverse views needing one API surface.',
        pros: ['Client picks fields', 'Single endpoint', 'Strong typing'],
        cons: ['N+1 risks', 'Caching is harder', 'Server complexity'],
        examples: ['Shopify Storefront', 'GitHub v4'],
      },
      {
        name: 'gRPC',
        whenToUse: 'Internal service-to-service, polyglot, perf-critical.',
        pros: ['Binary protobuf', 'Streaming', 'Codegen across languages'],
        cons: ['Browser support requires gRPC-Web', 'Less human-friendly'],
        examples: ['Google internals', 'Kubernetes APIs'],
      },
    ],
  },
  {
    id: 'to-kafka-rabbit-pulsar',
    name: 'Kafka vs RabbitMQ vs Pulsar',
    axis: 'Log semantics vs queue semantics vs multi-tenant geo',
    interviewFraming:
      'Different models. Kafka is a log (replay, ordering per partition). Rabbit is a queue (per-message acks, complex routing). Pulsar combines both with tiered storage.',
    productionFraming:
      'Kafka is the default for event backbones. Rabbit shines for task queues. Pulsar for multi-tenant geo-replicated platforms.',
    options: [
      {
        name: 'Kafka',
        whenToUse: 'Event backbone, replay, exactly-once with state.',
        pros: ['High throughput', 'Replayable log', 'Strong ecosystem'],
        cons: ['Per-partition ordering only', 'Operational complexity'],
        examples: ['Most event-driven architectures'],
      },
      {
        name: 'RabbitMQ',
        whenToUse: 'Task queues with rich routing; per-message acks.',
        pros: ['Flexible routing', 'Simple semantics', 'Mature'],
        cons: ['Not designed for big replay', 'Less suitable for analytics'],
        examples: ['Background job queues', 'Notifications'],
      },
      {
        name: 'Pulsar',
        whenToUse: 'Multi-tenant, geo-replicated event platforms with tiered storage.',
        pros: ['Unified queue+log', 'Built-in geo-replication', 'Tiered storage to S3'],
        cons: ['Smaller ecosystem', 'Operational learning curve'],
        examples: ['Yahoo Japan', 'Verizon Media'],
      },
    ],
  },
  {
    id: 'to-k8s-serverless',
    name: 'Kubernetes vs Serverless',
    axis: 'Control vs operational simplicity',
    interviewFraming:
      'Frame around team capability and traffic shape. Serverless wins for spiky, low-baseline. K8s wins for steady, high baseline with custom runtime needs.',
    productionFraming:
      'Most platforms blend: K8s for steady microservices, Lambda/Cloud Run for spiky workloads and glue, managed everything where you can.',
    options: [
      {
        name: 'Kubernetes',
        whenToUse: 'Steady workload, GPU/custom runtimes, multi-cloud, control needed.',
        pros: ['Full control of runtime', 'Mature ecosystem', 'Portable across clouds'],
        cons: ['Ops cost', 'Complexity', 'Requires platform team'],
        examples: ['Most large enterprises', 'ML training fleets'],
      },
      {
        name: 'Serverless',
        whenToUse: 'Spiky, event-driven workloads; low ops budget.',
        pros: ['No servers to manage', 'Pay per request', 'Auto-scaling to zero'],
        cons: ['Cold starts', 'Vendor lock-in', 'Concurrency limits'],
        examples: ['Glue and event handlers', 'Internal tools', 'Webhooks'],
      },
    ],
  },
  {
    id: 'to-dw-lake-lakehouse',
    name: 'Warehouse vs Lake vs Lakehouse',
    axis: 'Performance/cost vs flexibility',
    interviewFraming:
      'Warehouse for fast analytics on modeled data. Lake for cheap raw storage. Lakehouse to bridge: warehouse semantics on lake economics with open formats.',
    productionFraming:
      'Modern stacks consolidate on lakehouse for cost, with a warehouse-backed semantic layer where needed.',
    options: [
      {
        name: 'Data warehouse',
        whenToUse: 'Performance-critical analytics on curated data.',
        pros: ['Fast SQL', 'Mature governance', 'Predictable cost on Snowflake/BQ'],
        cons: ['Storage costs higher than object', 'Closed formats'],
        examples: ['BigQuery', 'Snowflake'],
      },
      {
        name: 'Data lake',
        whenToUse: 'Cheap, raw storage; schema-on-read; ML feature staging.',
        pros: ['Cheap object storage', 'Any format', 'Decoupled compute'],
        cons: ['No transactions', 'Schema drift', 'Slow queries on raw files'],
        examples: ['S3 + Athena legacy patterns'],
      },
      {
        name: 'Lakehouse',
        whenToUse: 'One platform for BI + ML at lake cost.',
        pros: ['ACID on object storage', 'Schema evolution', 'Time travel'],
        cons: ['Operational discipline (compaction, vacuum)', 'Emerging tooling gaps'],
        examples: ['Databricks + Delta', 'Iceberg-based stacks'],
      },
    ],
  },
  {
    id: 'to-etl-elt',
    name: 'ETL vs ELT',
    axis: 'When transformation happens',
    interviewFraming:
      'ELT became default with cheap warehouse compute — push raw data first, transform inside the warehouse. ETL still common for heavy/proprietary transformations.',
    productionFraming:
      'ELT with dbt on top of Snowflake/BQ/lakehouse is the modern default. Use ETL for sensitive PII, format conversion, or pre-aggregation.',
    options: [
      {
        name: 'ETL',
        whenToUse: 'PII redaction, heavy reshape, legacy systems, strict governance.',
        pros: ['Less raw data persisted', 'Pre-cleaned downstream'],
        cons: ['Tightly coupled pipelines', 'Hard to redo transformations'],
        examples: ['Talend, Informatica pipelines'],
      },
      {
        name: 'ELT',
        whenToUse: 'Modern warehouse/lakehouse stacks with dbt.',
        pros: ['Replayable transformations', 'Schema-on-write later', 'Cheap warehouse compute'],
        cons: ['Stores raw PII unless careful', 'Cost can balloon if undisciplined'],
        examples: ['Fivetran + Snowflake + dbt'],
      },
    ],
  },
  {
    id: 'to-feature-store',
    name: 'Feature store vs direct feature pipelines',
    axis: 'Reuse and consistency vs simplicity',
    interviewFraming:
      'Pitch the feature store when multiple models share features or when train/serve skew is a real risk. Don\'t over-engineer for a single model.',
    productionFraming:
      'Feature store earns its weight when you have 5+ models and an online serving path. Below that, direct pipelines + good tests are enough.',
    options: [
      {
        name: 'Feature store',
        whenToUse: 'Multi-model platforms, online inference, regulated.',
        pros: ['One transformation, two stores', 'Reuse', 'Skew protection'],
        cons: ['Operational cost', 'Latency on online store'],
        examples: ['Uber Michelangelo', 'Feast deployments'],
      },
      {
        name: 'Direct pipelines',
        whenToUse: 'Single model, small team, batch inference.',
        pros: ['Faster to ship', 'Fewer moving parts'],
        cons: ['Skew risk', 'No reuse'],
      },
    ],
  },
  {
    id: 'to-online-batch-infer',
    name: 'Online vs batch inference',
    axis: 'Latency vs cost and complexity',
    interviewFraming:
      'Batch when the consumer can tolerate hour+ latency; online for interactive use cases. Many problems are batch in disguise.',
    productionFraming:
      'Batch precomputed predictions cached in KV or warehouse are dramatically cheaper than online inference; reach for them first.',
    options: [
      {
        name: 'Batch',
        whenToUse: 'Recommendations, ranking, scoring lists.',
        pros: ['Cheap', 'Simple', 'Easy to monitor'],
        cons: ['Stale for fast-changing inputs'],
      },
      {
        name: 'Online',
        whenToUse: 'Fraud, real-time personalization, copilots.',
        pros: ['Fresh', 'Reactive'],
        cons: ['Costly', 'Operational complexity', 'Cold starts'],
      },
    ],
  },
  {
    id: 'to-finetune-rag',
    name: 'Fine-tuning vs RAG',
    axis: 'Update model weights vs inject context at runtime',
    interviewFraming:
      'RAG for fresh, factual, retrievable data; fine-tuning for style, format, or task-specific patterns. They compose — use both when needed.',
    productionFraming:
      'Start with RAG (cheaper, debuggable). Fine-tune when prompts can\'t enforce the behavior you need, or for cost reduction on a stable task.',
    options: [
      {
        name: 'RAG',
        whenToUse: 'Knowledge changes; need citations; cold start.',
        pros: ['Fresh data', 'Cheap to update', 'Auditable'],
        cons: ['Retrieval quality bottleneck', 'Prompt engineering'],
        examples: ['Customer support copilots', 'Internal QA'],
      },
      {
        name: 'Fine-tuning',
        whenToUse: 'Style, format, persistent behavior, latency/cost reduction.',
        pros: ['Embeds patterns in weights', 'Smaller prompt + smaller model possible'],
        cons: ['Stale knowledge', 'Eval and ops cost', 'Catastrophic forgetting'],
        examples: ['Domain-specific function-calling', 'Output-format compliance'],
      },
    ],
  },
  {
    id: 'to-vector-keyword-hybrid',
    name: 'Vector vs keyword vs hybrid search',
    axis: 'Semantic recall vs lexical precision',
    interviewFraming:
      'Vector for semantic; keyword for exact match (codes, IDs, names). Hybrid (BM25 + vectors + rerank) wins in most production RAG.',
    productionFraming:
      'Few real corpora work well with vectors alone. Add BM25 and a cross-encoder reranker — bigger lift than swapping vector DBs.',
    options: [
      {
        name: 'Vector',
        whenToUse: 'Semantic similarity, paraphrasing, multilingual.',
        pros: ['Captures meaning', 'Robust to synonyms'],
        cons: ['Misses exact matches', 'Sensitive to chunking'],
      },
      {
        name: 'Keyword (BM25)',
        whenToUse: 'IDs, codes, exact terms, regulatory queries.',
        pros: ['Predictable', 'Fast', 'Tunable'],
        cons: ['No semantic match', 'Synonym blind'],
      },
      {
        name: 'Hybrid + rerank',
        whenToUse: 'Production RAG over heterogeneous corpora.',
        pros: ['Best precision/recall', 'Robust', 'Tunable per query class'],
        cons: ['More moving parts', 'Reranker latency'],
      },
    ],
  },
  {
    id: 'to-strong-eventual',
    name: 'Strong vs eventual consistency',
    axis: 'CAP / PACELC tradeoff',
    interviewFraming:
      'Most user-visible reads tolerate eventual; financial state needs strong. Always ask the read-after-write expectations.',
    productionFraming:
      'Mix per access pattern: strong on the write path, eventual on the read path with bounded staleness SLO.',
    options: [
      {
        name: 'Strong consistency',
        whenToUse: 'Financial, inventory, critical state.',
        pros: ['Single-system illusion', 'Easy reasoning'],
        cons: ['Higher latency', 'Lower availability under partition'],
      },
      {
        name: 'Eventual consistency',
        whenToUse: 'Social feeds, caches, analytics, derived views.',
        pros: ['Scales horizontally', 'Highly available'],
        cons: ['Stale reads', 'Application must handle convergence'],
      },
    ],
  },
  {
    id: 'to-horiz-vert',
    name: 'Horizontal vs vertical scaling',
    axis: 'More machines vs bigger machine',
    interviewFraming:
      'Vertical first up to your comfort ceiling — it\'s simpler and often cheap. Horizontal when you need fault tolerance, or beyond single-machine limits.',
    productionFraming:
      'Most stateful systems start vertical and add horizontal read replicas. Sharding is the last resort.',
    options: [
      {
        name: 'Vertical',
        whenToUse: 'Up to single-machine limits; simpler systems.',
        pros: ['Simple', 'No distributed-systems tax'],
        cons: ['Single point of failure', 'Hard ceiling'],
      },
      {
        name: 'Horizontal',
        whenToUse: 'Beyond one machine; fault tolerance required.',
        pros: ['Effectively unbounded', 'Built-in redundancy'],
        cons: ['Sharding, coordination, partial failures'],
      },
    ],
  },
  {
    id: 'to-push-pull',
    name: 'Push vs pull architecture',
    axis: 'Who initiates the data flow',
    interviewFraming:
      'Push for low-latency reactivity; pull for backpressure and aggregation. Pub/sub frequently combines both.',
    productionFraming:
      'Many real systems use pull at the consumer (Kafka) plus push at the user (WebSockets) — direction depends on layer.',
    options: [
      {
        name: 'Push',
        whenToUse: 'Real-time UIs, notifications.',
        pros: ['Low latency', 'Reactive'],
        cons: ['Hard to apply backpressure', 'Slow consumers stress producers'],
      },
      {
        name: 'Pull',
        whenToUse: 'Batch / stream consumers, aggregations.',
        pros: ['Natural backpressure', 'Consumers control pace'],
        cons: ['Latency overhead', 'Poll storms if naive'],
      },
    ],
  },
  {
    id: 'to-sync-async',
    name: 'Sync vs async communication',
    axis: 'Direct request/response vs decoupled events',
    interviewFraming:
      'Sync for read-after-write, idempotent reads, user-blocking flows. Async for fan-out, side effects, decoupled domains.',
    productionFraming:
      'A common architecture mistake is doing async where sync is simpler — and vice versa. Look for "who is allowed to fail without the user knowing?" as your signal.',
    options: [
      {
        name: 'Sync',
        whenToUse: 'User-blocking operations, transactional flows.',
        pros: ['Simple to reason about', 'Immediate errors'],
        cons: ['Tight coupling', 'Cascading failures'],
      },
      {
        name: 'Async',
        whenToUse: 'Side effects, multi-consumer fan-out, decoupled domains.',
        pros: ['Decoupling', 'Resilience to downstream failure', 'Easier scale-out'],
        cons: ['Harder debugging', 'Eventual consistency', 'Idempotency required'],
      },
    ],
  },
];
