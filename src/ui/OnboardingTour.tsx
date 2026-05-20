import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, SkipForward } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import { computeClusterCentroids, getClusters } from '../three/layout';

// 8-second auto-tour on first ever visit. Camera glides through each of the
// six super-clusters via the existing focus-tween system, while a chip at the
// top centre names the cluster being visited. Skippable by clicking anywhere
// or pressing any key.
//
// We use localStorage to remember that the user has seen it.

const LS_KEY = 'tg.tour.v1';
const PER_STOP_MS = 1400; // 800 ms tween + 600 ms rest

export default function OnboardingTour() {
  const setFocus = useGraphStore((s) => s.setFocus);
  const markInteracted = useGraphStore((s) => s.markInteracted);
  const [active, setActive] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) !== '1';
    } catch {
      return false;
    }
  });
  const [stopIndex, setStopIndex] = useState(0);

  useEffect(() => {
    if (!active) return;

    const centroids = computeClusterCentroids();
    const clusters = getClusters();
    let cancelled = false;
    let timer: number | null = null;

    const finish = () => {
      if (cancelled) return;
      cancelled = true;
      try {
        localStorage.setItem(LS_KEY, '1');
      } catch {}
      setActive(false);
      // Return camera home gently.
      setFocus([0, 0, 0]);
    };

    const visit = (i: number) => {
      if (cancelled) return;
      if (i >= centroids.length) {
        finish();
        return;
      }
      setStopIndex(i);
      const c = centroids[i];
      setFocus([c.position.x, c.position.y, c.position.z]);
      timer = window.setTimeout(() => visit(i + 1), PER_STOP_MS);
    };

    visit(0);

    const onSkip = () => finish();
    window.addEventListener('keydown', onSkip);
    window.addEventListener('pointerdown', onSkip);

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener('keydown', onSkip);
      window.removeEventListener('pointerdown', onSkip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const centroids = computeClusterCentroids();
  const clusters = getClusters();
  const currentCluster = clusters[stopIndex];
  const currentColor = centroids[stopIndex]?.color ?? '#22d3ee';

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Top centre: cluster currently being visited */}
          <motion.div
            key="tour-chip"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-none absolute left-1/2 top-[80px] z-30 -translate-x-1/2"
          >
            <div
              className="flex items-center gap-2 rounded-full border bg-ink-900/85 px-4 py-2 text-[12px] font-semibold backdrop-blur shadow-2xl"
              style={{
                borderColor: currentColor + '55',
                color: currentColor,
                textShadow: `0 0 10px ${currentColor}55`,
              }}
            >
              <Compass size={13} />
              <span className="opacity-70 text-[10px] uppercase tracking-[0.22em]">
                Touring {stopIndex + 1}/{centroids.length}
              </span>
              <span className="text-white">{currentCluster?.name}</span>
            </div>
          </motion.div>

          {/* Bottom centre: skip prompt */}
          <motion.div
            key="tour-skip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute bottom-12 left-1/2 z-30 -translate-x-1/2 flex items-center gap-2 text-[11px] text-slate-400"
          >
            <SkipForward size={11} />
            <span>Click anywhere or press any key to skip</span>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
