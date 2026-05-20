import type { GNode } from './schema';

// Tools live as concept nodes attached to relevant subdomains via parentId.
// They get the kind 'tool' so the Tool Ecosystem mode can list them.

const T = (
  id: string,
  name: string,
  domainId: string,
  parentId: string,
  shortExplanation: string,
  whyItMatters: string,
  tags: string[] = [],
): GNode => ({
  id,
  name,
  kind: 'tool',
  domainId,
  parentId,
  level: 2,
  difficulty: 'intermediate',
  layer: 'implementation',
  tags: ['tool', ...tags],
  shortExplanation,
  whyItMatters,
  interviewRelevance: 2,
  productionRelevance: 4,
});

export const tools: GNode[] = [
  // Containers / orchestration
  T('tool-docker', 'Docker', 'devops', 'devops-containers', 'Standardized OS-level virtualization producing immutable images.', 'Eliminates "works on my machine" by shipping the entire runtime, not just the binary.', ['containers']),
  T('tool-k8s', 'Kubernetes', 'kubernetes', 'k8s-workloads', 'Declarative orchestrator for containers — reconciles desired vs actual state.', 'The de-facto control plane for production workloads; the abstraction every cloud now mimics.', ['orchestration']),
  T('tool-helm', 'Helm', 'kubernetes', 'k8s-packaging', 'Templated, versioned packaging for Kubernetes manifests.', 'Lets you ship one chart across environments instead of duplicating thousands of YAML lines.', ['packaging']),
  T('tool-argocd', 'Argo CD', 'cicd', 'cicd-gitops', 'GitOps continuous delivery — cluster state mirrors a git repo.', 'Makes rollback a git revert; makes audit a git log.', ['gitops']),

  // CI
  T('tool-gha', 'GitHub Actions', 'cicd', 'cicd-pipelines', 'Workflow-as-code CI/CD natively bound to GitHub events.', 'Lowest-friction CI for OSS and most product teams.', ['ci']),
  T('tool-jenkins', 'Jenkins', 'cicd', 'cicd-pipelines', 'Veteran extensible CI server with a massive plugin ecosystem.', 'Still common in enterprise; loved and hated for its plugin sprawl.', ['ci']),
  T('tool-gitlabci', 'GitLab CI', 'cicd', 'cicd-pipelines', 'YAML pipelines tightly integrated with GitLab.', 'Single-vendor DevOps stack from issue to deploy.', ['ci']),

  // IaC
  T('tool-terraform', 'Terraform', 'iac', 'iac-declarative', 'Cloud-agnostic, state-tracking IaC with a vast provider ecosystem.', 'Closest the industry has to a universal infra language.', ['iac']),
  T('tool-ansible', 'Ansible', 'iac', 'iac-declarative', 'Agentless configuration management via SSH and YAML playbooks.', 'Sweet spot for OS-level config on machines you already own.', ['config-mgmt']),

  // Observability
  T('tool-prometheus', 'Prometheus', 'observability', 'observ-metrics', 'Pull-based metric collection with PromQL and a time-series store.', 'The metric backbone of cloud-native monitoring.', ['metrics']),
  T('tool-grafana', 'Grafana', 'observability', 'observ-metrics', 'Pluggable visualization and alerting over many data sources.', 'Pane-of-glass for engineers and oncall.', ['dashboards']),
  T('tool-otel', 'OpenTelemetry', 'observability', 'observ-traces', 'Vendor-neutral spec for traces, metrics, and logs with SDKs and collectors.', 'Frees you from vendor lock-in for instrumentation.', ['traces']),
  T('tool-elk', 'ELK Stack', 'observability', 'observ-logs', 'Elasticsearch, Logstash, Kibana — log search and analytics.', 'Classic open-source stack for structured-log search at scale.', ['logs']),
  T('tool-loki', 'Loki', 'observability', 'observ-logs', 'Log aggregation indexed only on labels, not full text.', 'Far cheaper than ES at high volumes when you mostly grep.', ['logs']),
  T('tool-jaeger', 'Jaeger', 'observability', 'observ-traces', 'Open-source distributed tracing backend, OTel-compatible.', 'Surfaces hidden cross-service latency.', ['traces']),

  // Clouds
  T('tool-aws', 'AWS', 'cloud', 'cloud-providers', 'Largest hyperscaler; breadth and depth across compute, data, AI.', 'Default for most enterprises and AI workloads.', ['cloud']),
  T('tool-azure', 'Azure', 'cloud', 'cloud-providers', 'Microsoft hyperscaler with deep enterprise and AI integration.', 'Strong play in regulated industries and OpenAI partnership.', ['cloud']),
  T('tool-gcp', 'GCP', 'cloud', 'cloud-providers', 'Google hyperscaler — BigQuery, Spanner, Vertex AI flagships.', 'Best-in-class analytics and ML platform.', ['cloud']),

  // DBs
  T('tool-pg', 'PostgreSQL', 'databases', 'db-relational', 'Open-source relational DB with rich extensions (JSON, GIS, pgvector).', 'Sane default for transactional workloads at almost any scale.', ['rdbms']),
  T('tool-mysql', 'MySQL', 'databases', 'db-relational', 'Ubiquitous OSS relational DB; strong read-replica story.', 'Powers a large fraction of the web.', ['rdbms']),
  T('tool-mongo', 'MongoDB', 'databases', 'db-document', 'Document database with flexible schemas and built-in replication.', 'Fits early-stage products with evolving shapes.', ['nosql']),
  T('tool-cassandra', 'Cassandra', 'databases', 'db-wide-column', 'Wide-column store optimized for write-heavy, multi-region workloads.', 'Sweet spot for high-throughput time-series and event data.', ['nosql']),
  T('tool-dynamo', 'DynamoDB', 'databases', 'db-kv', 'Managed serverless key-value/document store with single-digit ms latency.', 'Default operational store on AWS; eliminates ops at the cost of access-pattern thinking.', ['nosql', 'aws']),
  T('tool-redis', 'Redis', 'caching', 'cache-stores', 'In-memory data structure store — cache, pubsub, streams, locks.', 'Swiss army knife of low-latency state.', ['cache']),
  T('tool-elastic', 'Elasticsearch', 'databases', 'db-search', 'Inverted-index search engine on Lucene.', 'Text and analytics search workhorse.', ['search']),

  // Messaging
  T('tool-kafka', 'Apache Kafka', 'messaging', 'msg-log', 'Distributed append-only log with consumer groups and exactly-once.', 'The default event backbone for modern data and microservices.', ['log']),
  T('tool-rabbit', 'RabbitMQ', 'messaging', 'msg-queues', 'AMQP broker with flexible routing and per-message acks.', 'Best when you need rich routing topologies, not infinite retention.', ['queue']),
  T('tool-pulsar', 'Apache Pulsar', 'messaging', 'msg-log', 'Log+queue hybrid with tiered storage and multi-tenancy.', 'Strong for geo-replicated, multi-tenant event platforms.', ['log']),

  // Data eng
  T('tool-spark', 'Apache Spark', 'batch', 'batch-engines', 'Unified analytics engine for batch and structured streaming.', 'Default heavyweight engine for petabyte-scale transformations.', ['batch']),
  T('tool-flink', 'Apache Flink', 'streaming', 'stream-engines', 'True streaming engine with event-time semantics and exactly-once state.', 'Gold standard for stateful stream processing.', ['stream']),
  T('tool-airflow', 'Apache Airflow', 'data-eng', 'de-orchestration', 'Python-DAG orchestrator with a huge operator catalog.', 'Ubiquitous for batch pipelines; learn its sharp edges around scheduling.', ['orchestration']),
  T('tool-dbt', 'dbt', 'data-eng', 'de-transformation', 'SQL transformations with tests, docs, and lineage on top of warehouses.', 'Brought software engineering practices to analytics SQL.', ['transform']),
  T('tool-snowflake', 'Snowflake', 'dw', 'dw-engines', 'Managed cloud DW with separated storage and compute.', 'Reference DW for ergonomic, elastic analytics.', ['warehouse']),
  T('tool-bigquery', 'BigQuery', 'dw', 'dw-engines', 'Serverless DW with massively-parallel SQL and native ML.', 'GCP-native pay-per-query analytics.', ['warehouse']),
  T('tool-databricks', 'Databricks', 'lakehouse', 'lakehouse-platforms', 'Managed lakehouse platform built on Spark and Delta Lake.', 'Reference lakehouse vendor; one stack for data + ML.', ['lakehouse']),
  T('tool-delta', 'Delta Lake', 'lakehouse', 'lake-formats', 'Open ACID table format on object storage.', 'Lakehouse semantics via transaction logs over Parquet.', ['format']),
  T('tool-iceberg', 'Apache Iceberg', 'lakehouse', 'lake-formats', 'Open table format with hidden partitioning and time travel.', 'Vendor-neutral lakehouse standard gaining strong traction.', ['format']),
  T('tool-hudi', 'Apache Hudi', 'lakehouse', 'lake-formats', 'Upsert-optimized table format with CDC primitives.', 'Strong fit for streaming CDC into the lake.', ['format']),

  // MLOps
  T('tool-mlflow', 'MLflow', 'mlops', 'mlops-registry', 'Experiment tracking, model registry, packaging.', 'Lowest-friction model registry for most teams.', ['registry']),
  T('tool-kubeflow', 'Kubeflow', 'mlops', 'mlops-pipelines', 'ML pipelines and training on Kubernetes.', 'When you need Kubernetes-native ML at scale.', ['pipelines']),
  T('tool-feast', 'Feast', 'mlops', 'mlops-features', 'Open-source feature store with online and offline serving.', 'Reference architecture for feature consistency.', ['features']),
  T('tool-bentoml', 'BentoML', 'mlops', 'mlops-serving', 'Framework for packaging and serving ML models as Bento services.', 'Bridges Python notebooks and production HTTP services cleanly.', ['serving']),
  T('tool-kserve', 'KServe', 'mlops', 'mlops-serving', 'Kubernetes-native model serving with auto-scaling and canaries.', 'Production serving plane on K8s; integrates with knative.', ['serving']),
  T('tool-ray', 'Ray', 'ml', 'ml-distributed', 'Distributed Python for training, tuning, and serving.', 'Single framework spans data, training, RL, and serving.', ['distributed']),
  T('tool-dvc', 'DVC', 'mlops', 'mlops-data', 'Data and model versioning on top of git.', 'Makes datasets and models first-class versioned artifacts.', ['versioning']),
  T('tool-wandb', 'Weights & Biases', 'mlops', 'mlops-experiments', 'Hosted experiment tracking and visualization.', 'Excellent UX; common in DL research-to-prod workflows.', ['experiments']),
  T('tool-hf', 'Hugging Face', 'genai', 'genai-models', 'Model hub, transformers library, inference endpoints.', 'Default surface area for OSS models.', ['models']),

  // GenAI / LLM
  T('tool-langchain', 'LangChain', 'genai', 'genai-apps', 'Framework for composing LLM applications: chains, agents, RAG.', 'Quick scaffolding; production deployments often outgrow it.', ['llm-app']),
  T('tool-llamaindex', 'LlamaIndex', 'genai', 'genai-rag', 'RAG-focused framework for indexing, retrieval, and query engines.', 'Strong opinions on retrieval pipelines and document parsing.', ['rag']),
  T('tool-vllm', 'vLLM', 'llmops', 'llm-serving', 'High-throughput LLM serving with paged attention.', 'Production-grade open-source inference engine.', ['serving']),
  T('tool-ollama', 'Ollama', 'genai', 'genai-models', 'Local model runtime with a simple CLI/API.', 'Best dev experience for running OSS LLMs locally.', ['local']),

  // Vector
  T('tool-milvus', 'Milvus', 'vector', 'vector-engines', 'Open-source vector DB with multiple ANN indexes.', 'Strong for billion-scale vector workloads.', ['vector']),
  T('tool-weaviate', 'Weaviate', 'vector', 'vector-engines', 'Vector DB with hybrid search and built-in modules.', 'Schemas + vectors + GraphQL in one engine.', ['vector']),
  T('tool-pinecone', 'Pinecone', 'vector', 'vector-engines', 'Managed serverless vector database.', 'Frictionless ops; popular in early RAG stacks.', ['vector']),
  T('tool-qdrant', 'Qdrant', 'vector', 'vector-engines', 'High-performance vector DB in Rust with filtering.', 'Strong filtering + payload; popular for self-hosted.', ['vector']),
  T('tool-chroma', 'Chroma', 'vector', 'vector-engines', 'Embeddable open-source vector DB optimized for dev UX.', 'Great for prototyping; less for huge production loads.', ['vector']),
  T('tool-opensearch', 'OpenSearch', 'databases', 'db-search', 'Fork of Elasticsearch with native vector support.', 'Combines lexical and vector search in one engine.', ['search']),
];

export const toolNodes = tools;
