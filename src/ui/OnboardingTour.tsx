import { useEffect, useState } from 'react';
import { Compass, SkipForward } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import { computeClusterCentroids, getClusters } from '../three/layout';

// 8-second auto-tour on first ever visit. Camera glides through each of the
// six super-clusters via the existing focus-tween system, while a chip at the
// top centre names the cluster being visited. Skippable by clicking anywhere
// or pressing any key. CSS-only fade — no framer-motion.

const LS_KEY = 'tg.tour.v1';
const PER_STOP_MS = 1400; // 800 ms tween + 600 ms rest
const ACCENT = 'var(--mint)';
const ACCENT_DIM = 'var(--mint-dim)';

export default function OnboardingTour() {
  const setFocus = useGraphStore((s) => s.setFocus);
  const [active, setActive] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) !== '1';
    } catch {
      return false;
    }
  });
  const [stopIndex, setStopIndex] = useState(0);

  // Two-step mount for CSS fade — when active becomes false we let the
  // transition finish before unmounting.
  const [mounted, setMounted] = useState(active);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (active) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [active, mounted]);

  useEffect(() => {
    if (!active) return;

    const centroids = computeClusterCentroids();
    let cancelled = false;
    let timer: number | null = null;

    const finish = () => {
      if (cancelled) return;
      cancelled = true;
      try {
        localStorage.setItem(LS_KEY, '1');
      } catch {}
      setActive(false);
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

  if (!mounted) return null;

  const centroids = computeClusterCentroids();
  const clusters = getClusters();
  const currentCluster = clusters[stopIndex];

  return (
    <>
      {/* Top centre */}
      <div
        className="pointer-events-none absolute left-1/2 top-[80px] z-30 -translate-x-1/2"
        style={{
          opacity: visible ? 1 : 0,
          transform: `translate(-50%, ${visible ? '0' : '-8px'})`,
          transition: 'opacity 200ms ease-out, transform 200ms ease-out',
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-2 font-mono uppercase backdrop-blur"
          style={{
            border: `1px solid ${ACCENT_DIM}`,
            background: 'rgba(0,0,0,0.85)',
            fontSize: 10,
            letterSpacing: '0.22em',
            color: ACCENT,
          }}
        >
          <Compass size={13} />
          <span className="text-white/70">
            Touring {stopIndex + 1}/{centroids.length}
          </span>
          <span
            className="text-white"
            style={{
              textShadow: `0 0 10px ${ACCENT_DIM}`,
              letterSpacing: '0.18em',
            }}
          >
            {currentCluster?.name}
          </span>
        </div>
      </div>

      {/* Bottom centre */}
      <div
        className="pointer-events-none absolute bottom-12 left-1/2 z-30 -translate-x-1/2 flex items-center gap-2 font-mono uppercase"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 200ms ease-out',
          fontSize: 9,
          letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        <SkipForward size={11} />
        <span>Click or press any key to skip</span>
      </div>
    </>
  );
}
