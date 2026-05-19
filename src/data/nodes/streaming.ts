import { domainNode, subNode, conceptNode } from './_helpers';
import type { GNode } from '../schema';

const D = 'streaming';

export const streamingNodes: GNode[] = [
  domainNode(
    D,
    'Streaming Systems',
    'Continuous computation over unbounded data streams, with event-time semantics and stateful operations.',
    'Streaming makes real-time experiences possible: fresh features, live dashboards, fraud detection, copilots.',
    'A stream is a never-ending table. Operations are continuous queries that update as new rows arrive.',
  ),

  subNode(D, 'Engines', D, 'Flink, Spark Structured Streaming, Kafka Streams, Beam.', 'Engine choice drives correctness, throughput, and operability.', { id: 'stream-engines' }),
  subNode(D, 'Time semantics', D, 'Event time vs processing time vs ingestion time.', 'Foundation of correctness in streaming.', { id: 'stream-time' }),
  subNode(D, 'State management', D, 'Keyed state, checkpoints, savepoints.', 'Stateful streaming is what makes Flink different from naive consumers.', { id: 'stream-state' }),
  subNode(D, 'Windowing', D, 'Tumbling, sliding, session windows.', 'How you turn a stream into a finite computation.', { id: 'stream-windows' }),
  subNode(D, 'Delivery & exactly-once', D, 'Checkpoints + transactional sinks for end-to-end exactly-once.', 'When the business demands no double counting.', { id: 'stream-delivery' }),
  subNode(D, 'Patterns', D, 'Kappa, materialized views, CEP.', 'Reusable shapes for streaming architectures.', { id: 'stream-patterns' }),

  conceptNode('stream-event-time', 'Event time & watermarks', D, 'stream-time', 'Process events by when they happened, not when received; watermarks bound lateness.', {
    whyItMatters: 'The only way to produce correct results over out-of-order data.',
    failureModes: ['Watermark stalls if one partition slows; idle partitions never advance.'],
    interviewRelevance: 5,
  }),
  conceptNode('stream-watermark-strategies', 'Watermark strategies', D, 'stream-time', 'Bounded out-of-orderness vs per-partition vs ingestion.', {
    whyItMatters: 'Wrong strategy = lost late events or stuck windows.',
  }),
  conceptNode('stream-late-data', 'Late data handling', D, 'stream-time', 'Drop, route to late-output stream, or update via allowed lateness.', {
    whyItMatters: 'Production streams always have late data; design for it.',
  }),

  conceptNode('stream-tumbling', 'Tumbling windows', D, 'stream-windows', 'Fixed-size, non-overlapping windows.', {
    whyItMatters: 'Standard for periodic aggregations (per-minute counts).',
  }),
  conceptNode('stream-sliding', 'Sliding windows', D, 'stream-windows', 'Fixed-size with overlap; emits more frequently.', {
    whyItMatters: 'Smoother metrics for dashboards and alerts.',
    tradeoffs: ['Higher state cost than tumbling.'],
  }),
  conceptNode('stream-session', 'Session windows', D, 'stream-windows', 'Group events into sessions separated by inactivity.', {
    whyItMatters: 'Models user behavior naturally — clickstream, gameplay.',
  }),

  conceptNode('stream-checkpoint', 'Checkpoints', D, 'stream-state', 'Periodic snapshots of all operator state for crash recovery.', {
    whyItMatters: 'The basis of stateful exactly-once.',
    failureModes: ['Backpressure delays checkpoints; long checkpoints amplify recovery time.'],
  }),
  conceptNode('stream-keyed-state', 'Keyed state', D, 'stream-state', 'State partitioned by key, co-located with the key\'s events.', {
    whyItMatters: 'Lets you scale stateful logic the same way you scale topics.',
  }),
  conceptNode('stream-state-backend', 'State backends (RocksDB)', D, 'stream-state', 'Where keyed state lives — in-heap or out-of-process.', {
    whyItMatters: 'RocksDB enables huge state; in-heap is faster but bounded.',
  }),

  conceptNode('stream-eos', 'End-to-end exactly-once', D, 'stream-delivery', 'Source replays + transactional sink + checkpoints = no duplicate side effects.', {
    whyItMatters: 'Required for financial and metering workloads.',
    failureModes: ['Sink not transactional → duplicates leak out.'],
    relatedIds: ['msg-exactly-once'],
    interviewRelevance: 5,
  }),
  conceptNode('stream-replay', 'Reprocessing & replay', D, 'stream-delivery', 'Reset offsets to reprocess history with new logic.', {
    whyItMatters: 'Lets you backfill streaming jobs without a separate batch pipeline.',
  }),

  conceptNode('stream-cep', 'Complex event processing (CEP)', D, 'stream-patterns', 'Pattern matching across streams (e.g., login then suspicious action within X).', {
    whyItMatters: 'Captures business rules natively in the streaming engine.',
  }),
  conceptNode('stream-mvs', 'Streaming materialized views', D, 'stream-patterns', 'Maintain derived tables continuously as inputs change.', {
    whyItMatters: 'Replaces many ETL-then-serve patterns with one always-fresh table.',
    relatedIds: ['pat-kappa-arch'],
  }),
];
