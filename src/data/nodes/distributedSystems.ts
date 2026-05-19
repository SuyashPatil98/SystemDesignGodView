import { domainNode, subNode, conceptNode } from './_helpers';
import type { GNode } from '../schema';

const D = 'distributed-systems';

export const distributedSystemsNodes: GNode[] = [
  domainNode(
    D,
    'Distributed Systems',
    'Coordinating computation across machines and networks that fail independently, partially, and silently.',
    'Every system above one machine is distributed. The principles — consistency, availability, partition tolerance, time, ordering, consensus — apply everywhere from databases to ML platforms.',
    'In a distributed system, anything that can happen will happen. Design for partial failure, not for the happy path.',
  ),

  subNode(D, 'Consistency models', D, 'Guarantees about what writes are visible to subsequent reads.', 'Picks the contract between your storage and the rest of your system.', { id: 'ds-consistency' }),
  subNode(D, 'Coordination & consensus', D, 'Agreement among nodes on values, leaders, or order.', 'The hardest sub-problem of distributed systems — and the basis of every reliable system.', { id: 'ds-coordination' }),
  subNode(D, 'Time, ordering, and causality', D, 'Logical clocks, hybrid logical clocks, version vectors.', 'Time is not a global truth across nodes. Get ordering right or get bugs.', { id: 'ds-time' }),
  subNode(D, 'Resilience patterns', D, 'Retries, circuit breakers, bulkheads, hedging, load shedding.', 'The library every senior engineer carries to keep partial failure from becoming outage.', { id: 'ds-resilience' }),
  subNode(D, 'Failure modes', D, 'Cascading failures, split brain, partitions, thundering herds.', 'Knowing the failure modes is how you avoid them.', { id: 'ds-failure' }),
  subNode(D, 'Platform & service mesh', D, 'Sidecars and meshes for retries, mTLS, traffic shaping.', 'Pushes resilience and security out of app code into platform.', { id: 'ds-platform' }),

  conceptNode('ds-cap', 'CAP & PACELC', D, 'ds-consistency', 'During a partition you can have consistency or availability — and even without, you trade latency for consistency.', {
    whyItMatters: 'The vocabulary every system inherits. Use it to be honest about what you cannot deliver.',
    mentalModel: 'CAP is too coarse — PACELC adds the everyday tradeoff between latency and consistency.',
    tradeoffs: ['CP systems sacrifice availability under partition (e.g., Spanner read latency)', 'AP systems return stale data (Cassandra QUORUM)'],
    designQuestions: ['Under partition, what does this system return?'],
    relatedIds: ['to-strong-eventual'],
    interviewRelevance: 5,
  }),
  conceptNode('ds-linearizable', 'Linearizability', D, 'ds-consistency', 'All ops appear to take effect instantly at some point between invocation and response.', {
    whyItMatters: 'Strongest single-object guarantee — what users intuitively expect from "the database".',
    tradeoffs: ['Requires consensus or single-leader; costlier latency.'],
    failureModes: ['Read-your-writes broken on stale replicas if "linearizable" is faked.'],
    interviewRelevance: 5,
  }),
  conceptNode('ds-serializable', 'Serializability', D, 'ds-consistency', 'Multi-key transactions equivalent to some serial order.', {
    whyItMatters: 'The strongest transactional isolation; what most app developers actually want.',
    tradeoffs: ['Strict 2PL: blocking; OCC: aborts on conflict; SI: write skew.'],
    relatedIds: ['db-tx'],
  }),
  conceptNode('ds-eventual', 'Eventual consistency', D, 'ds-consistency', 'Replicas converge to the same state given no new writes.', {
    whyItMatters: 'The default of high-availability systems; you must surface staleness to users intentionally.',
    failureModes: ['Read-your-writes anomalies', 'Monotonic-read anomalies'],
  }),
  conceptNode('ds-causal', 'Causal consistency', D, 'ds-consistency', 'Causally related ops appear in the same order to every observer.', {
    whyItMatters: 'Sweet spot for many social/comment systems: weaker than linearizable but no causal anomalies.',
  }),

  conceptNode('ds-raft', 'Raft', D, 'ds-coordination', 'Understandable consensus algorithm: leader election + log replication + safety.', {
    whyItMatters: 'Powers most modern consensus systems (etcd, Consul, TiKV).',
    relatedIds: ['ds-paxos'],
    interviewRelevance: 5,
  }),
  conceptNode('ds-paxos', 'Paxos / Multi-Paxos', D, 'ds-coordination', 'Earlier consensus protocol; harder to understand, same guarantees.', {
    whyItMatters: 'Theoretical baseline; many systems still use Paxos variants (Chubby, Spanner).',
  }),
  conceptNode('ds-leader-election', 'Leader election', D, 'ds-coordination', 'Selecting one node to coordinate writes, partition assignments, etc.', {
    whyItMatters: 'Underpins primary-secondary replication, partition assignment, lock services.',
    failureModes: ['Split brain without quorum', 'Stale leader after partition'],
  }),
  conceptNode('ds-2pc', 'Two-phase commit (2PC)', D, 'ds-coordination', 'Prepare/commit protocol across participants.', {
    whyItMatters: 'Classic distributed transaction; brittle because coordinator failure leaves participants blocked.',
    failureModes: ['Coordinator crash holds locks; rarely used in modern systems vs sagas.'],
    relatedIds: ['pat-saga'],
  }),

  conceptNode('ds-logical-clocks', 'Logical & Lamport clocks', D, 'ds-time', 'Monotonic counters that preserve happens-before.', {
    whyItMatters: 'Lets you reason about order without wall-clock trust.',
  }),
  conceptNode('ds-hlc', 'Hybrid logical clocks', D, 'ds-time', 'Combine physical and logical time for tight bounds.', {
    whyItMatters: 'Used in CockroachDB and YugabyteDB to support consistent reads at a snapshot.',
  }),
  conceptNode('ds-vector-clocks', 'Vector clocks & version vectors', D, 'ds-time', 'Track per-node counters to detect concurrent updates.', {
    whyItMatters: 'Foundation for conflict detection in Dynamo-style eventual consistency.',
  }),

  conceptNode('ds-retries-jitter', 'Retries with exponential backoff + jitter', D, 'ds-resilience', 'Re-send failed requests, capped, with randomized delays.', {
    whyItMatters: 'Done wrong, retries amplify failure. Done right, they recover transient blips invisibly.',
    failureModes: ['Retry storms; thundering herds without jitter.'],
    relatedIds: ['pat-retry-backoff', 'fm-retry-storm'],
    interviewRelevance: 5,
  }),
  conceptNode('ds-circuit-breaker', 'Circuit breaker', D, 'ds-resilience', 'Open the circuit after error threshold to fail fast instead of piling up.', {
    whyItMatters: 'Single most effective pattern to prevent cascade.',
    relatedIds: ['pat-circuit-breaker', 'fm-cascading'],
    interviewRelevance: 5,
  }),
  conceptNode('ds-bulkhead', 'Bulkhead', D, 'ds-resilience', 'Isolate resources per dependency or tenant.', {
    whyItMatters: 'A failing partition doesn\'t take down the rest.',
    relatedIds: ['pat-bulkhead'],
  }),
  conceptNode('ds-hedging', 'Request hedging', D, 'ds-resilience', 'Send a duplicate request to a second replica after a tail-latency threshold.', {
    whyItMatters: 'Trades a small extra load for big p99 wins, especially in tail-sensitive systems.',
    failureModes: ['Hedging amplifies load during overload; cancel correctly.'],
  }),
  conceptNode('ds-load-shed', 'Load shedding', D, 'ds-resilience', 'Reject low-priority traffic to preserve high-priority under overload.', {
    whyItMatters: 'Predictable degradation under overload beats stochastic collapse.',
    relatedIds: ['pat-load-shed'],
  }),
  conceptNode('ds-idempotency', 'Idempotency', D, 'ds-resilience', 'Designing operations so a retry never causes side-effects beyond the first.', {
    whyItMatters: 'Underpins safe retries, exactly-once semantics, and at-least-once consumers.',
    designQuestions: ['Do we have an idempotency key per request?', 'Where do we deduplicate?'],
    interviewRelevance: 5,
  }),

  conceptNode('ds-replication-strategies', 'Replication strategies', D, 'ds-consistency', 'Single-leader, multi-leader, leaderless — each with consistency tradeoffs.', {
    whyItMatters: 'Choice changes write semantics, availability, and operational complexity.',
    tradeoffs: ['Single-leader: simple; primary is SPOF.', 'Multi-leader: harder conflict resolution.', 'Leaderless (Dynamo): R+W>N for read-after-write.'],
    relatedIds: ['db-replication'],
  }),
];
