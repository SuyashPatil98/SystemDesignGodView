import Fuse from 'fuse.js';
import type { GNode } from '../data/schema';

export function buildSearchIndex(nodes: GNode[]) {
  return new Fuse(nodes, {
    keys: [
      { name: 'name', weight: 3 },
      { name: 'tags', weight: 1.5 },
      { name: 'shortExplanation', weight: 1 },
      { name: 'whyItMatters', weight: 0.6 },
    ],
    threshold: 0.32,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
}

export type SearchIndex = ReturnType<typeof buildSearchIndex>;
