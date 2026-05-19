import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ChevronRight, Boxes, Network, Sparkles } from 'lucide-react';
import GlassPanel from './primitives/GlassPanel';
import Chip from './primitives/Chip';
import { useGraphStore } from '../store/useGraphStore';
import type { GNode, LearningPath, ProjectIdea, Tradeoff } from '../data/schema';

interface Props {
  paths: LearningPath[];
  projects: ProjectIdea[];
  tradeoffs: Tradeoff[];
  nodes: Map<string, GNode>;
  onSelect: (id: string) => void;
}

export default function ModeOverlay({ paths, projects, tradeoffs, nodes, onSelect }: Props) {
  const mode = useGraphStore((s) => s.mode);
  const activePathId = useGraphStore((s) => s.activePathId);
  const activeProjectId = useGraphStore((s) => s.activeProjectId);
  const activeTradeoffId = useGraphStore((s) => s.activeTradeoffId);
  const setActivePath = useGraphStore((s) => s.setActivePath);
  const setActiveProject = useGraphStore((s) => s.setActiveProject);
  const setActiveTradeoff = useGraphStore((s) => s.setActiveTradeoff);

  const activePath = useMemo(
    () => paths.find((p) => p.id === activePathId) ?? null,
    [paths, activePathId],
  );
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );
  const activeTradeoff = useMemo(
    () => tradeoffs.find((t) => t.id === activeTradeoffId) ?? null,
    [tradeoffs, activeTradeoffId],
  );

  const visible =
    (mode === 'learning-path' && activePath) ||
    (mode === 'project' && activeProject) ||
    (mode === 'tradeoff' && activeTradeoff);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto absolute bottom-5 left-1/2 z-10 w-[min(960px,82vw)] -translate-x-1/2"
        >
          <GlassPanel className="px-5 py-4">
            {mode === 'learning-path' && activePath && (
              <PathOverlay
                path={activePath}
                nodes={nodes}
                onSelect={onSelect}
                onClose={() => setActivePath(null)}
              />
            )}
            {mode === 'project' && activeProject && (
              <ProjectOverlay
                project={activeProject}
                nodes={nodes}
                onSelect={onSelect}
                onClose={() => setActiveProject(null)}
              />
            )}
            {mode === 'tradeoff' && activeTradeoff && (
              <TradeoffOverlay
                tradeoff={activeTradeoff}
                onClose={() => setActiveTradeoff(null)}
              />
            )}
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white"
    >
      <X size={16} />
    </button>
  );
}

function PathOverlay({
  path,
  nodes,
  onSelect,
  onClose,
}: {
  path: LearningPath;
  nodes: Map<string, GNode>;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-violet-300">
            <Sparkles size={12} /> Learning path
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">{path.name}</h3>
          <p className="mt-1 max-w-3xl text-[12px] text-slate-400">{path.description}</p>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {path.nodeIds.map((id, i) => {
          const n = nodes.get(id);
          if (!n) return null;
          return (
            <div key={id} className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => onSelect(id)}
                className="group flex w-[180px] flex-col rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left hover:border-violet-300/40 hover:bg-violet-500/[0.06]"
              >
                <div className="text-[10px] font-mono text-slate-500">
                  Step {String(i + 1).padStart(2, '0')}
                </div>
                <div className="mt-0.5 truncate text-[13px] font-medium text-slate-100 group-hover:text-violet-100">
                  {n.name}
                </div>
                <div className="mt-1 truncate text-[10px] text-slate-500 capitalize">
                  {n.difficulty} · {n.kind}
                </div>
              </button>
              {i < path.nodeIds.length - 1 && (
                <ArrowRight size={14} className="text-slate-600" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectOverlay({
  project,
  nodes,
  onSelect,
  onClose,
}: {
  project: ProjectIdea;
  nodes: Map<string, GNode>;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-emerald-300">
            <Boxes size={12} /> Project · {project.difficulty}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">{project.name}</h3>
          <p className="mt-1 max-w-3xl text-[12px] text-slate-300">{project.oneLiner}</p>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Column title="Architecture components" items={project.components} />
        <Column title="Tools" items={project.tools} tone="emerald" />
        <Column title="Extensions" items={project.extensions} tone="violet" />
        <Column title="Design questions" items={project.designQuestions} tone="rose" italic />
      </div>

      <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-500/[0.04] p-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
          Why this is not generic
        </div>
        <p className="text-[12px] text-slate-200">{project.whyNonGeneric}</p>
        <div className="mt-2 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-200">Resume value:</span> {project.resumeValue}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.conceptIds.map((id) => {
          const n = nodes.get(id);
          if (!n) return null;
          return (
            <Chip key={id} tone="cyan" onClick={() => onSelect(id)}>
              {n.name}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

function Column({
  title,
  items,
  tone = 'cyan',
  italic = false,
}: {
  title: string;
  items: string[];
  tone?: 'cyan' | 'emerald' | 'violet' | 'rose';
  italic?: boolean;
}) {
  const accent: Record<string, string> = {
    cyan: 'text-cyan-300',
    emerald: 'text-emerald-300',
    violet: 'text-violet-300',
    rose: 'text-rose-300',
  };
  return (
    <div>
      <div className={`text-[10px] font-semibold uppercase tracking-wider ${accent[tone]}`}>{title}</div>
      <ul className="mt-1 space-y-1">
        {items.map((it, i) => (
          <li
            key={i}
            className={`flex gap-1.5 text-[12px] text-slate-300 ${italic ? 'italic' : ''}`}
          >
            <ChevronRight size={11} className={`mt-1 shrink-0 ${accent[tone]}/60`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TradeoffOverlay({
  tradeoff,
  onClose,
}: {
  tradeoff: Tradeoff;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-rose-300">
            <Network size={12} /> Tradeoff
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">{tradeoff.name}</h3>
          <p className="mt-1 text-[12px] text-slate-400">{tradeoff.axis}</p>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      <div
        className="mt-4 grid gap-3"
        style={{ gridTemplateColumns: `repeat(${Math.min(tradeoff.options.length, 4)}, minmax(0, 1fr))` }}
      >
        {tradeoff.options.map((opt, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-[13px] font-semibold text-white">{opt.name}</div>
            <div className="mt-1 text-[11px] text-slate-400 italic">{opt.whenToUse}</div>
            <div className="mt-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                Pros
              </div>
              <ul className="mt-1 space-y-0.5 text-[11px] text-slate-300">
                {opt.pros.map((p, j) => (
                  <li key={j} className="list-disc pl-3 marker:text-emerald-300/60">{p}</li>
                ))}
              </ul>
            </div>
            <div className="mt-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-300">
                Cons
              </div>
              <ul className="mt-1 space-y-0.5 text-[11px] text-slate-300">
                {opt.cons.map((p, j) => (
                  <li key={j} className="list-disc pl-3 marker:text-rose-300/60">{p}</li>
                ))}
              </ul>
            </div>
            {opt.examples && opt.examples.length > 0 && (
              <div className="mt-2 text-[11px] text-slate-400">
                e.g. {opt.examples.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-lg border border-cyan-300/20 bg-cyan-500/[0.05] p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
            Interview framing
          </div>
          <p className="text-[12px] text-slate-200">{tradeoff.interviewFraming}</p>
        </div>
        <div className="rounded-lg border border-violet-300/20 bg-violet-500/[0.05] p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
            Production framing
          </div>
          <p className="text-[12px] text-slate-200">{tradeoff.productionFraming}</p>
        </div>
      </div>
    </div>
  );
}
