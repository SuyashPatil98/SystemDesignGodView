import type { GNode, GEdge } from '../data/schema';

// Compute the visible-node set for "focus mode":
//   - the focused node
//   - all of its ancestors (so the trunk stays visible)
//   - all of its descendants (the subtree)
//   - 1-hop cross-edge neighbours of nodes in the subtree (so connections off
//     the trunk are still readable)
export function focusSubtreeIds(args: {
  focusedId: string;
  nodes: GNode[];
  edges: GEdge[];
}): Set<string> {
  const { focusedId, nodes, edges } = args;
  const byId = new Map<string, GNode>(nodes.map((n) => [n.id, n]));
  if (!byId.has(focusedId)) return new Set();

  // Build a children map from parentId.
  const children = new Map<string, string[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const arr = children.get(n.parentId) ?? [];
    arr.push(n.id);
    children.set(n.parentId, arr);
  }

  // Ancestors.
  const ancestors = new Set<string>();
  let cur: string | undefined = focusedId;
  let safety = 0;
  while (cur && safety++ < 16) {
    ancestors.add(cur);
    cur = byId.get(cur)?.parentId;
  }

  // Descendants via BFS.
  const subtree = new Set<string>([focusedId]);
  const queue: string[] = [focusedId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const kids = children.get(id) ?? [];
    for (const k of kids) {
      if (!subtree.has(k)) {
        subtree.add(k);
        queue.push(k);
      }
    }
  }

  // Combined membership.
  const visible = new Set<string>([...ancestors, ...subtree]);

  // 1-hop cross-edge neighbours of subtree members.
  for (const e of edges) {
    if (e.kind === 'parent') continue;
    if (subtree.has(e.source) && !visible.has(e.target)) {
      visible.add(e.target);
    } else if (subtree.has(e.target) && !visible.has(e.source)) {
      visible.add(e.source);
    }
  }

  return visible;
}
