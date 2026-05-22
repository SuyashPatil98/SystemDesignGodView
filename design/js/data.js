/* ───────────────────────────────────────────────────────────────────────────
   GOD VIEW · ATLAS data
   Six thematic regions of modern engineering. Domains and concepts ported
   from the source project. The atlas reads regions like a star chart.
   ─────────────────────────────────────────────────────────────────────────── */

window.ATLAS = (function () {
  const REGIONS = [
    {
      id: 'foundations',
      n: '.01',
      name: 'FOUNDATIONS',
      tagline: 'The first principles · contracts · coordination',
      domains: ['System Design', 'Distributed Systems', 'Backend Engineering', 'API Design'],
    },
    {
      id: 'storage',
      n: '.02',
      name: 'STORAGE & MESSAGING',
      tagline: 'Durable state · queues · the substance of every system',
      domains: ['Databases', 'Caching', 'Messaging & Event-Driven'],
    },
    {
      id: 'devops',
      n: '.03',
      name: 'DEVOPS & CLOUD',
      tagline: 'The runway · the runtime · the eyes on production',
      domains: ['DevOps', 'Cloud Computing', 'Kubernetes', 'Infrastructure as Code', 'CI/CD', 'Observability', 'Security & Reliability'],
    },
    {
      id: 'data',
      n: '.04',
      name: 'DATA',
      tagline: 'Moving and shaping data at scale, reliably',
      domains: ['Data Engineering', 'Data Warehousing', 'Lakes & Lakehouses', 'Streaming Systems', 'Batch Processing'],
    },
    {
      id: 'ml',
      n: '.05',
      name: 'MACHINE LEARNING',
      tagline: 'Functions learned from data · risks · drift · monitoring',
      domains: ['Machine Learning', 'Deep Learning', 'MLOps'],
    },
    {
      id: 'genai',
      n: '.06',
      name: 'GENERATIVE AI',
      tagline: 'Products built on top of LLMs and retrieval',
      domains: ['GenAI Engineering', 'LLMOps', 'Vector DBs & Retrieval', 'Production AI Systems'],
    },
  ];

  // Six region centers placed around a sphere for clean separation.
  // Tuned by hand to spread visually across the frame.
  const REGION_CENTERS = {
    foundations: [-46,  18, -10],
    storage:     [ -8, -28,  18],
    devops:      [ 50,  10,   4],
    data:        [-30,  34,  28],
    ml:          [ 24, -22, -28],
    genai:       [ 38,  32, -18],
  };

  // ── One region fully populated for the node-detail demo ───────────────────
  // Storage & Messaging → Databases → ACID transactions
  const FEATURED_CONCEPT = {
    id: 'db-acid',
    region: 'storage',
    domain: 'Databases',
    subdomain: 'Transactions & Concurrency',
    name: 'ACID transactions',
    tagline: 'Atomicity · Consistency · Isolation · Durability',
    short:
      'A contract a database offers: a group of operations either all happen, leave the database in a valid state, are isolated from other in-flight work, and survive a crash.',
    fields: [
      { id: 'why', kind: 'WHY IT MATTERS', n: '.01',
        body: 'Without ACID, money disappears between accounts. It is what lets you reason about a database as a single mind.' },
      { id: 'model', kind: 'MENTAL MODEL', n: '.02',
        body: 'A sealed envelope. Opens. Mutates state in private. Commits whole, or is discarded entirely.' },
      { id: 'trade', kind: 'TRADEOFF', n: '.03',
        body: 'Stronger isolation costs throughput. Pick the weakest level that still holds your invariants.' },
      { id: 'fail', kind: 'FAILS AS', n: '.04',
        body: 'Lost updates · write skew · phantom reads · deadlocks · long-running transactions blocking the world.' },
      { id: 'metric', kind: 'WATCH', n: '.05',
        body: 'Transaction rate · abort rate · lock-wait p99 · deadlock count · longest open transaction.' },
    ],
    related: ['Two-phase commit', 'MVCC', 'Isolation levels', 'CAP theorem', 'Sagas'],
  };

  // ── Plausible subdomain/concept counts per domain for particle density ────
  // (Real data exists for flagship domains; we use these counts to render
  // a believable cloud without needing the full graph in this demo.)
  function densityFor(domainName) {
    const flagships = new Set([
      'System Design', 'Distributed Systems', 'Databases', 'Caching',
      'Messaging & Event-Driven', 'Cloud Computing', 'Kubernetes',
      'CI/CD', 'Observability', 'Data Engineering', 'Streaming Systems',
      'Lakes & Lakehouses', 'Machine Learning', 'MLOps', 'GenAI Engineering',
      'LLMOps', 'Vector DBs & Retrieval', 'Production AI Systems', 'DevOps',
    ]);
    return flagships.has(domainName) ? 1.0 : 0.55;
  }

  return { REGIONS, REGION_CENTERS, FEATURED_CONCEPT, densityFor };
})();
