import { domainNode, subNode, conceptNode } from './_helpers';
import type { GNode } from '../schema';

const D = 'system-design';

export const systemDesignNodes: GNode[] = [
  domainNode(
    D,
    'System Design',
    'The discipline of decomposing real-world product requirements into components, data flows, contracts, and tradeoffs that survive scale, change, and failure.',
    'Every senior+ engineer is expected to design systems whose constraints — load, latency, durability, consistency, team boundaries — are explicit and defensible. The interview tests it because the job demands it.',
    'A system design is a set of decisions about what to put where, in what order, with what failure modes. The right answer is the one whose tradeoffs match the requirements you uncovered.',
  ),

  subNode(D, 'Requirements & constraints', D, 'Functional, non-functional, and business constraints that shape every decision.', 'Most bad designs come from skipping this step. Numbers like RPS, p99 latency, durability, and read/write ratio change everything.', { id: 'sd-requirements' }),
  subNode(D, 'Architecture styles', D, 'Macro-shape: monolith, modular monolith, microservices, event-driven, serverless.', 'Sets the operational and organizational cost ceiling of the whole system.', { id: 'sd-architecture' }),
  subNode(D, 'Load balancing & routing', D, 'How traffic is distributed across instances, regions, and tiers.', 'Determines fault isolation, failure radius, and the latency floor.', { id: 'sd-load-balancing' }),
  subNode(D, 'Storage choices', D, 'Picking the right store(s): relational, KV, document, search, OLAP, blob, queue.', 'Storage is the hardest decision to reverse. Get the access patterns right first.', { id: 'sd-storage' }),
  subNode(D, 'Event-driven architecture', D, 'Decoupling components by emitting and reacting to events.', 'Reshapes coupling, deploy independence, and reliability semantics — often more than any other decision.', { id: 'sd-event-arch' }),
  subNode(D, 'Multi-tenancy', D, 'Serving many customers from shared infra with isolation, fairness, and metering.', 'Most SaaS businesses live or die by their multi-tenancy story.', { id: 'sd-multitenant' }),

  conceptNode('sd-functional-reqs', 'Functional requirements', D, 'sd-requirements', 'What the system must do — features, workflows, user actions.', {
    whyItMatters: 'Defines API contracts and product surface area; if you can\'t list them as nouns and verbs, you can\'t design for them.',
    mentalModel: 'A list of "users can…" sentences. Each one implies state, an API, and a failure mode.',
    designQuestions: ['Who are the actors and what can each one do?', 'Which actions are idempotent and which are not?'],
    tags: ['requirements'],
    interviewRelevance: 5,
  }),
  conceptNode('sd-nonfunctional-reqs', 'Non-functional requirements', D, 'sd-requirements', 'Latency, throughput, availability, durability, consistency, cost.', {
    whyItMatters: 'These numbers select your architecture. p99 = 50ms forbids most of what p99 = 2s allows.',
    mentalModel: 'Think of NFRs as a budget the architecture must spend wisely.',
    designQuestions: ['What is p99 for the hottest endpoint?', 'What durability are we promising? Per what failure model?'],
    metricsToMonitor: ['Latency p95/p99', 'Availability', 'Durability', 'Cost per request'],
    interviewRelevance: 5,
  }),
  conceptNode('sd-back-of-envelope', 'Back-of-the-envelope estimation', D, 'sd-requirements', 'Order-of-magnitude calculations for storage, bandwidth, QPS, and cost.', {
    whyItMatters: 'Surfaces design constraints before you commit to an approach. A 10x estimate gap changes the entire system.',
    mentalModel: 'Use round numbers, write them down, and bound the unknown with high/low scenarios.',
    designQuestions: ['What\'s the data volume per day at p50 and p99 user growth?', 'What\'s the storage cost over 12 months?'],
    interviewRelevance: 5,
  }),
  conceptNode('sd-capacity-planning', 'Capacity planning', D, 'sd-requirements', 'Translating expected load into concrete infra requirements with headroom.', {
    whyItMatters: 'Saturated systems behave nonlinearly. You buy capacity so failure doesn\'t become outage.',
    tradeoffs: ['Over-provision = cost; under-provision = SLO risk', 'Static vs auto-scale headroom'],
    metricsToMonitor: ['Saturation (CPU/memory/IO)', 'Headroom %', 'Cost per request'],
  }),

  conceptNode('sd-l4-l7', 'L4 vs L7 load balancing', D, 'sd-load-balancing', 'L4 routes by IP/port; L7 understands HTTP, headers, paths.', {
    whyItMatters: 'L7 lets you route by tenant/customer; L4 is cheaper and protocol-agnostic.',
    tradeoffs: ['L4 less CPU; L7 richer routing', 'L7 needs TLS termination decision (where to do it)'],
    useCases: ['L4 for raw TCP/UDP', 'L7 for HTTP-aware routing, mTLS, header rewrites'],
    failureModes: ['Sticky sessions hide instance health', 'Health checks not representative of real traffic'],
    relatedIds: ['pat-api-gateway'],
  }),
  conceptNode('sd-anycast', 'Anycast & global routing', D, 'sd-load-balancing', 'Same IP advertised from multiple regions; BGP routes users to the nearest.', {
    whyItMatters: 'Single most effective way to reduce TCP/TLS RTT for global users.',
    tradeoffs: ['Operational complexity', 'Less control over which region a user hits'],
    useCases: ['CDN edge', 'Global API edges'],
    failureModes: ['Asymmetric routing breaks long-lived connections', 'BGP misconfig causes blackholes'],
  }),
  conceptNode('sd-rate-limiting', 'Rate limiting', D, 'sd-load-balancing', 'Cap request rate per key/tenant via token bucket or sliding window.', {
    whyItMatters: 'Protects downstream from abusive traffic and ensures fairness in multi-tenant systems.',
    tradeoffs: ['Per-instance vs centralized counter (Redis)', 'Strictness vs user pain'],
    failureModes: ['Limiter is a bottleneck', 'Wrong limit blocks legitimate burst traffic'],
    metricsToMonitor: ['Throttle rate per key', 'Latency added by limiter'],
    relatedIds: ['pat-rate-limit'],
    interviewRelevance: 5,
  }),
  conceptNode('sd-cdn', 'CDN strategy', D, 'sd-load-balancing', 'Edge caching of static and dynamic content close to users.', {
    whyItMatters: 'Cuts origin load and global latency by orders of magnitude. Often the cheapest win.',
    tradeoffs: ['Cache invalidation is hard', 'Dynamic content needs careful key design'],
    failureModes: ['Stale content on releases', 'Origin overload when CDN purges'],
  }),

  conceptNode('sd-monolith', 'Monolith / modular monolith', D, 'sd-architecture', 'One deployable; modular monolith adds internal boundaries.', {
    whyItMatters: 'Best default for most companies; carries microservice benefits with a fraction of the ops cost.',
    relatedIds: ['pat-modulith', 'pat-microservices'],
    interviewRelevance: 5,
  }),
  conceptNode('sd-microservices', 'Microservices', D, 'sd-architecture', 'Independently deployable services aligned with bounded contexts.', {
    whyItMatters: 'Org-scaling tool; misapplied, becomes a distributed monolith.',
    relatedIds: ['pat-microservices'],
  }),
  conceptNode('sd-event-arch-concept', 'Event-driven decoupling', D, 'sd-event-arch', 'Producers emit events; consumers react asynchronously.', {
    whyItMatters: 'Removes synchronous coupling, enables fan-out, enables replay.',
    tradeoffs: ['Eventual consistency', 'Operational complexity', 'Debugging without traces is brutal'],
    relatedIds: ['msg-log', 'pat-rag'],
    interviewRelevance: 5,
  }),

  conceptNode('sd-write-heavy', 'Write-heavy vs read-heavy', D, 'sd-storage', 'Different ratios demand different architectures: caches, replicas, partitioning.', {
    whyItMatters: 'A wrong assumption here mis-allocates compute and storage.',
    designQuestions: ['What\'s the read:write ratio per object class?', 'Which reads can tolerate staleness?'],
  }),
  conceptNode('sd-blob-storage', 'Blob storage', D, 'sd-storage', 'Object storage (S3/GCS) for large immutable blobs at near-infinite scale.', {
    whyItMatters: 'The cheapest, most durable storage tier in cloud. Foundation of lakehouses and ML data.',
    tradeoffs: ['Eventual consistency (historically; now strong)', 'High latency per op vs in-cluster disk'],
  }),

  conceptNode('sd-tenant-isolation', 'Tenant isolation', D, 'sd-multitenant', 'Shared, partitioned, or siloed depending on isolation requirements.', {
    whyItMatters: 'Determines blast radius, performance fairness, and compliance.',
    tradeoffs: ['Cost vs isolation strength', 'Operational complexity vs flexibility'],
    designQuestions: ['Can a noisy tenant impact others?', 'Which data must be physically separated for compliance?'],
  }),
  conceptNode('sd-tenant-metering', 'Usage metering', D, 'sd-multitenant', 'Capturing per-tenant usage events for billing and quota enforcement.', {
    whyItMatters: 'Drives revenue accuracy and the ability to enforce limits.',
    failureModes: ['Double-counting on retry', 'Lost events on outages'],
    designQuestions: ['Is metering exactly-once or at-least-once with dedupe?'],
  }),
];
