import { domainNode, subNode, conceptNode } from './_helpers';
import type { GNode } from '../schema';

const D = 'messaging';

export const messagingNodes: GNode[] = [
  domainNode(
    D,
    'Messaging & Event-Driven',
    'Asynchronous coordination via durable logs, queues, and pub/sub.',
    'Asynchrony is how systems decouple, scale, and survive. Logs and queues are the substrate of every modern data and microservice architecture.',
    'A queue is a buffer between producers and consumers; a log is a replayable history of facts. Choose the model that fits the workload.',
  ),

  subNode(D, 'Log-based (Kafka-style)', D, 'Append-only ordered log; consumers track offsets.', 'Replay, multi-consumer fan-out, exactly-once with state — the default modern backbone.', { id: 'msg-log' }),
  subNode(D, 'Queue-based', D, 'Message-at-a-time queues with per-message acks.', 'Best for task distribution and rich routing.', { id: 'msg-queues' }),
  subNode(D, 'Delivery semantics', D, 'At-most-once, at-least-once, exactly-once.', 'Picks what your consumers must defend against.', { id: 'msg-delivery' }),
  subNode(D, 'Monitoring', D, 'Lag, depth, error rate, partition skew.', 'The most important class of metrics nobody watches.', { id: 'msg-monitoring' }),

  conceptNode('msg-partitions', 'Partitions & ordering', D, 'msg-log', 'Topic is split into partitions; order is guaranteed per partition, not globally.', {
    whyItMatters: 'You design the key schema to align with where order matters.',
    tradeoffs: ['More partitions = more parallelism but also more rebalances'],
    failureModes: ['Partition skew; rebalance storms'],
    interviewRelevance: 5,
  }),
  conceptNode('msg-consumer-groups', 'Consumer groups', D, 'msg-log', 'Group of consumers cooperatively reading a topic — each partition to one consumer.', {
    whyItMatters: 'Lets you scale horizontally and tolerate consumer failures.',
    failureModes: ['Rebalance pauses; lag amplification on rebalance'],
  }),
  conceptNode('msg-offsets', 'Offsets & commit strategies', D, 'msg-log', 'Consumers track which messages have been processed.', {
    whyItMatters: 'Determines delivery guarantees and replay behavior.',
    tradeoffs: ['Commit before process = at-most-once', 'Commit after process = at-least-once'],
  }),
  conceptNode('msg-retention', 'Retention & compaction', D, 'msg-log', 'Time- or size-based retention vs key-based log compaction.', {
    whyItMatters: 'Compaction lets the log act like a versioned state store.',
  }),
  conceptNode('msg-schema-registry', 'Schema registry', D, 'msg-log', 'Central registry enforcing message schemas and compatibility.', {
    whyItMatters: 'Prevents producer changes from silently breaking consumers — the most common source of data outages.',
    relatedIds: ['fm-schema-drift'],
  }),

  conceptNode('msg-exchange', 'Exchanges & routing', D, 'msg-queues', 'AMQP-style flexible routing: direct, topic, fanout, headers.', {
    whyItMatters: 'Solves rich pub/sub patterns without per-consumer wiring.',
  }),
  conceptNode('msg-dlq', 'Dead-letter queue (DLQ)', D, 'msg-queues', 'Queue for messages that repeatedly fail processing.', {
    whyItMatters: 'Stops poison messages from blocking partitions; gives a place to investigate.',
    failureModes: ['Silent DLQ growth — alarm on DLQ size!'],
  }),
  conceptNode('msg-fanout', 'Fan-out', D, 'msg-queues', 'One event delivered to many independent consumers.', {
    whyItMatters: 'Enables decoupled processing of the same event by many downstream services.',
  }),

  conceptNode('msg-at-most-once', 'At-most-once', D, 'msg-delivery', 'Messages may be lost; never delivered twice.', {
    whyItMatters: 'Acceptable for non-critical telemetry; never for money or auth.',
  }),
  conceptNode('msg-at-least-once', 'At-least-once + idempotency', D, 'msg-delivery', 'Messages always delivered; may be duplicated.', {
    whyItMatters: 'The honest default. Idempotent consumers make it equivalent to exactly-once.',
    designQuestions: ['Do you have idempotency keys?', 'Where is the dedupe state stored?'],
    interviewRelevance: 5,
  }),
  conceptNode('msg-exactly-once', 'Exactly-once semantics', D, 'msg-delivery', 'Each event affects state exactly once — requires transactional producer + consumer.', {
    whyItMatters: 'Powerful but constrained to specific systems (Kafka EOS, Flink + Kafka).',
    failureModes: ['"EOS" framed across system boundaries usually isn\'t actually EO.'],
  }),
  conceptNode('msg-backpressure', 'Backpressure', D, 'msg-monitoring', 'Slowing producers when consumers can\'t keep up.', {
    whyItMatters: 'Without it, queues grow until something breaks.',
    relatedIds: ['fm-queue-backlog'],
  }),
];
