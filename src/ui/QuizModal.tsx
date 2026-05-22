import { useEffect, useMemo, useState } from 'react';
import { X, Sparkles, Check, SkipForward, Eye, RotateCw, Crown } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import type { GNode, Domain } from '../data/schema';

interface Props {
  nodes: GNode[];
  domains: Domain[];
}

interface Card {
  nodeId: string;
  nodeName: string;
  question: string;
  answer: string;
}

const DECK_SIZE = 10;
const ACCENT = 'var(--mint)';
const ACCENT_DIM = 'var(--mint-dim)';

function makeCard(n: GNode): Card | null {
  const variants: { q: string; a: string | undefined }[] = [
    { q: `Why does ${n.name} matter?`, a: n.whyItMatters },
    { q: `What problem does ${n.name} solve?`, a: n.problemSolved },
    {
      q: `Name a key tradeoff of ${n.name}.`,
      a: n.tradeoffs && n.tradeoffs.length > 0 ? n.tradeoffs.join(' • ') : undefined,
    },
    {
      q: `Name a failure mode of ${n.name}.`,
      a:
        n.failureModes && n.failureModes.length > 0
          ? n.failureModes.join(' • ')
          : undefined,
    },
    {
      q: `What metrics matter for ${n.name}?`,
      a:
        n.metricsToMonitor && n.metricsToMonitor.length > 0
          ? n.metricsToMonitor.join(' • ')
          : undefined,
    },
    {
      q: `Where does ${n.name} appear in real systems?`,
      a:
        n.whereItAppears && n.whereItAppears.length > 0
          ? n.whereItAppears.join(' • ')
          : undefined,
    },
    { q: `Explain ${n.name} in one sentence.`, a: n.shortExplanation },
  ];
  const usable = variants.filter((v) => v.a && v.a.length > 8);
  if (usable.length === 0) return null;
  const pick = usable[Math.floor(Math.random() * usable.length)];
  return {
    nodeId: n.id,
    nodeName: n.name,
    question: pick.q,
    answer: pick.a!,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizModal({ nodes, domains }: Props) {
  const quizOpen = useGraphStore((s) => s.quizOpen);
  const quizDomainId = useGraphStore((s) => s.quizDomainId);
  const closeQuiz = useGraphStore((s) => s.closeQuiz);
  const openQuiz = useGraphStore((s) => s.openQuiz);
  const conquer = useGraphStore((s) => s.conquer);
  const conquered = useGraphStore((s) => s.conquered);

  const [deck, setDeck] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [got, setGot] = useState(0);

  // Fade-in/out via CSS.
  const [mounted, setMounted] = useState(quizOpen);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (quizOpen) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [quizOpen, mounted]);

  // Rebuild deck when opened or domain changes.
  useEffect(() => {
    if (!quizOpen) return;
    const pool = nodes.filter((n) => {
      if (n.kind === 'domain') return false;
      if (quizDomainId && n.domainId !== quizDomainId) return false;
      return true;
    });
    const cards: Card[] = [];
    for (const n of shuffle(pool)) {
      if (cards.length >= DECK_SIZE) break;
      const c = makeCard(n);
      if (c) cards.push(c);
    }
    setDeck(cards);
    setIndex(0);
    setRevealed(false);
    setGot(0);
  }, [quizOpen, quizDomainId, nodes]);

  const current = deck[index] ?? null;
  const done = deck.length > 0 && index >= deck.length;

  if (!mounted) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-8"
      style={{
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeQuiz();
      }}
    >
      <div
        className="flex h-full max-h-[80vh] w-full max-w-[680px] flex-col bg-black"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="flex items-center gap-2 font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: '0.28em',
              color: ACCENT,
            }}
          >
            <Sparkles size={12} /> Quiz
            {quizDomainId && (
              <span
                className="font-serif italic normal-case tracking-normal text-white/55"
                style={{ fontSize: 13, marginLeft: 4 }}
              >
                · {domains.find((d) => d.id === quizDomainId)?.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div
              className="font-mono text-white/70"
              style={{ fontSize: 10, letterSpacing: '0.16em' }}
            >
              {Math.min(index + 1, deck.length || 1)} / {deck.length || 0}
            </div>
            <button
              onClick={closeQuiz}
              className="text-white/50 hover:text-white"
              style={{ background: 'transparent', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Domain picker */}
          {!quizDomainId && !current && (
            <div>
              <div
                className="font-mono uppercase"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                Pick a domain to quiz on
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {domains.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => openQuiz(d.id)}
                    className="px-3 py-2 text-left text-white/85 transition-colors"
                    style={{
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = ACCENT_DIM;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.1)';
                    }}
                  >
                    <span
                      className="mr-2 inline-block h-2 w-2 align-middle"
                      style={{
                        background: ACCENT,
                        boxShadow: `0 0 6px ${ACCENT}`,
                      }}
                    />
                    {d.name}
                  </button>
                ))}
                <button
                  onClick={() => openQuiz(null)}
                  className="col-span-2 sm:col-span-3 px-3 py-2 text-left font-mono uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.22em',
                    color: ACCENT,
                    border: `1px solid ${ACCENT_DIM}`,
                    background: 'rgba(94,234,183,0.06)',
                    cursor: 'pointer',
                  }}
                >
                  All domains — random mix
                </button>
              </div>
            </div>
          )}

          {/* Card */}
          {current && !done && (
            <div className="space-y-4">
              <div
                className="font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  color: ACCENT,
                }}
              >
                {current.nodeName}
              </div>
              <div
                className="font-serif text-white"
                style={{ fontSize: 26, lineHeight: 1.15 }}
              >
                {current.question}
              </div>
              <div
                className="p-4 transition-colors"
                style={{
                  border: revealed
                    ? `1px solid ${ACCENT_DIM}`
                    : '1px solid rgba(255,255,255,0.1)',
                  background: revealed
                    ? 'rgba(94,234,183,0.04)'
                    : 'transparent',
                  color: revealed
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(255,255,255,0.4)',
                  fontStyle: revealed ? 'normal' : 'italic',
                  fontSize: 13,
                  lineHeight: 1.55,
                  fontFamily: revealed ? undefined : "'Instrument Serif', serif",
                }}
              >
                {revealed
                  ? current.answer
                  : 'Tap "Show answer" to reveal.'}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {!revealed ? (
                  <ActionBtn
                    onClick={() => setRevealed(true)}
                    primary
                    icon={<Eye size={11} />}
                    label="Show answer"
                  />
                ) : (
                  <ActionBtn
                    onClick={() => {
                      conquer(current.nodeId);
                      setGot((g) => g + 1);
                      setIndex((i) => i + 1);
                      setRevealed(false);
                    }}
                    primary
                    icon={<Check size={11} />}
                    label="I knew it (+ mark conquered)"
                  />
                )}
                <ActionBtn
                  onClick={() => {
                    setIndex((i) => i + 1);
                    setRevealed(false);
                  }}
                  icon={<SkipForward size={11} />}
                  label="Skip"
                />
              </div>
              {conquered.has(current.nodeId) && (
                <div
                  className="inline-flex items-center gap-1.5 font-mono uppercase"
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.22em',
                    color: ACCENT,
                    border: `1px solid ${ACCENT_DIM}`,
                    padding: '2px 6px',
                  }}
                >
                  <Crown size={10} /> Already conquered
                </div>
              )}
            </div>
          )}

          {/* Done */}
          {done && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Sparkles size={28} style={{ color: ACCENT }} />
              <div
                className="mt-2 font-serif text-white"
                style={{ fontSize: 26 }}
              >
                Deck complete
              </div>
              <div
                className="mt-1 font-serif italic text-white/70"
                style={{ fontSize: 14 }}
              >
                You got{' '}
                <span className="font-mono" style={{ color: ACCENT }}>
                  {got}
                </span>{' '}
                / <span className="font-mono">{deck.length}</span>.
              </div>
              <div className="mt-4 flex gap-2">
                <ActionBtn
                  onClick={() => openQuiz(quizDomainId)}
                  primary
                  icon={<RotateCw size={11} />}
                  label="New deck"
                />
                <ActionBtn
                  onClick={() => openQuiz(null)}
                  label="Pick another domain"
                />
                <ActionBtn onClick={closeQuiz} label="Close" />
              </div>
            </div>
          )}

          {/* No cards */}
          {!current && quizDomainId && deck.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-white/55">
              <div
                className="font-serif italic"
                style={{ fontSize: 14 }}
              >
                No quiz-ready content in this domain yet.
              </div>
              <button
                onClick={() => openQuiz(null)}
                className="mt-3 px-3 py-1.5 font-mono uppercase"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  color: 'rgba(255,255,255,0.65)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Pick another domain
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  primary,
  icon,
  label,
}: {
  onClick: () => void;
  primary?: boolean;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 font-mono uppercase transition-colors"
      style={{
        fontSize: 9,
        letterSpacing: '0.22em',
        padding: '7px 11px',
        border: `1px solid ${primary ? ACCENT : 'rgba(255,255,255,0.18)'}`,
        color: primary ? ACCENT : 'rgba(255,255,255,0.6)',
        background: primary ? 'rgba(94,234,183,0.06)' : 'transparent',
        cursor: 'pointer',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
