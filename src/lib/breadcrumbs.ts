import type { GNode } from '../data/schema';

export function breadcrumbs(nodes: Map<string, GNode>, id: string): GNode[] {
  const chain: GNode[] = [];
  let cur: GNode | undefined = nodes.get(id);
  let safety = 0;
  while (cur && safety++ < 16) {
    chain.unshift(cur);
    if (!cur.parentId) break;
    cur = nodes.get(cur.parentId);
  }
  return chain;
}
