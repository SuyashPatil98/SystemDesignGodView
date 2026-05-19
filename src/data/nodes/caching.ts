import { domainNode, subNode, conceptNode } from './_helpers';
import type { GNode } from '../schema';

const D = 'caching';

export const cachingNodes: GNode[] = [
  domainNode(
    D,
    'Caching',
    'Trading staleness for speed by storing hot data closer to where it\'s used.',
    'Caching is the cheapest performance win in most systems — and the source of the trickiest bugs. Master the patterns and you master 80% of performance work.',
    'A cache is a contract: I promise to be fast, you accept that I might be a little wrong. Everything else is invalidation.',
  ),

  subNode(D, 'Cache stores', D, 'Where the cache lives: in-process, distributed, CDN.', 'Each tier has different latency, scale, and invalidation properties.', { id: 'cache-stores' }),
  subNode(D, 'Strategies', D, 'Cache-aside, write-through, write-behind, read-through.', 'Determines what goes wrong when something goes wrong.', { id: 'cache-strategy' }),
  subNode(D, 'Eviction & TTL', D, 'LRU, LFU, FIFO; time-based expiration.', 'Controls cache effectiveness and memory pressure.', { id: 'cache-eviction' }),
  subNode(D, 'Invalidation', D, 'Keeping cache and source-of-truth in sync.', 'The hardest problem in computer science — for a reason.', { id: 'cache-invalidation' }),
  subNode(D, 'Failure modes', D, 'Stampedes, hot keys, inconsistency, corrupt cache.', 'Cache problems often present as DB problems.', { id: 'cache-failures' }),

  conceptNode('cache-aside', 'Cache-aside (lazy loading)', D, 'cache-strategy', 'App checks cache; on miss, fetches from DB and populates.', {
    whyItMatters: 'Most common pattern; app fully owns consistency.',
    tradeoffs: ['First request is slow', 'Stale data possible without invalidation strategy'],
    failureModes: ['Cache stampede on cold start', 'Forgetting to invalidate on write'],
    designQuestions: ['What\'s your invalidation on write?', 'What TTL is acceptable for staleness?'],
    interviewRelevance: 5,
  }),
  conceptNode('cache-write-through', 'Write-through', D, 'cache-strategy', 'Writes go to cache and DB synchronously.', {
    whyItMatters: 'Cache always fresh; cost is extra write latency.',
    tradeoffs: ['Slower writes; simpler reads'],
    failureModes: ['Partial failure between cache and DB writes'],
  }),
  conceptNode('cache-write-behind', 'Write-behind / write-back', D, 'cache-strategy', 'Writes hit cache first; flushed to DB asynchronously.', {
    whyItMatters: 'Fastest write path; trades durability for speed.',
    failureModes: ['Cache crash before flush = data loss.', 'Backpressure if DB is slow.'],
  }),
  conceptNode('cache-read-through', 'Read-through', D, 'cache-strategy', 'Cache itself loads from DB on miss, transparent to app.', {
    whyItMatters: 'Simpler app code; tighter coupling between cache and DB layer.',
  }),

  conceptNode('cache-cdn', 'CDN edge cache', D, 'cache-stores', 'Caches content close to users at the network edge.', {
    whyItMatters: 'Lowest-latency caching tier; reduces origin load by orders of magnitude.',
    tradeoffs: ['Hard to invalidate globally', 'Dynamic content needs careful cache keys'],
  }),
  conceptNode('cache-in-process', 'In-process cache', D, 'cache-stores', 'Cache inside the app process (Caffeine, sync-map).', {
    whyItMatters: 'Sub-microsecond latency; no network hop.',
    failureModes: ['Per-instance staleness; cold on restart'],
  }),
  conceptNode('cache-distributed', 'Distributed cache', D, 'cache-stores', 'External shared cache like Redis or Memcached.', {
    whyItMatters: 'Consistent across instances; reusable across services.',
    failureModes: ['Network blip = cache stampede', 'Memory pressure → eviction storms'],
    relatedIds: ['tool-redis'],
  }),

  conceptNode('cache-lru', 'LRU eviction', D, 'cache-eviction', 'Evict the least-recently-used entry on capacity pressure.', {
    whyItMatters: 'Default for most caches; works well when access has temporal locality.',
  }),
  conceptNode('cache-lfu', 'LFU eviction', D, 'cache-eviction', 'Evict the least-frequently-used entry.', {
    whyItMatters: 'Better when hot keys stay hot; trickier to maintain.',
  }),
  conceptNode('cache-ttl', 'TTL & jitter', D, 'cache-eviction', 'Expire entries after a duration; add randomization to avoid mass expiry.', {
    whyItMatters: 'Aligned TTLs cause thundering herds; jitter fixes it cheaply.',
    failureModes: ['Aligned TTLs = synchronized stampede', 'Too short TTL = no cache benefit'],
  }),

  conceptNode('cache-stampede-concept', 'Cache stampede', D, 'cache-failures', 'On TTL expiry, all clients miss simultaneously and overload origin.', {
    whyItMatters: 'Most common production cache failure.',
    useCases: ['Probabilistic early expiry', 'Request coalescing / singleflight', 'Stale-while-revalidate'],
    relatedIds: ['fm-cache-stampede'],
  }),
  conceptNode('cache-coalescing', 'Request coalescing (singleflight)', D, 'cache-failures', 'When N requests miss the same key, only the first hits origin; the rest wait.', {
    whyItMatters: 'The single best defense against stampede.',
  }),
  conceptNode('cache-stale-revalidate', 'Stale-while-revalidate', D, 'cache-failures', 'Serve stale content while a background refresh updates the cache.', {
    whyItMatters: 'Eliminates user-visible misses for hot keys.',
  }),
  conceptNode('cache-key-design', 'Cache key design', D, 'cache-strategy', 'How keys encode tenant, version, and query — and how that affects invalidation.', {
    whyItMatters: 'Bad keys make invalidation impossible. Plan for evolution.',
    designQuestions: ['Will the key change when the underlying data shape changes?'],
  }),
];
