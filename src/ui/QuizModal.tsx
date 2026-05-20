import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, SkipForward, Eye, RotateCw, Crown } from 'lucide-react';
import GlassPanel from './primitives/GlassPanel';
import Chip from './primitives/Chip';
import { useGraphStore } from '../store/useGraphStore';
import type { GNode, Domain } from '../data/schema';
import { domainColor } from '../three/layout';

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

// Generate a flashcard question from a node's structured content. Pick the
// richest field available.
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
      a: n.failureModes && n.failureModes.length > 0 ? n.failureModes.join(' • ') : undefined,
    },
    {
      q: `What metrics matter for ${n.name}?`,
      a: n.metricsToMonitor && n.metricsToMonitor.length > 0 ? n.metricsToMonitor.join(' • ') : undefined,
    },
    {
      q: `Where does ${n.name} appear in real systems?`,
      a: n.whereItAppears && n.whereItAppears.length > 0 ? n.whereItAppears.join(' • ') : undefined,
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

  // Rebuild deck whenever the quiz opens or the domain changes.
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

  const colorForCard = useMemo(() => {
    if (!current) return '#22d3ee';
    const node = nodes.find((n) => n.id === current.nodeId);
    return node ? domainColor(node.domainId) : '#22d3ee';
  }, [current, nodes]);

  return (
    <AnimatePresence>
      {quizOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-8 bg-black/65 backdrop-blur"
          onClick={(e) => {
            // Close on backdrop click only.
            if (e.target === e.currentTarget) closeQuiz();
          }}
        >
          <GlassPanel className="flex h-full max-h-[80vh] w-full max-w-[680px] flex-col">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-300">
                <Sparkles size={14} /> Quiz
                {quizDomainId && (
                  <span className="text-slate-400 normal-case tracking-normal text-[12px]">
                    · {domains.find((d) => d.id === quizDomainId)?.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-[11px] text-slate-300">
                  {Math.min(index + 1, deck.length || 1)} / {deck.length || 0}
                </div>
                <button
                  onClick={closeQuiz}
                  className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Domain picker — visible when no domain chosen */}
              {!quizDomainId && !current && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Pick a domain to quiz on
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {domains.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => openQuiz(d.id)}
                        className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-[12px] text-slate-200 hover:border-violet-300/40 hover:bg-violet-500/[0.06]"
                      >
                        <span
                          className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                          style={{ background: domainColor(d.id), boxShadow: `0 0 6px ${domainColor(d.id)}` }}
                        />
                        {d.name}
                      </button>
                    ))}
                    <button
                      onClick={() => openQuiz(null)}
                      className="col-span-2 sm:col-span-3 rounded-md border border-violet-300/40 bg-violet-500/[0.08] px-3 py-2 text-left text-[12px] text-violet-100 hover:bg-violet-500/[0.15]"
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
                    className="text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: colorForCard }}
                  >
                    {current.nodeName}
                  </div>
                  <div className="text-xl font-semibold leading-snug text-white">
                    {current.question}
                  </div>
                  <div
                    className={`rounded-lg border bg-white/[0.02] p-4 text-[13px] leading-relaxed transition ${
                      revealed
                        ? 'border-emerald-300/30 text-slate-100'
                        : 'border-white/10 text-slate-500 italic'
                    }`}
                  >
                    {revealed ? current.answer : 'Tap "Show answer" to reveal.'}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {!revealed ? (
                      <button
                        onClick={() => setRevealed(true)}
                        className="flex items-center gap-1.5 rounded-md border border-cyan-300/30 bg-cyan-500/[0.06] px-3 py-1.5 text-[12px] font-semibold text-cyan-100 hover:bg-cyan-500/[0.12]"
                      >
                        <Eye size={12} /> Show answer
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          conquer(current.nodeId);
                          setGot((g) => g + 1);
                          setIndex((i) => i + 1);
                          setRevealed(false);
                        }}
                        className="flex items-center gap-1.5 rounded-md border border-emerald-300/40 bg-emerald-500/[0.1] px-3 py-1.5 text-[12px] font-semibold text-emerald-100 hover:bg-emerald-500/[0.18]"
                      >
                        <Check size={12} /> I knew it (+ mark conquered)
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIndex((i) => i + 1);
                        setRevealed(false);
                      }}
                      className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[12px] text-slate-300 hover:bg-white/5"
                    >
                      <SkipForward size={12} /> Skip
                    </button>
                  </div>
                  {conquered.has(current.nodeId) && (
                    <Chip tone="amber" active>
                      <Crown size={10} /> Already conquered
                    </Chip>
                  )}
                </div>
              )}

              {/* Done */}
              {done && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Sparkles size={28} className="text-violet-300" />
                  <div className="mt-2 text-lg font-semibold text-white">Deck complete</div>
                  <div className="mt-1 text-[13px] text-slate-300">
                    You got <span className="font-mono text-emerald-300">{got}</span> /{' '}
                    <span className="font-mono">{deck.length}</span>.
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openQuiz(quizDomainId)}
                      className="flex items-center gap-1.5 rounded-md border border-violet-300/40 bg-violet-500/[0.1] px-3 py-1.5 text-[12px] font-semibold text-violet-100 hover:bg-violet-500/[0.18]"
                    >
                      <RotateCw size={12} /> New deck
                    </button>
                    <button
                      onClick={() => openQuiz(null)}
                      className="rounded-md border border-white/10 px-3 py-1.5 text-[12px] text-slate-300 hover:bg-white/5"
                    >
                      Pick another domain
                    </button>
                    <button
                      onClick={closeQuiz}
                      className="rounded-md border border-white/10 px-3 py-1.5 text-[12px] text-slate-300 hover:bg-white/5"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* No cards available */}
              {!current && quizDomainId && deck.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center text-[13px] text-slate-400">
                  No quiz-ready content in this domain yet.
                  <button
                    onClick={() => openQuiz(null)}
                    className="mt-3 rounded-md border border-white/10 px-3 py-1.5 text-[12px] text-slate-300 hover:bg-white/5"
                  >
                    Pick another domain
                  </button>
                </div>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
