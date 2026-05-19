import { domainNode, subNode, conceptNode } from './_helpers';
import type { GNode } from '../schema';

const D = 'vector';

export const vectorNodes: GNode[] = [
  domainNode(
    D,
    'Vector DBs & Retrieval',
    'Storing and searching high-dimensional vectors via approximate-nearest-neighbor (ANN) indexes, often combined with classical search.',
    'RAG quality is upper-bounded by retrieval quality. Mastering ANN indexes, hybrid search, and reranking is what separates demos from products.',
    'A vector DB is a database whose primary index is geometric. Cosine similarity is the query language.',
  ),

  subNode(D, 'Engines', D, 'Vector databases and engines: Milvus, Pinecone, Qdrant, Weaviate, Chroma, OpenSearch, pgvector.', 'Engines differ in indexes, filtering, scale, and cost.', { id: 'vector-engines' }),
  subNode(D, 'Index types', D, 'HNSW, IVF, PQ, ScaNN, DiskANN.', 'Determines recall/latency/memory tradeoff at scale.', { id: 'vector-index-types' }),
  subNode(D, 'Retrieval strategies', D, 'Vector-only, hybrid (BM25 + vector), filtered, reranked.', 'Real-world retrieval is almost always hybrid + reranked.', { id: 'vector-retrieval' }),
  subNode(D, 'Evaluation', D, 'Precision@k, recall@k, MRR, NDCG.', 'You cannot improve what you don\'t measure.', { id: 'vector-eval' }),
  subNode(D, 'Operations', D, 'Reindexing, embedding versioning, scale.', 'Where retrieval systems silently degrade.', { id: 'vector-ops' }),

  conceptNode('vector-hnsw', 'HNSW', D, 'vector-index-types', 'Hierarchical Navigable Small World — graph-based ANN index.', {
    whyItMatters: 'Best recall/latency tradeoff for in-memory retrieval; default for most engines.',
    tradeoffs: ['Memory hungry; rebuild costs.'],
  }),
  conceptNode('vector-ivf', 'IVF (inverted file)', D, 'vector-index-types', 'Cluster vectors, search only nearest clusters.', {
    whyItMatters: 'Memory-efficient; tunable accuracy via nprobe.',
  }),
  conceptNode('vector-pq', 'Product Quantization', D, 'vector-index-types', 'Compress vectors into sub-quantized codes.', {
    whyItMatters: 'Massive memory savings — often combined with IVF (IVF-PQ).',
  }),
  conceptNode('vector-diskann', 'DiskANN', D, 'vector-index-types', 'Disk-resident graph index for billion-scale.', {
    whyItMatters: 'When data is too big for RAM; common in Pinecone, Milvus.',
  }),

  conceptNode('vector-hybrid', 'Hybrid search', D, 'vector-retrieval', 'Combine sparse (BM25) and dense (vector) scores.', {
    whyItMatters: 'Beats vector-only on most realistic corpora.',
    relatedIds: ['to-vector-keyword-hybrid'],
    interviewRelevance: 5,
  }),
  conceptNode('vector-reranking', 'Cross-encoder reranking', D, 'vector-retrieval', 'Use a heavier model to re-score top-k candidates with full pair attention.', {
    whyItMatters: 'Biggest single-step quality win in most RAG stacks.',
  }),
  conceptNode('vector-filters', 'Metadata filters', D, 'vector-retrieval', 'Pre- or post-filter on tenant, doc type, date.', {
    whyItMatters: 'Required for multi-tenant correctness and freshness.',
    tradeoffs: ['Pre-filter saves work but stresses index; post-filter is simpler but wastes effort.'],
  }),
  conceptNode('vector-chunking', 'Chunking', D, 'vector-retrieval', 'How documents are split into retrievable units.', {
    whyItMatters: 'Bad chunking destroys retrieval quality; semantic-aware chunks help.',
  }),

  conceptNode('vector-recall-at-k', 'Recall@k', D, 'vector-eval', 'Fraction of relevant documents in the top-k results.', {
    whyItMatters: 'Determines whether the answer is even retrievable.',
    relatedIds: ['metric-retrieval-precision'],
  }),
  conceptNode('vector-ndcg', 'NDCG', D, 'vector-eval', 'Rank-aware quality metric for ordered lists.', {
    whyItMatters: 'Captures ordering quality, not just inclusion.',
  }),
  conceptNode('vector-golden-set', 'Golden Q/A set', D, 'vector-eval', 'Hand-curated questions with known correct answers and sources.', {
    whyItMatters: 'The bedrock of retrieval evaluation; protects against silent regressions.',
  }),

  conceptNode('vector-reindex', 'Reindexing on embedding upgrade', D, 'vector-ops', 'Bumping the embedding model invalidates existing vectors.', {
    whyItMatters: 'Forgetting this destroys retrieval quality silently.',
    relatedIds: ['fm-embedding-drift'],
  }),
];
