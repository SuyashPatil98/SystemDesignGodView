import { domainNode, subNode, conceptNode } from './_helpers';
import type { GNode } from '../schema';

const D = 'databases';

export const databasesNodes: GNode[] = [
  domainNode(
    D,
    'Databases',
    'Durable, queryable storage with explicit guarantees about transactions, consistency, and performance.',
    'The most consequential and least reversible decision in a system. Wrong store = years of pain.',
    'A database is a contract: what it promises about durability, consistency, and access patterns. Match contract to workload.',
  ),

  subNode(D, 'Relational', D, 'Row-oriented stores with SQL, joins, and ACID.', 'The right default unless you can prove otherwise.', { id: 'db-relational' }),
  subNode(D, 'Document', D, 'JSON-like documents with flexible schemas.', 'Fits early-stage and aggregate-shaped data well.', { id: 'db-document' }),
  subNode(D, 'Wide-column', D, 'Tunable consistency, multi-region writes, big tables.', 'For write-heavy time-series or massive distributed workloads.', { id: 'db-wide-column' }),
  subNode(D, 'Key-value', D, 'Get/put on a key — simplest and fastest.', 'Cache, session, configuration, and high-throughput lookups.', { id: 'db-kv' }),
  subNode(D, 'Search & full-text', D, 'Inverted indexes for text and analytics queries.', 'When SQL LIKE no longer pays.', { id: 'db-search' }),
  subNode(D, 'Time-series', D, 'Optimized for high-write append + time-range queries.', 'Metrics, IoT, financial ticks.', { id: 'db-tsdb' }),
  subNode(D, 'Graph', D, 'First-class edges with traversal queries.', 'Fraud, knowledge graphs, social, dependency mapping.', { id: 'db-graph' }),
  subNode(D, 'Transactions', D, 'Atomicity, isolation, and durability across multiple writes.', 'The reason relational survived NoSQL hype.', { id: 'db-tx' }),
  subNode(D, 'Replication', D, 'Copies of data across nodes/regions for durability and read scale.', 'Determines availability and read-after-write semantics.', { id: 'db-replication' }),
  subNode(D, 'Sharding & partitioning', D, 'Splitting data across nodes for horizontal scale.', 'Required beyond single-machine limits; hot partitions are the failure mode.', { id: 'db-sharding' }),
  subNode(D, 'Scaling & performance', D, 'Indexes, query plans, caching, vertical and horizontal scaling.', 'The performance work that pays for itself.', { id: 'db-scaling' }),

  conceptNode('db-acid', 'ACID', D, 'db-tx', 'Atomicity, Consistency, Isolation, Durability.', {
    whyItMatters: 'Defines what "transaction" actually means; gives application reasoning a foundation.',
    interviewRelevance: 5,
  }),
  conceptNode('db-isolation-levels', 'Isolation levels', D, 'db-tx', 'Read uncommitted → read committed → repeatable read → serializable.', {
    whyItMatters: 'Each level allows different anomalies. Pick consciously, not by default.',
    tradeoffs: ['Stronger = more locks/aborts; weaker = more anomalies.'],
    failureModes: ['Phantom reads; lost updates under read-committed.'],
    interviewRelevance: 5,
  }),
  conceptNode('db-mvcc', 'MVCC', D, 'db-tx', 'Multi-version concurrency control: readers see a snapshot.', {
    whyItMatters: 'How Postgres and most modern DBs avoid read locks. Cost: vacuum/compaction.',
    failureModes: ['Bloat from long-running tx; vacuum lag.'],
  }),
  conceptNode('db-write-ahead-log', 'Write-ahead log (WAL)', D, 'db-tx', 'Sequential log written before in-place updates; enables crash recovery.', {
    whyItMatters: 'Single mechanism behind durability + replication + point-in-time recovery.',
    metricsToMonitor: ['WAL bytes / sec', 'Replication lag in bytes'],
  }),

  conceptNode('db-leader-follower', 'Leader-follower replication', D, 'db-replication', 'Writes go to leader; followers replay the log.', {
    whyItMatters: 'Default in most relational DBs; simple, scales reads.',
    failureModes: ['Replication lag; failover correctness.'],
  }),
  conceptNode('db-multi-leader', 'Multi-leader replication', D, 'db-replication', 'Writes accepted at multiple nodes; conflicts must be resolved.', {
    whyItMatters: 'Lower-latency writes per region; conflict resolution is hard.',
    failureModes: ['Conflicting updates; last-write-wins data loss.'],
  }),
  conceptNode('db-leaderless', 'Leaderless replication (Dynamo-style)', D, 'db-replication', 'Coordinators broadcast writes to N nodes; reads require W and R such that W + R > N.', {
    whyItMatters: 'High availability; eventual consistency by default.',
  }),
  conceptNode('db-quorum', 'Quorum reads/writes', D, 'db-replication', 'Configure W and R per request to trade consistency for latency.', {
    whyItMatters: 'Lets you tune per-call: strict for money, fast for feeds.',
  }),

  conceptNode('db-hash-partition', 'Hash partitioning', D, 'db-sharding', 'Hash(key) → shard. Even distribution; range queries painful.', {
    whyItMatters: 'Default for KV/cassandra; resists hotspots if hashing is good.',
    failureModes: ['Hot key still hot inside its shard; resharding is expensive.'],
  }),
  conceptNode('db-range-partition', 'Range partitioning', D, 'db-sharding', 'Sort keys then split by ranges.', {
    whyItMatters: 'Cheap range scans; can hot-spot on monotonic keys.',
  }),
  conceptNode('db-consistent-hashing', 'Consistent hashing', D, 'db-sharding', 'Hash keys onto a ring; nodes own arcs.', {
    whyItMatters: 'Re-balances with minimal data movement on node add/remove.',
  }),
  conceptNode('db-hot-key', 'Hot keys & hot partitions', D, 'db-sharding', 'Some keys carry disproportionate traffic.', {
    whyItMatters: 'Defeats horizontal scaling — most-cited interview failure mode.',
    relatedIds: ['fm-hot-partition'],
    interviewRelevance: 5,
  }),

  conceptNode('db-indexes', 'Indexes', D, 'db-scaling', 'Auxiliary structures (B-tree, hash, GIN, GiST, BRIN) that speed lookups.', {
    whyItMatters: 'Wrong indexes are the #1 source of "slow database" tickets.',
    tradeoffs: ['Each index is a write-amplifier and storage cost.'],
    failureModes: ['Missing covering index forces table scans; over-indexed tables slow writes.'],
    interviewRelevance: 4,
  }),
  conceptNode('db-query-plan', 'Query planner & EXPLAIN', D, 'db-scaling', 'Understanding how the DB will execute a query.', {
    whyItMatters: 'The fastest debugging tool you have for DB performance.',
    designQuestions: ['What\'s the planner\'s estimate vs actual rows?'],
  }),
  conceptNode('db-connection-pool', 'Connection pooling', D, 'db-scaling', 'Reuse connections to avoid per-request handshake cost.', {
    whyItMatters: 'Saturated pools are a common outage cause.',
    failureModes: ['Pool exhaustion stalls the service.'],
  }),
  conceptNode('db-read-replicas', 'Read replicas', D, 'db-scaling', 'Followers serving reads to scale beyond the primary.', {
    whyItMatters: 'Cheap horizontal read scale; bring replication lag into your design.',
  }),
  conceptNode('db-cdc', 'CDC (Change Data Capture)', D, 'db-replication', 'Stream of row-level changes from the DB log.', {
    whyItMatters: 'The bridge from OLTP to streaming/lake/analytics — without dual writes.',
    relatedIds: ['stream-engines', 'msg-log'],
  }),
];
