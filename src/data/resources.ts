import type { ResourceLink } from './schema';

// Curated external resources per node id. Conservative — only links I'm
// confident actually exist (Wikipedia articles, official docs URLs of
// well-known tools, canonical papers). The RightPanel adds a Google
// search fallback for every node automatically, so anything not in this
// map still gets a "Search the web" option.

const W = (path: string, label: string): ResourceLink => ({
  kind: 'wikipedia',
  label,
  url: `https://en.wikipedia.org/wiki/${path}`,
});
const D = (url: string, label: string): ResourceLink => ({
  kind: 'docs',
  label,
  url,
});
const P = (url: string, label: string): ResourceLink => ({
  kind: 'paper',
  label,
  url,
});
const B = (url: string, label: string): ResourceLink => ({
  kind: 'blog',
  label,
  url,
});
const Bk = (url: string, label: string): ResourceLink => ({
  kind: 'book',
  label,
  url,
});
const G = (url: string, label: string): ResourceLink => ({
  kind: 'github',
  label,
  url,
});

export const resources: Record<string, ResourceLink[]> = {
  // ───── Domains ─────
  'system-design': [
    Bk('https://dataintensive.net/', 'Designing Data-Intensive Applications'),
    G('https://github.com/donnemartin/system-design-primer', 'The System Design Primer'),
    G('https://github.com/ByteByteGoHq/system-design-101', 'ByteByteGo System Design 101'),
  ],
  'distributed-systems': [
    W('Distributed_computing', 'Distributed computing'),
    Bk('https://www.distributedsystemscourse.com/', 'Distributed Systems (Kleppmann)'),
    B('https://www.allthingsdistributed.com/', 'All Things Distributed (Werner Vogels)'),
  ],
  'backend-eng': [
    Bk('https://aosabook.org/en/index.html', 'The Architecture of Open Source Applications'),
  ],
  'databases': [
    W('Database', 'Database'),
    Bk('https://www.databass.dev/', 'Database Internals (Petrov)'),
  ],
  'caching': [W('Cache_(computing)', 'Cache (computing)')],
  'messaging': [W('Message-oriented_middleware', 'Message-oriented middleware')],
  'api-design': [
    D('https://cloud.google.com/apis/design', 'Google API Design Guide'),
    B('https://stripe.com/blog/api-design-guide', 'Stripe API design'),
  ],
  'devops': [W('DevOps', 'DevOps'), Bk('https://itrevolution.com/the-devops-handbook/', 'The DevOps Handbook')],
  'cloud': [W('Cloud_computing', 'Cloud computing')],
  'kubernetes': [D('https://kubernetes.io/docs/concepts/', 'Kubernetes concepts')],
  'iac': [W('Infrastructure_as_code', 'Infrastructure as code')],
  'cicd': [W('CI/CD', 'CI/CD')],
  'observability': [
    Bk('https://sre.google/sre-book/table-of-contents/', 'Google SRE Book'),
    W('Observability', 'Observability'),
  ],
  'security': [B('https://owasp.org/www-project-top-ten/', 'OWASP Top 10')],
  'data-eng': [Bk('https://www.fundamentalsofdataengineering.com/', 'Fundamentals of Data Engineering')],
  'dw': [W('Data_warehouse', 'Data warehouse')],
  'lakehouse': [P('https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf', 'Lakehouse paper (CIDR 2021)')],
  'streaming': [Bk('https://www.oreilly.com/library/view/streaming-systems/9781491983867/', 'Streaming Systems (Akidau)')],
  'batch': [W('Batch_processing', 'Batch processing')],
  'ml': [Bk('https://www.deeplearningbook.org/', 'Deep Learning Book (free)')],
  'dl': [Bk('https://www.deeplearningbook.org/', 'Deep Learning Book (free)')],
  'mlops': [
    Bk('https://www.oreilly.com/library/view/designing-machine-learning/9781098107956/', 'Designing ML Systems (Huyen)'),
    B('https://ml-ops.org/', 'ml-ops.org'),
  ],
  'genai': [D('https://platform.openai.com/docs/', 'OpenAI API docs'), D('https://docs.anthropic.com/', 'Anthropic Claude docs')],
  'llmops': [B('https://www.langfuse.com/blog', 'Langfuse blog'), G('https://github.com/microsoft/promptflow', 'PromptFlow')],
  'vector': [B('https://huyenchip.com/2024/07/25/genai-platform.html', 'Building a GenAI platform (Huyen)')],
  'prod-ai': [Bk('https://www.oreilly.com/library/view/designing-machine-learning/9781098107956/', 'Designing ML Systems (Huyen)')],

  // ───── Core concepts ─────
  'ds-cap': [W('CAP_theorem', 'CAP theorem'), B('https://www.allthingsdistributed.com/2008/12/eventually_consistent.html', 'Eventually Consistent — Vogels')],
  'ds-linearizable': [W('Linearizability', 'Linearizability')],
  'ds-serializable': [W('Serializability', 'Serializability')],
  'ds-eventual': [W('Eventual_consistency', 'Eventual consistency')],
  'ds-causal': [W('Causal_consistency', 'Causal consistency')],
  'ds-raft': [P('https://raft.github.io/raft.pdf', 'Raft paper'), W('Raft_(algorithm)', 'Raft')],
  'ds-paxos': [W('Paxos_(computer_science)', 'Paxos'), P('https://www.microsoft.com/en-us/research/publication/paxos-made-simple/', 'Paxos Made Simple — Lamport')],
  'ds-2pc': [W('Two-phase_commit_protocol', 'Two-phase commit')],
  'ds-logical-clocks': [W('Lamport_timestamp', 'Lamport timestamps')],
  'ds-hlc': [P('https://cse.buffalo.edu/tech-reports/2014-04.pdf', 'HLC paper (Kulkarni et al.)')],
  'ds-vector-clocks': [W('Vector_clock', 'Vector clock')],
  'ds-retries-jitter': [B('https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/', 'Exponential backoff and jitter — AWS')],
  'ds-idempotency': [W('Idempotence', 'Idempotence')],

  'db-acid': [W('ACID', 'ACID')],
  'db-isolation-levels': [B('https://www.postgresql.org/docs/current/transaction-iso.html', 'Postgres transaction isolation')],
  'db-mvcc': [W('Multiversion_concurrency_control', 'MVCC')],
  'db-write-ahead-log': [W('Write-ahead_logging', 'Write-ahead logging')],
  'db-leader-follower': [B('https://www.postgresql.org/docs/current/high-availability.html', 'Postgres replication docs')],
  'db-leaderless': [P('https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf', 'Dynamo paper')],
  'db-quorum': [W('Quorum_(distributed_computing)', 'Quorum')],
  'db-hash-partition': [W('Partition_(database)', 'Database partitioning')],
  'db-consistent-hashing': [W('Consistent_hashing', 'Consistent hashing')],
  'db-cdc': [W('Change_data_capture', 'Change data capture')],

  'cache-aside': [B('https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside', 'Cache-Aside pattern')],
  'cache-stampede-concept': [W('Cache_stampede', 'Cache stampede')],

  'msg-partitions': [D('https://kafka.apache.org/documentation/#intro_topics', 'Kafka topics & partitions')],
  'msg-exactly-once': [B('https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/', 'Exactly-once in Kafka (Confluent)')],

  // ───── Patterns ─────
  'pat-microservices': [B('https://martinfowler.com/articles/microservices.html', 'Microservices — Martin Fowler')],
  'pat-modulith': [B('https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity', 'Shopify modular monolith')],
  'pat-event-sourcing': [B('https://martinfowler.com/eaaDev/EventSourcing.html', 'Event Sourcing — Fowler')],
  'pat-cqrs': [B('https://martinfowler.com/bliki/CQRS.html', 'CQRS — Fowler')],
  'pat-saga': [B('https://microservices.io/patterns/data/saga.html', 'Saga pattern — microservices.io')],
  'pat-circuit-breaker': [B('https://martinfowler.com/bliki/CircuitBreaker.html', 'CircuitBreaker — Fowler')],
  'pat-bulkhead': [B('https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead', 'Bulkhead pattern')],
  'pat-retry-backoff': [B('https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/', 'Exponential backoff and jitter')],
  'pat-rate-limit': [B('https://stripe.com/blog/rate-limiters', 'Stripe rate limiters')],
  'pat-load-shed': [B('https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/', 'Load shedding — AWS')],
  'pat-api-gateway': [B('https://microservices.io/patterns/apigateway.html', 'API gateway — microservices.io')],
  'pat-service-mesh': [B('https://istio.io/latest/about/service-mesh/', 'What is a service mesh? — Istio')],
  'pat-sidecar': [B('https://learn.microsoft.com/en-us/azure/architecture/patterns/sidecar', 'Sidecar pattern')],
  'pat-lambda-arch': [W('Lambda_architecture', 'Lambda architecture')],
  'pat-kappa-arch': [B('https://www.oreilly.com/radar/questioning-the-lambda-architecture/', 'Questioning the Lambda Architecture — Kreps')],
  'pat-medallion': [D('https://www.databricks.com/glossary/medallion-architecture', 'Medallion architecture — Databricks')],
  'pat-lakehouse': [P('https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf', 'Lakehouse paper (CIDR 2021)')],
  'pat-feature-store-arch': [B('https://www.featurestore.org/', 'featurestore.org')],
  'pat-model-serving': [D('https://kserve.github.io/website/', 'KServe docs')],
  'pat-rag': [P('https://arxiv.org/abs/2005.11401', 'Original RAG paper (Lewis et al.)')],
  'pat-agentic': [B('https://www.anthropic.com/research/building-effective-agents', 'Building effective agents — Anthropic')],
  'pat-hitl': [W('Human-in-the-loop', 'Human-in-the-loop')],

  // ───── Failure modes ─────
  'fm-db-bottleneck': [B('https://www.percona.com/blog/2020/03/02/connection-pooling/', 'PgBouncer & connection pooling')],
  'fm-cache-stampede': [W('Cache_stampede', 'Cache stampede')],
  'fm-hot-partition': [B('https://www.alexdebrie.com/posts/dynamodb-partitions/', 'DynamoDB partitions — Alex DeBrie')],
  'fm-cascading': [B('https://sre.google/sre-book/addressing-cascading-failures/', 'SRE: Addressing Cascading Failures')],
  'fm-thundering-herd': [W('Thundering_herd_problem', 'Thundering herd')],
  'fm-retry-storm': [B('https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/', 'Timeouts, retries, backoff — AWS')],
  'fm-split-brain': [W('Split-brain_(computing)', 'Split-brain')],
  'fm-cold-start': [B('https://aws.amazon.com/blogs/compute/operating-lambda-performance-optimization-part-1/', 'Lambda cold starts — AWS')],
  'fm-prompt-injection': [B('https://owasp.org/www-project-top-10-for-large-language-model-applications/', 'OWASP Top 10 for LLM Applications')],
  'fm-hallucination': [W('Hallucination_(artificial_intelligence)', 'Hallucination (AI)')],
  'fm-training-serving-skew': [B('https://www.tensorflow.org/tfx/guide/serving', 'TFX Serving — train/serve skew')],

  // ───── Tools (official docs) ─────
  'tool-docker': [D('https://docs.docker.com/', 'Docker docs')],
  'tool-k8s': [D('https://kubernetes.io/docs/', 'Kubernetes docs')],
  'tool-helm': [D('https://helm.sh/docs/', 'Helm docs')],
  'tool-argocd': [D('https://argo-cd.readthedocs.io/', 'Argo CD docs')],
  'tool-gha': [D('https://docs.github.com/en/actions', 'GitHub Actions docs')],
  'tool-jenkins': [D('https://www.jenkins.io/doc/', 'Jenkins docs')],
  'tool-gitlabci': [D('https://docs.gitlab.com/ee/ci/', 'GitLab CI docs')],
  'tool-terraform': [D('https://developer.hashicorp.com/terraform/docs', 'Terraform docs')],
  'tool-ansible': [D('https://docs.ansible.com/', 'Ansible docs')],
  'tool-prometheus': [D('https://prometheus.io/docs/', 'Prometheus docs')],
  'tool-grafana': [D('https://grafana.com/docs/', 'Grafana docs')],
  'tool-otel': [D('https://opentelemetry.io/docs/', 'OpenTelemetry docs')],
  'tool-elk': [D('https://www.elastic.co/guide/', 'Elastic Stack docs')],
  'tool-loki': [D('https://grafana.com/docs/loki/latest/', 'Loki docs')],
  'tool-jaeger': [D('https://www.jaegertracing.io/docs/', 'Jaeger docs')],
  'tool-aws': [D('https://docs.aws.amazon.com/', 'AWS docs')],
  'tool-azure': [D('https://learn.microsoft.com/en-us/azure/', 'Azure docs')],
  'tool-gcp': [D('https://cloud.google.com/docs', 'GCP docs')],
  'tool-pg': [D('https://www.postgresql.org/docs/', 'PostgreSQL docs')],
  'tool-mysql': [D('https://dev.mysql.com/doc/', 'MySQL docs')],
  'tool-mongo': [D('https://www.mongodb.com/docs/', 'MongoDB docs')],
  'tool-cassandra': [D('https://cassandra.apache.org/doc/latest/', 'Cassandra docs')],
  'tool-dynamo': [D('https://docs.aws.amazon.com/dynamodb/', 'DynamoDB docs')],
  'tool-redis': [D('https://redis.io/docs/', 'Redis docs')],
  'tool-elastic': [D('https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html', 'Elasticsearch docs')],
  'tool-kafka': [D('https://kafka.apache.org/documentation/', 'Kafka docs')],
  'tool-rabbit': [D('https://www.rabbitmq.com/documentation.html', 'RabbitMQ docs')],
  'tool-pulsar': [D('https://pulsar.apache.org/docs/', 'Pulsar docs')],
  'tool-spark': [D('https://spark.apache.org/docs/latest/', 'Spark docs')],
  'tool-flink': [D('https://nightlies.apache.org/flink/flink-docs-stable/', 'Flink docs')],
  'tool-airflow': [D('https://airflow.apache.org/docs/', 'Airflow docs')],
  'tool-dbt': [D('https://docs.getdbt.com/', 'dbt docs')],
  'tool-snowflake': [D('https://docs.snowflake.com/', 'Snowflake docs')],
  'tool-bigquery': [D('https://cloud.google.com/bigquery/docs', 'BigQuery docs')],
  'tool-databricks': [D('https://docs.databricks.com/', 'Databricks docs')],
  'tool-delta': [D('https://docs.delta.io/latest/index.html', 'Delta Lake docs')],
  'tool-iceberg': [D('https://iceberg.apache.org/docs/latest/', 'Apache Iceberg docs')],
  'tool-hudi': [D('https://hudi.apache.org/docs/overview', 'Apache Hudi docs')],
  'tool-mlflow': [D('https://mlflow.org/docs/latest/index.html', 'MLflow docs')],
  'tool-kubeflow': [D('https://www.kubeflow.org/docs/', 'Kubeflow docs')],
  'tool-feast': [D('https://docs.feast.dev/', 'Feast docs')],
  'tool-bentoml': [D('https://docs.bentoml.org/', 'BentoML docs')],
  'tool-kserve': [D('https://kserve.github.io/website/', 'KServe docs')],
  'tool-ray': [D('https://docs.ray.io/', 'Ray docs')],
  'tool-dvc': [D('https://dvc.org/doc', 'DVC docs')],
  'tool-wandb': [D('https://docs.wandb.ai/', 'Weights & Biases docs')],
  'tool-hf': [D('https://huggingface.co/docs', 'Hugging Face docs')],
  'tool-langchain': [D('https://python.langchain.com/docs/', 'LangChain docs')],
  'tool-llamaindex': [D('https://docs.llamaindex.ai/', 'LlamaIndex docs')],
  'tool-vllm': [D('https://docs.vllm.ai/', 'vLLM docs')],
  'tool-ollama': [D('https://github.com/ollama/ollama', 'Ollama GitHub')],
  'tool-milvus': [D('https://milvus.io/docs', 'Milvus docs')],
  'tool-weaviate': [D('https://weaviate.io/developers/weaviate', 'Weaviate docs')],
  'tool-pinecone': [D('https://docs.pinecone.io/', 'Pinecone docs')],
  'tool-qdrant': [D('https://qdrant.tech/documentation/', 'Qdrant docs')],
  'tool-chroma': [D('https://docs.trychroma.com/', 'Chroma docs')],
  'tool-opensearch': [D('https://opensearch.org/docs/latest/', 'OpenSearch docs')],

  // ───── Metrics ─────
  'metric-slo': [Bk('https://sre.google/workbook/implementing-slos/', 'Google SRE: Implementing SLOs')],
  'metric-sli': [Bk('https://sre.google/sre-book/service-level-objectives/', 'SRE Book: SLOs and SLIs')],
  'metric-faithfulness': [G('https://github.com/explodinggradients/ragas', 'RAGAS GitHub')],

  // ───── GenAI / Vector ─────
  'genai-rag': [P('https://arxiv.org/abs/2005.11401', 'Original RAG paper')],
  'genai-embeddings': [B('https://platform.openai.com/docs/guides/embeddings', 'OpenAI embeddings guide')],
  'genai-prompt-injection': [B('https://simonwillison.net/series/prompt-injection/', 'Prompt injection — Simon Willison')],
  'vector-hnsw': [P('https://arxiv.org/abs/1603.09320', 'HNSW paper (Malkov & Yashunin)')],
  'vector-ivf': [G('https://github.com/facebookresearch/faiss/wiki/Faiss-indexes', 'FAISS index wiki')],
  'vector-pq': [P('https://hal.inria.fr/inria-00514462v2/document', 'Product Quantization paper (Jégou et al.)')],
  'vector-diskann': [G('https://github.com/microsoft/DiskANN', 'Microsoft DiskANN')],
  'llm-paged-attention': [P('https://arxiv.org/abs/2309.06180', 'PagedAttention paper (vLLM)')],
  'llm-speculative-decoding': [P('https://arxiv.org/abs/2211.17192', 'Speculative decoding paper')],

  // ───── Streaming ─────
  'stream-event-time': [B('https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/', 'Streaming 101 — Akidau')],
  'stream-eos': [B('https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/', 'Exactly-once in Kafka')],

  // ───── Observability ─────
  'observ-slo': [Bk('https://sre.google/workbook/implementing-slos/', 'Implementing SLOs')],
  'observ-error-budget': [Bk('https://sre.google/workbook/error-budget-policy/', 'Error budget policy')],
  'observ-burn-rate': [Bk('https://sre.google/workbook/alerting-on-slos/', 'Alerting on SLOs')],

  // ───── MLOps ─────
  'mlops-feature-store': [B('https://www.featurestore.org/', 'featurestore.org')],
  'mlops-shadow': [B('https://martinfowler.com/articles/cd4ml.html', 'CD4ML — Fowler')],
  'mlops-canary': [B('https://martinfowler.com/bliki/CanaryRelease.html', 'Canary release — Fowler')],
};

// Build a stable Google search URL for any node — used as the universal
// fallback when no curated resources exist.
export function googleFallback(nodeName: string, domainName?: string): ResourceLink {
  const q = encodeURIComponent(
    domainName ? `${nodeName} ${domainName}` : nodeName,
  );
  return {
    kind: 'search',
    label: 'Search the web',
    url: `https://www.google.com/search?q=${q}`,
  };
}
