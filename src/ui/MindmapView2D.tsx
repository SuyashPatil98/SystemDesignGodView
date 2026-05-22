import { useMemo } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import {
  getClusters,
  electricColorForCluster,
  electricColorForDomain,
} from '../three/layout';
import type { GNode, Domain } from '../data/schema';
import { X } from 'lucide-react';

interface Props {
  domains: Domain[];
  nodes: GNode[];
  onPick: (id: string) => void;
}

// A flat 2D projection of the mindmap that floats over the galaxy.
// Six cluster columns, each holding its domains and the subdomains
// underneath, in the cluster's electric hue. Click any node to fly
// the camera there and close the panel.
export default function MindmapView2D({ domains, nodes, onPick }: Props) {
  const open = useGraphStore((s) => s.mindmap2DOpen);
  const setOpen = useGraphStore((s) => s.setMindmap2DOpen);
  const conquered = useGraphStore((s) => s.conquered);

  const grouped = useMemo(() => {
    const clusters = getClusters();
    // domainId → subdomain list
    const subsByDomain = new Map<string, GNode[]>();
    for (const n of nodes) {
      if (n.kind !== 'subdomain') continue;
      const arr = subsByDomain.get(n.domainId) ?? [];
      arr.push(n);
      subsByDomain.set(n.domainId, arr);
    }
    return clusters.map((c) => {
      const inCluster = c.domainIds
        .map((id) => domains.find((d) => d.id === id))
        .filter((d): d is Domain => !!d);
      return {
        id: c.id,
        name: c.name,
        color: electricColorForCluster(c.id, 0.95, 0.65).getStyle(),
        domains: inCluster.map((d) => ({
          id: d.id,
          name: d.name,
          color: electricColorForDomain(d.id, 0.92, 0.66).getStyle(),
          subs: subsByDomain.get(d.id) ?? [],
        })),
      };
    });
  }, [domains, nodes]);

  if (!open) return null;

  const handlePick = (id: string) => {
    onPick(id);
    setOpen(false);
  };

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)',
        animation: 'mindmap2d-fade 220ms ease-out',
      }}
      onClick={(e) => {
        // Click on backdrop closes; clicks inside the card don't bubble.
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <style>{`
        @keyframes mindmap2d-fade { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      <div
        className="relative flex flex-col"
        style={{
          width: 'min(1200px, 94vw)',
          maxHeight: '90vh',
          background: 'rgba(8,10,12,0.92)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 0 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-baseline justify-between gap-4 px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-baseline gap-3">
            <span
              className="font-mono uppercase"
              style={{
                fontSize: 9,
                letterSpacing: '0.28em',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              .09
            </span>
            <span
              className="font-mono uppercase"
              style={{
                fontSize: 11,
                letterSpacing: '0.32em',
                color: 'var(--mint)',
              }}
            >
              2D Map
            </span>
            <span
              className="font-serif italic"
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.4)',
                marginLeft: 8,
              }}
            >
              the whole atlas at a glance
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close 2D map"
            className="flex items-center justify-center transition-colors"
            style={{
              width: 32,
              height: 32,
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')
            }
          >
            <X size={14} />
          </button>
        </div>

        {/* Body — cluster columns */}
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: 'calc(90vh - 64px)' }}
        >
          <div
            className="grid gap-x-8 gap-y-6"
            style={{
              gridTemplateColumns:
                'repeat(auto-fit, minmax(260px, 1fr))',
            }}
          >
            {grouped.map((cluster) => (
              <div key={cluster.id} className="flex flex-col gap-3">
                <div
                  className="flex items-baseline gap-2 pb-1.5"
                  style={{
                    borderBottom: `1px solid ${cluster.color}`,
                  }}
                >
                  <span
                    className="font-mono uppercase"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.3em',
                      color: cluster.color,
                      textShadow: `0 0 12px ${cluster.color}66`,
                    }}
                  >
                    {cluster.name}
                  </span>
                </div>

                {cluster.domains.map((d) => (
                  <div key={d.id} className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handlePick(d.id)}
                      className="flex items-baseline gap-2 text-left transition-colors"
                      style={{
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '2px 0',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = '#fff')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: d.color,
                          boxShadow: `0 0 8px ${d.color}`,
                          alignSelf: 'center',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        className="font-sans"
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.92)',
                          letterSpacing: '0.005em',
                        }}
                      >
                        {d.name}
                      </span>
                    </button>
                    {d.subs.length > 0 && (
                      <div className="flex flex-col gap-0.5 pl-3.5">
                        {d.subs.map((sub) => {
                          const isConq = conquered.has(sub.id);
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handlePick(sub.id)}
                              className="text-left transition-colors"
                              style={{
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 400,
                                color: isConq
                                  ? 'rgba(255,255,255,0.45)'
                                  : 'rgba(255,255,255,0.7)',
                                textDecoration: isConq
                                  ? 'line-through'
                                  : 'none',
                                textDecorationColor: d.color,
                                padding: '1px 0',
                                letterSpacing: '0.01em',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color = d.color)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = isConq
                                  ? 'rgba(255,255,255,0.45)'
                                  : 'rgba(255,255,255,0.7)')
                              }
                            >
                              {sub.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div
            className="mt-7 pt-4 font-mono uppercase"
            style={{
              fontSize: 9,
              letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.32)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            Click any node to fly the camera there
            <span style={{ color: 'var(--mint-dim)', margin: '0 8px' }}>·</span>
            ESC / × to close
          </div>
        </div>
      </div>
    </div>
  );
}
