import type { GNode, Mode } from '../data/schema';
import type { failureModes } from '../data/failureModes';
import type { metrics } from '../data/metrics';
import type { patterns } from '../data/patterns';
import type { tools } from '../data/tools';

// Returns the set of node ids that should be visually emphasised under a given mode.
// Anything outside this set is dimmed in the scene.
export function emphasizedIds(args: {
  mode: Mode;
  allNodes: GNode[];
  activePathNodeIds?: string[];
  activeProjectNodeIds?: string[];
  activeTradeoffNodeIds?: string[];
  failureModeIds?: string[];
  metricIds?: string[];
  patternIds?: string[];
  toolIds?: string[];
}): Set<string> | null {
  const {
    mode,
    activePathNodeIds,
    activeProjectNodeIds,
    activeTradeoffNodeIds,
    failureModeIds,
    metricIds,
    patternIds,
    toolIds,
  } = args;

  switch (mode) {
    case 'galaxy':
      return null;
    case 'learning-path':
      return activePathNodeIds ? new Set(activePathNodeIds) : null;
    case 'project':
      return activeProjectNodeIds ? new Set(activeProjectNodeIds) : null;
    case 'tradeoff':
      return activeTradeoffNodeIds ? new Set(activeTradeoffNodeIds) : null;
    case 'failure-mode':
      return failureModeIds ? new Set(failureModeIds) : null;
    case 'metric':
      return metricIds ? new Set(metricIds) : null;
    case 'pattern':
      return patternIds ? new Set(patternIds) : null;
    case 'tool':
      return toolIds ? new Set(toolIds) : null;
  }
}
