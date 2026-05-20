import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGraphStore } from '../store/useGraphStore';
import type { Domain } from '../data/schema';
import type { Positioned } from './layout';

interface Props {
  domains: Domain[];
  layout: Map<string, Positioned>;
}

// Watches the orbit target every ~300 ms and publishes the nearest domain id
// to the store, which feeds the "You are here" chip at the top of the screen.
//
// We use the OrbitControls target (what the camera is looking at) rather than
// the camera position, because looking-at is what the user cares about.
export default function NearestDomainTracker({ domains, layout }: Props) {
  const { controls } = useThree() as any;
  const setNearestDomain = useGraphStore((s) => s.setNearestDomain);
  const last = useRef(0);

  useFrame(({ camera }) => {
    const now = performance.now();
    if (now - last.current < 300) return;
    last.current = now;

    const ctrl = controls;
    const focus =
      ctrl && ctrl.target
        ? ctrl.target
        : camera.position; // fallback before controls mount

    let bestId: string | null = null;
    let best = Infinity;
    for (const d of domains) {
      const p = layout.get(d.id)?.position;
      if (!p) continue;
      const dx = p.x - focus.x;
      const dy = p.y - focus.y;
      const dz = p.z - focus.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < best) {
        best = d2;
        bestId = d.id;
      }
    }
    setNearestDomain(bestId);
  });

  return null;
}
