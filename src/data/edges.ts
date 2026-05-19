import type { GEdge } from './schema';

// Cross-domain edges. Parent edges (subdomain → domain, concept → subdomain)
// are derived automatically from parentId in src/data/index.ts.
//
// Only declare *non-hierarchical* edges here: related, depends-on, implements,
// tradeoff-of, fails-as.

const e = (source: string, target: string, kind: GEdge['kind'], strength = 0.6): GEdge => ({
  source,
  target,
  kind,
  strength,
});

export const crossEdges: GEdge[] = [
  // System Design ↔ Distributed Systems / Databases / Caching / Messaging / Observability
  e('sd-storage', 'databases', 'depends-on'),
  e('sd-load-balancing', 'sd-rate-limiting', 'related'),
  e('sd-event-arch', 'msg-log', 'depends-on'),
  e('sd-event-arch-concept', 'msg-log', 'implements'),
  e('sd-event-arch', 'streaming', 'related'),
  e('sd-architecture', 'pat-microservices', 'related'),
  e('sd-architecture', 'pat-modulith', 'related'),
  e('sd-multitenant', 'pat-bulkhead', 'related'),
  e('sd-rate-limiting', 'pat-rate-limit', 'implements'),

  // Distributed systems → reliability / patterns / failure modes
  e('ds-resilience', 'observability', 'depends-on'),
  e('ds-circuit-breaker', 'pat-circuit-breaker', 'implements'),
  e('ds-bulkhead', 'pat-bulkhead', 'implements'),
  e('ds-retries-jitter', 'pat-retry-backoff', 'implements'),
  e('ds-load-shed', 'pat-load-shed', 'implements'),
  e('ds-resilience', 'fm-cascading', 'fails-as'),
  e('ds-resilience', 'fm-retry-storm', 'fails-as'),
  e('ds-resilience', 'fm-thundering-herd', 'fails-as'),
  e('ds-consistency', 'db-tx', 'related'),
  e('ds-consistency', 'fm-split-brain', 'fails-as'),
  e('ds-coordination', 'fm-split-brain', 'fails-as'),
  e('ds-time', 'fm-clock-skew', 'fails-as'),

  // Databases ↔ everything
  e('databases', 'caching', 'related'),
  e('db-replication', 'fm-db-bottleneck', 'fails-as'),
  e('db-sharding', 'fm-hot-partition', 'fails-as'),
  e('db-cdc', 'streaming', 'depends-on'),
  e('db-cdc', 'msg-log', 'depends-on'),

  // Caching
  e('cache-stampede-concept', 'fm-cache-stampede', 'fails-as'),
  e('cache-aside', 'tool-redis', 'implements'),
  e('cache-distributed', 'tool-redis', 'implements'),

  // Messaging ↔ streaming / data eng
  e('messaging', 'streaming', 'depends-on'),
  e('msg-log', 'tool-kafka', 'implements'),
  e('msg-queues', 'tool-rabbit', 'implements'),
  e('msg-backpressure', 'fm-queue-backlog', 'fails-as'),
  e('msg-schema-registry', 'fm-schema-drift', 'related'),

  // API design ↔ system design
  e('api-rest', 'to-rest-graphql-grpc' as any, 'related'), // overlay ref ignored at edge level
  e('api-grpc', 'tool-otel', 'related'),

  // DevOps / Cloud / K8s / CI/CD
  e('devops-containers', 'tool-docker', 'implements'),
  e('cicd-canary', 'mlops-canary', 'related'),
  e('cicd-bluegreen', 'pat-model-serving', 'related'),
  e('cicd-gitops', 'tool-argocd', 'implements'),
  e('k8s-workloads', 'tool-k8s', 'implements'),
  e('k8s-autoscaling', 'mlops-serving', 'related'),
  e('cloud-providers', 'tool-aws', 'related'),
  e('cloud-providers', 'tool-gcp', 'related'),
  e('cloud-providers', 'tool-azure', 'related'),
  e('cloud-serverless', 'fm-cold-start', 'fails-as'),

  // IaC
  e('iac', 'tool-terraform', 'implements'),
  e('iac', 'cloud-providers', 'depends-on'),

  // Observability
  e('observ-traces', 'tool-otel', 'implements'),
  e('observ-metrics', 'tool-prometheus', 'implements'),
  e('observ-metrics', 'tool-grafana', 'implements'),
  e('observ-context-prop', 'fm-observability-blind', 'fails-as'),

  // Data Eng / Streaming / Lakehouse / Batch
  e('de-ingestion', 'msg-log', 'depends-on'),
  e('de-ingestion', 'stream-engines', 'depends-on'),
  e('de-orchestration', 'tool-airflow', 'implements'),
  e('de-transformation', 'tool-dbt', 'implements'),
  e('de-quality', 'fm-schema-drift', 'fails-as'),
  e('de-quality', 'fm-silent-corruption', 'fails-as'),
  e('de-quality', 'fm-data-skew', 'fails-as'),
  e('stream-engines', 'tool-flink', 'implements'),
  e('stream-engines', 'tool-spark', 'related'),
  e('batch-engines', 'tool-spark', 'implements'),
  e('lake-formats', 'tool-delta', 'implements'),
  e('lake-formats', 'tool-iceberg', 'implements'),
  e('lake-formats', 'tool-hudi', 'implements'),
  e('pat-medallion', 'de-medallion', 'related'),
  e('lakehouse', 'tool-databricks', 'related'),

  // ML / MLOps / Production AI
  e('ml-eval', 'fm-data-leakage', 'fails-as'),
  e('mlops-features', 'pat-feature-store-arch', 'implements'),
  e('mlops-feature-store', 'tool-feast', 'implements'),
  e('mlops-features', 'fm-training-serving-skew', 'fails-as'),
  e('mlops-monitoring', 'metric-drift', 'related'),
  e('mlops-monitoring', 'fm-model-drift', 'fails-as'),
  e('mlops-serving', 'pat-model-serving', 'implements'),
  e('mlops-serving', 'tool-kserve', 'related'),
  e('mlops-serving', 'tool-bentoml', 'related'),
  e('mlops-serving', 'fm-gpu-oom', 'fails-as'),
  e('mlops-registry', 'tool-mlflow', 'implements'),
  e('mlops-quantization', 'llm-quantization', 'related'),
  e('mlops-cicd-models', 'cicd-pipelines', 'depends-on'),
  e('mlops-shadow', 'pai-shadow-prod', 'related'),
  e('pai-hitl', 'pat-hitl', 'implements'),
  e('pai-arch', 'mlops-serving', 'depends-on'),
  e('pai-arch', 'mlops-features', 'depends-on'),
  e('pai-arch', 'mlops-monitoring', 'depends-on'),

  // GenAI / LLMOps / Vector
  e('genai-rag', 'pat-rag', 'implements'),
  e('genai-rag', 'vector-engines', 'depends-on'),
  e('genai-agents', 'pat-agentic', 'implements'),
  e('genai-embeddings', 'vector-engines', 'depends-on'),
  e('genai-rag-chunking', 'vector-chunking', 'related'),
  e('genai-reranking', 'vector-reranking', 'related'),
  e('genai-hybrid-search', 'vector-hybrid', 'related'),
  e('genai-prompt-injection', 'fm-prompt-injection', 'fails-as'),
  e('genai-pii', 'sec-secrets', 'related'),
  e('llm-serving', 'tool-vllm', 'implements'),
  e('llm-tracing', 'tool-otel', 'implements'),
  e('llm-paged-attention', 'fm-gpu-oom', 'related'),
  e('vector-engines', 'tool-milvus', 'implements'),
  e('vector-engines', 'tool-qdrant', 'implements'),
  e('vector-engines', 'tool-pinecone', 'implements'),
  e('vector-engines', 'tool-weaviate', 'implements'),
  e('vector-reindex', 'fm-embedding-drift', 'related'),

  // Production AI → everything
  e('proj-fraud' as any, 'pai-arch', 'related'), // unused
];
